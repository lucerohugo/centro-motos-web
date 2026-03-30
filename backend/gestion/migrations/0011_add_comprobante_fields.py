# Generated migration for adding comprobante fields to Pedidos model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0010_rename_gen_general_gen_codi'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedidos',
            name='com_codi',
            field=models.IntegerField(blank=True, help_text='Comprobante código', null=True),
        ),
        migrations.AddField(
            model_name='pedidos',
            name='com_nomb',
            field=models.CharField(blank=True, help_text='Comprobante nombre (ej: FACTURA)', max_length=50, null=True),
        ),
        migrations.AddField(
            model_name='pedidos',
            name='com_letr',
            field=models.CharField(blank=True, help_text='Comprobante letra (A, B, C, etc)', max_length=1, null=True),
        ),
    ]
