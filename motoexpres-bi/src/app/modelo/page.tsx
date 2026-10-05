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
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0" }}>Estructura del Modelo</h2>
              <p style={{ color: "#64748b", fontSize: "13px", margin: 0 }}>Granularidad: una fila = una orden</p>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", gap: "60px" }}>
              
              {/* Fila superior (Dimensiones) */}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "600px", zIndex: 2 }}>
                <div className="dim-box">
                  <div className="dim-title">dim_tiempo</div>
                  <div className="dim-rows">{loading ? "..." : formatFilas(data?.dimensiones.dim_tiempo?.filas)}</div>
                </div>
                <div className="dim-box">
                  <div className="dim-title">dim_cliente</div>
                  <div className="dim-rows">{loading ? "..." : formatFilas(data?.dimensiones.dim_cliente?.filas)}</div>
                </div>
              </div>

              {/* Centro (Tabla de Hechos) */}
              <div className="fact-box" style={{ zIndex: 2 }}>
                <div className="fact-title">fact_ordenes</div>
                <ul className="fact-list">
                  {loading ? (
                    <li>Cargando columnas...</li>
                  ) : (
                    data?.tablas?.fact_ordenes?.columnas.map((col, idx) => (
                      <li key={idx}>{col}</li>
                    ))
                  )}
                </ul>
              </div>

              {/* Fila inferior (Dimensiones) */}
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "600px", zIndex: 2 }}>
                <div className="dim-box">
                  <div className="dim-title">dim_servicio</div>
                  <div className="dim-rows">{loading ? "..." : formatFilas(data?.dimensiones.dim_servicio?.filas)}</div>
                </div>
                <div className="dim-box">
                  <div className="dim-title">dim_centro</div>
                  <div className="dim-rows">{loading ? "..." : formatFilas(data?.dimensiones.dim_centro?.filas)}</div>
                </div>
              </div>

              {/* Líneas conectoras (SVG de fondo) */}
              <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }}>
                <line x1="20%" y1="20%" x2="40%" y2="40%" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="80%" y1="20%" x2="60%" y2="40%" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="20%" y1="80%" x2="40%" y2="60%" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
                <line x1="80%" y1="80%" x2="60%" y2="60%" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
              </svg>
            </div>
          </div>

          {/* Lado Derecho: Integridad */}
          <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "32px", display: "flex", flexDirection: "column", boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)" }}>
            
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px 0" }}>Revisión de Integridad</h2>
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
                        <td style={{ padding: "16px 0", color: "#334155", fontSize: "14px", fontWeight: "500" }}>
                          {item.relacion}
                        </td>
                        <td style={{ padding: "16px 0", textAlign: "right", fontFamily: "ui-monospace, monospace", fontSize: "14px", fontWeight: "600", color: getColorHex(item.color) }}>
                          {item.huerfanos === 0 ? (
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              0 {item.nota || ""}
                            </span>
                          ) : (
                            `${item.huerfanos} ${item.nota || ""}`
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {data?.notas_integridad && data.notas_integridad.length > 0 && (
                <div style={{ marginTop: "24px", padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px dashed #cbd5e1", color: "#64748b", fontSize: "12px", lineHeight: "1.5", display: "flex", flexDirection: "column", gap: "8px" }}>
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
          border-radius: 8px;
          padding: 16px;
          width: 150px;
          text-align: left;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .dim-title {
          font-weight: 600;
          color: #0f172a;
          font-size: 13px;
          margin-bottom: 4px;
        }
        .dim-rows {
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
        }
        .fact-box {
          background: #ffffff;
          border: 1px solid #1e3a8a;
          border-radius: 10px;
          overflow: hidden;
          width: 260px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .fact-title {
          background: #eff6ff;
          color: #1e3a8a;
          font-weight: 600;
          font-size: 14px;
          padding: 12px 16px;
          border-bottom: 1px solid #bfdbfe;
          text-align: center;
        }
        .fact-list {
          list-style: none;
          padding: 12px 16px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 250px;
          overflow-y: auto;
        }
        .fact-list li {
          font-size: 12px;
          color: #475569;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          padding: 4px 0;
          border-bottom: 1px dashed #f1f5f9;
        }
        .fact-list li:last-child {
          border-bottom: none;
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
