"""
Servicio para generar documentos de garantía rellenos con datos del pedido.
Usa python-docx para manipular archivos Word.
"""

import os
import logging
from pathlib import Path
from datetime import datetime
from docx import Document
from django.http import FileResponse
from io import BytesIO

# Configurar logging
logger = logging.getLogger(__name__)

# Mapeo de marca (mar_codi) a archivo Word
MARCA_WORD_MAP = {
    1: 'Garantia MOTOMEL.docx',
    2: 'Garantia CORVEN.docx',
    3: 'Garantia ZANELLA.docx',
    4: 'Garantia KELLER.docx',
    7: 'Garantia BAJAJ.docx',
    9: 'Garantia HONDA.docx',
    10: 'Garantia SUZUKI.docx',
    11: 'Garantia GUERRERO.docx',
}

# Directorio de garantías (directorio actual donde está este script)
GARANTIAS_DIR = os.path.dirname(os.path.abspath(__file__))


def obtener_archivo_garantia(mar_codi):
    """
    Obtiene la ruta del archivo Word según la marca.
    
    Args:
        mar_codi: Código de marca (mar_codi)
    
    Returns:
        str: Ruta completa al archivo Word, o None si no existe
    """
    if mar_codi not in MARCA_WORD_MAP:
        # logger.error(f"Marca código {mar_codi} no existe en el mapeo")
        return None
    
    archivo_nombre = MARCA_WORD_MAP[mar_codi]
    # Construcción de ruta usando os.path.join para mejor compatibilidad
    archivo_path = os.path.join(GARANTIAS_DIR, archivo_nombre)
    
    logger.info(f"Buscando garantía para marca {mar_codi}: {archivo_path}")
    
    if os.path.exists(archivo_path):
        logger.info(f"Archivo encontrado: {archivo_path}")
        return archivo_path
    else:
        logger.error(f"Archivo NO encontrado: {archivo_path}")
        # Listar archivos disponibles para debug
        try:
            archivos = os.listdir(GARANTIAS_DIR)
            logger.error(f"Archivos disponibles en {GARANTIAS_DIR}: {archivos}")
        except Exception as e:
            logger.error(f"Error listando archivos: {e}")
    
    return None


