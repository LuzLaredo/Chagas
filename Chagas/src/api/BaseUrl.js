// src/api/BaseUrl.js

// ✅ Exporta la URL base para todas las peticiones fetch
// Si existe la variable de entorno VITE_API_BASE_URL, la usa.
// Si no, por defecto usa el backend local.
export const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/*
📘 Ejemplo de uso:

import { baseUrl } from "../api/BaseUrl";

const response = await fetch(`${baseUrl}/usuarios/register`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nombre: "Juan", correo: "juan@test.com" }),
});
*/
