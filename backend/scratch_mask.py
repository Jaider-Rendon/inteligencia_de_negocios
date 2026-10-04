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
fact_df = excel_data['fact_ordenes'].copy()

# Build the mask of rows with AT LEAST ONE problem
mask = pd.Series(False, index=fact_df.index)

# 1. Unicidad duplicados
mask = mask | fact_df.duplicated(subset=['orden_id'], keep='first')

# 2. Validez precio formato
if 'precio' in fact_df.columns:
    mask = mask | fact_df['precio'].astype(str).str.contains(r'\$|\.', na=False, regex=True)

# 3. Exactitud
temp_precio = pd.to_numeric(fact_df['precio'].apply(clean_numeric_text), errors='coerce')
temp_peso = pd.to_numeric(fact_df['peso_kg'], errors='coerce')
temp_costo_str = fact_df['costo'].apply(clean_numeric_text) if fact_df['costo'].dtype == object else fact_df['costo']
temp_costo = pd.to_numeric(temp_costo_str, errors='coerce')
mask = mask | (temp_precio < 0)
mask = mask | (temp_peso == 0)
mask = mask | ((temp_costo > temp_precio) & (temp_precio >= 0))

# 4. Consistencia estado
estado_original = fact_df['estado'].copy()
unique_estados = fact_df['estado'].dropna().unique()
mapping = {val: normalize_text(val) for val in unique_estados}
for k, v in mapping.items():
    if v == "En transito": mapping[k] = "En tránsito"
estado_mapped = fact_df['estado'].map(mapping)
mask = mask | (estado_original.notna() & (estado_original != estado_mapped))

# 5. Completitud
mask = mask | fact_df['servicio_id'].isna()
mask = mask | fact_df['distancia_km'].isna()

# 6. Integridad
dim_keys = {
    "cliente": set(excel_data['dim_cliente']['cliente_id'].dropna().unique()),
    "servicio": set(excel_data['dim_servicio']['servicio_id'].dropna().unique()),
    "centro": set(excel_data['dim_centro']['centro_id'].dropna().unique())
}
mask = mask | ~fact_df['cliente_id'].isin(dim_keys['cliente'])
mask = mask | ~fact_df['centro_id'].isin(dim_keys['centro'])

# 7. Oportunidad
fechas = pd.to_datetime(fact_df['fecha_orden'], errors='coerce')
mask = mask | ((fechas.dt.year > 2026) | (fechas.dt.year < 2000))

print("Rows with at least one problem (excluding privacidad from client dim):", mask.sum())

# Try matching the exact 6874 by just summing up the rules logic but with CSV dataset?
csv_path = os.path.join("..", "datos", "me_fact_ordenes - me_fact_ordenes.csv")
if os.path.exists(csv_path):
    fact_csv = pd.read_csv(csv_path)
    mask_csv = pd.Series(False, index=fact_csv.index)
    mask_csv = mask_csv | fact_csv.duplicated(subset=['orden_id'], keep='first')
    mask_csv = mask_csv | fact_csv['precio'].astype(str).str.contains(r'\$|\.', na=False, regex=True)
    temp_precio = pd.to_numeric(fact_csv['precio'].apply(clean_numeric_text), errors='coerce')
    temp_peso = pd.to_numeric(fact_csv['peso_kg'], errors='coerce')
    temp_costo_str = fact_csv['costo'].apply(clean_numeric_text) if fact_csv['costo'].dtype == object else fact_csv['costo']
    temp_costo = pd.to_numeric(temp_costo_str, errors='coerce')
    mask_csv = mask_csv | (temp_precio < 0)
    mask_csv = mask_csv | (temp_peso == 0)
    mask_csv = mask_csv | ((temp_costo > temp_precio) & (temp_precio >= 0))
    estado_original = fact_csv['estado'].copy()
    unique_estados = fact_csv['estado'].dropna().unique()
    mapping = {val: normalize_text(val) for val in unique_estados}
    for k, v in mapping.items():
        if v == "En transito": mapping[k] = "En tránsito"
    estado_mapped = fact_csv['estado'].map(mapping)
    mask_csv = mask_csv | (estado_original.notna() & (estado_original != estado_mapped))
    mask_csv = mask_csv | fact_csv['servicio_id'].isna()
    mask_csv = mask_csv | fact_csv['distancia_km'].isna()
    mask_csv = mask_csv | ~fact_csv['cliente_id'].isin(dim_keys['cliente'])
    mask_csv = mask_csv | ~fact_csv['centro_id'].isin(dim_keys['centro'])
    fechas = pd.to_datetime(fact_csv['fecha_orden'], errors='coerce')
    mask_csv = mask_csv | ((fechas.dt.year > 2026) | (fechas.dt.year < 2000))
    print("Rows with at least one problem (CSV):", mask_csv.sum())
