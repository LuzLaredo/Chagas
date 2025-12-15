// index.js - Backend unificado
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

// 📌 Configuración ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 🧩 Middleware base
app.use(cors());
app.use(express.json());

// ✅ Crear carpeta "uploads" si no existe
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("✅ Carpeta 'uploads' creada:", uploadsDir);
}

// ✅ Servir archivos estáticos
app.use("/uploads", express.static(uploadsDir));

// 📌 Configurar conexión a la base de datos
export const db = await mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "chagasdb",
});

// 📌 Importar rutas
import usuariosRoutes from "./routes/usuariosRoutes.js";
import rr1Routes from "./routes/rr1Routes.js";
import rr2Routes from "./routes/rr2Routes.js";
import rr3Routes from "./routes/rr3Routes.js";
import evaluacionesRoutes from "./routes/evaluacionesRoutes.js"; // ✅ única importación correcta
import ee2Routes from "./routes/ee2Routes.js";
import ee3Routes from "./routes/ee3Routes.js";
import viviendasRoutes from "./routes/viviendasRoutes.js";

import municipiosRoutes from "./routes/municipiosRoutes.js";
import denunciasRoutes from "./routes/denunciasRoutes.js";
import estadisticasRoutes from "./routes/estadisticasRoutes.js";
import catalogosRoutes from "./routes/catalogosRoutes.js";
import mapaEE1Routes from "./routes/mapaEE1Routes.js";
import mapaGeneralRoutes from "./routes/mapaGeneralRoutes.js";
import comunidadesRoutes from "./routes/comunidadesRoutes.js";
import notificacionesRoutes from './routes/notificacionesRoutes.js';
import detallesEE1Routes from "./routes/DetalleEE1Routes.js"; 



// 📌 Ruta raíz
app.get("/", (req, res) => {
  res.json({
    message: "✅ Backend funcionando correctamente",
    endpoints: [
      "/api/usuarios",
      "/api/rr1",
      "/api/rr2",
      "/api/rr3",
      "/api/ee1", // ✅ actualizado
      "/api/ee2",
      "/api/ee3",
      "/api/viviendas",
      
      "/api/municipios",
      "/api/catalogos",
      "/api/estadisticas",
      "/api/denuncias",
      "/api/mapaEE1",
      "/api/mapaGeneral",
      "/api/comunidades",
      "/api/detallesEE1/:id",
    ],
  });
});

// 📌 Registrar rutas
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/rr1", rr1Routes);
app.use("/api/rr2", rr2Routes);
app.use("/api/rr3", rr3Routes);
app.use("/api/ee1", evaluacionesRoutes); 
app.use("/api/ee2", ee2Routes);
app.use("/api/ee3", ee3Routes);
app.use("/api/viviendas", viviendasRoutes);

app.use("/api/municipios", municipiosRoutes);
app.use("/api/denuncias", denunciasRoutes);
app.use("/api/comunidades", comunidadesRoutes);
app.use("/api/estadisticas", estadisticasRoutes);
app.use("/api/catalogos", catalogosRoutes);
app.use("/api/mapaEE1", mapaEE1Routes);
app.use("/api/mapaGeneral", mapaGeneralRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use("/api/detallesEE1", detallesEE1Routes); 


// 📌 Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
