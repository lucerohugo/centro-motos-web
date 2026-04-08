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
        log("=== INICIO SCRIPT SUBRUBROS ===")

        log(f"sys.argv: {sys.argv}")

        if len(sys.argv) < 4:
            log("❌ Faltan parámetros")
            log("Uso: python subrubros.py <sru_codi> <sru_nomb> <rub_codi>")
            return

        sru_codi = int(sys.argv[1])
        sru_nomb = sys.argv[2]
        rub_codi = int(sys.argv[3])

        log(f"sru_codi: {sru_codi}")
        log(f"sru_nomb: {sru_nomb}")
        log(f"rub_codi: {rub_codi}")

        log(f"⏳ Esperando {DELAY_SEGUNDOS} segundos...")
        time.sleep(DELAY_SEGUNDOS)

        # ✅ NUEVA URL
        url = "http://api.brixsoft.com/api/gestion/subrubros/"
        log(f"URL: {url}")

        payload = {
            "subrubros": [
                {
                    "sru_codi": sru_codi,
                    "sru_nomb": sru_nomb,
                    "rub_codi": rub_codi
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