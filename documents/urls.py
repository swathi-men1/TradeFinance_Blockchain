from django.urls import path
from .views import documents_home
from .views import upload_document, document_list, verify_document
from .views import my_documents, delete_document


urlpatterns = [
    path('', documents_home, name='documents_home'),
    path("upload/", upload_document, name="upload_document"),
    path("list/", document_list, name="document_list"),
    path("verify/<int:doc_id>/", verify_document, name="verify_document"),
    path("my-documents/", my_documents, name="my_documents"),
    path("delete/<int:doc_id>/", delete_document, name="delete_document"),

]
