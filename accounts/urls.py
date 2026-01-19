from django.urls import path
from .views import RegisterView, MeView, AdminOnlyView
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns=[
    path('register/',RegisterView.as_view()),
    path('login/',TokenObtainPairView.as_view()),
    path('me/', MeView.as_view()),
    path('admin-only/',AdminOnlyView.as_view()),
]