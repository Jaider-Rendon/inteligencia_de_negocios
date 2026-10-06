"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ReferenceLine,
} from "recharts";

/* ── Tipos ──────────────────────────────────────────────── */
interface GraficoMes {
  mes: string;
  ordenes: number;
  zscore: number;
  es_anomalia: boolean;
}

interface Alerta {
  tipo: "anomalia" | "estacional" | "umbral";
  nivel: string;
  titulo: string;
  subtitulo: string;
  detalle: string;
  // campos opcionales según tipo
  zscore?: number;
  tasa_actual?: number;
  meta?: number;
  brecha_puntos?: number;
  promedio_diciembre?: number;
  promedio_general?: number;
}

interface Resumen {
  meses_analizados: number;
  media_mensual: number;
  std_mensual: number;
  meses_anomalos: number;
  tasa_entregas_tiempo: number;
}

interface AlertasData {
  resumen: Resumen;
  grafico: GraficoMes[];
  alertas: Alerta[];
}

/* ── Helpers ────────────────────────────────────────────── */
const fmtNum = (v: number) => new Intl.NumberFormat("es-CO").format(Math.round(v));

const colorAlerta = {
  anomalia:   { border: "border-l-red-500",    badge: "bg-red-50 text-red-600",    icono: "🔴" },
  estacional: { border: "border-l-teal-500",   badge: "bg-teal-50 text-teal-700",  icono: "📅" },
  umbral:     { border: "border-l-yellow-500", badge: "bg-yellow-50 text-yellow-700", icono: "⚠️" },
};

const etiquetaAlerta = (a: Alerta) => {
  if (a.tipo === "anomalia" && a.zscore !== undefined)
    return `z = ${a.zscore > 0 ? "+" : ""}${a.zscore}`;
  if (a.tipo === "estacional") return "estacional";
  if (a.tipo === "umbral" && a.tasa_actual !== undefined)
    return `${a.tasa_actual}% / 85%`;
  return a.tipo;
};

/* ── Tooltip personalizado del gráfico ─────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as GraficoMes;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md px-4 py-3 text-sm">
      <p className="font-bold text-gray-800 mb-1">{label}</p>
      <p className="text-gray-600">Órdenes: <span className="font-semibold text-gray-900">{fmtNum(d.ordenes)}</span></p>
      <p className="text-gray-500">Z-score: <span className={`font-mono font-bold ${Math.abs(d.zscore) > 2 ? "text-red-500" : "text-slate-500"}`}>{d.zscore > 0 ? "+" : ""}{d.zscore}</span></p>
      {d.es_anomalia && <p className="text-red-500 font-semibold mt-1">⚠ Anomalía detectada</p>}
    </div>
  );
};

/* ======================== PÁGINA ======================== */
export default function Alertas() {
  const [data, setData]       = useState<AlertasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/etl/alertas")
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.json(); })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-50">

      {/* ── HEADER ──────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 pl-14 pr-10 py-4 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 leading-tight">Alertas</h1>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          MotoExpres BI · Detección automática de anomalías (Hito 2 – E11)
        </p>
      </header>

      <div className="pl-14 pr-10 pb-10 pt-6 flex flex-col gap-6">

        {/* ── BANNER METODOLÓGICO ──────────────────── */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex gap-3 text-sm text-yellow-800">
          <span className="font-bold whitespace-nowrap">Hito 2 · E11</span>
          <p className="leading-snug">
            El sistema avisa solo cuando un mes se sale de lo normal (|z|&nbsp;&gt;&nbsp;2). 
            El Z-score mide cuántas desviaciones estándar se aleja el volumen mensual de la media histórica. 
            Un diciembre alto es esperable; un agosto masivo merece revisión.
          </p>
        </div>

        {/* ── LOADING ─────────────────────────────── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-10 w-10 border-4 border-yellow-200 border-t-yellow-500 rounded-full" />
          </div>
        )}

        {/* ── ERROR ───────────────────────────────── */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 text-sm font-medium">
            ⚠️ No se pudieron cargar los datos: {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ── RESUMEN ESTADÍSTICO ─────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Meses Analizados",    value: data.resumen.meses_analizados,                           sub: "serie completa 2022-2025" },
                { label: "Media Mensual",        value: fmtNum(data.resumen.media_mensual),                      sub: "órdenes / mes (μ)" },
                { label: "Desv. Estándar (σ)",  value: fmtNum(data.resumen.std_mensual),                        sub: "dispersión histórica" },
                { label: "Meses Anómalos",       value: data.resumen.meses_anomalos,                             sub: "|z| > 2 detectados" },
              ].map(({ label, value, sub }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
                  <p className="text-3xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── GRÁFICO DE SERIE TEMPORAL ────────── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Serie temporal de órdenes</p>
                  <p className="text-sm font-semibold text-gray-800">Volumen mensual 2022-2025 · Barras rojas = anomalías (|z|&nbsp;&gt;&nbsp;2)</p>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: "#94a3b8" }} />
                    Normal
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-red-400" />
                    Anomalía
                  </span>
                </div>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.grafico}
                    margin={{ top: 5, right: 10, left: -10, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 9, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      interval={2}
                      dy={8}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={v => fmtNum(v)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Línea de referencia: media */}
                    <ReferenceLine
                      y={data.resumen.media_mensual}
                      stroke="#6366f1"
                      strokeDasharray="4 3"
                      strokeWidth={1.5}
                      label={{
                        value: `μ = ${fmtNum(data.resumen.media_mensual)}`,
                        position: "insideTopRight",
                        fill: "#6366f1",
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="ordenes" radius={[3, 3, 0, 0]} barSize={12}>
                      {data.grafico.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.es_anomalia ? "#ef4444" : "#94a3b8"}
                          opacity={entry.es_anomalia ? 1 : 0.75}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── TARJETAS DE ALERTAS ──────────────── */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                Alertas activas ({data.alertas.length})
              </p>

              <div className="flex flex-col gap-4">
                {data.alertas.map((alerta, i) => {
                  const cfg = colorAlerta[alerta.tipo] ?? colorAlerta.umbral;
                  return (
                    <div
                      key={i}
                      className={`bg-white rounded-xl border border-gray-200 border-l-4 ${cfg.border} shadow-sm p-5 flex justify-between items-start gap-4`}
                    >
                      {/* Contenido izquierdo */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base leading-none">{cfg.icono}</span>
                          <h3 className="text-sm font-bold text-gray-900">{alerta.titulo}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{alerta.subtitulo}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{alerta.detalle}</p>

                        {/* Barra de progreso para tipo umbral */}
                        {alerta.tipo === "umbral" && alerta.tasa_actual !== undefined && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Tasa actual: <strong className="text-gray-700">{alerta.tasa_actual}%</strong></span>
                              <span>Meta: <strong className="text-gray-700">85%</strong></span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-yellow-400 transition-all"
                                style={{ width: `${Math.min(alerta.tasa_actual, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Etiqueta derecha */}
                      <div className="shrink-0">
                        <span className={`font-mono text-xs px-2.5 py-1.5 rounded-lg font-bold ${cfg.badge}`}>
                          {etiquetaAlerta(alerta)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── NOTA METODOLÓGICA ────────────────── */}
            <div className="bg-slate-100 rounded-xl px-5 py-4 text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-700">Metodología:</strong>{" "}
              Z-score = (X_mes − μ) / σ, calculado sobre la serie mensual completa con desviación estándar muestral (ddof=1).
              Un valor |z|&nbsp;&gt;&nbsp;2 indica que el mes está a más de 2 desviaciones estándar de la media,
              probabilidad de ocurrencia normal inferior al 5% bajo distribución normal.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
