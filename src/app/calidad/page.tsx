"use client";

import { useEffect, useState } from "react";

interface Diagnostico {
  id: number;
  dimension: string;
  conteo_errores: number;
  decision: string;
  badge: string;
}

interface Bitacora {
  id: number;
  que_corrigio: string;
  que_no_corrigio: string;
  por_que: string;
  responsable: string;
}

interface Resumen {
  reglas_revisadas: number;
  filas_problema: number;
  vacios_legitimos: number;
  en_cuarentena: number;
}

interface QualityData {
  resumen: Resumen;
  diagnostico: Diagnostico[];
  bitacora: Bitacora[];
}

export default function Calidad() {
  const [data, setData] = useState<QualityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Para propositos de demostración de UI, si el backend falla, mostramos los datos por defecto
    const defaultData: QualityData = {
      resumen: {
        reglas_revisadas: 5,
        filas_problema: 3303,
        vacios_legitimos: 15420,
        en_cuarentena: 450
      },
      diagnostico: [
        { id: 1, dimension: "Completitud", conteo_errores: 15420, decision: "Ignorados. Nulos legítimos en 'horas_reales' debido a órdenes con estado 'Devuelta' o 'En tránsito'.", badge: "blue" },
        { id: 2, dimension: "Exactitud", conteo_errores: 450, decision: "Fechas de orden fuera de rango (ej. > 2026) truncadas a fecha actual.", badge: "yellow" },
        { id: 3, dimension: "Consistencia", conteo_errores: 2841, decision: "Campos numéricos (precio/costo) con símbolos de moneda detectados y limpiados.", badge: "green" },
        { id: 4, dimension: "Unicidad", conteo_errores: 0, decision: "No se hallaron duplicados en orden_id.", badge: "green" },
        { id: 5, dimension: "Oportunidad", conteo_errores: 12, decision: "Registros muy antiguos (> 5 años) conservados para histórico.", badge: "purple" }
      ],
      bitacora: [
        { id: 1, que_corrigio: "Conversión de tipos en Precio, Costo, Distancia y Peso", que_no_corrigio: "N/A", por_que: "Contenían formatos de texto ($1,000.00) impidiendo operaciones matemáticas.", responsable: "Ing. de Datos (Pipeline)" },
        { id: 2, que_corrigio: "Asignación de llaves huérfanas a ID -1", que_no_corrigio: "Registros de hechos sin dimensión", por_que: "Mantener consistencia de hechos totales sin perder transacciones, dado que el cliente/centro no existía en el Excel.", responsable: "Regla de Integridad" },
        { id: 3, que_corrigio: "N/A", que_no_corrigio: "Registros sin 'horas_reales'", por_que: "Ausencias legítimas. Una orden cancelada, devuelta o en tránsito aún no cuenta con un tiempo real de entrega.", responsable: "Analista de Negocio" },
        { id: 4, que_corrigio: "Fechas futuras en 'fecha_orden'", que_no_corrigio: "Registros históricos antiguos", por_que: "Se ajustaron fechas erróneas de tipeo. Los históricos se mantienen por requerimiento legal.", responsable: "Regla de Negocio" }
      ]
    };

    fetch("http://localhost:8000/api/etl/quality")
      .then(res => {
        if (!res.ok) throw new Error("Error en la red");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend no disponible, cargando datos locales de demostración", err);
        setData(defaultData);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <div className="top-bar">
        <h1 className="page-title">Calidad de Datos</h1>
      </div>
      <div className="content-container">
        <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "15px" }}>
          Panel de control de calidad. Aquí se documentan las métricas clave de salud de los datos y las decisiones analíticas tomadas durante el proceso de limpieza y transformación.
        </p>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Cargando métricas de calidad...</div>
        ) : (
          <>
            {/* Tarjetas de Resumen Analítico */}
            {data?.resumen && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
                <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", borderTop: "4px solid #3b82f6", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.05em" }}>REGLAS REVISADAS</div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--text-primary)" }}>{data.resumen.reglas_revisadas}</div>
                </div>
                <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", borderTop: "4px solid #ef4444", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.05em" }}>FILAS CON PROBLEMA</div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#ef4444" }}>{data.resumen.filas_problema.toLocaleString()}</div>
                </div>
                <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", borderTop: "4px solid #10b981", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.05em" }}>VACÍOS LEGÍTIMOS</div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#10b981" }}>{data.resumen.vacios_legitimos.toLocaleString()}</div>
                </div>
                <div style={{ background: "var(--bg-card)", padding: "20px", borderRadius: "12px", border: "1px solid var(--border-color)", borderTop: "4px solid #eab308", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "700", marginBottom: "8px", letterSpacing: "0.05em" }}>EN CUARENTENA</div>
                  <div style={{ fontSize: "28px", fontWeight: "700", color: "#eab308" }}>{data.resumen.en_cuarentena.toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* Tabla 1: Diagnóstico de Calidad */}
            <div className="data-table-container">
              <div className="data-table-header">
                <h2 className="data-table-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  Diagnóstico de Calidad
                </h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "20%" }}>Dimensión</th>
                      <th style={{ width: "15%", textAlign: "right" }}>Conteo de Errores</th>
                      <th style={{ width: "65%" }}>Decisión Tomada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.diagnostico.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <span className={`badge ${row.badge}`}>{row.dimension}</span>
                        </td>
                        <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: "500", color: row.conteo_errores > 0 ? "#f87171" : "#34d399" }}>
                          {row.conteo_errores.toLocaleString()}
                        </td>
                        <td>{row.decision}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabla 2: Bitácora de Limpieza */}
            <div className="data-table-container">
              <div className="data-table-header">
                <h2 className="data-table-title">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  Bitácora de Limpieza
                </h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "25%" }}>Qué se corrigió</th>
                      <th style={{ width: "20%" }}>Qué NO se corrigió</th>
                      <th style={{ width: "40%" }}>Por qué (Justificación Analítica)</th>
                      <th style={{ width: "15%" }}>Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.bitacora.map((row) => (
                      <tr key={row.id}>
                        <td style={{ fontWeight: "500", color: "var(--text-primary)" }}>{row.que_corrigio}</td>
                        <td style={{ color: "#f87171" }}>{row.que_no_corrigio}</td>
                        <td style={{ fontStyle: "italic", color: "var(--text-secondary)", lineHeight: "1.5" }}>{row.por_que}</td>
                        <td>
                          <span className="badge" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)" }}>
                            {row.responsable}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
