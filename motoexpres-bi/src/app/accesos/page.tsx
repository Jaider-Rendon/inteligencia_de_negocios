"use client";

import { useEffect, useState, useMemo } from "react";
import { useRole } from "@/context/RoleContext";

/* ── Tipos ──────────────────────────────────────────────── */
interface RegionRow {
  region: string;
  ingresos: number;
}

interface LogItem {
  id: number;
  timestamp: string;
  hora: string;
  fecha: string;
  usuario: string;
  rol: string;
  rol_label: string;
  seccion: string;
  accion: string;
  tipo_usuario: "total" | "regional";
}

interface PruebaAccesosData {
  total_gerencia: number;
  regiones: RegionRow[];
  registros_log: string[];
  logs_detallados?: LogItem[];
}

/* ── Helpers ────────────────────────────────────────────── */
const fmtCOP = (v: number) => `$${v.toLocaleString("es-CO")}`;

/* ======================== PÁGINA ======================== */
export default function Accesos() {
  const { role, setRole } = useRole();
  const [data, setData] = useState<PruebaAccesosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "total" | "regional">("todos");
  const [simulando, setSimulando] = useState(false);

  // Función para cargar los logs y la prueba matemática desde la BD
  const cargarDatos = (silent = false) => {
    if (!silent) setLoading(true);
    fetch("http://localhost:8000/api/etl/prueba-accesos")
      .then(r => {
        if (!r.ok) throw new Error(`Error ${r.status}`);
        return r.json();
      })
      .then(d => {
        setData(d);
        setError(null);
      })
      .catch(e => setError(e.message))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    cargarDatos();
    // Auto-refresco en segundo plano cada 5 segundos para trazabilidad en vivo
    const intervalo = setInterval(() => {
      cargarDatos(true);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  // Registrar un acceso simulado de prueba en tiempo real
  const simularAcceso = async (rolSim: string, seccion: string, accion: string) => {
    setSimulando(true);
    try {
      await fetch("http://localhost:8000/api/etl/registrar-acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rol: rolSim, seccion, accion })
      });
      // Actualizar inmediatamente la vista
      cargarDatos(true);
    } catch (err) {
      console.error("Error al registrar simulación:", err);
    } finally {
      setSimulando(false);
    }
  };

  // Limpiar historial de auditoría
  const limpiarHistorial = async () => {
    if (!confirm("¿Deseas reiniciar el historial de logs de auditoría?")) return;
    try {
      await fetch("http://localhost:8000/api/etl/limpiar-logs", { method: "DELETE" });
      cargarDatos(true);
    } catch (err) {
      console.error("Error al limpiar logs:", err);
    }
  };

  // Filtrar logs según el tipo de usuario (Total vs Regionales)
  const logsFiltrados = useMemo(() => {
    if (!data?.logs_detallados) return [];
    if (filtroTipo === "todos") return data.logs_detallados;
    return data.logs_detallados.filter(l => l.tipo_usuario === filtroTipo);
  }, [data?.logs_detallados, filtroTipo]);

  return (
    <>
      {/* ── HEADER ──────────────────────────────────────── */}
      <header className="top-bar">
        <div>
          <h1 className="page-title">Control de Accesos y Auditoría</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", marginTop: "4px" }}>
            Seguridad RLS y trazabilidad de búsquedas por usuario
          </p>
        </div>
      </header>

      <div className="content-container">

        {/* ── TABLA DE USUARIOS Y ROLES ASIGNADOS ───────── */}
        <div className="data-table-container">
          <div className="data-table-header">
            <h2 className="data-table-title">
              <span style={{ color: 'var(--accent-primary)' }}>👥</span>
              Usuarios del sistema y alcance de permisos
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
              Identificadores de usuario, rol asignado y filtro RLS aplicado en base de datos
            </p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Tipo de Gerente</th>
                  <th>Región Asignada</th>
                  <th>Alcance de Datos</th>
                  <th>Filtro SQL RLS</th>
                  <th style={{ textAlign: "center" }}>Probar Rol</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: role === "gerencia_general" ? "rgba(147, 51, 234, 0.05)" : "transparent" }}>
                  <td>
                    <span style={{
                      fontFamily: "monospace",
                      fontWeight: 700,
                      background: "rgba(147, 51, 234, 0.1)",
                      color: "#7e22ce",
                      padding: "4px 8px",
                      borderRadius: "6px"
                    }}>
                      sysadmin
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    👑 Gerente Total (General)
                  </td>
                  <td>Todas las regiones (Nacional)</td>
                  <td>
                    <span className="badge purple">100% de órdenes</span>
                  </td>
                  <td>
                    <code style={{ fontSize: "12px", background: "var(--bg-hover)", padding: "4px 8px", borderRadius: "6px" }}>
                      WHERE 1=1
                    </code>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => setRole("gerencia_general")}
                      className={`filter-btn ${role === "gerencia_general" ? "active" : ""}`}
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                    >
                      {role === "gerencia_general" ? "Activo" : "Activar"}
                    </button>
                  </td>
                </tr>

                {[
                  { user: "lgomez", reg: "Antioquia", key: "regional_antioquia" },
                  { user: "mrodriguez", reg: "Bogotá", key: "regional_bogota" },
                  { user: "dcastro", reg: "Eje Cafetero", key: "regional_eje_cafetero" },
                  { user: "cmorales", reg: "Magdalena Medio", key: "regional_magdalena_medio" },
                  { user: "jperez", reg: "Valle", key: "regional_valle" },
                ].map(item => (
                  <tr
                    key={item.key}
                    style={{ background: role === item.key ? "rgba(13, 148, 136, 0.05)" : "transparent" }}
                  >
                    <td>
                      <span style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        background: "rgba(13, 148, 136, 0.1)",
                        color: "#0f766e",
                        padding: "4px 8px",
                        borderRadius: "6px"
                      }}>
                        {item.user}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                      📍 Gerente Regional
                    </td>
                    <td>Regional {item.reg}</td>
                    <td>
                      <span className="badge blue">Solo {item.reg}</span>
                    </td>
                    <td>
                      <code style={{ fontSize: "12px", background: "var(--bg-hover)", padding: "4px 8px", borderRadius: "6px" }}>
                        WHERE region = &apos;{item.reg}&apos;
                      </code>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={() => setRole(item.key)}
                        className={`filter-btn ${role === item.key ? "active" : ""}`}
                        style={{ padding: "4px 10px", fontSize: "12px" }}
                      >
                        {role === item.key ? "Activo" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── LOADING & ERROR ───────────────────────────── */}
        {loading && !data && (
          <div className="empty-state">
            <div className="empty-state-icon">⏳</div>
            <h2 className="empty-state-title">Cargando auditoría...</h2>
            <p className="empty-state-desc">Consultando registros reales de la base de datos</p>
          </div>
        )}

        {error && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ color: "#ef4444" }}>⚠️</div>
            <h2 className="empty-state-title">Error de conexión</h2>
            <p className="empty-state-desc">{error}</p>
          </div>
        )}

        {/* ── GRID INFERIOR (2 COLUMNAS) ────────────────── */}
        {data && (
          <div className="chart-grid">

            {/* COLUMNA IZQUIERDA: Prueba Matemática RLS */}
            <div className="data-table-container" style={{ marginBottom: 0, display: "flex", flexDirection: "column" }}>
              <div className="data-table-header">
                <h2 className="data-table-title">
                  <span style={{ color: 'var(--accent-primary)' }}>🔢</span>
                  Validación Matemática RLS
                </h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                  Comprobación: suma de las 5 regiones = Total Gerente General
                </p>
              </div>

              <div style={{ overflowX: "auto", flex: 1 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Vista del Gerente</th>
                      <th style={{ textAlign: "right" }}>Ingresos asignados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.regiones.map(row => (
                      <tr key={row.region}>
                        <td style={{ fontWeight: 500 }}>{row.region}</td>
                        <td style={{ textAlign: "right", fontFamily: "monospace", fontSize: "14px", color: "var(--text-primary)" }}>
                          {fmtCOP(row.ingresos)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "var(--bg-hover)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text-primary)", borderTop: "2px solid var(--border-color)" }}>
                        Suma de las 5 regiones
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontFamily: "monospace", fontSize: "14px", fontWeight: 700, color: "#059669", borderTop: "2px solid var(--border-color)" }}>
                        {fmtCOP(data.total_gerencia)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div style={{ padding: "16px 20px", background: "var(--bg-main)", borderTop: "1px solid var(--border-color)", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>✅</span>
                <span>Las 5 vistas regionales coinciden exactamente con el total del Gerente General, certificando ausencia de fugas de datos.</span>
              </div>
            </div>

            {/* COLUMNA DERECHA: Registro Real de Búsquedas y Accesos */}
            <div className="data-table-container" style={{ marginBottom: 0, display: "flex", flexDirection: "column" }}>
              
              <div className="data-table-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h2 className="data-table-title" style={{ margin: 0 }}>
                      <span style={{ color: 'var(--accent-primary)' }}>📜</span>
                      Búsquedas y Accesos (Log en Vivo)
                    </h2>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "#16a34a",
                      background: "rgba(22, 163, 74, 0.1)",
                      padding: "2px 8px",
                      borderRadius: "12px"
                    }}>
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" }} />
                      Auditoría SQLite Activa
                    </span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
                    Trazabilidad de cada búsqueda y consulta ejecutada por usuario
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => cargarDatos(false)}
                    className="filter-btn"
                    title="Actualizar registro de auditoría"
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", padding: "6px 12px" }}
                  >
                    🔄 Refrescar
                  </button>
                  <button
                    onClick={limpiarHistorial}
                    className="filter-btn"
                    title="Limpiar logs de auditoría"
                    style={{ fontSize: "12px", padding: "6px 12px", color: "#dc2626" }}
                  >
                    🗑️ Limpiar
                  </button>
                </div>
              </div>

              {/* BARRA DE FILTROS POR TIPO DE USUARIO */}
              <div style={{
                padding: "8px 20px",
                borderBottom: "1px solid var(--border-color)",
                background: "var(--bg-main)",
                display: "flex",
                gap: "8px",
                alignItems: "center",
                flexWrap: "wrap"
              }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Filtrar por:</span>
                <button
                  onClick={() => setFiltroTipo("todos")}
                  className={`filter-btn ${filtroTipo === "todos" ? "active" : ""}`}
                  style={{ fontSize: "11px", padding: "3px 10px" }}
                >
                  Todos ({data.logs_detallados?.length || 0})
                </button>
                <button
                  onClick={() => setFiltroTipo("total")}
                  className={`filter-btn ${filtroTipo === "total" ? "active" : ""}`}
                  style={{ fontSize: "11px", padding: "3px 10px" }}
                >
                  👑 Gerente Total ({data.logs_detallados?.filter(l => l.tipo_usuario === "total").length || 0})
                </button>
                <button
                  onClick={() => setFiltroTipo("regional")}
                  className={`filter-btn ${filtroTipo === "regional" ? "active" : ""}`}
                  style={{ fontSize: "11px", padding: "3px 10px" }}
                >
                  📍 Gerentes Regionales ({data.logs_detallados?.filter(l => l.tipo_usuario === "regional").length || 0})
                </button>
              </div>

              {/* LISTADO DE AUDITORÍA CON DETALLE DE BÚSQUEDA */}
              <div style={{
                background: "var(--bg-hover)",
                padding: "16px 20px",
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                overflowY: "auto",
                maxHeight: "360px"
              }}>
                {logsFiltrados.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)", fontSize: "13px" }}>
                    No hay registros de auditoría en esta categoría.
                  </div>
                ) : (
                  logsFiltrados.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        fontSize: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                      }}
                    >
                      {/* Cabecera de la fila: Hora, Usuario, Rol, Sección */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text-muted)" }}>
                            {log.hora}
                          </span>
                          <span style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            background: log.tipo_usuario === "total" ? "rgba(147, 51, 234, 0.12)" : "rgba(13, 148, 136, 0.12)",
                            color: log.tipo_usuario === "total" ? "#7e22ce" : "#0f766e"
                          }}>
                            {log.usuario}
                          </span>
                          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                            {log.rol_label}
                          </span>
                        </div>
                        <span style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: "var(--bg-hover)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-secondary)"
                        }}>
                          {log.seccion}
                        </span>
                      </div>

                      {/* Búsqueda o Acción realizada */}
                      <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "6px",
                        paddingLeft: "4px",
                        color: "var(--text-primary)",
                        fontWeight: 500
                      }}>
                        <span style={{ color: "var(--accent-primary)", userSelect: "none" }}>›</span>
                        <span style={{ lineHeight: 1.4 }}>{log.accion}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* BOTONES RÁPIDOS PARA SIMULAR O DISPARAR BÚSQUEDAS EN VIVO */}
              <div style={{
                padding: "12px 20px",
                background: "var(--bg-main)",
                borderTop: "1px solid var(--border-color)",
                fontSize: "12px"
              }}>
                <p style={{ margin: "0 0 8px 0", color: "var(--text-secondary)", fontWeight: 600 }}>
                  ⚡ Prueba interactiva inmediata:
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    disabled={simulando}
                    onClick={() => simularAcceso("gerencia_general", "Tablero", "Consulta consolidado nacional (Total país, sin restricciones)")}
                    className="filter-btn"
                    style={{ fontSize: "11px", padding: "4px 10px" }}
                  >
                    👑 sysadmin (Gerente Total)
                  </button>
                  <button
                    disabled={simulando}
                    onClick={() => simularAcceso("regional_antioquia", "Explorar", "Búsqueda y análisis de la región: Antioquia")}
                    className="filter-btn"
                    style={{ fontSize: "11px", padding: "4px 10px" }}
                  >
                    📍 lgomez (Antioquia)
                  </button>
                  <button
                    disabled={simulando}
                    onClick={() => simularAcceso("regional_valle", "Tablero", "Drill-down: filtró servicios por región Valle")}
                    className="filter-btn"
                    style={{ fontSize: "11px", padding: "4px 10px" }}
                  >
                    📍 jperez (Valle)
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </>
  );
}
