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

  // Helpers visuales (no utilizados directamente en el nuevo diseño, pero mantenemos la estructura)
  const getBadgeStyle = (badge: string) => {
    switch(badge) {
      case "green": return { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" };
      case "yellow": return { bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
      case "blue": return { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
      default: return { bg: "#f1f5f9", color: "#475569", border: "#e2e8f0" };
    }
  };

  return (
    <div style={{ background: "#f8fafc", minHeight: "100%", color: "#0f172a", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeInData { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fillWidth { from { width: 0; opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div className="top-bar" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: "80px", display: "flex", alignItems: "center" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", letterSpacing: "-0.5px", margin: 0 }}>
            Observatorio de Calidad
          </h1>
          <p style={{ color: "#64748b", marginTop: "4px", fontSize: "14px", margin: "4px 0 0 0" }}>
            Métricas de salud, diagnóstico de incidencias y trazabilidad de las reglas de limpieza.
          </p>
        </div>
      </div>
      
      <div className="content-container" style={{ padding: "40px 40px 64px 40px" }}>
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "400px", color: "#64748b", gap: "16px" }}>
            <svg className="spinner" viewBox="0 0 50 50" width="32" height="32" style={{ animation: "spin 1s linear infinite", color: "#1e3a8a" }}>
              <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" />
            </svg>
            <div style={{ fontSize: "14px", fontWeight: "600", letterSpacing: "1px" }}>ANALIZANDO CALIDAD...</div>
          </div>
        ) : (
          <>
            {/* 4 Tarjetas de Resumen Top */}
            {data?.resumen && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
                
                {/* Tarjeta 1 - Reglas */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)", animation: "fadeInData 0.4s ease forwards", opacity: 0 }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Reglas Activas</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", lineHeight: "1" }}>{data.resumen.reglas_revisadas}</div>
                  </div>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  </div>
                </div>

                {/* Tarjeta 2 - Filas Problema */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)", animation: "fadeInData 0.5s ease forwards", opacity: 0 }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Filas Problema</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", lineHeight: "1" }}>{data.resumen.filas_problema.toLocaleString()}</div>
                  </div>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                  </div>
                </div>

                {/* Tarjeta 3 - Vacíos */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)", animation: "fadeInData 0.6s ease forwards", opacity: 0 }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Vacíos Legítimos</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", lineHeight: "1" }}>{data.resumen.vacios_legitimos.toLocaleString()}</div>
                  </div>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </div>
                </div>

                {/* Tarjeta 4 - Cuarentena */}
                <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.04)", animation: "fadeInData 0.7s ease forwards", opacity: 0 }}>
                  <div>
                    <div style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>En Cuarentena</div>
                    <div style={{ fontSize: "28px", fontWeight: "700", color: "#0f172a", lineHeight: "1" }}>{data.resumen.en_cuarentena.toLocaleString()}</div>
                  </div>
                  <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "#fffbeb", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                  </div>
                </div>

              </div>
            )}

            {/* Tabla Principal de Diagnóstico */}
            <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", animation: "fadeInData 0.8s ease forwards", opacity: 0, overflow: "hidden", marginBottom: "32px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
              
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff" }}>
                <div>
                  <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Reporte Integral de Diagnóstico</h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>Detalle de las anomalías detectadas y sus reglas</p>
                </div>
                <div>
                  <button style={{ background: "#ffffff", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600", color: "#334155", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Exportar
                  </button>
                </div>
              </div>
              
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc" }}>
                      <th style={{ padding: "14px 24px", fontWeight: "600", color: "#475569", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Dimensión</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600", color: "#475569", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Tabla Afectada</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Regla Violada</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>Impacto (Filas)</th>
                      <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right", borderBottom: "1px solid #e2e8f0" }}>Decisión ETL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.diagnostico.map((row) => {
                      const style = getBadgeStyle(row.badge);
                      return (
                        <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "16px 24px", color: "#1e293b", fontWeight: "600", fontSize: "13px" }}>{row.dimension}</td>
                          <td style={{ padding: "16px 24px", color: "#475569", fontSize: "13px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{row.tabla}</td>
                          <td style={{ padding: "16px 24px", color: "#334155", fontSize: "13px", fontWeight: "500" }}>{row.regla}</td>
                          <td style={{ padding: "16px 24px", color: "#0f172a", fontWeight: "600", fontSize: "14px", textAlign: "right", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>{row.filas}</td>
                          <td style={{ padding: "16px 24px", textAlign: "right" }}>
                            <span style={{ 
                              background: style.bg, 
                              color: style.color, 
                              border: `1px solid ${style.border}`, 
                              padding: "4px 10px", 
                              borderRadius: "6px", 
                              fontSize: "12px", 
                              fontWeight: "500"
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
              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", animation: "fadeInData 0.9s ease forwards", opacity: 0, overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                  <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Distribución de Reglas por Dimensión</h2>
                </div>
                
                <div style={{ padding: "32px 24px" }}>
                  <div style={{ display: "grid", gap: "16px" }}>
                    {chartData.map((d, i) => (
                      <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "95px", fontSize: "13px", fontWeight: "500", color: "#475569" }}>
                          {d.name}
                        </div>
                        <div style={{ flex: 1, height: "12px", background: "#f1f5f9", borderRadius: "6px", position: "relative" }}>
                          <div style={{
                            width: `${(d.count / maxRules) * 100}%`,
                            height: "100%",
                            background: "#1e3a8a",
                            borderRadius: "6px",
                            animation: `fillWidth 1s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
                            animationDelay: `${i * 0.1}s`,
                            transformOrigin: "left",
                            opacity: 0
                          }}></div>
                        </div>
                        <div style={{ minWidth: "28px", textAlign: "right", fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                          {d.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mapeo de Estados */}
              <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", animation: "fadeInData 1s ease forwards", opacity: 0, overflow: "hidden", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: "12px", background: "#f8fafc" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                  <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Normalización de Estados (Variantes)</h2>
                </div>
                
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#ffffff" }}>
                        <th style={{ width: "65%", padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Anomalías Capturadas</th>
                        <th style={{ width: "35%", padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Estado Estandarizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estadoMapping.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {Array.isArray(row?.antes) ? row.antes.map((variante, i) => (
                                <span key={i} style={{ background: "#f8fafc", color: "#64748b", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                                  "{String(variante)}"
                                </span>
                              )) : (
                                <span style={{ background: "#f8fafc", color: "#64748b", padding: "4px 8px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}>
                                  "{String(row?.antes || "N/A")}"
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "16px 24px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#ecfdf5", color: "#059669", padding: "4px 10px", borderRadius: "6px", border: "1px solid #a7f3d0", fontSize: "12px", fontWeight: "500" }}>
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
    </div>
  );
}
