import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

// Function to normalize the role (e.g., 'Administrador' -> 'administrador')
const getUserType = (usuario) => {
    if (!usuario || !usuario.rol) return 'invitado';
    return usuario.rol.toLowerCase(); 
};

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 🆕 ESTADOS AÑADIDOS
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userType, setUserType] = useState('invitado'); 

    useEffect(() => {
        const storedUser = localStorage.getItem("usuario");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
            const parsedUser = JSON.parse(storedUser);
            
            setUsuario(parsedUser);
            setToken(storedToken);
            
            // 🆕 Configuración de estados de autenticación
            setIsAuthenticated(true);
            setUserType(getUserType(parsedUser));
        } else {
            // Asegurarse de que si no hay nada, los estados sean limpios
            setIsAuthenticated(false);
            setUserType('invitado');
        }

        setLoading(false);
    }, []);

    // 🆕 FUNCIÓN LOGIN ACTUALIZADA
    const login = (tokenParam, usuarioParam) => {
        // El orden de los parámetros (token, usuario) ya fue corregido en Login.jsx
        localStorage.setItem("token", tokenParam);
        localStorage.setItem("usuario", JSON.stringify(usuarioParam));
        
        setToken(tokenParam);
        setUsuario(usuarioParam);
        
        // 🆕 Configuración de estados de autenticación
        setIsAuthenticated(true);
        setUserType(getUserType(usuarioParam));
    };

    // 🆕 FUNCIÓN LOGOUT ACTUALIZADA
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        
        setToken(null);
        setUsuario(null);
        
        // 🆕 Limpieza de estados
        setIsAuthenticated(false);
        setUserType('invitado');
    };

    return (
        <AuthContext.Provider value={{ 
            usuario, 
            token, 
            login, 
            logout, 
            loading, 
            isAuthenticated, // ⬅️ Exportado para ProtectedRoute
            userType         // ⬅️ Exportado para NavBar
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);