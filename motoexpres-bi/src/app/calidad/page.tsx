"use client";

import { useEffect, useState } from "react";

interface Diagnostico {
  id: number;
  dimension: string;
  tabla: string;
  regla: string;
  filas: string | number;
  decision: string;
  badge: string;
}

interface Resumen {
  reglas_revisadas: number;
  filas_problema: number;
  vacios_legitimos: number;
  en_cuarentena: number;
}

interface EstadoMapping {
  antes: string[];
  despues: string;
}

interface QualityData {
  resumen: Resumen;
  diagnostico: Diagnostico[];
}

export default function Calidad() {
  const [data, setData] = useState<QualityData | null>(null);
  const [estadoMapping, setEstadoMapping] = useState<EstadoMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const defaultData: QualityData = {
      resumen: {
        reglas_revisadas: 14,
        filas_problema: 6874,
        vacios_legitimos: 25537,
        en_cuarentena: 311
      },
      diagnostico: [
        { id: 1, dimension: "Unicidad", tabla: "fact_ordenes", regla: "fila completa", filas: "340", decision: "Eliminar", badge: "green" },
        { id: 2, dimension: "Validez", tabla: "fact_ordenes", regla: 'precio con "$" y puntos', filas: "509", decision: "Corregir", badge: "green" },
        { id: 3, dimension: "Exactitud", tabla: "fact_ordenes", regla: "precio < 0", filas: "224", decision: "Corregir", badge: "green" },
        { id: 4, dimension: "Exactitud", tabla: "fact_ordenes", regla: "peso_kg = 0", filas: "91", decision: "Marcar", badge: "yellow" },
        { id: 5, dimension: "Exactitud", tabla: "fact_ordenes", regla: "costo > precio", filas: "370", decision: "Marcar", badge: "yellow" },
        { id: 6, dimension: "Consistencia", tabla: "fact_ordenes", regla: "estado · 9 variantes → 4", filas: "4.649", decision: "Corregir", badge: "green" },
        { id: 7, dimension: "Consistencia", tabla: "dim_cliente", regla: "ciudad · 28 variantes → 23", filas: "-", decision: "Corregir", badge: "green" },
        { id: 8, dimension: "Completitud", tabla: "fact_ordenes", regla: "servicio_id vacío", filas: "408", decision: "Marcar", badge: "yellow" },
        { id: 9, dimension: "Completitud", tabla: "fact_ordenes", regla: "distancia_km vacía", filas: "264", decision: "Marcar", badge: "yellow" },
        { id: 10, dimension: "Completitud", tabla: "fact_ordenes", regla: "horas_reales vacía", filas: "25.537", decision: "NO tocar", badge: "blue" },
        { id: 11, dimension: "Integridad", tabla: "fact_ordenes", regla: "cliente_id sin cliente", filas: "156", decision: "Cuarentena", badge: "yellow" },
        { id: 12, dimension: "Integridad", tabla: "fact_ordenes", regla: "centro_id = 99", filas: "70", decision: "Cuarentena", badge: "yellow" },
        { id: 13, dimension: "Oportunidad", tabla: "fact_ordenes", regla: "fecha en 2027 o 1999", filas: "85", decision: "Cuarentena", badge: "yellow" },
        { id: 14, dimension: "Privacidad", tabla: "dim_cliente", regla: "nombre, NIT, contacto, email, teléfono", filas: "300", decision: "Retirar", badge: "green" }
      ]
    };

    Promise.all([
      fetch("http://localhost:8000/api/etl/quality").then(res => {
        if (!res.ok) throw new Error("Error en la red (quality)");
        return res.json();
      }),
      fetch("http://localhost:8000/api/etl/estado-mapping").then(res => {
        if (!res.ok) throw new Error("Error en la red (estado-mapping)");
        return res.json();
      })
    ])
      .then(([qualityJson, mappingJson]) => {
        setData(qualityJson);
        setEstadoMapping(mappingJson);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend no disponible, cargando datos locales de demostración", err);
        setData(defaultData);
        setEstadoMapping([
          { antes: ["Entregado", "ENTREGADO", "  Entregado "], despues: "Entregado" },
          { antes: ["En Transito", "en transito"], despues: "En tránsito" },
          { antes: ["Cancelada", "CANCELADA"], despues: "Cancelada" },
          { antes: ["Devuelta", "DEVUELTA"], despues: "Devuelta" }
        ]);
        setLoading(false);
      });
  }, []);

  const rulesPerDimension = data?.diagnostico.reduce((acc, row) => {
    if (!acc.has(row.dimension)) {
      acc.set(row.dimension, 0);
    }
    acc.set(row.dimension, acc.get(row.dimension)! + 1);
    return acc;
  }, new Map<string, number>()) || new Map();

  const chartData = Array.from(rulesPerDimension.entries()).map(([name, count]) => ({ name, count }));

  const maxRules = chartData.length > 0 ? Math.max(...chartData.map(d => d.count)) : 1;

  // Helpers visuales
  const getBadgeStyle = (badge: string) => {
    switch(badge) {
      case "green": return { bg: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" };
      case "yellow": return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" };
      case "blue": return { bg: "rgba(59, 130, 246, 0.15)", color: "#3b82f6", border: "rgba(59, 130, 246, 0.3)" };
      default: return { bg: "rgba(255, 255, 255, 0.1)", color: "#fff", border: "rgba(255, 255, 255, 0.2)" };
    }
  };

  return (
    <>
      <div className="top-bar" style={{ background: "transparent", borderBottom: "none", padding: "40px 40px 0" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "28px", background: "linear-gradient(to right, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Observatorio de Calidad
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px", fontSize: "15px" }}>
            Métricas de salud, diagnóstico de incidencias y trazabilidad de las reglas de limpieza.
          </p>
        </div>
      </div>
      
      <div className="content-container" style={{ paddingTop: "24px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "var(--text-muted)", gap: "16px" }}>
            <svg className="spinner" viewBox="0 0 50 50" width="32" height="32" style={{ animation: "spin 1s linear infinite", color: "#3b82f6" }}>
              <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" />
            </svg>
            <div style={{ fontSize: "14px", fontWeight: "500", letterSpacing: "1px" }}>ANALIZANDO CALIDAD...</div>
          </div>
        ) : (
          <>
            {/* 4 Tarjetas de Resumen Top */}
            {data?.resumen && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "40px" }}>
                
                {/* Tarjeta 1 */}
                <div style={{ background: "linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.4))", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "24px", position: "relative", overflow: "hidden", animation: "slideUp 0.4s ease" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }}></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ background: "rgba(59, 130, 246, 0.15)", padding: "10px", borderRadius: "10px", color: "#60a5fa" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="14 2 18 6 7 17 3 17 3 13 14 2"></polygon><line x1="3" y1="22" x2="21" y2="22"></line></svg>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>REGLAS ACTIVAS</div>
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: "800", color: "#f8fafc" }}>{data.resumen.reglas_revisadas}</div>
                </div>

                {/* Tarjeta 2 */}
                <div style={{ background: "linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.4))", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "24px", position: "relative", overflow: "hidden", animation: "slideUp 0.5s ease" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #f43f5e, #fb7185)" }}></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ background: "rgba(244, 63, 94, 0.15)", padding: "10px", borderRadius: "10px", color: "#fb7185" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>FILAS PROBLEMA</div>
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: "800", color: "#fb7185" }}>{data.resumen.filas_problema.toLocaleString()}</div>
                </div>

                {/* Tarjeta 3 */}
                <div style={{ background: "linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.4))", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "24px", position: "relative", overflow: "hidden", animation: "slideUp 0.6s ease" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #10b981, #34d399)" }}></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "10px", borderRadius: "10px", color: "#34d399" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>VACÍOS LEGÍTIMOS</div>
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: "800", color: "#34d399" }}>{data.resumen.vacios_legitimos.toLocaleString()}</div>
                </div>

                {/* Tarjeta 4 */}
                <div style={{ background: "linear-gradient(145deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.4))", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "20px", padding: "24px", position: "relative", overflow: "hidden", animation: "slideUp 0.7s ease" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "4px", background: "linear-gradient(90deg, #f59e0b, #fbbf24)" }}></div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                    <div style={{ background: "rgba(245, 158, 11, 0.15)", padding: "10px", borderRadius: "10px", color: "#fbbf24" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "600", letterSpacing: "0.5px", textTransform: "uppercase" }}>EN CUARENTENA</div>
                  </div>
                  <div style={{ fontSize: "36px", fontWeight: "800", color: "#fbbf24" }}>{data.resumen.en_cuarentena.toLocaleString()}</div>
                </div>

              </div>
            )}

            {/* Tabla Principal de Diagnóstico */}
            <div style={{ background: "rgba(30, 41, 59, 0.3)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.05)", animation: "slideUp 0.8s ease", overflow: "hidden", marginBottom: "40px", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}>
              <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.2)" }}>
                <div style={{ background: "rgba(96, 165, 250, 0.15)", padding: "8px", borderRadius: "10px", color: "#60a5fa" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#f8fafc", letterSpacing: "0.5px" }}>Reporte Integral de Diagnóstico</h2>
              </div>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                      <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Dimensión</th>
                      <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Tabla Afectada</th>
                      <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Regla Violada</th>
                      <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", textAlign: "right" }}>Impacto (Filas)</th>
                      <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", textAlign: "right" }}>Decisión ETL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.diagnostico.map((row) => {
                      const style = getBadgeStyle(row.badge);
                      return (
                        <tr key={row.id} style={{ borderTop: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "18px 28px", color: "var(--text-primary)", fontWeight: "600", fontSize: "14px" }}>{row.dimension}</td>
                          <td style={{ padding: "18px 28px", color: "var(--text-secondary)", fontSize: "14px", fontFamily: "monospace" }}>{row.tabla}</td>
                          <td style={{ padding: "18px 28px", color: "#cbd5e1", fontSize: "14px", fontWeight: "500" }}>{row.regla}</td>
                          <td style={{ padding: "18px 28px", color: "#f8fafc", fontWeight: "700", fontSize: "15px", textAlign: "right", fontFamily: "monospace" }}>{row.filas}</td>
                          <td style={{ padding: "18px 28px", textAlign: "right" }}>
                            <span style={{ 
                              background: style.bg, 
                              color: style.color, 
                              border: `1px solid ${style.border}`, 
                              padding: "6px 12px", 
                              borderRadius: "8px", 
                              fontSize: "12px", 
                              fontWeight: "600",
                              letterSpacing: "0.5px"
                            }}>
                              {row.decision}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sub-Layout Inferior */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
              
              {/* Gráfico Analítico */}
              <div style={{ background: "rgba(30, 41, 59, 0.3)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.05)", animation: "slideUp 0.9s ease", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.2)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#f8fafc" }}>Distribución de Reglas por Dimensión</h2>
                </div>
                
                <div style={{ padding: "32px 24px" }}>
                  <div style={{ display: "grid", gap: "16px" }}>
                    {chartData.map((d, i) => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "95px", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
                          {d.name}
                        </div>
                        <div style={{ flex: 1, height: "14px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", position: "relative", border: "1px solid rgba(255,255,255,0.02)" }}>
                          <div style={{
                            width: `${(d.count / maxRules) * 100}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #3b82f6 0%, #a855f7 100%)",
                            borderRadius: "8px",
                            boxShadow: "0 0 12px rgba(168, 85, 247, 0.4)",
                            animation: `fillWidth 1s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                            animationDelay: `${i * 0.1}s`,
                            transformOrigin: "left",
                            opacity: 0
                          }}></div>
                        </div>
                        <div style={{ minWidth: "28px", textAlign: "right", fontSize: "13px", fontWeight: "800", color: "#e2e8f0" }}>
                          {d.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mapeo de Estados */}
              <div style={{ background: "rgba(30, 41, 59, 0.3)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.05)", animation: "slideUp 1s ease", overflow: "hidden" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "12px", background: "rgba(0,0,0,0.2)" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                  <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#f8fafc" }}>Normalización de Estados (Variantes)</h2>
                </div>
                
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                        <th style={{ width: "65%", padding: "16px 24px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Anomalías Capturadas</th>
                        <th style={{ width: "35%", padding: "16px 24px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase" }}>Estado Estandarizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estadoMapping.map((row, idx) => (
                        <tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {Array.isArray(row?.antes) ? row.antes.map((variante, i) => (
                                <span key={i} style={{ background: "rgba(244, 63, 94, 0.1)", color: "#fb7185", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(244, 63, 94, 0.2)", fontSize: "12px", fontFamily: "monospace" }}>
                                  "{String(variante)}"
                                </span>
                              )) : (
                                <span style={{ background: "rgba(244, 63, 94, 0.1)", color: "#fb7185", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(244, 63, 94, 0.2)", fontSize: "12px", fontFamily: "monospace" }}>
                                  "{String(row?.antes || "N/A")}"
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(16, 185, 129, 0.3)", fontSize: "13px", fontWeight: "600", letterSpacing: "0.5px" }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              {row.despues}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fillWidth { from { width: 0; opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
