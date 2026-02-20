from django.urls import path
from .views import login_view, dashboard, logout_view, register_view, access_denied

urlpatterns = [
    path("register/", register_view, name="register"),
    path("login/", login_view, name="login"),
    path("dashboard/", dashboard, name="dashboard"),
    path("logout/", logout_view, name="logout"),
    path("access-denied/", access_denied, name="access_denied"),
]
