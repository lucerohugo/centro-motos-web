from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, parser_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.hashers import check_password
from django.db import transaction, IntegrityError

from rest_framework.parsers import MultiPartParser, FormParser

from .models import (
    Provincia, Localidad, Marca, Rubro, Subrubro, Color, Comprobante,
    CondicionIva, Articulos, Revendedor, Stock, ConfirmacionVenta,
    Clientes, Pedidos, Usuario, General
)

from .serializers import (
    ProvinciaSerializer, LocalidadSerializer, MarcaSerializer, RubroSerializer,
    SubrubroSerializer, ColorSerializer, ComprobanteSerializer,
    RevendedorSerializer, ClientesSerializer, ArticuloSerializer,
    UsuarioSerializer, PedidosSerializer, PedidosCompletoSerializer,
    CondicionIvaSerializer, StockSerializer,
    ConfirmacionVentaSerializer, GeneralSerializer
)


# ================================================================
# PAGINACIÓN
# ================================================================
class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ================================================================
# BASE
# ================================================================
class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = []
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]


# ================================================================
# 🔥 MIXIN REUTILIZABLE (CLAVE)
# ================================================================
class BulkUpsertMixin:
    lookup_field = None
    fields_map = {}

    def bulk_upsert(self, request):
        data = request.data

        if not isinstance(data, list):
            data = [data]

        resultados = []

        for item in data:
            try:
                lookup_value = item.get(self.lookup_field)

                if not lookup_value:
                    raise ValueError(f"Falta campo {self.lookup_field}")

                defaults = {}

                for model_field, payload_field in self.fields_map.items():
                    defaults[model_field] = item.get(payload_field)

                with transaction.atomic():
                    obj, created = self.queryset.model.objects.update_or_create(
                        **{self.lookup_field: lookup_value},
                        defaults=defaults
                    )

                resultados.append({
                    "id": lookup_value,
                    "created": created
                })

            except IntegrityError as e:
                resultados.append({
                    "error": "IntegrityError",
                    "detalle": str(e),
                    "data": item
                })

            except Exception as e:
                resultados.append({
                    "error": "GeneralError",
                    "detalle": str(e),
                    "data": item
                })

        return Response(resultados, status=status.HTTP_200_OK)


# ================================================================
# UBICACIONES
# ================================================================
class ProvinciaViewSet(BulkUpsertMixin, BaseViewSet):
    queryset = Provincia.objects.all()
    serializer_class = ProvinciaSerializer
    search_fields = ['pci_nomb']
    ordering = ['pci_nomb']

    lookup_field = "pci_codi"
    fields_map = {
        "pci_nomb": "pci_nomb"
    }

    def create(self, request, *args, **kwargs):
        return self.bulk_upsert(request)


class LocalidadViewSet(BulkUpsertMixin, BaseViewSet):
    queryset = Localidad.objects.all()
    serializer_class = LocalidadSerializer
    search_fields = ['loc_nomb', 'pci_codi__pci_nomb']
    filterset_fields = ['pci_codi']
    ordering = ['pci_codi', 'loc_nomb']

    lookup_field = "loc_codi"
    fields_map = {
        "loc_nomb": "loc_nomb",
        "loc_cpos": "loc_cpos",
        "pci_codi_id": "pci_codi"
    }

    def create(self, request, *args, **kwargs):
        return self.bulk_upsert(request)


# ================================================================
# CATÁLOGO
# ================================================================
class RubroViewSet(BulkUpsertMixin, BaseViewSet):
    queryset = Rubro.objects.all()
    serializer_class = RubroSerializer
    search_fields = ['rub_nomb']
    ordering = ['rub_nomb']

    lookup_field = "rub_codi"
    fields_map = {
        "rub_nomb": "rub_nomb"
    }

    def create(self, request, *args, **kwargs):
        return self.bulk_upsert(request)


class SubrubroViewSet(BulkUpsertMixin, BaseViewSet):
    queryset = Subrubro.objects.all()
    serializer_class = SubrubroSerializer
    search_fields = ['sru_nomb']
    ordering = ['sru_nomb']

    lookup_field = "sru_codi"
    fields_map = {
        "sru_nomb": "sru_nomb",
        "rub_codi_id": "rub_codi"
    }

    def create(self, request, *args, **kwargs):
        return self.bulk_upsert(request)


class MarcaViewSet(BaseViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    search_fields = ['mar_nomb']
    ordering = ['mar_nomb']


class ColorViewSet(BaseViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer
    search_fields = ['col_nomb']
    ordering = ['col_nomb']


class ComprobanteViewSet(BaseViewSet):
    queryset = Comprobante.objects.all()
    serializer_class = ComprobanteSerializer
    ordering = ['com_codi']


class CondicionIvaViewSet(BaseViewSet):
    queryset = CondicionIva.objects.all()
    serializer_class = CondicionIvaSerializer
    ordering = ['civ_nomb']


class ArticuloViewSet(BaseViewSet):
    queryset = Articulos.objects.all()
    serializer_class = ArticuloSerializer
    search_fields = ['art_nomb']
    ordering = ['art_nomb']


# ================================================================
# PERSONAS
# ================================================================
class RevendedorViewSet(BaseViewSet):
    queryset = Revendedor.objects.all()
    serializer_class = RevendedorSerializer
    search_fields = ['rev_nomb']

    @action(detail=False, methods=['post'])
    def login(self, request):
        clave = request.data.get('clave')

        if not clave:
            return Response({'error': 'Contraseña requerida'}, status=400)

        for rev in Revendedor.objects.filter(rev_actv=True):
            if rev.rev_clav and check_password(clave, rev.rev_clav):
                return Response({
                    "success": True,
                    "id": rev.rev_codi,
                    "nombre": rev.rev_nomb
                })

        return Response({'error': 'Incorrecto'}, status=401)


class ClientesViewSet(BaseViewSet):
    queryset = Clientes.objects.all()
    serializer_class = ClientesSerializer


# ================================================================
# PEDIDOS
# ================================================================
class PedidosViewSet(BaseViewSet):
    queryset = Pedidos.objects.all()
    serializer_class = PedidosSerializer

    @action(detail=True, methods=['get'])
    def completo(self, request, pk=None):
        pedido = self.get_object()
        return Response(PedidosCompletoSerializer(pedido).data)


# ================================================================
# INVENTARIO
# ================================================================
class StockViewSet(BaseViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer


class ConfirmacionVentaViewSet(BaseViewSet):
    queryset = ConfirmacionVenta.objects.all()
    serializer_class = ConfirmacionVentaSerializer


# ================================================================
# CONFIG
# ================================================================
class UsuarioViewSet(BaseViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


class GeneralViewSet(BaseViewSet):
    queryset = General.objects.all()
    serializer_class = GeneralSerializer


# ================================================================
# UPLOAD LOGO (FUNCIONAL)
# ================================================================
@api_view(['POST'])
@parser_classes((MultiPartParser, FormParser))
def upload_revendedor_logo(request, pk):
    try:
        rev = Revendedor.objects.get(rev_codi=pk)
    except Revendedor.DoesNotExist:
        return Response({'error': 'No encontrado'}, status=404)

    archivo = request.FILES.get('archivo')

    if not archivo:
        return Response({'error': 'Archivo requerido'}, status=400)

    rev.rev_logo = archivo
    rev.save()

    return Response({"ok": True})