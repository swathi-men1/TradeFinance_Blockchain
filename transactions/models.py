from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class TradeTransaction(models.Model):

    STATUS_CHOICES = [
        ('pending','Pending'),
        ('in_progress','In Progress'),
        ('completed','Completed'),
    ]

    buyer = models.ForeignKey(User,on_delete=models.CASCADE,related_name='buyer_transactions')
    seller = models.ForeignKey(User,on_delete=models.CASCADE,related_name='seller_transactions')
    amount = models.DecimalField(max_digits=10,decimal_places=2)
    currency = models.CharField(max_length=5,default="USD")
    status = models.CharField(max_length=20,choices=STATUS_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.buyer} → {self.seller}"
