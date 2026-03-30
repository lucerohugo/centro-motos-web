from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProvinciaViewSet, LocalidadViewSet,
    MarcaViewSet, RubroViewSet, SubrubroViewSet, ColorViewSet, ComprobanteViewSet,
    RevendedorViewSet, ClientesViewSet, ArticuloViewSet,
    UsuarioViewSet, PedidosViewSet, CondicionIvaViewSet, StockViewSet,
    ConfirmacionVentaViewSet, GeneralViewSet,
    upload_revendedor_logo, delete_revendedor_logo
)

# Router REST
router = DefaultRouter()

# Ubicaciones geográficas
router.register(r'provincias', ProvinciaViewSet, basename='provincia')
router.register(r'localidades', LocalidadViewSet, basename='localidad')

# Configuración fiscal
router.register(r'condicion-iva', CondicionIvaViewSet, basename='condicion-iva')

# Catálogo de productos
router.register(r'marcas', MarcaViewSet, basename='marca')
router.register(r'rubros', RubroViewSet, basename='rubro')
router.register(r'subrubros', SubrubroViewSet, basename='subrubro')
router.register(r'colores', ColorViewSet, basename='color')
router.register(r'comprobantes', ComprobanteViewSet, basename='comprobante')
router.register(r'articulos', ArticuloViewSet, basename='articulo')

# Inventario
router.register(r'stock', StockViewSet, basename='stock')

# Ventas
router.register(r'confirmacion-venta', ConfirmacionVentaViewSet, basename='confirmacion-venta')

# Personas
router.register(r'revendedores', RevendedorViewSet, basename='revendedor')
router.register(r'clientes', ClientesViewSet, basename='cliente')

# Pedidos
router.register(r'pedidos', PedidosViewSet, basename='pedido')

# Configuración
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'general', GeneralViewSet, basename='general')

urlpatterns = [
    path('', include(router.urls)),
    # Rutas explícitas para upload/delete de logo
    path('revendedores/<int:pk>/upload-logo/', upload_revendedor_logo, name='upload-logo'),
    path('revendedores/<int:pk>/delete-logo/', delete_revendedor_logo, name='delete-logo'),
]
