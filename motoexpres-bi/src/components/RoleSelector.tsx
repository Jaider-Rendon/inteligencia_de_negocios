"use client";

import React from "react";
import { useRole } from "@/context/RoleContext";

export default function RoleSelector() {
  const { role, setRole } = useRole();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(e.target.value);
  };

  return (
    <div className="flex items-center">
      <select 
        value={role} 
        onChange={handleRoleChange}
        className="appearance-none bg-white text-slate-700 border border-slate-300 rounded-md px-4 py-2 pr-8 text-sm outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-sm"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1em 1em',
        }}
      >
        <option value="gerencia_general">Ver como: Gerencia (todo)</option>
        <option value="regional_antioquia">Gerente regional · Antioquia</option>
        <option value="regional_bogota">Gerente regional · Bogotá</option>
        <option value="regional_eje_cafetero">Gerente regional · Eje Cafetero</option>
        <option value="regional_magdalena_medio">Gerente regional · Magdalena Medio</option>
        <option value="regional_valle">Gerente regional · Valle</option>
      </select>
    </div>
  );
}
