from django.shortcuts import render,redirect
from django.contrib.auth.decorators import login_required
from users.utils import role_required
from ledger.models import Ledger
from risk.models import RiskScore
from documents.models import Document
from django.contrib.auth.models import User
from users.models import Profile
from django.shortcuts import get_object_or_404
from django.contrib import messages
from transactions.models import TradeTransaction




@login_required(login_url="/login/")
@role_required(["admin"])
def system_dashboard(request):

    recent_ledger = Ledger.objects.select_related(
        "performed_by", "document"
    ).order_by("-timestamp")[:5]

    high_risk_users = RiskScore.objects.filter(
        category="HIGH"
    ).select_related("user")


    tampered_docs = Document.objects.filter(
        is_verified=False
    ).order_by("-uploaded_at")[:5]


    recent_trades = TradeTransaction.objects.select_related(
        "buyer", "seller"
    ).order_by("-created_at")[:5]

    context = {
        "recent_ledger": recent_ledger,
        "high_risk_users": high_risk_users,
        "tampered_docs": tampered_docs,
         "recent_trades": recent_trades,
    }

    return render(request, "system/sysdashboard.html", context)





@login_required(login_url="/login/")
@role_required(["admin"])
def pending_users(request):

    pending_profiles = Profile.objects.filter(is_approved=False)

    return render(
        request,
        "system/pendingusers.html",
        {"pending_profiles": pending_profiles},
    )


@login_required(login_url="/login/")
@role_required(["admin"])
def approve_user(request, user_id):

    user = get_object_or_404(User, id=user_id)
    profile = user.profile

    # ⭐ DO NOT CHANGE ROLE ANYMORE
    profile.is_approved = True
    profile.save()

    user.is_active = True
    user.save()

    messages.success(
        request,
        f"{user.username} approved as {profile.role}"
    )

    return redirect("pending_users")


@login_required(login_url="/login/")
@role_required(["admin"])
def all_users(request):

    profiles = Profile.objects.select_related("user").all().order_by("user__username")

    return render(
        request,
        "system/all_users.html",
        {"profiles": profiles},
    )

@login_required(login_url="/login/")
@role_required(["admin"])
def toggle_user_status(request, user_id):

    user = get_object_or_404(User, id=user_id)
    profile = user.profile

    # 🔄 Toggle active status
    if user.is_active:
        user.is_active = False
        profile.is_approved = False
        message = f"{user.username} has been disapproved."
    else:
        user.is_active = True
        profile.is_approved = True
        message = f"{user.username} has been approved."

    user.save()
    profile.save()

    messages.success(request, message)

    return redirect("all_users")
