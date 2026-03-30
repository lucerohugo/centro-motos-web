/**
 * TIPOS Y INTERFACES - Estructura exacta del Backend Django
 * Todos los campos corresponden a los modelos de gestion/models.py
 */

// ================================================================
// CATÁLOGOS
// ================================================================

export interface Provincia {
  pci_codi: number
  pci_nomb: string
}

export interface Localidad {
  loc_codi: number
  loc_nomb: string
  loc_cpos?: string
  pci_codi: number
}

export interface Marca {
  mar_codi: number
  mar_nomb: string
}

export interface Rubro {
  rub_codi: number
  rub_nomb: string
  mar_codi: number
}

export interface Subrubro {
  sru_codi: number
  sru_nomb: string
  rub_codi?: number
}

export interface Color {
  col_codi: number
  col_nomb: string
}

export interface Comprobante {
  com_codi: number
  com_nomb: string
  com_letr?: string
  com_abre?: string
  com_deha?: number
  com_unum?: number
  com_afip?: string
  com_fele?: number
}

export interface CondicionIva {
  civ_codi: number
  civ_nomb: string
}

// ================================================================
// ARTÍCULOS / STOCK
// ================================================================

export interface Articulo {
  art_codi: number
  art_nomb: string
  art_mode?: string
  mar_codi: number
  mar_nomb?: string
  rub_codi: number
  rub_nomb?: string
  sru_codi?: number
  sru_nomb?: string
  art_plis: number
  art_prec: number
  art_tprec: 'F' | 'N'
  art_tiva?: number
  art_fchc: string
  art_fmod: string
}

export interface Stock {
  stk_codi: number
  art_codi: number
  art_nomb?: string
  mar_nomb?: string
  sru_nomb?: string
  col_codi?: number
  col_nomb?: string
  art_ncha?: string
  art_ncer?: string
  art_nmot?: string
  art_mode?: number
  art_fing?: string
  art_orco?: number
  art_tall?: string
  art_dest?: number
  art_codv?: number
  art_codc?: number
  art_usad?: string
  art_prem?: number
  art_cobr?: number
  art_cntr?: string
  art_sucd?: number
  art_desa?: number
  art_bdis?: string
  stk_fcre: string
  stk_fmod: string
}

export interface ConfirmacionVenta {
  con_codi: number
  con_marc?: number
  mar_nomb?: string
  con_rubr?: number
  rub_nomb?: string
  con_suru?: number
  sru_nomb?: string
  con_arti?: number
  art_nomb?: string
  con_reve?: number
  rev_nomb?: string
  con_prec: number
  con_porc: number
  con_fchc: string
  con_fmod: string
}

// ================================================================
// REVENDEDORES
// ================================================================

export interface Revendedor {
  rev_codi: number
  rev_nomb: string
  rev_doc?: string
  rev_emai?: string
  rev_tele?: string
  rev_dire?: string
  rev_dest?: string
  rev_clav?: string
  cli_codi?: number
  loc_codi?: number
  rev_actv: boolean
}

// ================================================================
// CLIENTES
// ================================================================

export interface Cliente {
  cli_codi: number
  cli_nomb: string
  cli_fnac?: string
  cli_tdoc: string
  cli_ndoc?: string
  cli_cuit?: string
  cli_emai?: string
  cli_celu?: string
  cli_tele?: string
  cli_dire?: string
  cli_bar?: string
  cli_estc?: string
  cli_ocup?: string
  // Cónyuge
  cli_nombc?: string
  cli_fnbac?: string
  cli_tdocc?: string
  cli_ndocc?: string
  cli_cuitc?: string
  loc_codi: number
  civ_codi?: number
  cli_fchc: string
  cli_fmod: string
}

// ================================================================
// PEDIDOS
// ================================================================

export interface Pedido {
  pov_codi: number
  pov_fech?: string
  rev_codi: number
  rev_nomb?: string
  // Cliente
  cli_nomb?: string
  cli_dire?: string
  loc_codi?: number
  loc_nomb?: string
  cli_tele?: string
  cli_celu?: string
  cli_emai?: string
  cli_fnac?: string
  cli_tdoc?: string
  cli_ndoc?: number
  civ_codi?: number
  civ_nomb?: string
  cli_cuit?: string
  cli_estc?: string
  cli_ocup?: string
  // Cónyuge
  cli_nombc?: string
  cli_tdocc?: string
  cli_ndocc?: number
  cli_cuitc?: string
  // Vehículo
  pov_arti?: number
  art_nomb?: string
  pov_mode?: number
  pov_colo?: number
  col_nomb?: string
  pov_ncha?: string
  pov_nmot?: string
  pov_ncer?: string
  // Facturación
  pov_flis?: string
  pov_plis?: number
  // Forma de pago
  pov_finu?: string
  pov_numc?: string
  pov_impc?: number
  pov_nomc?: string
  pov_tarc?: number
  pov_ppag?: number
  pov_monf?: number
  pov_cheq?: number
  pov_tran?: number
  pov_icdo?: number
  // Otros
  gen_codi?: number
  pov_cvta?: number
  // Control
  pov_fchc: string
  pov_fmod: string
}

/**
 * Lista paginada
 */
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
