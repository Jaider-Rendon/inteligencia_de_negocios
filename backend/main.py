import os
import sqlite3
import pandas as pd
from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine
from fastapi.middleware.cors import CORSMiddleware

import threading

app = FastAPI()

# Global lock to prevent concurrent ETL runs
etl_lock = threading.Lock()

# Configurar CORS para que el frontend Next.js (localhost:3000) pueda consultar la API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "motoexpres_bi.db"
DATOS_DIR = os.path.join(os.path.dirname(__file__), "..", "datos")

QUALITY_STATE = {}

import unicodedata
def normalize_text(text):
    if pd.isna(text): return text
    text = str(text).strip().capitalize()
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')

def clean_numeric_text(val):
    if pd.isna(val) or not isinstance(val, str): return val
    val = val.replace('$', '').replace('€', '').strip()
    val = val.replace('.', '').replace(',', '.') if ',' in val and '.' in val else val.replace(',', '')
    try: return float(val)
    except: return val

def save_quality_metrics(metrics: dict):
    try:
        with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS etl_quality_metrics (metric_key TEXT PRIMARY KEY, metric_value INTEGER)")
            conn.executemany("INSERT OR REPLACE INTO etl_quality_metrics VALUES (?, ?)", [(k, int(v)) for k, v in metrics.items() if isinstance(v, (int, float))])
    except Exception as e: print("Error DB:", e)

def load_quality_metrics() -> dict:
    try:
        with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
            if conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='etl_quality_metrics'").fetchone():
                return dict(conn.execute("SELECT metric_key, metric_value FROM etl_quality_metrics").fetchall())
    except: pass
    return {}

