from django.urls import path
from .views import system_dashboard, pending_users, approve_user,all_users,toggle_user_status

urlpatterns = [
    path("", system_dashboard, name="system_dashboard"),
    path("pending/", pending_users, name="pending_users"),
    path("approve/<int:user_id>/", approve_user, name="approve_user"),
    path("users/", all_users, name="all_users"),
    path("toggle/<int:user_id>/", toggle_user_status, name="toggle_user"),

]
