"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LabelList, Cell,
} from "recharts";

/* ── Tipos ──────────────────────────────────────────────── */
interface Kpis {
  ingresos_totales: number;
  total_ordenes: number;
  ticket_promedio: number;
  margen_porcentaje: number;
}
interface ServicioRow { servicio: string; ingresos: number; }
interface ParticipacionRow {
  servicio: string;
  ingresos_region: number;
  porcentaje_region: number;
  porcentaje_promedio: number;
  diferencia: number;
}
interface ExplorarData {
  region_activa: string;
  regiones_disponibles: string[];
  kpis: Kpis;
  ingresos_por_servicio: ServicioRow[];
  tabla_participacion: ParticipacionRow[];
}

/* ── Constantes ─────────────────────────────────────────── */
const REGIONES = ["Antioquia", "Bogotá", "Eje Cafetero", "Magdalena Medio", "Valle"];

/* ── Helpers de formato ─────────────────────────────────── */
const fmtMilM = (v: number) => {
  const m = v / 1_000_000;
  return m >= 1000
    ? `$${(m / 1000).toLocaleString("es-CO", { maximumFractionDigits: 2 })} mil M`
    : `$${m.toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
};
const fmtNum  = (v: number) => new Intl.NumberFormat("es-CO").format(Math.round(v));
const fmtPct  = (v: number) => `${v.toFixed(1)} %`;
const fmtCOP  = (v: number) => `$${v.toLocaleString("es-CO")}`;

/* ── Etiqueta barra ─────────────────────────────────────── */
const BarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  return (
    <text x={x + width + 7} y={y + height / 2 + 4} fill="#64748b" fontSize={11} fontWeight={500}>
      {fmtMilM(value)}
    </text>
  );
};

/* ======================== PÁGINA ======================== */
export default function Explorar() {
  const [region, setRegion]   = useState("Valle");
  const [data, setData]       = useState<ExplorarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`http://localhost:8000/api/etl/explorar?region=${encodeURIComponent(region)}`)
      .then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [region]);

  const ttStyle = {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
    boxShadow: "0 4px 6px rgba(0,0,0,.05)",
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50">

      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 pl-14 pr-10 py-4 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Explorar</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">MotoExpres BI · Análisis regional detallado</p>
      </header>

      <div className="pl-14 pr-10 pb-10 pt-6 flex flex-col gap-6">

        {/* ── SELECTOR DE REGIÓN ──────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
            Selecciona la región a explorar
          </p>
          <div className="flex flex-wrap gap-3">
            {REGIONES.map(r => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  region === r
                    ? "bg-teal-600 text-white shadow-md shadow-teal-100"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── LOADING ─────────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-teal-200 border-t-teal-600 rounded-full" />
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────── */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm font-medium">
            ⚠️ No se pudieron cargar los datos: {error}
          </div>
        )}

        {/* ── DATOS ───────────────────────────────────── */}
        {!loading && !error && data && (
          <>
            {/* ── NIVEL 1: 4 KPIs ─────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: "Ingresos Totales",  value: fmtMilM(data.kpis.ingresos_totales),      sub: `Región ${data.region_activa}` },
                { label: "Órdenes",            value: fmtNum(data.kpis.total_ordenes),           sub: "envíos realizados" },
                { label: "Ticket Promedio",    value: fmtCOP(data.kpis.ticket_promedio),         sub: "ingreso / orden" },
                { label: "Margen Operativo",   value: fmtPct(data.kpis.margen_porcentaje),       sub: "(ingreso − costo) / ingreso" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-auto">{value}</p>
                  <p className="text-sm text-gray-400 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── NIVEL 2: Gráfico + Tabla lado a lado ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

              {/* Gráfico de barras horizontales */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Ingresos por servicio
                </p>
                <p className="text-sm font-semibold text-gray-800 mb-5">
                  Distribución en {data.region_activa}
                </p>
                <div style={{ height: Math.max(220, data.ingresos_por_servicio.length * 48) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.ingresos_por_servicio}
                      margin={{ top: 0, right: 80, left: 10, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="servicio"
                        type="category"
                        tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        width={95}
                      />
                      <Tooltip
                        formatter={(v: any) => [fmtCOP(v), "Ingresos"]}
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={ttStyle}
                      />
                      <Bar dataKey="ingresos" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={20}>
                        <LabelList dataKey="ingresos" content={<BarLabel />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla de participación */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Participación por servicio
                </p>
                <p className="text-sm font-semibold text-gray-800 mb-5">
                  {data.region_activa} vs. promedio de las 5 regiones
                </p>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Servicio</th>
                        <th className="pb-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">% Región</th>
                        <th className="pb-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">% Promedio</th>
                        <th className="pb-3 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Dif.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.tabla_participacion.map(row => (
                        <tr key={row.servicio} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 font-medium text-gray-700">{row.servicio}</td>
                          <td className="py-3 text-right font-mono text-gray-600">{fmtPct(row.porcentaje_region)}</td>
                          <td className="py-3 text-right font-mono text-gray-400">{fmtPct(row.porcentaje_promedio)}</td>
                          <td className={`py-3 text-right font-bold tabular-nums ${
                            row.diferencia > 0
                              ? "text-green-600"
                              : row.diferencia < 0
                              ? "text-red-500"
                              : "text-gray-400"
                          }`}>
                            {row.diferencia > 0 ? `+${row.diferencia.toFixed(1)}` : row.diferencia.toFixed(1)} pp
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
                  pp = puntos porcentuales. Positivo → la región supera el promedio nacional en ese servicio.
                </p>
              </div>
            </div>

            {/* ── NOTA EXPLICATIVA ────────────────────────── */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl px-5 py-4 text-sm text-teal-800">
              <span className="font-bold">¿Cómo leer la tabla?</span>&nbsp;
              La columna <strong>% Región</strong> es la participación de cada servicio sobre el total de{" "}
              <strong>{data.region_activa}</strong>. La columna <strong>% Promedio</strong> es el mismo cálculo
              pero promediado entre las {data.regiones_disponibles.length} regiones. Una diferencia positiva
              indica que el servicio tiene mayor peso aquí que en el resto del país.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