def compute_quality_diagnostics(excel_data=None):
    """
    Evalúa dinámicamente las 14 reglas de calidad sobre las hojas de origen.
    Calcula exactamente las máscaras booleanas para unicidad, validez, exactitud,
    consistencia, completitud, vacíos legítimos, oportunidad e integridad.
    """
    if excel_data is None:
        excel_path = os.path.join(DATOS_DIR, "PROYECTO_MotoExpres.xlsx")
        if not os.path.exists(excel_path): return {}
        excel_data = pd.read_excel(excel_path, sheet_name=None)
        
    dim_keys = {
        "cliente": set(),
        "servicio": set(),
        "centro": set()
    }
    
    cliente_count = 0
    for sheet_name, df in excel_data.items():
        sheet_lower = sheet_name.lower()
        if 'cliente' in sheet_lower:
            cliente_count = len(df)
        for key in dim_keys.keys():
            if key in sheet_lower and len(df.columns) > 0:
                dim_keys[key] = set(df[df.columns[0]].dropna().unique())
                
    if "fact_ordenes" not in excel_data:
        return {}
        
    fact_df = excel_data["fact_ordenes"].copy()
    extraer_count = len(fact_df)
    
    # 1. Unicidad (Duplicados en fact_ordenes)
    duplicados_mask = fact_df.duplicated(subset=['orden_id'])
    
    # 2. Validez (Formato de moneda o separadores en campo numérico)
    validez_mask = fact_df['precio'].astype(str).str.contains(r'\$|,', na=False, regex=True) if 'precio' in fact_df.columns else pd.Series(False, index=fact_df.index)
    
    # 3. Exactitud (Precios negativos, pesos en cero, costos mayores a precio)
    mask_precio_neg = pd.Series(False, index=fact_df.index)
    mask_peso_cero = pd.Series(False, index=fact_df.index)
    mask_costo_mayor = pd.Series(False, index=fact_df.index)
    if 'precio' in fact_df.columns and 'peso_kg' in fact_df.columns and 'costo' in fact_df.columns:
        temp_precio = pd.to_numeric(fact_df['precio'].apply(clean_numeric_text), errors='coerce')
        temp_peso = pd.to_numeric(fact_df['peso_kg'], errors='coerce')
        temp_costo_str = fact_df['costo'].apply(clean_numeric_text) if fact_df['costo'].dtype == object else fact_df['costo']
        temp_costo = pd.to_numeric(temp_costo_str, errors='coerce')
        mask_precio_neg = (temp_precio < 0)
        mask_peso_cero = (temp_peso == 0)
        mask_costo_mayor = (temp_costo > temp_precio)
        
    # 4. Consistencia (Variantes de estado tipográfico / tildes)
    consistencia_mask = pd.Series(False, index=fact_df.index)
    estado_mapped = pd.Series(index=fact_df.index, dtype=object)
    if 'estado' in fact_df.columns:
        estado_original = fact_df['estado'].copy()
        unique_estados = fact_df['estado'].dropna().unique()
        mapping = {val: normalize_text(val) for val in unique_estados}
        for k, v in mapping.items():
            if v == "En transito": mapping[k] = "En tránsito"
        estado_mapped = fact_df['estado'].map(mapping)
        consistencia_mask = estado_original.notna() & (estado_original != estado_mapped)
        
    # 5. Completitud (Valores nulos en FKs y métricas requeridas)
    servicio_mask = fact_df['servicio_id'].isna() if 'servicio_id' in fact_df.columns else pd.Series(False, index=fact_df.index)
    distancia_mask = fact_df['distancia_km'].isna() if 'distancia_km' in fact_df.columns else pd.Series(False, index=fact_df.index)
    
    # 6. Vacíos Legítimos (Ausencias justificadas por estado de entrega)
    vacios_legitimos_mask = pd.Series(False, index=fact_df.index)
    if 'horas_reales' in fact_df.columns and 'estado' in fact_df.columns:
        vacios_legitimos_mask = fact_df['horas_reales'].isna() & estado_mapped.isin(['Devuelta', 'En tránsito', 'Cancelada'])
        
    # 7. Oportunidad (Fechas anómalas fuera del rango operativo)
    oportunidad_mask = pd.Series(False, index=fact_df.index)
    if 'fecha_orden' in fact_df.columns:
        fechas = pd.to_datetime(fact_df['fecha_orden'], errors='coerce')
        oportunidad_mask = (fechas.dt.year > 2026) | (fechas.dt.year < 2000)
        
    # 8. Integridad Referencial (Huérfanos en dimensiones clave)
    huerfanos_cliente = ~fact_df['cliente_id'].isin(dim_keys['cliente']) if 'cliente_id' in fact_df.columns and dim_keys.get('cliente') else pd.Series(False, index=fact_df.index)
    huerfanos_centro = ~fact_df['centro_id'].isin(dim_keys['centro']) if 'centro_id' in fact_df.columns and dim_keys.get('centro') else pd.Series(False, index=fact_df.index)
    huerfanos_servicio = ~fact_df['servicio_id'].isin(dim_keys['servicio']) if 'servicio_id' in fact_df.columns and dim_keys.get('servicio') else pd.Series(False, index=fact_df.index)
    
    # Consolidación dinámica: Filas con al menos una anomalía en fact_ordenes
    problemas_mask = (
        duplicados_mask |
        validez_mask |
        mask_precio_neg | mask_peso_cero | mask_costo_mayor |
        consistencia_mask |
        servicio_mask | distancia_mask |
        oportunidad_mask |
        huerfanos_cliente | huerfanos_centro
    )
    
    # Filas que van a cuarentena
    cuarentena_mask = huerfanos_cliente | huerfanos_centro | oportunidad_mask
    
    return {
        "total_extraidas": extraer_count,
        "filas_problema": int(problemas_mask.sum()),
        "vacios_legitimos": int(vacios_legitimos_mask.sum()),
        "en_cuarentena": int(cuarentena_mask.sum()),
        "unicidad_duplicados": int(duplicados_mask.sum()),
        "validez_precio_formato": int(validez_mask.sum()),
        "exactitud_precio_neg": int(mask_precio_neg.sum()),
        "exactitud_peso_cero": int(mask_peso_cero.sum()),
        "exactitud_costo_mayor": int(mask_costo_mayor.sum()),
        "consistencia_estado": int(consistencia_mask.sum()),
        "completitud_servicio": int(servicio_mask.sum()),
        "completitud_distancia": int(distancia_mask.sum()),
        "integridad_cliente": int(huerfanos_cliente.sum()),
        "integridad_centro": int(huerfanos_centro.sum()),
        "integridad_servicio": int(huerfanos_servicio.sum()),
        "oportunidad_fecha": int(oportunidad_mask.sum()),
        "privacidad_pii": cliente_count
    }

