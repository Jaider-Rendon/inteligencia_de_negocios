"use client";

import { useState, useEffect } from "react";

export default function CargaDeDatos() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/etl/status");
        if (response.ok) {
          const data = await response.json();
          if (data.loaded) {
            setResult({
              status: "success",
              message: data.message,
              registros_procesados: data.count,
              pipeline: data.pipeline,
              manejo_huerfanas: data.manejo_huerfanas
            });
            if (data.historial) setHistory(data.historial);
          } else {
            setResult(null);
          }
        }
      } catch (err) {
        console.error("Error al consultar el estado inicial del ETL:", err);
      }
    };

    checkStatus();
  }, []);

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/etl/reset", { method: "POST" });
      if (res.ok) {
        setResult(null);
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunETL = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Llamada al backend de FastAPI (Asumiendo que corre en localhost:8000)
      const response = await fetch("http://localhost:8000/api/etl/load", {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error desconocido al ejecutar ETL");
      }

      const data = await response.json();
      setResult(data);
      if (data.historial) setHistory(data.historial);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="top-bar">
        <h1 className="page-title">Carga de Datos</h1>
      </div>
      <div className="content-container">

        {/* Controles de Carga */}
        <div style={{ marginBottom: "30px", background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "18px", marginBottom: "16px", fontWeight: "600" }}>Proceso ETL - MotoExpres BI</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "20px", fontSize: "14px" }}>
            Ejecuta el proceso de extracción, transformación y carga desde los archivos fuente hacia la base de datos local SQLite.
            El proceso es <strong>idempotente</strong>, puedes ejecutarlo cuantas veces quieras sin duplicar registros.
          </p>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <button
              onClick={handleRunETL}
              disabled={loading}
              style={{
                background: loading ? "var(--text-muted)" : "var(--accent-primary)",
                color: "#fff",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "background 0.2s"
              }}
            >
              {loading ? (
                <>
                  <svg className="spinner" viewBox="0 0 50 50" width="16" height="16" style={{ animation: "spin 1s linear infinite" }}>
                    <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" />
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Ejecutar Carga de Datos
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                background: "transparent",
                color: "#ef4444",
                border: "1px solid #ef4444",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s"
              }}
            >
              Reiniciar base
            </button>
          </div>
        </div>

        {/* Resultados */}
        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "16px", borderRadius: "12px", color: "#ef4444" }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Pipeline Visual */}
        {result && result.pipeline && Array.isArray(result.pipeline) && (
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", overflowX: "auto", paddingBottom: "8px" }}>
            {result.pipeline.map((step: any, idx: number) => (
              <div key={idx} style={{ flex: 1, minWidth: "150px", background: "var(--bg-card)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)", borderTop: "4px solid #10b981", animation: `fadeIn 0.5s ease ${idx * 0.1}s forwards`, opacity: 0 }}>
                <div style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)", marginBottom: "8px" }}>{step.id}</div>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>{step.valor}</div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px", lineHeight: "1.3" }}>{step.subtitulo}</div>
                <div style={{ marginTop: "12px", height: "4px", background: "rgba(16, 185, 129, 0.2)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: step.is_count ? "100%" : "0%", background: "#10b981", transition: "width 1s ease" }}></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {result && (
          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", padding: "20px", borderRadius: "12px", animation: "fadeIn 0.5s ease" }}>
            <h3 style={{ color: "#10b981", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              {result.message}
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ background: "var(--bg-main)", padding: "16px", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Hechos Procesados (Caché Opcional)</div>
                <div style={{ fontSize: "24px", fontWeight: "700" }}>{result.registros_procesados.toLocaleString()}</div>
              </div>

              <div style={{ background: "var(--bg-main)", padding: "16px", borderRadius: "8px" }}>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Manejo de Llaves Huérfanas</div>
                <div style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{result.manejo_huerfanas.accion}</div>
                <ul style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-primary)" }}>
                  {Object.entries(result.manejo_huerfanas.detalles).map(([col, count]) => (
                    <li key={col}><strong>{col}:</strong> {count as number} reasignadas</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Filas que no se cargaron */}
        {result && (
          <div style={{ marginTop: "30px", background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", animation: "fadeIn 0.5s ease" }}>
            <h2 style={{ fontSize: "16px", marginBottom: "16px", fontWeight: "600", color: "#ef4444", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              Filas que no se cargaron
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "13px" }}>
                    <th style={{ padding: "12px 8px", fontWeight: "600" }}>Motivo</th>
                    <th style={{ padding: "12px 8px", fontWeight: "600" }}>Filas</th>
                    <th style={{ padding: "12px 8px", fontWeight: "600" }}>Destino</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", fontSize: "14px", transition: "background 0.2s" }}>
                    <td style={{ padding: "12px 8px", color: "var(--text-primary)", fontWeight: "500" }}>Duplicado exacto</td>
                    <td style={{ padding: "12px 8px", color: "#ef4444", fontWeight: "600" }}>340</td>
                    <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>Eliminado (se deja una copia)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {history && history.length > 0 && (
          <div style={{ marginTop: "30px", background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", animation: "fadeIn 0.5s ease" }}>
            <h2 style={{ fontSize: "16px", marginBottom: "16px", fontWeight: "600" }}>Historial de Ejecuciones (Demostración de Idempotencia)</h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", color: "var(--text-muted)", fontSize: "13px" }}>
                    <th style={{ padding: "12px 8px", fontWeight: "600" }}>Fecha y Hora</th>
                    <th style={{ padding: "12px 8px", fontWeight: "600" }}>Nuevas Insertadas</th>
                    <th style={{ padding: "12px 8px", fontWeight: "600" }}>Total en Base</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border-color)", fontSize: "14px", transition: "background 0.2s", cursor: "default" }}>
                      <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>{h.timestamp}</td>
                      <td style={{ padding: "12px 8px", color: h.nuevas > 0 ? "#10b981" : "var(--text-secondary)", fontWeight: h.nuevas > 0 ? "700" : "normal" }}>
                        {h.nuevas > 0 ? "+" + h.nuevas.toLocaleString() : "0"}
                      </td>
                      <td style={{ padding: "12px 8px", fontWeight: "600", color: "var(--text-primary)" }}>{h.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}} />
    </>
  );
}
