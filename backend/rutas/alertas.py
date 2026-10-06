import sqlite3
import os
import pandas as pd
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/etl", tags=["Alertas"])

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "motoexpres_bi.db")


def get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn


@router.get("/alertas")
def obtener_alertas():
    """
    Endpoint de detección de anomalías (Hito 2 - E11).

    Devuelve:
      - grafico:  serie mensual de órdenes con flag es_anomalia (Z-score > 2)
      - alertas:  3 tarjetas: anomalía dinámica, estacionalidad, umbral de calidad
    """
    try:
        with get_conn() as conn:

            # ── 1. Serie mensual de órdenes ─────────────────────────────
            df = pd.read_sql_query(
                """
                SELECT
                    strftime('%Y-%m', f.fecha_orden) AS mes,
                    COUNT(f.orden_id)                AS ordenes
                FROM fact_ordenes f
                WHERE f.fecha_orden IS NOT NULL
                GROUP BY mes
                ORDER BY mes ASC
                """,
                conn,
            )

            if df.empty:
                raise HTTPException(status_code=404, detail="No hay datos en fact_ordenes.")

            # ── 2. Z-Score por mes ──────────────────────────────────────
            media     = df["ordenes"].mean()
            std       = df["ordenes"].std(ddof=1)          # desviación estándar muestral

            df["zscore"]       = (df["ordenes"] - media) / std if std > 0 else 0.0
            df["es_anomalia"]  = df["zscore"].abs() > 2.0

            # ── 3. Identificar el mes con mayor |z| como la "gran anomalía"
            idx_max_z     = df["zscore"].abs().idxmax()
            mes_anomalia  = df.loc[idx_max_z]

            # ── 4. Meses de diciembre (estacionalidad) ─────────────────
            df["mes_num"] = df["mes"].str[5:7]            # "01"…"12"
            diciembres    = df[df["mes_num"] == "12"]
            avg_dic       = round(diciembres["ordenes"].mean()) if not diciembres.empty else 0
            avg_general   = round(media)

            # ── 5. Entregas a tiempo (umbral de calidad) ───────────────
            row_qa = pd.read_sql_query(
                """
                SELECT
                    SUM(CASE WHEN horas_reales <= horas_prometidas THEN 1 ELSE 0 END) AS a_tiempo,
                    COUNT(horas_reales) AS total_entregadas
                FROM fact_ordenes
                WHERE horas_reales IS NOT NULL
                """,
                conn,
            ).iloc[0]

            tasa_ot = 0.0
            if row_qa["total_entregadas"] and row_qa["total_entregadas"] > 0:
                tasa_ot = round(
                    (row_qa["a_tiempo"] / row_qa["total_entregadas"]) * 100, 1
                )

            brecha_meta = round(85.0 - tasa_ot, 1)

            # ── 6. Construir lista grafico ─────────────────────────────
            grafico = [
                {
                    "mes":          row["mes"],
                    "ordenes":      int(row["ordenes"]),
                    "zscore":       round(float(row["zscore"]), 2),
                    "es_anomalia":  bool(row["es_anomalia"]),
                }
                for _, row in df.iterrows()
            ]

            # ── 7. Construir tarjetas de alertas ───────────────────────
            z_val       = round(float(mes_anomalia["zscore"]), 2)
            ordenes_an  = int(mes_anomalia["ordenes"])
            diff_pct    = round(((ordenes_an - avg_general) / avg_general) * 100) if avg_general > 0 else 0

            alertas = [
                {
                    "tipo":     "anomalia",
                    "nivel":    "alto" if abs(z_val) > 3 else "medio",
                    "titulo":   f"Anomalía detectada — {mes_anomalia['mes']}",
                    "subtitulo": (
                        f"{ordenes_an:,} órdenes ese mes "
                        f"({'+' if diff_pct >= 0 else ''}{diff_pct}% sobre la media). "
                        f"Z-score = {z_val}."
                    ).replace(",", "."),
                    "detalle": (
                        "El volumen es estadísticamente atípico (|Z| > 2). "
                        "Acción recomendada: verificar si corresponde a una campaña comercial "
                        "o a un ingreso masivo de datos duplicados antes de su eliminación."
                    ),
                    "mes":          mes_anomalia["mes"],
                    "ordenes":      ordenes_an,
                    "zscore":       z_val,
                    "media_mensual": round(media),
                },
                {
                    "tipo":       "estacional",
                    "nivel":      "informativo",
                    "titulo":     "Patrón estacional — Diciembres",
                    "subtitulo":  (
                        f"Promedio diciembre: {avg_dic:,} órdenes vs. "
                        f"media general: {avg_general:,} órdenes."
                    ).replace(",", "."),
                    "detalle": (
                        "Los diciembres muestran sistemáticamente volúmenes superiores "
                        "a la media por temporada alta. Este comportamiento es esperado "
                        "y no debe tratarse como un error de datos, sino como un ciclo operativo."
                    ),
                    "promedio_diciembre": avg_dic,
                    "promedio_general":   avg_general,
                },
                {
                    "tipo":      "umbral",
                    "nivel":     "alto" if tasa_ot < 60 else "medio",
                    "titulo":    "Umbral de calidad — Entregas a tiempo",
                    "subtitulo": (
                        f"Tasa actual: {tasa_ot}% · Meta: 85% · "
                        f"Brecha: {brecha_meta} pp"
                    ),
                    "detalle": (
                        f"Solo el {tasa_ot}% de los envíos cumplió la promesa de servicio. "
                        f"La meta operativa es 85%. Se requiere reducir la brecha de {brecha_meta} "
                        "puntos porcentuales revisando las rutas con mayor demora "
                        "y los centros con peor desempeño."
                    ),
                    "tasa_actual":   tasa_ot,
                    "meta":          85.0,
                    "brecha_puntos": brecha_meta,
                },
            ]

            return {
                "resumen": {
                    "meses_analizados":    len(df),
                    "media_mensual":       round(media),
                    "std_mensual":         round(std, 1),
                    "meses_anomalos":      int(df["es_anomalia"].sum()),
                    "tasa_entregas_tiempo": tasa_ot,
                },
                "grafico": grafico,
                "alertas": alertas,
            }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en endpoint alertas: {str(e)}")
