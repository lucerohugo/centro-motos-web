from rest_framework import serializers
from .models import (
    Provincia, Localidad, Marca, Rubro, Subrubro, Color, Comprobante,
    CondicionIva, Articulos, Revendedor, Stock, ConfirmacionVenta,
    Clientes, Pedidos, General, Usuario
)


# ================================================================
# UBICACIONES
# ================================================================
class ProvinciaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Provincia
        fields = ['pci_codi', 'pci_nomb']


class LocalidadSerializer(serializers.ModelSerializer):
    pci_nomb = serializers.CharField(source='pci_codi.pci_nomb', read_only=True)

    class Meta:
        model = Localidad
        fields = ['loc_codi', 'loc_nomb', 'loc_cpos', 'pci_codi', 'pci_nomb']


class LocalidadFrontendSerializer(serializers.ModelSerializer):
    """Serializer para frontend con nombres camelCase"""
    codigoPostal = serializers.CharField(source='loc_cpos', read_only=True)
    codigo = serializers.IntegerField(source='loc_codi')
    nombre = serializers.CharField(source='loc_nomb')
    provinciaId = serializers.IntegerField(source='pci_codi.pci_codi')
    provincia = serializers.CharField(source='pci_codi.pci_nomb')

    class Meta:
        model = Localidad
        fields = ['codigo', 'nombre', 'codigoPostal', 'provinciaId', 'provincia']


# ================================================================
# CATÁLOGO
# ================================================================
class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ['mar_codi', 'mar_nomb']


class RubroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rubro
        fields = ['rub_codi', 'rub_nomb']


class SubrubroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subrubro
        fields = ['sru_codi', 'sru_nomb', 'rub_codi']


class ColorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Color
        fields = ['col_codi', 'col_nomb']


class ComprobanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comprobante
        fields = ['com_codi', 'com_nomb', 'com_letr', 'com_abre', 'com_deha', 'com_unum', 'com_afip', 'com_fele']


class ArticuloStockSerializer(serializers.ModelSerializer):
    """Serializer para retornar artículos en formato esperado por el frontend"""
    codigoArticulo = serializers.CharField(source='art_codi')
    descripcion = serializers.CharField(source='art_nomb')
    marca = serializers.CharField(source='mar_codi.mar_nomb')
    modelo = serializers.CharField(source='art_mode', allow_null=True)
    precioLista = serializers.DecimalField(source='art_plis', max_digits=12, decimal_places=2)
    precioUnitario = serializers.DecimalField(source='art_prec', max_digits=12, decimal_places=2)

    class Meta:
        model = Articulos
        fields = [
            'codigoArticulo', 'descripcion', 'marca', 'modelo', 'precioLista', 'precioUnitario'
        ]


class ArticuloSerializer(serializers.ModelSerializer):
    mar_nomb = serializers.CharField(source='mar_codi.mar_nomb', read_only=True)
    sru_nomb = serializers.CharField(source='sru_codi.sru_nomb', read_only=True, allow_null=True)
    rub_nomb = serializers.CharField(source='sru_codi.rub_codi.rub_nomb', read_only=True, allow_null=True)

    class Meta:
        model = Articulos
        fields = [
            'art_codi', 'art_nomb', 'art_mode',
            'art_plis', 'art_prec', 'art_tprec',
            'mar_codi', 'mar_nomb', 'sru_codi', 'sru_nomb', 'rub_nomb',
            'art_tiva',
            'art_fchc', 'art_fmod'
        ]
        read_only_fields = ['art_fchc', 'art_fmod']


# ================================================================
# INVENTARIO
# ================================================================
class StockSerializer(serializers.ModelSerializer):
    art_nomb = serializers.CharField(source='art_codi.art_nomb', read_only=True)
    col_nomb = serializers.CharField(source='col_codi.col_nomb', read_only=True, allow_null=True)
    mar_nomb = serializers.CharField(source='art_codi.mar_codi.mar_nomb', read_only=True, allow_null=True)
    sru_nomb = serializers.CharField(source='art_codi.sru_codi.sru_nomb', read_only=True, allow_null=True)

    class Meta:
        model = Stock
        fields = [
            'stk_codi', 'art_codi', 'art_nomb', 'mar_nomb', 'sru_nomb',
            'col_codi', 'col_nomb',
            'art_ncha', 'art_ncer', 'art_nmot', 'art_mode',
            'art_fing', 'art_orco', 'art_tall', 'art_dest',
            'art_codv', 'art_codc', 'art_usad', 'art_prem',
            'art_cobr', 'art_cntr', 'art_sucd', 'art_desa', 'art_bdis',
            'stk_fcre', 'stk_fmod'
        ]
        read_only_fields = ['stk_codi', 'stk_fcre', 'stk_fmod']


