from django.urls import path
from .views import (
    ProjectTrackListCreateView,
    ProjectTrackDetailView,
    StudentGroupCreateView,
    MyStudentGroupView,
    SupervisorGroupsListView,
    ProjectIdeaListCreateView,
    ProjectProposalCreateView,
    ProjectProposalReviewView,
)

urlpatterns = [
    # Project Tracks
    path('tracks/', ProjectTrackListCreateView.as_view(), name='track-list-create'),
    path('tracks/<uuid:pk>/', ProjectTrackDetailView.as_view(), name='track-detail'),

    # Groups
    path('groups/', StudentGroupCreateView.as_view(), name='group-create'),
    path('groups/my-group/', MyStudentGroupView.as_view(), name='my-group'),
    path('groups/supervisor-groups/', SupervisorGroupsListView.as_view(), name='supervisor-groups'),

    # Ideas Bank
    path('ideas/', ProjectIdeaListCreateView.as_view(), name='idea-list-create'),

    # Proposals
    path('proposals/', ProjectProposalCreateView.as_view(), name='proposal-create'),
    path('proposals/<uuid:pk>/review/', ProjectProposalReviewView.as_view(), name='proposal-review'),
]
