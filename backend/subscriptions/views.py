from django.http import JsonResponse, HttpRequest
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.utils.dateparse import parse_datetime
import json
import os
import urllib.parse
import urllib.request
import urllib.error
from django.conf import settings

from .models import Plan, Subscription, Wallet
from django.db.models import Count


def _plan_to_dict(plan: Plan) -> dict:
    return {
        "id": plan.id,
        "name": plan.name,
        "description": plan.description,
        "price": str(plan.price),
        "duration": plan.duration_days,
        "currency": plan.currency,
        "features": plan.features,
        "isActive": plan.is_active,
    }


def _subscription_to_dict(sub: Subscription) -> dict:
    return {
        "id": sub.id,
        "planId": sub.plan_id,
        "planName": sub.plan.name,
        "startDate": sub.start_date.isoformat(),
        "endDate": sub.end_date.isoformat(),
        "status": sub.status,
        "txHash": sub.tx_hash,
        "price": str(sub.price),
        "currency": sub.currency,
        "wallet": sub.wallet_address,
    }


def _require_admin(request: HttpRequest) -> Wallet:
    # Allow Django superusers to pass without wallet check
    try:
        if getattr(request, "user", None) and request.user.is_authenticated and request.user.is_superuser:
            return Wallet(address="superuser", is_admin=True)  # unsaved sentinel
    except Exception:
        pass
    
    # Get wallet address from request
    if request.method == 'GET':
        payload = request.GET
    else:
        try:
            payload = json.loads(request.body or b"{}")
        except json.JSONDecodeError:
            payload = {}
    
    addr = (payload.get("wallet") or payload.get("address") or "").strip()
    if not addr:
        raise ValueError("wallet required")
    
    wallet = Wallet.objects.filter(address__iexact=addr).first()
    if not wallet or not wallet.is_admin:
        raise PermissionError("forbidden")
    return wallet


