import sqlite3
import os
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/etl", tags=["Tablero"])
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "motoexpres_bi.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/tablero")
def obtener_datos_tablero(rol: Optional[str] = Query("gerencia_general")):
    """
    Endpoint integral para el Tablero con Control de Acceso (RLS).
    Calcula todas las métricas mediante consultas SQL eficientes.
    """
    filtro_rls = ""
    # Control de acceso simple basado en el prefijo 'regional_'
    rol = rol.lower().strip()
    if rol.startswith("regional_"):
        # Extraer el nombre de la región del rol (ej: 'regional_antioquia' -> 'antioquia')
        # Capitalizamos para que coincida con la BD (ej. 'Antioquia')
        region_nombre = rol.replace("regional_", "").title()
        
        # Casos especiales de tildes o nombres compuestos en la BD
        if region_nombre == "Valle": region_nombre = "Valle"
        elif region_nombre == "Bogota": region_nombre = "Bogotá"
        elif region_nombre == "Eje_Cafetero" or region_nombre == "Eje-Cafetero": region_nombre = "Eje Cafetero"
        elif region_nombre == "Magdalena_Medio" or region_nombre == "Magdalena-Medio": region_nombre = "Magdalena Medio"
        
        filtro_rls = f" AND c.region = '{region_nombre}'"

    where_clause = f"WHERE 1=1 {filtro_rls}"

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 1. KPIs Generales
            # Hacemos JOIN con dim_centro para poder aplicar el RLS por región
            query_kpis = f"""
                SELECT 
                    SUM(f.precio) as ingresos_totales,
                    COUNT(f.orden_id) as ordenes_validas,
                    SUM(f.costo) as costo_total,
                    SUM(CASE WHEN f.horas_reales <= f.horas_prometidas THEN 1 ELSE 0 END) as entregas_a_tiempo,
                    COUNT(f.horas_reales) as total_entregadas
                FROM fact_ordenes f
                JOIN dim_centro c ON f.centro_id = c.centro_id
                {where_clause}
            """
            cursor.execute(query_kpis)
            row_kpi = cursor.fetchone()
            
            ingresos_totales = row_kpi["ingresos_totales"] or 0
            ordenes_validas = row_kpi["ordenes_validas"] or 0
            costo_total = row_kpi["costo_total"] or 0
            
            margen = 0
            if ingresos_totales > 0:
                margen = ((ingresos_totales - costo_total) / ingresos_totales) * 100
                
            tasa_entregas_a_tiempo = 0
            if row_kpi["total_entregadas"] and row_kpi["total_entregadas"] > 0:
                tasa_entregas_a_tiempo = (row_kpi["entregas_a_tiempo"] / row_kpi["total_entregadas"]) * 100

            # 2. Ingresos por Mes (Gráfico de líneas)
            query_mes = f"""
                SELECT 
                    strftime('%Y-%m', f.fecha_orden) as mes, 
                    SUM(f.precio) as ingresos 
                FROM fact_ordenes f
                JOIN dim_centro c ON f.centro_id = c.centro_id
                {where_clause} AND f.fecha_orden IS NOT NULL 
                GROUP BY mes 
                ORDER BY mes ASC
            """
            cursor.execute(query_mes)
            ingresos_por_mes = [{"mes": r["mes"], "ingresos": r["ingresos"]} for r in cursor.fetchall()]

            # 3. Ingresos por Servicio (con región para permitir drill-down en frontend)
            query_servicio = f"""
                SELECT 
                    c.region,
                    s.tipo_servicio, 
                    SUM(f.precio) as ingresos 
                FROM fact_ordenes f
                JOIN dim_centro c ON f.centro_id = c.centro_id
                JOIN dim_servicio s ON f.servicio_id = s.servicio_id
                {where_clause}
                GROUP BY c.region, s.tipo_servicio
                ORDER BY ingresos DESC
            """
            cursor.execute(query_servicio)
            ingresos_por_servicio = [{"region": r["region"], "servicio": r["tipo_servicio"], "ingresos": r["ingresos"]} for r in cursor.fetchall()]

            # 4. Ingresos por Región
            query_region = f"""
                SELECT 
                    c.region, 
                    SUM(f.precio) as ingresos 
                FROM fact_ordenes f
                JOIN dim_centro c ON f.centro_id = c.centro_id
                {where_clause}
                GROUP BY c.region
                ORDER BY ingresos DESC
            """
            cursor.execute(query_region)
            ingresos_por_region = [{"region": r["region"], "ingresos": r["ingresos"]} for r in cursor.fetchall()]

            return {
                "perfil_activo": rol,
                "kpis": {
                    "ingresos_totales": ingresos_totales,
                    "ordenes_validas": ordenes_validas,
                    "margen_porcentaje": margen,
                    "entregas_a_tiempo_porcentaje": tasa_entregas_a_tiempo
                },
                "ingresos_por_mes": ingresos_por_mes,
                "ingresos_por_servicio": ingresos_por_servicio,
                "ingresos_por_region": ingresos_por_region
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en endpoint tablero: {str(e)}")

@router.get("/prueba-accesos")
def obtener_prueba_accesos():
    """
    Endpoint para probar matemáticamente que la suma de ingresos por región
    equivale al total global de ingresos (Validación del Control de Acceso).
    Añade registros simulados de log para la demostración visual.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Total Global
            cursor.execute("SELECT SUM(precio) as total FROM fact_ordenes")
            total_global = cursor.fetchone()["total"] or 0
            
            # 2. Total por regiones
            cursor.execute("""
                SELECT c.region, SUM(f.precio) as total_region 
                FROM fact_ordenes f 
                JOIN dim_centro c ON f.centro_id = c.centro_id 
                GROUP BY c.region
            """)
            regiones_db = cursor.fetchall()
            
            regiones = []
            for r in regiones_db:
                nombre_region = r["region"]
                if nombre_region:
                    nombre_region = nombre_region.strip().title()
                    # Formato específico para la vista
                    if nombre_region == "Bogota": nombre_region = "Bogotá"
                    regiones.append({
                        "region": f"Regional {nombre_region}",
                        "ingresos": r["total_region"] or 0
                    })
                
            # 3. Log de accesos simulado (basado en la hora actual o fijo para demo)
            import datetime
            now = datetime.datetime.now()
            logs = [
                f"{(now - datetime.timedelta(minutes=2)).strftime('%H:%M')} lgomez Gerente regional · Antioquia Tablero",
                f"{(now - datetime.timedelta(minutes=15)).strftime('%H:%M')} mrodriguez Gerente regional · Bogotá Explorar",
                f"{(now - datetime.timedelta(minutes=42)).strftime('%H:%M')} sysadmin Gerencia (todo) Alertas",
                f"{(now - datetime.timedelta(hours=1, minutes=5)).strftime('%H:%M')} jperez Gerente regional · Valle Tablero",
                f"{(now - datetime.timedelta(hours=2, minutes=12)).strftime('%H:%M')} dcastro Gerente regional · Eje Cafetero Tablero"
            ]
                
            return {
                "total_gerencia": total_global,
                "regiones": regiones,
                "registros_log": logs
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en prueba-accesos: {str(e)}")
