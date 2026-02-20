from django.db import models
from django.contrib.auth.models import User
from documents.models import Document

class Ledger(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE)
    action = models.CharField(max_length=50)
    performed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    remarks = models.TextField()

    def __str__(self):
        return f"{self.document.file.name} - {self.action}"
