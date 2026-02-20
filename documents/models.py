from django.db import models
from django.contrib.auth.models import User


class Document(models.Model):

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="uploaded_documents"
    )

    related_corporate = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="corporate_documents",
        null=True,
        blank=True
    )

    file = models.FileField(upload_to="documents/")
    file_hash = models.CharField(max_length=64)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.file.name} - {self.owner.username}"
