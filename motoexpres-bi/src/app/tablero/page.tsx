"use client";

import { useEffect, useState, useMemo } from "react";
import { useRole } from "@/context/RoleContext";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, LabelList
} from "recharts";

/* ── Etiqueta de barra ─────────────────────────────────────────── */
const BarLabel = (props: any) => {
  const { x, y, width, height, value } = props;
  const fmt = (v: number) =>
    `$${(v / 1_000_000).toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
  return (
    <text x={x + width + 6} y={y + height / 2 + 4} fill="#64748b" fontSize={11} fontWeight={500}>
      {fmt(value)}
    </text>
  );
};

/* ── Selector de gerente ───────────────────────────────────────── */
function GerentsSelector() {
  const { role, setRole } = useRole();
  const opts = [
    { value: "gerencia_general", label: "Ver como: Gerencia (todo)" },
    { value: "regional_antioquia", label: "Gerente regional · Antioquia" },
    { value: "regional_bogota", label: "Gerente regional · Bogotá" },
    { value: "regional_eje_cafetero", label: "Gerente regional · Eje Cafetero" },
    { value: "regional_magdalena_medio", label: "Gerente regional · Magdalena Medio" },
    { value: "regional_valle", label: "Gerente regional · Valle" },
  ];
  return (
    <select
      value={role}
      onChange={e => setRole(e.target.value)}
      style={{
        appearance: "none",
        WebkitAppearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 12px center",
        backgroundSize: "14px",
        paddingRight: "38px",
      }}
      className="bg-white text-slate-700 border border-gray-300 rounded-md py-2 px-4 text-sm font-medium outline-none cursor-pointer shadow-sm hover:border-teal-400 focus:ring-2 focus:ring-teal-500 transition-colors"
    >
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* ======================== PÁGINA ======================== */
export default function Tablero() {
  const { role } = useRole();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [regionSel, setRegionSel] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:8000/api/etl/tablero?rol=${role}`)
      .then(r => r.json())
      .then(d => { setData(d); setRegionSel(null); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [role]);

  const servicios = useMemo(() => {
    if (!data?.ingresos_por_servicio) return [];
    let items: any[];
    if (regionSel) {
      items = data.ingresos_por_servicio
        .filter((s: any) => s.region === regionSel)
        .map((s: any) => ({ servicio: s.servicio || "Sin servicio", ingresos: s.ingresos }));
    } else {
      const map: Record<string, number> = {};
      data.ingresos_por_servicio.forEach((s: any) => {
        const k = s.servicio || "Sin servicio";
        map[k] = (map[k] || 0) + s.ingresos;
      });
      items = Object.entries(map).map(([servicio, ingresos]) => ({ servicio, ingresos }));
    }
    return items.sort((a, b) => b.ingresos - a.ingresos);
  }, [data, regionSel]);

  const regiones = useMemo(() =>
    data?.ingresos_por_region
      ? [...data.ingresos_por_region].sort((a, b) => a.ingresos - b.ingresos)
      : [],
    [data?.ingresos_por_region]);

  const onRegionClick = (pl: any) => {
    if (!pl?.activePayload?.[0]) return;
    const r = pl.activePayload[0].payload.region;
    setRegionSel(p => p === r ? null : r);
  };

  const fmtCOP = (v: number) => `$${v.toLocaleString("es-CO")}`;
  const fmtMilM = (v: number) => {
    const m = v / 1_000_000;
    return m >= 1000
      ? `$${(m / 1000).toLocaleString("es-CO", { maximumFractionDigits: 2 })} mil M`
      : `$${m.toLocaleString("es-CO", { maximumFractionDigits: 1 })} M`;
  };
  const fmtNum = (v: number) => new Intl.NumberFormat("es-CO").format(v ?? 0);

  const regionLabel = role === "gerencia_general"
    ? "Todas las regiones"
    : role.replace("regional_", "").replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase())
      .replace("Bogota", "Bogotá");

  const ttStyle = {
    backgroundColor: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#0f172a",
    boxShadow: "0 4px 6px rgba(0,0,0,.05)",
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-slate-50">
      <div className="animate-spin h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
    </div>
  );
  if (!data) return <p className="p-8 text-slate-600">Error cargando datos.</p>;

  const { kpis, ingresos_por_mes } = data;

  return (
    /* Contenedor que hace scroll dentro del main-content */
    <>

      {/* ── HEADER ─────────────────────────────────── */}
      <header className="top-bar flex justify-between w-full">
        <div>
          <h1 className="page-title">Tablero</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">MotoExpres BI · Hito 2 – Lo funcional (E10)</p>
        </div>
        <GerentsSelector />
      </header>

      {/* ── CUERPO ─────────────────────────────────── */}
      <div className="content-container flex flex-col gap-6">
        {/* ── BANNER ─────────────────────────────────── */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 flex gap-3 text-sm text-yellow-800 mb-2">
          <span className="font-bold text-yellow-700 whitespace-nowrap">Hito 2 · E7-E9</span>
          <p className="leading-snug">Pirámide invertida: arriba KPIs (3 segundos), en el medio tendencias y abajo el detalle. Los valores salen de los datos limpios del proyecto.</p>
        </div>

        {/* NIVEL 1 – 4 KPIs */}
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: "INGRESOS 2022-2025", val: fmtMilM(kpis.ingresos_totales), sub: regionLabel, subCls: "text-gray-400" },
            { label: "ÓRDENES", val: fmtNum(kpis.ordenes_validas), sub: "válidas, sin duplicados", subCls: "text-gray-400" },
            { label: "MARGEN", val: `${(kpis.margen_porcentaje || 0).toFixed(1)} %`, sub: "(ingreso − costo) / ingreso", subCls: "text-gray-400" },
            { label: "ENTREGAS A TIEMPO", val: `${(kpis.entregas_a_tiempo_porcentaje || 0).toFixed(1)} %`, sub: "solo entregadas · meta 85 %", subCls: "text-red-500" },
          ].map(({ label, val, sub, subCls }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{val}</p>
              <p className={`text-sm mt-1 ${subCls}`}>{sub}</p>
            </div>
          ))}
        </div>

        {/* NIVEL 2 – Líneas + Servicios */}
        <div className="grid grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ingresos por mes</p>
            <p className="text-sm font-bold text-gray-900 mt-1 mb-1">Evolución mensual de ingresos</p>
            <p className="text-xs text-gray-400 mb-4">Millones de pesos. Cada diciembre sube; agosto de 2024 no es normal. Con el filtro de rol, se calculan solo las órdenes de la región.</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ingresos_por_mes} margin={{ top: 4, right: 6, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={5} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false}
                    tickFormatter={v => `$${v / 1_000_000}M`} />
                  <Tooltip formatter={(v: any) => [fmtCOP(v), "Ingresos"]} contentStyle={ttStyle} />
                  <Line type="monotone" dataKey="ingresos" stroke="#6366f1" strokeWidth={2.5}
                    dot={false} activeDot={{ r: 5, fill: "#6366f1" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Por servicio</p>
                <p className="text-sm font-bold text-gray-900 mt-1">Ingresos acumulados, millones</p>
              </div>
              {regionSel && (
                <button onClick={() => setRegionSel(null)}
                  className="text-[11px] px-2.5 py-1 rounded-lg font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors">
                  ✕ {regionSel}
                </button>
              )}
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={servicios} margin={{ top: 0, right: 66, left: 8, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="servicio" type="category"
                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                    axisLine={false} tickLine={false} width={85} />
                  <Tooltip formatter={(v: any) => [fmtCOP(v), "Ingresos"]}
                    cursor={{ fill: "#f8fafc" }} contentStyle={ttStyle} />
                  <Bar dataKey="ingresos" fill="#a5b4fc" radius={[0, 3, 3, 0]} barSize={14}>
                    <LabelList dataKey="ingresos" content={<BarLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* NIVEL 3 – Regiones + Tabla */}
        <div className="grid grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Por región</p>
            <p className="text-sm font-bold text-gray-900 mt-1 mb-1">Distribución geográfica</p>
            <p className="text-xs text-indigo-500 font-medium mb-4">Clic en una barra para filtrar servicios ↑</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={regiones} onClick={onRegionClick}
                  margin={{ top: 0, right: 66, left: 8, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="region" type="category"
                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 500 }}
                    axisLine={false} tickLine={false} width={110} />
                  <Tooltip formatter={(v: any) => [fmtCOP(v), "Ingresos"]}
                    cursor={{ fill: "#f8fafc" }} contentStyle={ttStyle} />
                  <Bar dataKey="ingresos" radius={[0, 3, 3, 0]} barSize={14} cursor="pointer">
                    {regiones.map((e: any, i: number) => (
                      <Cell key={i} fill={regionSel === e.region ? "#14b8a6" : "#cbd5e1"} />
                    ))}
                    <LabelList dataKey="ingresos" content={<BarLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comparativa anual</p>
              <p className="text-sm font-bold text-gray-900 mt-1 mb-1">2025 frente a 2024</p>
              <p className="text-xs text-gray-400 mb-5">La comparación cambia según cómo se trate el pico de agosto</p>
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200">
                    <th className="pb-2 font-bold text-left">Cálculo</th>
                    <th className="pb-2 font-bold text-right">2024</th>
                    <th className="pb-2 font-bold text-right">Variación 2025</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-100">
                    <td className="py-3 text-slate-700">Con el pico de agosto</td>
                    <td className="py-3 text-right font-mono text-slate-600 font-medium">$2.755,8 M</td>
                    <td className="py-3 text-right font-bold text-red-500">−10,3 %</td>
                  </tr>
                  <tr className="bg-amber-50">
                    <td className="py-3 pl-2 font-bold text-amber-900 border-l-4 border-amber-400">Agosto → mes típico</td>
                    <td className="py-3 text-right font-mono font-bold text-amber-900">$2.541,9 M</td>
                    <td className="py-3 text-right font-black text-amber-600 pr-1">−2,7 %</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-400 pt-3 border-t border-slate-100">
              Un tablero honesto muestra las dos filas y dice cuál usa.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
