from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, parser_classes
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import IntegrityError, transaction
from django.http import FileResponse

from django.contrib.auth.hashers import check_password
import logging

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
                    defaults={k: v for k, v in data_item.items() if v is not None} #data_item
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
    pagination_class = None
    serializer_class = ProvinciaSerializer
    lookup_field_name = "pci_codi"


class LocalidadViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Localidad.objects.all()
    pagination_class = None
    serializer_class = LocalidadSerializer
    lookup_field_name = "loc_codi"


# ================================================================
# CONFIG
# ================================================================
class CondicionIvaViewSet(BulkCreateMixin, BaseViewSet):
    queryset = CondicionIva.objects.all()
    serializer_class = CondicionIvaSerializer
    lookup_field_name = "civ_codi"
    pagination_class = None

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
    pagination_class = None
    
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
    pagination_class = None


class SubrubroViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Subrubro.objects.all()
    serializer_class = SubrubroSerializer
    lookup_field_name = "sru_codi"
    pagination_class = None
    
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
    pagination_class = None


class ComprobanteViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Comprobante.objects.all()
    serializer_class = ComprobanteSerializer
    lookup_field_name = "com_codi"
    pagination_class = None


class ArticuloViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Articulos.objects.all()
    serializer_class = ArticuloSerializer
    lookup_field_name = "art_codi"
    pagination_class = None


# ================================================================
# INVENTARIO
# ================================================================
class StockViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Stock.objects.all()
    serializer_class = StockSerializer
    lookup_field_name = "stk_codi"
    
    # Filtros habilitados
    filterset_fields = ['art_dest', 'art_codi__mar_codi', 'art_codi__sru_codi', 'col_codi', 'art_bdis']
    
    # Búsqueda por múltiples campos (busca en art_codi relacionado)
    search_fields = ['art_codi__art_nomb', 'art_codi__art_codi', 'art_codi__mar_codi__mar_nomb', 'art_ncha', 'art_nmot', 'art_ncer', 'valores_filtros__vfs_valor']
    #search_fields = ['art_codi__art_nomb', 'art_ncha', 'art_nmot', 'art_ncer', 'art_codi__art_codi']
    # Ordenamiento
    ordering_fields = ['stk_codi', 'art_fing', 'art_mode']
    ordering = ['stk_codi']
    
    # Sin paginación para stock (traer todo)
    pagination_class = None
    
    def get_queryset(self):
        """
        Filtra stock disponible por depósito.
        
        Lógica: art_dest = depósito AND (art_bdis IS NULL OR art_bdis = '')
        
        Query params:
        - art_dest: depósito (requerido)
        - rev_codi: si se pasa, obtiene rev_dest del revendedor (alternativa a art_dest)
        """
        from django.db.models import Q
        
        queryset = Stock.objects.all().select_related('art_codi', 'col_codi')
        
        # Buscar art_dest: desde query_params o desde rev_codi
        art_dest = self.request.query_params.get('art_dest')
        rev_codi = self.request.query_params.get('rev_codi')
        
        art_dest_int = None
        
        # Si viene rev_codi, obtener rev_dest del revendedor
        if rev_codi and not art_dest:
            try:
                rev_codi_int = int(rev_codi)
                revendedor = Revendedor.objects.filter(rev_codi=rev_codi_int).first()
                if revendedor and revendedor.rev_dest:
                    art_dest_int = revendedor.rev_dest
            except (ValueError, TypeError):
                pass
        
        # Si viene art_dest directamente, usarlo
        if art_dest:
            try:
                art_dest_int = int(art_dest)
                if art_dest_int <= 0:
                    art_dest_int = None
            except (ValueError, TypeError):
                pass
        
        # Si no hay art_dest válido, retornar vacío
        if not art_dest_int:
            return queryset.none()
        
        # Filtro principal:
        # - art_dest = art_dest_int (depósito del revendedor)
        # - art_bdis está vacío o NULL (disponible, no dado de baja)
        queryset = queryset.filter(
            art_dest=art_dest_int
        ).filter(
            Q(art_bdis__isnull=True) | Q(art_bdis='')
        )
        
        # NUEVO: Filtrado por un valor de filtro personalizado
        # Solo un filtro activo a la vez (el usuario selecciona uno, se limpian los demás)
        filtros_json = self.request.query_params.get('filtros_seleccionados')
        if filtros_json:
            try:
                import json
                from gestion.models import ValorFiltroStock
                
                filtros_seleccionados = json.loads(filtros_json)  # { fr_codi: valor }
                
                # Obtener el único filtro activo
                if filtros_seleccionados:
                    fr_codi, valor = list(filtros_seleccionados.items())[0]
                    
                    # Obtener IDs de motos con este filtro y valor específicos
                    ids = ValorFiltroStock.objects.filter(
                        fr_codi=int(fr_codi),
                        vfs_valor=valor
                    ).values_list('stk_codi', flat=True).distinct()
                    
                    queryset = queryset.filter(stk_codi__in=ids)
                    
            except (json.JSONDecodeError, ValueError, TypeError):
                pass
        
        return queryset


