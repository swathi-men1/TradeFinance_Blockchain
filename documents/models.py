from django.db import models
from accounts.models import User
# Create your models here.
#creates a table in DB called documents_document
class Document(models.Model):

    DOC_TYPE_CHOICES = [
        ('LOC', 'Letter of Credit'),
        ('INVOICE', 'Invoice'),
        ('BILL_OF_LADING', 'Bill of Lading'),
        ('PO', 'Purchase Order'),
        ('COO', 'Certificate of Origin'),
        ('INSURANCE_CERT', 'Insurance Certificate'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    doc_type = models.CharField(max_length=50, choices=DOC_TYPE_CHOICES)
    doc_number = models.CharField(max_length=100)
    file = models.FileField(upload_to='documents/')
    hash = models.CharField(max_length=64)  # SHA-256 hash
    issued_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.doc_type} - {self.doc_number}"