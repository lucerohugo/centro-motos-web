# Generated migration to remove deprecated pov_tfac field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0018_merge_20260330_0957'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pedidos',
            name='pov_tfac',
        ),
    ]
