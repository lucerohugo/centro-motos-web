#!/usr/bin/env python
"""
Script para cargar datos DBF al Django - VERSIÓN CORREGIDA
Ejecutar desde la raíz del backend: python cargar_dbf_nuevo.py
"""

import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from dbfread import DBF
from decimal import Decimal
from gestion.models import (
    Provincia, Localidad, Marca, Rubro, Subrubro, Color,
    Comprobante, CondicionIva, Articulos, Revendedor, Stock, Pedidos
)

DBF_PATH = os.path.join(os.path.dirname(__file__), 'centro-motos-dbf')

def encontrar_archivo(nombres):
    """Busca archivo sin importar mayúsculas"""
    if not os.path.exists(DBF_PATH):
        print(f"  ❌ Carpeta no existe: {DBF_PATH}")
        return None
    
    archivos_dir = {f.lower(): f for f in os.listdir(DBF_PATH)}
    for nombre in nombres:
        if nombre.lower() in archivos_dir:
            ruta = os.path.join(DBF_PATH, archivos_dir[nombre.lower()])
            print(f"     📂 Encontrado: {archivos_dir[nombre.lower()]}")
            return ruta
    return None

def cargar_provincias():
    print("\n📍 Cargando PROVINCIAS...")
    archivo = encontrar_archivo(['PCIA.DBF', 'pcia.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
    creados = 0
    
    for reg in tabla:
        try:
            pci_codi = int(reg['PCI_CODI'])
            pci_nomb = str(reg['PCI_NOMB']).strip()
            
            if pci_codi and pci_nomb:
                obj, created = Provincia.objects.update_or_create(
                    pci_codi=pci_codi,
                    defaults={'pci_nomb': pci_nomb}
                )
                if created:
                    creados += 1
                    print(f"       ✅ [{pci_codi}] {pci_nomb}")
        except Exception as e:
            print(f"       ❌ Error en reg: {e}")
    
    print(f"  ✅ Total creadas: {creados}/{len(tabla)}")

def cargar_localidades():
    print("\n🏙️  Cargando LOCALIDADES...")
    archivo = encontrar_archivo(['LOCA.DBF', 'loca.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
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
                    obj, created = Localidad.objects.update_or_create(
                        loc_codi=loc_codi,
                        defaults={
                            'loc_nomb': loc_nomb,
                            'loc_cpos': loc_cpos,
                            'pci_codi': provincia
                        }
                    )
                    if created:
                        creados += 1
                        print(f"       ✅ [{loc_codi}] {loc_nomb}")
                except Provincia.DoesNotExist:
                    print(f"       ⚠️  Provincia {pci_codi} no existe")
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creadas: {creados}/{len(tabla)}")

def cargar_marcas():
    print("\n🏷️  Cargando MARCAS...")
    archivo = encontrar_archivo(['MARC.DBF', 'marc.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
    creados = 0
    
    for reg in tabla:
        try:
            mar_codi = int(reg['MAR_CODI'])
            mar_nomb = str(reg['MAR_NOMB']).strip() if reg['MAR_NOMB'] else ''
            
            if mar_codi and mar_nomb:
                obj, created = Marca.objects.update_or_create(
                    mar_codi=mar_codi,
                    defaults={'mar_nomb': mar_nomb}
                )
                if created:
                    creados += 1
                    print(f"       ✅ [{mar_codi}] {mar_nomb}")
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creadas: {creados}/{len(tabla)}")

def cargar_rubros():
    print("\n📂 Cargando RUBROS...")
    archivo = encontrar_archivo(['RUBR.DBF', 'rubr.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
    creados = 0
    
    for reg in tabla:
        try:
            rub_codi = int(reg['RUB_CODI'])
            rub_nomb = str(reg['RUB_NOMB']).strip() if reg['RUB_NOMB'] else ''
            
            if rub_codi and rub_nomb:
                try:
                    # Asignar a primera marca disponible
                    marca = Marca.objects.first()
                    if not marca:
                        marca = Marca.objects.create(mar_codi=1, mar_nomb="DEFAULT")
                    
                    obj, created = Rubro.objects.update_or_create(
                        rub_codi=rub_codi,
                        defaults={'rub_nomb': rub_nomb, 'mar_codi': marca}
                    )
                    if created:
                        creados += 1
                        print(f"       ✅ [{rub_codi}] {rub_nomb}")
                except Exception as e:
                    print(f"       ⚠️  {rub_nomb}: {e}")
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creados: {creados}/{len(tabla)}")

def cargar_subrubros():
    print("\n📋 Cargando SUBRUBROS...")
    archivo = encontrar_archivo(['SRUB.DBF', 'srub.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
    creados = 0
    
    for reg in tabla:
        try:
            sru_codi = int(reg['SRU_CODI'])
            sru_nomb = str(reg['SRU_NOMB']).strip() if reg['SRU_NOMB'] else ''
            rub_codi = int(reg['RUB_CODI'])  # Campo correcto en DBF
            
            if sru_codi and sru_nomb and rub_codi:
                try:
                    rubro = Rubro.objects.get(rub_codi=rub_codi)
                    obj, created = Subrubro.objects.update_or_create(
                        sru_codi=sru_codi,
                        defaults={'sru_nomb': sru_nomb, 'sru_rubr': rubro}
                    )
                    if created:
                        creados += 1
                        print(f"       ✅ [{sru_codi}] {sru_nomb}")
                except Rubro.DoesNotExist:
                    print(f"       ⚠️  Rubro {rub_codi} no existe")
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creados: {creados}/{len(tabla)}")

def cargar_colores():
    print("\n🎨 Cargando COLORES...")
    archivo = encontrar_archivo(['COLO.DBF', 'colo.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
    creados = 0
    
    for reg in tabla:
        try:
            col_codi = int(reg['COL_CODI'])
            col_nomb = str(reg['COL_NOMB']).strip() if reg['COL_NOMB'] else ''
            
            if col_codi and col_nomb:
                obj, created = Color.objects.update_or_create(
                    col_codi=col_codi,
                    defaults={'col_nomb': col_nomb}
                )
                if created:
                    creados += 1
                    print(f"       ✅ [{col_codi}] {col_nomb}")
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creados: {creados}/{len(tabla)}")

def cargar_comprobantes():
    print("\n📄 Cargando COMPROBANTES...")
    archivo = encontrar_archivo(['COMP.DBF', 'comp.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
    creados = 0
    
    for reg in tabla:
        try:
            com_nomb = str(reg['COM_NOMB']).strip() if reg['COM_NOMB'] else ''
            com_letr = str(reg.get('COM_LETR', '')).strip() or None
            com_abre = str(reg.get('COM_ABRE', '')).strip() or None
            
            if com_nomb:
                com_deha = reg.get('COM_DEHA') or None
                com_unum = reg.get('COM_UNUM') or None
                com_afip = str(reg.get('COM_AFIP', '')).strip() or None
                com_fele = reg.get('COM_FELE') or None
                
                obj = Comprobante.objects.create(
                    com_nomb=com_nomb,
                    com_letr=com_letr,
                    com_abre=com_abre,
                    com_deha=com_deha,
                    com_unum=com_unum,
                    com_afip=com_afip,
                    com_fele=com_fele,
                )
                creados += 1
                print(f"       ✅ [{obj.com_codi}] {com_abre} {com_letr} - {com_nomb}")
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creados: {creados}/{len(tabla)}")

def cargar_condiciones_iva():
    print("\n💰 Cargando CONDICIONES IVA...")
    archivo = encontrar_archivo(['CIVA.DBF', 'civa.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
    creados = 0
    
    for reg in tabla:
        try:
            civ_codi = int(reg['CIV_CODI'])
            civ_nomb = str(reg['CIV_NOMB']).strip() if reg['CIV_NOMB'] else ''
            
            if civ_codi and civ_nomb:
                obj, created = CondicionIva.objects.update_or_create(
                    civ_codi=civ_codi,
                    defaults={'civ_nomb': civ_nomb}
                )
                if created:
                    creados += 1
                    print(f"       ✅ [{civ_codi}] {civ_nomb}")
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creadas: {creados}/{len(tabla)}")

def cargar_articulos():
    print("\n📦 Cargando ARTÍCULOS...")
    archivo = encontrar_archivo(['ARBI.DBF', 'arbi.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
    creados = 0
    
    for reg in tabla:
        try:
            art_codi = int(reg['ART_CODI'])
            art_nomb = str(reg['ART_NOMB']).strip() if reg['ART_NOMB'] else ''
            mar_codi = int(reg.get('MAR_CODI', 0) or 0)
            rub_codi = int(reg.get('RUB_CODI', 0) or 0)
            # art_prec puede estar vacío
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
                    
                    obj, created = Articulos.objects.update_or_create(
                        art_codi=art_codi,
                        defaults={
                            'art_nomb': art_nomb,
                            'mar_codi': marca,
                            'rub_codi': rubro,
                            'art_prec': art_prec
                            # NO cargamos art_plis - se agrega desde el frontend
                        }
                    )
                    if created:
                        creados += 1
                        print(f"       ✅ [{art_codi}] {art_nomb}")
                except (Marca.DoesNotExist, Rubro.DoesNotExist) as e:
                    print(f"       ⚠️  [{art_codi}] {art_nomb}: FK no existe - {e}")
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creados: {creados}/{len(tabla)}")

def cargar_revendedores():
    print("\n🎨 Cargando REVENDEDORES...")
    archivo = encontrar_archivo(['REVE.DBF', 'reve.dbf'])
    if not archivo:
        print("  ❌ Archivo no encontrado")
        return
    
    tabla = DBF(archivo)
    print(f"     📊 Total en archivo: {len(tabla)}")
    creados = 0
    
    for reg in tabla:
        try:
            rev_codi = int(reg['REV_CODI'])
            rev_nomb = str(reg['REV_NOMB']).strip() if reg['REV_NOMB'] else ''
            rev_dire = str(reg.get('REV_DIRE', '')).strip() if reg.get('REV_DIRE') else ''
            rev_tele = str(reg.get('REV_TELE', '')).strip() if reg.get('REV_TELE') else ''
            rev_clav = str(reg.get('REV_CLAV', '')).strip() if reg.get('REV_CLAV') else ''
            loc_codi = int(reg.get('LOC_CODI', 0) or 0)
            
            # rev_porc puede estar vacío
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
                    
                    obj, created = Revendedor.objects.update_or_create(
                        rev_codi=rev_codi,
                        defaults={
                            'rev_nomb': rev_nomb,
                            'rev_dire': rev_dire,
                            'rev_tele': rev_tele,
                            'rev_clav': rev_clav,
                            'rev_porc': rev_porc,  # Puede ser None
                            'loc_codi': localidad
                        }
                    )
                    if created:
                        creados += 1
                        print(f"       ✅ [{rev_codi}] {rev_nomb}")
                except Localidad.DoesNotExist:
                    print(f"       ⚠️  Localidad {loc_codi} no existe para {rev_nomb}")
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creados: {creados}/{len(tabla)}")

def cargar_stock():
    """Cargar stock desde STKM.DBF"""
    print("\n📦 Cargando Stock desde STKM.DBF...")
    tabla = DBF(os.path.join(DBF_PATH, 'STKM.DBF'), encoding='latin-1')
    creados = 0
    
    for record in tabla:
        try:
            art_codi_val = record.get('ART_CODI')
            if not art_codi_val:
                continue
            
            # Buscar artículo
            try:
                articulo = Articulos.objects.get(art_codi=art_codi_val)
            except Articulos.DoesNotExist:
                continue
            
            # Buscar color (opcional)
            color = None
            col_codi_val = record.get('COL_CODI')
            if col_codi_val:
                try:
                    color = Color.objects.get(col_codi=col_codi_val)
                except Color.DoesNotExist:
                    pass
            
            art_ncha = (record.get('ART_NCHA') or '').strip() or None
            art_ncer = (record.get('ART_NCER') or '').strip() or None
            art_nmot = (record.get('ART_NMOT') or '').strip() or None
            art_mode = record.get('ART_MODE') or None
            art_fing = record.get('ART_FING') or None
            art_orco = record.get('ART_ORCO') or None
            art_tall = (record.get('ART_TALL') or '').strip() or None
            art_dest = record.get('ART_DEST') or None
            art_codv = record.get('ART_CODV') or None
            art_codc = record.get('ART_CODC') or None
            art_usad = (record.get('ART_USAD') or '').strip() or None
            art_prem = record.get('ART_PREM') or None
            art_cobr = record.get('ART_COBR') or None
            art_cntr = (record.get('ART_CNTR') or '').strip() or None
            art_fcde = record.get('ART_FCDE') or None
            art_sucd = record.get('ART_SUCD') or None
            art_desa = record.get('ART_DESA') or None
            art_bdis = (record.get('ART_BDIS') or '').strip() or None
            
            Stock.objects.create(
                art_codi=articulo,
                col_codi=color,
                art_ncha=art_ncha,
                art_ncer=art_ncer,
                art_nmot=art_nmot,
                art_mode=art_mode,
                art_fing=art_fing,
                art_orco=art_orco,
                art_tall=art_tall,
                art_dest=art_dest,
                art_codv=art_codv,
                art_codc=art_codc,
                art_usad=art_usad,
                art_prem=art_prem,
                art_cobr=art_cobr,
                art_cntr=art_cntr,
                art_fcde=art_fcde,
                art_sucd=art_sucd,
                art_desa=art_desa,
                art_bdis=art_bdis,
            )
            creados += 1
        except Exception as e:
            print(f"       ❌ Error: {e}")
    
    print(f"  ✅ Total creados: {creados}/{len(tabla)}")

def cargar_pedidos():
    """Cargar pedidos desde POVT.DBF"""
    print("\n\ud83d\udcdd Cargando PEDIDOS desde POVT.DBF...")
    tabla = DBF(os.path.join(DBF_PATH, 'POVT.DBF'), encoding='latin-1')
    creados = 0
    
    for record in tabla:
        try:
            rev_codi_val = record.get('REV_CODIPO')
            if not rev_codi_val:
                continue
            
            try:
                revendedor = Revendedor.objects.get(rev_codi=int(rev_codi_val))
            except Revendedor.DoesNotExist:
                continue
            
            # FK opcionales
            localidad = None
            loc_val = record.get('LOC_CODIPO')
            if loc_val:
                try:
                    localidad = Localidad.objects.get(loc_codi=int(loc_val))
                except Localidad.DoesNotExist:
                    pass
            
            cond_iva = None
            civ_val = record.get('CIV_CODIPO')
            if civ_val:
                try:
                    cond_iva = CondicionIva.objects.get(civ_codi=int(civ_val))
                except CondicionIva.DoesNotExist:
                    pass
            
            articulo = None
            art_val = record.get('POV_ARTI')
            if art_val:
                try:
                    articulo = Articulos.objects.get(art_codi=int(art_val))
                except Articulos.DoesNotExist:
                    pass
            
            color = None
            col_val = record.get('POV_COLO')
            if col_val:
                try:
                    color = Color.objects.get(col_codi=int(col_val))
                except Color.DoesNotExist:
                    pass
            
            Pedidos.objects.create(
                pov_fech=record.get('POV_FECH') or None,
                rev_codi=revendedor,
                cli_nomb=(str(record.get('CLT_NOMB', '')).strip() or None),
                cli_dire=(str(record.get('CLT_DIRE', '')).strip() or None),
                loc_codi=localidad,
                cli_tele=(str(record.get('CLT_TELE', '')).strip() or None),
                cli_celu=(str(record.get('CLT_CELU', '')).strip() or None),
                cli_emai=(str(record.get('CLT_EMAI', '')).strip() or None),
                cli_fnac=record.get('CLT_FNAC') or None,
                cli_tdoc=(str(record.get('CLT_TDOC', '')).strip() or None),
                cli_ndoc=record.get('CLT_NDOC') or None,
                civ_codi=cond_iva,
                cli_cuit=(str(record.get('CLT_CUIT', '')).strip() or None),
                cli_estc=(str(record.get('CLT_ESTC', '')).strip() or None),
                cli_ocup=(str(record.get('CLT_OCUP', '')).strip() or None),
                cli_nombc=(str(record.get('CLT_NOMBC', '')).strip() or None),
                cli_tdocc=(str(record.get('CLT_TDOCC', '')).strip() or None),
                cli_ndocc=record.get('CLT_NDOCC') or None,
                cli_cuitc=(str(record.get('CLT_CUITC', '')).strip() or None),
                pov_arti=articulo,
                pov_mode=record.get('POV_MODE') or None,
                pov_colo=color,
                pov_ncha=(str(record.get('POV_NCHA', '')).strip() or None),
                pov_nmot=(str(record.get('POV_NMOT', '')).strip() or None),
                pov_ncer=(str(record.get('POV_NCER', '')).strip() or None),
                pov_tfac=(str(record.get('POV_TFAC', '')).strip() or None),
                pov_flis=record.get('POV_FLIS') or None,
                pov_plis=record.get('POV_PLIS') or None,
                pov_finu=(str(record.get('POV_FINU', '')).strip() or None),
                pov_numc=(str(record.get('POV_NUMC', '')).strip() or None),
                pov_impc=record.get('POV_IMPC') or None,
                pov_nomc=(str(record.get('POV_NOMC', '')).strip() or None),
                pov_tarc=record.get('POV_TARC') or None,
                pov_ppag=record.get('POV_PPAG') or None,
                pov_monf=record.get('POV_MONF') or None,
                pov_cheq=record.get('POV_CHE3') or None,
                pov_tran=record.get('POV_TRAN') or None,
                pov_icdo=record.get('POV_ICDO') or None,
                gen_codi=record.get('GEN_CODI') or None,
                pov_cvta=record.get('POV_CVTA') or None,
            )
            creados += 1
        except Exception as e:
            print(f"       \u274c Error: {e}")
    
    print(f"  \u2705 Total creados: {creados}/{len(tabla)}")

if __name__ == '__main__':
    print("\n" + "="*80)
    print("🚀 CARGADOR DE DATOS DBF AL DJANGO")
    print("="*80)
    print(f"📁 Carpeta DBF: {DBF_PATH}")
    
    try:
        # Cargar en orden de dependencias
        cargar_provincias()
        cargar_localidades()
        cargar_marcas()
        cargar_rubros()
        cargar_subrubros()
        cargar_colores()
        cargar_comprobantes()
        cargar_condiciones_iva()
        cargar_articulos()
        cargar_revendedores()
        cargar_stock()
        cargar_pedidos()
        
        print("\n" + "="*80)
        print("✅ CARGA COMPLETADA")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error general: {e}")
        import traceback
        traceback.print_exc()