@require_http_methods(["GET"])
def list_plans(_request: HttpRequest) -> JsonResponse:
    plans = Plan.objects.filter(is_active=True).order_by("id")
    return JsonResponse([_plan_to_dict(p) for p in plans], safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def create_plan(request: HttpRequest) -> JsonResponse:
    try:
        _require_admin(request)
    except ValueError:
        return JsonResponse({"error": "wallet required"}, status=400)
    except PermissionError:
        return JsonResponse({"error": "forbidden"}, status=403)
    payload = json.loads(request.body or b"{}")
    plan = Plan.objects.create(
        name=payload.get("name", "Unnamed"),
        description=payload.get("description", ""),
        price=payload.get("price", 0),
        duration_days=payload.get("duration", 30),
        currency=payload.get("currency", "MATIC"),
        features=payload.get("features", []),
        is_active=payload.get("isActive", True),
    )
    return JsonResponse(_plan_to_dict(plan), status=201)


@csrf_exempt
@require_http_methods(["PATCH"])
def update_plan(request: HttpRequest, plan_id: int) -> JsonResponse:
    try:
        _require_admin(request)
    except ValueError:
        return JsonResponse({"error": "wallet required"}, status=400)
    except PermissionError:
        return JsonResponse({"error": "forbidden"}, status=403)
    payload = json.loads(request.body or b"{}")
    plan = Plan.objects.get(id=plan_id)
    for field, key in [
        ("name", "name"),
        ("description", "description"),
        ("price", "price"),
        ("duration_days", "duration"),
        ("currency", "currency"),
        ("features", "features"),
        ("is_active", "isActive"),
    ]:
        if key in payload:
            setattr(plan, field, payload[key])
    plan.save()
    return JsonResponse(_plan_to_dict(plan))


@require_http_methods(["GET"])
def list_subscriptions(request: HttpRequest) -> JsonResponse:
    wallet = request.GET.get("wallet")
    qs = Subscription.objects.all().select_related("plan").order_by("-id")
    if wallet:
        qs = qs.filter(wallet_address__iexact=wallet)
    return JsonResponse([_subscription_to_dict(s) for s in qs], safe=False)


@csrf_exempt
@require_http_methods(["POST"])
def create_subscription(request: HttpRequest) -> JsonResponse:
    payload = json.loads(request.body or b"{}")
    plan = Plan.objects.get(id=payload["planId"])  # let it error if missing
    start = parse_datetime(payload.get("startDate"))
    end = parse_datetime(payload.get("endDate"))
    sub = Subscription.objects.create(
        wallet_address=payload.get("wallet", ""),
        plan=plan,
        start_date=start,
        end_date=end,
        status=payload.get("status", "active"),
        tx_hash=payload.get("txHash", ""),
        price=payload.get("price", 0),
        currency=payload.get("currency", plan.currency),
    )
    return JsonResponse(_subscription_to_dict(sub), status=201)


@csrf_exempt
@require_http_methods(["POST"])
def cancel_subscription(request: HttpRequest, sub_id: int) -> JsonResponse:
    sub = Subscription.objects.get(id=sub_id)
    sub.status = "cancelled"
    sub.save(update_fields=["status"])
    return JsonResponse(_subscription_to_dict(sub))


@require_http_methods(["GET"])
def stats(_request: HttpRequest) -> JsonResponse:
    total_subs = Subscription.objects.count()
    # Distinct wallets that currently have at least one active subscription
    active_users = (
        Subscription.objects.filter(status="active")
        .values("wallet_address")
        .distinct()
        .count()
    )
    active_subs = Subscription.objects.filter(status="active").count()
    plans_count = Plan.objects.filter(is_active=True).count()
    return JsonResponse({
        "activeUsers": active_users,
        "subscriptions": total_subs,
        "activeSubscriptions": active_subs,
        "activePlans": plans_count,
    })


@csrf_exempt
@require_http_methods(["POST"])
def register_wallet(request: HttpRequest) -> JsonResponse:
    payload = json.loads(request.body or b"{}")
    addr = (payload.get("address") or "").strip()
    if not addr:
        return JsonResponse({"error": "address required"}, status=400)
    wallet, _ = Wallet.objects.get_or_create(address=addr)
    # Bootstrap: if no admin exists yet, promote the first registered wallet
    if not Wallet.objects.filter(is_admin=True).exists():
        if not wallet.is_admin:
            wallet.is_admin = True
            wallet.save(update_fields=["is_admin"])
    # If a Django superuser is making this request, promote the wallet
    try:
        if getattr(request, "user", None) and request.user.is_authenticated and request.user.is_superuser:
            if not wallet.is_admin:
                wallet.is_admin = True
                wallet.save(update_fields=["is_admin"])
    except Exception:
        pass
    return JsonResponse({"address": wallet.address, "isAdmin": wallet.is_admin, "createdAt": wallet.created_at.isoformat()})


@require_http_methods(["GET"])
def current_wallet(request: HttpRequest) -> JsonResponse:
    addr = (request.GET.get("address") or "").strip()
    if not addr:
        return JsonResponse({"error": "address required"}, status=400)
    w = Wallet.objects.filter(address__iexact=addr).first()
    return JsonResponse({"address": addr, "isAdmin": bool(w and w.is_admin)})

@require_http_methods(["GET"])
def youtube_search(request: HttpRequest) -> JsonResponse:
    """
    Server-side proxy for YouTube Data API search. Requires env YOUTUBE_API_KEY.
    Query params:
      - q: search term
      - pageToken: optional
      - maxResults: optional (default 20)
    """
    api_key = (settings.YOUTUBE_API_KEY or os.environ.get("YOUTUBE_API_KEY") or os.environ.get("VITE_YT_API_KEY") or "").strip()
    if not api_key:
        return JsonResponse({"error": {"message": "YOUTUBE_API_KEY not configured on server"}}, status=500)

    q = (request.GET.get("q") or "").strip() or "trending"
    page_token = (request.GET.get("pageToken") or "").strip()
    max_results = (request.GET.get("maxResults") or "20").strip()

    base_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "type": "video",
        "maxResults": max_results,
        "q": q,
        "key": api_key,
    }
    if page_token:
        params["pageToken"] = page_token

    url = f"{base_url}?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url) as resp:
            data = resp.read()
            try:
                payload = json.loads(data.decode("utf-8"))
            except Exception:
                payload = {}
            return JsonResponse(payload, status=resp.status, safe=False)
    except urllib.error.HTTPError as e:
        try:
            err_payload = json.loads(e.read().decode("utf-8"))
        except Exception:
            err_payload = {"error": {"message": str(e)}}
        return JsonResponse(err_payload, status=e.code)
    except Exception as e:
        return JsonResponse({"error": {"message": str(e)}}, status=502)
