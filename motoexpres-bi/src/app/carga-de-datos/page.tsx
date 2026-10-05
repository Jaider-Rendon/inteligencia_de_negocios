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
              manejo_huerfanas: data.manejo_huerfanas,
              filas_no_cargadas: data.filas_no_cargadas
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
    <div style={{ background: "#f8fafc", minHeight: "100%", color: "#0f172a", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeInData { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fillWidth { from { width: 0; } to { width: 100%; } }
      `}</style>
      <div className="top-bar" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 40px" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", letterSpacing: "-0.5px" }}>
            Ingesta y Procesamiento
          </h1>
          <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px" }}>Control total sobre el proceso ETL (Extracción, Transformación, Carga) del motor analítico.</p>
        </div>
      </div>
      
      <div className="content-container" style={{ paddingTop: "32px", paddingBottom: "64px" }}>
        
        {/* Controles Principales */}
        <div style={{ 
          background: "#ffffff", 
          border: "1px solid #e2e8f0",
          borderRadius: "12px", 
          padding: "32px",
          marginBottom: "32px",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ maxWidth: "600px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", color: "#0f172a" }}>
                <div style={{ background: "#eff6ff", padding: "8px", borderRadius: "8px" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                </div>
                Motor ETL MotoExpres BI
              </h2>
              <p style={{ color: "#475569", fontSize: "14px", lineHeight: "1.6" }}>
                Inicia la extracción de datos desde los archivos fuente, ejecutando de forma automática 14 reglas de calidad, transformaciones de negocio y carga final en SQLite. Este proceso es 100% <strong>idempotente</strong>.
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "16px" }}>
              <button
                onClick={handleReset}
                disabled={loading}
                style={{
                  background: "#ffffff",
                  color: "#dc2626",
                  border: "1px solid #fecaca",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                }}
                onMouseOver={(e) => !loading && (e.currentTarget.style.background = "#fef2f2")}
                onMouseOut={(e) => !loading && (e.currentTarget.style.background = "#ffffff")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                Reiniciar DB
              </button>
              
              <button
                onClick={handleRunETL}
                disabled={loading}
                style={{
                  background: loading ? "#94a3b8" : "#1e3a8a",
                  color: "#ffffff",
                  border: "1px solid transparent",
                  padding: "10px 24px",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                  boxShadow: loading ? "none" : "0 4px 6px -1px rgba(30, 58, 138, 0.2), 0 2px 4px -1px rgba(30, 58, 138, 0.1)"
                }}
                onMouseOver={(e) => !loading && (e.currentTarget.style.background = "#1e40af")}
                onMouseOut={(e) => !loading && (e.currentTarget.style.background = "#1e3a8a")}
              >
                {loading ? (
                  <>
                    <svg viewBox="0 0 50 50" width="16" height="16" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" />
                    </svg>
                    Procesando...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Iniciar Carga
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "16px 20px", borderRadius: "8px", color: "#b91c1c", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <span style={{ fontSize: "14px" }}><strong>Error Crítico:</strong> {error}</span>
          </div>
        )}

        {/* Flujo ETL Visual (Stepper) */}
        {result && result.pipeline && Array.isArray(result.pipeline) && (
          <div style={{ marginBottom: "40px", background: "#ffffff", padding: "32px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
            <h3 style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", margin: "0 0 32px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>Trazabilidad del Proceso</h3>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
              <div style={{ position: "absolute", top: "20px", left: "5%", right: "5%", height: "2px", background: "#e2e8f0", zIndex: 1 }}></div>
              <div style={{ position: "absolute", top: "20px", left: "5%", right: "5%", height: "2px", background: "#1e3a8a", zIndex: 2, animation: "fillWidth 1s ease forwards" }}></div>
              
              {result.pipeline.map((step: any, idx: number) => (
                <div key={idx} style={{ position: "relative", zIndex: 3, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", animation: `fadeInData 0.4s ease ${idx * 0.1}s forwards`, opacity: 0 }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#ffffff", border: "2px solid #1e3a8a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", color: "#1e3a8a", fontWeight: "600", fontSize: "14px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{step.id.substring(3)}</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "2px 0" }}>{step.valor}</div>
                  <div style={{ fontSize: "12px", color: "#64748b", maxWidth: "120px", lineHeight: "1.4", marginTop: "4px" }}>{step.subtitulo}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paneles de Resultados */}
        {result && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "32px" }}>
            
            {/* Panel de Éxito */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "28px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)", animation: "fadeInData 0.5s ease forwards" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "#ecfdf5", padding: "12px", borderRadius: "10px", color: "#059669" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div>
                  <h3 style={{ color: "#0f172a", fontSize: "16px", fontWeight: "600", margin: "0 0 4px 0" }}>Operación Exitosa</h3>
                  <div style={{ fontSize: "13px", color: "#475569" }}>{result.message}</div>
                </div>
              </div>
              <div style={{ background: "#f8fafc", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #f1f5f9" }}>
                <div style={{ fontSize: "12px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px", fontWeight: "600" }}>Filas Disponibles (Bodega)</div>
                <div style={{ fontSize: "36px", fontWeight: "700", color: "#059669", letterSpacing: "-0.5px" }}>
                  {result.registros_procesados.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Panel de Huérfanas */}
            <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "28px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)", animation: "fadeInData 0.6s ease forwards" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "#fffbeb", padding: "12px", borderRadius: "10px", color: "#d97706" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div>
                  <h3 style={{ color: "#0f172a", fontSize: "16px", fontWeight: "600", margin: "0 0 4px 0" }}>Resolución de Huérfanas</h3>
                  <div style={{ fontSize: "13px", color: "#475569", lineHeight: "1.4" }}>{result.manejo_huerfanas.accion}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                {Object.entries(result.manejo_huerfanas.detalles).map(([col, count]) => (
                  <div key={col} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                    <span style={{ color: "#475569", fontSize: "13px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{col}</span>
                    <span style={{ color: "#d97706", fontWeight: "600", fontSize: "14px" }}>{count as number} resueltas</span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}

        {/* Filas que no se cargaron */}
        {result && result.filas_no_cargadas && result.filas_no_cargadas.length > 0 && (
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", animation: "fadeInData 0.7s ease forwards", overflow: "hidden", marginBottom: "32px", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", background: "#fcfcfc" }}>
              <div style={{ background: "#fef2f2", padding: "8px", borderRadius: "8px", color: "#dc2626" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Filas descartadas de la Carga Principal</h2>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Condición / Motivo</th>
                    <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}># Filas Afectadas</th>
                    <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Destino / Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {result.filas_no_cargadas.map((fila: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px 24px", color: "#334155", fontWeight: "500", fontSize: "13px" }}>{fila.motivo}</td>
                      <td style={{ padding: "16px 24px", color: "#dc2626", fontWeight: "600", fontSize: "14px", textAlign: "right" }}>{fila.filas?.toLocaleString()}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{ background: "#f1f5f9", color: "#475569", padding: "4px 8px", borderRadius: "6px", fontSize: "12px", fontWeight: "500" }}>{fila.destino}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Historial Idempotencia */}
        {history && history.length > 0 && (
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", animation: "fadeInData 0.8s ease forwards", overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", background: "#fcfcfc" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Historial de Ejecuciones (Idempotencia)</h2>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Fecha y Hora</th>
                    <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Nuevas Inserciones</th>
                    <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Total Consolidado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any, i: number) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px 24px", color: "#475569", fontSize: "13px" }}>{h.timestamp}</td>
                      <td style={{ padding: "16px 24px", color: h.nuevas > 0 ? "#059669" : "#94a3b8", fontWeight: h.nuevas > 0 ? "600" : "500", fontSize: "13px" }}>
                        {h.nuevas > 0 ? "+" + h.nuevas.toLocaleString() : "0 (Ignoradas)"}
                      </td>
                      <td style={{ padding: "16px 24px", fontWeight: "600", color: "#0f172a", fontSize: "13px" }}>{h.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
