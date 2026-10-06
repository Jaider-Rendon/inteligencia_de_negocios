import sqlite3
import os
from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional

router = APIRouter(prefix="/api/metricas", tags=["Metricas"])

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "motoexpres_bi.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn

def obtener_filtro_rol(rol: str) -> str:
    """
    Retorna un fragmento WHERE adicional basado en el rol.
    Por defecto asume gerente_nacional (sin filtro).
    """
    if not rol:
        return ""
        
    rol = rol.lower().strip()
    
    # En la base de datos no hay una región 'Norte' literal, 
    # sino 'Antioquia', 'Magdalena Medio', 'Bogotá', 'Valle', 'Eje Cafetero'.
    # Usamos 'Antioquia' como equivalente para gerente_regional_norte.
    if rol == "gerente_regional_norte" or rol == "gerente_regional_antioquia":
        return " AND centro_id IN (SELECT centro_id FROM dim_centro WHERE region = 'Antioquia') "
    return ""

@router.get("/resumen")
def obtener_metricas_resumen(
    rol_query: Optional[str] = Query(None, alias="rol"),
    x_user_role: Optional[str] = Header(None)
):
    rol_efectivo = rol_query or x_user_role or "gerente_nacional"
    filtro_rls = obtener_filtro_rol(rol_efectivo)
    
    where_base = f"WHERE 1=1 {filtro_rls}"

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Total de envíos realizados
            cursor.execute(f"SELECT COUNT(*) as total FROM fact_ordenes {where_base}")
            total_envios = cursor.fetchone()["total"]
            
            # 2. Ingresos totales
            cursor.execute(f"SELECT SUM(precio) as ingresos FROM fact_ordenes {where_base}")
            ingresos_totales = cursor.fetchone()["ingresos"] or 0
            
            # 3. Costo promedio por envío
            cursor.execute(f"SELECT AVG(costo) as costo_promedio FROM fact_ordenes {where_base}")
            costo_promedio = cursor.fetchone()["costo_promedio"] or 0
            
            # 5. Tasa de entregas a tiempo
            cursor.execute(f"""
                SELECT 
                    SUM(CASE WHEN horas_reales <= horas_prometidas THEN 1 ELSE 0 END) * 100.0 / COUNT(horas_reales) as tasa 
                FROM fact_ordenes 
                {where_base} AND horas_reales IS NOT NULL
            """)
            row = cursor.fetchone()
            tasa_entregas_a_tiempo = row["tasa"] if row and row["tasa"] is not None else 0
            
            # 6. Crecimiento de ingresos mes actual vs mes anterior
            cursor.execute(f"""
                SELECT strftime('%Y-%m', fecha_orden) as mes, SUM(precio) as ingresos 
                FROM fact_ordenes 
                {where_base} AND fecha_orden IS NOT NULL 
                GROUP BY mes 
                ORDER BY mes DESC 
                LIMIT 2
            """)
            meses_ingresos = cursor.fetchall()
            
            ingreso_mes_actual = 0
            ingreso_mes_anterior = 0
            delta_ingresos = 0
            
            if len(meses_ingresos) > 0:
                ingreso_mes_actual = meses_ingresos[0]["ingresos"] or 0
            if len(meses_ingresos) > 1:
                ingreso_mes_anterior = meses_ingresos[1]["ingresos"] or 0
                
            if ingreso_mes_anterior > 0:
                delta_ingresos = ((ingreso_mes_actual - ingreso_mes_anterior) / ingreso_mes_anterior) * 100

            return {
                "perfil_activo": rol_efectivo,
                "total_envios": total_envios,
                "ingresos_totales": ingresos_totales,
                "costo_promedio": costo_promedio,
                "tasa_entregas_a_tiempo": tasa_entregas_a_tiempo,
                "crecimiento_ingresos": {
                    "mes_actual": ingreso_mes_actual,
                    "mes_anterior": ingreso_mes_anterior,
                    "delta_porcentaje": delta_ingresos
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo resumen de métricas: {str(e)}")


@router.get("/distribucion-entregas")
def obtener_distribucion_entregas(
    rol_query: Optional[str] = Query(None, alias="rol"),
    x_user_role: Optional[str] = Header(None)
):
    rol_efectivo = rol_query or x_user_role or "gerente_nacional"
    filtro_rls = obtener_filtro_rol(rol_efectivo)
    
    # En este JOIN, f es fact_ordenes. centro_id está en ambas tablas, 
    # pero como el filtro RLS se aplica usando un SELECT subquery en fact_ordenes, 
    # funcionará correctamente sin ambigüedad porque no hay un prefijo forzado, 
    # aunque para ser más seguros el RLS usa solo centro_id, y como ambas tablas lo tienen, puede fallar si SQLite se confunde.
    # Así que modificamos where_base para agregar 'f.'
    filtro_rls_alias = filtro_rls.replace("centro_id", "f.centro_id") if filtro_rls else ""
    where_base = f"WHERE 1=1 {filtro_rls_alias}"

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            # 4. Entregas por región/centro
            cursor.execute(f"""
                SELECT 
                    c.region, 
                    c.nombre_centro, 
                    COUNT(f.orden_id) as total_entregas 
                FROM fact_ordenes f
                JOIN dim_centro c ON f.centro_id = c.centro_id
                {where_base}
                GROUP BY c.region, c.nombre_centro
                ORDER BY total_entregas DESC
            """)
            resultados = cursor.fetchall()
            
            distribucion = []
            for row in resultados:
                distribucion.append({
                    "region": row["region"],
                    "centro": row["nombre_centro"],
                    "entregas": row["total_entregas"]
                })
                
            return {
                "perfil_activo": rol_efectivo,
                "distribucion": distribucion
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo distribución de entregas: {str(e)}")

@router.get("/ultimas-ordenes")
def obtener_ultimas_ordenes(
    rol_query: Optional[str] = Query(None, alias="rol"),
    x_user_role: Optional[str] = Header(None)
):
    rol_efectivo = rol_query or x_user_role or "gerente_nacional"
    filtro_rls = obtener_filtro_rol(rol_efectivo)
    
    where_base = f"WHERE 1=1 {filtro_rls}"

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(f"""
                SELECT 
                    orden_id, 
                    cliente_id, 
                    costo, 
                    precio,
                    estado,
                    strftime('%Y-%m-%d', fecha_orden) as fecha
                FROM fact_ordenes 
                {where_base}
                ORDER BY fecha_orden DESC
                LIMIT 10
            """)
            resultados = cursor.fetchall()
            
            ordenes = []
            for row in resultados:
                ordenes.append({
                    "orden_id": row["orden_id"],
                    "cliente_id": row["cliente_id"],
                    "costo": row["costo"],
                    "precio": row["precio"],
                    "estado": row["estado"],
                    "fecha": row["fecha"]
                })
                
            return {
                "perfil_activo": rol_efectivo,
                "ordenes": ordenes
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo últimas órdenes: {str(e)}")
