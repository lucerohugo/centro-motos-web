from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProvinciaViewSet, LocalidadViewSet,
    MarcaViewSet, RubroViewSet, SubrubroViewSet, ColorViewSet, ComprobanteViewSet,
    RevendedorViewSet, ClientesViewSet, ArticuloViewSet,
    UsuarioViewSet, PedidosViewSet, CondicionIvaViewSet, StockViewSet, StockListViewSet,
    ConfirmacionVentaViewSet, GeneralViewSet, FiltroRevendedorViewSet, ValorFiltroStockViewSet,
    ImportarDatosViewSet,
    importar_datos, get_revendedor_logo, upload_revendedor_logo, delete_revendedor_logo
)

# 👇 CLAVE: agregar trailing_slash opcional
router = DefaultRouter(trailing_slash='/?')

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
router.register(r'stock-all', StockListViewSet, basename='stock-all')

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

# Filtros personalizados
router.register(r'filtros-revendedor', FiltroRevendedorViewSet, basename='filtro-revendedor')
router.register(r'valores-filtro-stock', ValorFiltroStockViewSet, basename='valor-filtro-stock')

# Importar datos (PDFs)
router.register(r'importar-datos', ImportarDatosViewSet, basename='importar-datos')

urlpatterns = [
    path('', include(router.urls)),

    path('revendedores/<int:pk>/logo/', get_revendedor_logo, name='get-logo'),
    path('revendedores/<int:pk>/upload-logo/', upload_revendedor_logo, name='upload-logo'),
    path('revendedores/<int:pk>/delete-logo/', delete_revendedor_logo, name='delete-logo'),
    path('importar/', importar_datos, name='importar-datos'),
]