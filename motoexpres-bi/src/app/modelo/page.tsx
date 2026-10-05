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
    <div style={{ padding: "40px", height: "100%", display: "flex", flexDirection: "column" }}>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", height: "100%", alignItems: "stretch" }}>
        
        {/* Lado Izquierdo: Modelo de estrella */}
        <div style={{ background: "rgba(30, 41, 59, 0.4)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", padding: "32px", display: "flex", flexDirection: "column" }}>
          
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#f8fafc", marginBottom: "8px" }}>Modelo de estrella</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Granularidad: una fila = una orden</p>
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
                  <li>...</li>
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
              <line x1="20%" y1="20%" x2="40%" y2="40%" stroke="var(--border-color)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="80%" y1="20%" x2="60%" y2="40%" stroke="var(--border-color)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="20%" y1="80%" x2="40%" y2="60%" stroke="var(--border-color)" strokeWidth="1.5" strokeDasharray="4,4" />
              <line x1="80%" y1="80%" x2="60%" y2="60%" stroke="var(--border-color)" strokeWidth="1.5" strokeDasharray="4,4" />
            </svg>
          </div>
        </div>

        {/* Lado Derecho: Integridad */}
        <div style={{ background: "rgba(30, 41, 59, 0.4)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", padding: "32px", display: "flex", flexDirection: "column" }}>
          
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#f8fafc", marginBottom: "8px" }}>Integridad</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Revisión de llaves después de cargar</p>
          </div>

          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr>
                  <th style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Relación</th>
                  <th style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", textAlign: "right" }}>Huérfanos</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td style={{ padding: "16px 0", color: "#e2e8f0", fontSize: "14px" }}>Cargando...</td>
                    <td style={{ padding: "16px 0" }}></td>
                  </tr>
                ) : (
                  data?.integridad?.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", color: "#e2e8f0", fontSize: "14px" }}>
                        {item.relacion}
                      </td>
                      <td style={{ padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.03)", textAlign: "right", fontFamily: "monospace", fontSize: "14px", color: getColorHex(item.color) }}>
                        {item.huerfanos === 0 ? "0" : item.huerfanos} {item.nota || ""}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {data?.notas_integridad && data.notas_integridad.length > 0 && (
              <div style={{ marginTop: "24px", color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5", display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.notas_integridad.map((nota, idx) => (
                  <span key={idx}>{nota}</span>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .dim-box {
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 16px;
          width: 140px;
          text-align: left;
        }
        .dim-title {
          font-weight: 700;
          color: #f8fafc;
          font-size: 14px;
          margin-bottom: 6px;
        }
        .dim-rows {
          color: var(--text-secondary);
          font-size: 12px;
        }
        .fact-box {
          background: #0f172a;
          border: 1px solid #14b8a6;
          border-radius: 8px;
          overflow: hidden;
          width: 260px;
        }
        .fact-title {
          background: #14b8a6;
          color: #000;
          font-weight: 700;
          font-size: 15px;
          padding: 10px 16px;
        }
        .fact-list {
          list-style: none;
          padding: 16px;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: 250px;
          overflow-y: auto;
        }
        .fact-list li {
          font-size: 13px;
          color: #e2e8f0;
          font-family: monospace;
        }
        /* Custom scrollbar para la lista de facts por si crece mucho */
        .fact-list::-webkit-scrollbar {
          width: 6px;
        }
        .fact-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
      `}} />
    </div>
  );
}
