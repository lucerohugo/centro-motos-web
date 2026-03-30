/**
 * Servicio de Stock / Artículos - Conecta con backend Django
 * Usa tipos que coinciden exactamente con models.py
 */

import { Articulo, Marca, Subrubro, Color } from '../types'
import { api } from './config'

export const stockService = {
  /**
   * Obtener lista de artículos (motocicletas)
   */
  getArticulos: async (): Promise<Articulo[]> => {
    return api.get<Articulo[]>('/articulos/')
  },

  /**
   * Obtener detalle de un artículo
   */
  getArticuloDetalle: async (art_codi: number): Promise<Articulo> => {
    return api.get<Articulo>(`/articulos/${art_codi}/`)
  },

  /**
   * Obtener artículos por marca
   */
  getArticulosPorMarca: async (mar_codi: number): Promise<Articulo[]> => {
    return api.get<Articulo[]>(`/articulos/?mar_codi=${mar_codi}`)
  },

  /**
   * Obtener artículos con stock disponible
   */
  getArticulosConStock: async (): Promise<Articulo[]> => {
    return api.get<Articulo[]>('/articulos/?art_stok__gt=0')
  },

  /**
   * Obtener todas las marcas
   */
  getMarcas: async (): Promise<Marca[]> => {
    return api.get<Marca[]>('/marcas/')
  },

  /**
   * Obtener todos los subrubros
   */
  getSubrubros: async (): Promise<Subrubro[]> => {
    return api.get<Subrubro[]>('/subrubros/')
  },

  /**
   * Obtener todos los colores
   */
  getColores: async (): Promise<Color[]> => {
    return api.get<Color[]>('/colores/')
  },

  /**
   * Crear artículo (si es necesario)
   */
  crearArticulo: async (data: Partial<Articulo>): Promise<Articulo> => {
    return api.post<Articulo>('/articulos/', data)
  },

  /**
   * Actualizar artículo
   */
  actualizarArticulo: async (art_codi: number, data: Partial<Articulo>): Promise<Articulo> => {
    return api.patch<Articulo>(`/articulos/${art_codi}/`, data)
  },
}

