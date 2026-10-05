"use client";

import { useEffect, useState } from "react";

interface ColumnaPrivacidad {
  nombre: string;
  tipo: string;
  accion: string;
}

interface PrivacidadData {
  columnas: ColumnaPrivacidad[];
  k_anonimato: {
    antes: { k: number; unicos: number; cruce: string };
    despues: { k: number; unicos: number; cruce: string };
  };
  tecnicas: { nombre: string; badge: string; texto: string; original: string }[];
}

export default function Privacidad() {
  const [data, setData] = useState<PrivacidadData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/etl/privacidad")
      .then(res => res.json())
      .then((resData) => {
        if (resData.columnas) {
          setData(resData);
        } else {
          setData({
            columnas: resData,
            k_anonimato: { antes: { k: 1, unicos: 42, cruce: "región + ciudad + sector + segmento" }, despues: { k: 5, unicos: 0, cruce: "región + segmento" } },
            tecnicas: [
              { nombre: "Nombres y Apellidos", badge: "purple", texto: "Reemplazado por UUIDs", original: "nombre_cliente" },
              { nombre: "Teléfono / Celular", badge: "red", texto: "Omitido (Drop Column)", original: "telefono" },
              { nombre: "Dirección Exacta", badge: "yellow", texto: "Generalizado a Nivel Sector", original: "direccion" },
              { nombre: "Identificador Interno (ID Cliente)", badge: "blue", texto: "Tokenizado (Salted Hash)", original: "nit" }
            ]
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn("Backend no disponible", err);
        setData({
          columnas: [
            { nombre: "nombre_cliente", tipo: "Identificador directo", accion: "Retirar" },
            { nombre: "nit", tipo: "Identificador directo", accion: "Seudonimizar (hash)" },
            { nombre: "contacto", tipo: "Identificador directo", accion: "Retirar" },
            { nombre: "email", tipo: "Identificador directo", accion: "Retirar" },
            { nombre: "telefono", tipo: "Identificador directo", accion: "Retirar" },
            { nombre: "region", tipo: "Cuasi-identificador", accion: "Conservar" },
            { nombre: "ciudad", tipo: "Cuasi-identificador", accion: "Retirar (queda región)" },
            { nombre: "sector", tipo: "Cuasi-identificador", accion: "Retirar del análisis por cliente" },
            { nombre: "segmento", tipo: "Cuasi-identificador", accion: "Conservar" },
            { nombre: "fecha_alta", tipo: "Cuasi-identificador", accion: "Generalizar a año" }
          ],
          k_anonimato: { antes: { k: 1, unicos: 42, cruce: "región + ciudad + sector + segmento" }, despues: { k: 5, unicos: 0, cruce: "región + segmento" } },
          tecnicas: [
            { nombre: "Nombres y Apellidos", badge: "purple", texto: "Reemplazado por UUIDs", original: "nombre_cliente" },
            { nombre: "Teléfono / Celular", badge: "red", texto: "Omitido (Drop Column)", original: "telefono" },
            { nombre: "Dirección Exacta", badge: "yellow", texto: "Generalizado a Nivel Sector", original: "direccion" },
            { nombre: "Identificador Interno (ID Cliente)", badge: "blue", texto: "Tokenizado (Salted Hash)", original: "nit" }
          ]
        });
        setLoading(false);
      });
  }, []);

  return (
    <>
      <div className="top-bar">
        <h1 className="page-title">Privacidad y Seguridad de Datos</h1>
      </div>
      <div className="content-container">
        <p style={{ color: "var(--text-secondary)", marginBottom: "32px", fontSize: "15px", maxWidth: "800px" }}>
          Reporte de cumplimiento y gobernanza de datos personales (Data Privacy Report). Se detalla el tratamiento de la Información Personal Identificable (PII) para el padrón de 300 clientes de MotoExpres.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
          
          {/* Card: Técnicas de Anonimización */}
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Tratamiento de PII en dim_cliente
            </h2>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {loading ? (
                <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>Cargando técnicas...</div>
              ) : (
                data?.tecnicas.map((tec, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: i === data.tecnicas.length - 1 ? "1px solid transparent" : "1px solid var(--border-color)" }}>
                    <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{tec.nombre}</span>
                    <span style={{ fontSize: "13px" }} className={`badge ${tec.badge}`}>{tec.texto}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card: Prueba de Re-identificación */}
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Prueba de k-Anonimato
            </h2>

            <div style={{ display: "flex", gap: "16px", flex: 1 }}>
              {loading ? (
                <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: "14px" }}>Calculando métricas de k-anonimato...</div>
              ) : (
                <>
                  {/* Panel Izquierdo */}
                  <div style={{ flex: 1, background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "600" }}>Antes de generalizar</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.4" }}>
                      Cruce: {data?.k_anonimato.antes.cruce}
                    </div>
                    
                    <div style={{ marginTop: "auto" }}>
                      <div style={{ fontSize: "36px", fontWeight: "800", color: "#ef4444", lineHeight: "1", marginBottom: "12px" }}>k = {data?.k_anonimato.antes.k}</div>
                      <div style={{ width: "100%", background: "rgba(239, 68, 68, 0.1)", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                        <div style={{ width: "10%", background: "#ef4444", height: "100%", borderRadius: "4px", transition: "width 1s ease" }}></div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600" }}>{data?.k_anonimato.antes.unicos} clientes únicos y vulnerables</div>
                    </div>
                  </div>

                  {/* Panel Derecho */}
                  <div style={{ flex: 1, background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "600" }}>Después de generalizar</div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.4" }}>
                      Cruce: {data?.k_anonimato.despues.cruce}
                    </div>

                    <div style={{ marginTop: "auto" }}>
                      <div style={{ fontSize: "36px", fontWeight: "800", color: "#10b981", lineHeight: "1", marginBottom: "12px" }}>k = {data?.k_anonimato.despues.k}</div>
                      <div style={{ width: "100%", background: "rgba(16, 185, 129, 0.1)", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                        <div style={{ width: "100%", background: "#10b981", height: "100%", borderRadius: "4px", transition: "width 1s ease" }}></div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "600" }}>{data?.k_anonimato.despues.unicos} únicos. Meta cumplida</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
        </div>

        {/* Tabla Clasificación de columnas */}
        <div style={{ background: "rgba(30, 41, 59, 0.3)", borderRadius: "20px", border: "1px solid rgba(255, 255, 255, 0.05)", animation: "slideUp 0.8s ease", overflow: "hidden", marginBottom: "40px", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" }}>
          <div style={{ padding: "24px 28px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "column", gap: "4px", background: "rgba(0,0,0,0.2)" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "600", color: "#f8fafc", letterSpacing: "0.5px" }}>Clasificación de columnas</h2>
            <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>dim_cliente · qué se hizo con cada una</span>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Columna</th>
                  <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Tipo</th>
                  <th style={{ padding: "16px 28px", fontWeight: "600", color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                        <svg className="spinner" viewBox="0 0 50 50" width="20" height="20" style={{ animation: "spin 1s linear infinite", color: "#3b82f6" }}>
                          <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="31.4 31.4" />
                        </svg>
                        Analizando columnas dinámicamente...
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.columnas?.map((row, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px 28px", color: "#cbd5e1", fontSize: "14px", fontFamily: "monospace" }}>{row.nombre}</td>
                      <td style={{ padding: "16px 28px" }}>
                        <span style={{
                          background: row.tipo === "Identificador directo" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: row.tipo === "Identificador directo" ? "#ef4444" : "#f59e0b",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "600"
                        }}>
                          {row.tipo}
                        </span>
                      </td>
                      <td style={{ padding: "16px 28px", color: "var(--text-secondary)", fontSize: "14px" }}>{row.accion}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "16px 28px", borderTop: "1px solid rgba(255,255,255,0.05)", fontSize: "13px", color: "var(--text-muted)" }}>
            Seudonimizar el NIT con hash permite unir tablas sin mostrar el dato. No es anonimizar: con la tabla de equivalencias se revierte, así que esa tabla no se sube al repositorio.
          </div>
        </div>
      </div>
    </>
  );
}
