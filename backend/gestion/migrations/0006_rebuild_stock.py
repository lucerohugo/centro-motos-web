"""
Rebuild Stock table to match STKM.DBF structure.
The old Stock table is empty, so we delete and recreate it.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0005_alter_articulos_mar_codi_alter_articulos_rub_codi_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Stock',
        ),
        migrations.CreateModel(
            name='Stock',
            fields=[
                ('stk_codi', models.AutoField(primary_key=True, serialize=False)),
                ('art_ncha', models.CharField(blank=True, help_text='Número de chasis', max_length=20, null=True)),
                ('art_ncer', models.CharField(blank=True, help_text='Número de certificado', max_length=20, null=True)),
                ('art_nmot', models.CharField(blank=True, help_text='Número de motor', max_length=22, null=True)),
                ('art_mode', models.IntegerField(blank=True, help_text='Modelo/Año', null=True)),
                ('art_fing', models.DateField(blank=True, help_text='Fecha de ingreso', null=True)),
                ('art_orco', models.IntegerField(blank=True, help_text='Orden de compra', null=True)),
                ('art_tall', models.CharField(blank=True, help_text='Talla', max_length=5, null=True)),
                ('art_dest', models.IntegerField(blank=True, help_text='Destino (depósito/revendedor)', null=True)),
                ('art_codv', models.IntegerField(blank=True, help_text='Código de venta', null=True)),
                ('art_codc', models.IntegerField(blank=True, help_text='Código de compra', null=True)),
                ('art_usad', models.CharField(blank=True, help_text='Usado S/N', max_length=1, null=True)),
                ('art_prem', models.DecimalField(blank=True, decimal_places=2, help_text='Precio', max_digits=14, null=True)),
                ('art_cobr', models.IntegerField(blank=True, help_text='Cobrado', null=True)),
                ('art_cntr', models.CharField(blank=True, help_text='Control', max_length=1, null=True)),
                ('art_fcde', models.DateTimeField(blank=True, help_text='Fecha control', null=True)),
                ('art_sucd', models.IntegerField(blank=True, help_text='Sucursal destino', null=True)),
                ('art_desa', models.IntegerField(blank=True, help_text='Desafectado', null=True)),
                ('art_bdis', models.CharField(blank=True, help_text='Baja/Disponible S/N', max_length=1, null=True)),
                ('stk_fcre', models.DateTimeField(auto_now_add=True)),
                ('stk_fmod', models.DateTimeField(auto_now=True)),
                ('art_codi', models.ForeignKey(help_text='ART_CODI', on_delete=django.db.models.deletion.CASCADE, related_name='stock', to='gestion.articulos')),
                ('col_codi', models.ForeignKey(blank=True, help_text='COL_CODI', null=True, on_delete=django.db.models.deletion.SET_NULL, to='gestion.color')),
            ],
            options={
                'verbose_name': 'Stock',
                'verbose_name_plural': 'Stock',
                'ordering': ['art_codi', 'art_dest'],
            },
        ),
        migrations.AddIndex(
            model_name='stock',
            index=models.Index(fields=['art_codi_id', 'art_dest'], name='gestion_sto_art_cod_idx'),
        ),
        migrations.AddIndex(
            model_name='stock',
            index=models.Index(fields=['art_ncha'], name='gestion_sto_art_nch_idx'),
        ),
        migrations.AddIndex(
            model_name='stock',
            index=models.Index(fields=['art_dest'], name='gestion_sto_art_des_idx'),
        ),
    ]
