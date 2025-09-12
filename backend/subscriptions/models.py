from django.db import models


class Plan(models.Model):
    CURRENCY_CHOICES = (
        ("MATIC", "MATIC"),
        ("USDC", "USDC"),
        ("ETH", "ETH"),
    )

    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=18, decimal_places=8)
    duration_days = models.PositiveIntegerField(default=30)
    currency = models.CharField(max_length=8, choices=CURRENCY_CHOICES, default="MATIC")
    features = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.name} ({self.price} {self.currency})"


class Subscription(models.Model):
    STATUS_CHOICES = (
        ("active", "active"),
        ("expired", "expired"),
        ("cancelled", "cancelled"),
    )

    # In a real app, relate to a User or wallet address
    wallet_address = models.CharField(max_length=64)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="subscriptions")
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="active")
    tx_hash = models.CharField(max_length=100, blank=True, default="")
    price = models.DecimalField(max_digits=36, decimal_places=18)
    currency = models.CharField(max_length=12)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"{self.wallet_address[:6]}... {self.plan.name} ({self.status})"


class Wallet(models.Model):
    address = models.CharField(max_length=64, unique=True)
    is_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return self.address
