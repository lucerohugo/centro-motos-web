import sys
import requests
import json
import time
from datetime import datetime

# =========================
# CONFIG
# =========================
DELAY_SEGUNDOS = 30

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def main():
    try:
        log("=== INICIO SCRIPT LOCALIDADES ===")

        # =========================
        # ARGUMENTOS
        # =========================
        log(f"sys.argv: {sys.argv}")

        if len(sys.argv) < 4:
            log("❌ Faltan parámetros")
            log("Uso: python localidades.py <loc_codi> <loc_nomb> <pci_codi> [loc_cpos]")
            return

        loc_codi = int(sys.argv[1])
        loc_nomb = sys.argv[2]
        pci_codi = int(sys.argv[3])

        # opcional
        loc_cpos = sys.argv[4] if len(sys.argv) > 4 else None

        log(f"loc_codi: {loc_codi}")
        log(f"loc_nomb: {loc_nomb}")
        log(f"pci_codi: {pci_codi}")
        log(f"loc_cpos: {loc_cpos}")

        # =========================
        # DELAY
        # =========================
        log(f"⏳ Esperando {DELAY_SEGUNDOS} segundos...")
        time.sleep(DELAY_SEGUNDOS)

        # =========================
        # REQUEST
        # =========================
        url = "http://api.brixsoft.com/api/gestion/localidades/"
        log(f"URL: {url}")

        data = {
            "loc_codi": loc_codi,
            "loc_nomb": loc_nomb,
            "pci_codi": pci_codi
        }

        # solo lo agrega si viene
        if loc_cpos:
            data["loc_cpos"] = loc_cpos

        payload = {
            "localidades": [data]
        }

        log(f"Payload: {json.dumps(payload)}")

        log("🚀 Enviando request...")
        response = requests.post(url, json=payload)

        # =========================
        # RESPUESTA
        # =========================
        log("===== RESPUESTA =====")
        log(f"Status Code: {response.status_code}")
        log(f"Contenido: {response.text}")

        log("=== FIN SCRIPT ===")

    except Exception as e:
        log(f"❌ ERROR: {str(e)}")

if __name__ == "__main__":
    main()