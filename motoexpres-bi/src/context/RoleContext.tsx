"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

// 1. Definir los tipos para el contexto
interface RoleContextType {
  role: string;
  setRole: (role: string) => void;
}

// 2. Crear el contexto con valores por defecto vacíos
const RoleContext = createContext<RoleContextType | undefined>(undefined);

// 3. Crear el Provider que envuelve la aplicación
export function RoleProvider({ children }: { children: ReactNode }) {
  // Estado global para almacenar el rol activo (por defecto Gerencia General)
  const [role, setRole] = useState("gerencia_general");

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

// 4. Hook personalizado para consumir el contexto fácilmente
export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRole debe usarse dentro de un RoleProvider");
  }
  return context;
}
