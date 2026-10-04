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

DATOS_DIR = "../datos"
excel_path = os.path.join(DATOS_DIR, "PROYECTO_MotoExpres.xlsx")
csv_path = os.path.join(DATOS_DIR, "me_fact_ordenes - me_fact_ordenes.csv")

if not os.path.exists(csv_path):
    print("CSV not found")
else:
    fact_df = pd.read_csv(csv_path)
    print("Total rows:", len(fact_df))
    
    print("\n--- Unicidad ---")
    print("fila completa:", len(fact_df) - len(fact_df.drop_duplicates()))
    print("orden_id:", len(fact_df) - len(fact_df.drop_duplicates(subset=['orden_id'])))

    print("\n--- Validez ---")
    print('precio con "$" y puntos:', fact_df['precio'].astype(str).str.contains(r'\$|\.', na=False, regex=True).sum()) # Wait, image says "$" y puntos, the regex in code is r'\$|,'

    print("\n--- Exactitud ---")
    temp_precio = pd.to_numeric(fact_df['precio'].apply(clean_numeric_text), errors='coerce')
    temp_peso = pd.to_numeric(fact_df['peso_kg'], errors='coerce')
    temp_costo_str = fact_df['costo'].apply(clean_numeric_text) if fact_df['costo'].dtype == object else fact_df['costo']
    temp_costo = pd.to_numeric(temp_costo_str, errors='coerce')
    print("precio < 0:", (temp_precio < 0).sum())
    print("peso_kg = 0:", (temp_peso == 0).sum())
    print("costo > precio:", (temp_costo > temp_precio).sum())

    print("\n--- Consistencia ---")
    estado_original = fact_df['estado'].copy()
    unique_estados = fact_df['estado'].dropna().unique()
    mapping = {val: normalize_text(val) for val in unique_estados}
    for k, v in mapping.items():
        if v == "En transito": mapping[k] = "En tránsito"
    estado_mapped = fact_df['estado'].map(mapping)
    print("estado variantes:", len(unique_estados), "->", len(set(mapping.values())))
    print("estado corregir:", (estado_original.notna() & (estado_original != estado_mapped)).sum())

    print("\n--- Completitud ---")
    print("servicio_id vacío:", fact_df['servicio_id'].isna().sum())
    print("distancia_km vacía:", fact_df['distancia_km'].isna().sum())
    print("horas_reales vacía:", fact_df['horas_reales'].isna().sum())
    print("horas_reales vacía (devuelta, transito, cancelada):", (fact_df['horas_reales'].isna() & estado_mapped.isin(['Devuelta', 'En tránsito', 'Cancelada'])).sum())

    print("\n--- Integridad ---")
    print("centro_id = 99:", (fact_df['centro_id'] == 99).sum())

    print("\n--- Oportunidad ---")
    fechas = pd.to_datetime(fact_df['fecha_orden'], errors='coerce')
    print("fecha en 2027 o 1999:", ((fechas.dt.year == 2027) | (fechas.dt.year == 1999)).sum())

if os.path.exists(excel_path):
    excel_data = pd.read_excel(excel_path, sheet_name=None)
    for sheet_name, df in excel_data.items():
        if 'cliente' in sheet_name.lower():
            if 'ciudad' in df.columns:
                print("\n--- Consistencia (Cliente) ---")
                print("ciudad variantes:", df['ciudad'].nunique(), "->", df['ciudad'].apply(normalize_text).nunique())
            print("Privacidad cliente:", len(df))
