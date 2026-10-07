"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import RoleSelector from "@/components/RoleSelector";
const navItems = [
  {
    name: "Carga de datos",
    path: "/carga-de-datos",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
    ),
  },
  {
    name: "Calidad",
    path: "/calidad",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
    ),
  },
  {
    name: "Privacidad",
    path: "/privacidad",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    ),
  },
  {
    name: "Modelo",
    path: "/modelo",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div className="brand-logo">MotoExpres BI</div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>Proyecto integrador - 251G8F</div>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="section-title">Hito 1 - Los Datos</div>
        <ul className="nav-list">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            
            return (
              <li key={item.path} className="nav-item">
                <Link
                  href={item.path}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sidebar-section" style={{ marginTop: '0.5rem' }}>
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>HITO 2 · LO FUNCIONAL</span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'bold' }}>E10</span>
        </div>
        <ul className="nav-list">
          <li className="nav-item">
            <Link
              href="/tablero"
              className={`nav-link ${pathname === '/tablero' ? "hito2-active" : ""}`}
            >
              <span className="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="3" width="7" height="7" rx="1"></rect>
                  <rect x="14" y="14" width="7" height="7" rx="1"></rect>
                  <rect x="3" y="14" width="7" height="7" rx="1"></rect>
                </svg>
              </span>
              Tablero
            </Link>
          </li>
          <li className="nav-item">
            <Link
              href="/explorar"
              className={`nav-link ${pathname === '/explorar' ? "hito2-active" : ""}`}
            >
              <span className="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              Explorar
            </Link>
          </li>
          <li className="nav-item">
            <Link
              href="/alertas"
              className={`nav-link ${pathname === '/alertas' ? "hito2-active" : ""}`}
            >
              <span className="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </span>
              Alertas
            </Link>
          </li>
          <li className="nav-item">
            <Link
              href="/accesos"
              className={`nav-link ${pathname === '/accesos' ? "hito2-active" : ""}`}
            >
              <span className="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </span>
              Accesos
            </Link>
          </li>
        </ul>
      </div>

      <div className="sidebar-section" style={{ marginTop: '0.5rem' }}>
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>HITO 3 · EL PRODUCTO</span>
          <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 'bold' }}>E16</span>
        </div>
        <ul className="nav-list">
          <li className="nav-item">
            <Link
              href="/historia"
              className={`nav-link ${pathname === '/historia' ? "active" : ""}`}
            >
              <span className="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </span>
              Historia
            </Link>
          </li>
          <li className="nav-item">
            <Link
              href="/bitacora"
              className={`nav-link ${pathname === '/bitacora' ? "active" : ""}`}
            >
              <span className="nav-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </span>
              Bitácora IA
            </Link>
          </li>
        </ul>
      </div>

    </aside>
  );
}
