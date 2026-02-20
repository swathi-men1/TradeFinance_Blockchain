from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages

from users.utils import role_required
from .models import Document
from .utils import generate_file_hash

from ledger.models import Ledger
from risk.models import RiskScore
from risk.utils import calculate_risk

import hashlib


@login_required(login_url="/login/")
@role_required(["bank", "corporate"])
def upload_document(request):

    corporates = User.objects.filter(profile__role="corporate")

    if request.method == "POST":

        uploaded_file = request.FILES.get("document")

        if not uploaded_file:
            messages.error(request, "Please select a file.")
            return redirect("upload_document")

        profile = request.user.profile
        file_hash = generate_file_hash(uploaded_file)

        related_user = None


        if profile.role == "corporate":
            related_user = request.user

        elif profile.role == "bank":
            corporate_id = request.POST.get("corporate_id")

            if corporate_id:
                related_user = User.objects.filter(id=corporate_id).first()

            if not related_user:
                messages.error(request, "Please select a corporate user.")
                return render(
                    request,
                    "documents/upload.html",
                    {"corporates": corporates}
                )


        Document.objects.create(
            owner=request.user,
            related_corporate=related_user,
            file=uploaded_file,
            file_hash=file_hash
        )

        messages.success(request, "✅ Document uploaded successfully.")


        if profile.role == "corporate":
            return redirect("my_documents")
        else:
            return redirect("document_list")

    return render(
        request,
        "documents/upload.html",
        {"corporates": corporates}
    )

@login_required(login_url="/login/")
@role_required(["bank", "auditor"])
def document_list(request):

    documents = Document.objects.all().order_by("-uploaded_at")

    return render(
        request,
        "documents/list.html",
        {"documents": documents}
    )

@login_required(login_url="/login/")
@role_required(["bank", "auditor"])
def verify_document(request, doc_id):

    document = get_object_or_404(Document, id=doc_id)


    current_hash = generate_file_hash(document.file)

    if current_hash == document.file_hash:
        document.is_verified = True
        status = "Document is intact (verified)"
        action = "VERIFIED"
        remarks = "Hash matched. Document is authentic."
    else:
        document.is_verified = False
        status = "Document has been tampered!"
        action = "TAMPERED"
        remarks = "Hash mismatch detected."

    document.save()


    Ledger.objects.create(
        document=document,
        action=action,
        performed_by=request.user,
        remarks=remarks
    )

    corporate_user = document.related_corporate

    if corporate_user:
        score, category, explanation = calculate_risk(corporate_user)

        risk_obj, _ = RiskScore.objects.get_or_create(user=corporate_user)
        risk_obj.score = score
        risk_obj.category = category
        risk_obj.explanation = explanation
        risk_obj.save()

    return render(
        request,
        "documents/verify.html",
        {
            "document": document,
            "status": status,
            "current_hash": current_hash,
        }
    )

def documents_home(request):
    return render(request, "documents/home.html")

@login_required(login_url="/login/")
@role_required(["corporate"])
def my_documents(request):

    documents = Document.objects.filter(
        owner=request.user
    ).order_by("-uploaded_at")

    return render(
        request,
        "documents/my_documents.html",
        {"documents": documents},
    )

@login_required(login_url="/login/")
@role_required(["corporate"])
def delete_document(request, doc_id):

    document = get_object_or_404(
        Document,
        id=doc_id,
        owner=request.user
    )

    document.delete()
    messages.success(request, "Document deleted successfully.")

    return redirect("my_documents")

def check_integrity(request, doc_id):

    document = Document.objects.get(id=doc_id)

    file_data = open(document.file.path, 'rb').read()
    new_hash = hashlib.sha256(file_data).hexdigest()

    if new_hash == document.file_hash:
        messages.success(request, "Integrity Verified ✅")
    else:
        messages.error(request, "Tampering Detected ❌")

    return redirect('verify_page')
