from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import Profile
from django.contrib.auth.models import User



def login_view(request):

    if request.method == "POST":

        username = request.POST.get("username")
        password = request.POST.get("password")

        if not User.objects.filter(username=username).exists():
            messages.error(
                request,
                "No record found. If you're new, please register first."
            )
            return redirect("login")

        user = authenticate(request, username=username, password=password)

        if user is None:
            messages.error(request, "Invalid credentials")
            return redirect("login")


        profile, created = Profile.objects.get_or_create(user=user)

        if not profile.is_approved:
            messages.error(
                request,
                "Your account is pending admin approval."
            )
            return redirect("login")

        login(request, user)

        role = profile.role.lower()

        if role == "admin":
            return redirect("system_dashboard")

        return redirect("home")


    return render(request, "users/login.html")


@login_required(login_url="/login/")
def dashboard(request):

    profile, created = Profile.objects.get_or_create(user=request.user)

    return render(
        request,
        "users/dashboard.html",
        {
            "role": profile.role,
            "corporate_type": profile.corporate_type
        }
    )



def logout_view(request):

    logout(request)
    return redirect("home")   



def register_view(request):

    if request.method == "POST":

        username = request.POST.get("username")
        password = request.POST.get("password")
        role = request.POST.get("role")
        corporate_type = request.POST.get("corporate_type")

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists")
            return redirect("register")


        user = User.objects.create_user(
            username=username,
            password=password,
            is_active=False
        )

        profile = Profile.objects.create(
            user=user,
            role=role,
            is_approved=False
        )

        if role == "corporate":
            profile.corporate_type = corporate_type
            profile.save()

        messages.success(
            request,
            "Registration successful. Your account is pending admin approval."
        )

        return redirect("login")

    return render(request, "users/register.html")



def access_denied(request):
    return render(request, "access_denied.html")
