import sys
import requests
import json
import time
from datetime import datetime

DELAY_SEGUNDOS = 30

def log(msg):
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {msg}")

def main():
    try:
        log("=== INICIO SCRIPT MARCAS ===")

        log(f"sys.argv: {sys.argv}")

        if len(sys.argv) < 3:
            log("❌ Faltan parámetros")
            log("Uso: python marcas.py <mar_codi> <mar_nomb>")
            return

        mar_codi = int(sys.argv[1])
        mar_nomb = sys.argv[2]

        log(f"mar_codi: {mar_codi}")
        log(f"mar_nomb: {mar_nomb}")

        log(f"⏳ Esperando {DELAY_SEGUNDOS} segundos...")
        time.sleep(DELAY_SEGUNDOS)

        # ✅ NUEVA URL (Brixsoft)
        url = "http://api.brixsoft.com/api/gestion/marcas/"
        log(f"URL: {url}")

        payload = {
            "marcas": [
                {
                    "mar_codi": mar_codi,
                    "mar_nomb": mar_nomb
                }
            ]
        }

        log(f"Payload: {json.dumps(payload)}")

        log("🚀 Enviando request...")
        response = requests.post(url, json=payload)

        log("===== RESPUESTA =====")
        log(f"Status Code: {response.status_code}")
        log(f"Contenido: {response.text}")

        log("=== FIN SCRIPT ===")

    except Exception as e:
        log(f"❌ ERROR: {str(e)}")


if __name__ == "__main__":
    main()