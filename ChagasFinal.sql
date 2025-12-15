-- ===============================================
-- 1. CREACIÓN DE LA BASE DE DATOS Y USO
-- ===============================================
CREATE DATABASE Chagas
    DEFAULT CHARACTER SET utf8mb4;
  
USE Chagas;

-- ===============================================
-- 2. TABLAS BASE (SIN DEPENDENCIAS DE OTRAS TABLAS)
-- ===============================================

CREATE TABLE `Municipios` (
 `municipio_id` int NOT NULL AUTO_INCREMENT,
 `nombre_municipio` varchar(150) NOT NULL,
 `coordenadas` varchar(100) DEFAULT NULL,
 `departamento` varchar(150) DEFAULT NULL,
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`municipio_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Usuarios` (
 `usuario_id` int NOT NULL AUTO_INCREMENT,
 `nombre_completo` varchar(150) NOT NULL,
 `correo_electronico` varchar(150) NOT NULL,
 `contrasena` varchar(255) NOT NULL,
 `rol` enum('tecnico','jefe_grupo','administrador','usuario','supervisor') NOT NULL,
 `estado` enum('activo','inactivo') DEFAULT 'activo',
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`usuario_id`),
 UNIQUE KEY `correo_electronico` (`correo_electronico`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Sedes` (
 `sede_id` int NOT NULL AUTO_INCREMENT,
 `nombre_sede` varchar(150) NOT NULL,
 `direccion` varchar(255) DEFAULT NULL,
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`sede_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===============================================
-- 3. TABLAS DE NIVEL 1 (DEPENDEN DE TABLAS BASE)
-- ===============================================

CREATE TABLE `Comunidades` (
 `comunidad_id` int NOT NULL AUTO_INCREMENT,
 `nombre_comunidad` varchar(150) NOT NULL,
 `municipio_id` int NOT NULL,
 `cantidad_viviendas` int DEFAULT NULL,
 `estado` enum('activo','inactivo') DEFAULT 'activo',
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`comunidad_id`),
 KEY `municipio_id` (`municipio_id`),
 CONSTRAINT `Comunidades_ibfk_1` FOREIGN KEY (`municipio_id`) REFERENCES `Municipios` (`municipio_id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Usuario_Municipio` (
 `asignacion_id` int NOT NULL AUTO_INCREMENT,
 `usuario_id` int NOT NULL,
 `municipio_id` int NOT NULL,
 `fecha_asignacion` date DEFAULT NULL,
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`asignacion_id`),
 KEY `usuario_id` (`usuario_id`),
 KEY `municipio_id` (`municipio_id`),
 CONSTRAINT `Usuario_Municipio_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios` (`usuario_id`),
 CONSTRAINT `Usuario_Municipio_ibfk_2` FOREIGN KEY (`municipio_id`) REFERENCES `Municipios` (`municipio_id`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Notificaciones` (
 `notificacion_id` int NOT NULL AUTO_INCREMENT,
 `usuario_receptor_id` int NOT NULL,
 `tipo_entidad_origen` varchar(50) NOT NULL,
 `id_entidad_origen` varchar(50) NOT NULL,
 `mensaje` text NOT NULL,
 `leida` tinyint(1) DEFAULT '0',
 `ruta_destino` varchar(255) DEFAULT NULL,
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`notificacion_id`),
 KEY `usuario_receptor_id` (`usuario_receptor_id`),
 CONSTRAINT `Notificaciones_ibfk_1` FOREIGN KEY (`usuario_receptor_id`) REFERENCES `Usuarios` (`usuario_id`)
) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `RedSalud` (
 `redsalud_id` int NOT NULL AUTO_INCREMENT,
 `nombre_red` varchar(150) NOT NULL,
 `sede_id` int NOT NULL,
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`redsalud_id`),
 KEY `sede_id` (`sede_id`),
 CONSTRAINT `RedSalud_ibfk_1` FOREIGN KEY (`sede_id`) REFERENCES `Sedes` (`sede_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===============================================
-- 4. TABLAS DE NIVEL 2 (DEPENDENCIAS INTERMEDIAS)
-- ===============================================

CREATE TABLE `Viviendas` (
 `vivienda_id` int NOT NULL AUTO_INCREMENT,
 `numero_vivienda` varchar(20) DEFAULT NULL,
 `jefe_familia` varchar(150) DEFAULT NULL,
 `direccion` text,
 `latitud` decimal(10,6) DEFAULT NULL,
 `longitud` decimal(10,6) DEFAULT NULL,
 `altura` decimal(10,2) DEFAULT NULL,
 `foto_entrada` varchar(255) DEFAULT NULL,
 `vivienda_mejorada` tinyint(1) DEFAULT '0',
 `comunidad_id` int NOT NULL,
 `municipio_id` int DEFAULT NULL, -- Aunque es redundante, se mantiene según tu estructura original
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 `fotoVinchucas` varchar(255) DEFAULT NULL COMMENT 'Foto de vinchucas encontradas',
 PRIMARY KEY (`vivienda_id`),
 KEY `comunidad_id` (`comunidad_id`),
 CONSTRAINT `Viviendas_ibfk_1` FOREIGN KEY (`comunidad_id`) REFERENCES `Comunidades` (`comunidad_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `EstablecimientosSalud` (
 `establecimiento_id` int NOT NULL AUTO_INCREMENT,
`nombre_establecimiento` varchar(150) NOT NULL,
 `redsalud_id` int NOT NULL,
 `tipo_establecimiento` enum('hospital','centro_salud','puesto_salud') NOT NULL,
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`establecimiento_id`),
 KEY `redsalud_id` (`redsalud_id`),
 CONSTRAINT `EstablecimientosSalud_ibfk_1` FOREIGN KEY (`redsalud_id`) REFERENCES `RedSalud` (`redsalud_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Denuncias` (
 `denuncia_id` int NOT NULL AUTO_INCREMENT,
 `usuario_id` int NOT NULL,
 `vivienda_id` int DEFAULT NULL,
 `municipio_id` int DEFAULT NULL,
 `comunidad_id` int DEFAULT NULL,
 `direccion` text,
 `descripcion` text,
 `foto_vivienda` text,
 `fotos_vinchucas` text,
 `codigo_pais` varchar(10) DEFAULT '+591',
 `numero_telefono` varchar(50) DEFAULT NULL,
 `fecha_denuncia` date NOT NULL,
 `latitud` decimal(10,6) DEFAULT NULL,
 `longitud` decimal(10,6) DEFAULT NULL,
 `altura` decimal(10,2) DEFAULT NULL,
 `estado_denuncia` enum('recibida','programada','realizada','cancelada','reprogramada') DEFAULT 'recibida',
 `motivo_cancelacion` text,
`motivo_reprogramacion` text,
 `fecha_programacion` datetime DEFAULT NULL,
 `fecha_ejecucion` datetime DEFAULT NULL,
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`denuncia_id`),
 KEY `usuario_id` (`usuario_id`),
 KEY `vivienda_id` (`vivienda_id`),
 KEY `municipio_id` (`municipio_id`),
 KEY `comunidad_id` (`comunidad_id`),
 CONSTRAINT `Denuncias_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `Usuarios` (`usuario_id`),
 CONSTRAINT `Denuncias_ibfk_2` FOREIGN KEY (`vivienda_id`) REFERENCES `Viviendas` (`vivienda_id`),
 CONSTRAINT `Denuncias_ibfk_3` FOREIGN KEY (`municipio_id`) REFERENCES `Municipios` (`municipio_id`),
 CONSTRAINT `Denuncias_ibfk_4` FOREIGN KEY (`comunidad_id`) REFERENCES `Comunidades` (`comunidad_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `Formulario_RR1` (
 `id_rr1` int NOT NULL AUTO_INCREMENT,
 `tecnico_id` int DEFAULT NULL,
 `jefe1_id` int DEFAULT NULL,
 `jefe2_id` int DEFAULT NULL,
 `jefe3_id` int DEFAULT NULL,
 `jefe4_id` int DEFAULT NULL,
 `municipio_id` int DEFAULT NULL,
 `comunidad_id` int DEFAULT NULL,
 `sede_id` int DEFAULT NULL,
 `redsalud_id` int DEFAULT NULL,
 `establecimiento_id` int DEFAULT NULL,
 `numero_vivienda` varchar(20) DEFAULT NULL,
 `jefe_familia` varchar(150) DEFAULT NULL,
`habitantes_protegidos` int DEFAULT NULL,
 `cerrada` tinyint(1) DEFAULT NULL,
 `renuente` tinyint(1) DEFAULT NULL,
 `habitaciones_rociadas` int DEFAULT NULL,
`habitaciones_no_rociadas` int DEFAULT NULL,
 `habitaciones_total` int DEFAULT NULL,
 `corrales` int DEFAULT NULL,
 `gallineros` int DEFAULT NULL,
 `conejeras` int DEFAULT NULL,
 `zarzos_trojes` int DEFAULT NULL,
`otros_peridomicilio` int DEFAULT NULL,
 `numero_cargas` int DEFAULT NULL,
 `cantidad_insecticida` decimal(10,2) DEFAULT NULL,
 `firma_conformidad` varchar(300) DEFAULT NULL,
 `rociado` tinyint(1) DEFAULT NULL,
 `no_rociado` tinyint(1) DEFAULT NULL,
 `insecticida_utilizado` varchar(150) DEFAULT NULL,
 `lote` varchar(150) DEFAULT NULL,
 `dosis` decimal(18,2) DEFAULT NULL,
 `estado` varchar(20) DEFAULT 'activo',
 `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`id_rr1`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci; -- Se asume que RR1 usará IDs de Usuarios, Municipios, Comunidades, etc.

CREATE TABLE `Evaluaciones_Entomologicas` (
 `evaluacion_id` int NOT NULL AUTO_INCREMENT,
 `tecnico_id` int NOT NULL,
 `jefe1_id` int NOT NULL,
 `jefe2_id` int DEFAULT NULL,
 `jefe3_id` int DEFAULT NULL,
 `jefe4_id` int DEFAULT NULL,
 `municipio_id` int NOT NULL,
 `comunidad_id` int NOT NULL,
 `jefe_familia` varchar(150) NOT NULL,
 `hora_inicio` time DEFAULT NULL,
 `hora_final` time DEFAULT NULL,
 `hora_total` time DEFAULT NULL,
 `numero_habitantes` int DEFAULT NULL,
`numero_habitaciones` int DEFAULT NULL,
`fecha_ultimo_rociado` date DEFAULT NULL,
`vivienda_mejorada_intra` tinyint(1) DEFAULT '0',
`vivienda_mejorada_peri` tinyint(1) DEFAULT '0',
 `fecha_evaluacion` date NOT NULL,
 `numero_vivienda` varchar(50) DEFAULT NULL,
 `latitud` decimal(10,6) DEFAULT NULL,
 `longitud` decimal(10,6) DEFAULT NULL,
 `altura` decimal(10,2) DEFAULT NULL,
 `resultado` enum('positivo','negativo') NOT NULL,
 `foto_entrada` varchar(255) DEFAULT NULL,
 `sede_id` int NOT NULL,
 `redsalud_id` int NOT NULL,
 `establecimiento_id` int NOT NULL,
 `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
 `fecha_modificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (`evaluacion_id`),
 KEY `tecnico_id` (`tecnico_id`),
 KEY `jefe1_id` (`jefe1_id`),
 KEY `jefe2_id` (`jefe2_id`),
 KEY `jefe3_id` (`jefe3_id`),
 KEY `jefe4_id` (`jefe4_id`),
 KEY `municipio_id` (`municipio_id`),
 KEY `comunidad_id` (`comunidad_id`),
 KEY `sede_id` (`sede_id`),
 KEY `redsalud_id` (`redsalud_id`),
 KEY `establecimiento_id` (`establecimiento_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_1` FOREIGN KEY (`tecnico_id`) REFERENCES `Usuarios` (`usuario_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_10` FOREIGN KEY (`establecimiento_id`) REFERENCES `EstablecimientosSalud` (`establecimiento_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_2` FOREIGN KEY (`jefe1_id`) REFERENCES `Usuarios` (`usuario_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_3` FOREIGN KEY (`jefe2_id`) REFERENCES `Usuarios` (`usuario_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_4` FOREIGN KEY (`jefe3_id`) REFERENCES `Usuarios` (`usuario_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_5` FOREIGN KEY (`jefe4_id`) REFERENCES `Usuarios` (`usuario_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_6` FOREIGN KEY (`municipio_id`) REFERENCES `Municipios` (`municipio_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_7` FOREIGN KEY (`comunidad_id`) REFERENCES `Comunidades` (`comunidad_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_8` FOREIGN KEY (`sede_id`) REFERENCES `Sedes` (`sede_id`),
 CONSTRAINT `Evaluaciones_Entomologicas_ibfk_9` FOREIGN KEY (`redsalud_id`) REFERENCES `RedSalud` (`redsalud_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ===============================================
-- 5. TABLAS DE NIVEL 3 (DEPENDENCIAS FINALES)
-- ===============================================

CREATE TABLE `Cancelacion_Denuncias` (
 `cancelacion_id` int NOT NULL AUTO_INCREMENT,
 `denuncia_id` int NOT NULL,
 `motivo` text NOT NULL,
 `comentario` text,
 `fecha_cancelacion` date NOT NULL,
 PRIMARY KEY (`cancelacion_id`),
 UNIQUE KEY `denuncia_id` (`denuncia_id`),
 CONSTRAINT `Cancelacion_Denuncias_ibfk_1` FOREIGN KEY (`denuncia_id`) REFERENCES `Denuncias` (`denuncia_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `EE1_Detalles_Capturas` (
 `detalle_id` int NOT NULL AUTO_INCREMENT,
 `evaluacion_id` int NOT NULL,
 `intra_ninfas` int DEFAULT '0',
 `intra_adulta` int DEFAULT '0',
 `peri_ninfa` int DEFAULT '0',
 `peri_adulta` int DEFAULT '0',
 `total_ninfas` int DEFAULT '0',
 `total_adultas` int DEFAULT '0',
 `intra_pared` int DEFAULT '0',
 `intra_techo` int DEFAULT '0',
 `intra_cama` int DEFAULT '0',
 `intra_otros` int DEFAULT '0',
 `peri_pared` int DEFAULT '0',
 `peri_corral` int DEFAULT '0',
 `peri_gallinero` int DEFAULT '0',
 `peri_conejera` int DEFAULT '0',
 `peri_zarzo_troje` int DEFAULT '0',
 `peri_otros` int DEFAULT '0',
 PRIMARY KEY (`detalle_id`),
 KEY `evaluacion_id` (`evaluacion_id`),
 CONSTRAINT `EE1_Detalles_Capturas_ibfk_1` FOREIGN KEY (`evaluacion_id`) REFERENCES `Evaluaciones_Entomologicas` (`evaluacion_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `RR1_Denuncias` (
 `id` int NOT NULL AUTO_INCREMENT,
 `rr1_id` int NOT NULL,
 `denuncia_id` int NOT NULL,
 `fecha_relacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (`id`),
 UNIQUE KEY `unique_rr1_denuncia` (`rr1_id`,`denuncia_id`),
 KEY `denuncia_id` (`denuncia_id`),
 CONSTRAINT `RR1_Denuncias_ibfk_1` FOREIGN KEY (`rr1_id`) REFERENCES `Formulario_RR1` (`id_rr1`),
 CONSTRAINT `RR1_Denuncias_ibfk_2` FOREIGN KEY (`denuncia_id`) REFERENCES `Denuncias` (`denuncia_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;