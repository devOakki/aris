import uuid
from django.contrib.auth.models import AbstractBaseUser,BaseUserManager,PermissionsMixin
from django.db import models


class CustomUserManager(BaseUserManager):
    def create_user(self, university_id, password=None, **extra_fields):
        if not university_id:
            raise ValueError("University ID (ERP/Employee ID) is mandatory !")
        user = self.model(university_id=university_id, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, university_id, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(university_id, password, **extra_fields)


class CustomUser(AbstractBaseUser,PermissionsMixin):
    class Role(models.TextChoices):
        STUDENT     = 'STUDENT',    'Student'
        SUPERVISOR  = 'SUPERVISOR', 'Supervisor'
        HOD         = 'HOD',        'HOD'
        DEAN        = 'DEAN',       'Dean'
        
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    university_id = models.CharField(max_length=50, unique=True)  
    email         = models.EmailField(unique=True)
    first_name    = models.CharField(max_length=100)
    last_name     = models.CharField(max_length=100)
    phone         = models.CharField(max_length=15, blank=True, default='')
    role          = models.CharField(max_length=20, choices=Role.choices)
    department    = models.CharField(max_length=100, blank=True, default='')
    avatar_url    = models.URLField(blank=True, default='')
    is_active     = models.BooleanField(default=True)
    is_staff      = models.BooleanField(default=False)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'university_id'
    REQUIRED_FIELDS = ['email','first_name','last_name','role']
    
    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.first_name} {self.last_name} [{self.role}]"
    

    