const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Obtener usuario actual
router.get('/user', async (req, res) => {
  try {
    // Asumiendo que tienes middleware de autenticación
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    const user = await authController.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Verificar autenticación
router.get('/verify', async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ authenticated: false });
    }
    
    const user = await authController.getUserById(req.user.id);
    res.json({
      authenticated: true,
      user: user
    });
  } catch (error) {
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;