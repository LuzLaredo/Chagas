// routes/rr1Routes.js
import express from 'express';
import {
  crearRR1,
  obtenerRR1,
  obtenerRR1PorId,
  actualizarRR1,
  desactivarRR1,
  obtenerRR1ParaEdicion,
  obtenerDenunciasPorRR1,
  actualizarFechasRR1,
  buscarRR1PorJefeFamilia,
  obtenerRR1PorMunicipiosUsuario // Asegúrate de importar esta función
} from '../controllers/rr1Controller.js';
import { verificarToken } from '../middlewares/authMiddleware.js'; // Importar middleware

const router = express.Router();

// Aplicar verificación de token a TODAS las rutas de RR1
router.use(verificarToken);

// Rutas existentes
router.post('/', crearRR1);
router.get('/', obtenerRR1);
router.get('/:id', obtenerRR1PorId);
router.put('/:id', actualizarRR1);
router.delete('/:id', desactivarRR1);
router.get('/editar/:id', obtenerRR1ParaEdicion);
router.get('/denuncias/:id', obtenerDenunciasPorRR1);
router.put('/fecha/:id', actualizarFechasRR1);

// NUEVA RUTA: Búsqueda por jefe de familia
router.get('/buscar/jefe-familia/:jefeFamilia', buscarRR1PorJefeFamilia);

// NUEVA RUTA: Obtener RR1 por municipios del usuario
router.get('/mis-municipios', obtenerRR1PorMunicipiosUsuario);

export default router;