import pandas as pd
import os

excel_path = os.path.join("datos", "PROYECTO_MotoExpres.xlsx")
try:
    df = pd.read_excel(excel_path, sheet_name="fact_ordenes")
    print("Unique estados:", df['estado'].dropna().unique())
    print("Number of variants:", len(df['estado'].dropna().unique()))
except Exception as e:
    print(e)
