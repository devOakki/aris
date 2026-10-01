from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seeds AcademicSession 2026-27 ODD + BCA Sem-5 Minor Project I track'

    def handle(self, *args, **kwargs):
        from accounts.models import AcademicSession
        from projects.models import ProjectTrack, ProjectCategory

        session, created = AcademicSession.objects.get_or_create(
            year='2026-27',
            term='ODD',
            defaults={'is_active': True},
        )
        if created:
            self.stdout.write(self.style.SUCCESS('[+] AcademicSession created: ' + session.year + ' ' + session.term))
        else:
            session.is_active = True
            session.save()
            self.stdout.write('[=] AcademicSession exists: ' + session.year + ' ' + session.term)

        admin = User.objects.filter(is_superuser=True).first() or User.objects.first()

        track, created = ProjectTrack.objects.get_or_create(
            title='BCA Minor Project I',
            target_program='BCA',
            target_semester=5,
            session=session,
            defaults={
                'category': ProjectCategory.MINOR_1,
                'department': 'Computer Applications',
                'is_mandatory': True,
                'max_group_size': 3,
                'required_deliverables': ['PPT', 'GITHUB', 'SYNOPSIS', 'REPORT'],
                'min_media_files': 0,
                'max_media_files': 10,
                'is_active': True,
                'created_by': admin,
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('[+] Track created: ' + str(track.title) + ' | ID: ' + str(track.id)))
        else:
            self.stdout.write('[=] Track exists: ' + str(track.title) + ' | ID: ' + str(track.id))
        self.stdout.write(self.style.SUCCESS('Done.'))
