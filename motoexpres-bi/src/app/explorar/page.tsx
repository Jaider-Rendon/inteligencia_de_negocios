"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, LabelList,
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
    <text x={x + width + 7} y={y + height / 2 + 4} fill="var(--text-muted)" fontSize={12} fontWeight={600}>
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
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-primary)",
    boxShadow: "0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)",
    padding: "10px 14px"
  };

  return (
    <>
      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="top-bar">
        <div>
          <h1 className="page-title">Explorar Regiones</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Análisis regional detallado y comparativas
          </p>
        </div>
      </header>

      <div className="content-container">
        {/* ── SELECTOR DE REGIÓN ──────────────────────── */}
        <div className="filter-container">
          <p className="filter-title">Selecciona la región a explorar</p>
          <div className="filter-buttons">
            {REGIONES.map(r => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`filter-btn ${region === r ? "active" : ""}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* ── LOADING & ERROR ─────────────────────────── */}
        {loading && (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h2 className="empty-state-title">Cargando datos...</h2>
            <p className="empty-state-desc">Obteniendo la información de la región {region}</p>
          </div>
        )}

        {error && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: "#ef4444" }}>⚠️</div>
            <h2 className="empty-state-title">Error de carga</h2>
            <p className="empty-state-desc">{error}</p>
          </div>
        )}

        {/* ── DATOS ───────────────────────────────────── */}
        {!loading && !error && data && (
          <>
            {/* ── NIVEL 1: 4 KPIs ─────────────────────── */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <p className="kpi-title">Ingresos Totales</p>
                <p className="kpi-value">{fmtMilM(data.kpis.ingresos_totales)}</p>
                <p className="kpi-sub">Región {data.region_activa}</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-title">Órdenes</p>
                <p className="kpi-value">{fmtNum(data.kpis.total_ordenes)}</p>
                <p className="kpi-sub">Envíos realizados</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-title">Ticket Promedio</p>
                <p className="kpi-value">{fmtCOP(data.kpis.ticket_promedio)}</p>
                <p className="kpi-sub">Ingreso por orden</p>
              </div>
              <div className="kpi-card">
                <p className="kpi-title">Margen Operativo</p>
                <p className="kpi-value">{fmtPct(data.kpis.margen_porcentaje)}</p>
                <p className="kpi-sub">(Ingreso − Costo) / Ingreso</p>
              </div>
            </div>

            {/* ── NIVEL 2: Gráfico + Tabla ────────────── */}
            <div className="chart-grid">
              {/* Gráfico de barras */}
              <div className="data-table-container" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="data-table-header">
                  <h2 className="data-table-title">
                    <span style={{ color: 'var(--accent-primary)' }}>📊</span>
                    Ingresos por Servicio
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                    Distribución en {data.region_activa}
                  </p>
                </div>
                <div style={{ flex: 1, padding: "24px", minHeight: "350px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={data.ingresos_por_servicio}
                      margin={{ top: 0, right: 80, left: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="servicio"
                        type="category"
                        tick={{ fontSize: 13, fill: "var(--text-secondary)", fontWeight: 500 }}
                        axisLine={false}
                        tickLine={false}
                        width={100}
                      />
                      <Tooltip
                        formatter={(v: any) => [fmtCOP(v), "Ingresos"]}
                        cursor={{ fill: "var(--bg-hover)" }}
                        contentStyle={ttStyle}
                      />
                      <Bar dataKey="ingresos" fill="var(--accent-primary)" radius={[0, 6, 6, 0]} barSize={28}>
                        <LabelList dataKey="ingresos" content={<BarLabel />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tabla de participación */}
              <div className="data-table-container">
                <div className="data-table-header">
                  <h2 className="data-table-title">
                    <span style={{ color: 'var(--accent-primary)' }}>⚖️</span>
                    Participación vs. Promedio
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                    Comparativa frente al comportamiento nacional
                  </p>
                </div>
                
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th style={{ textAlign: "right" }}>% Región</th>
                        <th style={{ textAlign: "right" }}>% Prom.</th>
                        <th style={{ textAlign: "right" }}>Brecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tabla_participacion.map(row => (
                        <tr key={row.servicio}>
                          <td style={{ fontWeight: 600 }}>{row.servicio}</td>
                          <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "14px" }}>
                            {fmtPct(row.porcentaje_region)}
                          </td>
                          <td style={{ textAlign: "right", color: "var(--text-muted)", fontFamily: "monospace", fontSize: "14px" }}>
                            {fmtPct(row.porcentaje_promedio)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <span className={`badge ${
                              row.diferencia > 0 ? "green" : row.diferencia < 0 ? "red" : "blue"
                            }`}>
                              {row.diferencia > 0 ? `+${row.diferencia.toFixed(1)}` : row.diferencia.toFixed(1)} pp
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div style={{ padding: "16px 24px", background: "var(--bg-hover)", borderTop: "1px solid var(--border-color)", fontSize: "12px", color: "var(--text-muted)" }}>
                  <strong>pp = puntos porcentuales.</strong> Positivo significa que este servicio pesa más en esta región que en el promedio nacional.
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
