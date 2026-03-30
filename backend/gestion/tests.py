from django.test import TestCase
from .models import Provincia, Localidad, Articulo, Clientes, Pedidos


class ProvinciaTestCase(TestCase):
    def setUp(self):
        self.provincia = Provincia.objects.create(
            nombre="Buenos Aires",
            codigo="BA"
        )

    def test_provincia_creation(self):
        """Test que la provincia se crea correctamente"""
        self.assertEqual(self.provincia.nombre, "Buenos Aires")
        self.assertTrue(self.provincia.is_active)


class ArticuloTestCase(TestCase):
    def setUp(self):
        self.articulo = Articulo.objects.create(
            nombre="Cadena de Moto",
            codigo="CADENA001",
            precio=150.00
        )

    def test_articulo_creation(self):
        """Test que el artículo se crea correctamente"""
        self.assertEqual(self.articulo.nombre, "Cadena de Moto")
        self.assertEqual(self.articulo.precio, 150.00)
