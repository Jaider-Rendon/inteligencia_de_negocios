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
  zscore?: number;
  tasa_actual?: number;
  meta?: number;
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

const alertaConfig = {
  anomalia:   { color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)", icon: "🚨", badge: "red" },
  estacional: { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", icon: "📈", badge: "blue" },
  umbral:     { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", icon: "⚠️", badge: "yellow" },
};

const etiquetaAlerta = (a: Alerta) => {
  if (a.tipo === "anomalia" && a.zscore !== undefined)
    return `Z-Score = ${a.zscore > 0 ? "+" : ""}${a.zscore}`;
  if (a.tipo === "estacional") return "Estacional";
  if (a.tipo === "umbral" && a.tasa_actual !== undefined)
    return `${a.tasa_actual}% / 85%`;
  return a.tipo;
};

/* ── Tooltip ────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as GraficoMes;
  return (
    <div style={{
      background: "var(--bg-card)",
      border: "1px solid var(--border-color)",
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "13px",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,.1)",
      color: "var(--text-primary)"
    }}>
      <p style={{ fontWeight: 700, marginBottom: "4px" }}>{label}</p>
      <p style={{ color: "var(--text-secondary)" }}>Órdenes: <strong style={{ color: "var(--text-primary)" }}>{fmtNum(d.ordenes)}</strong></p>
      <p style={{ color: "var(--text-secondary)" }}>Z-score: 
        <strong style={{ marginLeft: "4px", color: Math.abs(d.zscore) > 2 ? "#ef4444" : "var(--text-primary)" }}>
          {d.zscore > 0 ? "+" : ""}{d.zscore}
        </strong>
      </p>
      {d.es_anomalia && <p style={{ color: "#ef4444", fontWeight: 600, marginTop: "6px" }}>⚠ Anomalía detectada</p>}
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
    <>
      {/* ── HEADER ──────────────────────────────────── */}
      <header className="top-bar">
        <div>
          <h1 className="page-title">Alertas</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Detección automática de anomalías y alertas preventivas
          </p>
        </div>
      </header>

      <div className="content-container">
        
        {/* ── LOADING & ERROR ─────────────────────────── */}
        {loading && (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h2 className="empty-state-title">Cargando datos...</h2>
            <p className="empty-state-desc">Analizando las series temporales de órdenes</p>
          </div>
        )}

        {error && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: "#ef4444" }}>⚠️</div>
            <h2 className="empty-state-title">Error de carga</h2>
            <p className="empty-state-desc">{error}</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ── 1. KPIs ─────────────────────────────────── */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <p className="kpi-title">Meses Analizados</p>
                <p className="kpi-value">{data.resumen.meses_analizados}</p>
                <p className="kpi-sub">Serie completa 2022-2025</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-title">Media Mensual</p>
                <p className="kpi-value">{fmtNum(data.resumen.media_mensual)}</p>
                <p className="kpi-sub">Órdenes promedio (μ)</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-title">Desviación (σ)</p>
                <p className="kpi-value">{fmtNum(data.resumen.std_mensual)}</p>
                <p className="kpi-sub">Dispersión histórica</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-title">Meses Anómalos</p>
                <p className="kpi-value">{data.resumen.meses_anomalos}</p>
                <p className="kpi-sub">|z| &gt; 2 detectados</p>
              </div>
            </div>

            {/* ── 2. GRÁFICO TEMPORAL ─────────────────────── */}
            <div className="data-table-container" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="data-table-header">
                <h2 className="data-table-title">
                  <span style={{ color: 'var(--accent-primary)' }}>📈</span>
                  Serie temporal de órdenes
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                  Evolución histórica y detección de anomalías (|Z| &gt; 2)
                </p>
              </div>
              
              <div style={{ padding: "32px 24px", height: "400px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.grafico} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false} tickLine={false}
                      angle={-45} textAnchor="end" dy={10} interval={1}
                    />
                    <YAxis 
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false} tickLine={false}
                      tickFormatter={v => fmtNum(v)}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--bg-hover)" }} />
                    <ReferenceLine 
                      y={data.resumen.media_mensual} 
                      stroke="var(--accent-primary)" 
                      strokeDasharray="4 4"
                      label={{ value: `Media = ${fmtNum(data.resumen.media_mensual)}`, position: "insideTopRight", fill: "var(--accent-primary)", fontSize: 12, fontWeight: 600 }}
                    />
                    <Bar dataKey="ordenes" radius={[4, 4, 0, 0]} barSize={16}>
                      {data.grafico.map((entry, i) => (
                        <Cell key={i} fill={entry.es_anomalia ? "#ef4444" : "var(--text-muted)"} opacity={entry.es_anomalia ? 1 : 0.4} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── 3. TARJETAS DE ALERTA ───────────────────── */}
            <div style={{ marginTop: "40px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                Alertas Activas ({data.alertas.length})
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "24px" }}>
                Notificaciones basadas en análisis estadístico y objetivos de negocio.
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
                {data.alertas.map((alerta, i) => {
                  const conf = alertaConfig[alerta.tipo] || alertaConfig.umbral;
                  
                  return (
                    <div key={i} className="kpi-card" style={{ borderTop: `4px solid ${conf.color}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: conf.bg, color: conf.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>
                          {conf.icon}
                        </div>
                        <span className={`badge ${conf.badge}`}>{etiquetaAlerta(alerta)}</span>
                      </div>
                      
                      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "6px" }}>
                        {alerta.titulo}
                      </h3>
                      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>
                        {alerta.subtitulo}
                      </p>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5, marginTop: "auto" }}>
                        {alerta.detalle}
                      </p>

                      {alerta.tipo === "umbral" && alerta.tasa_actual !== undefined && (
                        <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>
                            <span style={{ color: "var(--text-secondary)" }}>Tasa actual: <strong style={{ color: "var(--text-primary)" }}>{alerta.tasa_actual}%</strong></span>
                            <span style={{ color: "var(--text-secondary)" }}>Meta: <strong style={{ color: "var(--text-primary)" }}>85%</strong></span>
                          </div>
                          <div style={{ height: "8px", background: "var(--bg-hover)", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ height: "100%", background: conf.color, width: `${Math.min(alerta.tasa_actual, 100)}%`, borderRadius: "999px" }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── NOTA METODOLÓGICA ───────────────────────── */}
            <div style={{ background: "var(--bg-hover)", padding: "16px 24px", borderRadius: "12px", fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <strong style={{ color: "var(--text-primary)" }}>Metodología:</strong> Z-score = (X_mes − μ) / σ. 
              Calculado sobre la serie mensual completa. Un valor |z| &gt; 2 indica que el mes está a más de 2 desviaciones estándar de la media.
            </div>

          </>
        )}
      </div>
    </>
  );
}
