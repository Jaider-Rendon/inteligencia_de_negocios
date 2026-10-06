import sqlite3
import os
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/etl", tags=["Explorar"])

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "motoexpres_bi.db")

def get_conn():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn

# Mapa de nombres de región normalizados (igual que tablero.py)
REGIONES_VALIDAS = {
    "Valle": "Valle",
    "Bogotá": "Bogotá",
    "Bogota": "Bogotá",
    "Antioquia": "Antioquia",
    "Eje Cafetero": "Eje Cafetero",
    "Eje_Cafetero": "Eje Cafetero",
    "Magdalena Medio": "Magdalena Medio",
    "Magdalena_Medio": "Magdalena Medio",
}

def normalizar_region(region: str) -> str:
    """Normaliza el nombre de la región para que coincida exactamente con la BD."""
    region = region.strip()
    # Intentar match exacto primero
    if region in REGIONES_VALIDAS:
        return REGIONES_VALIDAS[region]
    # Intentar con capitalize si viene en minúsculas
    capitalized = region.replace("_", " ").title()
    return REGIONES_VALIDAS.get(capitalized, capitalized)


@router.get("/explorar")
def obtener_datos_explorar(
    region: Optional[str] = Query("Valle", description="Nombre de la región a explorar")
):
    """
    Endpoint de exploración regional.
    Calcula KPIs, distribución por servicio y tabla de participación
    (región vs. promedio global) — todo dinámico desde SQLite.
    """
    region_nombre = normalizar_region(region)

    try:
        with get_conn() as conn:
            cursor = conn.cursor()

            # ── 1. KPIs de la región seleccionada ─────────────────────────
            cursor.execute("""
                SELECT
                    SUM(f.precio)  AS ingresos_totales,
                    COUNT(f.orden_id) AS total_ordenes,
                    SUM(f.costo)   AS costo_total
                FROM fact_ordenes f
                JOIN dim_centro c ON f.centro_id = c.centro_id
                WHERE c.region = ?
            """, (region_nombre,))
            row = cursor.fetchone()

            ingresos_region  = row["ingresos_totales"] or 0
            ordenes_region   = row["total_ordenes"]    or 0
            costo_region     = row["costo_total"]      or 0

            ticket_promedio  = round(ingresos_region / ordenes_region, 2) if ordenes_region > 0 else 0
            margen_region    = round(
                ((ingresos_region - costo_region) / ingresos_region) * 100, 2
            ) if ingresos_region > 0 else 0

            kpis = {
                "ingresos_totales": ingresos_region,
                "total_ordenes":    ordenes_region,
                "ticket_promedio":  ticket_promedio,
                "margen_porcentaje": margen_region,
            }

            # ── 2. Ingresos por servicio (dentro de la región) ─────────────
            cursor.execute("""
                SELECT
                    s.tipo_servicio AS servicio,
                    SUM(f.precio)   AS ingresos
                FROM fact_ordenes f
                JOIN dim_centro  c ON f.centro_id  = c.centro_id
                JOIN dim_servicio s ON f.servicio_id = s.servicio_id
                WHERE c.region = ?
                  AND s.tipo_servicio IS NOT NULL
                GROUP BY s.tipo_servicio
                ORDER BY ingresos DESC
            """, (region_nombre,))
            servicios_region_rows = cursor.fetchall()

            ingresos_por_servicio = [
                {"servicio": r["servicio"], "ingresos": r["ingresos"]}
                for r in servicios_region_rows
            ]

            # ── 3. Tabla de participación: región vs. promedio global ───────
            #
            #  Para cada servicio calculamos:
            #    · pct_region   = ingresos_servicio_en_region / ingresos_totales_region
            #    · pct_promedio = promedio de (ingresos_servicio_en_X / ingresos_totales_en_X)
            #                     para cada región X (todas las 5 regiones)
            #    · diferencia   = pct_region - pct_promedio

            # 3a. Total de ingresos por región (para calcular porcentajes por región)
            cursor.execute("""
                SELECT c.region, SUM(f.precio) AS total_region
                FROM fact_ordenes f
                JOIN dim_centro c ON f.centro_id = c.centro_id
                GROUP BY c.region
            """)
            totales_por_region = {r["region"]: r["total_region"] for r in cursor.fetchall()}
            todas_las_regiones = list(totales_por_region.keys())
            n_regiones = len(todas_las_regiones)

            # 3b. Ingresos por (región, servicio)
            cursor.execute("""
                SELECT
                    c.region,
                    s.tipo_servicio AS servicio,
                    SUM(f.precio)   AS ingresos
                FROM fact_ordenes f
                JOIN dim_centro  c ON f.centro_id  = c.centro_id
                JOIN dim_servicio s ON f.servicio_id = s.servicio_id
                WHERE s.tipo_servicio IS NOT NULL
                GROUP BY c.region, s.tipo_servicio
            """)
            rows_global = cursor.fetchall()

            # Construir dict: {servicio: {region: ingresos}}
            from collections import defaultdict
            mapa_global: dict = defaultdict(lambda: defaultdict(float))
            for r in rows_global:
                mapa_global[r["servicio"]][r["region"]] = r["ingresos"]

            # Construir tabla de participación
            tabla_participacion = []
            for srv_row in servicios_region_rows:
                srv = srv_row["servicio"]
                ing_srv_region = srv_row["ingresos"]

                # % en la región seleccionada
                pct_region = round(
                    (ing_srv_region / ingresos_region * 100) if ingresos_region > 0 else 0, 2
                )

                # Promedio del % de ese servicio en CADA región
                suma_pct_global = 0.0
                for reg in todas_las_regiones:
                    total_reg = totales_por_region.get(reg, 0)
                    ing_srv_reg = mapa_global[srv].get(reg, 0)
                    if total_reg > 0:
                        suma_pct_global += (ing_srv_reg / total_reg) * 100
                pct_promedio = round(suma_pct_global / n_regiones if n_regiones > 0 else 0, 2)

                diferencia = round(pct_region - pct_promedio, 2)

                tabla_participacion.append({
                    "servicio":          srv,
                    "ingresos_region":   ing_srv_region,
                    "porcentaje_region": pct_region,
                    "porcentaje_promedio": pct_promedio,
                    "diferencia":        diferencia,
                })

            # Ordenar de mayor a menor ingresos en la región
            tabla_participacion.sort(key=lambda x: x["ingresos_region"], reverse=True)

            return {
                "region_activa": region_nombre,
                "regiones_disponibles": todas_las_regiones,
                "kpis": kpis,
                "ingresos_por_servicio": ingresos_por_servicio,
                "tabla_participacion": tabla_participacion,
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en endpoint explorar: {str(e)}")
