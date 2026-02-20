from django.urls import path
from . import views

urlpatterns = [
    path('',views.trade_list,name='trade_list'),
    path('create/',views.create_trade,name='create_trade'),
]
