from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth.hashers import make_password, check_password

from .models import (
    Provincia, Localidad, Marca, Rubro, Subrubro, Color, Comprobante,
    CondicionIva, Articulos, Revendedor, Stock, ConfirmacionVenta,
    Clientes, Pedidos, Usuario, General
)
from .serializers import (
    ProvinciaSerializer, LocalidadSerializer, LocalidadFrontendSerializer,
    MarcaSerializer, RubroSerializer, SubrubroSerializer, ColorSerializer, ComprobanteSerializer,
    RevendedorSerializer, ClientesSerializer, ArticuloSerializer, ArticuloStockSerializer,
    UsuarioSerializer, PedidosSerializer, PedidosCompletoSerializer, CondicionIvaSerializer, CondicionIvaFrontendSerializer,
    StockSerializer, ConfirmacionVentaSerializer, GeneralSerializer
)


class StandardPagination(PageNumberPagination):
    """Paginación estándar para todas las vistas"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class BaseViewSet(viewsets.ModelViewSet):
    """ViewSet base con filtrado, búsqueda y paginación"""
    permission_classes = []
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]


# ================================================================
# UBICACIONES GEOGRÁFICAS
# ================================================================
#nuevo de prueba con la api para cargar a la base de datos 
class ProvinciaViewSet(BaseViewSet):
    queryset = Provincia.objects.all()
    serializer_class = ProvinciaSerializer
    search_fields = ['pci_nomb']
    ordering = ['pci_nomb']

    def create(self, request, *args, **kwargs):
        data = request.data

        if not isinstance(data, list):
            data = [data]

        resultados = []

        for item in data:
            try:
                obj, created = Provincia.objects.update_or_create(
                    pci_codi=item.get("pci_codi"),
                    defaults={
                        "pci_nomb": item.get("pci_nomb")
                    }
                )

                resultados.append({
                    "pci_codi": obj.pci_codi,
                    "pci_nomb": obj.pci_nomb,
                    "created": created
                })

            except Exception as e:
                resultados.append({
                    "error": str(e),
                    "data": item
                })

        return Response(resultados, status=status.HTTP_200_OK)

# nuevo para probar api
class LocalidadViewSet(BaseViewSet):
    queryset = Localidad.objects.all()
    serializer_class = LocalidadSerializer
    search_fields = ['loc_nomb', 'pci_codi__pci_nomb']
    filterset_fields = ['pci_codi']
    ordering = ['pci_codi', 'loc_nomb']

    def create(self, request, *args, **kwargs):
        data = request.data

        if not isinstance(data, list):
            data = [data]

        resultados = []

        for item in data:
            try:
                obj, created = Localidad.objects.update_or_create(
                    loc_codi=item.get("loc_codi"),
                    defaults={
                        "loc_nomb": item.get("loc_nomb"),
                        "pci_codi_id": item.get("pci_codi"),
                        "loc_cpos": item.get("loc_cpos")
                    }
                )

                resultados.append({
                    "loc_codi": obj.loc_codi,
                    "loc_nomb": obj.loc_nomb,
                    "created": created
                })

            except Exception as e:
                resultados.append({
                    "error": str(e),
                    "data": item
                })

        return Response(resultados, status=status.HTTP_200_OK)
    


class CondicionIvaViewSet(BaseViewSet):
    queryset = CondicionIva.objects.all()
    serializer_class = CondicionIvaSerializer
    search_fields = ['civ_nomb']
    ordering = ['civ_nomb']
    
    @action(detail=False, methods=['get'])
    def frontend(self, request):
        """Retornar condiciones IVA en formato esperado por el frontend"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = CondicionIvaFrontendSerializer(queryset, many=True)
        return Response(serializer.data)


