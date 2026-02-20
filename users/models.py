from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    ROLE_CHOICES = [
        ("bank", "Bank"),
        ("corporate", "Corporate"),
        ("auditor", "Auditor"),
        ("admin", "Admin"),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, null=True, blank=True)
    is_approved = models.BooleanField(default=False)  

    CORPORATE_TYPE_CHOICES = [
        ("buyer", "Buyer"),
        ("seller", "Seller"),
    ]

    corporate_type = models.CharField(
        max_length=10,
        choices=CORPORATE_TYPE_CHOICES,
        null=True,
        blank=True
    )


