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
        log("=== INICIO SCRIPT COMPROBANTES ===")

        # =========================
        # ARGUMENTOS
        # =========================
        log(f"sys.argv: {sys.argv}")

        if len(sys.argv) < 2:
            log("❌ Faltan parámetros")
            log("Uso: python comprobantes.py <com_nomb> [com_letr] [com_abre]")
            return

        # =========================
        # PARAMETROS
        # =========================
        com_nomb = sys.argv[1]
        com_letr = sys.argv[2] if len(sys.argv) > 2 else None
        com_abre = sys.argv[3] if len(sys.argv) > 3 else None

        log(f"com_nomb: {com_nomb}")
        log(f"com_letr: {com_letr}")
        log(f"com_abre: {com_abre}")

        # =========================
        # DELAY
        # =========================
        log(f"⏳ Esperando {DELAY_SEGUNDOS} segundos...")
        time.sleep(DELAY_SEGUNDOS)

        # =========================
        # REQUEST
        # =========================
        url = "http://138.36.237.49:8000/api/gestion/comprobantes/"
        log(f"URL: {url}")

        data = {
            "com_nomb": com_nomb #"Factura" o "Nota Debito" o "Ticket" etc
        }

        if com_letr:
            data["com_letr"] = com_letr #"A" "B" "C" etc

        if com_abre:
            data["com_abre"] = com_abre #"FACT" o "N.CR" o  "TICK" ETC

        payload = {
            "comprobantes": [data]
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