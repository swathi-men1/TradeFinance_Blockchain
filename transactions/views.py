from django.shortcuts import render,redirect
from .models import TradeTransaction
from django import forms
from ledger.models import Ledger
from django.contrib.auth.decorators import login_required
from users.utils import role_required


class TradeForm(forms.ModelForm):
    class Meta:
        model = TradeTransaction
        fields = ['buyer','seller','amount','status']


@login_required(login_url="/login/")
@role_required(["corporate"])
def create_trade(request):

    form = TradeForm(request.POST or None)

    if form.is_valid():
        form.save()
        return redirect('trade_list')

    return render(request, 'transactions/create_trade.html', {'form': form})


def trade_list(request):
    trades = TradeTransaction.objects.all().order_by('-created_at')
    return render(request,'transactions/trade_list.html',{'trades':trades})