def rellenar_garantia(pedido):
    """
    Rellena un documento de garantía con datos del pedido.
    
    Args:
        pedido: Instancia del modelo Pedidos con datos:
            - cli_nomb: Nombre del comprador (TITULAR)
            - pov_arti.mar_codi_id: Código de marca (para seleccionar Word)
            - pov_arti.mar_codi.mar_nomb: Nombre de marca
            - pov_mode: Modelo/Año
            - pov_nmot: Número de motor
            - pov_ncha: Número de chasis
    
    Returns:
        tuple: (BytesIO documento, str nombre_marca) para el nombre del archivo
        
    Raises:
        ValueError: Si la marca no tiene archivo asociado o faltan datos
    """
    
    # Validar que tenga artículo
    if not pedido.pov_arti:
        raise ValueError("El pedido no tiene artículo asignado")
    
    # Obtener marca código - acceder correctamente a través de la ForeignKey
    mar_codi = pedido.pov_arti.mar_codi_id
    
    logger.info(f"Procesando garantía para pedido {pedido.pov_codi}: mar_codi={mar_codi}")
    
    if not mar_codi:
        raise ValueError("El artículo no tiene marca asignada")
    
    # Obtener ruta del archivo Word
    archivo_word = obtener_archivo_garantia(mar_codi)
    
    if not archivo_word:
        # raise ValueError(f"No existe archivo de garantía para la marca código {mar_codi}")
        raise ValueError(f"No existe documentacion de garantía para esta marca, contactarse con Centro Motos")
    
    # Cargar documento
    doc = Document(archivo_word)
    
    # Obtener nombre de marca correctamente (a través de la relación ForeignKey)
    marca_nombre = ''
    if pedido.pov_arti.mar_codi:
        marca_nombre = pedido.pov_arti.mar_codi.mar_nomb or ''
    
    # Preparar datos - dejar vacío si no existen
    cli_nomb = pedido.cli_nomb or ''
    modelo_str = str(pedido.pov_mode) if pedido.pov_mode else ''
    pov_nmot = pedido.pov_nmot or ''
    pov_ncha = pedido.pov_ncha or ''
    
    # Obtener fecha actual en formato DD/MM/YYYY
    fecha_hoy = datetime.now().strftime('%d/%m/%Y')
    
    # Mapeo: buscar etiqueta exacta y reemplazar con etiqueta + valor
    # IMPORTANTE: Ordenar de lo específico a lo genérico para evitar reemplazos duplicados
    datos_relleno = {
        'MARCA Y MODELO: MODELO': f'MARCA Y MODELO: {marca_nombre} / {modelo_str}',  # Patrón específico
        'MARCA Y MODELO:': f'MARCA Y MODELO: {marca_nombre} / {modelo_str}',  # Genérico
        'TITULAR:': f'TITULAR: {cli_nomb}',
        'MOTOR Nº:': f'MOTOR Nº: {pov_nmot}',
        'CHASIS Nº': f'CHASIS Nº: {pov_ncha}',
        'CHASSIS Nº': f'CHASSIS Nº: {pov_ncha}',  # Variación con doble S
    }
    
    # Para KELLER (mar_codi=4), NO reemplazar MODELO: por separado
    # porque ya está incluido en MARCA Y MODELO:
    if mar_codi != 4:
        datos_relleno['MODELO:'] = f'MODELO: {modelo_str}'
        datos_relleno['FECHA Nº'] = f'FECHA Nº: {fecha_hoy}'  # Solo para no-KELLER
    
    logger.info(f"Datos a rellenar para pedido {pedido.pov_codi}: {datos_relleno}")
    logger.info(f"Marca nombre: {marca_nombre}, mar_codi: {mar_codi}, Fecha: {fecha_hoy}")
    
    # Rellenar párrafos y tablas
    _rellenar_parrafos(doc, datos_relleno)
    _rellenar_tablas(doc, datos_relleno)
    
    # Guardar en memoria
    output = BytesIO()
    doc.save(output)
    output.seek(0)
    
    # Retornar el BytesIO (no los bytes), ya que FileResponse lo maneja
    return output, marca_nombre


def _aplicar_negrita_valores(parrafo, texto_completo):
    """
    Aplica negrita a los valores que vienen después de ":" en un párrafo.
    Por ejemplo: "TITULAR: " aparece normal, pero "BECERRA JUAN CARLOS" aparece en negrita.
    """
    # Patrones de etiquetas conocidas
    etiquetas = [
        'TITULAR:',
        'MARCA Y MODELO:',
        'MODELO:',
        'MOTOR Nº:',
        'CHASIS Nº',
        'CHASSIS Nº',
        'FECHA Nº',
    ]
    
    # Para cada etiqueta, si existe en el texto, aplicar negrita al valor
    for etiqueta in etiquetas:
        if etiqueta in texto_completo:
            # Encontrar posición de la etiqueta
            pos = texto_completo.find(etiqueta)
            if pos >= 0:
                # Calcular donde comienza el valor (después de la etiqueta y el espacio)
                inicio_valor = pos + len(etiqueta)
                
                # Si hay un espacio después de la etiqueta, saltarlo
                if inicio_valor < len(texto_completo) and texto_completo[inicio_valor] == ' ':
                    inicio_valor += 1
                
                # Reconstruir el párrafo con runs separados: normal + negrita
                # Limpiar runs actuales
                for run in parrafo.runs[:]:
                    run._element.getparent().remove(run._element)
                
                # Crear run normal para la etiqueta + espacio
                if inicio_valor > 0:
                    parte_normal = texto_completo[:inicio_valor]
                    run_normal = parrafo.add_run(parte_normal)
                    run_normal.bold = False
                
                # Crear run en negrita para el valor
                parte_valor = texto_completo[inicio_valor:]
                run_negrita = parrafo.add_run(parte_valor)
                run_negrita.bold = True
                
                # Solo procesar la primera etiqueta encontrada por párrafo
                break