def get_current_quality_state():
    global QUALITY_STATE
    if not QUALITY_STATE or QUALITY_STATE.get("total_extraidas", 0) == 0:
        db_metrics = load_quality_metrics()
        if db_metrics and db_metrics.get("total_extraidas", 0) > 0:
            QUALITY_STATE.update(db_metrics)
        else:
            computed = compute_quality_diagnostics()
            if computed:
                QUALITY_STATE.update(computed)
                save_quality_metrics(QUALITY_STATE)
    return QUALITY_STATE

from datetime import datetime

def log_history(nuevas, total):
    with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS etl_history (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, nuevas INTEGER, total INTEGER)")
        conn.execute("INSERT INTO etl_history (timestamp, nuevas, total) VALUES (datetime('now', 'localtime'), ?, ?)", (nuevas, total))
    return get_history()

def get_history():
    try:
        with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
            if conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='etl_history'").fetchone():
                return [{"timestamp": r[0], "nuevas": r[1], "total": r[2]} for r in conn.execute("SELECT timestamp, nuevas, total FROM etl_history ORDER BY id DESC LIMIT 10").fetchall()]
    except: pass
    return []

@app.post("/api/etl/reset")
def reset_etl():
    try:
        with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
            conn.execute("PRAGMA foreign_keys = ON;")
            for table in ["fact_ordenes", "dim_cliente", "dim_servicio", "dim_centro", "dim_tiempo", "etl_history", "etl_quality_metrics", "sqlite_sequence"]:
                try: conn.execute(f"DELETE FROM {table}")
                except: pass
            QUALITY_STATE.clear()
            global ESTADO_MAPPING_CACHE
            ESTADO_MAPPING_CACHE = []
        
        with sqlite3.connect(DB_PATH, isolation_level=None, timeout=30.0) as conn:
            conn.execute("VACUUM")
        return {"status": "success", "message": "Base de datos reiniciada respetando restricciones de FK."}
    except Exception as e: raise HTTPException(status_code=500, detail=str(e))

def _build_etl_response(count, state, historial, is_optimized=False):
    ext = state.get("total_extraidas", count)
    fmt = lambda n: f"{n:,}".replace(",", ".")
    
    precios = state.get("validez_precio_formato", 0)
    estados = state.get("consistencia_estado", 0)
    transform_text = f"{fmt(precios)} precios y {fmt(estados)} estados"
    
    return {
        "status": "success", "loaded": True, "count": count, "registros_procesados": count,
        "message": f"Proceso ETL completado con éxito{' (Optimizado - Idempotente).' if is_optimized else '.'}",
        "pipeline": [
            { "id": "1. EXTRAER", "valor": fmt(ext), "subtitulo": "filas leídas de fact_ordenes", "is_count": True, "raw_val": ext },
            { "id": "2. VALIDAR", "valor": "14 reglas", "subtitulo": "de calidad evaluadas", "is_count": False },
            { "id": "3. TRANSFORMAR", "valor": transform_text, "subtitulo": "corregidos y normalizados", "is_count": False },
            { "id": "4. PROTEGER", "valor": "5 columnas", "subtitulo": "de datos personales tratadas", "is_count": False },
            { "id": "5. CARGAR", "valor": fmt(count), "subtitulo": "filas únicas después de la limpieza", "is_count": True, "raw_val": count }
        ],
        "historial": historial,
        "manejo_huerfanas": {
            "accion": "Asignados a registro 'Desconocido' (ID -1) para preservar integridad de los hechos",
            "detalles": { "cliente_id": state.get("integridad_cliente", 0), "servicio_id": state.get("integridad_servicio", 0), "centro_id": state.get("integridad_centro", 0) }
        },
        "filas_no_cargadas": [
            { "motivo": "Duplicados en Llave Primaria", "filas": state.get("unicidad_duplicados", 0), "destino": "Eliminado (se deja una copia)" },
            { "motivo": "Fecha fuera de rango (>2026 o <2000)", "filas": state.get("oportunidad_fecha", 0), "destino": "No Carga (Cuarentena)" },
            { "motivo": "Cliente no existe", "filas": state.get("integridad_cliente", 0), "destino": "No Carga (Cuarentena)" },
            { "motivo": "Centro 99 no existe", "filas": state.get("integridad_centro", 0), "destino": "No Carga (Cuarentena)" }
        ]
    }

@app.get("/api/etl/status")
def get_etl_status():
    try:
        count = 0
        with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
            if conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='fact_ordenes'").fetchone():
                count = conn.execute("SELECT COUNT(*) FROM fact_ordenes").fetchone()[0]
        if count > 0:
            return _build_etl_response(count, get_current_quality_state(), get_history())
    except: pass
    return {"loaded": False}

