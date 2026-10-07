import React from 'react';

const BITACORA_DATA = [
  {
    id: 1,
    fecha: "2026-10-01",
    herramienta: "ChatGPT",
    queSePidio: "Script Python para imputar nulos en 'tiempo_entrega' por zona.",
    queRespondio: "Sugirió llenar nulos usando una distribución normal.",
    comoSeVerifico: "Revisión: usaba random.normal en lugar de promedios.",
    decision: "Rechazado"
  },
  {
    id: 2,
    fecha: "2026-10-02",
    herramienta: "Claude",
    queSePidio: "Anonimizar clientes con SHA-256.",
    queRespondio: "Función en Python con hashlib.",
    comoSeVerifico: "Pruebas unitarias: validó consistencia e irreversibilidad.",
    decision: "Aceptado"
  },
  {
    id: 3,
    fecha: "2026-10-04",
    herramienta: "Copilot",
    queSePidio: "Regex para códigos de área internacionales.",
    queRespondio: "Regex funcional, pero fallaba con espacios.",
    comoSeVerifico: "Validación con dataset real: se ajustó la expresión.",
    decision: "Corregido"
  },
  {
    id: 4,
    fecha: "2026-10-05",
    herramienta: "ChatGPT",
    queSePidio: "Query SQL para facturación mensual por repartidor.",
    queRespondio: "Consulta correcta usando SUM() y GROUP BY.",
    comoSeVerifico: "Cruce exacto de datos con reporte contable manual.",
    decision: "Aceptado"
  }
];

const ToolAvatar = ({ name }: { name: string }) => {
  const styles: any = {
    'ChatGPT': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'Claude': 'bg-amber-100 text-amber-700 border-amber-200',
    'GitHub Copilot': 'bg-slate-100 text-slate-700 border-slate-200'
  };
  const currentStyle = styles[name] || 'bg-indigo-100 text-indigo-700 border-indigo-200';
  
  return (
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shadow-sm border ${currentStyle}`}>
      {name.charAt(0)}
    </div>
  );
};

export default function BitacoraIAPage() {
  const kpis = {
    total: BITACORA_DATA.length,
    aceptadas: BITACORA_DATA.filter(d => d.decision === 'Aceptado').length,
    corregidas: BITACORA_DATA.filter(d => d.decision === 'Corregido').length,
    rechazadas: BITACORA_DATA.filter(d => d.decision === 'Rechazado').length,
  };

  const getBadgeStyle = (decision: string) => {
    switch (decision) {
      case 'Aceptado':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm';
      case 'Rechazado':
        return 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm';
      case 'Corregido':
        return 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 shadow-sm';
    }
  };

  return (
    <>
      {/* ── HEADER ─────────────────────────────────── */}
      <header className="top-bar flex justify-between w-full">
        <div>
          <h1 className="page-title">Bitácora IA</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">MotoExpres BI · Hito 3 – El Producto (E12)</p>
        </div>
      </header>

      {/* ── CUERPO ─────────────────────────────────── */}
      <div className="content-container flex flex-col gap-8">
        
        {/* Banner Superior */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-6 py-5 flex items-center gap-4 text-sm text-amber-900 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-amber-600" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </div>
          <div>
            <span className="font-black text-amber-700 uppercase tracking-wider text-[11px] mb-1 block">Hito 3 · E12</span>
            <p className="leading-relaxed font-medium">La bitácora no se trata de contar qué se le preguntó a la IA, sino de documentar <strong>cómo se verificó</strong> la respuesta obtenida.</p>
          </div>
        </div>

        {/* Tarjetas de KPIs (Grid de 4 columnas) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center transition-all hover:shadow-md" style={{ padding: '16px 20px' }}>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Consultas Registradas</h3>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{kpis.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center transition-all hover:shadow-md" style={{ padding: '16px 20px' }}>
            <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Aceptadas</h3>
            <p className="text-3xl font-black text-emerald-600 tracking-tight">{kpis.aceptadas}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center transition-all hover:shadow-md" style={{ padding: '16px 20px' }}>
            <h3 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Corregidas</h3>
            <p className="text-3xl font-black text-amber-500 tracking-tight">{kpis.corregidas}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center transition-all hover:shadow-md" style={{ padding: '16px 20px' }}>
            <h3 className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1">Rechazadas</h3>
            <p className="text-3xl font-black text-rose-600 tracking-tight">{kpis.rechazadas}</p>
          </div>
        </div>

        {/* Tabla de Bitácora (Reemplazo del Grid) */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50/80">
                  <th style={{ padding: '16px', width: '8%' }} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                  <th style={{ padding: '16px', width: '13%' }} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Herramienta</th>
                  <th style={{ padding: '16px', width: '23%' }} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Qué se pidió</th>
                  <th style={{ padding: '16px', width: '23%' }} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Qué respondió</th>
                  <th style={{ padding: '16px', width: '23%' }} className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cómo se verificó</th>
                  <th style={{ padding: '16px', width: '10%' }} className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Decisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {BITACORA_DATA.map((item) => {
                  // Formatear fecha simple (e.g., "2026-10-01" -> "01-oct")
                  const dateParts = item.fecha.split('-');
                  const mesStr = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][parseInt(dateParts[1], 10) - 1];
                  const fechaFormateada = `${dateParts[2]}-\n${mesStr}`;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td style={{ padding: '20px 16px' }} className="align-top">
                        <span className="text-[11px] font-bold text-slate-500 whitespace-pre-line leading-tight block">
                          {fechaFormateada}
                        </span>
                      </td>
                      <td style={{ padding: '20px 16px' }} className="align-top">
                        <span className="text-sm font-black text-slate-800">
                          {item.herramienta}
                        </span>
                      </td>
                      <td style={{ padding: '20px 16px' }} className="align-top">
                        <p className="text-[13px] text-slate-600 leading-relaxed font-medium">
                          {item.queSePidio}
                        </p>
                      </td>
                      <td style={{ padding: '20px 16px' }} className="align-top">
                        <p className="text-[13px] text-slate-600 leading-relaxed">
                          {item.queRespondio}
                        </p>
                      </td>
                      <td style={{ padding: '20px 16px' }} className="align-top">
                        <p className="text-[13px] text-teal-800 leading-relaxed font-semibold">
                          {item.comoSeVerifico}
                        </p>
                      </td>
                      <td style={{ padding: '20px 16px' }} className="align-top text-center">
                        <span className={`inline-block border px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${getBadgeStyle(item.decision)}`}>
                          {item.decision}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}
