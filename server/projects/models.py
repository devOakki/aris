import uuid
from django.db import models
from django.conf import settings
from accounts.models import AcademicSession, StudentProfile, SupervisorProfile


class ProjectCategory(models.TextChoices):
    MINOR_1     = 'MINOR_1',     'Minor Project I'
    MINOR_2     = 'MINOR_2',     'Minor Project II'
    MAJOR       = 'MAJOR',       'Major Project'
    RESEARCH    = 'RESEARCH',    'Research Paper'
    HARDWARE    = 'HARDWARE',    'Hardware / IoT Project'
    INNOVATION  = 'INNOVATION',  'Innovation / Capstone'


class ProjectTrack(models.Model):
    id                    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title                 = models.CharField(max_length=150)
    category              = models.CharField(max_length=20, choices=ProjectCategory.choices, default=ProjectCategory.MINOR_1)
    session               = models.ForeignKey(AcademicSession, on_delete=models.CASCADE, related_name='project_tracks')
    department            = models.CharField(max_length=100)
    target_program        = models.CharField(max_length=50)
    target_semester       = models.PositiveSmallIntegerField()
    is_mandatory          = models.BooleanField(default=True)
    max_group_size        = models.PositiveSmallIntegerField(default=3)
    required_deliverables = models.JSONField(default=list)
    min_media_files       = models.PositiveSmallIntegerField(default=5)
    max_media_files       = models.PositiveSmallIntegerField(default=10)
    coordinator           = models.ForeignKey(
        SupervisorProfile,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='coordinated_tracks',
        help_text="Faculty member assigned by HOD to coordinate track lab sessions & presentations."
    )
    created_by            = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_tracks'
    )
    is_active             = models.BooleanField(default=True)
    created_at            = models.DateTimeField(auto_now_add=True)
    updated_at            = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_tracks'

    def __str__(self):
        return f"{self.title} ({self.target_program} Sem-{self.target_semester}) [{self.session.year}]"


class StudentGroup(models.Model):
    class Status(models.TextChoices):
        FORMED             = 'FORMED',             'Group Formed'
        SUPERVISOR_PENDING = 'SUPERVISOR_PENDING', 'Supervisor Pending'
        PROPOSAL_PENDING   = 'PROPOSAL_PENDING',   'Proposal Under Review'
        PROPOSAL_REJECTED  = 'PROPOSAL_REJECTED',  'Proposal Rejected'
        ACTIVE             = 'ACTIVE',             'Project Active (Approved)'
        SUBMITTED          = 'SUBMITTED',          'Deliverables Submitted'
        HOD_APPROVED       = 'HOD_APPROVED',       'HOD Approved'
        DEAN_APPROVED      = 'DEAN_APPROVED',      'Dean Approved (Archived)'

    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name       = models.CharField(max_length=100)
    track      = models.ForeignKey(ProjectTrack, on_delete=models.CASCADE, related_name='groups')
    supervisor = models.ForeignKey(
        SupervisorProfile,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='supervised_groups'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_groups'
    )
    status     = models.CharField(max_length=25, choices=Status.choices, default=Status.FORMED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_groups'

    def __str__(self):
        return f"{self.name} — {self.track.title} [{self.status}]"


class GroupMember(models.Model):
    class MemberRole(models.TextChoices):
        LEADER = 'LEADER', 'Team Leader'
        MEMBER = 'MEMBER', 'Member'

    group       = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name='members')
    student     = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='group_memberships')
    member_role = models.CharField(max_length=10, choices=MemberRole.choices, default=MemberRole.MEMBER)
    joined_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'group_members'
        unique_together = ('group', 'student')

    def __str__(self):
        return f"{self.student.user.get_full_name()} in {self.group.name} ({self.member_role})"


class ProjectIdea(models.Model):
    id                = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supervisor        = models.ForeignKey(SupervisorProfile, on_delete=models.CASCADE, related_name='posted_ideas')
    title             = models.CharField(max_length=200)
    problem_statement = models.TextField()
    novelty           = models.TextField()
    domain            = models.CharField(max_length=100)
    technologies      = models.JSONField(default=list)
    is_taken          = models.BooleanField(default=False)
    taken_by          = models.OneToOneField(
        StudentGroup,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='locked_idea'
    )
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_ideas'

    def __str__(self):
        return f"{self.title} ({'Taken' if self.is_taken else 'Available'})"


