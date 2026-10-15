"use client";

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Datos de MotoExpres calculados a partir de los hechos limpios
const ESCENAS_BASE = [
  {
    id: 1,
    antetitulo: "Escena 1: Contexto",
    titulo: "El volumen operativo de MotoExpres",
    descripcion: "Entre 2022 y 2025, MotoExpres procesó más de 182.000 órdenes válidas generando más de $8.185 millones de pesos en ingresos. El negocio alcanzó su punto de mayor actividad en 2024 con 47.818 envíos.",
    tipoGrafico: "bar",
    datos: [
      { name: '2022', ordenes: 44543 },
      { name: '2023', ordenes: 45081 },
      { name: '2024', ordenes: 47818 },
      { name: '2025', ordenes: 45048 },
    ]
  },
  {
    id: 2,
    antetitulo: "Escena 2: Problema",
    titulo: "La brecha en la promesa de servicio",
    descripcion: "A pesar del sólido volumen comercial, la tasa de entregas a tiempo se ha mantenido estancada en torno al 50,0%, dejando una brecha crítica de 35 puntos porcentuales frente a la meta corporativa del 85%.",
    tipoGrafico: "line",
    datos: [
      { name: '2022', cumplimiento: 50.1, meta: 85.0 },
      { name: '2023', cumplimiento: 50.3, meta: 85.0 },
      { name: '2024', cumplimiento: 49.8, meta: 85.0 },
      { name: '2025', cumplimiento: 50.0, meta: 85.0 },
    ]
  },
  {
    id: 3,
    antetitulo: "Escena 3: Detalle",
    titulo: "Concentración de demoras por región",
    descripcion: "El análisis geográfico revela que el Eje Cafetero y Bogotá concentran más de 40.000 entregas retrasadas combinadas, representando los dos cuellos de botella prioritarios del país.",
    tipoGrafico: "pie",
    datos: [
      { name: 'Eje Cafetero', value: 22166 },
      { name: 'Bogotá', value: 18730 },
      { name: 'Antioquia', value: 14602 },
      { name: 'Magdalena Medio', value: 11969 },
      { name: 'Valle', value: 10979 },
    ]
  },
  {
    id: 4,
    antetitulo: "Escena 4: Causa",
    titulo: "Servicios con mayor impacto de demoras",
    descripcion: "El servicio Estándar y Express representan el mayor volumen absoluto de demoras operativas. La capacidad de asignación de mensajeros en rutas troncales se satura en horas de alta demanda.",
    tipoGrafico: "bar",
    datos: [
      { name: 'Estándar', a_tiempo: 32805, retrasadas: 33143 },
      { name: 'Express', a_tiempo: 18746, retrasadas: 18748 },
      { name: 'Same Day', a_tiempo: 10295, retrasadas: 10014 },
      { name: 'Carga', a_tiempo: 7992, retrasadas: 7731 },
      { name: 'Refrigerado', a_tiempo: 5553, retrasadas: 5501 },
    ]
  },
  {
    id: 5,
    antetitulo: "Escena 5: Decisión",
    titulo: "Ruta de mejora hacia el SLA del 85%",
    descripcion: "Reorientando la flota en Eje Cafetero y Bogotá, y optimizando las ventanas horarias en servicios Estándar y Express, la proyección técnica permite escalar del 50% al 85% de cumplimiento en un horizonte de 4 meses.",
    tipoGrafico: "line",
    datos: [
      { name: 'Actual', proyectado: 50.0, meta: 85.0 },
      { name: 'Mes 1', proyectado: 58.8, meta: 85.0 },
      { name: 'Mes 2', proyectado: 67.5, meta: 85.0 },
      { name: 'Mes 3', proyectado: 76.3, meta: 85.0 },
      { name: 'Mes 4 (Meta)', proyectado: 85.0, meta: 85.0 },
    ]
  }
];

const COLORS = ['#0d9488', '#14b8a6', '#5eead4', '#ccfbf1', '#99f6e4'];

