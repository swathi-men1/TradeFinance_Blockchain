from rest_framework.permissions import BasePermission
class IsAdminRole(BasePermission):
    def has_permisiion(self,request,view): #runs before the view
        return(
            request.user.is_authenticated
            and request.user.role=="admin"
        )