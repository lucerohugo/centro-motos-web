from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


# ================================================================
# Provincia
# ================================================================
class Provincia(models.Model):
    pci_codi = models.IntegerField(primary_key=True, editable=True)
    pci_nomb = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Provincia"
        verbose_name_plural = "Provincias"
        ordering = ["pci_nomb"]

    def __str__(self):
        return self.pci_nomb


# ================================================================
# Marca
# ================================================================
class Marca(models.Model):
    mar_codi = models.IntegerField(primary_key=True, editable=True)
    mar_nomb = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Marca"
        verbose_name_plural = "Marcas"
        ordering = ["mar_nomb"]

    def __str__(self):
        return self.mar_nomb


# ================================================================
# Rubro 
# ================================================================
class Rubro(models.Model):
    """Rubros/Categorías de artículos"""
    rub_codi = models.IntegerField(primary_key=True, editable=True)
    rub_nomb = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Rubro"
        verbose_name_plural = "Rubros"
        ordering = ["rub_nomb"]

    def __str__(self):
        return self.rub_nomb


# ================================================================
# Subrubro
# ================================================================
class Subrubro(models.Model):
    """Sub-rubros/categorías dentro de un rubro"""
    sru_codi = models.IntegerField(primary_key=True, editable=True)
    rub_codi = models.ForeignKey(Rubro, on_delete=models.PROTECT, related_name="subrubros")
    sru_nomb = models.CharField(max_length=100)

    class Meta:
        verbose_name = "Sub-rubro"
        verbose_name_plural = "Sub-rubros"
        ordering = ["rub_codi_id", "sru_nomb"]
        unique_together = ("rub_codi", "sru_nomb")

    def __str__(self):
        return f"{self.sru_nomb} ({self.rub_codi.rub_nomb})"


# ================================================================
# Color
# ================================================================
class Color(models.Model):
    """Colores de motocicletas"""
    col_codi = models.IntegerField(primary_key=True, editable=True)
    col_nomb = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Color"
        verbose_name_plural = "Colores"
        ordering = ["col_nomb"]

    def __str__(self):
        return self.col_nomb


# ================================================================
# Comprobante (es el tipo de comprobante)
# ================================================================
class Comprobante(models.Model):
    """Tipos de factura/comprobantes - mapea COMP.DBF"""
    com_codi = models.IntegerField(primary_key=True, editable=True)
    com_nomb = models.CharField(max_length=30, help_text="Nombre del comprobante")
    com_letr = models.CharField(max_length=1, blank=True, null=True, help_text="Letra: A, B, C, M, X, Z")
    com_abre = models.CharField(max_length=4, blank=True, null=True, help_text="Abreviación: FACT, N.CR, N.DE, etc.")
    com_deha = models.DecimalField(max_digits=2, decimal_places=0, blank=True, null=True, help_text="Debe/Haber (1/-1)")
    com_unum = models.IntegerField(blank=True, null=True, help_text="Último número")
    com_afip = models.CharField(max_length=3, blank=True, null=True, help_text="Código AFIP")
    com_fele = models.DecimalField(max_digits=3, decimal_places=0, blank=True, null=True, help_text="Factura electrónica")

    class Meta:
        verbose_name = "Comprobante"
        verbose_name_plural = "Comprobantes"
        ordering = ["com_codi"]

    def __str__(self):
        if self.com_abre and self.com_letr:
            return f"{self.com_abre} {self.com_letr} - {self.com_nomb}"
        return self.com_nomb


# ================================================================
# Condicion IVA
# ================================================================
class CondicionIva(models.Model):
    """Condiciones de IVA"""
    civ_codi = models.IntegerField(primary_key=True, editable=True)
    civ_nomb = models.CharField(max_length=100, unique=True)

    class Meta:
        verbose_name = "Condición de IVA"
        verbose_name_plural = "Condiciones de IVA"
        ordering = ["civ_nomb"]

    def __str__(self):
        return self.civ_nomb


# ================================================================
# Localidad
# ================================================================
class Localidad(models.Model):
    loc_codi = models.IntegerField(primary_key=True, editable=True)
    loc_nomb = models.CharField(max_length=100)
    loc_cpos = models.CharField(max_length=5, blank=True, null=True, help_text="Código postal")
    pci_codi = models.ForeignKey(Provincia, on_delete=models.PROTECT, related_name="localidades")

    class Meta:
        verbose_name = "Localidad"
        verbose_name_plural = "Localidades"
        ordering = ["pci_codi_id", "loc_nomb"]

    def __str__(self):
        return f"{self.loc_nomb} ({self.loc_cpos})" if self.loc_cpos else self.loc_nomb


