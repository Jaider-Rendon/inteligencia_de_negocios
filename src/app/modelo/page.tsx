"use client";

export default function Modelo() {
  return (
    <>
      <div className="top-bar">
        <h1 className="page-title">Modelo de Datos (Star Schema)</h1>
      </div>
      <div className="content-container">
        
        <div style={{ marginBottom: "24px", padding: "20px", background: "rgba(59, 130, 246, 0.05)", borderLeft: "4px solid var(--accent-primary)", borderRadius: "8px 16px 16px 8px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px", color: "var(--text-primary)" }}>Granularidad del Modelo</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            <strong>1 Fila en la Tabla de Hechos = 1 Orden Individual de Servicio de Entrega.</strong> Esta es la granularidad más atómica posible, permitiendo agregaciones flexibles (Roll-up) hacia cualquier dimensión superior.
          </p>
        </div>

        {/* Diagrama Conceptual Star Schema (CSS-based) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0", gap: "40px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "800px" }}>
            {/* Dimensiones Top */}
            <div className="schema-box dim-box">
              <div className="box-title">dim_cliente</div>
              <ul className="box-list">
                <li>PK: cliente_id</li>
                <li>uuid_cliente</li>
                <li>sector</li>
                <li>tipo_cliente</li>
              </ul>
              <div className="connector top-left">
                <span>1 : N</span>
              </div>
            </div>

            <div className="schema-box dim-box">
              <div className="box-title">dim_servicio</div>
              <ul className="box-list">
                <li>PK: servicio_id</li>
                <li>nombre_servicio</li>
                <li>categoria</li>
              </ul>
              <div className="connector top-right">
                <span>1 : N</span>
              </div>
            </div>
          </div>

          {/* Tabla de Hechos Centro */}
          <div className="schema-box fact-box" style={{ position: "relative" }}>
            <div style={{ position: "absolute", top: "-15px", left: "50%", transform: "translateX(-50%)", background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", color: "white", padding: "4px 12px", borderRadius: "12px", fontSize: "11px", fontWeight: "bold", whiteSpace: "nowrap", boxShadow: "0 2px 10px rgba(59, 130, 246, 0.3)", zIndex: 10 }}>
              Granularidad: 1 Orden Individual
            </div>
            <div className="box-title" style={{ background: "linear-gradient(90deg, #3b82f6, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", borderBottomColor: "var(--border-color)", paddingTop: "18px" }}>fact_ordenes</div>
            <ul className="box-list fact-list">
              <li style={{ color: "var(--accent-primary)" }}>PK: orden_id</li>
              <li>FK: cliente_id</li>
              <li>FK: servicio_id</li>
              <li>FK: centro_id</li>
              <li>FK: fecha_id</li>
              <li style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed var(--border-color)", color: "#a78bfa" }}>peso_kg</li>
              <li style={{ color: "#a78bfa" }}>distancia_km</li>
              <li style={{ color: "#a78bfa" }}>precio</li>
              <li style={{ color: "#a78bfa" }}>costo</li>
              <li style={{ color: "#a78bfa" }}>entrega_a_tiempo</li>
            </ul>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "800px" }}>
            {/* Dimensiones Bottom */}
            <div className="schema-box dim-box">
              <div className="box-title">dim_centro</div>
              <ul className="box-list">
                <li>PK: centro_id</li>
                <li>nombre_centro</li>
                <li>ciudad</li>
              </ul>
              <div className="connector bottom-left">
                <span>1 : N</span>
              </div>
            </div>

            <div className="schema-box dim-box">
              <div className="box-title">dim_tiempo</div>
              <ul className="box-list">
                <li>PK: fecha_id</li>
                <li>fecha</li>
                <li>año</li>
                <li>mes</li>
                <li>dia_semana</li>
              </ul>
              <div className="connector bottom-right">
                <span>1 : N</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .schema-box {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          width: 220px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          position: relative;
          z-index: 2;
        }
        .dim-box {
          border-top: 3px solid #34d399;
        }
        .fact-box {
          width: 260px;
          border: 1px solid rgba(59, 130, 246, 0.4);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.1);
          transform: scale(1.05);
        }
        .box-title {
          padding: 12px 16px;
          font-weight: 700;
          font-size: 15px;
          border-bottom: 1px solid var(--border-color);
          text-align: center;
          color: var(--text-primary);
        }
        .box-list {
          list-style: none;
          padding: 12px 16px;
          margin: 0;
          font-size: 13px;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .box-list li {
          display: flex;
          align-items: center;
        }
        .box-list li::before {
          content: '•';
          color: var(--text-muted);
          margin-right: 8px;
          font-size: 10px;
        }
        .connector {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: var(--accent-primary);
          background: rgba(59, 130, 246, 0.1);
          border: 1px dashed rgba(59, 130, 246, 0.4);
          border-radius: 12px;
          padding: 4px 10px;
          z-index: 1;
        }
        .top-left { bottom: -30px; right: -40px; transform: rotate(35deg); }
        .top-right { bottom: -30px; left: -40px; transform: rotate(-35deg); }
        .bottom-left { top: -30px; right: -40px; transform: rotate(-35deg); }
        .bottom-right { top: -30px; left: -40px; transform: rotate(35deg); }
      `}} />
    </>
  );
}
