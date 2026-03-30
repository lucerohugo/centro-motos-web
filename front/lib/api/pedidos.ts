/**
 * Servicio de Pedidos - Conecta con backend Django
 * Usa tipos que coinciden exactamente con models.py
 */

import { Pedido } from '../types'
import { api } from './config'

export const pedidosService = {
  /**
   * Obtener todos los pedidos
   */
  getAllPedidos: async (): Promise<Pedido[]> => {
    return api.get<Pedido[]>('/pedidos/')
  },

  /**
   * Obtener pedidos de un revendedor
   */
  getPedidosByRevendedor: async (rev_codi: number): Promise<Pedido[]> => {
    return api.get<Pedido[]>(`/pedidos/por_revendedor/?rev_codi=${rev_codi}`)
  },

  /**
   * Obtener detalle de un pedido
   */
  getPedidoDetalle: async (pov_codi: number): Promise<Pedido> => {
    return api.get<Pedido>(`/pedidos/${pov_codi}/`)
  },

  /**
   * Crear nuevo pedido
   */
  crearPedido: async (data: Partial<Pedido>): Promise<Pedido> => {
    return api.post<Pedido>('/pedidos/', data)
  },

  /**
   * Actualizar pedido existente
   */
  actualizarPedido: async (pov_codi: number, data: Partial<Pedido>): Promise<Pedido> => {
    return api.patch<Pedido>(`/pedidos/${pov_codi}/`, data)
  },

  /**
   * Eliminar pedido
   */
  eliminarPedido: async (pov_codi: number): Promise<{ success: boolean }> => {
    await api.delete(`/pedidos/${pov_codi}/`)
    return { success: true }
  },
}

