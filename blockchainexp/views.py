from django.shortcuts import render

def home(request):

    show_documents = False
    show_ledger = False
    show_risk = False
    show_transactions = False
    is_admin = False   

    if request.user.is_authenticated:

        role = request.user.profile.role.lower()

        if role == "admin":
            is_admin = True 

        show_documents = True

        if role != "corporate":
            show_ledger = True

        if role in ["corporate", "bank", "auditor"]:
            show_risk = True

        if role in ["admin", "bank", "corporate", "auditor"]:
            show_transactions = True

    context = {
        "show_documents": show_documents,
        "show_ledger": show_ledger,
        "show_risk": show_risk,
        "show_transactions": show_transactions,
        "is_admin": is_admin, 
    }

    return render(request, "home.html", context)
