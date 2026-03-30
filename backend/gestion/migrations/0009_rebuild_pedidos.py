"""
Rebuild Pedidos table to match POVT.DBF structure exactly.
Table is empty, so we delete and recreate.
"""
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestion', '0008_rebuild_comprobante'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Pedidos',
        ),
        migrations.CreateModel(
            name='Pedidos',
            fields=[
                ('pov_codi', models.AutoField(primary_key=True, serialize=False)),
                ('pov_fech', models.DateField(blank=True, help_text='Fecha del pedido', null=True)),
                ('rev_codi', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='pedidos', to='gestion.revendedor')),
                # Cliente
                ('cli_nomb', models.CharField(blank=True, help_text='Nombre cliente', max_length=50, null=True)),
                ('cli_dire', models.CharField(blank=True, help_text='Dirección', max_length=80, null=True)),
                ('loc_codi', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='gestion.localidad')),
                ('cli_tele', models.CharField(blank=True, help_text='Teléfono', max_length=15, null=True)),
                ('cli_celu', models.CharField(blank=True, help_text='Celular', max_length=15, null=True)),
                ('cli_emai', models.CharField(blank=True, help_text='Email', max_length=40, null=True)),
                ('cli_fnac', models.DateField(blank=True, help_text='Fecha nacimiento', null=True)),
                ('cli_tdoc', models.CharField(blank=True, help_text='Tipo documento', max_length=3, null=True)),
                ('cli_ndoc', models.IntegerField(blank=True, help_text='Número documento', null=True)),
                ('civ_codi', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='gestion.condicioniva')),
                ('cli_cuit', models.CharField(blank=True, help_text='CUIT', max_length=13, null=True)),
                ('cli_estc', models.CharField(blank=True, help_text='Estado civil', max_length=30, null=True)),
                ('cli_ocup', models.CharField(blank=True, help_text='Ocupación', max_length=30, null=True)),
                # Cónyuge
                ('cli_nombc', models.CharField(blank=True, help_text='Nombre cónyuge', max_length=50, null=True)),
                ('cli_tdocc', models.CharField(blank=True, help_text='Tipo doc cónyuge', max_length=3, null=True)),
                ('cli_ndocc', models.IntegerField(blank=True, help_text='Nro doc cónyuge', null=True)),
                ('cli_cuitc', models.CharField(blank=True, help_text='CUIT cónyuge', max_length=13, null=True)),
                # Artículo
                ('pov_arti', models.ForeignKey(blank=True, help_text='POV_ARTI', null=True, on_delete=django.db.models.deletion.SET_NULL, to='gestion.articulos')),
                ('pov_mode', models.IntegerField(blank=True, help_text='Modelo/Año', null=True)),
                ('pov_colo', models.ForeignKey(blank=True, help_text='POV_COLO', null=True, on_delete=django.db.models.deletion.SET_NULL, to='gestion.color')),
                ('pov_ncha', models.CharField(blank=True, help_text='Número chasis', max_length=20, null=True)),
                ('pov_nmot', models.CharField(blank=True, help_text='Número motor', max_length=22, null=True)),
                ('pov_ncer', models.CharField(blank=True, help_text='Número certificado', max_length=20, null=True)),
                # Facturación
                ('pov_tfac', models.CharField(blank=True, help_text='Tipo factura', max_length=6, null=True)),
                ('pov_flis', models.DateField(blank=True, help_text='Fecha lista precios', null=True)),
                ('pov_plis', models.DecimalField(blank=True, decimal_places=2, help_text='Precio lista', max_digits=12, null=True)),
                # Forma de pago
                ('pov_finu', models.CharField(blank=True, help_text='Financiera utilizada', max_length=30, null=True)),
                ('pov_numc', models.CharField(blank=True, help_text='Número cuotas', max_length=15, null=True)),
                ('pov_impc', models.DecimalField(blank=True, decimal_places=2, help_text='Importe crédito', max_digits=12, null=True)),
                ('pov_nomc', models.CharField(blank=True, help_text='Nombre crédito', max_length=50, null=True)),
                ('pov_tarc', models.DecimalField(blank=True, decimal_places=2, help_text='Tarjeta crédito', max_digits=12, null=True)),
                ('pov_ppag', models.DecimalField(blank=True, decimal_places=2, help_text='Pago contado/efectivo', max_digits=12, null=True)),
                ('pov_monf', models.DecimalField(blank=True, decimal_places=2, help_text='Monto final', max_digits=12, null=True)),
                ('pov_cheq', models.DecimalField(blank=True, decimal_places=2, help_text='Cheques (POV_CHE3)', max_digits=12, null=True)),
                ('pov_tran', models.DecimalField(blank=True, decimal_places=2, help_text='Transferencia', max_digits=12, null=True)),
                ('pov_icdo', models.DecimalField(blank=True, decimal_places=2, help_text='Importe código', max_digits=12, null=True)),
                # General
                ('gen_codi', models.IntegerField(blank=True, help_text='Código general', null=True)),
                ('pov_cvta', models.BigIntegerField(blank=True, help_text='Confirmación venta', null=True)),
                # Control Django
                ('pov_fchc', models.DateTimeField(auto_now_add=True, help_text='Fecha creación')),
                ('pov_fmod', models.DateTimeField(auto_now=True, help_text='Fecha modificación')),
            ],
            options={
                'verbose_name': 'Pedido',
                'verbose_name_plural': 'Pedidos',
                'ordering': ['-pov_codi'],
                'indexes': [
                    models.Index(fields=['rev_codi_id', '-pov_codi'], name='gestion_ped_rev_codi_pov_idx'),
                ],
            },
        ),
    ]
