"""
Rebuild Comprobante table: com_codi from CharField to AutoField,
add com_deha, com_unum, com_afip, com_fele fields from COMP.DBF.
No FKs reference this table, data is reloaded from DBF.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0007_rename_gestion_sto_art_cod_idx_gestion_sto_art_cod_f5b60a_idx_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Comprobante',
        ),
        migrations.CreateModel(
            name='Comprobante',
            fields=[
                ('com_codi', models.AutoField(primary_key=True, serialize=False)),
                ('com_nomb', models.CharField(help_text='Nombre del comprobante', max_length=30)),
                ('com_letr', models.CharField(blank=True, help_text='Letra: A, B, C, M, X, Z', max_length=1, null=True)),
                ('com_abre', models.CharField(blank=True, help_text='Abreviación: FACT, N.CR, N.DE, etc.', max_length=4, null=True)),
                ('com_deha', models.DecimalField(blank=True, decimal_places=0, help_text='Debe/Haber (1/-1)', max_digits=2, null=True)),
                ('com_unum', models.IntegerField(blank=True, help_text='Último número', null=True)),
                ('com_afip', models.CharField(blank=True, help_text='Código AFIP', max_length=3, null=True)),
                ('com_fele', models.DecimalField(blank=True, decimal_places=0, help_text='Factura electrónica', max_digits=3, null=True)),
            ],
            options={
                'verbose_name': 'Comprobante',
                'verbose_name_plural': 'Comprobantes',
                'ordering': ['com_codi'],
            },
        ),
    ]
