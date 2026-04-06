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
        log("=== INICIO SCRIPT RUBROS ===")

        # =========================
        # ARGUMENTOS
        # =========================
        log(f"sys.argv: {sys.argv}")

        if len(sys.argv) < 3:
            log("❌ Faltan parámetros")
            log("Uso: python rubros.py <rub_nomb> <mar_codi>")
            return

        rub_nomb = sys.argv[1]
        mar_codi = sys.argv[2]

        log(f"rub_nomb: {rub_nomb}")
        log(f"mar_codi: {mar_codi}")

        # =========================
        # DELAY
        # =========================
        log(f"⏳ Esperando {DELAY_SEGUNDOS} segundos...")
        time.sleep(DELAY_SEGUNDOS)

        # =========================
        # REQUEST
        # =========================
        url = "https://centro-motos-web.onrender.com/api/gestion/rubros/"
        log(f"URL: {url}")

        payload = {
            "rubros": [
                {
                    "rub_nomb": rub_nomb,
                    "mar_codi": int(mar_codi) #codigo de la marca (ejemplo:codigo 1 = Honda) 
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