# ================================================================
# Articulos 
# ================================================================
class Articulos(models.Model):
    """Artículos/Motocicletas"""
    art_codi = models.IntegerField(primary_key=True, editable=True)
    art_nomb = models.CharField(max_length=150)
    art_mode = models.CharField(max_length=100, blank=True, null=True, help_text="Modelo")
    
    # Categorización
    mar_codi = models.ForeignKey(Marca, on_delete=models.SET_NULL, null=True, blank=True, related_name="articulos")
    sru_codi = models.ForeignKey(Subrubro, on_delete=models.SET_NULL, null=True, blank=True, related_name="articulos")
    
    # IVA
    art_tiva = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    # Precios y stock
    art_plis = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, help_text="Precio de lista")
    art_prec = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True, help_text="Precio unitario")

    art_tprec = models.CharField(max_length=1, choices=[('F', 'Precio Final'), ('N', 'Precio Neto')], default='F')
    
    # Control
    art_fchc = models.DateTimeField(auto_now_add=True)
    art_fmod = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Artículo"
        verbose_name_plural = "Artículos"
        ordering = ["art_nomb"]

    def __str__(self):
        marca = self.mar_codi.mar_nomb if self.mar_codi else "Sin marca"
        return f"{self.art_nomb} - {marca}"


# ================================================================
# Revendedor
# ================================================================
class Revendedor(models.Model):
    """Revendedores"""
    rev_codi = models.IntegerField(primary_key=True, editable=True)
    rev_nomb = models.CharField(max_length=100)
    rev_logo = models.ImageField(upload_to='revendedores/', blank=True, null=True, help_text="Logo del revendedor")
    rev_doc = models.CharField(max_length=20, blank=True, null=True)
    rev_emai = models.EmailField(blank=True, null=True)
    rev_tele = models.CharField(max_length=20, blank=True, help_text="Teléfono")
    rev_dire = models.CharField(max_length=200, blank=True, null=True, help_text="Dirección")
    rev_dest = models.IntegerField(blank=True, null=True, help_text="Depósito asignado (art_dest)")
    rev_porc = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, help_text="Porcentaje/Comisión")
    rev_clav = models.CharField(max_length=128, blank=True, null=True, help_text="Contraseña/Clave (hasheada)")
    rev_actv = models.BooleanField(default=True, help_text="Activo")
    loc_codi = models.ForeignKey(Localidad, on_delete=models.SET_NULL, null=True, blank=True, related_name="revendedores")

    class Meta:
        verbose_name = "Revendedor"
        verbose_name_plural = "Revendedores"
        ordering = ["rev_nomb"]

    def __str__(self):
        return self.rev_nomb
    
    def save(self, *args, **kwargs):
        """Hashear contraseña si es texto plano (no comienza con algoritmo Django)"""
        from django.contrib.auth.hashers import make_password, is_password_usable
        
        if self.rev_clav:
            # Si no está hasheada (no comienza con 'pbkdf2_sha256' o similar), hashearla
            if not self.rev_clav.startswith('pbkdf2_sha256$') and \
               not self.rev_clav.startswith('pbkdf2_sha1$') and \
               not self.rev_clav.startswith('argon2_argon2id$') and \
               not self.rev_clav.startswith('scrypt$') and \
               not self.rev_clav.startswith('bcrypt_sha256$') and \
               len(self.rev_clav) < 100:  # Los hashes son más largos
                self.rev_clav = make_password(self.rev_clav)
        
        super().save(*args, **kwargs)


