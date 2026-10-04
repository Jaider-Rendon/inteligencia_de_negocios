import pandas as pd
import os
import unicodedata

def normalize_text(text):
    if pd.isna(text): return text
    text = str(text).strip().capitalize()
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')

def clean_numeric_text(val):
    if pd.isna(val): return val
    if isinstance(val, str):
        val_clean = val.replace('$', '').replace('€', '').strip()
        if ',' in val_clean and '.' in val_clean:
            val_clean = val_clean.replace('.', '').replace(',', '.')
        else:
            val_clean = val_clean.replace(',', '')
        try:
            return float(val_clean)
        except ValueError:
            pass
    return val

excel_path = os.path.join("..", "datos", "PROYECTO_MotoExpres.xlsx")
excel_data = pd.read_excel(excel_path, sheet_name=None)

QUALITY_STATE = {}
dim_keys = {
    "cliente": set(),
    "servicio": set(),
    "centro": set()
}

for sheet_name, df in excel_data.items():
    sheet_lower = sheet_name.lower()
    for key in dim_keys.keys():
        if key in sheet_lower and len(df.columns) > 0:
            dim_keys[key] = set(df[df.columns[0]].dropna().unique())
    if 'cliente' in sheet_lower:
        QUALITY_STATE["privacidad_pii"] = len(df)

fact_df = excel_data['fact_ordenes'].copy()
extraer_count = len(fact_df)

QUALITY_STATE["unicidad_duplicados"] = int(extraer_count - len(fact_df.drop_duplicates(subset=['orden_id'])))

if 'precio' in fact_df.columns:
    mask_texto = fact_df['precio'].apply(lambda x: isinstance(x, str))
    if mask_texto.any():
        QUALITY_STATE["validez_precio_formato"] = int(fact_df.loc[mask_texto, 'precio'].str.contains(r'\$|\.', na=False, regex=True).sum())
    else:
        QUALITY_STATE["validez_precio_formato"] = 0

if 'precio' in fact_df.columns and 'peso_kg' in fact_df.columns and 'costo' in fact_df.columns:
    temp_precio = pd.to_numeric(fact_df['precio'].apply(clean_numeric_text), errors='coerce')
    temp_peso = pd.to_numeric(fact_df['peso_kg'], errors='coerce')
    temp_costo_str = fact_df['costo'].apply(clean_numeric_text) if fact_df['costo'].dtype == object else fact_df['costo']
    temp_costo = pd.to_numeric(temp_costo_str, errors='coerce')
    QUALITY_STATE["exactitud_precio_neg"] = int((temp_precio < 0).sum())
    QUALITY_STATE["exactitud_peso_cero"] = int((temp_peso == 0).sum())
    QUALITY_STATE["exactitud_costo_mayor"] = int(((temp_costo > temp_precio) & (temp_precio >= 0)).sum())

if 'estado' in fact_df.columns:
    estado_original = fact_df['estado'].copy()
    unique_estados = fact_df['estado'].dropna().unique()
    mapping = {val: normalize_text(val) for val in unique_estados}
    for k, v in mapping.items():
        if v == "En transito": mapping[k] = "En tránsito"
    estado_mapped = fact_df['estado'].map(mapping)
    QUALITY_STATE["consistencia_estado"] = int((estado_original.notna() & (estado_original != estado_mapped)).sum())

if 'servicio_id' in fact_df.columns:
    QUALITY_STATE["completitud_servicio"] = int(fact_df['servicio_id'].isna().sum())
if 'distancia_km' in fact_df.columns:
    QUALITY_STATE["completitud_distancia"] = int(fact_df['distancia_km'].isna().sum())

if 'fecha_orden' in fact_df.columns:
    fechas = pd.to_datetime(fact_df['fecha_orden'], errors='coerce')
    QUALITY_STATE["oportunidad_fecha"] = int(((fechas.dt.year > 2026) | (fechas.dt.year < 2000)).sum())

for dim_prefix, fk_col in [("cliente", "cliente_id"), ("servicio", "servicio_id"), ("centro", "centro_id")]:
    if dim_keys.get(dim_prefix) and fk_col in fact_df.columns:
        huerfanos = ~fact_df[fk_col].isin(dim_keys[dim_prefix])
        if fk_col == "cliente_id": QUALITY_STATE["integridad_cliente"] = int(huerfanos.sum())
        if fk_col == "centro_id": QUALITY_STATE["integridad_centro"] = int(huerfanos.sum())

filas_problema = int(
    QUALITY_STATE.get("unicidad_duplicados", 0) +
    QUALITY_STATE.get("validez_precio_formato", 0) +
    QUALITY_STATE.get("exactitud_precio_neg", 0) +
    QUALITY_STATE.get("exactitud_peso_cero", 0) +
    QUALITY_STATE.get("exactitud_costo_mayor", 0) +
    QUALITY_STATE.get("consistencia_estado", 0) +
    QUALITY_STATE.get("completitud_servicio", 0) +
    QUALITY_STATE.get("completitud_distancia", 0) +
    QUALITY_STATE.get("integridad_cliente", 0) +
    QUALITY_STATE.get("integridad_centro", 0) +
    QUALITY_STATE.get("oportunidad_fecha", 0) +
    QUALITY_STATE.get("privacidad_pii", 0)
)

print(QUALITY_STATE)
print("Filas problema:", filas_problema)
