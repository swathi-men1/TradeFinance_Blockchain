from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from users.utils import role_required
from .models import RiskScore



@login_required(login_url="/login/")
@role_required(["corporate", "auditor", "bank"])
def risk_dashboard(request):

    role = request.user.profile.role

    if role == "corporate":
        risks = RiskScore.objects.filter(user=request.user)


    else:
        risks = RiskScore.objects.select_related("user").all()

    return render(
        request,
        "risk/home.html",
        {"risks": risks},
    )


