import pandas as pd
from main import clean_numeric_text

df = pd.read_csv('../datos/me_fact_ordenes - me_fact_ordenes.csv')
p = pd.to_numeric(df['precio'].apply(clean_numeric_text), errors='coerce')
c_str = df['costo'].apply(clean_numeric_text) if df['costo'].dtype == object else df['costo']
c = pd.to_numeric(c_str, errors='coerce')

print("c > p:", (c > p).sum())
print("(c > p) & (p >= 0):", ((c > p) & (p >= 0)).sum())

estado_original = df['estado'].copy()
unique_estados = df['estado'].dropna().unique()
import unicodedata
def normalize_text(text):
    if pd.isna(text): return text
    text = str(text).strip().capitalize()
    return ''.join(c for c in unicodedata.normalize('NFD', text) if unicodedata.category(c) != 'Mn')

mapping = {val: normalize_text(val) for val in unique_estados}
for k, v in mapping.items():
    if v == "En transito": mapping[k] = "En tránsito"
estado_mapped = df['estado'].map(mapping)

print("Consistencia estado:", (estado_original.notna() & (estado_original != estado_mapped)).sum())
