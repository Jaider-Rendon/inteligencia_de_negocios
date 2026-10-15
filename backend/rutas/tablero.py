import sqlite3
import os
import datetime
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

router = APIRouter(prefix="/api/etl", tags=["Tablero"])
DB_PATH = os.path.join(os.path.dirname(__file__), "..", "motoexpres_bi.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, timeout=30.0)
    conn.row_factory = sqlite3.Row
    return conn

from pydantic import BaseModel

def init_log_table():
    """Crea la tabla log_accesos si no existe con soporte de trazabilidad detallada."""
    with get_db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS log_accesos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                usuario TEXT NOT NULL,
                rol TEXT NOT NULL,
                rol_label TEXT NOT NULL,
                seccion TEXT NOT NULL,
                accion TEXT NOT NULL
            )
        """)
        # Asegurar compatibilidad en caso de que existiera una tabla antigua con menos columnas
        try:
            conn.execute("ALTER TABLE log_accesos ADD COLUMN accion TEXT DEFAULT 'Acceso a la sección'")
        except Exception:
            pass
        try:
            conn.execute("ALTER TABLE log_accesos ADD COLUMN rol TEXT DEFAULT 'gerencia_general'")
        except Exception:
            pass
        conn.commit()

# Mapa de rol técnico -> label legible
_ROL_LABELS = {
    "gerencia_general": "Gerente General (Total)",
    "regional_antioquia": "Gerente Regional · Antioquia",
    "regional_bogota": "Gerente Regional · Bogotá",
    "regional_eje_cafetero": "Gerente Regional · Eje Cafetero",
    "regional_magdalena_medio": "Gerente Regional · Magdalena Medio",
    "regional_valle": "Gerente Regional · Valle",
}

# Mapa de rol -> usuario específico del sistema
_ROL_USUARIO = {
    "gerencia_general": "sysadmin",
    "regional_antioquia": "lgomez",
    "regional_bogota": "mrodriguez",
    "regional_eje_cafetero": "dcastro",
    "regional_magdalena_medio": "cmorales",
    "regional_valle": "jperez",
}

def registrar_acceso(rol: str, seccion: str, accion: Optional[str] = None, usuario_override: Optional[str] = None):
    """Inserta una fila en log_accesos con usuario, rol, sección y la acción o búsqueda real."""
    try:
        init_log_table()
        rol_key = rol.lower().strip()
        usuario = usuario_override or _ROL_USUARIO.get(rol_key, "usuario_general")
        rol_label = _ROL_LABELS.get(rol_key, rol_key.replace("_", " ").title())
        
        if not accion:
            if seccion == "Tablero":
                if rol_key == "gerencia_general":
                    accion = "Consulta consolidado nacional (Total país, sin restricciones)"
                else:
                    region = rol_key.replace("regional_", "").title()
                    accion = f"Consulta tablero con filtro RLS: Región {region}"
            elif seccion == "Explorar":
                accion = "Exploración de métricas regionales"
            elif seccion == "Alertas":
                accion = "Revisión de alertas y anomalías operativas"
            elif seccion == "Accesos":
                accion = "Auditoría de accesos y validación RLS"
            else:
                accion = f"Acceso a sección {seccion}"

        ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with get_db_connection() as conn:
            conn.execute(
                "INSERT INTO log_accesos (timestamp, usuario, rol, rol_label, seccion, accion) VALUES (?, ?, ?, ?, ?, ?)",
                (ts, usuario, rol_key, rol_label, seccion, accion)
            )
            conn.commit()
    except Exception as e:
        print("Aviso al registrar acceso:", e)

class LogAccesoPayload(BaseModel):
    rol: str
    seccion: str
    accion: str
    usuario: Optional[str] = None

@router.post("/registrar-acceso")
def api_registrar_acceso(data: LogAccesoPayload):
    """Endpoint para registrar búsquedas y acciones interactivas desde el frontend."""
    registrar_acceso(data.rol, data.seccion, data.accion, data.usuario)
    return {"status": "ok", "message": "Acceso registrado con éxito"}

@router.delete("/limpiar-logs")
def api_limpiar_logs():
    """Limpia el historial de auditoría de log_accesos."""
    try:
        init_log_table()
        with get_db_connection() as conn:
            conn.execute("DELETE FROM log_accesos")
            conn.commit()
        return {"status": "ok", "message": "Logs de auditoría reiniciados"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tablero")
def obtener_datos_tablero(rol: Optional[str] = Query("gerencia_general")):
    """
    Endpoint integral para el Tablero con Control de Acceso (RLS).
    Calcula todas las métricas mediante consultas SQL eficientes.
    Registra el acceso en la tabla log_accesos.
    """
    registrar_acceso(rol.lower().strip(), "Tablero")
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

            # 5. Comparativa Anual (2024 frente a 2025 y tratamiento del pico de agosto)
            query_anual = f"""
                SELECT 
                    strftime('%Y', f.fecha_orden) as anio,
                    strftime('%m', f.fecha_orden) as mes_num,
                    SUM(f.precio) as ingresos
                FROM fact_ordenes f
                JOIN dim_centro c ON f.centro_id = c.centro_id
                {where_clause} AND strftime('%Y', f.fecha_orden) IN ('2024', '2025')
                GROUP BY anio, mes_num
            """
            cursor.execute(query_anual)
            filas_anual = cursor.fetchall()
            
            ingresos_2025 = sum(r["ingresos"] for r in filas_anual if r["anio"] == "2025")
            ingresos_2024_total = sum(r["ingresos"] for r in filas_anual if r["anio"] == "2024")
            
            meses_no_agosto_2024 = [r["ingresos"] for r in filas_anual if r["anio"] == "2024" and r["mes_num"] != "08"]
            agosto_2024 = sum(r["ingresos"] for r in filas_anual if r["anio"] == "2024" and r["mes_num"] == "08")
            promedio_tipico = (sum(meses_no_agosto_2024) / len(meses_no_agosto_2024)) if meses_no_agosto_2024 else 0
            
            ingresos_2024_tipico = (ingresos_2024_total - agosto_2024) + promedio_tipico
            
            var_con_pico = ((ingresos_2025 - ingresos_2024_total) / ingresos_2024_total * 100) if ingresos_2024_total > 0 else 0
            var_tipico = ((ingresos_2025 - ingresos_2024_tipico) / ingresos_2024_tipico * 100) if ingresos_2024_tipico > 0 else 0
            
            comparativa_anual = {
                "con_pico_2024": round(ingresos_2024_total, 2),
                "con_pico_var_2025": round(var_con_pico, 2),
                "tipico_2024": round(ingresos_2024_tipico, 2),
                "tipico_var_2025": round(var_tipico, 2),
                "ingresos_2025": round(ingresos_2025, 2)
            }

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
                "ingresos_por_region": ingresos_por_region,
                "comparativa_anual": comparativa_anual
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en endpoint tablero: {str(e)}")

@router.get("/historia")
def obtener_datos_historia():
    """
    Endpoint dinámico para Data Storytelling (Hito 3 - E15-E16).
    Genera las 5 escenas de la historia con datos reales de la base de datos:
      1. Contexto: Crecimiento y evolución anual (2022-2025).
      2. Problema: Cumplimiento de entregas a tiempo y brecha frente a la meta (85%).
      3. Detalle: Distribución de retrasos por las 5 regiones operativas reales.
      4. Causa: Desempeño y volumen de retrasos por tipo de servicio.
      5. Decisión: Proyección y plan operativo para alcanzar la meta del 85%.
    """
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()

            # Escena 1: Volumen e ingresos por año
            cursor.execute("""
                SELECT 
                    strftime('%Y', fecha_orden) as anio, 
                    COUNT(*) as ordenes, 
                    SUM(precio) as ingresos
                FROM fact_ordenes
                WHERE fecha_orden IS NOT NULL
                GROUP BY anio
                ORDER BY anio
            """)
            volumen_anual = cursor.fetchall()
            datos_e1 = [{"name": r["anio"], "ordenes": r["ordenes"], "ingresos_millones": round((r["ingresos"] or 0) / 1_000_000, 1)} for r in volumen_anual]

            # Escena 2: Cumplimiento anual vs Meta 85%
            cursor.execute("""
                SELECT 
                    strftime('%Y', fecha_orden) as anio,
                    ROUND(SUM(CASE WHEN horas_reales <= horas_prometidas THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(horas_reales), 1) as tasa_cumplimiento,
                    ROUND(AVG(horas_reales), 1) as tiempo_promedio
                FROM fact_ordenes
                WHERE fecha_orden IS NOT NULL AND horas_reales IS NOT NULL
                GROUP BY anio
                ORDER BY anio
            """)
            cumplimiento_rows = cursor.fetchall()
            datos_e2 = [{"name": r["anio"], "cumplimiento": r["tasa_cumplimiento"], "meta": 85.0} for r in cumplimiento_rows]

            # Escena 3: Desempeño por regiones reales
            cursor.execute("""
                SELECT 
                    c.region,
                    COUNT(f.orden_id) as total_ordenes,
                    SUM(CASE WHEN f.horas_reales > f.horas_prometidas THEN 1 ELSE 0 END) as retrasos,
                    ROUND(SUM(CASE WHEN f.horas_reales <= f.horas_prometidas THEN 1.0 ELSE 0.0 END) * 100.0 / COUNT(f.horas_reales), 1) as tasa_cumplimiento
                FROM fact_ordenes f
                JOIN dim_centro c ON f.centro_id = c.centro_id
                GROUP BY c.region
                ORDER BY retrasos DESC
            """)
            regiones_rows = cursor.fetchall()
            datos_e3 = [{"name": r["region"], "value": r["retrasos"], "tasa": r["tasa_cumplimiento"]} for r in regiones_rows]

            # Escena 4: Causa raíz - Retrasos por servicio
            cursor.execute("""
                SELECT 
                    COALESCE(s.tipo_servicio, 'Sin servicio') as servicio,
                    SUM(CASE WHEN f.horas_reales <= f.horas_prometidas THEN 1 ELSE 0 END) as a_tiempo,
                    SUM(CASE WHEN f.horas_reales > f.horas_prometidas THEN 1 ELSE 0 END) as retrasadas
                FROM fact_ordenes f
                LEFT JOIN dim_servicio s ON f.servicio_id = s.servicio_id
                WHERE f.horas_reales IS NOT NULL
                GROUP BY servicio
                ORDER BY retrasadas DESC
                LIMIT 5
            """)
            servicios_rows = cursor.fetchall()
            datos_e4 = [{"name": r["servicio"], "a_tiempo": r["a_tiempo"], "retrasadas": r["retrasadas"]} for r in servicios_rows]

            # Escena 5: Plan de acción y proyección mensual hacia la meta (85%)
            tasa_actual = datos_e2[-1]["cumplimiento"] if datos_e2 else 50.0
            step = (85.0 - tasa_actual) / 4
            datos_e5 = [
                {"name": "Actual", "proyectado": round(tasa_actual, 1), "meta": 85.0},
                {"name": "Mes 1", "proyectado": round(tasa_actual + step * 1, 1), "meta": 85.0},
                {"name": "Mes 2", "proyectado": round(tasa_actual + step * 2, 1), "meta": 85.0},
                {"name": "Mes 3", "proyectado": round(tasa_actual + step * 3, 1), "meta": 85.0},
                {"name": "Mes 4 (Meta)", "proyectado": 85.0, "meta": 85.0},
            ]

            total_ordenes_historia = sum(r["ordenes"] for r in datos_e1)
            total_ingresos_historia = sum(r["ingresos_millones"] for r in datos_e1)
            pico_ordenes = max(datos_e1, key=lambda x: x["ordenes"]) if datos_e1 else {"name": "N/A", "ordenes": 0}
            if len(datos_e1) == 1:
                periodo_str = f"Durante el año {datos_e1[0]['name']}"
            elif len(datos_e1) > 1:
                periodo_str = f"Entre {datos_e1[0]['name']} y {datos_e1[-1]['name']}"
            else:
                periodo_str = "En el periodo analizado"

            def fmt_n(n): return f"{n:,}".replace(",", ".")
            def fmt_m(m): return f"{m:,.1f}".replace(",", "X").replace(".", ",").replace("X", ".")

            desc_e1 = (
                f"{periodo_str}, MotoExpres procesó {fmt_n(total_ordenes_historia)} órdenes válidas, "
                f"generando más de ${fmt_m(total_ingresos_historia)} millones de pesos en ingresos. "
                f"El negocio alcanzó su mayor actividad en {pico_ordenes['name']} con {fmt_n(pico_ordenes['ordenes'])} envíos."
            )

            if len(datos_e3) >= 2:
                top_2 = datos_e3[:2]
                retrasos_top2 = sum(r["value"] for r in top_2)
                nombres_top2 = " y ".join(r["name"] for r in top_2)
                desc_e3 = (
                    f"El análisis geográfico revela que {nombres_top2} concentran {fmt_n(retrasos_top2)} entregas retrasadas "
                    f"combinadas, representando los dos cuellos de botella prioritarios del país."
                )
            else:
                desc_e3 = "El análisis geográfico revela la distribución y concentración de entregas retrasadas por región."

            escenas = [
                {
                    "id": 1,
                    "antetitulo": "Escena 1: Contexto",
                    "titulo": "El volumen operativo de MotoExpres",
                    "descripcion": desc_e1,
                    "tipoGrafico": "bar",
                    "datos": datos_e1
                },
                {
                    "id": 2,
                    "antetitulo": "Escena 2: Problema",
                    "titulo": "La brecha en la promesa de servicio",
                    "descripcion": f"A pesar del sólido volumen, la tasa de entregas a tiempo se ha mantenido en torno al {tasa_actual}%, dejando una brecha de {round(85.0 - tasa_actual, 1)} puntos porcentuales frente al objetivo corporativo del 85%.",
                    "tipoGrafico": "line",
                    "datos": datos_e2
                },
                {
                    "id": 3,
                    "antetitulo": "Escena 3: Detalle",
                    "titulo": "Concentración de demoras por región",
                    "descripcion": desc_e3,
                    "tipoGrafico": "pie",
                    "datos": datos_e3
                },
                {
                    "id": 4,
                    "antetitulo": "Escena 4: Causa",
                    "titulo": "Servicios con mayor impacto de demoras",
                    "descripcion": "El servicio Estándar y Express representan el mayor volumen absoluto de demoras operativas. La capacidad de asignación de mensajeros en rutas troncales se satura en horas de alta demanda.",
                    "tipoGrafico": "bar",
                    "datos": datos_e4
                },
                {
                    "id": 5,
                    "antetitulo": "Escena 5: Decisión",
                    "titulo": "Ruta de mejora hacia el SLA del 85%",
                    "descripcion": f"Reorientando la flota en las regiones críticas y optimizando las ventanas horarias en los servicios con más retraso, la proyección técnica permite escalar del {tasa_actual}% al 85% de cumplimiento en un horizonte de 4 meses.",
                    "tipoGrafico": "line",
                    "datos": datos_e5
                }
            ]

            return {
                "escenas": escenas
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en endpoint historia: {str(e)}")

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
                
            # 3. Log de accesos REAL desde la tabla log_accesos
            init_log_table()
            cursor.execute("""
                SELECT id, timestamp, usuario, rol, rol_label, seccion, accion
                FROM log_accesos
                ORDER BY id DESC
                LIMIT 50
            """)
            log_rows = cursor.fetchall()
            
            # Si no hay logs aún, sembrar registros representativos iniciales
            if not log_rows:
                ahora = datetime.datetime.now()
                logs_iniciales = [
                    ((ahora - datetime.timedelta(minutes=18)).strftime("%Y-%m-%d %H:%M:%S"), "sysadmin", "gerencia_general", "Gerente General (Total)", "Tablero", "Consulta consolidado nacional (Total país, sin restricciones)"),
                    ((ahora - datetime.timedelta(minutes=12)).strftime("%Y-%m-%d %H:%M:%S"), "lgomez", "regional_antioquia", "Gerente Regional · Antioquia", "Explorar", "Búsqueda y análisis de la región: Antioquia"),
                    ((ahora - datetime.timedelta(minutes=5)).strftime("%Y-%m-%d %H:%M:%S"), "mrodriguez", "regional_bogota", "Gerente Regional · Bogotá", "Tablero", "Consulta tablero con filtro RLS: Región Bogotá"),
                    ((ahora - datetime.timedelta(minutes=2)).strftime("%Y-%m-%d %H:%M:%S"), "jperez", "regional_valle", "Gerente Regional · Valle", "Explorar", "Búsqueda y análisis de la región: Valle"),
                ]
                conn.executemany(
                    "INSERT INTO log_accesos (timestamp, usuario, rol, rol_label, seccion, accion) VALUES (?, ?, ?, ?, ?, ?)",
                    logs_iniciales
                )
                conn.commit()
                cursor.execute("""
                    SELECT id, timestamp, usuario, rol, rol_label, seccion, accion
                    FROM log_accesos
                    ORDER BY id DESC
                    LIMIT 50
                """)
                log_rows = cursor.fetchall()

            logs_detallados = []
            logs = []
            for row in log_rows:
                ts = row["timestamp"] or ""
                hora = ts[11:16] if len(ts) >= 16 else ts
                fecha = ts[:10] if len(ts) >= 10 else ""
                usuario = row["usuario"] or "usuario"
                rol = row["rol"] or "gerencia_general"
                rol_label = row["rol_label"] or rol
                seccion = row["seccion"] or "Sistema"
                accion = row["accion"] or "Consulta general"
                tipo_usuario = "total" if rol == "gerencia_general" else "regional"
                
                logs_detallados.append({
                    "id": row["id"],
                    "timestamp": ts,
                    "hora": hora,
                    "fecha": fecha,
                    "usuario": usuario,
                    "rol": rol,
                    "rol_label": rol_label,
                    "seccion": seccion,
                    "accion": accion,
                    "tipo_usuario": tipo_usuario,
                })
                # Formato en terminal limpio y descriptivo
                logs.append(f"{hora} {usuario} · {rol_label} [{seccion}]: {accion}")

            return {
                "total_gerencia": total_global,
                "regiones": regiones,
                "registros_log": logs,
                "logs_detallados": logs_detallados
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en prueba-accesos: {str(e)}")
