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
-- TABLA SEDES
-- =====================================
CREATE TABLE Sedes (
    sede_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_sede VARCHAR(150) NOT NULL,
    direccion VARCHAR(255),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================
-- TABLA RED SALUD
-- =====================================
CREATE TABLE RedSalud (
    redsalud_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_red VARCHAR(150) NOT NULL,
    sede_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sede_id) REFERENCES Sedes(sede_id)
);

-- =====================================
-- TABLA ESTABLECIMIENTOS DE SALUD
-- =====================================
CREATE TABLE EstablecimientosSalud (
    establecimiento_id INT PRIMARY KEY AUTO_INCREMENT,
    nombre_establecimiento VARCHAR(150) NOT NULL,
    redsalud_id INT NOT NULL,
    tipo_establecimiento ENUM('hospital','centro_salud','puesto_salud') NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (redsalud_id) REFERENCES RedSalud(redsalud_id)
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
-- TABLA EVALUACIONES ENTOMOLÓGICAS (CON JEFES 1..4)
-- =====================================
CREATE TABLE Evaluaciones_Entomologicas (
    evaluacion_id INT PRIMARY KEY AUTO_INCREMENT,
    tecnico_id INT NOT NULL,

    -- NUEVO: entre 1 y hasta 4 jefes (jefe1_id obligatorio)
    jefe1_id INT NOT NULL,
    jefe2_id INT NULL,
    jefe3_id INT NULL,
    jefe4_id INT NULL,

    municipio_id INT NOT NULL,
    comunidad_id INT NOT NULL,
    jefe_familia VARCHAR(150) NOT NULL,
    hora_inicio TIME,
    hora_final TIME,
    hora_total TIME,
    numero_habitantes INT,
    numero_habitaciones INT,
    fecha_ultimo_rociado DATE,
    vivienda_mejorada_intra BOOLEAN DEFAULT FALSE,
    vivienda_mejorada_peri BOOLEAN DEFAULT FALSE,
    fecha_evaluacion DATE NOT NULL,
    numero_vivienda VARCHAR(50),
    latitud DECIMAL(10,6),
    longitud DECIMAL(10,6),
    altura DECIMAL(10,2),
    resultado ENUM('positivo','negativo') NOT NULL,
    foto_entrada VARCHAR(255),
    sede_id INT NOT NULL,
    redsalud_id INT NOT NULL,
    establecimiento_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (tecnico_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (jefe1_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (jefe2_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (jefe3_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (jefe4_id) REFERENCES Usuarios(usuario_id),
    FOREIGN KEY (municipio_id) REFERENCES Municipios(municipio_id),
    FOREIGN KEY (comunidad_id) REFERENCES Comunidades(comunidad_id),
    FOREIGN KEY (sede_id) REFERENCES Sedes(sede_id),
    FOREIGN KEY (redsalud_id) REFERENCES RedSalud(redsalud_id),
    FOREIGN KEY (establecimiento_id) REFERENCES EstablecimientosSalud(establecimiento_id)
);

-- =====================================
-- TABLA DETALLES CAPTURAS EE1
-- =====================================
CREATE TABLE EE1_Detalles_Capturas (
    detalle_id INT PRIMARY KEY AUTO_INCREMENT,
    evaluacion_id INT NOT NULL,
    fecha_programada DATE,
    hora_programada TIME,
    intra_ninfas INT DEFAULT 0,
    intra_adulta INT DEFAULT 0,
    peri_ninfa INT DEFAULT 0,
    peri_adulta INT DEFAULT 0,
    total_ninfas INT DEFAULT 0,
    total_adultas INT DEFAULT 0,
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
-- TABLA FORMULARIO ROCIADO RR1
-- =====================================
CREATE TABLE Formulario_RR1 (
    id_rr1 INT AUTO_INCREMENT PRIMARY KEY,
    tecnico_id INT,
    jefe1_id INT,
    jefe2_id INT,
    jefe3_id INT,
    jefe4_id INT,
    municipio_id INT,
    comunidad_id INT,
    sede_id INT,
    redsalud_id INT,
    establecimiento_id INT,
    numero_vivienda VARCHAR(20),
    jefe_familia VARCHAR(150),
    habitantes_protegidos INT,
    cerrada TINYINT(1),
    renuente TINYINT(1),
    habitaciones_rociadas INT,
    habitaciones_no_rociadas INT,
    habitaciones_total INT,
    corrales INT,
    gallineros INT,
    conejeras INT,
    zarzos_trojes INT,
    otros_peridomicilio INT,
    numero_cargas INT,
    cantidad_insecticida DECIMAL(10,2),
    firma_conformidad VARCHAR(300),
    fecha_registro DATETIME,
    rociado TINYINT(1),
    no_rociado TINYINT(1),
    insecticida_utilizado VARCHAR(150),
    lote VARCHAR(150),
    dosis DECIMAL(18,2),
    estado VARCHAR(10)
);

-- =====================================
-- TABLA NOTIFICACIONES (AÑADIDA)
-- =====================================
CREATE TABLE Notificaciones (
    notificacion_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_receptor_id INT NOT NULL,
    tipo_entidad_origen VARCHAR(50) NOT NULL, -- Ej: 'denuncia', 'programacion', 'rociado_fallido'
    id_entidad_origen VARCHAR(50) NOT NULL, -- Número de Vivienda (Viviendas.numero_vivienda)
    mensaje TEXT NOT NULL,
    leida TINYINT(1) DEFAULT 0, -- 0: No leída, 1: Leída. Se usa para la lógica grupal.
    ruta_destino VARCHAR(255), -- Ej: '/CargaRociado', '/denuncia'
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_receptor_id) REFERENCES Usuarios(usuario_id)
);



