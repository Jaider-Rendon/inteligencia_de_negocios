export default function Home() {
  return (
    <>
      <div className="top-bar">
        <h1 className="page-title">Dashboard Principal</h1>
      </div>
      <div className="content-container">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </div>
          <h2 className="empty-state-title">Bienvenido a MotoExpres BI</h2>
          <p className="empty-state-desc">
            Selecciona una opción del menú lateral para comenzar a explorar los datos, evaluar la calidad, gestionar la privacidad o revisar los modelos.
          </p>
        </div>
      </div>
    </>
  );
}
