from django.urls import path
from .views import ledger_home

urlpatterns = [
    path('', ledger_home, name='ledger_home'),
]
