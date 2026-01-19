from django.db import models
from django.contrib.auth.models import AbstractUser
#AbstractUser is a complete user model that django provides with fields like
#username,email and password
# Create your models here.
class User(AbstractUser):
    ROLE_CHOICES=[
        ('bank','Bank'),
        ('corporate','Coporate'),
        ('auditor','Auditor'),
        ('admin','Admin'),
    ]
    role=models.CharField(max_length=20,choices=ROLE_CHOICES)
    org_name=models.CharField(max_length=255)