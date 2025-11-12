import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    userType: 'invitado',
    usuario: null,
    user: null,
    isLoading: true
  });

  // Función para normalizar el rol
  const normalizeRole = (role) => {
    if (!role) return 'invitado';
    
    const roleMap = {// Corregido: con doble 'p' como en tu BD
      'jefe_grupo': 'jefe_grupo',  // Por si acaso hay variaciones
      'tecnico': 'tecnico',
      'administrador': 'administrador',
      'usuario': 'usuario',
    };
    
    return roleMap[role] || role;
  };

  // Función para actualizar el estado de autenticación
  const updateAuthState = () => {
    try {
      const usuarioGuardado = JSON.parse(localStorage.getItem('usuario'));
      
      if (usuarioGuardado && usuarioGuardado.rol) {
        const normalizedRole = normalizeRole(usuarioGuardado.rol);
        
        setAuthState({
          userType: normalizedRole,
          usuario: usuarioGuardado,
          user: usuarioGuardado,
          isLoading: false
        });
      } else {
        setAuthState({
          userType: 'invitado',
          usuario: null,
          user: null,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Error al cargar estado de autenticación:', error);
      setAuthState({
        userType: 'invitado',
        usuario: null,
        user: null,
        isLoading: false
      });
    }
  };

  // Función para login
  const login = (token, usuarioData) => {
    try {
      const userWithNormalizedRole = {
        ...usuarioData,
        rol: normalizeRole(usuarioData.rol)
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(userWithNormalizedRole));
      updateAuthState();
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  // Función para logout
  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      setAuthState({
        userType: 'invitado',
        usuario: null,
        user: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Error en logout:', error);
    }
  };

  // Función para verificar si un rol tiene acceso
  const hasRole = (allowedRoles) => {
    if (!allowedRoles || allowedRoles.length === 0) return true;
    if (authState.userType === 'invitado') return false;
    
    return allowedRoles.includes(authState.userType);
  };

  // Función para verificar permisos específicos
  const hasPermission = (requiredPermission) => {
    const permissions = {
      'administrador': ['rr1', 'rr2', 'rr3', 'ee1', 'manage_users', 'view_reports'],
      'jefe_gruppo': ['rr1', 'rr2', 'rr3', 'ee1', 'view_reports'],
      'tecnico': ['rr1', 'ee1'],
      'usuario': ['view_basic']
    };

    const userPermissions = permissions[authState.userType] || [];
    return userPermissions.includes(requiredPermission);
  };

  // Efecto para cargar el estado inicial
  useEffect(() => {
    updateAuthState();
  }, []);

  const value = {
    // Estado actual
    userType: authState.userType,
    usuario: authState.usuario,
    user: authState.user,
    isLoading: authState.isLoading,
    
    // Funciones principales
    login,
    logout,
    updateAuthState,
    
    // Utilidades de verificación
    hasRole,
    hasPermission,
    
    // Propiedades de conveniencia
    isAuthenticated: authState.userType !== 'invitado',
    isAdmin: authState.userType === 'administrador',
    isJefeGrupo: authState.userType === 'jefe_grupo',
    isTecnico: authState.userType === 'tecnico',
    isUsuario: authState.userType === 'usuario',
    
    // Compatibilidad con código existente
    rol: authState.userType
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para verificar acceso a rutas
export const useRouteAccess = (allowedRoles = []) => {
  const { hasRole, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return { hasAccess: false, isLoading: true };
  }
  
  return {
    hasAccess: isAuthenticated && (allowedRoles.length === 0 || hasRole(allowedRoles)),
    isLoading: false
  };
};