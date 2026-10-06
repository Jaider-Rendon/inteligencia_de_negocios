"use client";

import { useEffect, useState } from "react";

/* ── Tipos ──────────────────────────────────────────────── */
interface RegionRow {
  region: string;
  ingresos: number;
}

interface PruebaAccesosData {
  total_gerencia: number;
  regiones: RegionRow[];
  registros_log: string[];
}

/* ── Helpers ────────────────────────────────────────────── */
const fmtCOP = (v: number) => `$${v.toLocaleString("es-CO")}`;

/* ======================== PÁGINA ======================== */
export default function Accesos() {
  const [data, setData]       = useState<PruebaAccesosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/etl/prueba-accesos")
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50">

      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 pl-14 pr-10 py-5 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">Control de Accesos</h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          MotoExpres BI · Seguridad y Row-Level Security
        </p>
      </header>

      <div className="pl-14 pr-10 pb-12 pt-8 flex flex-col gap-6">

        {/* ── BANNER DE NOTA ────────────────────────────── */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 text-sm text-yellow-800 flex items-start gap-4 shadow-sm">
          <span className="font-bold whitespace-nowrap bg-yellow-200 px-3 py-1 rounded-md text-yellow-900">Hito 2 · E10</span>
          <p className="leading-relaxed text-yellow-900 mt-0.5">
            <strong>Demostración del esquema de seguridad:</strong> Todo el equipo ingresa por la misma URL y ve la misma estructura, 
            pero el sistema filtra los datos desde el backend asegurando que cada gerente solo vea la información de su región.
          </p>
        </div>

        {/* ── TARJETA 1: ROLES DEL SISTEMA ──────────────── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Roles del sistema configurados
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="text-xs font-bold text-gray-500 uppercase tracking-wider text-left pb-3 border-b border-gray-200">Rol</th>
                  <th className="text-xs font-bold text-gray-500 uppercase tracking-wider text-left pb-3 border-b border-gray-200">Pantallas</th>
                  <th className="text-xs font-bold text-gray-500 uppercase tracking-wider text-left pb-3 border-b border-gray-200">Datos permitidos</th>
                  <th className="text-xs font-bold text-gray-500 uppercase tracking-wider text-left pb-3 border-b border-gray-200">Regla de filtro SQL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 text-sm text-gray-800 border-b border-gray-100 font-medium">Gerencia General</td>
                  <td className="py-3 text-sm text-gray-800 border-b border-gray-100">Todas las vistas</td>
                  <td className="py-3 text-sm text-gray-800 border-b border-gray-100">Total Nacional (100%)</td>
                  <td className="py-3 text-sm text-gray-800 border-b border-gray-100">
                    <span className="font-mono text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                      WHERE 1=1
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-sm text-gray-800 border-b border-gray-100 font-medium">Gerente Regional</td>
                  <td className="py-3 text-sm text-gray-800 border-b border-gray-100">Tablero y Explorar</td>
                  <td className="py-3 text-sm text-gray-800 border-b border-gray-100">Solo su propia región</td>
                  <td className="py-3 text-sm text-gray-800 border-b border-gray-100">
                    <span className="font-mono text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                      WHERE c.region = '{"{nombre_region}"}'
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── LOADING & ERROR ───────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-teal-600 rounded-full" />
          </div>
        )}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm font-medium">
            ⚠️ No se pudieron cargar los datos: {error}
          </div>
        )}

        {/* ── GRID INFERIOR (2 COLUMNAS) ────────────────── */}
        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* COLUMNA IZQUIERDA: Prueba Rápida */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Prueba matemática (Validación)
              </h2>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className="text-xs font-bold text-gray-500 uppercase tracking-wider text-left pb-3 border-b border-gray-200">Vista del gerente</th>
                      <th className="text-xs font-bold text-gray-500 uppercase tracking-wider text-right pb-3 border-b border-gray-200">Ingresos asignados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regiones.map(row => (
                      <tr key={row.region}>
                        <td className="py-3 text-sm text-gray-800 border-b border-gray-100">{row.region}</td>
                        <td className="py-3 text-sm text-gray-800 border-b border-gray-100 text-right font-mono">{fmtCOP(row.ingresos)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="py-3 px-2 text-sm text-gray-900 font-bold border-b border-gray-100">Suma de las 5 regiones (Total)</td>
                      <td className="py-3 px-2 text-sm text-gray-900 font-bold border-b border-gray-100 text-right font-mono">{fmtCOP(data.total_gerencia)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-auto">
                Las cinco regiones suman el total de la gerencia general, demostrando que el filtro RLS funciona sin fugas ni duplicados.
              </p>
            </div>

            {/* COLUMNA DERECHA: Registro de Accesos (Estilo Claro) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Registro de accesos (Log)
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm text-gray-700 whitespace-pre-wrap flex-1 flex flex-col gap-2 overflow-y-auto">
                {data.registros_log.map((log, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-gray-400 select-none">&gt;</span>
                    <span>{log}</span>
                  </div>
                ))}
                <div className="mt-2 text-gray-400 animate-pulse">
                  _ esperando conexiones...
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
