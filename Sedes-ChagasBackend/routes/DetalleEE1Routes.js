import express from 'express';
// Importación corregida: Usamos getDetalleEE1, el nombre real de la función exportada.
import { getDetalleEE1 } from '../controllers/DetalleEE1Controller.js'; 

const router = express.Router();

// Define el endpoint. La ruta completa será /api/detallesEE1/:id (asumiendo que se monta así).
// Usamos la función getDetalleEE1.
router.get('/:id', getDetalleEE1);

export default router;