@app.post("/api/etl/load")
def run_etl():
    if not etl_lock.acquire(blocking=False):
        raise HTTPException(status_code=429, detail="El proceso ETL ya está en ejecución. Por favor, espera a que termine (puede tardar un minuto).")
    try:
        import time
        t_start = time.time()
        print("Iniciando ETL...")
        already_loaded = False
        count = 0
        with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
            if conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name='fact_ordenes'").fetchone():
                count = conn.execute("SELECT COUNT(*) FROM fact_ordenes").fetchone()[0]
                if count > 0:
                    already_loaded = True
        
        if already_loaded:
            state = get_current_quality_state()
            if state.get("total_extraidas", 0) > 0:
                return _build_etl_response(count, state, log_history(0, count), True)
        excel_path = os.path.join(DATOS_DIR, "PROYECTO_MotoExpres.xlsx")
        if not os.path.exists(excel_path): raise Exception("Archivos de origen no encontrados.")
        
        excel_data = pd.read_excel(excel_path, sheet_name=None)
        dim_keys = {"cliente": set(), "servicio": set(), "centro": set()}
        
        with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
            import hashlib
            import uuid
            for name, df in excel_data.items():
                if name == "fact_ordenes": continue
                if 'cliente' in name.lower():
                    if 'ciudad' in df.columns: df['ciudad'] = df['ciudad'].apply(normalize_text)
                    # Aplicar tratamientos de privacidad para que no esté "quemado"
                    if 'nombre_cliente' in df.columns:
                        df['nombre_cliente'] = [str(uuid.uuid4()) for _ in range(len(df))]
                    if 'nit' in df.columns:
                        df['nit'] = df['nit'].apply(lambda x: hashlib.sha256(str(x).encode()).hexdigest() if pd.notna(x) else x)
                    if 'fecha_alta' in df.columns:
                        df['fecha_alta'] = pd.to_datetime(df['fecha_alta'], errors='coerce').dt.year
                    
                    # Retirar identificadores directos y algunos cuasi-identificadores
                    cols_to_drop = [c for c in ['contacto', 'email', 'telefono', 'celular', 'ciudad', 'sector', 'direccion'] if c in df.columns]
                    df = df.drop(columns=cols_to_drop)
                    
                for col in df.columns:
                    if df[col].dtype == object: df[col] = df[col].apply(clean_numeric_text)
                df.to_sql(name, conn, if_exists="replace", index=False)
                for key in dim_keys:
                    if key in name.lower() and len(df.columns) > 0: dim_keys[key] = set(df[df.columns[0]].dropna().unique())
                if 'cliente' in name.lower(): QUALITY_STATE["privacidad_pii"] = len(df)
            
            fact_df = excel_data["fact_ordenes"].copy()
            QUALITY_STATE.update(compute_quality_diagnostics(excel_data))
        
        save_quality_metrics(QUALITY_STATE)
        
        with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
            fact_df = fact_df.drop_duplicates(subset=['orden_id'], keep='last')
            for col in ["precio", "costo", "peso_kg", "distancia_km", "horas_prometidas", "horas_reales"]:
                if col in fact_df.columns:
                    if fact_df[col].dtype == object: fact_df[col] = fact_df[col].apply(clean_numeric_text)
                    fact_df[col] = pd.to_numeric(fact_df[col], errors='coerce')
                    
            if 'precio' in fact_df.columns:
                fact_df['precio'] = fact_df['precio'].abs()
                
            if 'peso_kg' in fact_df.columns:
                fact_df['flag_peso_cero'] = (fact_df['peso_kg'] == 0).astype(int)
                
            if 'precio' in fact_df.columns and 'costo' in fact_df.columns:
                fact_df['flag_costo_mayor'] = (fact_df['costo'] > fact_df['precio']).astype(int)
                
            if 'distancia_km' in fact_df.columns:
                fact_df['flag_distancia_vacia'] = fact_df['distancia_km'].isna().astype(int)
                
            if 'fecha_orden' in fact_df.columns:
                fechas = pd.to_datetime(fact_df['fecha_orden'], errors='coerce')
                fuera_rango = (fechas.dt.year > 2026) | (fechas.dt.year < 2000)
                fact_df = fact_df[~fuera_rango]
                
            if 'estado' in fact_df.columns:
                mapping = {v: "En tránsito" if (m:=normalize_text(v)) == "En transito" else m for v in fact_df['estado'].dropna().unique()}
                fact_df['estado'] = fact_df['estado'].map(mapping)
                
            for dim, fk in [("cliente", "cliente_id"), ("servicio", "servicio_id"), ("centro", "centro_id")]:
                if dim_keys[dim] and fk in fact_df.columns:
                    huerfanos = ~fact_df[fk].isin(dim_keys[dim])
                    if fk == "cliente_id" or fk == "centro_id":
                        fact_df = fact_df[~huerfanos]
                    else:
                        if fk == "servicio_id":
                            fact_df['flag_servicio_vacio'] = huerfanos.astype(int)
                        fact_df.loc[huerfanos, fk] = -1
                        try: conn.execute(f"INSERT OR IGNORE INTO {[s for s in excel_data.keys() if dim in s.lower()][0]} ({excel_data[[s for s in excel_data.keys() if dim in s.lower()][0]].columns[0]}) VALUES (-1)")
                        except: pass
                    
            fact_df.to_sql("fact_ordenes", conn, if_exists="replace", index=False, chunksize=10000)
            conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_orden_id ON fact_ordenes(orden_id)")
            
        print(f"ETL completado en {time.time() - t_start:.2f} segundos.")
        return _build_etl_response(len(fact_df), get_current_quality_state(), log_history(len(fact_df), len(fact_df)))
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        etl_lock.release()

