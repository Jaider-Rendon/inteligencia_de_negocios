# Proyecto Final Inteligencia de Negocios - MotoExpres BI

Este repositorio contiene la solución completa de Inteligencia de Negocios para **MotoExpres**. Está compuesto por una API en el **Backend** (desarrollada con FastAPI y Python) encargada de procesar el ETL, y una aplicación web en el **Frontend** (desarrollada con Next.js) para la visualización de los datos.

## Estructura del Proyecto

- `backend/`: Código de la API en Python (FastAPI). Se encarga de conectarse a los datos, realizar el proceso ETL (Extracción, Transformación, Carga) y servir la información.
- `datos/`: Archivos de origen (Excel y CSV) que utiliza el proceso ETL.
- `motoexpres-bi/`: Aplicación web interactiva (Frontend) desarrollada con Next.js y React.

---

## 🚀 Cómo iniciar el proyecto localmente

Para poder ejecutar todo el proyecto necesitas iniciar tanto el Backend como el Frontend en terminales separadas.

### 1. Iniciar el Backend (API)

El backend utiliza Python y FastAPI. 

**Requisitos:** Tener instalado Python 3.8 o superior.

Abre una terminal y ejecuta los siguientes comandos:

```bash
# 1. Navega a la carpeta del backend
cd backend

# 2. (Opcional pero recomendado) Crear un entorno virtual
python -m venv .venv

# 3. Activar el entorno virtual
# En Windows:
.venv\Scripts\activate
# En Mac/Linux:
# source .venv/bin/activate

# 4. Instalar las dependencias
pip install -r requirements.txt

# 5. Ejecutar el servidor de desarrollo
uvicorn main:app --reload
```
La API estará corriendo en `http://localhost:8000`.

### 2. Iniciar el Frontend (Next.js)

El frontend requiere Node.js para funcionar.

**Requisitos:** Tener instalado Node.js (versión 18+ recomendada).

Abre **otra** terminal y ejecuta los siguientes comandos:

```bash
# 1. Navega a la carpeta del frontend
cd motoexpres-bi

# 2. Instalar las dependencias del proyecto (solo la primera vez)
npm install

# 3. Ejecutar el entorno de desarrollo
npm run dev
```

La aplicación web estará disponible en tu navegador en `http://localhost:3000`.