export default function HistoriaPage() {
  const [escenas, setEscenas] = useState<any[]>(ESCENAS_BASE);
  const [escenaActiva, setEscenaActiva] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/etl/historia")
      .then(res => {
        if (!res.ok) throw new Error("Error en la red");
        return res.json();
      })
      .then(json => {
        if (json.escenas && json.escenas.length > 0) {
          setEscenas(json.escenas);
        }
      })
      .catch(err => {
        console.warn("Backend no disponible, usando respaldo local real", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const escenaActual = escenas.find(e => e.id === escenaActiva) || escenas[0];

  const handleAnterior = () => {
    if (escenaActiva > 1) setEscenaActiva(escenaActiva - 1);
  };

  const handleSiguiente = () => {
    if (escenaActiva < escenas.length) setEscenaActiva(escenaActiva + 1);
  };

  const renderGrafico = () => {
    switch (escenaActual.tipoGrafico) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={escenaActual.datos as any[]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                cursor={{ fill: '#f3f4f6' }}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }} 
              />
              {Object.keys(escenaActual.datos[0]).map((key, index) => {
                if (key !== 'name') {
                  return <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} radius={[4, 4, 0, 0]} />;
                }
                return null;
              })}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={escenaActual.datos as any[]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
              {Object.keys(escenaActual.datos[0]).map((key, index) => {
                if (key !== 'name') {
                  return <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={3} activeDot={{ r: 8 }} />;
                }
                return null;
              })}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={escenaActual.datos as any[]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {escenaActual.datos.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                 contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* ── HEADER ─────────────────────────────────── */}
      <header className="top-bar flex justify-between w-full">
        <div>
          <h1 className="page-title">Historia</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">MotoExpres BI · Data Storytelling y Proyección Operativa</p>
        </div>
      </header>

      {/* ── CUERPO ─────────────────────────────────── */}
      <div className="content-container flex flex-col gap-6">

        {/* Contenedor Principal (Tarjeta Blanca) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200" style={{ padding: '48px' }}>
          
          {/* Navegación Superior */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-100 gap-4">
            
            {/* Círculos numéricos (1 al 5) */}
            <div className="flex gap-3">
              {escenas.map((escena) => (
                <button
                  key={escena.id}
                  onClick={() => setEscenaActiva(escena.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-200 ${
                    escenaActiva === escena.id
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  aria-label={`Ir a la escena ${escena.id}`}
                >
                  {escena.id}
                </button>
              ))}
            </div>

            {/* Botones Anterior y Siguiente */}
            <div className="flex gap-3">
              <button
                onClick={handleAnterior}
                disabled={escenaActiva === 1}
                className={`border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  escenaActiva === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Anterior
              </button>
              <button
                onClick={handleSiguiente}
                disabled={escenaActiva === escenas.length}
                className={`border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  escenaActiva === escenas.length ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Siguiente
              </button>
            </div>
          </div>

          {/* Cuerpo de la Escena (Grid de 2 columnas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center min-h-[350px]">
            
            {/* Columna Izquierda: Texto */}
            <div className="flex flex-col justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 pr-4 min-w-0" key={`text-${escenaActiva}`}>
              <h3 className="text-[11px] font-bold text-teal-600 uppercase tracking-wider mb-3">
                {escenaActual.antetitulo}
              </h3>
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-5 leading-tight">
                {escenaActual.titulo}
              </h2>
              <p className="text-slate-600 text-base lg:text-lg leading-relaxed font-medium">
                {escenaActual.descripcion}
              </p>
            </div>

            {/* Columna Derecha: Gráfico */}
            <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex items-center justify-center animate-in fade-in zoom-in-95 duration-500 w-full h-full min-h-[350px] min-w-0" key={`chart-${escenaActiva}`}>
              {renderGrafico()}
            </div>
            
          </div>
          
        </div>
      </div>
    </>
  );
}
