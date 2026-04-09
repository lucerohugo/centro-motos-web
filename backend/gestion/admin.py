from django.contrib import admin
from .models import (
    Provincia, Localidad, Marca, Rubro, Subrubro, Color, Comprobante,
    CondicionIva, Articulos, Revendedor, Stock, ConfirmacionVenta,
    Clientes, Pedidos, General, Usuario
)


# ================================================================
# UBICACIONES GEOGRÁFICAS
# ================================================================
@admin.register(Provincia)
class ProvinciaAdmin(admin.ModelAdmin):
    list_display = ['pci_codi', 'pci_nomb']
    search_fields = ['pci_nomb']
    ordering = ['pci_nomb']


@admin.register(Localidad)
class LocalidadAdmin(admin.ModelAdmin):
    list_display = ['loc_codi', 'loc_nomb', 'loc_cpos', 'pci_codi']
    list_filter = ['pci_codi']
    search_fields = ['loc_nomb', 'pci_codi__pci_nomb']
    fieldsets = (
        ('Identificación', {
            'fields': ('loc_codi', 'loc_nomb')
        }),
        ('Ubicación', {
            'fields': ('pci_codi', 'loc_cpos')
        }),
    )
    ordering = ['pci_codi', 'loc_nomb']


# ================================================================
# CONFIGURACIÓN FISCAL
# ================================================================
@admin.register(CondicionIva)
class CondicionIvaAdmin(admin.ModelAdmin):
    list_display = ['civ_codi', 'civ_nomb']
    search_fields = ['civ_nomb']
    ordering = ['civ_nomb']


# ================================================================
# CATÁLOGO DE PRODUCTOS
# ================================================================
@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ['mar_codi', 'mar_nomb']
    search_fields = ['mar_nomb']
    ordering = ['mar_nomb']


@admin.register(Rubro)
class RubroAdmin(admin.ModelAdmin):
    list_display = ['rub_codi', 'rub_nomb']
    search_fields = ['rub_nomb']
    ordering = ['rub_nomb']


@admin.register(Subrubro)
class SubrubroAdmin(admin.ModelAdmin):
    list_display = ['sru_codi', 'sru_nomb', 'rub_codi']
    list_filter = ['rub_codi']
    search_fields = ['sru_nomb']
    ordering = ['rub_codi', 'sru_nomb']


@admin.register(Color)
class ColorAdmin(admin.ModelAdmin):
    list_display = ['col_codi', 'col_nomb']
    search_fields = ['col_nomb']
    ordering = ['col_nomb']


@admin.register(Comprobante)
class ComprobanteAdmin(admin.ModelAdmin):
    list_display = ['com_codi', 'com_nomb', 'com_letr', 'com_abre', 'com_deha', 'com_afip', 'com_fele']
    search_fields = ['com_nomb', 'com_abre']
    ordering = ['com_codi']


@admin.register(Articulos)
class ArticulosAdmin(admin.ModelAdmin):
    list_display = ['art_codi', 'art_nomb', 'art_mode', 'art_plis', 'art_prec', 'mar_codi', 'rub_codi']
    list_filter = ['mar_codi', 'rub_codi', 'sru_codi']
    search_fields = ['art_nomb', 'art_codi', 'art_mode']
    readonly_fields = ['art_fchc', 'art_fmod']
    fieldsets = (
        ('Identificación', {
            'fields': ('art_codi', 'art_nomb', 'art_mode')
        }),
        ('Precios', {
            'fields': ('art_plis', 'art_prec', 'art_tprec')
        }),
        ('Clasificación', {
            'fields': ('mar_codi', 'rub_codi', 'sru_codi', 'art_tiva')
        }),
        ('Control', {
            'fields': ('art_fchc', 'art_fmod')
        }),
    )
    ordering = ['art_nomb']


