from django.shortcuts import redirect
from users.models import Profile

def role_required(allowed_roles):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            profile, _ = Profile.objects.get_or_create(user=request.user)

            if profile.role not in allowed_roles:
                return redirect("access_denied")

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