# ================================================================
# Stock (STKM - Detalle de unidades con chasis, motor, color, etc)
# ================================================================
class Stock(models.Model):
    """Stock detallado de artículos - mapea STKM.DBF"""
    stk_codi = models.IntegerField(primary_key=True, editable=True)
    art_codi = models.ForeignKey(Articulos, on_delete=models.CASCADE, related_name="stock", help_text="ART_CODI")
    col_codi = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True, help_text="COL_CODI")
    art_ncha = models.CharField(max_length=20, blank=True, null=True, help_text="Número de chasis")
    art_ncer = models.CharField(max_length=20, blank=True, null=True, help_text="Número de certificado")
    art_nmot = models.CharField(max_length=22, blank=True, null=True, help_text="Número de motor")
    art_mode = models.IntegerField(blank=True, null=True, help_text="Modelo/Año")
    art_fing = models.DateField(blank=True, null=True, help_text="Fecha de ingreso")
    art_orco = models.IntegerField(blank=True, null=True, help_text="Orden de compra")
    art_tall = models.CharField(max_length=5, blank=True, null=True, help_text="Talla")
    art_dest = models.IntegerField(blank=True, null=True, help_text="Destino (depósito/revendedor)")
    art_codv = models.IntegerField(blank=True, null=True, help_text="Código de venta")
    art_codc = models.IntegerField(blank=True, null=True, help_text="Código de compra")
    art_usad = models.CharField(max_length=1, blank=True, null=True, help_text="Usado S/N")
    art_prem = models.DecimalField(max_digits=14, decimal_places=2, blank=True, null=True, help_text="Precio")
    art_cobr = models.IntegerField(blank=True, null=True, help_text="Cobrado")
    art_cntr = models.CharField(max_length=1, blank=True, null=True, help_text="Control")
    art_fcde = models.DateTimeField(blank=True, null=True, help_text="Fecha control")
    art_sucd = models.IntegerField(blank=True, null=True, help_text="Sucursal destino")
    art_desa = models.IntegerField(blank=True, null=True, help_text="Desafectado")
    art_bdis = models.CharField(max_length=1, blank=True, null=True, help_text="Baja/Disponible S/N")

    # Control Django
    stk_fcre = models.DateTimeField(auto_now_add=True)
    stk_fmod = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Stock"
        verbose_name_plural = "Stock"
        ordering = ["art_codi", "art_dest"]
        indexes = [
            models.Index(fields=["art_codi_id", "art_dest"]),
            models.Index(fields=["art_ncha"]),
            models.Index(fields=["art_dest"]),
        ]

    def __str__(self):
        return f"{self.art_codi.art_nomb} - Chasis: {self.art_ncha or 'N/D'}"


# ================================================================
# ConfirmacionVenta (CONFVTA)
# ================================================================
class ConfirmacionVenta(models.Model):
    """
    Confirmación de venta: define QUÉ artículos vende CADA revendedor y a QUÉ PRECIO.
    Si con_reve = NULL/blank, se aplica a TODOS los revendedores (configuración global).
    La configuración específica del revendedor tiene prioridad sobre la global.
    """
    con_codi = models.IntegerField(primary_key=True, editable=True)
    con_marc = models.ForeignKey(Marca, on_delete=models.PROTECT, related_name="confvta_marca")
    con_rubr = models.ForeignKey(Rubro, on_delete=models.PROTECT, related_name="confvta_rubro")
    con_suru = models.ForeignKey(Subrubro, on_delete=models.SET_NULL, null=True, blank=True, related_name="confvta_subrubro")
    con_arti = models.ForeignKey(Articulos, on_delete=models.PROTECT, related_name="confvta")
    con_reve = models.ForeignKey(Revendedor, on_delete=models.CASCADE, null=True, blank=True, 
                                related_name="confvta",
                                help_text="NULL/blank = global (todos revendedores). Si tiene valor = específico para ese revendedor")
    con_prec = models.DecimalField(max_digits=12, decimal_places=2, help_text="Precio para esta confirmación")
    con_porc = models.DecimalField(max_digits=5, decimal_places=2,  help_text="Porcentaje/Descuento")

    class Meta:
        verbose_name = "Confirmación de Venta"
        verbose_name_plural = "Confirmaciones de Venta"
        ordering = ["con_reve_id", "con_marc_id", "con_rubr_id"]
        indexes = [
            models.Index(fields=["con_reve_id", "con_marc_id"]),
            models.Index(fields=["con_reve_id", "con_arti_id"]),
        ]

    def __str__(self):
        reve_name = self.con_reve.rev_nomb if self.con_reve else "GLOBAL"
        return f"{reve_name} - {self.con_arti.art_nomb} (${self.con_prec})"


