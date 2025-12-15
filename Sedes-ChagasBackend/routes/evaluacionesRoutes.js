// routes/evaluacionesRoutes.js
import express from 'express';
import { EvaluacionesController } from '../controllers/evaluacionesController.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// ================================================
// ✅ CONFIGURACIÓN DE MULTER (manejo de imágenes)
// ================================================

// Crear carpeta uploads si no existe
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Carpeta uploads creada:', uploadsDir);
}

// Configurar almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = `foto_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máx.
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten archivos de imagen'), false);
  }
});

// ================================================
// ✅ RUTAS PRINCIPALES (CRUD con manejo de archivo)
// ================================================

// Crear evaluación
router.post('/', upload.single('foto_entrada'), EvaluacionesController.crearEvaluacion);

// Actualizar evaluación
router.put('/:id', upload.single('foto_entrada'), EvaluacionesController.actualizarEvaluacion);

// Obtener todas las evaluaciones
router.get('/', EvaluacionesController.obtenerEvaluaciones);

// ⚠️ IMPORTANTE: esta ruta DEBE IR ANTES de /:id
router.get('/tecnico/:tecnico_id', EvaluacionesController.obtenerEvaluacionesPorTecnico);

// Obtener evaluación por ID
router.get('/:id', EvaluacionesController.obtenerEvaluacionPorId);

// Eliminar evaluación
router.delete('/:id', EvaluacionesController.eliminarEvaluacion);

// ================================================
// ✅ RUTAS AUXILIARES PARA COMBOBOX
// ================================================

// Técnicos activos
router.get('/options/tecnicos', EvaluacionesController.obtenerTecnicos);

// Municipios
router.get('/options/municipios', EvaluacionesController.obtenerMunicipios);

// Comunidades por municipio
router.get('/options/comunidades/:municipio_id', EvaluacionesController.obtenerComunidades);

// Todas las comunidades
router.get('/options/comunidades', EvaluacionesController.obtenerTodasComunidades);

// Sedes, Redes y Establecimientos
router.get('/options/sedes', EvaluacionesController.obtenerSedes);
router.get('/options/redes-salud', EvaluacionesController.obtenerRedesSalud);
router.get('/options/establecimientos', EvaluacionesController.obtenerEstablecimientos);

// Jefes de grupo (para combobox múltiple)
router.get('/options/jefes-grupo', EvaluacionesController.obtenerJefesGrupo);

export default router;
