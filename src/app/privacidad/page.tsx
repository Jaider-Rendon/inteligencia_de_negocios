"use client";

export default function Privacidad() {
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
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Nombres y Apellidos</span>
                <span style={{ fontSize: "13px" }} className="badge purple">Reemplazado por UUIDs</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Teléfono / Celular</span>
                <span style={{ fontSize: "13px" }} className="badge red">Omitido (Drop Column)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Dirección Exacta</span>
                <span style={{ fontSize: "13px" }} className="badge yellow">Generalizado a Nivel Sector</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid transparent" }}>
                <span style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Identificador Interno (ID Cliente)</span>
                <span style={{ fontSize: "13px" }} className="badge blue">Tokenizado (Salted Hash)</span>
              </div>
            </div>
          </div>

          {/* Card: Prueba de Re-identificación */}
          <div style={{ background: "var(--bg-card)", padding: "24px", borderRadius: "16px", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column" }}>
            <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-primary)" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Prueba de k-Anonimato
            </h2>

            <div style={{ display: "flex", gap: "16px", flex: 1 }}>
              {/* Panel Izquierdo */}
              <div style={{ flex: 1, background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "600" }}>Antes de generalizar</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.4" }}>
                  Cruce: región + ciudad + sector + segmento
                </div>
                
                <div style={{ marginTop: "auto" }}>
                  <div style={{ fontSize: "36px", fontWeight: "800", color: "#ef4444", lineHeight: "1", marginBottom: "12px" }}>k = 1</div>
                  <div style={{ width: "100%", background: "rgba(239, 68, 68, 0.1)", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ width: "10%", background: "#ef4444", height: "100%", borderRadius: "4px", transition: "width 1s ease" }}></div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "600" }}>42 clientes únicos y vulnerables</div>
                </div>
              </div>

              {/* Panel Derecho */}
              <div style={{ flex: 1, background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: "600" }}>Después de generalizar</div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: "1.4" }}>
                  Cruce: región + segmento
                </div>

                <div style={{ marginTop: "auto" }}>
                  <div style={{ fontSize: "36px", fontWeight: "800", color: "#10b981", lineHeight: "1", marginBottom: "12px" }}>k = 5</div>
                  <div style={{ width: "100%", background: "rgba(16, 185, 129, 0.1)", height: "8px", borderRadius: "4px", overflow: "hidden", marginBottom: "12px" }}>
                    <div style={{ width: "100%", background: "#10b981", height: "100%", borderRadius: "4px", transition: "width 1s ease" }}></div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#10b981", fontWeight: "600" }}>0 únicos. Meta cumplida</div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}
