-- =====================================
-- CREACIÓN DE LA BASE DE DATOS
-- =====================================
CREATE DATABASE Chagas
    DEFAULT CHARACTER SET utf8mb4;
  

USE Chagas;

-- =====================================
-- TABLA USUARIOS
-- =====================================
CREATE TABLE Usuarios (
    usuario_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_electronico VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL, -- hasheada
    rol ENUM('tecnico','jefe_grupo','administrador','usuario') NOT NULL,
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================
-- TABLA MUNICIPIOS
-- =====================================
CREATE TABLE Municipios (
    municipio_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_municipio VARCHAR(150) NOT NULL,
    coordenadas VARCHAR(100),
    departamento VARCHAR(150),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================
-- RELACIÓN USUARIO - MUNICIPIO
-- =====================================
CREATE TABLE Usuario_Municipio (
    asignacion_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    municipio_id INT NOT NULL,
    fecha_asignacion DATE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (municipio_id) REFERENCES Municipios(municipio_id)
);

-- =====================================
-- TABLA COMUNIDADES
-- =====================================
CREATE TABLE Comunidades (
    comunidad_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_comunidad VARCHAR(150) NOT NULL,
    municipio_id INT NOT NULL,
    cantidad_viviendas INT,
    estado ENUM('activo','inactivo') DEFAULT 'activo',
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (municipio_id) REFERENCES Municipios(municipio_id)
);

-- =====================================
-- TABLA VIVIENDAS
-- =====================================
CREATE TABLE Viviendas (
    vivienda_id INT PRIMARY KEY AUTO_INCREMENT,
    numero_vivienda VARCHAR(20) NOT NULL,
    jefe_familia VARCHAR(150) NOT NULL,
    direccion TEXT,
    latitud DECIMAL(10,6),
    longitud DECIMAL(10,6),
    altura DECIMAL(10,2),
    foto_entrada VARCHAR(255),
    vivienda_mejorada BOOLEAN DEFAULT FALSE,
    comunidad_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE (comunidad_id, numero_vivienda),
    FOREIGN KEY (comunidad_id) REFERENCES Comunidades(comunidad_id)
);

-- =====================================
-- TABLA DENUNCIAS
-- =====================================
CREATE TABLE Denuncias (
    denuncia_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    vivienda_id INT NOT NULL,
    descripcion TEXT,
    fotos_vinchucas TEXT,
    fecha_denuncia DATE NOT NULL,
    latitud DECIMAL(10,6),
    longitud DECIMAL(10,6),
    altura DECIMAL(10,2),
    estado_denuncia ENUM('recibida','programada','realizada','cancelada') DEFAULT 'recibida',
    id_motivo_cancelacion INT NULL,
    fecha_programacion DATE,
    fecha_ejecucion DATE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (vivienda_id) REFERENCES Viviendas(vivienda_id)
);

-- =====================================
-- TABLA CANCELACIÓN DE DENUNCIAS
-- =====================================
CREATE TABLE Cancelacion_Denuncias (
    cancelacion_id INT PRIMARY KEY AUTO_INCREMENT,
    denuncia_id INT UNIQUE NOT NULL,
    motivo VARCHAR(200) NOT NULL,
    comentario TEXT,
    fecha_cancelacion DATE NOT NULL,
    FOREIGN KEY (denuncia_id) REFERENCES Denuncias(denuncia_id)
);

-- =====================================
-- TABLA EVALUACIONES ENTOMOLÓGICAS
-- =====================================
CREATE TABLE Evaluaciones_Entomologicas (
    evaluacion_id INT PRIMARY KEY AUTO_INCREMENT,
    tecnico_id INT NOT NULL,
    municipio_id INT NOT NULL,
    comunidad_id INT NOT NULL,
    fecha_evaluacion DATE NOT NULL,
    hora_inicio TIME,
    hora_final TIME,
    total_insectos INT,
    intra_domicilio INT,
    peridomicilio INT,
    numero_cuartos INT,
    vivienda_mejorada BOOLEAN DEFAULT FALSE,
    fecha_reunion DATE,
    latitud DECIMAL(10,6),
    longitud DECIMAL(10,6),
    altura DECIMAL(10,2),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    resultado ENUM('positivo','negativo'),
    foto_entrada VARCHAR(255),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tecnico_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (municipio_id) REFERENCES Municipios(municipio_id),
    FOREIGN KEY (comunidad_id) REFERENCES Comunidades(comunidad_id)
);

-- =====================================
-- DETALLES DE CAPTURAS EE1
-- =====================================
CREATE TABLE EE1_Detalles_Capturas (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    evaluacion_id INT NOT NULL,
    numero_vivienda VARCHAR(20) NOT NULL,
    jefe_familia VARCHAR(150) NOT NULL,
    intra_pared INT DEFAULT 0,
    intra_techo INT DEFAULT 0,
    intra_cama INT DEFAULT 0,
    intra_otros INT DEFAULT 0,
    peri_pared INT DEFAULT 0,
    peri_corral INT DEFAULT 0,
    peri_gallinero INT DEFAULT 0,
    peri_conejera INT DEFAULT 0,
    peri_zarzo_troje INT DEFAULT 0,
    peri_otros INT DEFAULT 0,
    FOREIGN KEY (evaluacion_id) REFERENCES Evaluaciones_Entomologicas(evaluacion_id)
);

-- =====================================
-- FORMULARIO DE ROCIADO RR1
-- =====================================
CREATE TABLE Formulario_RR1 (
    id_rr1 INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    municipio_id INT NOT NULL,
    comunidad_id INT NOT NULL,
    fecha_rociado DATE NOT NULL,
    nombre_rociador VARCHAR(150) NOT NULL,
    insecticida_utilizado VARCHAR(100) NOT NULL,
    dosis VARCHAR(50) NOT NULL,
    ciclo_rociado ENUM('primer_ciclo','segundo_ciclo') NOT NULL,
    lote_insecticida VARCHAR(100) NOT NULL,
    observaciones TEXT,
    firma_jefe_brigada VARCHAR(255),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (municipio_id) REFERENCES Municipios(municipio_id),
    FOREIGN KEY (comunidad_id) REFERENCES Comunidades(comunidad_id)
);

-- =====================================
-- DETALLES DE VIVIENDAS ROCIADAS
-- =====================================
CREATE TABLE RR1_Detalles_Viviendas (
    id_detalle INT PRIMARY KEY AUTO_INCREMENT,
    id_rr1 INT NOT NULL,
    numero_vivienda VARCHAR(20) NOT NULL,
    jefe_familia VARCHAR(150) NOT NULL,
    habitantes_protegidos INT NOT NULL,
    cerrada BOOLEAN DEFAULT FALSE,
    renuente BOOLEAN DEFAULT FALSE,
    habitaciones_rociadas INT NOT NULL,
    habitaciones_no_rociadas INT DEFAULT 0,
    corrales INT DEFAULT 0,
    gallineros INT DEFAULT 0,
    conejeras INT DEFAULT 0,
    zarzos_trojes INT DEFAULT 0,
    otros_peridomicilio INT DEFAULT 0,
    numero_cargas INT NOT NULL,
    cantidad_insecticida DECIMAL(10,2) NOT NULL,
    firma_conformidad BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_rr1) REFERENCES Formulario_RR1(id_rr1)
);
