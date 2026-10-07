"use client";

import React, { useState } from 'react';
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

// Definición de las escenas con sus datos mock
const ESCENAS = [
  {
    id: 1,
    antetitulo: "Escena 1: Contexto",
    titulo: "El crecimiento de MotoExpres",
    descripcion: "Durante los últimos años, MotoExpres ha experimentado un crecimiento constante en el volumen de entregas. Nuestra red se ha expandido para cubrir más zonas, aumentando nuestra presencia en el mercado local.",
    tipoGrafico: "bar",
    datos: [
      { name: '2021', valor: 4000 },
      { name: '2022', valor: 5500 },
      { name: '2023', valor: 7200 },
      { name: '2024', valor: 9500 },
    ]
  },
  {
    id: 2,
    antetitulo: "Escena 2: Problema",
    titulo: "Aumento en los tiempos de entrega",
    descripcion: "Sin embargo, con este crecimiento rápido, hemos detectado que los tiempos de entrega promedio han comenzado a incrementarse, afectando nuestra promesa de servicio rápido y eficiente.",
    tipoGrafico: "line",
    datos: [
      { name: 'Ene', tiempo: 15 },
      { name: 'Feb', tiempo: 16 },
      { name: 'Mar', tiempo: 18 },
      { name: 'Abr', tiempo: 22 },
      { name: 'May', tiempo: 25 },
      { name: 'Jun', tiempo: 30 },
    ]
  },
  {
    id: 3,
    antetitulo: "Escena 3: Detalle",
    titulo: "Desempeño por zonas",
    descripcion: "Al analizar el detalle, observamos que el problema no es uniforme. La Zona Norte y la Zona Centro concentran la mayor parte de los retrasos debido a la congestión de tráfico y la alta demanda.",
    tipoGrafico: "pie",
    datos: [
      { name: 'Norte', value: 45 },
      { name: 'Centro', value: 35 },
      { name: 'Sur', value: 10 },
      { name: 'Este', value: 5 },
      { name: 'Oeste', value: 5 },
    ]
  },
  {
    id: 4,
    antetitulo: "Escena 4: Causa",
    titulo: "Capacidad de flota superada",
    descripcion: "La causa principal de estos retrasos en las zonas críticas es que nuestra flota actual de repartidores ha llegado a su límite de capacidad. El número de pedidos supera la cantidad de motos disponibles en horas pico.",
    tipoGrafico: "bar",
    datos: [
      { name: '08:00', pedidos: 50, capacidad: 60 },
      { name: '12:00', pedidos: 120, capacidad: 80 }, // Supera capacidad
      { name: '15:00', pedidos: 70, capacidad: 75 },
      { name: '19:00', pedidos: 150, capacidad: 90 }, // Supera capacidad
    ]
  },
  {
    id: 5,
    antetitulo: "Escena 5: Decisión",
    titulo: "Plan de acción sugerido",
    descripcion: "Para resolver esto, recomendamos una expansión focalizada de la flota en las zonas Norte y Centro, junto con la implementación de rutas dinámicas para evadir el tráfico en horas pico, equilibrando así la carga.",
    tipoGrafico: "line",
    datos: [
      { name: 'Mes 1', proyectado: 30, objetivo: 25 },
      { name: 'Mes 2', proyectado: 25, objetivo: 20 },
      { name: 'Mes 3', proyectado: 20, objetivo: 18 },
      { name: 'Mes 4', proyectado: 17, objetivo: 15 },
    ]
  }
];

const COLORS = ['#0d9488', '#14b8a6', '#5eead4', '#ccfbf1', '#99f6e4'];

export default function HistoriaPage() {
  const [escenaActiva, setEscenaActiva] = useState(1);
  const escenaActual = ESCENAS.find(e => e.id === escenaActiva) || ESCENAS[0];

  const handleAnterior = () => {
    if (escenaActiva > 1) setEscenaActiva(escenaActiva - 1);
  };

  const handleSiguiente = () => {
    if (escenaActiva < ESCENAS.length) setEscenaActiva(escenaActiva + 1);
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
                {escenaActual.datos.map((entry, index) => (
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
          <p className="text-xs text-slate-400 font-medium mt-0.5">MotoExpres BI · Hito 3 – El Producto (E15-E16)</p>
        </div>
      </header>

      {/* ── CUERPO ─────────────────────────────────── */}
      <div className="content-container flex flex-col gap-6">
        
        {/* Banner Superior */}
        <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 p-4 rounded-lg">
          <p className="font-medium text-sm">
            Hito 3 • E15-E16 Cinco escenas: contexto, problema, detalle, causa y decisión...
          </p>
        </div>

        {/* Contenedor Principal (Tarjeta Blanca) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200" style={{ padding: '48px' }}>
          
          {/* Navegación Superior */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-10 pb-6 border-b border-gray-100 gap-4">
            
            {/* Círculos numéricos (1 al 5) */}
            <div className="flex gap-3">
              {ESCENAS.map((escena) => (
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
                disabled={escenaActiva === ESCENAS.length}
                className={`border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  escenaActiva === ESCENAS.length ? 'opacity-50 cursor-not-allowed' : ''
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