def _rellenar_parrafos(doc, datos):
    """
    Rellena los párrafos del documento con los datos.
    Maneja correctamente los runs para preservar el formato y aplicar negrita.
    """
    for parrafo in doc.paragraphs:
        # Obtener texto completo del párrafo
        texto_completo = parrafo.text
        
        # Verificar si contiene algún placeholder
        tiene_placeholder = any(placeholder in texto_completo for placeholder in datos.keys())
        
        if not tiene_placeholder:
            continue
        
        # Reemplazar cada placeholder
        texto_reemplazado = texto_completo
        for clave, valor in datos.items():
            if clave in texto_reemplazado:
                texto_reemplazado = texto_reemplazado.replace(clave, str(valor))
        
        # Si el texto cambió, actualizar el párrafo
        if texto_reemplazado != texto_completo:
            # Limpiar todos los runs existentes
            for run in parrafo.runs:
                run.text = ""
            
            # Crear nuevo run con el texto reemplazado
            # Luego aplicar negrita al valor (parte después del colon)
            nuevo_run = parrafo.add_run(texto_reemplazado)
            
            # Aplicar negrita a los valores (parte después de ":")
            _aplicar_negrita_valores(parrafo, texto_reemplazado)


def _rellenar_tablas(doc, datos):
    """
    Rellena las celdas de las tablas del documento con los datos.
    Maneja correctamente los párrafos dentro de las celdas y aplica negrita.
    """
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                # Procesar cada párrafo dentro de la celda
                for parrafo in cell.paragraphs:
                    # Obtener texto completo del párrafo
                    texto_completo = parrafo.text
                    
                    # Verificar si contiene algún placeholder
                    tiene_placeholder = any(placeholder in texto_completo for placeholder in datos.keys())
                    
                    if not tiene_placeholder:
                        continue
                    
                    # Reemplazar cada placeholder
                    texto_reemplazado = texto_completo
                    for clave, valor in datos.items():
                        if clave in texto_reemplazado:
                            texto_reemplazado = texto_reemplazado.replace(clave, str(valor))
                    
                    # Si el texto cambió, actualizar el párrafo
                    if texto_reemplazado != texto_completo:
                        # Limpiar todos los runs existentes
                        for run in parrafo.runs:
                            run.text = ""
                        
                        # Crear un nuevo run con el texto reemplazado
                        nuevo_run = parrafo.add_run(texto_reemplazado)
                        
                        # Aplicar negrita a los valores
                        _aplicar_negrita_valores(parrafo, texto_reemplazado)


def generar_nombre_archivo(pedido, marca_nombre=''):
    """
    Genera el nombre del archivo de descarga.
    Incluye el nombre de la marca para identificación clara.
    
    Args:
        pedido: Instancia del modelo Pedidos
        marca_nombre: Nombre de la marca (para incluir en el nombre)
    
    Returns:
        str: Nombre del archivo (ej: Garantia_KELLER_Pedido_86.docx)
    """
    # Si no viene marca_nombre, intentar obtenerla
    if not marca_nombre:
        if pedido.pov_arti and pedido.pov_arti.mar_codi:
            marca_nombre = pedido.pov_arti.mar_codi.mar_nomb or 'Marca'
        else:
            marca_nombre = 'Marca'
    
    # Limpiar espacios y caracteres especiales del nombre de marca
    marca_limpia = marca_nombre.strip().replace(' ', '_').upper()
    
    # Formato: Garantia_KELLER.docx
    return f"Garantia_{marca_limpia}.docx"
