"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from subscriptions import views as sub_views

urlpatterns = [
    path('admin/', admin.site.urls),
    # Plans
    path('api/plans', sub_views.list_plans, name='list_plans'),
    path('api/plans/', sub_views.list_plans),
    path('api/plans/create', sub_views.create_plan, name='create_plan'),
    path('api/plans/<int:plan_id>', sub_views.update_plan, name='update_plan'),
    # Subscriptions
    path('api/subscriptions', sub_views.list_subscriptions, name='list_subscriptions'),
    path('api/subscriptions/', sub_views.list_subscriptions),
    path('api/subscriptions/create', sub_views.create_subscription, name='create_subscription'),
    path('api/subscriptions/<int:sub_id>/cancel', sub_views.cancel_subscription, name='cancel_subscription'),
    # Stats
    path('api/stats', sub_views.stats, name='stats'),
    path('api/wallets/register', sub_views.register_wallet, name='register_wallet'),
    path('api/wallets/me', sub_views.current_wallet, name='current_wallet'),
    # YouTube proxy
    path('api/youtube/search', sub_views.youtube_search, name='youtube_search'),
]
