from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, parser_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError, transaction

from django.contrib.auth.hashers import check_password

from .models import *
from .serializers import *


# ================================================================
# PAGINACIÓN
# ================================================================
class StandardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ================================================================
# BASE VIEWSET
# ================================================================
class BaseViewSet(viewsets.ModelViewSet):
    permission_classes = []
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    pagination_class = StandardPagination


# ================================================================
# 🔥 MIXIN BULK CREATE (FIX FK)
# ================================================================
class BulkCreateMixin:
    lookup_field_name = None

    def create(self, request, *args, **kwargs):
        data = request.data

        if not isinstance(data, list):
            data = [data]

        resultados = []

        for item in data:
            try:
                if not item.get(self.lookup_field_name):
                    resultados.append({
                        "error": f"Falta campo {self.lookup_field_name}",
                        "data": item
                    })
                    continue

                model = self.queryset.model
                data_item = item.copy()

                # 🔥 FIX CLAVE: convertir FK a *_id
                for field in model._meta.fields:
                    if field.is_relation and field.many_to_one:
                        fk_name = field.name  # ej: pci_codi
                        if fk_name in data_item:
                            data_item[f"{fk_name}_id"] = data_item.pop(fk_name)

                obj, created = model.objects.update_or_create(
                    **{self.lookup_field_name: data_item[self.lookup_field_name]},
                    defaults=data_item
                )

                resultados.append({
                    "id": getattr(obj, self.lookup_field_name),
                    "created": created
                })

            except Exception as e:
                resultados.append({
                    "error": str(e),
                    "data": item
                })

        return Response(resultados, status=status.HTTP_200_OK)


# ================================================================
# UBICACIONES
# ================================================================
class ProvinciaViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Provincia.objects.all()
    serializer_class = ProvinciaSerializer
    lookup_field_name = "pci_codi"


class LocalidadViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Localidad.objects.all()
    serializer_class = LocalidadSerializer
    lookup_field_name = "loc_codi"


# ================================================================
# CONFIG
# ================================================================
class CondicionIvaViewSet(BulkCreateMixin, BaseViewSet):
    queryset = CondicionIva.objects.all()
    serializer_class = CondicionIvaSerializer
    lookup_field_name = "civ_codi"

    @action(detail=False, methods=['get'])
    def frontend(self, request):
        serializer = CondicionIvaFrontendSerializer(self.get_queryset(), many=True)
        return Response(serializer.data)


# ================================================================
# CATÁLOGO
# ================================================================
class MarcaViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    lookup_field_name = "mar_codi"
    
    @action(detail=False, methods=['get'], url_path='por_destino')
    def por_destino(self, request):
        """GET /marcas/por_destino/?art_dest=1 - Retorna marcas con stock en ese depósito"""
        art_dest = request.query_params.get('art_dest')
        if not art_dest:
            return Response([], status=status.HTTP_200_OK)
        
        try:
            art_dest = int(art_dest)
        except (ValueError, TypeError):
            return Response([], status=status.HTTP_200_OK)
        
        # Marcas que tienen artículos con stock en ese destino
        marcas = Marca.objects.filter(
            articulos__stock__art_dest=art_dest
        ).distinct().order_by('mar_nomb')
        
        serializer = self.get_serializer(marcas, many=True)
        return Response(serializer.data)


class RubroViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Rubro.objects.all()
    serializer_class = RubroSerializer
    lookup_field_name = "rub_codi"


class SubrubroViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Subrubro.objects.all()
    serializer_class = SubrubroSerializer
    lookup_field_name = "sru_codi"
    
    @action(detail=False, methods=['get'], url_path='por_destino')
    def por_destino(self, request):
        """GET /subrubros/por_destino/?art_dest=1 - Retorna subrubros con stock en ese depósito"""
        art_dest = request.query_params.get('art_dest')
        if not art_dest:
            return Response([], status=status.HTTP_200_OK)
        
        try:
            art_dest = int(art_dest)
        except (ValueError, TypeError):
            return Response([], status=status.HTTP_200_OK)
        
        # Subrubros que tienen artículos con stock en ese destino
        subrubros = Subrubro.objects.filter(
            articulos__stock__art_dest=art_dest
        ).distinct().order_by('sru_nomb')
        
        serializer = self.get_serializer(subrubros, many=True)
        return Response(serializer.data)


class ColorViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer
    lookup_field_name = "col_codi"


class ComprobanteViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Comprobante.objects.all()
    serializer_class = ComprobanteSerializer
    lookup_field_name = "com_codi"


class ArticuloViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Articulos.objects.all()
    serializer_class = ArticuloSerializer
    lookup_field_name = "art_codi"


# ================================================================
# INVENTARIO
# ================================================================
class StockViewSet(BulkCreateMixin, BaseViewSet):
    serializer_class = StockSerializer
    lookup_field_name = "stk_codi"
    
    # Filtros habilitados
    filterset_fields = ['art_dest', 'art_codi__mar_codi', 'art_codi__sru_codi', 'col_codi']
    
    # Búsqueda por múltiples campos (busca en art_codi relacionado)
    search_fields = ['art_codi__art_nomb', 'art_ncha', 'art_nmot', 'art_ncer', 'art_codi__art_codi']
    
    # Ordenamiento
    ordering_fields = ['stk_codi', 'art_fing', 'art_mode']
    ordering = ['stk_codi']
    
    # Sin paginación para stock (traer todo)
    pagination_class = None
    
    def get_queryset(self):
        """Solo retorna stock si art_dest es válido y está en query_params"""
        queryset = Stock.objects.all().select_related('art_codi', 'col_codi')
        
        # Requerir art_dest en query params
        art_dest = self.request.query_params.get('art_dest')
        
        if not art_dest:
            # Si no hay art_dest, retorna queryset vacío
            return queryset.none()
        
        try:
            art_dest_int = int(art_dest)
            if art_dest_int <= 0:
                return queryset.none()
        except (ValueError, TypeError):
            return queryset.none()
        
        # Filtrar por art_dest directamente
        return queryset.filter(art_dest=art_dest_int)


class ConfirmacionVentaViewSet(BulkCreateMixin, BaseViewSet):
    queryset = ConfirmacionVenta.objects.all()
    serializer_class = ConfirmacionVentaSerializer
    lookup_field_name = "con_codi"


# ================================================================
# PERSONAS
# ================================================================
class RevendedorViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Revendedor.objects.all()
    serializer_class = RevendedorSerializer
    lookup_field_name = "rev_codi"

    @action(detail=False, methods=['post'])
    def login(self, request):
        clave = request.data.get('clave')

        if not clave:
            return Response({'error': 'Clave requerida'}, status=400)

        for r in Revendedor.objects.filter(rev_actv=True):
            if r.rev_clav and check_password(clave, r.rev_clav):
                return Response({
                    "success": True,
                    "revendedor": {
                        "id": r.rev_codi,
                        "nombre": r.rev_nomb
                    }
                })

        return Response({'success': False}, status=401)


class ClientesViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Clientes.objects.all()
    serializer_class = ClientesSerializer
    lookup_field_name = "cli_codi"


# ================================================================
# PEDIDOS
# ================================================================
class PedidosViewSet(BaseViewSet):
    queryset = Pedidos.objects.all()
    serializer_class = PedidosSerializer
    filterset_fields = ['rev_codi']
    ordering_fields = ['pov_codi', 'pov_fech', '-pov_codi']
    ordering = ['-pov_codi']
    ordering_fields = ['pov_codi', 'pov_fech', '-pov_codi']
    ordering = ['-pov_codi']


# ================================================================
# CONFIG FINAL
# ================================================================
class UsuarioViewSet(BaseViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer


class GeneralViewSet(BaseViewSet):
    queryset = General.objects.all()
    serializer_class = GeneralSerializer


# ================================================================
# LOGOS
# ================================================================
@api_view(['POST'])
@parser_classes((MultiPartParser, FormParser))
def upload_revendedor_logo(request, pk):
    try:
        r = Revendedor.objects.get(rev_codi=pk)
    except Revendedor.DoesNotExist:
        return Response({'error': 'No existe'}, status=404)

    archivo = request.FILES.get('archivo')

    if not archivo:
        return Response({'error': 'Archivo requerido'}, status=400)

    r.rev_logo = archivo
    r.save()

    return Response({'ok': True})


@api_view(['DELETE'])
def delete_revendedor_logo(request, pk):
    try:
        r = Revendedor.objects.get(rev_codi=pk)
    except Revendedor.DoesNotExist:
        return Response({'error': 'No existe'}, status=404)

    if r.rev_logo:
        r.rev_logo.delete()
        r.rev_logo = None
        r.save()

    return Response({'ok': True})