# ================================================================
# Clientes
# ================================================================
class Clientes(models.Model):
    """Clientes compradores - con datos de cónyuge opcionales incluidos"""
    # Comprador
    cli_codi = models.IntegerField(primary_key=True, editable=True)
    cli_nomb = models.CharField(max_length=150, help_text="Apellido y nombre del comprador")
    cli_fnac = models.DateField(blank=True, null=True, help_text="Fecha de nacimiento")
    cli_tdoc = models.CharField(max_length=20, default="DNI", help_text="Tipo de documento: DNI, PAS")
    cli_ndoc = models.CharField(max_length=20, blank=True, null=True, help_text="Número de documento")
    cli_cuit = models.CharField(max_length=20, blank=True, null=True, help_text="CUIT")
    cli_emai = models.EmailField(blank=True, null=True)
    cli_celu = models.CharField(max_length=20, blank=True, null=True, help_text="Celular")
    cli_tele = models.CharField(max_length=20, blank=True, null=True, help_text="Teléfono")
    cli_dire = models.CharField(max_length=150, blank=True)
    cli_bar = models.CharField(max_length=100, blank=True, help_text="Barrio")
    cli_estc = models.CharField(max_length=50, blank=True, null=True, help_text="Estado civil")
    cli_ocup = models.CharField(max_length=100, blank=True, null=True, help_text="Ocupación")
    
    # Cónyuge (opcional - en misma tabla)
    cli_nombc = models.CharField(max_length=150, blank=True, null=True, help_text="Nombre cónyuge")
    cli_fnbac = models.DateField(blank=True, null=True, help_text="Fecha nacimiento cónyuge")
    cli_tdocc = models.CharField(max_length=20, blank=True, null=True, help_text="Tipo documento cónyuge")
    cli_ndocc = models.CharField(max_length=20, blank=True, null=True, help_text="Número documento cónyuge")
    cli_cuitc = models.CharField(max_length=20, blank=True, null=True, help_text="CUIT cónyuge")
    
    # Relaciones
    loc_codi = models.ForeignKey(Localidad, on_delete=models.PROTECT, related_name="clientes")
    civ_codi = models.ForeignKey(CondicionIva, on_delete=models.SET_NULL, null=True, blank=True, related_name="clientes")
    
    # Control
    cli_fchc = models.DateTimeField(auto_now_add=True)
    cli_fmod = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ["cli_nomb"]

    def __str__(self):
        return f"{self.cli_nomb} - {self.cli_ndoc or 'S/D'}"


