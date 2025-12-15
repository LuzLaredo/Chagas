// 📁 ./constants/roles.js
export const ROLES = {
    USUARIO: 'usuario',
    TECNICO: 'tecnico',
    JEFE_GRUPO: 'jefe_grupo',
    ADMIN: 'administrador',
    SUPERVISOR: 'supervisor', 
};

// TODAS ESTAS LISTAS DEBEN INCLUIR EXPLICITAMENTE A SUPERVISOR
const ALL_AUTHENTICATED = [
    ROLES.USUARIO, 
    ROLES.TECNICO, 
    ROLES.JEFE_GRUPO, 
    ROLES.ADMIN, 
    ROLES.SUPERVISOR 
];

const TECNICO_UP = [
    ROLES.TECNICO, 
    ROLES.JEFE_GRUPO, 
    ROLES.ADMIN, 
    ROLES.SUPERVISOR 
];

const JEFE_UP = [
    ROLES.JEFE_GRUPO, 
    ROLES.ADMIN, 
    ROLES.SUPERVISOR 
];

const ADMIN_ONLY = [
    ROLES.ADMIN, 
    ROLES.SUPERVISOR 
]; 

export const ROLE_COMBINATIONS = {
    ALL_AUTHENTICATED,
    TECNICO_UP,
    JEFE_UP,
    ADMIN_ONLY,
};