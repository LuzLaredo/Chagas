// routes/mapaEE1Routes.js
import express from "express";
// Importamos la función de exportación nombrada: getMapaEE1
import { getMapaEE1 } from "../controllers/mapaEE1Controller.js";

const router = express.Router();

// Define el endpoint GET /api/mapaEE1 (ya que en index.js se mapea a /api/mapaEE1)
router.get("/", getMapaEE1);

export default router;