# ================================================================
# CATÁLOGO DE PRODUCTOS
# ================================================================
class MarcaViewSet(BaseViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    search_fields = ['mar_nomb']

    @action(detail=False, methods=['get'])
    def por_destino(self, request):
        """Retorna marcas cuyos artículos están disponibles en un destino específico"""
        art_dest = request.query_params.get('art_dest')
        if not art_dest:
            return Response({'error': 'Parámetro art_dest requerido'}, status=400)
        
        try:
            art_dest = int(art_dest)
        except ValueError:
            return Response({'error': 'art_dest debe ser un número válido'}, status=400)
        
        # Obtener marcas únicas de artículos en stock del destino
        marcas = Marca.objects.filter(
            articulos__stock__art_dest=art_dest
        ).distinct().order_by('mar_nomb')
        
        serializer = self.get_serializer(marcas, many=True)
        return Response(serializer.data)
    ordering = ['mar_nomb']


class RubroViewSet(BaseViewSet):
    queryset = Rubro.objects.all()
    serializer_class = RubroSerializer
    search_fields = ['rub_nomb']
    filterset_fields = ['mar_codi']
    ordering = ['mar_codi', 'rub_nomb']


class SubrubroViewSet(BaseViewSet):
    queryset = Subrubro.objects.all()
    serializer_class = SubrubroSerializer
    search_fields = ['sru_nomb']

    @action(detail=False, methods=['get'])
    def por_destino(self, request):
        """Retorna subrubros cuyos artículos están disponibles en un destino específico"""
        art_dest = request.query_params.get('art_dest')
        if not art_dest:
            return Response({'error': 'Parámetro art_dest requerido'}, status=400)
        
        try:
            art_dest = int(art_dest)
        except ValueError:
            return Response({'error': 'art_dest debe ser un número válido'}, status=400)
        
        # Obtener subrubros únicos de artículos en stock del destino
        subrubros = Subrubro.objects.filter(
            articulos__stock__art_dest=art_dest
        ).distinct().order_by('sru_nomb')
        
        serializer = self.get_serializer(subrubros, many=True)
        return Response(serializer.data)
    ordering = ['sru_nomb']


class ColorViewSet(BaseViewSet):
    queryset = Color.objects.all()
    serializer_class = ColorSerializer
    search_fields = ['col_nomb']
    ordering = ['col_nomb']


class ComprobanteViewSet(BaseViewSet):
    queryset = Comprobante.objects.all()
    serializer_class = ComprobanteSerializer
    search_fields = ['com_nomb', 'com_abre', 'com_letr']
    filterset_fields = ['com_letr', 'com_abre']
    ordering = ['com_codi']


class ArticuloViewSet(BaseViewSet):
    queryset = Articulos.objects.all()
    serializer_class = ArticuloSerializer
    search_fields = ['art_nomb', 'art_codi']
    filterset_fields = ['mar_codi', 'rub_codi', 'sru_codi']
    ordering = ['art_nomb']
    



# ================================================================
# PERSONAS
# ================================================================
class RevendedorViewSet(BaseViewSet):
    queryset = Revendedor.objects.all()
    serializer_class = RevendedorSerializer
    search_fields = ['rev_nomb', 'rev_doc', 'rev_emai']
    filterset_fields = ['rev_actv']
    ordering = ['rev_nomb']

    @action(detail=False, methods=['post'])
    def login(self, request):
        """Validar login del revendedor por contraseña segura (hasheada)"""
        clave = request.data.get('clave', '')
        
        if not clave:
            return Response(
                {'error': 'Contraseña requerida'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Buscar revendedor activo
        revendedores = Revendedor.objects.filter(rev_actv=True)
        
        for revendedor in revendedores:
            if revendedor.rev_clav and check_password(clave, revendedor.rev_clav):
                # Contraseña correcta - construir URL del logo usando la misma lógica que el serializer
                rev_logo_url = None
                if revendedor.rev_logo:
                    rev_logo_url = request.build_absolute_uri(revendedor.rev_logo.url)
                
                return Response({
                    'success': True,
                    'revendedor': {
                        'id': revendedor.rev_codi,
                        'destino': revendedor.rev_dest or 0,
                        'nombre': revendedor.rev_nomb,
                        'direccion': revendedor.rev_dire or '',
                        'telefono': revendedor.rev_tele or '',
                        'celular': '',
                        'email': revendedor.rev_emai or '',
                        'rev_logo_url': rev_logo_url,
                    }
                }, status=status.HTTP_200_OK)
        
        # No encontró revendedor con esa contraseña
        return Response(
            {'success': False, 'error': 'Contraseña incorrecta'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    @action(detail=True, methods=['post'])
    def upload_logo(self, request, pk=None):
        """Cargar logo del revendedor"""
        revendedor = self.get_object()
        archivo = request.FILES.get('archivo')
        
        if not archivo:
            return Response(
                {'error': 'No se proporcionó archivo'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar que sea imagen
        if not archivo.content_type.startswith('image/'):
            return Response(
                {'error': 'El archivo debe ser una imagen'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Eliminar logo anterior si existe
        if revendedor.rev_logo:
            revendedor.rev_logo.delete()
        
        # Guardar nuevo logo
        revendedor.rev_logo = archivo
        revendedor.save()
        
        serializer = self.get_serializer(revendedor)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'])
    def delete_logo(self, request, pk=None):
        """Eliminar logo del revendedor"""
        revendedor = self.get_object()
        
        if not revendedor.rev_logo:
            return Response(
                {'error': 'El revendedor no tiene logo'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Eliminar archivo
        revendedor.rev_logo.delete()
        revendedor.rev_logo = None
        revendedor.save()
        
        return Response(
            {'mensaje': 'Logo eliminado correctamente'},
            status=status.HTTP_204_NO_CONTENT
        )


# ================================================================
# VISTAS FUNCIONALES PARA UPLOAD/DELETE DE LOGO
# ================================================================
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser

@api_view(['POST'])
@parser_classes((MultiPartParser, FormParser))
def upload_revendedor_logo(request, pk):
    """Upload logo para un revendedor"""
    try:
        revendedor = Revendedor.objects.get(rev_codi=pk)
    except Revendedor.DoesNotExist:
        return Response(
            {'error': 'Revendedor no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    archivo = request.FILES.get('archivo')
    if not archivo:
        return Response(
            {'error': 'No se proporcionó archivo'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if not archivo.content_type.startswith('image/'):
        return Response(
            {'error': 'El archivo debe ser una imagen'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if revendedor.rev_logo:
        revendedor.rev_logo.delete()
    
    revendedor.rev_logo = archivo
    revendedor.save()
    
    serializer = RevendedorSerializer(revendedor, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def delete_revendedor_logo(request, pk):
    """Eliminar logo de un revendedor"""
    try:
        revendedor = Revendedor.objects.get(rev_codi=pk)
    except Revendedor.DoesNotExist:
        return Response(
            {'error': 'Revendedor no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if not revendedor.rev_logo:
        return Response(
            {'error': 'El revendedor no tiene logo'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    revendedor.rev_logo.delete()
    revendedor.rev_logo = None
    revendedor.save()
    
    return Response(
        {'mensaje': 'Logo eliminado correctamente'},
        status=status.HTTP_204_NO_CONTENT
    )


class ClientesViewSet(BaseViewSet):
    queryset = Clientes.objects.all()
    serializer_class = ClientesSerializer
    search_fields = ['cli_nomb', 'cli_ndoc', 'cli_emai', 'cli_cuit']
    filterset_fields = ['loc_codi', 'civ_codi']
    ordering = ['cli_nomb']


# ================================================================
# PEDIDOS
# ================================================================
class PedidosViewSet(BaseViewSet):
    queryset = Pedidos.objects.select_related(
        'rev_codi', 'pov_arti', 'pov_arti__mar_codi', 'pov_colo', 'loc_codi', 'civ_codi'
    ).all()
    serializer_class = PedidosSerializer
    search_fields = ['cli_nomb', 'cli_ndoc', 'pov_ncha', 'pov_nmot', 'pov_codi']
    filterset_fields = ['rev_codi', 'pov_arti', 'pov_colo', 'loc_codi']
    ordering = ['-pov_codi']
    
    @action(detail=False, methods=['get'])
    def por_revendedor(self, request):
        """Obtener pedidos del revendedor"""
        rev_codi = request.query_params.get('rev_codi', None)
        if not rev_codi:
            return Response(
                {'error': 'Parámetro rev_codi requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            rev_id = int(rev_codi)
        except ValueError:
            return Response(
                {'error': 'rev_codi debe ser un número'},
                status=status.HTTP_400_BAD_REQUEST
            )
        pedidos = self.get_queryset().filter(rev_codi=rev_id).order_by('-pov_codi')
        serializer = self.get_serializer(pedidos, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def completo(self, request, pk=None):
        """Obtener datos COMPLETOS de un pedido"""
        pedido = self.get_object()
        serializer = PedidosCompletoSerializer(pedido)
        return Response(serializer.data)


# ================================================================
# INVENTARIO
# ================================================================
class StockViewSet(BaseViewSet):
    queryset = Stock.objects.select_related('art_codi__mar_codi', 'art_codi__sru_codi', 'col_codi').all()
    serializer_class = StockSerializer
    search_fields = ['art_codi__art_codi', 'art_codi__art_nomb', 'art_codi__mar_codi__mar_nomb', 'art_ncha', 'art_nmot', 'art_ncer']
    filterset_fields = ['art_codi', 'col_codi', 'art_dest', 'art_usad', 'art_bdis',
                        'art_codi__mar_codi', 'art_codi__sru_codi']
    ordering = ['-stk_fcre']

    def get_queryset(self):
        qs = super().get_queryset()
        # Si se pide solo disponibles (art_bdis IS NULL)
        if self.request.query_params.get('disponible') == '1':
            qs = qs.filter(art_bdis__isnull=True)
        return qs


class ConfirmacionVentaViewSet(BaseViewSet):
    queryset = ConfirmacionVenta.objects.all()
    serializer_class = ConfirmacionVentaSerializer
    filterset_fields = ['con_marc', 'con_rubr', 'con_suru', 'con_arti', 'con_reve']
    ordering = ['con_marc', 'con_rubr']


# ================================================================
# CONFIGURACIÓN
# ================================================================
class UsuarioViewSet(BaseViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    search_fields = ['usu_nomb']
    filterset_fields = ['usu_rol']
    ordering = ['usu_nomb']


class GeneralViewSet(BaseViewSet):
    queryset = General.objects.all()
    serializer_class = GeneralSerializer
    search_fields = ['gen_nomb']
    ordering = ['gen_codi']
