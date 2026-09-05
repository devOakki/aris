from django.db import models
from django.conf import settings


class AcademicSession(models.Model):
    class Term(models.TextChoices):
        ODD  = 'ODD',  'Odd Semester (Aug - Dec)'
        EVEN = 'EVEN', 'Even Semester (Jan - May)'

    year        = models.CharField(max_length=10)      
    term        = models.CharField(max_length=10, choices=Term.choices)
    is_active   = models.BooleanField(default=True)     
    set_by      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sessions_configured'
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academic_sessions'

    def save(self, *args, **kwargs):
        if self.is_active:
            AcademicSession.objects.filter(is_active=True).exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.year} [{self.term}] {'(Active)' if self.is_active else ''}"


class StudentProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile'
    )
    program       = models.CharField(max_length=50)       
    department    = models.CharField(max_length=100)      
    semester      = models.PositiveSmallIntegerField()    
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)
       
    class Meta:
        db_table = 'student_profiles'

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.program} (Sem {self.semester})"

    
class SupervisorProfile(models.Model):
    class ApprovalStatus(models.TextChoices):
        PENDING  = 'PENDING',  'Pending HOD Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='supervisor_profile'
    )
    designation          = models.CharField(max_length=100)  
    department           = models.CharField(max_length=100) 
    expertise_domains    = models.JSONField(default=list)   
    expertise_tech       = models.JSONField(default=list)   
    max_groups           = models.PositiveSmallIntegerField(default=10) 
    is_accepting         = models.BooleanField(default=True) 
    approval_status      = models.CharField(
        max_length=20,
        choices=ApprovalStatus.choices,
        default=ApprovalStatus.PENDING
    )
    rejection_reason     = models.TextField(blank=True, default='')
    approved_by          = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_supervisors'
    )
    approved_at          = models.DateTimeField(null=True, blank=True)
    bio                  = models.TextField(blank=True, default='')
    created_at           = models.DateTimeField(auto_now_add=True)
    updated_at           = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'supervisor_profiles'

    def __str__(self):
        return f"{self.user.get_full_name()} — {self.designation}"