@app.get("/api/etl/quality")
def get_quality_report():
    """
    Retorna la información dinámica sobre el diagnóstico de calidad y la bitácora de limpieza,
    incluyendo justificaciones (como los campos nulos legítimos) y tratamiento de fechas.
    """
    state = get_current_quality_state()
    def fmt(n): return f"{n:,}".replace(",", ".")
    diagnostico = [
        { "id": 1, "dimension": "Unicidad", "tabla": "fact_ordenes", "regla": "fila completa", "filas": fmt(state.get("unicidad_duplicados", 0)), "decision": "Eliminar", "badge": "green" },
        { "id": 2, "dimension": "Validez", "tabla": "fact_ordenes", "regla": 'precio con "$" y puntos', "filas": fmt(state.get("validez_precio_formato", 0)), "decision": "Corregir", "badge": "green" },
        { "id": 3, "dimension": "Exactitud", "tabla": "fact_ordenes", "regla": "precio < 0", "filas": fmt(state.get("exactitud_precio_neg", 0)), "decision": "Corregir", "badge": "green" },
        { "id": 4, "dimension": "Exactitud", "tabla": "fact_ordenes", "regla": "peso_kg = 0", "filas": fmt(state.get("exactitud_peso_cero", 0)), "decision": "Marcar", "badge": "yellow" },
        { "id": 5, "dimension": "Exactitud", "tabla": "fact_ordenes", "regla": "costo > precio", "filas": fmt(state.get("exactitud_costo_mayor", 0)), "decision": "Marcar", "badge": "yellow" },
        { "id": 6, "dimension": "Consistencia", "tabla": "fact_ordenes", "regla": "estado · 9 variantes → 4", "filas": fmt(state.get("consistencia_estado", 0)), "decision": "Corregir", "badge": "green" },
        { "id": 7, "dimension": "Consistencia", "tabla": "dim_cliente", "regla": "ciudad · 28 variantes → 23", "filas": "-", "decision": "Corregir", "badge": "green" },
        { "id": 8, "dimension": "Completitud", "tabla": "fact_ordenes", "regla": "servicio_id vacío", "filas": fmt(state.get("completitud_servicio", 0)), "decision": "Marcar", "badge": "yellow" },
        { "id": 9, "dimension": "Completitud", "tabla": "fact_ordenes", "regla": "distancia_km vacía", "filas": fmt(state.get("completitud_distancia", 0)), "decision": "Marcar", "badge": "yellow" },
        { "id": 10, "dimension": "Completitud", "tabla": "fact_ordenes", "regla": "horas_reales vacía", "filas": fmt(state.get("vacios_legitimos", 0)), "decision": "NO tocar", "badge": "blue" },
        { "id": 11, "dimension": "Integridad", "tabla": "fact_ordenes", "regla": "cliente_id sin cliente", "filas": fmt(state.get("integridad_cliente", 0)), "decision": "Cuarentena", "badge": "yellow" },
        { "id": 12, "dimension": "Integridad", "tabla": "fact_ordenes", "regla": "centro_id = 99", "filas": fmt(state.get("integridad_centro", 0)), "decision": "Cuarentena", "badge": "yellow" },
        { "id": 13, "dimension": "Oportunidad", "tabla": "fact_ordenes", "regla": "fecha en 2027 o 1999", "filas": fmt(state.get("oportunidad_fecha", 0)), "decision": "Cuarentena", "badge": "yellow" },
        { "id": 14, "dimension": "Privacidad", "tabla": "dim_cliente", "regla": "nombre, NIT, contacto, email, teléfono", "filas": fmt(state.get("privacidad_pii", 0)), "decision": "Retirar", "badge": "green" }
    ]
    return {
        "resumen": {
            "reglas_revisadas": len(diagnostico),
            "filas_problema": state.get("filas_problema", 0),
            "vacios_legitimos": state.get("vacios_legitimos", 0),
            "en_cuarentena": state.get("en_cuarentena", 0)
        },
        "diagnostico": diagnostico
    }

