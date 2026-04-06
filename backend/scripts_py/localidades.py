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

        if len(sys.argv) < 3:
            log("❌ Faltan parámetros")
            log("Uso: python localidades.py <loc_nomb> <pci_codi>")
            return

        loc_nomb = sys.argv[1]
        pci_codi = sys.argv[2]

        log(f"loc_nomb: {loc_nomb}")
        log(f"pci_codi: {pci_codi}")

        # =========================
        # DELAY
        # =========================
        log(f"⏳ Esperando {DELAY_SEGUNDOS} segundos...")
        time.sleep(DELAY_SEGUNDOS)

        # =========================
        # REQUEST
        # =========================
        url = "https://centro-motos-web.onrender.com/api/gestion/localidades/"
        log(f"URL: {url}")

        payload = {
            "localidades": [
                {
                    "loc_nomb": loc_nomb,
                    "pci_codi": int(pci_codi)
                }
            ]
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