class ProjectProposal(models.Model):
    class ProposalType(models.TextChoices):
        FROM_LIST = 'FROM_LIST', 'From Supervisor Idea Pool'
        OWN_IDEA  = 'OWN_IDEA',  'Own Custom Project Idea'

    class Status(models.TextChoices):
        PENDING  = 'PENDING',  'Under Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    group               = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name='proposals')
    proposal_type       = models.CharField(max_length=10, choices=ProposalType.choices)
    project_idea        = models.ForeignKey(
        ProjectIdea,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='proposals'
    )
    title               = models.CharField(max_length=200)
    problem_statement   = models.TextField()
    novelty             = models.TextField()
    domain              = models.CharField(max_length=100)
    technologies        = models.JSONField(default=list)
    status              = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    version             = models.PositiveSmallIntegerField(default=1)
    supervisor_feedback = models.TextField(blank=True, default='')
    decided_at          = models.DateTimeField(null=True, blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_proposals'
        ordering = ['-version']

    def __str__(self):
        return f"{self.group.name} — v{self.version} [{self.status}]"


class ProjectDeadline(models.Model):
    class DeadlineType(models.TextChoices):
        SYNOPSIS = 'SYNOPSIS', 'Synopsis Submission'
        PPT      = 'PPT',      'Presentation Submission'
        REPORT   = 'REPORT',   'Final Report Submission'
        GITHUB   = 'GITHUB',   'GitHub Repository Link'
        CUSTOM   = 'CUSTOM',   'Custom Milestone'

    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    track         = models.ForeignKey(ProjectTrack, on_delete=models.CASCADE, related_name='deadlines')
    deadline_type = models.CharField(max_length=15, choices=DeadlineType.choices)
    title         = models.CharField(max_length=100, blank=True, default='')
    due_date      = models.DateTimeField()
    set_by        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='deadlines_set'
    )
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_deadlines'
        unique_together = ('track', 'deadline_type')

    def __str__(self):
        return f"{self.track.title} — {self.deadline_type} ({self.due_date:%d %b %Y})"


class ProjectSession(models.Model):
    class SessionType(models.TextChoices):
        WEEKLY_LAB   = 'WEEKLY_LAB',   'Weekly Progress Lab'
        SYNOPSIS_PPT = 'SYNOPSIS_PPT', 'Synopsis Physical Presentation'
        MID_TERM_PPT = 'MID_TERM_PPT', 'Mid-Term Progress Review'
        FINAL_PPT    = 'FINAL_PPT',    'Final Classroom PPT Presentation'
        DOUBT_SOLVE  = 'DOUBT_SOLVE',  'Guidance & Doubt Session'

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    track          = models.ForeignKey(ProjectTrack, on_delete=models.CASCADE, related_name='sessions')
    title          = models.CharField(max_length=150)
    session_type   = models.CharField(max_length=20, choices=SessionType.choices, default=SessionType.WEEKLY_LAB)
    target_section = models.CharField(max_length=5, blank=True, default='ALL', help_text="e.g. A, B, C or ALL")
    scheduled_date = models.DateField()
    start_time     = models.TimeField()
    end_time       = models.TimeField()
    venue          = models.CharField(max_length=100, help_text="e.g. Lab 3, Ground Floor CSE Block, Room 204")
    description    = models.TextField(blank=True, default='')
    coordinator    = models.ForeignKey(
        SupervisorProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='scheduled_sessions'
    )
    is_completed   = models.BooleanField(default=False)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'project_sessions'
        ordering = ['scheduled_date', 'start_time']

    def __str__(self):
        return f"{self.title} ({self.scheduled_date}) - {self.track.title}"


class SessionAttendance(models.Model):
    class AttendanceStatus(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT  = 'ABSENT',  'Absent'
        LATE    = 'LATE',    'Late'

    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session        = models.ForeignKey(ProjectSession, on_delete=models.CASCADE, related_name='attendances')
    group          = models.ForeignKey(StudentGroup, on_delete=models.CASCADE, related_name='session_attendances')
    status         = models.CharField(max_length=10, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    progress_notes = models.TextField(blank=True, default='', help_text="Coordinator feedback from classroom presentation")
    marked_by      = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    marked_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'session_attendances'
        unique_together = ('session', 'group')

    def __str__(self):
        return f"{self.group.name} - {self.session.title} [{self.status}]"

