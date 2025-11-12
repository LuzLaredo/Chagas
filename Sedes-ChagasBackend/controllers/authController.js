const pool = require('../config/database');

const authController = {
  // Obtener usuario por email
  getUserByEmail: async (email) => {
    try {
      const query = 'SELECT * FROM usuarios WHERE correo_electronico = $1';
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener usuario por email:', error);
      throw error;
    }
  },

  // Obtener usuario por ID
  getUserById: async (id) => {
    try {
      const query = 'SELECT id, nombre_completo, correo_electronico, rol FROM usuarios WHERE id = $1';
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Error al obtener usuario por ID:', error);
      throw error;
    }
  },

  // Verificar credenciales
  verifyCredentials: async (email, password) => {
    try {
      const query = 'SELECT * FROM usuarios WHERE correo_electronico = $1';
      const result = await pool.query(query, [email]);
      
      if (result.rows.length === 0) {
        return { success: false, message: 'Usuario no encontrado' };
      }
      
      const user = result.rows[0];
      
      // Para contraseñas en texto plano (temporal - NO RECOMENDADO para producción)
      if (user.contrasena === password) {
        const { contrasena, ...userWithoutPassword } = user;
        return { success: true, user: userWithoutPassword };
      }
      
      // Para contraseñas hasheadas con bcrypt
      // const isPasswordValid = await bcrypt.compare(password, user.contrasena);
      // if (isPasswordValid) {
      //   const { contrasena, ...userWithoutPassword } = user;
      //   return { success: true, user: userWithoutPassword };
      // }
      
      return { success: false, message: 'Contraseña incorrecta' };
    } catch (error) {
      console.error('Error al verificar credenciales:', error);
      throw error;
    }
  },

  // Obtener todos los usuarios (solo para administradores)
  getAllUsers: async () => {
    try {
      const query = 'SELECT id, nombre_completo, correo_electronico, rol FROM usuarios ORDER BY nombre_completo';
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }
};

module.exports = authController;