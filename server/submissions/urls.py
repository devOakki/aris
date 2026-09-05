from django.urls import path
from .views import (
    MySubmissionView,
    GroupSubmissionDetailView,
    FileUploadView,
    RegistrationPortraitUploadView,
)

urlpatterns = [
    path('my-submission/', MySubmissionView.as_view(), name='my-submission'),
    path('group/<uuid:group_id>/', GroupSubmissionDetailView.as_view(), name='group-submission-detail'),
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('upload-portrait/', RegistrationPortraitUploadView.as_view(), name='registration-portrait-upload'),
]
