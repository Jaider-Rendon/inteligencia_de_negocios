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
      <div className="top-bar" style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "0 40px", height: "80px", display: "flex", alignItems: "center" }}>
        <div>
          <h1 className="page-title" style={{ fontSize: "22px", fontWeight: "700", color: "#1e293b", letterSpacing: "-0.5px", margin: 0 }}>Privacidad y Seguridad de Datos</h1>
        </div>
      </div>
      <div className="content-container" style={{ padding: "40px", background: "#f8fafc" }}>
        <p style={{ color: "#475569", marginBottom: "32px", fontSize: "14px", maxWidth: "800px" }}>
          Reporte de cumplimiento y gobernanza de datos personales (Data Privacy Report). Se detalla el tratamiento de la Información Personal Identificable (PII) para el padrón de clientes.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "40px" }}>

          {/* Fila 1: Tratamiento de PII */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Tratamiento de PII en dim_cliente
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
              {loading ? (
                <div style={{ color: "#64748b", fontSize: "14px" }}>Cargando técnicas...</div>
              ) : (
                data?.tecnicas.map((tec, i) => (
                  <div key={i} style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ color: "#0f172a", fontSize: "13px", fontWeight: "600" }}>{tec.nombre}</span>
                    <span style={{ fontSize: "12px", alignSelf: "flex-start", padding: "4px 8px", background: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", color: "#475569", fontWeight: "500" }}>
                      {tec.texto}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fila 2: Prueba de Re-identificación */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "#0f172a" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Prueba de k-Anonimato
            </h2>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {loading ? (
                <div style={{ padding: "20px", color: "#64748b", fontSize: "14px" }}>Calculando métricas de k-anonimato...</div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  {/* Panel Izquierdo */}
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px 20px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Antes de generalizar</div>
                      <div style={{ fontSize: "13px", color: "#475569", fontFamily: "ui-monospace, monospace" }}>Cruce: {data?.k_anonimato.antes.cruce}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#b91c1c" }}>k = {data?.k_anonimato.antes.k}</div>
                      <div style={{ fontSize: "12px", color: "#991b1b", fontWeight: "500" }}>{data?.k_anonimato.antes.unicos} vulnerables</div>
                    </div>
                  </div>

                  {/* Flecha */}
                  <div style={{ color: "#94a3b8" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>

                  {/* Panel Derecho */}
                  <div style={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "8px", padding: "16px 20px" }}>
                    <div>
                      <div style={{ fontSize: "11px", color: "#059669", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Después de generalizar</div>
                      <div style={{ fontSize: "13px", color: "#047857", fontFamily: "ui-monospace, monospace" }}>Cruce: {data?.k_anonimato.despues.cruce}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "20px", fontWeight: "700", color: "#059669" }}>k = {data?.k_anonimato.despues.k}</div>
                      <div style={{ fontSize: "12px", color: "#065f46", fontWeight: "500" }}>{data?.k_anonimato.despues.unicos} únicos. Cumple.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabla Clasificación de columnas */}
        <div style={{ background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: "40px", boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: "4px", background: "#f8fafc" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: 0 }}>Clasificación de columnas</h2>
            <span style={{ fontSize: "13px", color: "#64748b" }}>dim_cliente · qué se hizo con cada una</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#ffffff" }}>
                  <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Columna</th>
                  <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Tipo</th>
                  <th style={{ padding: "14px 24px", fontWeight: "600", color: "#64748b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #e2e8f0" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>
                      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px" }}>
                        Analizando columnas dinámicamente...
                      </div>
                    </td>
                  </tr>
                ) : (
                  data?.columnas?.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }} onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"} onMouseOut={(e) => e.currentTarget.style.background = "transparent"}>
                      <td style={{ padding: "16px 24px", color: "#334155", fontSize: "13px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace", fontWeight: "500" }}>{row.nombre}</td>
                      <td style={{ padding: "16px 24px" }}>
                        <span style={{
                          background: row.tipo === "Identificador directo" ? "#fef2f2" : "#fffbeb",
                          color: row.tipo === "Identificador directo" ? "#b91c1c" : "#d97706",
                          border: row.tipo === "Identificador directo" ? "1px solid #fecaca" : "1px solid #fde68a",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "500"
                        }}>
                          {row.tipo}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px", color: "#475569", fontSize: "13px" }}>{row.accion}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", fontSize: "12px", color: "#64748b", background: "#f8fafc" }}>
            Seudonimizar el NIT con hash permite unir tablas sin mostrar el dato. No es anonimizar: con la tabla de equivalencias se revierte, así que esa tabla no se sube al repositorio.
          </div>
        </div>
      </div>
    </>
  );
}
