// 📁 ./components/GuestOnlyRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../pages/AuthContext';

function GuestOnlyRoute({ children }) {
    const { userType } = useAuth();

    // Si el usuario NO es invitado (está logueado), mostrar mensaje
    if (userType !== 'invitado') {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8f9fa',
                padding: '2rem'
            }}>
                <div style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    padding: '3rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    maxWidth: '600px',
                    width: '100%',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                }}>
                    <h2 style={{ 
                        marginBottom: '1.5rem', 
                        fontSize: '1.8rem',
                        fontWeight: 'bold'
                    }}>
                        Acceso Restringido
                    </h2>
                    <p style={{ 
                        fontSize: '1.2rem', 
                        marginBottom: '2rem',
                        lineHeight: '1.6'
                    }}>
                        Usted ya inició sesión con una cuenta. Cierre sesión para tener acceso a la página.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={() => window.history.back()}
                            style={{
                                backgroundColor: 'white',
                                color: '#dc3545',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#f8f9fa';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = 'white';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            ← Volver Atrás
                        </button>
                        <button
                            onClick={() => window.location.href = '/'}
                            style={{
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                padding: '0.75rem 2rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.backgroundColor = '#218838';
                                e.target.style.transform = 'translateY(-2px)';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.backgroundColor = '#28a745';
                                e.target.style.transform = 'translateY(0)';
                            }}
                        >
                            Ir al Inicio
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Si el usuario es invitado, permitir acceso a la ruta
    return children;
}

export default GuestOnlyRoute;