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
    <>
      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="top-bar">
        <div>
          <h1 className="page-title">Control de Accesos</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Seguridad y auditoría basada en Row-Level Security
          </p>
        </div>
      </header>

      <div className="content-container">

        {/* ── BANNER DE NOTA ────────────────────────────── */}
        <div style={{
          background: "rgba(245, 158, 11, 0.05)",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          borderRadius: "16px",
          padding: "20px 24px",
          display: "flex",
          gap: "16px",
          marginBottom: "32px",
          alignItems: "flex-start"
        }}>
          <span className="badge yellow">Hito 2 · E10</span>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: "var(--text-primary)" }}>Demostración del esquema de seguridad:</strong> Todo el equipo ingresa por la misma URL y ve la misma estructura, 
            pero el sistema filtra los datos desde el backend asegurando que cada gerente solo vea la información de su región.
          </p>
        </div>

        {/* ── TARJETA 1: ROLES DEL SISTEMA ──────────────── */}
        <div className="data-table-container">
          <div className="data-table-header">
            <h2 className="data-table-title">
              <span style={{ color: 'var(--accent-primary)' }}>🛡️</span>
              Roles del sistema configurados
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
              Permisos y reglas de filtrado SQL
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rol</th>
                  <th>Pantallas</th>
                  <th>Datos permitidos</th>
                  <th>Regla de filtro SQL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>Gerencia General</td>
                  <td>Todas las vistas</td>
                  <td>Total Nacional (100%)</td>
                  <td>
                    <span style={{ background: "var(--bg-hover)", padding: "4px 8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "12px", border: "1px solid var(--border-color)" }}>
                      WHERE 1=1
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>Gerente Regional</td>
                  <td>Tablero y Explorar</td>
                  <td>Solo su propia región</td>
                  <td>
                    <span style={{ background: "var(--bg-hover)", padding: "4px 8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "12px", border: "1px solid var(--border-color)" }}>
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
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h2 className="empty-state-title">Cargando datos...</h2>
            <p className="empty-state-desc">Verificando los permisos de acceso y logs</p>
          </div>
        )}

        {error && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: "#ef4444" }}>⚠️</div>
            <h2 className="empty-state-title">Error de carga</h2>
            <p className="empty-state-desc">{error}</p>
          </div>
        )}

        {/* ── GRID INFERIOR (2 COLUMNAS) ────────────────── */}
        {!loading && !error && data && (
          <div className="chart-grid">

            {/* COLUMNA IZQUIERDA: Prueba Rápida */}
            <div className="data-table-container" style={{ marginBottom: 0, display: "flex", flexDirection: "column" }}>
              <div className="data-table-header">
                <h2 className="data-table-title">
                  <span style={{ color: 'var(--accent-primary)' }}>🔢</span>
                  Prueba matemática
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                  Validación de ingresos asignados
                </p>
              </div>
              
              <div style={{ overflowX: "auto", flex: 1 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vista del gerente</th>
                      <th style={{ textAlign: "right" }}>Ingresos asignados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regiones.map(row => (
                      <tr key={row.region}>
                        <td style={{ fontWeight: 500 }}>{row.region}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "14px", color: "var(--text-primary)" }}>
                          {fmtCOP(row.ingresos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "var(--bg-hover)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text-primary)", borderTop: "2px solid var(--border-color)" }}>
                        Suma de las 5 regiones (Total)
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", borderTop: "2px solid var(--border-color)" }}>
                        {fmtCOP(data.total_gerencia)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style={{ padding: "16px 24px", background: "var(--bg-main)", borderTop: "1px solid var(--border-color)", fontSize: "12px", color: "var(--text-muted)" }}>
                Las cinco regiones suman el total de la gerencia general, demostrando que el filtro RLS funciona sin fugas ni duplicados.
              </div>
            </div>

            {/* COLUMNA DERECHA: Registro de Accesos (Estilo Terminal Claro) */}
            <div className="data-table-container" style={{ marginBottom: 0, display: "flex", flexDirection: "column" }}>
              <div className="data-table-header">
                <h2 className="data-table-title">
                  <span style={{ color: 'var(--accent-primary)' }}>📜</span>
                  Registro de accesos (Log)
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                  Trazabilidad de auditoría
                </p>
              </div>
              
              <div style={{ 
                background: "var(--bg-hover)", 
                margin: "24px",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                fontFamily: "monospace", 
                fontSize: "13px", 
                color: "var(--text-secondary)",
                flex: 1, 
                display: "flex", 
                flexDirection: "column", 
                gap: "8px", 
                overflowY: "auto",
                maxHeight: "300px"
              }}>
                {data.registros_log.map((log, i) => (
                  <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                    <span style={{ color: "var(--text-muted)", userSelect: "none" }}>&gt;</span>
                    <span style={{ lineHeight: 1.5 }}>{log}</span>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", opacity: 0.5, marginTop: "8px" }}>
                  <span style={{ color: "var(--text-muted)", userSelect: "none" }}>&gt;</span>
                  <span style={{ animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" }}>_ esperando conexiones...</span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </>
  );
}
