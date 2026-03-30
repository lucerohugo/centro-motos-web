# Generated migration to create default General record

from django.db import migrations
from django.db.models import Q

def create_default_general(apps, schema_editor):
    """Crear registro predeterminado en General si no existe"""
    General = apps.get_model('gestion', 'General')
    
    # Verificar si ya existe un registro
    if not General.objects.exists():
        General.objects.create(
            gen_nomb='Centro Motos',
            gen_logo='',
            gen_loge=''
        )
    else:
        pass

def reverse_create_general(apps, schema_editor):
    """Eliminar el registro predeterminado en rollback"""
    General = apps.get_model('gestion', 'General')
    # Buscar por nombre predeterminado
    General.objects.filter(gen_nomb='Centro Motos').delete()

class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0015_general_gen_loge_alter_general_gen_logo'),
    ]

    operations = [
        migrations.RunPython(create_default_general, reverse_create_general),
    ]
