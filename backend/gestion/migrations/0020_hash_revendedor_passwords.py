# Generated migration to increase rev_clav field size and hash existing passwords

from django.db import migrations, models
from django.contrib.auth.hashers import make_password


def hash_existing_passwords(apps, schema_editor):
    """Hashear todas las contraseñas existentes que no estén hasheadas"""
    Revendedor = apps.get_model('gestion', 'Revendedor')
    
    for revendedor in Revendedor.objects.filter(rev_clav__isnull=False).exclude(rev_clav=''):
        # Si no está hasheada, hashearla
        if not revendedor.rev_clav.startswith('pbkdf2_sha256$') and \
           not revendedor.rev_clav.startswith('pbkdf2_sha1$') and \
           not revendedor.rev_clav.startswith('argon2_argon2id$') and \
           len(revendedor.rev_clav) < 100:
            revendedor.rev_clav = make_password(revendedor.rev_clav)
            revendedor.save(update_fields=['rev_clav'])


def reverse_hash_passwords(apps, schema_editor):
    """Revertir: no hacer nada, ya que no podemos desHashear las contraseñas"""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0019_remove_pedidos_pov_tfac'),
    ]

    operations = [
        migrations.AlterField(
            model_name='revendedor',
            name='rev_clav',
            field=models.CharField(
                blank=True, 
                help_text='Contraseña/Clave (hasheada)', 
                max_length=128, 
                null=True
            ),
        ),
        migrations.RunPython(hash_existing_passwords, reverse_hash_passwords),
    ]
