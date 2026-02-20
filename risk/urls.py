from django.urls import path
from .views import risk_dashboard

urlpatterns = [
    path("", risk_dashboard, name="risk_dashboard"),
]