# ================================================================
# PEDIDOS (POVT - Tabla principal de salida)
# ================================================================
class Pedidos(models.Model):
    """Pedidos de venta - mapea POVT.DBF"""
    
    pov_codi = models.AutoField(primary_key=True)
    pov_fech = models.DateField(blank=True, null=True, help_text="Fecha del pedido")
    
    # Revendedor (FK)
    rev_codi = models.ForeignKey(Revendedor, on_delete=models.PROTECT, related_name="pedidos")
    
    # Cliente 
    cli_nomb = models.CharField(max_length=50, blank=True, null=True, help_text="Nombre cliente")
    cli_dire = models.CharField(max_length=80, blank=True, null=True, help_text="Dirección")
    loc_codi = models.ForeignKey(Localidad, on_delete=models.SET_NULL, null=True, blank=True)
    cli_tele = models.CharField(max_length=15, blank=True, null=True, help_text="Teléfono")
    cli_celu = models.CharField(max_length=15, blank=True, null=True, help_text="Celular")
    cli_emai = models.CharField(max_length=40, blank=True, null=True, help_text="Email")
    cli_fnac = models.DateField(blank=True, null=True, help_text="Fecha nacimiento")
    cli_tdoc = models.CharField(max_length=3, blank=True, null=True, help_text="Tipo documento")
    cli_ndoc = models.IntegerField(blank=True, null=True, help_text="Número documento")
    civ_codi = models.ForeignKey(CondicionIva, on_delete=models.SET_NULL, null=True, blank=True)
    cli_cuit = models.CharField(max_length=13, blank=True, null=True, help_text="CUIT")
    cli_estc = models.CharField(max_length=30, blank=True, null=True, help_text="Estado civil")
    cli_ocup = models.CharField(max_length=30, blank=True, null=True, help_text="Ocupación")
    
    # Cónyuge
    cli_nombc = models.CharField(max_length=50, blank=True, null=True, help_text="Nombre cónyuge")
    cli_tdocc = models.CharField(max_length=3, blank=True, null=True, help_text="Tipo doc cónyuge")
    cli_ndocc = models.IntegerField(blank=True, null=True, help_text="Nro doc cónyuge")
    cli_cuitc = models.CharField(max_length=13, blank=True, null=True, help_text="CUIT cónyuge")
    
    # Artículo / Vehículo
    pov_arti = models.ForeignKey(Articulos, on_delete=models.SET_NULL, null=True, blank=True, help_text="POV_ARTI")
    pov_mode = models.IntegerField(blank=True, null=True, help_text="Modelo/Año")
    pov_colo = models.ForeignKey(Color, on_delete=models.SET_NULL, null=True, blank=True, help_text="POV_COLO")
    pov_ncha = models.CharField(max_length=20, blank=True, null=True, help_text="Número chasis")
    pov_nmot = models.CharField(max_length=22, blank=True, null=True, help_text="Número motor")
    pov_ncer = models.CharField(max_length=20, blank=True, null=True, help_text="Número certificado")
    
    # Facturación
    com_codi = models.IntegerField(blank=True, null=True, help_text="Comprobante código")
    com_nomb = models.CharField(max_length=50, blank=True, null=True, help_text="Comprobante nombre (ej: FACTURA)")
    com_letr = models.CharField(max_length=1, blank=True, null=True, help_text="Comprobante letra (A, B, C, etc)")
    pov_flis = models.DateField(blank=True, null=True, help_text="Fecha lista precios")
    pov_plis = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text="Precio lista")
    
    # Forma de pago
    pov_finu = models.CharField(max_length=30, blank=True, null=True, help_text="Financiera utilizada")
    pov_numc = models.CharField(max_length=15, blank=True, null=True, help_text="Número cuotas")
    pov_impc = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text="Importe crédito")
    pov_nomc = models.CharField(max_length=50, blank=True, null=True, help_text="Nombre crédito")
    pov_tarc = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text="Tarjeta crédito")
    pov_ppag = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text="Pago contado/efectivo")
    pov_monf = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text="Monto final")
    pov_cheq = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text="Cheques (POV_CHE3)")
    pov_tran = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text="Transferencia")
    pov_cont = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True, help_text="Contado/Efectivo")
    
    # General
    gen_codi = models.IntegerField(blank=True, null=True, help_text="Código general")
    pov_cvta = models.BigIntegerField(blank=True, null=True, help_text="Confirmación venta")
    
    # Control Django
    pov_fchc = models.DateTimeField(auto_now_add=True, help_text="Fecha creación")
    pov_fmod = models.DateTimeField(auto_now=True, help_text="Fecha modificación")

    ped_exp = models.BooleanField( #muestra si el pedido fue exportado a la bdf o no 
        default=False,
        help_text="Indica si el pedido ya fue exportado a Genexus"
    )

    ped_fexp = models.DateTimeField( #fecha en la cual se exporto del back a la bdf 
        null=True,
        blank=True,
        help_text="Fecha en la que el pedido fue exportado"
    )

    class Meta:
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"
        ordering = ["-pov_codi"]
        indexes = [
            models.Index(fields=["rev_codi_id", "-pov_codi"], name="gestion_ped_rev_codi_pov_idx"),
        ]

    def __str__(self):
        return f"Pedido {self.pov_codi} - {self.cli_nomb or 'S/N'} ({self.pov_fech})"


# ================================================================
# GENERAL (Datos de la empresa)
# ================================================================
class General(models.Model):
    """Datos generales de la empresa"""
    gen_codi = models.IntegerField(primary_key=True, editable=True)
    gen_nomb = models.CharField(max_length=150, blank=True, help_text="Nombre de la empresa")
    gen_logo = models.ImageField(upload_to='logos/', blank=True, null=True, help_text="Logo de Centro Motos")
    gen_loge = models.ImageField(upload_to='logos/', blank=True, null=True, help_text="Logo de BrixSoft")

    class Meta:
        verbose_name = "General"
        verbose_name_plural = "General"

    def __str__(self):
        return self.gen_nomb


# ================================================================
# USUARIO ADMIN
# ================================================================
class Usuario(models.Model):
    """Usuarios administradores"""
    usu_perf = models.OneToOneField(User, on_delete=models.CASCADE, related_name="usuario")
    usu_nomb = models.CharField(max_length=100)
    usu_rol = models.CharField(max_length=20, default="USER")
    usu_fcre = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
        ordering = ["usu_nomb"]

    def __str__(self):
        return self.usu_nomb
