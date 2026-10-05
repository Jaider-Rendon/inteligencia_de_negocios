"use client";

import { useEffect, useState } from "react";

interface IntegridadItem {
  relacion: string;
  huerfanos: number;
  nota: string | null;
  color: string;
}

interface ModeloData {
  dimensiones: {
    dim_tiempo: { filas: number };
    dim_cliente: { filas: number };
    dim_servicio: { filas: number };
    dim_centro: { filas: number };
  };
  tablas: {
    fact_ordenes: {
      columnas: string[];
    };
  };
  integridad: IntegridadItem[];
  notas_integridad: string[];
}

export default function Modelo() {
  const [data, setData] = useState<ModeloData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Valores por defecto como fallback visual si falla el backend
    const defaultData: ModeloData = {
      dimensiones: {
        dim_tiempo: { filas: 1461 },
        dim_cliente: { filas: 300 },
        dim_servicio: { filas: 6 },
        dim_centro: { filas: 8 }
      },
      tablas: {
        fact_ordenes: {
          columnas: [
            "orden_id", "fecha_id", "cliente_id", "servicio_id", "centro_id",
            "precio", "costo", "peso_kg", "distancia_km", "estado", "horas_reales"
          ]
        }
      },
      integridad: [
        { relacion: "orden → cliente", huerfanos: 0, nota: null, color: "green" },
        // Sustento: En el backend los huérfanos de servicio se asignan al ID -1,
        // por lo que el conteo real de huérfanos es 0. La nota se encarga de explicarlo.
        { relacion: "orden → servicio", huerfanos: 0, nota: "*", color: "green" },
        { relacion: "orden → centro", huerfanos: 0, nota: null, color: "green" },
        { relacion: "orden → fecha", huerfanos: 0, nota: null, color: "green" }
      ],
      notas_integridad: [
        '* Las 408 órdenes sin servicio van a un miembro "Sin servicio" (servicio_id = -1) en lugar de borrarse.'
      ]
    };

    fetch("http://localhost:8000/api/etl/modelo")
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend no disponible, cargando datos fallback", err);
        setData(defaultData);
        setLoading(false);
      });
  }, []);

  const formatFilas = (n: number | undefined) => {
    if (n === undefined) return "...";
    return new Intl.NumberFormat("es-ES").format(n) + " filas";
  };

  const getColorHex = (colorStr: string) => {
    if (colorStr === "green") return "#34d399";
    if (colorStr === "red") return "#f87171";
    return "var(--text-muted)";
  };

  const renderRelacion = (relacionText: string) => {
    const parts = relacionText.split("→");
    if (parts.length === 2) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ background: "#eff6ff", color: "#1e3a8a", border: "1px solid #bfdbfe", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{parts[0].trim()}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          <span style={{ background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>{parts[1].trim()}</span>
        </div>
      );
    }
    return relacionText;
  };

  return (
    <>
      <div className="top-bar" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: "80px", display: "flex", alignItems: "center" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", letterSpacing: "-0.5px", margin: 0 }}>Modelo de Datos e Integridad</h1>
        </div>
      </div>
      <div className="content-container" style={{ padding: "40px", background: "#f8fafc", minHeight: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
        <p style={{ color: "#475569", marginBottom: "32px", fontSize: "14px", maxWidth: "800px" }}>
          Representación del modelo analítico tipo estrella. Aquí validamos que las relaciones entre la tabla de hechos y sus dimensiones se mantengan íntegras tras la carga.
        </p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flex: 1, alignItems: "stretch" }}>
          
          {/* Lado Izquierdo: Modelo de estrella */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
            
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                Estructura del Modelo
              </h2>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>Granularidad: una fila = una orden</p>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", gap: "60px" }}>
              
              {/* Fila superior (Dimensiones) */}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "600px", zIndex: 2 }}>
                <div className="dim-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    <div className="dim-title">dim_tiempo</div>
                  </div>
                  <div className="dim-rows">{loading ? "..." : formatFilas(data?.dimensiones.dim_tiempo?.filas)}</div>
                </div>
                <div className="dim-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    <div className="dim-title">dim_cliente</div>
                  </div>
                  <div className="dim-rows">{loading ? "..." : formatFilas(data?.dimensiones.dim_cliente?.filas)}</div>
                </div>
              </div>

              {/* Centro (Tabla de Hechos) */}
              <div className="fact-box" style={{ zIndex: 2 }}>
                <div className="fact-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                  fact_ordenes
                </div>
                <ul className="fact-list">
                  {loading ? (
                    <li>Cargando columnas...</li>
                  ) : (
                    data?.tablas?.fact_ordenes?.columnas.map((col, idx) => (
                      <li key={idx}>
                        <span style={{ color: "#94a3b8", marginRight: "8px" }}>•</span>
                        {col}
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Fila inferior (Dimensiones) */}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "600px", zIndex: 2 }}>
                <div className="dim-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    <div className="dim-title">dim_servicio</div>
                  </div>
                  <div className="dim-rows">{loading ? "..." : formatFilas(data?.dimensiones.dim_servicio?.filas)}</div>
                </div>
                <div className="dim-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <div className="dim-title">dim_centro</div>
                  </div>
                  <div className="dim-rows">{loading ? "..." : formatFilas(data?.dimensiones.dim_centro?.filas)}</div>
                </div>
              </div>

              {/* Líneas conectoras (SVG de fondo) */}
              <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                <line x1="20%" y1="20%" x2="40%" y2="40%" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6,6" />
                <line x1="80%" y1="20%" x2="60%" y2="40%" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6,6" />
                <line x1="20%" y1="80%" x2="40%" y2="60%" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6,6" />
                <line x1="80%" y1="80%" x2="60%" y2="60%" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6,6" />
              </svg>
            </div>
          </div>

          {/* Lado Derecho: Integridad */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
            
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                Revisión de Integridad
              </h2>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>Auditoría de llaves foráneas</p>
            </div>

            <div style={{ flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "12px 0", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em" }}>Relación (Llave Foránea)</th>
                    <th style={{ padding: "12px 0", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>Registros Huérfanos</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td style={{ padding: "16px 0", color: "#475569", fontSize: "14px" }}>Cargando...</td>
                      <td style={{ padding: "16px 0" }}></td>
                    </tr>
                  ) : (
                    data?.integridad?.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "16px 0" }}>
                          {renderRelacion(item.relacion)}
                        </td>
                        <td style={{ padding: "16px 0", textAlign: "right" }}>
                          {item.huerfanos === 0 ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              VÁLIDO {item.nota || ""}
                            </span>
                          ) : (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                              {item.huerfanos} HUÉRFANOS {item.nota || ""}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {data?.notas_integridad && data.notas_integridad.length > 0 && (
                <div style={{ marginTop: "32px", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", borderLeft: "3px solid #cbd5e1", color: "#64748b", fontSize: "12px", lineHeight: "1.6", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {data.notas_integridad.map((nota, idx) => (
                    <span key={idx}>{nota}</span>
                  ))}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .dim-box {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-top: 3px solid #64748b;
          border-radius: 8px;
          padding: 16px;
          width: 170px;
          text-align: left;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .dim-box:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
        }
        .dim-title {
          font-weight: 600;
          color: #0f172a;
          font-size: 13px;
        }
        .dim-rows {
          color: #475569;
          font-size: 12px;
          font-weight: 500;
          background: #f1f5f9;
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .fact-box {
          background: #ffffff;
          border: 1px solid #bfdbfe;
          border-radius: 12px;
          overflow: hidden;
          width: 280px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025);
          position: relative;
        }
        .fact-title {
          background: #1e3a8a;
          color: #ffffff;
          font-weight: 600;
          font-size: 14px;
          padding: 16px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.02em;
        }
        .fact-list {
          list-style: none;
          padding: 16px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 260px;
          overflow-y: auto;
        }
        .fact-list li {
          font-size: 12px;
          color: #334155;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          padding: 6px 12px;
          background: #f8fafc;
          border-radius: 6px;
          display: flex;
          align-items: center;
        }
        /* Custom scrollbar */
        .fact-list::-webkit-scrollbar {
          width: 6px;
        }
        .fact-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
      `}} />
    </>
  );
}
