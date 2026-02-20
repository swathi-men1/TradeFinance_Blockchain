from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from users.utils import role_required
from .models import Ledger


@login_required(login_url="/login/")
@role_required(["admin","bank","auditor"])
def ledger_home(request):
    entries = Ledger.objects.select_related(
        "document", "performed_by"
    ).order_by("-timestamp")

    return render(
        request,
        "ledger/home.html",
        {"entries": entries},
    )