class ConfirmacionVentaSerializer(serializers.ModelSerializer):
    mar_nomb = serializers.CharField(source='con_marc.mar_nomb', read_only=True, allow_null=True)
    rub_nomb = serializers.CharField(source='con_rubr.rub_nomb', read_only=True, allow_null=True)
    sru_nomb = serializers.CharField(source='con_suru.sru_nomb', read_only=True, allow_null=True)
    art_nomb = serializers.CharField(source='con_arti.art_nomb', read_only=True, allow_null=True)
    rev_nomb = serializers.CharField(source='con_reve.rev_nomb', read_only=True, allow_null=True)

    class Meta:
        model = ConfirmacionVenta
        fields = [
            'con_codi', 'con_marc', 'mar_nomb', 'con_rubr', 'rub_nomb',
            'con_suru', 'sru_nomb', 'con_arti', 'art_nomb',
            'con_reve', 'rev_nomb', 'con_prec', 'con_porc',
            
        ]
        read_only_fields = ['con_codi']


# ================================================================
# PERSONAS
# ================================================================
class RevendedorSerializer(serializers.ModelSerializer):
    rev_logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Revendedor
        fields = ['rev_codi', 'rev_nomb', 'rev_logo', 'rev_logo_url', 'rev_doc', 'rev_emai', 'rev_tele', 'rev_dire', 'rev_dest', 'rev_porc', 'rev_clav', 'loc_codi', 'rev_actv']
        read_only_fields = ['rev_codi', 'rev_logo_url']

    def get_rev_logo_url(self, obj):
        if obj.rev_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.rev_logo.url)
        return None


class CondicionIvaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CondicionIva
        fields = ['civ_codi', 'civ_nomb']


class CondicionIvaFrontendSerializer(serializers.ModelSerializer):
    """Serializer para frontend con nombres camelCase"""
    codigo = serializers.IntegerField(source='civ_codi')
    nombre = serializers.CharField(source='civ_nomb')

    class Meta:
        model = CondicionIva
        fields = ['codigo', 'nombre']


class ClientesSerializer(serializers.ModelSerializer):
    loc_nomb = serializers.CharField(source='loc_codi.loc_nomb', read_only=True)
    civ_nomb = serializers.CharField(source='civ_codi.civ_nomb', read_only=True, allow_null=True)

    class Meta:
        model = Clientes
        fields = [
            'cli_codi', 'cli_nomb', 'cli_fnac', 'cli_tdoc', 'cli_ndoc', 'cli_cuit',
            'cli_emai', 'cli_celu', 'cli_tele', 'cli_dire', 'cli_bar', 'cli_estc', 'cli_ocup',
            'cli_nombc', 'cli_fnbac', 'cli_tdocc', 'cli_ndocc', 'cli_cuitc',
            'loc_codi', 'loc_nomb', 'civ_codi', 'civ_nomb',
            'cli_fchc', 'cli_fmod'
        ]
        read_only_fields = ['cli_codi', 'cli_fchc', 'cli_fmod']


