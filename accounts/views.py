from django.shortcuts import render
from rest_framework import generics
from .serializers import RegisterSerializer
from .models import User
# Create your views here.
class RegisterView(generics.CreateAPIView):
    queryset=User.objects.all()
    serializer_class=RegisterSerializer


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class MeView(APIView):
    permission_classes = [IsAuthenticated] #no token- access denied
                                           #valid token- access allowed
                                           
    def get(self, request):
        user = request.user  #logged-in user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "org_name": user.org_name
        })
    
from .permissions import IsAdminRole

class AdminOnlyView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        return Response({
            "message": "Welcome Admin! You have access to this endpoint."
        })
