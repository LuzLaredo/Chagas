import React from "react";

export function ViviendaCard({ vivienda }) {
  return (
    <div className="vivienda-card">
      <h3>{vivienda.nombre}</h3>
      <p>Estado: {vivienda.estado_servicio}</p>
      <p>ID: {vivienda.id}</p>
    </div>
  );
}