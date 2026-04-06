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
        log("=== INICIO SCRIPT ARTICULOS ===")
        log(f"sys.argv: {sys.argv}")

        if len(sys.argv) < 2:
            log("❌ Uso:")
            log("python articulos.py <art_nomb> [art_mode] [mar_codi] [rub_codi] [sru_codi] [art_tiva] [art_plis] [art_prec] [art_tprec]")
            return

        # =========================
        # PARAMETROS
        # =========================
        art_nomb = sys.argv[1]
        art_mode = sys.argv[2] if len(sys.argv) > 2 else None
        mar_codi = sys.argv[3] if len(sys.argv) > 3 else None
        rub_codi = sys.argv[4] if len(sys.argv) > 4 else None
        sru_codi = sys.argv[5] if len(sys.argv) > 5 else None
        art_tiva = sys.argv[6] if len(sys.argv) > 6 else None
        art_plis = sys.argv[7] if len(sys.argv) > 7 else None
        art_prec = sys.argv[8] if len(sys.argv) > 8 else None
        art_tprec = sys.argv[9] if len(sys.argv) > 9 else None

        # =========================
        # LOG
        # =========================
        log(f"art_nomb: {art_nomb}")
        log(f"art_mode: {art_mode}")
        log(f"mar_codi: {mar_codi}")
        log(f"rub_codi: {rub_codi}")
        log(f"sru_codi: {sru_codi}")
        log(f"art_tiva: {art_tiva}")
        log(f"art_plis: {art_plis}")
        log(f"art_prec: {art_prec}")
        log(f"art_tprec: {art_tprec}")

        log(f"⏳ Esperando {DELAY_SEGUNDOS} segundos...")
        time.sleep(DELAY_SEGUNDOS)

        url = "http://138.36.237.49:8000/api/gestion/articulos/"
        log(f"URL: {url}")

        # =========================
        # ARMADO DINAMICO
        # =========================
        data = {
            "art_nomb": art_nomb
        }

        if art_mode:
            data["art_mode"] = art_mode

        if mar_codi:
            data["mar_codi"] = int(mar_codi)

        if rub_codi:
            data["rub_codi"] = int(rub_codi)

        if sru_codi:
            data["sru_codi"] = int(sru_codi)

        if art_tiva:
            data["art_tiva"] = int(art_tiva)

        if art_plis:
            data["art_plis"] = float(art_plis)

        if art_prec:
            data["art_prec"] = float(art_prec)

        if art_tprec:
            data["art_tprec"] = art_tprec  # F o N

        payload = {
            "articulos": [data]
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