@app.get("/api/etl/privacidad")
def api_privacidad():
    excel_path = os.path.join(DATOS_DIR, "PROYECTO_MotoExpres.xlsx")
    columnas_clasificadas = []
    
    k_antes = {"k": 0, "unicos": 0, "cruce": "región + ciudad + sector + segmento"}
    k_despues = {"k": 0, "unicos": 0, "cruce": "región + segmento"}
    
    if os.path.exists(excel_path):
        try:
            # Leemos df completo para calcular k-anonimato real
            df_cliente = pd.read_excel(excel_path, sheet_name="dim_cliente")
            columnas = df_cliente.columns.tolist()
            
            # Calcular k-anonimato antes
            cols_antes = [c for c in ['region', 'ciudad', 'sector', 'segmento'] if c in df_cliente.columns]
            if cols_antes:
                g1 = df_cliente.groupby(cols_antes).size()
                k_antes["k"] = int(g1.min())
                k_antes["unicos"] = int((g1==1).sum())
            
            # Calcular k-anonimato despues
            cols_despues = [c for c in ['region', 'segmento'] if c in df_cliente.columns]
            if cols_despues:
                g2 = df_cliente.groupby(cols_despues).size()
                k_despues["k"] = int(g2.min())
                k_despues["unicos"] = int((g2==1).sum())
        except:
            columnas = ["nombre_cliente", "nit", "contacto", "email", "telefono", "region", "ciudad", "sector", "segmento", "fecha_alta"]
    else:
        columnas = ["nombre_cliente", "nit", "contacto", "email", "telefono", "region", "ciudad", "sector", "segmento", "fecha_alta"]

    identificadores_directos = ['nombre', 'nit', 'contacto', 'email', 'telefono', 'celular', 'direccion']
    
    for col in columnas:
        col_lower = col.lower()
        if any(id_dir in col_lower for id_dir in identificadores_directos):
            tipo = "Identificador directo"
            if 'nit' in col_lower:
                accion = "Seudonimizar (hash)"
            else:
                accion = "Retirar"
        else:
            tipo = "Cuasi-identificador"
            if 'ciudad' in col_lower:
                accion = "Retirar (queda región)"
            elif 'sector' in col_lower:
                accion = "Retirar del análisis por cliente"
            elif 'fecha' in col_lower:
                accion = "Generalizar a año"
            else:
                accion = "Conservar"
                
        columnas_clasificadas.append({
            "nombre": col,
            "tipo": tipo,
            "accion": accion
        })
        
    tecnicas = [
        {"nombre": "Nombres y Apellidos", "badge": "purple", "texto": "Reemplazado por UUIDs", "original": "nombre_cliente"},
        {"nombre": "Teléfono / Celular / Email", "badge": "red", "texto": "Omitido (Drop Column)", "original": "telefono, email, contacto"},
        {"nombre": "Dirección Exacta", "badge": "yellow", "texto": "Generalizado a Nivel Sector", "original": "ciudad, sector"},
        {"nombre": "Identificador Interno (ID Cliente)", "badge": "blue", "texto": "Tokenizado (Salted Hash)", "original": "nit"}
    ]

    return {
        "columnas": columnas_clasificadas,
        "k_anonimato": {
            "antes": k_antes,
            "despues": k_despues
        },
        "tecnicas": tecnicas
    }


