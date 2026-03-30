#!/usr/bin/env python
"""Debug script para inspeccionar estructura de archivos DBF"""

import os
from dbfread import DBF

DBF_PATH = os.path.join(os.path.dirname(__file__), 'centro-motos-dbf')

def debug_archivo(nombre):
    """Inspecciona un archivo DBF"""
    archivo = os.path.join(DBF_PATH, nombre)
    if not os.path.exists(archivo):
        print(f"❌ Archivo no existe: {archivo}")
        return
    
    print(f"\n📋 Inspeccionando: {nombre}")
    print(f"📍 Ruta: {archivo}")
    
    try:
        tabla = DBF(archivo, encoding='latin-1')
        
        print(f"✅ Se abrió exitosamente")
        print(f"📊 Campo names (tipo {type(tabla.field_names)}):")
        for field in tabla.field_names:
            print(f"   - {repr(field)} (tipo {type(field).__name__})")
        
        print(f"\n📝 Primer registro (si existe):")
        for i, reg in enumerate(tabla):
            if i == 0:
                print(f"   Tipo de registro: {type(reg)}")
                print(f"   Claves disponibles:")
                # Intenta acceder de varias formas
                if hasattr(reg, '_data'):
                    print(f"      _data: {reg._data}")
                
                # Intenta acceso por nombre de campo (string)
                for field_name in tabla.field_names:
                    try:
                        valor = reg[field_name]
                        print(f"      reg['{field_name}'] = {repr(valor)}")
                    except KeyError:
                        pass
                
                # Intenta acceso como atributo
                print(f"\n   Intentando acceso como atributo:")
                for field_name in tabla.field_names[:3]:  # Solo los 3 primeros
                    try:
                        valor = getattr(reg, field_name, "NO EXISTE")
                        print(f"      reg.{field_name} = {repr(valor)}")
                    except:
                        pass
            if i >= 0:  # Solo el primero
                break
        
        print(f"\n📊 Total de registros: {len(tabla)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

# Probar varios archivos
print("🚀 INICIANDO DEBUG DE ARCHIVOS DBF")
print(f"📁 Ruta base: {DBF_PATH}")

debug_archivo('PCIA.DBF')
debug_archivo('LOCA.DBF')
debug_archivo('MARC.DBF')
