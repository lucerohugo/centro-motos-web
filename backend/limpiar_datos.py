#!/usr/bin/env python
"""
Script para limpiar tablas de datos importados desde DBF
Elimina en orden inverso de dependencias para respetar FK relationships
"""
import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from gestion.models import (
    Pedidos, Stock, ConfirmacionVenta, Articulos, 
    Revendedor, Clientes, Subrubro, Rubro, Marca,
    Color, Comprobante, CondicionIva, Localidad, Provincia
)

MODELOS = [
    ("Pedidos", Pedidos),
    ("Stock", Stock),
    ("ConfirmacionVenta", ConfirmacionVenta),
    ("Articulos", Articulos),
    ("Revendedor", Revendedor),
    ("Clientes", Clientes),
    ("Subrubro", Subrubro),
    ("Rubro", Rubro),
    ("Marca", Marca),
    ("Color", Color),
    ("Comprobante", Comprobante),
    ("CondicionIva", CondicionIva),
    ("Localidad", Localidad),
    ("Provincia", Provincia),
]

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🗑️  LIMPIADOR DE DATOS IMPORTADOS")
    print("="*70)
    
    # Contar antes de limpiar
    print(f"\n📊 Registros actuales:")
    totales = {}
    for nombre, modelo in MODELOS:
        count = modelo.objects.count()
        totales[nombre] = count
        if count > 0:
            print(f"  • {nombre}: {count}")
    
    total_registros = sum(totales.values())
    print(f"\n  📌 Total: {total_registros} registros")
    
    if total_registros == 0:
        print("\n✅ Las tablas ya están vacías")
        print("="*70 + "\n")
        exit()
    
    respuesta = input("\n⚠️  ¿Deseas limpiar TODOS estos datos? (escribe 's' para confirmar): ").lower().strip()
    
    if respuesta != 's':
        print("\n❌ Operación cancelada")
        print("="*70 + "\n")
        exit()
    
    print("\n🔄 Limpiando tablas en orden de dependencias...")
    
    try:
        for nombre, modelo in MODELOS:
            count = modelo.objects.count()
            if count > 0:
                eliminados = modelo.objects.all().delete()[0]
                print(f"  ✅ {nombre}: {eliminados} registros eliminados")
            else:
                print(f"  ⊘ {nombre}: ya estaba vacía")
        
        # Verificar que quedaron vacías
        print(f"\n📊 Registros finales:")
        todos_vacios = True
        for nombre, modelo in MODELOS:
            count = modelo.objects.count()
            if count > 0:
                print(f"  • {nombre}: {count}")
                todos_vacios = False
        
        if todos_vacios:
            print("  ✅ Todas las tablas están vacías")
        
        print("\n" + "="*70)
        print("✅ LIMPIEZA COMPLETADA")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error al limpiar: {e}")
        import traceback
        traceback.print_exc()
        print("="*70 + "\n")