# ================================================================
# PERSONAS
# ================================================================
@admin.register(Revendedor)
class RevendedorAdmin(admin.ModelAdmin):
    list_display = ['rev_codi', 'rev_nomb', 'rev_porc', 'rev_actv', 'loc_codi']
    list_filter = ['rev_actv', 'loc_codi']
    search_fields = ['rev_nomb', 'rev_doc']
    fieldsets = (
        ('Identificación', {
            'fields': ('rev_codi', 'rev_nomb', 'rev_doc')
        }),
        ('Logo', {
            'fields': ('rev_logo',)
        }),
        ('Contacto', {
            'fields': ('rev_emai', 'rev_tele', 'rev_dire')
        }),
        ('Porcentaje y Localidad', {
            'fields': ('rev_porc', 'loc_codi')
        }),
        ('Configuración', {
            'fields': ('rev_clav', 'rev_actv')
        }),

    )
    ordering = ['rev_nomb']


@admin.register(Clientes)
class ClientesAdmin(admin.ModelAdmin):
    list_display = ['cli_codi', 'cli_nomb', 'cli_ndoc', 'cli_emai', 'loc_codi', 'civ_codi']
    list_filter = ['loc_codi', 'civ_codi']
    search_fields = ['cli_nomb', 'cli_ndoc', 'cli_emai', 'cli_cuit']
    readonly_fields = ['cli_fchc', 'cli_fmod']
    fieldsets = (
        ('Datos del Comprador', {
            'fields': ('cli_codi', 'cli_nomb', 'cli_fnac', 'cli_tdoc', 'cli_ndoc', 'cli_cuit')
        }),
        ('Contacto', {
            'fields': ('cli_emai', 'cli_celu', 'cli_tele', 'cli_dire', 'cli_bar', 'loc_codi', 'civ_codi')
        }),
        ('Información Personal', {
            'fields': ('cli_estc', 'cli_ocup'),
            'classes': ('collapse',)
        }),
        ('Datos del Cónyuge', {
            'fields': ('cli_nombc', 'cli_fnbac', 'cli_tdocc', 'cli_ndocc', 'cli_cuitc'),
            'classes': ('collapse',)
        }),
        ('Control', {
            'fields': ('cli_fchc', 'cli_fmod'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['cli_nomb']


# ================================================================
# INVENTARIO
# ================================================================
@admin.register(Stock)
class StockAdmin(admin.ModelAdmin):
    list_display = ['stk_codi', 'art_codi', 'col_codi', 'art_ncha', 'art_nmot', 'art_mode', 'art_dest', 'art_usad', 'art_bdis']
    list_filter = ['art_dest', 'art_usad', 'art_bdis', 'col_codi']
    search_fields = ['art_codi__art_nomb', 'art_ncha', 'art_nmot', 'art_ncer']
    readonly_fields = ['stk_fcre', 'stk_fmod']
    fieldsets = (
        ('Artículo', {
            'fields': ('stk_codi', 'art_codi', 'col_codi', 'art_mode')
        }),
        ('Identificación', {
            'fields': ('art_ncha', 'art_ncer', 'art_nmot')
        }),
        ('Ubicación', {
            'fields': ('art_dest', 'art_sucd', 'art_tall')
        }),
        ('Estado', {
            'fields': ('art_usad', 'art_bdis', 'art_cntr', 'art_desa')
        }),
        ('Comercial', {
            'fields': ('art_prem', 'art_codv', 'art_codc', 'art_cobr', 'art_orco')
        }),
        ('Fechas', {
            'fields': ('art_fing', 'art_fcde', 'stk_fcre', 'stk_fmod')
        }),
    )
    ordering = ['-stk_fmod']


@admin.register(ConfirmacionVenta)
class ConfirmacionVentaAdmin(admin.ModelAdmin):
    list_display = ['con_codi', 'con_marc', 'con_rubr', 'con_suru', 'con_arti', 'con_reve', 'con_prec', 'con_porc']
    list_filter = ['con_marc', 'con_rubr', 'con_reve']
    search_fields = ['con_arti__art_nomb']
    fieldsets = (
        ('Identificación', {
            'fields': ('con_codi', 'con_reve')
        }),
        ('Cascada de Productos', {
            'fields': ('con_marc', 'con_rubr', 'con_suru', 'con_arti')
        }),
        ('Precio y Porcentaje', {
            'fields': ('con_prec', 'con_porc')
        }),
    )
    ordering = ['con_marc', 'con_rubr']


# ================================================================
# PEDIDOS
# ================================================================
@admin.register(Pedidos)
class PedidosAdmin(admin.ModelAdmin):
    list_display = ['pov_codi', 'pov_fech', 'rev_codi', 'cli_nomb', 'pov_arti', 'pov_mode', 'pov_plis', 'pov_monf', 'ped_exp', 'ped_fexp']
    list_filter = ['rev_codi', 'pov_fech', 'ped_exp']
    search_fields = ['pov_codi', 'cli_nomb', 'cli_ndoc', 'pov_ncha', 'pov_nmot']
    readonly_fields = ['pov_codi', 'pov_fchc', 'pov_fmod', 'ped_fexp']
    fieldsets = (
        ('Pedido', {
            'fields': ('pov_codi', 'pov_fech', 'rev_codi')
        }),
        ('Estado de Exportación', {
            'fields': ('ped_exp', 'ped_fexp'),
            'description': 'Si está exportado, el pedido no se puede editar desde el frontend'
        }),
        ('Cliente', {
            'fields': ('cli_nomb', 'cli_dire', 'loc_codi', 'cli_tele', 'cli_celu', 'cli_emai',
                       'cli_fnac', 'cli_tdoc', 'cli_ndoc', 'civ_codi', 'cli_cuit', 'cli_estc', 'cli_ocup')
        }),
        ('Cónyuge', {
            'fields': ('cli_nombc', 'cli_tdocc', 'cli_ndocc', 'cli_cuitc'),
            'classes': ('collapse',)
        }),
        ('Vehículo', {
            'fields': ('pov_arti', 'pov_mode', 'pov_colo', 'pov_ncha', 'pov_nmot', 'pov_ncer')
        }),
        ('Facturación', {
            'fields': ('pov_flis', 'pov_plis')
        }),
        ('Forma de Pago', {
            'fields': ('pov_finu', 'pov_numc', 'pov_impc', 'pov_nomc', 'pov_tarc',
                       'pov_ppag', 'pov_monf', 'pov_cheq', 'pov_tran', 'pov_cont')
        }),
        ('Otros', {
            'fields': ('gen_codi', 'pov_cvta'),
            'classes': ('collapse',)
        }),
        ('Control', {
            'fields': ('pov_fchc', 'pov_fmod'),
            'classes': ('collapse',)
        }),
    )
    ordering = ['-pov_codi']

    def get_readonly_fields(self, request, obj=None):
        """Si el pedido ya fue exportado, todos los campos son readonly excepto ped_exp"""
        readonly = list(super().get_readonly_fields(request, obj))
        if obj and obj.ped_exp:
            # Agregar todos los campos como readonly excepto ped_exp (para poder desmarcar si es necesario)
            all_fields = [f.name for f in obj._meta.fields if f.name != 'ped_exp']
            readonly = list(set(readonly + all_fields))
        return readonly


# ================================================================
# GENERAL (Datos de la empresa)
# ================================================================
@admin.register(General)
class GeneralAdmin(admin.ModelAdmin):
    list_display = ['gen_codi', 'gen_nomb']
    fields = ['gen_codi', 'gen_nomb', 'gen_logo', 'gen_loge']


# ================================================================
# CONFIGURACIÓN
# ================================================================
@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ['usu_nomb', 'usu_rol', 'usu_fcre']
    list_filter = ['usu_rol']
    search_fields = ['usu_nomb']
    readonly_fields = ['usu_fcre']
    ordering = ['usu_nomb']
