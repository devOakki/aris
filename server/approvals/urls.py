from django.urls import path
from .views import (
    HODDossierListView,
    HODDossierActionView,
    DeanDossierListView,
    DeanDossierActionView,
    ProjectArchiveListView,
    HODFacultyApprovalListView,
    HODFacultyApprovalActionView,
)

urlpatterns = [
    # HOD Review
    path('dossiers/', HODDossierListView.as_view(), name='hod-dossiers-list'),
    path('dossiers/<uuid:group_id>/action/', HODDossierActionView.as_view(), name='hod-dossier-action'),
    path('faculty/', HODFacultyApprovalListView.as_view(), name='hod-faculty-list'),
    path('faculty/<int:supervisor_id>/action/', HODFacultyApprovalActionView.as_view(), name='hod-faculty-action'),

    # Dean Review
    path('dean-review/', DeanDossierListView.as_view(), name='dean-review-list'),
    path('dean-review/<uuid:group_id>/action/', DeanDossierActionView.as_view(), name='dean-review-action'),

    # Institutional Archive
    path('archive/', ProjectArchiveListView.as_view(), name='project-archive'),
]
