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
    <>
      <div className="top-bar" style={{ background: "transparent", borderBottom: "none", padding: "40px 40px 0" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "28px", background: "linear-gradient(to right, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Ingesta y Procesamiento
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "15px" }}>Control total sobre el proceso ETL (Extracción, Transformación, Carga) del motor analítico.</p>
        </div>
      </div>
      
      <div className="content-container" style={{ paddingTop: "24px" }}>
        
        {/* Controles Principales */}
        <div style={{ 
          background: "linear-gradient(145deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.4) 100%)", 
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "24px", 
          padding: "32px",
          marginBottom: "40px",
          boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "24px" }}>
            <div style={{ maxWidth: "600px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "10px", color: "#e2e8f0" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                Motor ETL MotoExpres BI
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", lineHeight: "1.6" }}>
                Inicia la extracción de datos desde los archivos fuente, ejecutando de forma automática 14 reglas de calidad, transformaciones de negocio y carga final en SQLite. Este proceso es 100% <strong>idempotente</strong>.
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "16px" }}>
              <button
                onClick={handleReset}
                disabled={loading}
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseOver={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)"}
                onMouseOut={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                Reiniciar DB
              </button>
              
              <button
                onClick={handleRunETL}
                disabled={loading}
                style={{
                  background: loading ? "var(--text-muted)" : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 28px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.3s ease",
                  boxShadow: loading ? "none" : "0 10px 20px -10px rgba(59, 130, 246, 0.5)"
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    Iniciar Carga
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "16px 24px", borderRadius: "12px", color: "#ef4444", marginBottom: "30px", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <strong>Error Crítico:</strong> {error}
          </div>
        )}

        {/* Flujo ETL Visual (Stepper) */}
        {result && result.pipeline && Array.isArray(result.pipeline) && (
          <div style={{ marginBottom: "40px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "20px", textTransform: "uppercase", letterSpacing: "1px" }}>Trazabilidad del Proceso</h3>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative" }}>
              {/* Línea conectora */}
              <div style={{ position: "absolute", top: "24px", left: "5%", right: "5%", height: "2px", background: "rgba(255,255,255,0.05)", zIndex: 1 }}></div>
              <div style={{ position: "absolute", top: "24px", left: "5%", right: "5%", height: "2px", background: "linear-gradient(90deg, #3b82f6, #10b981)", zIndex: 2, animation: "fillWidth 1s ease forwards" }}></div>
              
              <style>{`
                @keyframes fillWidth { from { width: 0; } to { width: 100%; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              `}</style>
              
              {result.pipeline.map((step: any, idx: number) => (
                <div key={idx} style={{ position: "relative", zIndex: 3, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", animation: `slideUp 0.5s ease ${idx * 0.15}s forwards`, opacity: 0 }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg-card)", border: "2px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)", color: "#10b981", fontWeight: "700" }}>
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "4px" }}>{step.id.substring(3)}</div>
                  <div style={{ fontSize: "18px", fontWeight: "800", color: "#f8fafc", margin: "4px 0", textShadow: "0 2px 10px rgba(255,255,255,0.1)" }}>{step.valor}</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", maxWidth: "120px", lineHeight: "1.4" }}>{step.subtitulo}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paneles de Resultados */}
        {result && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "40px" }}>
            
            {/* Panel de Éxito */}
            <div style={{ background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "20px", padding: "28px", animation: "slideUp 0.6s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.2)", padding: "10px", borderRadius: "12px", color: "#10b981" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <div>
                  <h3 style={{ color: "#10b981", fontSize: "16px", fontWeight: "600" }}>Operación Exitosa</h3>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{result.message}</div>
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.03)" }}>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Filas Disponibles (Bodega)</div>
                <div style={{ fontSize: "42px", fontWeight: "800", background: "linear-gradient(to right, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {result.registros_procesados.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Panel de Huérfanas */}
            <div style={{ background: "rgba(30, 41, 59, 0.3)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: "20px", padding: "28px", animation: "slideUp 0.7s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "rgba(245, 158, 11, 0.1)", padding: "10px", borderRadius: "12px", color: "#f59e0b" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div>
                  <h3 style={{ color: "#f8fafc", fontSize: "16px", fontWeight: "600" }}>Resolución de Huérfanas</h3>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: "1.3" }}>{result.manejo_huerfanas.accion}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                {Object.entries(result.manejo_huerfanas.detalles).map(([col, count]) => (
                  <div key={col} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)", padding: "12px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.02)" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "14px", fontFamily: "monospace" }}>{col}</span>
                    <span style={{ color: "#f59e0b", fontWeight: "600", fontSize: "15px" }}>{count as number} resueltas</span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}

        {/* Filas que no se cargaron */}
        {result && result.filas_no_cargadas && result.filas_no_cargadas.length > 0 && (
          <div style={{ background: "rgba(30, 41, 59, 0.3)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.05)", animation: "slideUp 0.8s ease", overflow: "hidden", marginBottom: "40px" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.2)" }}>
              <div style={{ background: "rgba(239, 68, 68, 0.1)", padding: "8px", borderRadius: "10px", color: "#ef4444" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>
              <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#f8fafc" }}>Filas descartadas de la Carga Principal</h2>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                    <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Condición / Motivo</th>
                    <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}># Filas Afectadas</th>
                    <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Destino / Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {result.filas_no_cargadas.map((fila: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "18px 28px", color: "var(--text-primary)", fontWeight: "500", fontSize: "14px" }}>{fila.motivo}</td>
                      <td style={{ padding: "18px 28px", color: "#ef4444", fontWeight: "700", fontSize: "15px", textAlign: "right" }}>{fila.filas?.toLocaleString()}</td>
                      <td style={{ padding: "18px 28px", color: "var(--text-secondary)", fontSize: "14px" }}>
                        <span style={{ background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px" }}>{fila.destino}</span>
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
          <div style={{ background: "rgba(30, 41, 59, 0.2)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.05)", animation: "slideUp 0.9s ease", overflow: "hidden" }}>
            <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "12px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <h2 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-secondary)" }}>Historial de Ejecuciones (Idempotencia)</h2>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(0,0,0,0.1)" }}>
                    <th style={{ padding: "12px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Fecha y Hora</th>
                    <th style={{ padding: "12px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Nuevas Inserciones</th>
                    <th style={{ padding: "12px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Total Consolidado</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h: any, i: number) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                      <td style={{ padding: "16px 28px", color: "var(--text-secondary)", fontSize: "14px" }}>{h.timestamp}</td>
                      <td style={{ padding: "16px 28px", color: h.nuevas > 0 ? "#10b981" : "var(--text-muted)", fontWeight: h.nuevas > 0 ? "700" : "500", fontSize: "14px" }}>
                        {h.nuevas > 0 ? "+" + h.nuevas.toLocaleString() : "0 (Ignoradas)"}
                      </td>
                      <td style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-primary)", fontSize: "14px" }}>{h.total.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
      </div>
    </>
  );
}