# ================================================================
# PEDIDOS
# ================================================================
class PedidosSerializer(serializers.ModelSerializer):    rev_codi = serializers.PrimaryKeyRelatedField(queryset=Revendedor.objects.all())    rev_nomb = serializers.CharField(source='rev_codi.rev_nomb', read_only=True)
    art_nomb = serializers.CharField(source='pov_arti.art_nomb', read_only=True, allow_null=True)
    mar_nomb = serializers.CharField(source='pov_arti.mar_codi.mar_nomb', read_only=True, allow_null=True)
    col_nomb = serializers.CharField(source='pov_colo.col_nomb', read_only=True, allow_null=True)
    loc_nomb = serializers.CharField(source='loc_codi.loc_nomb', read_only=True, allow_null=True)
    civ_nomb = serializers.CharField(source='civ_codi.civ_nomb', read_only=True, allow_null=True)

    class Meta:
        model = Pedidos
        fields = [
            'pov_codi', 'pov_fech',
            'rev_codi', 'rev_nomb',
            'cli_nomb', 'cli_dire', 'loc_codi', 'loc_nomb',
            'cli_tele', 'cli_celu', 'cli_emai', 'cli_fnac',
            'cli_tdoc', 'cli_ndoc', 'civ_codi', 'civ_nomb',
            'cli_cuit', 'cli_estc', 'cli_ocup',
            'cli_nombc', 'cli_tdocc', 'cli_ndocc', 'cli_cuitc',
            'pov_arti', 'art_nomb', 'mar_nomb', 'pov_mode', 'pov_colo', 'col_nomb',
            'pov_ncha', 'pov_nmot', 'pov_ncer',
            'com_codi', 'com_nomb', 'com_letr', 'pov_flis', 'pov_plis',
            'pov_finu', 'pov_numc', 'pov_impc', 'pov_nomc', 'pov_tarc',
            'pov_ppag', 'pov_monf', 'pov_cheq', 'pov_tran', 'pov_cont',
            'gen_codi', 'pov_cvta',
            'ped_exp', 'ped_fexp',
            'pov_fchc', 'pov_fmod'
        ]
        read_only_fields = ['pov_codi', 'pov_fchc', 'pov_fmod', 'ped_fexp']

    def create(self, validated_data):
        """Al crear un pedido, sincronizar datos del cliente en la tabla Clientes."""
        pedido = super().create(validated_data)
        self._sincronizar_cliente(pedido)
        return pedido

    def update(self, instance, validated_data):
        """Al actualizar un pedido, sincronizar datos del cliente en la tabla Clientes."""
        pedido = super().update(instance, validated_data)
        self._sincronizar_cliente(pedido)
        return pedido

    def _sincronizar_cliente(self, pedido):
        """Busca cliente por cli_ndoc; si existe lo actualiza, si no lo crea."""
        if not pedido.cli_nomb:
            return

        datos_cliente = {
            'cli_nomb': pedido.cli_nomb,
            'cli_dire': pedido.cli_dire or '',
            'cli_tele': pedido.cli_tele,
            'cli_celu': pedido.cli_celu,
            'cli_emai': pedido.cli_emai,
            'cli_fnac': pedido.cli_fnac,
            'cli_tdoc': pedido.cli_tdoc or 'DNI',
            'cli_cuit': pedido.cli_cuit,
            'cli_estc': pedido.cli_estc,
            'cli_ocup': pedido.cli_ocup,
            'loc_codi': pedido.loc_codi,
            'civ_codi': pedido.civ_codi,
            # Cónyuge
            'cli_nombc': pedido.cli_nombc,
            'cli_tdocc': pedido.cli_tdocc,
            'cli_ndocc': str(pedido.cli_ndocc) if pedido.cli_ndocc else None,
            'cli_cuitc': pedido.cli_cuitc,
        }

        if pedido.cli_ndoc:
            ndoc_str = str(pedido.cli_ndoc)
            cliente = Clientes.objects.filter(cli_ndoc=ndoc_str).first()
            if cliente:
                for campo, valor in datos_cliente.items():
                    setattr(cliente, campo, valor)
                cliente.cli_ndoc = ndoc_str
                cliente.save()
            else:
                Clientes.objects.create(cli_ndoc=ndoc_str, **datos_cliente)
        else:
            Clientes.objects.create(**datos_cliente)


class PedidosCompletoSerializer(PedidosSerializer):
    """Serializer completo - hereda de PedidosSerializer, mismos campos"""
    class Meta(PedidosSerializer.Meta):
        pass


# ================================================================
# USUARIO
# ================================================================
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ['usu_perf', 'usu_nomb', 'usu_rol', 'usu_fcre']
        read_only_fields = ['usu_fcre']


# ================================================================
# GENERAL (Datos de la empresa)
# ================================================================
class GeneralSerializer(serializers.ModelSerializer):
    gen_logo_url = serializers.SerializerMethodField()
    gen_loge_url = serializers.SerializerMethodField()

    class Meta:
        model = General
        fields = ['gen_codi', 'gen_nomb', 'gen_logo', 'gen_logo_url', 'gen_loge', 'gen_loge_url']
        read_only_fields = ['gen_codi', 'gen_logo_url', 'gen_loge_url']

    def get_gen_logo_url(self, obj):
        """Retorna la URL completa del logo de Centro Motos"""
        if obj.gen_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.gen_logo.url)
            return obj.gen_logo.url
        return None

    def get_gen_loge_url(self, obj):
        """Retorna la URL completa del logo de BrixSoft"""
        if obj.gen_loge:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.gen_loge.url)
            return obj.gen_loge.url
        return None
