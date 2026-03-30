#!/usr/bin/env python
"""
Script para RESETEAR todo el sistema de datos y volver a cargar desde DBF
Ejecutar: python reset_y_cargar.py

Este script:
1. Borra TODOS los datos en orden inverso de dependencias (FKs)
2. Vuelve a cargar todo desde los archivos DBF
3. Es seguro ejecutar varias veces - no carga duplicados
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from dbfread import DBF
from decimal import Decimal
from gestion.models import (
    Provincia, Localidad, Marca, Rubro, Subrubro, Color,
    Comprobante, CondicionIva, Articulos, Revendedor,
    Stock, ConfirmacionVenta, Clientes, Pedidos, General
)

DBF_PATH = os.path.join(os.path.dirname(__file__), 'centro-motos-dbf')

def encontrar_archivo(nombres):
    """Busca archivo sin importar mayúsculas"""
    if not os.path.exists(DBF_PATH):
        return None
    
    archivos_dir = {f.lower(): f for f in os.listdir(DBF_PATH)}
    for nombre in nombres:
        if nombre.lower() in archivos_dir:
            return os.path.join(DBF_PATH, archivos_dir[nombre.lower()])
    return None

# ================================================================
# PARTE 1: LIMPIAR DATOS (en orden inverso de FKs)
# ================================================================

def limpiar_datos():
    """Elimina todos los datos en orden inverso de dependencias"""
    print("\n" + "="*80)
    print("🗑️  BORRANDO TODOS LOS DATOS")
    print("="*80)
    
    # Orden INVERSO de dependencias (eliminar lo que depende antes)
    modelos_a_limpiar = [
        ("Pedidos", Pedidos),
        ("Stock", Stock),
        ("ConfirmacionVenta", ConfirmacionVenta),
        ("Articulos", Articulos),
        ("Subrubro", Subrubro),
        ("Rubro", Rubro),
        ("Marca", Marca),
        ("Revendedor", Revendedor),
        ("Localidad", Localidad),
        ("Provincia", Provincia),
        ("Color", Color),
        ("CondicionIva", CondicionIva),
        ("Comprobante", Comprobante),
        ("Clientes", Clientes),
    ]
    
    for nombre, modelo in modelos_a_limpiar:
        count = modelo.objects.count()
        if count > 0:
            modelo.objects.all().delete()
            print(f"  ✅ {nombre}: {count} registros eliminados")
        else:
            print(f"  ⊘ {nombre}: ya estaba vacía")
    
    print("\n✅ Limpieza completada\n")

# ================================================================
# PARTE 2: CARGAR DATOS (en orden de dependencias)
# ================================================================

def cargar_provincias():
    print("📍 Cargando PROVINCIAS...")
    archivo = encontrar_archivo(['PCIA.DBF', 'pcia.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            pci_codi = int(reg['PCI_CODI'])
            pci_nomb = str(reg['PCI_NOMB']).strip()
            
            if pci_codi and pci_nomb:
                obj, created = Provincia.objects.get_or_create(
                    pci_codi=pci_codi,
                    defaults={'pci_nomb': pci_nomb}
                )
                if created:
                    creados += 1
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creadas")
    return creados

def cargar_localidades():
    print("🏙️  Cargando LOCALIDADES...")
    archivo = encontrar_archivo(['LOCA.DBF', 'loca.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            loc_codi = int(reg['LOC_CODI'])
            loc_nomb = str(reg['LOC_NOMB']).strip() if reg['LOC_NOMB'] else ''
            pci_codi = int(reg['PCI_CODI'])
            loc_cpos = str(reg['LOC_CPOS']).strip() if reg['LOC_CPOS'] else None
            
            if loc_codi and pci_codi:
                try:
                    provincia = Provincia.objects.get(pci_codi=pci_codi)
                    obj, created = Localidad.objects.get_or_create(
                        loc_codi=loc_codi,
                        defaults={
                            'loc_nomb': loc_nomb,
                            'loc_cpos': loc_cpos,
                            'pci_codi': provincia
                        }
                    )
                    if created:
                        creados += 1
                except Provincia.DoesNotExist:
                    pass
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creadas")
    return creados

def cargar_marcas():
    print("🏷️  Cargando MARCAS...")
    archivo = encontrar_archivo(['MARC.DBF', 'marc.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            mar_codi = int(reg['MAR_CODI'])
            mar_nomb = str(reg['MAR_NOMB']).strip() if reg['MAR_NOMB'] else ''
            
            if mar_codi and mar_nomb:
                obj, created = Marca.objects.get_or_create(
                    mar_codi=mar_codi,
                    defaults={'mar_nomb': mar_nomb}
                )
                if created:
                    creados += 1
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creadas")
    return creados

def cargar_rubros():
    print("📂 Cargando RUBROS...")
    archivo = encontrar_archivo(['RUBR.DBF', 'rubr.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            rub_codi = int(reg['RUB_CODI'])
            rub_nomb = str(reg['RUB_NOMB']).strip() if reg['RUB_NOMB'] else ''
            
            if rub_codi and rub_nomb:
                marca = Marca.objects.first()
                if not marca:
                    marca = Marca.objects.create(mar_codi=1, mar_nomb="DEFAULT")
                
                obj, created = Rubro.objects.get_or_create(
                    rub_codi=rub_codi,
                    defaults={'rub_nomb': rub_nomb, 'mar_codi': marca}
                )
                if created:
                    creados += 1
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creados")
    return creados

def cargar_subrubros():
    print("📋 Cargando SUBRUBROS...")
    archivo = encontrar_archivo(['SRUB.DBF', 'srub.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            sru_codi = int(reg['SRU_CODI'])
            sru_nomb = str(reg['SRU_NOMB']).strip() if reg['SRU_NOMB'] else ''
            rub_codi = int(reg['RUB_CODI'])
            
            if sru_codi and sru_nomb and rub_codi:
                try:
                    rubro = Rubro.objects.get(rub_codi=rub_codi)
                    obj, created = Subrubro.objects.get_or_create(
                        sru_codi=sru_codi,
                        defaults={'sru_nomb': sru_nomb, 'sru_rubr': rubro}
                    )
                    if created:
                        creados += 1
                except Rubro.DoesNotExist:
                    pass
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creados")
    return creados

def cargar_colores():
    print("🎨 Cargando COLORES...")
    archivo = encontrar_archivo(['COLO.DBF', 'colo.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            col_codi = int(reg['COL_CODI'])
            col_nomb = str(reg['COL_NOMB']).strip() if reg['COL_NOMB'] else ''
            
            if col_codi and col_nomb:
                obj, created = Color.objects.get_or_create(
                    col_codi=col_codi,
                    defaults={'col_nomb': col_nomb}
                )
                if created:
                    creados += 1
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creados")
    return creados

def cargar_comprobantes():
    print("📄 Cargando COMPROBANTES...")
    archivo = encontrar_archivo(['COMP.DBF', 'comp.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            com_nomb = str(reg['COM_NOMB']).strip() if reg['COM_NOMB'] else ''
            com_letr = str(reg.get('COM_LETR', '')).strip() or None
            com_abre = str(reg.get('COM_ABRE', '')).strip() or None
            
            if com_nomb:
                Comprobante.objects.create(
                    com_nomb=com_nomb,
                    com_letr=com_letr,
                    com_abre=com_abre,
                    com_deha=reg.get('COM_DEHA') or None,
                    com_unum=reg.get('COM_UNUM') or None,
                    com_afip=str(reg.get('COM_AFIP', '')).strip() or None,
                    com_fele=reg.get('COM_FELE') or None,
                )
                creados += 1
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creados")
    return creados

def cargar_condiciones_iva():
    print("💰 Cargando CONDICIONES IVA...")
    archivo = encontrar_archivo(['CIVA.DBF', 'civa.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            civ_codi = int(reg['CIV_CODI'])
            civ_nomb = str(reg['CIV_NOMB']).strip() if reg['CIV_NOMB'] else ''
            
            if civ_codi and civ_nomb:
                obj, created = CondicionIva.objects.get_or_create(
                    civ_codi=civ_codi,
                    defaults={'civ_nomb': civ_nomb}
                )
                if created:
                    creados += 1
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creadas")
    return creados

def cargar_articulos():
    print("📦 Cargando ARTÍCULOS...")
    archivo = encontrar_archivo(['ARBI.DBF', 'arbi.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            art_codi = int(reg['ART_CODI'])
            art_nomb = str(reg['ART_NOMB']).strip() if reg['ART_NOMB'] else ''
            mar_codi = int(reg.get('MAR_CODI', 0) or 0)
            rub_codi = int(reg.get('RUB_CODI', 0) or 0)
            
            art_prec = reg.get('ART_PREC')
            if art_prec and str(art_prec).strip() != '':
                try:
                    art_prec = Decimal(str(art_prec))
                except:
                    art_prec = None
            else:
                art_prec = None
            
            if art_codi and art_nomb:
                try:
                    marca = None
                    rubro = None
                    
                    if mar_codi:
                        marca = Marca.objects.get(mar_codi=mar_codi)
                    if rub_codi:
                        rubro = Rubro.objects.get(rub_codi=rub_codi)
                    
                    obj, created = Articulos.objects.get_or_create(
                        art_codi=art_codi,
                        defaults={
                            'art_nomb': art_nomb,
                            'mar_codi': marca,
                            'rub_codi': rubro,
                            'art_prec': art_prec
                        }
                    )
                    if created:
                        creados += 1
                except (Marca.DoesNotExist, Rubro.DoesNotExist):
                    pass
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creados")
    return creados

def cargar_revendedores():
    print("🎨 Cargando REVENDEDORES...")
    archivo = encontrar_archivo(['REVE.DBF', 'reve.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            rev_codi = int(reg['REV_CODI'])
            rev_nomb = str(reg['REV_NOMB']).strip() if reg['REV_NOMB'] else ''
            rev_dire = str(reg.get('REV_DIRE', '')).strip() if reg.get('REV_DIRE') else ''
            rev_tele = str(reg.get('REV_TELE', '')).strip() if reg.get('REV_TELE') else ''
            rev_clav = str(reg.get('REV_CLAV', '')).strip() if reg.get('REV_CLAV') else ''
            loc_codi = int(reg.get('LOC_CODI', 0) or 0)
            
            rev_porc = reg.get('REV_PORC')
            if rev_porc and str(rev_porc).strip() != '':
                try:
                    rev_porc = Decimal(str(rev_porc))
                except:
                    rev_porc = None
            else:
                rev_porc = None
            
            if rev_codi and rev_nomb:
                try:
                    localidad = None
                    if loc_codi:
                        localidad = Localidad.objects.get(loc_codi=loc_codi)
                    
                    obj, created = Revendedor.objects.get_or_create(
                        rev_codi=rev_codi,
                        defaults={
                            'rev_nomb': rev_nomb,
                            'rev_dire': rev_dire,
                            'rev_tele': rev_tele,
                            'rev_clav': rev_clav,
                            'rev_porc': rev_porc,
                            'loc_codi': localidad
                        }
                    )
                    if created:
                        creados += 1
                except Localidad.DoesNotExist:
                    pass
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creados")
    return creados


def cargar_stock():
    print("📦 Cargando STOCK desde STKM.DBF...")
    archivo = encontrar_archivo(['STKM.DBF', 'stkm.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            art_codi_val = reg.get('ART_CODI')
            if not art_codi_val:
                continue
            
            try:
                articulo = Articulos.objects.get(art_codi=int(art_codi_val))
            except Articulos.DoesNotExist:
                continue
            
            color = None
            col_codi_val = reg.get('COL_CODI')
            if col_codi_val:
                try:
                    color = Color.objects.get(col_codi=int(col_codi_val))
                except Color.DoesNotExist:
                    pass
            
            Stock.objects.create(
                art_codi=articulo,
                col_codi=color,
                art_ncha=(str(reg.get('ART_NCHA', '')).strip() or None),
                art_ncer=(str(reg.get('ART_NCER', '')).strip() or None),
                art_nmot=(str(reg.get('ART_NMOT', '')).strip() or None),
                art_mode=reg.get('ART_MODE') or None,
                art_fing=reg.get('ART_FING') or None,
                art_orco=reg.get('ART_ORCO') or None,
                art_tall=(str(reg.get('ART_TALL', '')).strip() or None),
                art_dest=reg.get('ART_DEST') or None,
                art_codv=reg.get('ART_CODV') or None,
                art_codc=reg.get('ART_CODC') or None,
                art_usad=(str(reg.get('ART_USAD', '')).strip() or None),
                art_prem=reg.get('ART_PREM') or None,
                art_cobr=reg.get('ART_COBR') or None,
                art_cntr=(str(reg.get('ART_CNTR', '')).strip() or None),
                art_fcde=reg.get('ART_FCDE') or None,
                art_sucd=reg.get('ART_SUCD') or None,
                art_desa=reg.get('ART_DESA') or None,
                art_bdis=(str(reg.get('ART_BDIS', '')).strip() or None),
            )
            creados += 1
        except Exception as e:
            pass
    
    print(f"  ✅ {creados}/{len(tabla)} creados")
    return creados

def cargar_pedidos():
    print("\ud83d\udcdd Cargando PEDIDOS desde POVT.DBF...")
    archivo = encontrar_archivo(['POVT.DBF', 'povt.dbf'])
    if not archivo:
        print("  \u274c Archivo no encontrado")
        return 0
    
    tabla = DBF(archivo)
    creados = 0
    
    for reg in tabla:
        try:
            rev_val = reg.get('REV_CODIPO')
            if not rev_val:
                continue
            try:
                revendedor = Revendedor.objects.get(rev_codi=int(rev_val))
            except Revendedor.DoesNotExist:
                continue
            
            localidad = None
            if reg.get('LOC_CODIPO'):
                try:
                    localidad = Localidad.objects.get(loc_codi=int(reg['LOC_CODIPO']))
                except Localidad.DoesNotExist:
                    pass
            
            cond_iva = None
            if reg.get('CIV_CODIPO'):
                try:
                    cond_iva = CondicionIva.objects.get(civ_codi=int(reg['CIV_CODIPO']))
                except CondicionIva.DoesNotExist:
                    pass
            
            articulo = None
            if reg.get('POV_ARTI'):
                try:
                    articulo = Articulos.objects.get(art_codi=int(reg['POV_ARTI']))
                except Articulos.DoesNotExist:
                    pass
            
            color = None
            if reg.get('POV_COLO'):
                try:
                    color = Color.objects.get(col_codi=int(reg['POV_COLO']))
                except Color.DoesNotExist:
                    pass
            
            Pedidos.objects.create(
                pov_fech=reg.get('POV_FECH') or None,
                rev_codi=revendedor,
                cli_nomb=(str(reg.get('CLT_NOMB', '')).strip() or None),
                cli_dire=(str(reg.get('CLT_DIRE', '')).strip() or None),
                loc_codi=localidad,
                cli_tele=(str(reg.get('CLT_TELE', '')).strip() or None),
                cli_celu=(str(reg.get('CLT_CELU', '')).strip() or None),
                cli_emai=(str(reg.get('CLT_EMAI', '')).strip() or None),
                cli_fnac=reg.get('CLT_FNAC') or None,
                cli_tdoc=(str(reg.get('CLT_TDOC', '')).strip() or None),
                cli_ndoc=reg.get('CLT_NDOC') or None,
                civ_codi=cond_iva,
                cli_cuit=(str(reg.get('CLT_CUIT', '')).strip() or None),
                cli_estc=(str(reg.get('CLT_ESTC', '')).strip() or None),
                cli_ocup=(str(reg.get('CLT_OCUP', '')).strip() or None),
                cli_nombc=(str(reg.get('CLT_NOMBC', '')).strip() or None),
                cli_tdocc=(str(reg.get('CLT_TDOCC', '')).strip() or None),
                cli_ndocc=reg.get('CLT_NDOCC') or None,
                cli_cuitc=(str(reg.get('CLT_CUITC', '')).strip() or None),
                pov_arti=articulo,
                pov_mode=reg.get('POV_MODE') or None,
                pov_colo=color,
                pov_ncha=(str(reg.get('POV_NCHA', '')).strip() or None),
                pov_nmot=(str(reg.get('POV_NMOT', '')).strip() or None),
                pov_ncer=(str(reg.get('POV_NCER', '')).strip() or None),
                pov_tfac=(str(reg.get('POV_TFAC', '')).strip() or None),
                pov_flis=reg.get('POV_FLIS') or None,
                pov_plis=reg.get('POV_PLIS') or None,
                pov_finu=(str(reg.get('POV_FINU', '')).strip() or None),
                pov_numc=(str(reg.get('POV_NUMC', '')).strip() or None),
                pov_impc=reg.get('POV_IMPC') or None,
                pov_nomc=(str(reg.get('POV_NOMC', '')).strip() or None),
                pov_tarc=reg.get('POV_TARC') or None,
                pov_ppag=reg.get('POV_PPAG') or None,
                pov_monf=reg.get('POV_MONF') or None,
                pov_cheq=reg.get('POV_CHE3') or None,
                pov_tran=reg.get('POV_TRAN') or None,
                pov_icdo=reg.get('POV_ICDO') or None,
                gen_codi=reg.get('GEN_CODI') or None,
                pov_cvta=reg.get('POV_CVTA') or None,
            )
            creados += 1
        except Exception as e:
            pass
    
    print(f"  \u2705 {creados}/{len(tabla)} creados")
    return creados

# ================================================================
# MAIN
# ================================================================

if __name__ == '__main__':
    print("\n" + "="*80)
    print("🔄 RESET Y RECARGA DE DATOS DBF")
    print("="*80)
    print(f"📁 Carpeta DBF: {DBF_PATH}")
    
    # Confirmar antes de ejecutar
    respuesta = input("\n⚠️  ¿SEGURO que quieres BORRAR TODOS los datos y recargar? (escribe 'SÍ'): ").strip()
    
    if respuesta.upper() not in ['SÍ', 'SI']:
        print("\n❌ Operación cancelada")
        exit()
    
    try:
        # PASO 1: Limpiar
        limpiar_datos()
        
        # PASO 2: Cargar en orden de dependencias
        print("\n" + "="*80)
        print("📥 CARGANDO DATOS DESDE DBF")
        print("="*80 + "\n")
        
        total_cargado = 0
        total_cargado += cargar_provincias()
        total_cargado += cargar_localidades()
        total_cargado += cargar_marcas()
        total_cargado += cargar_rubros()
        total_cargado += cargar_subrubros()
        total_cargado += cargar_colores()
        total_cargado += cargar_comprobantes()
        total_cargado += cargar_condiciones_iva()
        total_cargado += cargar_articulos()
        total_cargado += cargar_revendedores()
        total_cargado += cargar_stock()
        total_cargado += cargar_pedidos()
        
        print("\n" + "="*80)
        print(f"✅ CARGA COMPLETADA - {total_cargado} registros cargados totales")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error general: {e}")
        import traceback
        traceback.print_exc()