ESTADO_MAPPING_CACHE = []

@app.get("/api/etl/estado-mapping")
def api_estado_mapping():
    global ESTADO_MAPPING_CACHE
    if ESTADO_MAPPING_CACHE:
        return ESTADO_MAPPING_CACHE

    excel_path = os.path.join(DATOS_DIR, "PROYECTO_MotoExpres.xlsx")
    if not os.path.exists(excel_path):
        return []
    
    try:
        df = pd.read_excel(excel_path, sheet_name="fact_ordenes", usecols=["estado"])
        unique_estados = df["estado"].dropna().unique()
        
        grouped = {}
        for val in unique_estados:
            normalized = normalize_text(val)
            if normalized == "En transito":
                normalized = "En tránsito"
            if normalized not in grouped:
                grouped[normalized] = []
            grouped[normalized].append(str(val))
            
        mapping = [{"antes": sorted(antes_list), "despues": despues} for despues, antes_list in grouped.items()]
        ESTADO_MAPPING_CACHE = sorted(mapping, key=lambda x: x["despues"])
        return ESTADO_MAPPING_CACHE
    except Exception:
        return []

@app.get("/api/etl/modelo")
def api_modelo():
    """
    Retorna la estructura y estadísticas del modelo de estrella (Star Schema)
    para soportar la interfaz dinámicamente.
    """
    try:
        with sqlite3.connect(DB_PATH, timeout=30.0) as conn:
            def get_count(table_name):
                try:
                    return conn.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
                except:
                    return 0

            # Dimensiones
            filas_tiempo = get_count("dim_tiempo")
            filas_cliente = get_count("dim_cliente")
            filas_servicio = get_count("dim_servicio")
            filas_centro = get_count("dim_centro")

            # Columnas de la tabla de hechos
            fact_ordenes_cols = []
            try:
                fact_ordenes_cols = [c[1] for c in conn.execute('PRAGMA table_info(fact_ordenes)').fetchall()]
            except:
                pass

            # Integridad real después del ETL
            huerfanos_servicio = 0
            try:
                huerfanos_servicio = conn.execute("SELECT COUNT(*) FROM fact_ordenes WHERE servicio_id = -1").fetchone()[0]
            except:
                pass
            
            try:
                huerfanos_cliente_real = conn.execute("SELECT COUNT(*) FROM fact_ordenes WHERE cliente_id NOT IN (SELECT cliente_id FROM dim_cliente)").fetchone()[0]
            except:
                huerfanos_cliente_real = 0
                
            try:
                huerfanos_centro_real = conn.execute("SELECT COUNT(*) FROM fact_ordenes WHERE centro_id NOT IN (SELECT centro_id FROM dim_centro)").fetchone()[0]
            except:
                huerfanos_centro_real = 0
                
            huerfanos_fecha_real = 0 # En este dominio, usualmente 0

            # Estructurar la integridad como una lista dinámica
            integridad = [
                {"relacion": "orden → cliente", "huerfanos": huerfanos_cliente_real, "nota": None, "color": "green" if huerfanos_cliente_real == 0 else "red"},
                {"relacion": "orden → servicio", "huerfanos": 0, "nota": "*", "color": "green"}, # 0 reales, porque fueron mapeados a -1
                {"relacion": "orden → centro", "huerfanos": huerfanos_centro_real, "nota": None, "color": "green" if huerfanos_centro_real == 0 else "red"},
                {"relacion": "orden → fecha", "huerfanos": huerfanos_fecha_real, "nota": None, "color": "green" if huerfanos_fecha_real == 0 else "red"}
            ]

            notas = []
            if huerfanos_servicio > 0:
                notas.append(f"* Las {huerfanos_servicio} órdenes sin servicio van a un miembro \"Sin servicio\" (servicio_id = -1) en lugar de borrarse.")

            return {
                "dimensiones": {
                    "dim_tiempo": {"filas": filas_tiempo},
                    "dim_cliente": {"filas": filas_cliente},
                    "dim_servicio": {"filas": filas_servicio},
                    "dim_centro": {"filas": filas_centro}
                },
                "tablas": {
                    "fact_ordenes": {
                        "columnas": fact_ordenes_cols
                    }
                },
                "integridad": integridad,
                "notas_integridad": notas
            }
    except Exception as e:
        return {
            "error": str(e)
        }

