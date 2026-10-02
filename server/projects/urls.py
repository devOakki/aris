from django.urls import path
from .views import (
    ProjectTrackListCreateView,
    ProjectTrackDetailView,
    TrackDeadlineManageView,
    TrackGroupsListView,
    StudentGroupCreateView,
    MyStudentGroupView,
    MyStudentGroupSelectSupervisorView,
    GroupJoinRequestView,
    GroupJoinRequestRespondView,
    GroupJoinRequestCancelView,
    SupervisorGroupsListView,
    ProjectIdeaListCreateView,
    ProjectProposalCreateView,
    ProjectProposalReviewView,
    ProjectSessionListCreateView,
    SessionAttendanceListCreateView,
)

urlpatterns = [
    # Project Tracks
    path('tracks/', ProjectTrackListCreateView.as_view(), name='track-list-create'),
    path('tracks/<uuid:pk>/', ProjectTrackDetailView.as_view(), name='track-detail'),
    path('tracks/<uuid:track_id>/deadlines/', TrackDeadlineManageView.as_view(), name='track-deadlines-manage'),
    path('tracks/<uuid:track_id>/groups/', TrackGroupsListView.as_view(), name='track-groups-list'),

    # Groups
    path('groups/', StudentGroupCreateView.as_view(), name='group-create'),
    path('groups/my-group/', MyStudentGroupView.as_view(), name='my-group'),
    path('groups/my-group/select-supervisor/', MyStudentGroupSelectSupervisorView.as_view(), name='my-group-select-supervisor'),
    path('groups/supervisor-groups/', SupervisorGroupsListView.as_view(), name='supervisor-groups'),
    path('groups/<uuid:group_id>/request-join/', GroupJoinRequestView.as_view(), name='group-join-request'),
    path('groups/<uuid:group_id>/join-requests/<uuid:request_id>/respond/', GroupJoinRequestRespondView.as_view(), name='group-join-request-respond'),
    path('groups/<uuid:group_id>/join-requests/<uuid:request_id>/cancel/', GroupJoinRequestCancelView.as_view(), name='group-join-request-cancel'),

    # Ideas Bank
    path('ideas/', ProjectIdeaListCreateView.as_view(), name='idea-list-create'),

    # Proposals
    path('proposals/', ProjectProposalCreateView.as_view(), name='proposal-create'),
    path('proposals/<uuid:pk>/review/', ProjectProposalReviewView.as_view(), name='proposal-review'),

    # Coordinator Sessions & Attendance
    path('sessions/', ProjectSessionListCreateView.as_view(), name='session-list-create'),
    path('sessions/<uuid:session_id>/attendance/', SessionAttendanceListCreateView.as_view(), name='session-attendance'),
]