class ConfirmacionVentaViewSet(BulkCreateMixin, BaseViewSet):
    queryset = ConfirmacionVenta.objects.all()
    serializer_class = ConfirmacionVentaSerializer
    lookup_field_name = "con_codi"
    pagination_class = None


# ================================================================
# PERSONAS
# ================================================================
class RevendedorViewSet(BulkCreateMixin, BaseViewSet):
    queryset = Revendedor.objects.all()
    serializer_class = RevendedorSerializer
    lookup_field_name = "rev_codi"
    pagination_class = None
    
    def get_serializer_context(self):
        """Pasar request al contexto del serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['post'])
    def login(self, request):
        clave = request.data.get('clave')

        if not clave:
            return Response({'error': 'Clave requerida'}, status=400)

        for r in Revendedor.objects.filter(rev_actv=True):
            if r.rev_clav and check_password(clave, r.rev_clav):
                # Usar el serializer para obtener todos los datos incluyendo rev_logo_url
                serializer = RevendedorSerializer(r, context={'request': request})
                return Response({
                    "success": True,
                    "revendedor": {
                        "id": r.rev_codi,
                        "nombre": r.rev_nomb,
                        "destino": r.rev_dest or 0,
                        "direccion": r.rev_dire or "",
                        "telefono": r.rev_tele or "",
                        "celular": "",
                        "email": r.rev_emai or "",
                        "rev_logo_url": serializer.data.get('rev_logo_url')
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
    filterset_fields = ['rev_codi', 'ped_exp']
    ordering_fields = ['pov_codi', 'pov_fech', '-pov_codi']
    ordering = ['-pov_codi']
    
    def update(self, request, *args, **kwargs):
        """
        Validar que no se modifiquen pedidos ya exportados.
        Si ped_exp=True, retornar 400 Bad Request.
        """
        instance = self.get_object()
        
        if instance.ped_exp:
            return Response(
                {
                    'error': 'No se puede modificar un pedido que ya fue exportado',
                    'ped_exp': instance.ped_exp,
                    'ped_fexp': instance.ped_fexp
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Continuar con la actualización normal
        return super().update(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def marcar_exportados(self, request):
        """
        Marcar pedidos como exportados a GeneXus.
        
        POST /api/gestion/pedidos/marcar_exportados/
        
        Body (JSON):
        {
            "pov_codis": [1, 2, 3]  // Lista de códigos de pedidos a marcar
        }
        
        Response:
        {
            "success": true,
            "message": "3 pedidos marcados como exportados",
            "updated_count": 3,
            "timestamp": "2026-04-15T12:30:45.123Z"
        }
        """
        from django.utils import timezone
        
        pov_codis = request.data.get('pov_codis', [])
        
        # Validaciones
        if not pov_codis:
            return Response(
                {'error': 'Se requiere lista de pov_codis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(pov_codis, list):
            return Response(
                {'error': 'pov_codis debe ser una lista de enteros'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            pov_codis = [int(x) for x in pov_codis]
        except (ValueError, TypeError):
            return Response(
                {'error': 'pov_codis debe contener solo enteros'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Actualizar pedidos no exportados
        updated_count = Pedidos.objects.filter(
            pov_codi__in=pov_codis,
            ped_exp=False  # Solo los que NO fueron exportados aún
        ).update(
            ped_exp=True,
            ped_fexp=timezone.now()
        )
        
        return Response({
            'success': True,
            'message': f'{updated_count} pedidos marcados como exportados',
            'updated_count': updated_count,
            'timestamp': timezone.now().isoformat()
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def generar_garantia(self, request, pk=None):
        """
        Genera un documento de garantía relleno con datos del pedido.
        
        GET /api/gestion/pedidos/{id}/generar_garantia/
        
        Response: Archivo Word descargable
        
        Requisitos:
        - El pedido debe tener artículo asignado con marca válida
        - Debe existir archivo de garantía para esa marca
        """
        from garantias.garantias_service import (
            rellenar_garantia,
            generar_nombre_archivo
        )
        from urllib.parse import quote
        import logging
        
        logger = logging.getLogger(__name__)
        
        try:
            # Obtener pedido con relaciones necesarias cargadas
            pedido = self.queryset.select_related(
                'pov_arti',
                'pov_arti__mar_codi'
            ).get(pk=pk)
            
            logger.info(f"Procesando garantía para pedido {pedido.pov_codi}")
            
            # Validar que tenga artículo
            if not pedido.pov_arti:
                return Response(
                    {'error': 'El pedido no tiene vehículo asignado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validar que tenga marca
            if not pedido.pov_arti.mar_codi_id:
                return Response(
                    {'error': 'El pedido no tiene marca de vehículo asignada'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generar documento Word relleno - ahora retorna (doc, marca_nombre)
            doc_bytes, marca_nombre = rellenar_garantia(pedido)
            
            # Generar nombre del archivo con la marca
            nombre_archivo = generar_nombre_archivo(pedido, marca_nombre)
            
            logger.info(f"Generando archivo: {nombre_archivo}")
            
            # Devolver archivo para descargar con nombre correcto
            response = FileResponse(
                doc_bytes,
                content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            
            # Codificar el nombre del archivo correctamente para el header
            # Usar RFC 5987 para máxima compatibilidad
            nombre_encoded = quote(nombre_archivo, safe='')
            response['Content-Disposition'] = f'attachment; filename="{nombre_archivo}"; filename*=UTF-8\'\'{nombre_encoded}'
            
            logger.info(f"Content-Disposition header: {response['Content-Disposition']}")
            
            return response
            
        except Pedidos.DoesNotExist:
            return Response(
                {'error': f'Pedido {pk} no encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            logger.error(f"Error generando garantía: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.exception(f"Error inesperado generando garantía: {str(e)}")
            return Response(
                {'error': f'Error al generar garantía: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


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
# FILTROS PERSONALIZADOS
# ================================================================
class FiltroRevendedorViewSet(BaseViewSet):
    """API para gestionar filtros personalizados por revendedor"""
    queryset = FiltroRevendedor.objects.all()
    serializer_class = FiltroRevendedorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['rev_codi']
    search_fields = ['fr_nomb', 'fr_tipo']
    
    def get_queryset(self):
        """Filtrar por revendedor si se especifica en query params"""
        queryset = super().get_queryset()
        rev_codi = self.request.query_params.get('rev_codi')
        if rev_codi:
            queryset = queryset.filter(rev_codi=rev_codi)
        return queryset
    
    def perform_create(self, serializer):
        """Crear filtro: validar que pertenezca al revendedor logueado"""
        rev_codi = serializer.validated_data.get('rev_codi')
        # En producción, agregar validación: rev_codi debe ser del usuario logueado
        serializer.save()
    
    def perform_update(self, serializer):
        """Actualizar filtro: validar permisos"""
        instance = self.get_object()
        # Validar que el filtro pertenezca al revendedor solicitante
        rev_codi = self.request.query_params.get('rev_codi')
        if rev_codi and int(rev_codi) != instance.rev_codi.rev_codi:
            return Response({'error': 'No tienes permiso para editar este filtro'}, status=403)
        serializer.save()
    
    def perform_destroy(self, instance):
        """Eliminar filtro: validar permisos"""
        # Validar que el filtro pertenezca al revendedor solicitante
        rev_codi = self.request.query_params.get('rev_codi')
        if rev_codi and int(rev_codi) != instance.rev_codi.rev_codi:
            return Response({'error': 'No tienes permiso para eliminar este filtro'}, status=403)
        instance.delete()
    
    @action(detail=True, methods=['get'])
    def valores(self, request, pk=None):
        """GET /filtros-revendedor/{id}/valores/ - Retorna todos los valores únicos de este filtro"""
        filtro = self.get_object()
        valores_unicos = filtro.valores_stock.values_list('vfs_valor', flat=True).distinct().order_by('vfs_valor')
        return Response({'filtro_codi': filtro.fr_codi, 'filtro_nombre': filtro.fr_nomb, 'valores': list(valores_unicos)})


class ValorFiltroStockViewSet(BaseViewSet):
    """API para gestionar valores de filtros asociados a stock"""
    queryset = ValorFiltroStock.objects.all()
    serializer_class = ValorFiltroStockSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['stk_codi', 'fr_codi']
    
    def get_queryset(self):
        """Filtrar por stock o por filtro si se especifica"""
        queryset = super().get_queryset()
        stk_codi = self.request.query_params.get('stk_codi')
        fr_codi = self.request.query_params.get('fr_codi')
        
        if stk_codi:
            queryset = queryset.filter(stk_codi=stk_codi)
        if fr_codi:
            queryset = queryset.filter(fr_codi=fr_codi)
            
        return queryset


# ================================================================
# STOCK SIMPLE (LISTA GENERAL SIN FILTROS)
# ================================================================
class StockListViewSet(viewsets.ReadOnlyModelViewSet):
    """API simple para listar TODO el stock - GET /stock/"""
    queryset = Stock.objects.all()
    serializer_class = StockListSimpleSerializer
    pagination_class = None
    lookup_field = 'stk_codi'
    
    @action(detail=False, methods=['get'])
    def total(self, request):
        """GET /stock-all/total/ - Retorna la cantidad total de items en stock"""
        count = self.get_queryset().count()
        return Response({'total': count})


# ================================================================
# LOGOS
# ================================================================
@api_view(['GET'])
def get_revendedor_logo(request, pk):
    """GET /revendedores/{id}/logo/ - Retorna la imagen del logo del revendedor"""
    try:
        r = Revendedor.objects.get(rev_codi=pk)
    except Revendedor.DoesNotExist:
        return Response(status=204)  # No content - sin error

    if not r.rev_logo:
        return Response(status=204)  # No content - sin error, simplemente no tiene logo

    try:
        # Retornar la imagen como FileResponse
        return FileResponse(r.rev_logo.open('rb'), content_type='image/jpeg')
    except Exception as e:
        return Response({'error': f'Error al obtener logo: {str(e)}'}, status=500)


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

    # Retornar el revendedor serializado con la URL del logo
    serializer = RevendedorSerializer(r, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


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

    # Retornar el revendedor serializado (sin logo)
    serializer = RevendedorSerializer(r, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


# ================================================================
#  IMPORTADOR GLOBAL de stkm, articulo y rev
# ================================================================
#nuevo 
@api_view(['POST'])
def importar_datos(request):
    data = request.data

    MODELOS = {
        "articulos": (Articulos, "art_codi"),
        "stock": (Stock, "art_codi"),
        "revendedores": (Revendedor, "rev_codi"),
        "rubros": (Rubro, "rub_codi"),
        "subrubros": (Subrubro, "sru_codi"),
        "colores": (Color, "col_codi"),
        "marcas": (Marca, "mar_codi"),
        "localidades": (Localidad, "loc_codi"),
    }

    resultados = {}

    try:
        with transaction.atomic():

            for key, (model, lookup) in MODELOS.items():
                items = data.get(key, [])

                resultados[key] = {
                    "total": len(items),
                    "ok": 0,
                    "error": 0,
                    "detalle": []
                }

                for item in items:
                    try:
                        data_item = item.copy()

                        # =========================
                        # NORMALIZAR VACÍOS → NULL
                        # =========================
                        data_item = {
                            k: (None if v == "" else v)
                            for k, v in data_item.items()
                        }

                        # =========================
                        # CONVERTIR FK → *_id
                        # =========================
                        for field in model._meta.fields:
                            if field.is_relation and field.many_to_one:
                                fk_name = field.name
                                if fk_name in data_item:
                                    data_item[f"{fk_name}_id"] = data_item.pop(fk_name)

                        # =====================================================
                        # 🔥 ARTICULOS
                        # =====================================================
                        if key == "articulos":

                            art_codi_id = data_item.get("art_codi") or data_item.get("art_codi_id")

                            if art_codi_id is None:
                                resultados[key]["error"] += 1
                                resultados[key]["detalle"].append({
                                    "error": "Falta art_codi",
                                    "data": item
                                })
                                continue

                            data_item.pop("art_codi", None)
                            data_item.pop("art_codi_id", None)

                            obj, created = model.objects.update_or_create(
                                art_codi=art_codi_id,
                                defaults=data_item
                            )

                            resultados[key]["ok"] += 1
                            continue

                        # =====================================================
                        # 🔥 STOCK
                        # =====================================================
                        if key == "stock":

                            art_codi_id = data_item.get("art_codi_id")
                            art_ncha = data_item.get("art_ncha")
                            art_nmot = data_item.get("art_nmot")
                            art_ncer = data_item.get("art_ncer")

                            if not all([art_codi_id, art_ncha, art_nmot, art_ncer]):
                                resultados[key]["error"] += 1
                                resultados[key]["detalle"].append({
                                    "error": "Faltan campos clave",
                                    "data": item
                                })
                                continue

                            lookup_filter = {
                                "art_codi_id": art_codi_id,
                                "art_ncha": art_ncha,
                                "art_nmot": art_nmot,
                                "art_ncer": art_ncer
                            }

                            obj, created = model.objects.update_or_create(
                                **lookup_filter,
                                defaults=data_item
                            )

                            resultados[key]["ok"] += 1
                            continue

                        # =====================================================
                        # 🔥 REVendedores (NUEVO - CORRECTO)
                        # =====================================================
                        if key == "revendedores":

                            lookup_value = data_item.get("rev_codi")

                            if lookup_value is None:
                                resultados[key]["error"] += 1
                                continue

                            clave = data_item.pop("rev_clav", None)

                            print("CLAVE RECIBIDA:", clave)  # 👈 DEBUG

                            obj, created = model.objects.update_or_create(
                                rev_codi=lookup_value,
                                defaults=data_item
                            )

                            print("ANTES:", obj.rev_clav)  # 👈 DEBUG

                            if clave:
                                obj.set_password(clave)
                                obj.save()
                                print("DESPUES:", obj.rev_clav)  # 👈 DEBUG
                            else:
                                print("NO ENTRO AL IF")  # 👈 DEBUG

                            resultados[key]["ok"] += 1
                            continue

                        # =====================================================
                        # 🔥 RESTO
                        # =====================================================
                        lookup_value = data_item.get(lookup) or data_item.get(f"{lookup}_id")

                        if lookup_value is None:
                            resultados[key]["error"] += 1
                            resultados[key]["detalle"].append({
                                "error": f"Falta campo {lookup}",
                                "data": item
                            })
                            continue

                        lookup_field = f"{lookup}_id" if any(
                            f.name == lookup and f.is_relation
                            for f in model._meta.fields
                        ) else lookup

                        data_item.pop(lookup, None)
                        data_item.pop(f"{lookup}_id", None)

                        obj, created = model.objects.update_or_create(
                            **{lookup_field: lookup_value},
                            defaults=data_item
                        )

                        resultados[key]["ok"] += 1

                    except Exception as e:
                        resultados[key]["error"] += 1
                        resultados[key]["detalle"].append({
                            "error": str(e),
                            "data": item
                        })

        return Response({
            "success": True,
            "resultados": resultados
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            "success": False,
            "error": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#modifique tood el importar_datos 

# ================================================================
# IMPORTAR DATOS (PDFs - Cuentas Bancarias y Financiera)
# ================================================================
class ImportarDatosViewSet(BaseViewSet):
    """ViewSet para importar archivos PDF (cuentas bancarias, datos financieros, etc.)"""
    queryset = ImportarDatos.objects.all()
    serializer_class = ImportarDatosSerializer
    parser_classes = (MultiPartParser, FormParser)
    lookup_field = 'imp_codi'
    pagination_class = None

    def get_queryset(self):
        """Retorna los registros ordenados por fecha de creación descendente"""
        return ImportarDatos.objects.all().order_by('-imp_fcre')

    @action(detail=False, methods=['post'], parser_classes=(MultiPartParser, FormParser))
    def upload(self, request):
        """
        POST /api/importar-datos/upload/
        Permite subir archivos PDF.
        
        Body (form-data):
        - imp_dato1: File (PDF) - Cuentas Bancarias
        - imp_dato2: File (PDF) - Datos Financiera
        - imp_dato3: File (optional)
        - imp_dato4: File (optional)
        - imp_dato5: File (optional)
        """
        try:
            # Crear nuevo registro
            obj = ImportarDatos.objects.create()
            
            # Actualizar archivos
            for field in ['imp_dato1', 'imp_dato2', 'imp_dato3', 'imp_dato4', 'imp_dato5']:
                if field in request.FILES:
                    setattr(obj, field, request.FILES[field])
            
            obj.save()
            
            serializer = ImportarDatosSerializer(obj)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response(
                {'error': f'Error al subir archivos: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['delete'])
    def delete_file(self, request, imp_codi=None):
        """
        DELETE /api/importar-datos/{id}/delete_file/?file=imp_dato1
        Elimina un archivo específico.
        
        Query params:
        - file: imp_dato1, imp_dato2, imp_dato3, imp_dato4 o imp_dato5
        """
        try:
            obj = self.get_object()
            file_field = request.query_params.get('file')
            
            if not file_field or file_field not in ['imp_dato1', 'imp_dato2', 'imp_dato3', 'imp_dato4', 'imp_dato5']:
                return Response(
                    {'error': 'Parámetro "file" inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Eliminar el archivo
            field_obj = getattr(obj, file_field)
            if field_obj:
                field_obj.delete()
                setattr(obj, file_field, None)
                obj.save()
            
            serializer = ImportarDatosSerializer(obj)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response(
                {'error': f'Error al eliminar archivo: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def ultima_importacion(self, request):
        """
        GET /api/importar-datos/ultima_importacion/
        Retorna el registro más reciente de importación
        """
        try:
            obj = ImportarDatos.objects.latest('imp_fcre')
            serializer = ImportarDatosSerializer(obj)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ImportarDatos.DoesNotExist:
            return Response({'error': 'No hay importaciones'}, status=status.HTTP_404_NOT_FOUND)
