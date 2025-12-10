**MANUAL TÉCNICO**

**SISTEMA DE GESTIÓN Y CONTROL DE VECTORES - PROGRAMA CHAGAS BOLIVIA**

**1. INTEGRANTES -- ROLES**

**Desarrollador -- Team Leader:** Luz Laredo

Desarrollador: Jhojan Daniel Rivera Fuentes

**2. INTRODUCCIÓN**

El presente manual técnico describe de manera integral el Sistema de
Gestión y Control de Vectores para el Programa Nacional de Chagas en
Bolivia. Este documento

proporciona información técnica completa sobre la arquitectura,
configuración, implementación y mantenimiento del sistema.

El sistema está diseñado para digitalizar y optimizar la gestión de
denuncias de vectores de Chagas, evaluaciones entomológicas, actividades
de rociado residual, y análisis estadísticos georreferenciados.

**3. DESCRIPCIÓN / OBJETIVO DEL PROYECTO**

Objetivo General

Desarrollar un sistema web integral que permita la gestión eficiente del
Programa Nacional de Control de Chagas, facilitando el registro,
seguimiento y análisis de denuncias de vectores, evaluaciones
entomológicas y actividades de rociado residual en todo el territorio
boliviano.

Objetivos Específicos

- Digitalizar el proceso de registro y seguimiento de denuncias de
  presencia de vectores de Chagas

- Gestionar evaluaciones entomológicas (EE1, EE2, EE3) con
  georreferenciación

- Administrar formularios de rociado residual (RR1, RR2, RR3)

- Generar reportes estadísticos y visualizaciones geográficas en tiempo
  real

- Proporcionar diferentes niveles de acceso según roles (Administrador,
  Supervisor, Jefe de Grupo, Usuario)

- Permitir la exportación de datos en formatos PDF para análisis y
  reportes oficiales

**4. LINK AL VIDEO ILUSTRATIVO EN YOUTUBE**

**Ponlo tu abajo**

**5. LISTADO DE REQUISITOS FUNCIONALES DEL SISTEMA**

RF-01: Gestión de Usuarios y Autenticación

- El sistema debe permitir registro e inicio de sesión de usuarios

- Debe implementar control de acceso basado en roles (RBAC)

- Debe permitir recuperación de contraseñas mediante correo electrónico

- Debe mantener sesiones activas con tokens de autenticación

RF-02: Gestión de Denuncias

- Registro de nuevas denuncias por parte de usuarios

- Asignación manual de denuncias por coordinadores

- Programación de visitas para verificación

- Actualización de estados: Sin Revisar, Programada, Verificada/Rociada,
  Cancelada

- Cancelación de denuncias con justificación

- Visualización georreferenciada en mapas

RF-03: Gestión de Evaluaciones Entomológicas

- **EE1**: Planilla diaria de evaluación entomológica

- **EE2**: Mapa de evaluación entomológica con visualización geográfica

- **EE3**: Consolidado de evaluaciones por municipio

- Captura de coordenadas GPS para cada evaluación

- Cálculo automático de estadísticas (viviendas positivas, ejemplares
  capturados)

RF-04: Gestión de Rociado Residual

- **RR1**: Parte diario de rociado residual

- **RR2**: Mapa de rociado residual con visualización geográfica

- **RR3**: Consolidado mensual por municipio

- Control de insecticidas utilizados (Alfa, Bendio, Lambda)

- Registro de habitaciones, viviendas y peridomicilio rociados

RF-05: Visualización Geográfica

- Mapa interactivo de denuncias con filtros por estado

- Mapa de evaluaciones entomológicas (EE1)

- Leyenda dinámica con información estadística

- Clusters de marcadores para mejor visualización

- Filtros por municipio y estado de rociado

RF-06: Generación de Reportes

- Exportación de formularios RR1-RR3 a PDF

- Exportación de formularios EE1-EE3 a PDF

- Gráficos estadísticos con Nivo Charts

- KPIs visuales con estadísticas consolidadas

RF-07: Panel de Estadísticas

- Visualización de denuncias por estado

- Estadísticas de rociado por municipio

- Gráficos de evaluaciones entomológicas

- Filtrado por fechas y ubicaciones

RF-08: Gestión de Catálogos

- CRUD de sedes de salud

- CRUD de redes de salud

- CRUD de municipios

- CRUD de comunidades

- Gestión de técnicos supervisores

RF-09: Control de Acceso por Municipio

- Supervisores asignados a municipios específicos

- Restricción de visualización de datos según municipio asignado

- Filtrado automático de denuncias y evaluaciones

RF-10: Gestión de Usuarios (Admin)

- Listado de todos los usuarios del sistema

- Activación/desactivación de cuentas

- Cambio de roles

- Visualización de municipios asignados

**6. ARQUITECTURA DEL SOFTWARE**

Estructura General

El sistema sigue una arquitectura **Cliente-Servidor** de tres capas:

┌─────────────────────────────────────────────┐

│ FRONTEND (React + Vite) │

│ ┌─────────────┐ ┌──────────────────────┐ │

│ │ UI/UX │ │ State Management │ │

│ │ Components │ │ (React Context API) │ │

│ └─────────────┘ └──────────────────────┘ │

└────────────────┬────────────────────────────┘

│ HTTP/REST API

│

┌────────────────▼────────────────────────────┐

│ BACKEND (Node.js + Express) │

│ ┌─────────────┐ ┌──────────────────────┐ │

│ │ Routes │ │ Middlewares │ │

│ │ Controllers │ │ (Auth, CORS) │ │

│ └─────────────┘ └──────────────────────┘ │

│ ┌─────────────┐ ┌──────────────────────┐ │

│ │ Services │ │ Email Service │ │

│ │ (Logic) │ │ (Nodemailer) │ │

│ └─────────────┘ └──────────────────────┘ │

└────────────────┬────────────────────────────┘

│ MySQL2

│

┌────────────────▼────────────────────────────┐

│ BASE DE DATOS (MySQL 8.0+) │

│ ┌─────────────────────────────────────────┼│

│ │ Tablas: usuarios, denuncias, │

│ │ sedes, municipios, ee1, rr1, etc. ││

│ └──────────────────────────────────────────┘│

└──────────────────────────────────────────────┘

Componentes Principales

FRONTEND

- **Framework**: React 19.1.1 con Vite 7.1.2

- **Routing**: React Router DOM v7

- **UI Library**: HeroUI v2 (componentes)

- **Mapas**: Leaflet + React-Leaflet + Google Maps API

- **Gráficos**: Nivo Charts, Chart.js

- **Exportación**: jsPDF + html2canvas

- **Íconos**: Iconify React + React Icons

BACKEND

- **Runtime**: Node.js

- **Framework**: Express v5

- **Base de Datos**: MySQL2 (driver)

- **Email**: Nodemailer

- **Seguridad**: CORS, variables de entorno

Patrones de Diseño Utilizados

1.  **MVC (Model-View-Controller)**

    - Model: Servicios de acceso a datos

    - View: Componentes React

    - Controller: Rutas y controladores Express

2.  **Context API Pattern**

    - AuthContext para gestión de autenticación

    - RouteAccess para control de permisos

3.  **Component Composition**

    - Componentes reutilizables (NavBar, InfoTooltip, EstadisticasCard)

    - HOCs para protección de rutas

4.  **Service Pattern**

    - Servicios centralizados para llamadas API:

      - denunciasService.js

      - entomologicaService.js

      - estadisticasService.js

      - generalService.js

5.  **Repository Pattern**

    - Separación entre lógica de negocio y acceso a datos

**7. BASE DE DATOS**

a\. Diagrama Completo y Actual

![Diagrama El contenido generado por IA puede ser
incorrecto.](media/image1.png){width="3.615384951881015in"
height="2.2713331146106737in"}![Interfaz de usuario gráfica El contenido
generado por IA puede ser
incorrecto.](media/image2.png){width="2.87661854768154in"
height="1.336492782152231in"}![Diagrama El contenido generado por IA
puede ser incorrecto.](media/image3.png){width="3.0116393263342083in"
height="2.31200021872266in"}![](media/image4.png){width="3.640330271216098in"
height="2.305599300087489in"}

b\. Scripts en Carpeta database/

CREATE DATABASE IF NOT EXISTS \`Chagas\` DEFAULT CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

USE \`Chagas\`;

CREATE TABLE \`Cancelacion_Denuncias\` (

 \`cancelacion_id\` int NOT NULL AUTO_INCREMENT,

 \`denuncia_id\` int NOT NULL,

 \`motivo\` text NOT NULL,

 \`comentario\` text,

 \`fecha_cancelacion\` date NOT NULL,

 PRIMARY KEY (\`cancelacion_id\`),

 UNIQUE KEY \`denuncia_id\` (\`denuncia_id\`),

 CONSTRAINT \`Cancelacion_Denuncias_ibfk_1\` FOREIGN KEY
(\`denuncia_id\`) REFERENCES \`Denuncias\` (\`denuncia_id\`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci

 

 

CREATE TABLE \`Comunidades\` (

 \`comunidad_id\` int NOT NULL AUTO_INCREMENT,

 \`nombre_comunidad\` varchar(150) NOT NULL,

 \`municipio_id\` int NOT NULL,

 \`cantidad_viviendas\` int DEFAULT NULL,

 \`estado\` enum(\'activo\',\'inactivo\') DEFAULT \'activo\',

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 PRIMARY KEY (\`comunidad_id\`),

 KEY \`municipio_id\` (\`municipio_id\`),

 CONSTRAINT \`Comunidades_ibfk_1\` FOREIGN KEY (\`municipio_id\`)
REFERENCES \`Municipios\` (\`municipio_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

CREATE TABLE \`EE1_Detalles_Capturas\` (

 \`detalle_id\` int NOT NULL AUTO_INCREMENT,

 \`evaluacion_id\` int NOT NULL,

 \`intra_ninfas\` int DEFAULT \'0\',

 \`intra_adulta\` int DEFAULT \'0\',

 \`peri_ninfa\` int DEFAULT \'0\',

 \`peri_adulta\` int DEFAULT \'0\',

 \`total_ninfas\` int DEFAULT \'0\',

 \`total_adultas\` int DEFAULT \'0\',

 \`intra_pared\` int DEFAULT \'0\',

 \`intra_techo\` int DEFAULT \'0\',

 \`intra_cama\` int DEFAULT \'0\',

 \`intra_otros\` int DEFAULT \'0\',

 \`peri_pared\` int DEFAULT \'0\',

 \`peri_corral\` int DEFAULT \'0\',

 \`peri_gallinero\` int DEFAULT \'0\',

 \`peri_conejera\` int DEFAULT \'0\',

 \`peri_zarzo_troje\` int DEFAULT \'0\',

 \`peri_otros\` int DEFAULT \'0\',

 PRIMARY KEY (\`detalle_id\`),

 KEY \`evaluacion_id\` (\`evaluacion_id\`),

 CONSTRAINT \`EE1_Detalles_Capturas_ibfk_1\` FOREIGN KEY
(\`evaluacion_id\`) REFERENCES \`Evaluaciones_Entomologicas\`
(\`evaluacion_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

 

CREATE TABLE \`Denuncias\` (

 \`denuncia_id\` int NOT NULL AUTO_INCREMENT,

 \`usuario_id\` int NOT NULL,

 \`vivienda_id\` int DEFAULT NULL,

 \`municipio_id\` int DEFAULT NULL,

 \`comunidad_id\` int DEFAULT NULL,

 \`direccion\` text,

 \`descripcion\` text,

 \`foto_vivienda\` text,

 \`fotos_vinchucas\` text,

 \`codigo_pais\` varchar(10) DEFAULT \'+591\',

 \`numero_telefono\` varchar(50) DEFAULT NULL,

 \`fecha_denuncia\` date NOT NULL,

 \`latitud\` decimal(10,6) DEFAULT NULL,

 \`longitud\` decimal(10,6) DEFAULT NULL,

 \`altura\` decimal(10,2) DEFAULT NULL,

 \`estado_denuncia\`
enum(\'recibida\',\'programada\',\'realizada\',\'cancelada\',\'reprogramada\')
DEFAULT \'recibida\',

 \`motivo_cancelacion\` text,

\`motivo_reprogramacion\` text,

 \`fecha_programacion\` datetime DEFAULT NULL,

 \`fecha_ejecucion\` datetime DEFAULT NULL,

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 PRIMARY KEY (\`denuncia_id\`),

 KEY \`usuario_id\` (\`usuario_id\`),

 KEY \`vivienda_id\` (\`vivienda_id\`),

 KEY \`municipio_id\` (\`municipio_id\`),

 KEY \`comunidad_id\` (\`comunidad_id\`),

 CONSTRAINT \`Denuncias_ibfk_1\` FOREIGN KEY (\`usuario_id\`) REFERENCES
\`Usuarios\` (\`usuario_id\`),

 CONSTRAINT \`Denuncias_ibfk_2\` FOREIGN KEY (\`vivienda_id\`)
REFERENCES \`Viviendas\` (\`vivienda_id\`),

 CONSTRAINT \`Denuncias_ibfk_3\` FOREIGN KEY (\`municipio_id\`)
REFERENCES \`Municipios\` (\`municipio_id\`),

 CONSTRAINT \`Denuncias_ibfk_4\` FOREIGN KEY (\`comunidad_id\`)
REFERENCES \`Comunidades\` (\`comunidad_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

 

CREATE TABLE \`EstablecimientosSalud\` (

 \`establecimiento_id\` int NOT NULL AUTO_INCREMENT,

\`nombre_establecimiento\` varchar(150) NOT NULL,

 \`redsalud_id\` int NOT NULL,

 \`tipo_establecimiento\`
enum(\'hospital\',\'centro_salud\',\'puesto_salud\') NOT NULL,

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 PRIMARY KEY (\`establecimiento_id\`),

 KEY \`redsalud_id\` (\`redsalud_id\`),

 CONSTRAINT \`EstablecimientosSalud_ibfk_1\` FOREIGN KEY
(\`redsalud_id\`) REFERENCES \`RedSalud\` (\`redsalud_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

CREATE TABLE \`Evaluaciones_Entomologicas\` (

 \`evaluacion_id\` int NOT NULL AUTO_INCREMENT,

 \`tecnico_id\` int NOT NULL,

 \`jefe1_id\` int NOT NULL,

 \`jefe2_id\` int DEFAULT NULL,

 \`jefe3_id\` int DEFAULT NULL,

 \`jefe4_id\` int DEFAULT NULL,

 \`municipio_id\` int NOT NULL,

 \`comunidad_id\` int NOT NULL,

 \`jefe_familia\` varchar(150) NOT NULL,

 \`hora_inicio\` time DEFAULT NULL,

 \`hora_final\` time DEFAULT NULL,

 \`hora_total\` time DEFAULT NULL,

 \`numero_habitantes\` int DEFAULT NULL,

\`numero_habitaciones\` int DEFAULT NULL,

\`fecha_ultimo_rociado\` date DEFAULT NULL,

\`vivienda_mejorada_intra\` tinyint(1) DEFAULT \'0\',

\`vivienda_mejorada_peri\` tinyint(1) DEFAULT \'0\',

 \`fecha_evaluacion\` date NOT NULL,

 \`numero_vivienda\` varchar(50) DEFAULT NULL,

 \`latitud\` decimal(10,6) DEFAULT NULL,

 \`longitud\` decimal(10,6) DEFAULT NULL,

 \`altura\` decimal(10,2) DEFAULT NULL,

 \`resultado\` enum(\'positivo\',\'negativo\') NOT NULL,

 \`foto_entrada\` varchar(255) DEFAULT NULL,

 \`sede_id\` int NOT NULL,

 \`redsalud_id\` int NOT NULL,

 \`establecimiento_id\` int NOT NULL,

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 PRIMARY KEY (\`evaluacion_id\`),

 KEY \`tecnico_id\` (\`tecnico_id\`),

 KEY \`jefe1_id\` (\`jefe1_id\`),

 KEY \`jefe2_id\` (\`jefe2_id\`),

 KEY \`jefe3_id\` (\`jefe3_id\`),

 KEY \`jefe4_id\` (\`jefe4_id\`),

 KEY \`municipio_id\` (\`municipio_id\`),

 KEY \`comunidad_id\` (\`comunidad_id\`),

 KEY \`sede_id\` (\`sede_id\`),

 KEY \`redsalud_id\` (\`redsalud_id\`),

 KEY \`establecimiento_id\` (\`establecimiento_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_1\` FOREIGN KEY
(\`tecnico_id\`) REFERENCES \`Usuarios\` (\`usuario_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_10\` FOREIGN KEY
(\`establecimiento_id\`) REFERENCES \`EstablecimientosSalud\`
(\`establecimiento_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_2\` FOREIGN KEY
(\`jefe1_id\`) REFERENCES \`Usuarios\` (\`usuario_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_3\` FOREIGN KEY
(\`jefe2_id\`) REFERENCES \`Usuarios\` (\`usuario_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_4\` FOREIGN KEY
(\`jefe3_id\`) REFERENCES \`Usuarios\` (\`usuario_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_5\` FOREIGN KEY
(\`jefe4_id\`) REFERENCES \`Usuarios\` (\`usuario_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_6\` FOREIGN KEY
(\`municipio_id\`) REFERENCES \`Municipios\` (\`municipio_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_7\` FOREIGN KEY
(\`comunidad_id\`) REFERENCES \`Comunidades\` (\`comunidad_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_8\` FOREIGN KEY
(\`sede_id\`) REFERENCES \`Sedes\` (\`sede_id\`),

 CONSTRAINT \`Evaluaciones_Entomologicas_ibfk_9\` FOREIGN KEY
(\`redsalud_id\`) REFERENCES \`RedSalud\` (\`redsalud_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

CREATE TABLE \`Formulario_RR1\` (

 \`id_rr1\` int NOT NULL AUTO_INCREMENT,

 \`tecnico_id\` int DEFAULT NULL,

 \`jefe1_id\` int DEFAULT NULL,

 \`jefe2_id\` int DEFAULT NULL,

 \`jefe3_id\` int DEFAULT NULL,

 \`jefe4_id\` int DEFAULT NULL,

 \`municipio_id\` int DEFAULT NULL,

 \`comunidad_id\` int DEFAULT NULL,

 \`sede_id\` int DEFAULT NULL,

 \`redsalud_id\` int DEFAULT NULL,

 \`establecimiento_id\` int DEFAULT NULL,

 \`numero_vivienda\` varchar(20) DEFAULT NULL,

 \`jefe_familia\` varchar(150) DEFAULT NULL,

\`habitantes_protegidos\` int DEFAULT NULL,

 \`cerrada\` tinyint(1) DEFAULT NULL,

 \`renuente\` tinyint(1) DEFAULT NULL,

 \`habitaciones_rociadas\` int DEFAULT NULL,

\`habitaciones_no_rociadas\` int DEFAULT NULL,

 \`habitaciones_total\` int DEFAULT NULL,

 \`corrales\` int DEFAULT NULL,

 \`gallineros\` int DEFAULT NULL,

 \`conejeras\` int DEFAULT NULL,

 \`zarzos_trojes\` int DEFAULT NULL,

\`otros_peridomicilio\` int DEFAULT NULL,

 \`numero_cargas\` int DEFAULT NULL,

 \`cantidad_insecticida\` decimal(10,2) DEFAULT NULL,

 \`firma_conformidad\` varchar(300) DEFAULT NULL,

 \`rociado\` tinyint(1) DEFAULT NULL,

 \`no_rociado\` tinyint(1) DEFAULT NULL,

 \`insecticida_utilizado\` varchar(150) DEFAULT NULL,

 \`lote\` varchar(150) DEFAULT NULL,

 \`dosis\` decimal(18,2) DEFAULT NULL,

 \`estado\` varchar(20) DEFAULT \'activo\',

 \`fecha_registro\` datetime DEFAULT CURRENT_TIMESTAMP,

 PRIMARY KEY (\`id_rr1\`)

) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

CREATE TABLE \`Municipios\` (

 \`municipio_id\` int NOT NULL AUTO_INCREMENT,

 \`nombre_municipio\` varchar(150) NOT NULL,

 \`coordenadas\` varchar(100) DEFAULT NULL,

 \`departamento\` varchar(150) DEFAULT NULL,

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 PRIMARY KEY (\`municipio_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

 

CREATE TABLE \`Notificaciones\` (

 \`notificacion_id\` int NOT NULL AUTO_INCREMENT,

 \`usuario_receptor_id\` int NOT NULL,

 \`tipo_entidad_origen\` varchar(50) NOT NULL,

 \`id_entidad_origen\` varchar(50) NOT NULL,

 \`mensaje\` text NOT NULL,

 \`leida\` tinyint(1) DEFAULT \'0\',

 \`ruta_destino\` varchar(255) DEFAULT NULL,

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 PRIMARY KEY (\`notificacion_id\`),

 KEY \`usuario_receptor_id\` (\`usuario_receptor_id\`),

 CONSTRAINT \`Notificaciones_ibfk_1\` FOREIGN KEY
(\`usuario_receptor_id\`) REFERENCES \`Usuarios\` (\`usuario_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=91 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

CREATE TABLE \`RedSalud\` (

 \`redsalud_id\` int NOT NULL AUTO_INCREMENT,

 \`nombre_red\` varchar(150) NOT NULL,

 \`sede_id\` int NOT NULL,

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 PRIMARY KEY (\`redsalud_id\`),

 KEY \`sede_id\` (\`sede_id\`),

 CONSTRAINT \`RedSalud_ibfk_1\` FOREIGN KEY (\`sede_id\`) REFERENCES
\`Sedes\` (\`sede_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

CREATE TABLE \`RR1_Denuncias\` (

 \`id\` int NOT NULL AUTO_INCREMENT,

 \`rr1_id\` int NOT NULL,

 \`denuncia_id\` int NOT NULL,

 \`fecha_relacion\` timestamp NULL DEFAULT CURRENT_TIMESTAMP,

 PRIMARY KEY (\`id\`),

 UNIQUE KEY \`unique_rr1_denuncia\` (\`rr1_id\`,\`denuncia_id\`),

 KEY \`denuncia_id\` (\`denuncia_id\`),

 CONSTRAINT \`RR1_Denuncias_ibfk_1\` FOREIGN KEY (\`rr1_id\`) REFERENCES
\`Formulario_RR1\` (\`id_rr1\`),

 CONSTRAINT \`RR1_Denuncias_ibfk_2\` FOREIGN KEY (\`denuncia_id\`)
REFERENCES \`Denuncias\` (\`denuncia_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

 

CREATE TABLE \`Sedes\` (

 \`sede_id\` int NOT NULL AUTO_INCREMENT,

 \`nombre_sede\` varchar(150) NOT NULL,

 \`direccion\` varchar(255) DEFAULT NULL,

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 PRIMARY KEY (\`sede_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

CREATE TABLE \`Usuario_Municipio\` (

 \`asignacion_id\` int NOT NULL AUTO_INCREMENT,

 \`usuario_id\` int NOT NULL,

 \`municipio_id\` int NOT NULL,

 \`fecha_asignacion\` date DEFAULT NULL,

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 PRIMARY KEY (\`asignacion_id\`),

 KEY \`usuario_id\` (\`usuario_id\`),

 KEY \`municipio_id\` (\`municipio_id\`),

 CONSTRAINT \`Usuario_Municipio_ibfk_1\` FOREIGN KEY (\`usuario_id\`)
REFERENCES \`Usuarios\` (\`usuario_id\`),

 CONSTRAINT \`Usuario_Municipio_ibfk_2\` FOREIGN KEY (\`municipio_id\`)
REFERENCES \`Municipios\` (\`municipio_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

CREATE TABLE \`Usuarios\` (

 \`usuario_id\` int NOT NULL AUTO_INCREMENT,

 \`nombre_completo\` varchar(150) NOT NULL,

 \`correo_electronico\` varchar(150) NOT NULL,

 \`contrasena\` varchar(255) NOT NULL,

 \`rol\`
enum(\'tecnico\',\'jefe_grupo\',\'administrador\',\'usuario\',\'supervisor\')
NOT NULL,

 \`estado\` enum(\'activo\',\'inactivo\') DEFAULT \'activo\',

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 PRIMARY KEY (\`usuario_id\`),

 UNIQUE KEY \`correo_electronico\` (\`correo_electronico\`)

) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

 

CREATE TABLE \`Viviendas\` (

 \`vivienda_id\` int NOT NULL AUTO_INCREMENT,

 \`numero_vivienda\` varchar(20) DEFAULT NULL,

 \`jefe_familia\` varchar(150) DEFAULT NULL,

 \`direccion\` text,

 \`latitud\` decimal(10,6) DEFAULT NULL,

 \`longitud\` decimal(10,6) DEFAULT NULL,

 \`altura\` decimal(10,2) DEFAULT NULL,

 \`foto_entrada\` varchar(255) DEFAULT NULL,

 \`vivienda_mejorada\` tinyint(1) DEFAULT \'0\',

 \`comunidad_id\` int NOT NULL,

 \`municipio_id\` int DEFAULT NULL,

 \`fecha_creacion\` datetime DEFAULT CURRENT_TIMESTAMP,

 \`fecha_modificacion\` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE
CURRENT_TIMESTAMP,

 \`fotoVinchucas\` varchar(255) DEFAULT NULL COMMENT \'Foto de vinchucas
encontradas\',

 PRIMARY KEY (\`vivienda_id\`),

 KEY \`comunidad_id\` (\`comunidad_id\`),

 CONSTRAINT \`Viviendas_ibfk_1\` FOREIGN KEY (\`comunidad_id\`)
REFERENCES \`Comunidades\` (\`comunidad_id\`)

) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci

Los scripts de generación e inserción de datos se encuentran en la raíz
del proyecto:

- ChagasFinal.sql - Script completo de creación de BD

c\. Script Simple de Base de Datos

**Ponlo tu abajo** (Copiar desde nuevobaseded atosFinal.sql)

**8. LISTADO DE ROLES Y CREDENCIALES**

Roles del Sistema

1.  **administrador** - Acceso total al sistema

2.  **supervisor** - Acceso a su municipio asignado

3.  **jefe_grupo** - Gestión de actividades de campo

4.  **usuario** - Registro de denuncias

Credenciales de Acceso (Ejemplo)

| Rol           | Correo               | Contraseña | Municipio Asignado |
|---------------|----------------------|------------|--------------------|
| administrador | admin@chagas.bo      | Admin123   | Todos              |
| supervisor    | supervisor@chagas.bo | Super123   | Cercado            |
| jefe_grupo    | jefe@chagas.bo       | Jefe123    | \-                 |
| usuario       | usuario@chagas.bo    | User123    | \-                 |

**Nota**: Estas son credenciales de ejemplo. En producción se deben
cambiar inmediatamente.

**9. REQUISITOS DEL SISTEMA**

Requerimientos de Hardware (Cliente)

- **Procesador**: Intel Core i3 o equivalente (mínimo)

- **RAM**: 4 GB (mínimo), 8 GB (recomendado)

- **Disco**: 500 MB de espacio libre

- **Conectividad**: Conexión a Internet estable (mínimo 2 Mbps)

- **Pantalla**: Resolución mínima 1366x768

Requerimientos de Software (Cliente)

- **Sistema Operativo**: Windows 10/11, macOS 10.15+, Linux (Ubuntu
  20.04+)

- **Navegador Web** (una de las siguientes versiones):

  - Google Chrome 90+ (recomendado)

  - Mozilla Firefox 88+

  - Microsoft Edge 90+

  - Safari 14+

- **JavaScript**: Habilitado

- **Cookies**: Habilitadas para sesiones

Requerimientos de Hardware (Server/Hosting)

- **Procesador**: 2 vCPU (mínimo), 4 vCPU (recomendado)

- **RAM**: 2 GB (mínimo), 4 GB (producción)

- **Disco**: 20 GB SSD

- **Ancho de Banda**: 100 GB/mes (mínimo)

- **Conectividad**: 100 Mbps

Requerimientos de Software (Server/Hosting/BD)

- **Sistema Operativo**: Linux Ubuntu 20.04 LTS o superior

- **Node.js**: v18.x o superior

- **MySQL**: 8.0 o superior

- **npm**: 9.x o superior

- **SSL/TLS**: Certificado válido para HTTPS

**10. INSTALACIÓN Y CONFIGURACIÓN**

Paso 1: Clonar el Repositorio

git clone https://github.com/tuusuario/PS3-CHAGAS.git

cd PS3-CHAGAS

Paso 2: Instalación del Frontend

cd Chagas

npm install

Paso 3: Instalación del Backend

cd ../Sedes-ChagasBackend

npm install

Paso 4: Configuración de Variables de Entorno

**Backend** - Crear archivo .env en Sedes-ChagasBackend/:

\# Base de Datos

DB_HOST=localhost

DB_USER=root

DB_PASSWORD=tu_password

DB_NAME=chagas_bd

DB_PORT=3306

\# Servidor

PORT=5000

NODE_ENV=development

\# Email (Nodemailer)

EMAIL_USER=tu_correo@gmail.com

EMAIL_PASSWORD=tu_app_password

EMAIL_FROM=\"Sistema Chagas \<noreply@chagas.bo\>\"

\# Frontend URL

FRONTEND_URL=http://localhost:5173

**Frontend** - Crear archivo .env en Chagas/:

VITE_API_URL=http://localhost:5000

Paso 5: Creación de Base de Datos

\# Ejecutar script SQL

mysql -u root -p \< nuevobasededatosFinal.sql

\# O usar el script batch provisto

ejecutar_script_mysql.bat

Paso 6: Iniciar Servidores

**Backend**:

cd Sedes-ChagasBackend

npm start

**Frontend**:

cd Chagas

npm run dev

Paso 7: Acceder al Sistema

Abrir navegador en: http://localhost:5173

**11. PROCEDIMIENTO DE HOSTEADO / HOSTING  
Sola base de Datos en Railway (Por Mauricio Coca)**

**12. GIT**

Estructura de Ramas

- **main**: Versión estable

Compilados Ejecutables

Ubicación:Descargar el proyecto en el disco C  
Base de Datos:Crear base de datos copiar  
Backend: C:\PS3-CHAGAS\Sedes-ChagasBackend (npm install -npm run dev)  
FrontEnd: C:\PS3-CHAGAS\Chagas (npm install -npm run dev)

Comandos Útiles

\# Clonar proyecto el main

git clone https://github.com/LuzLaredo/Chagas

**14. PERSONALIZACIÓN Y CONFIGURACIÓN**

Temas y Estilos

- Archivos CSS en: Chagas/src/css/

- Paleta de colores principal: Rojo (#dc2626) y Verde (#10b981)

- Fuente: Poppins (Google Fonts)

- Modificar NavBar.css, Home.css, etc. para personalizar

Configuración de Mapas

// Cambiar proveedor de tiles en componentes de mapas

L.tileLayer(\'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png\', {

attribution: \'© OpenStreetMap\'

})

Configuración de Email

Editar .env del backend:

EMAIL_USER=tucorreo@empresa.com

EMAIL_PASSWORD=tu_app_password

EMAIL_FROM=\"Sistema Chagas \<noreply@chagas.bo\>\"

Agregar Municipios/Sedes

Usar panel de administración o ejecutar SQL:

INSERT INTO municipios (nombre, id_red_salud)

VALUES (\'Nuevo Municipio\', 1);

**15. SEGURIDAD**

Consideraciones Implementadas

1.  **Autenticación**: Sistema de login basado en sesiones

2.  **CORS**: Configurado para permitir solo dominios autorizados

3.  **Sanitización**: Validación de inputs en backend

4.  **HTTPS**: Requerido en producción

5.  **Variables de Entorno**: Credenciales nunca en código

Recomendaciones

**En Producción**:

- Cambiar todas las contraseñas por defecto

- Habilitar HTTPS con certificado válido

- Configurar firewall para restringir puertos

- Implementar rate limiting en API

- Realizar backups diarios de la base de datos

- Monitorear logs de acceso

- Actualizar dependencias regularmente: npm audit fix

**Permisos de Acceso**:

// Control de acceso por rol en routing

const protectedRoute = useRouteAccess(\[\'administrador\',
\'supervisor\'\]);

**16. DEPURACIÓN Y SOLUCIÓN DE PROBLEMAS**

Problemas Comunes

**1. Error de Conexión a Base de Datos**

Error: connect ECONNREFUSED 127.0.0.1:3306

**Solución**:

- Verificar que MySQL esté ejecutándose: service mysql status

- Confirmar credenciales

- Verificar firewall: puerto 5000 debe estar abierto

**2. CORS Error**

Access to fetch blocked by CORS policy

**Solución**:

- Verificar FRONTEND_URL 

- Confirmar configuración CORS en index.js

**3. Cannot GET /api/**\*

404 Not Found

**Solución**:

- Verificar que backend esté corriendo

- Confirmar VITE_API_URL en frontend .env

**4. Mapa no se visualiza** **Solución**:

- Verificar conexión a Internet

- Revisar console del navegador

- Confirmar que Leaflet CSS esté cargado

Mensajes de Error Frecuentes

| Error                    | Causa                       | Solución                             |
|--------------------------|-----------------------------|--------------------------------------|
| Cannot find module       | Dependencia faltante        | npm install                          |
| Port 5000 already in use | Puerto ocupado              | Cambiar PORT en .env o matar proceso |
| Invalid credentials      | Usuario/password incorrecto | Verificar en tabla usuarios          |
| Token expired            | Sesión caducada             | Hacer login nuevamente               |

**17. GLOSARIO DE TÉRMINOS**

- **CHAGAS**: Programa Nacional de Control de la Enfermedad de Chagas

- **EE1/EE2/EE3**: Evaluaciones Entomológicas (tipos 1, 2, 3)

- **RR1/RR2/RR3**: Rociado Residual (tipos 1, 2, 3)

- **Vector**: Insecto transmisor de la enfermedad (vinchuca)

- **Rociado**: Aplicación de insecticida

- **Peridomicilio**: Área alrededor de la vivienda

- **RBAC**: Role-Based Access Control (Control de Acceso Basado en
  Roles)

- **API**: Application Programming Interface

- **CRUD**: Create, Read, Update, Delete

- **JWT**: JSON Web Token (para autenticación)

- **SPA**: Single Page Application

**18. REFERENCIAS Y RECURSOS ADICIONALES**

Documentación Oficial

- React: <https://react.dev/>

- Vite: <https://vitejs.dev/>

- Express: <https://expressjs.com/>

- MySQL: <https://dev.mysql.com/doc/>

- Leaflet: <https://leafletjs.com/>

- Nivo Charts: <https://nivo.rocks/>

Tutoriales

- React Router: <https://reactrouter.com/>

- Node.js Best
  Practices: <https://github.com/goldbergyoni/nodebestpractices>

Foros de Soporte

- Stack Overflow: <https://stackoverflow.com/questions/tagged/react>

- GitHub Issues: (enlace a tu repositorio)

**19. HERRAMIENTAS DE IMPLEMENTACIÓN**

Lenguajes de Programación

- **JavaScript** (ES6+)

- **SQL** (MySQL)

- **HTML5** / **CSS3**

Frameworks y Bibliotecas

**Frontend**:

- React 19.1.1

- React Router DOM 7.8.2

- Vite 7.1.2

**Backend**:

- Express 5.1.0

- MySQL2 3.15.0

- Nodemailer 7.0.10

**UI/UX**:

- HeroUI 2.8.4

- Iconify React 6.0.2

- React Icons 5.5.0

- Poppins Font

**Mapas**:

- Leaflet 1.9.4

- React-Leaflet 5.0.0

- Google Maps API 2.20.7

**Gráficos y Visualización**:

- Nivo (Bar, Line, Pie, Radar, Sankey, etc.) 0.99.0

- Chart.js 4.5.1

- React-Chartjs-2 5.3.1

**Exportación**:

- jsPDF 3.0.3

- jsPDF-AutoTable 5.0.2

- html2canvas 1.4.1

**Desarrollo**:

- ESLint 9.33.0

- Vite Plugin React 5.0.0

APIs de Terceros

- **OpenStreetMap**: Tiles para mapas

- **Google Maps API**: Servicios de geocodificación

- **Nodemailer**: Envío de correos electrónicos

**20. BIBLIOGRAFÍA**

1.  **MDN Web Docs** - JavaScript y Web APIs.
    Mozilla. <https://developer.mozilla.org/>

2.  **React Documentation** - Official React Guide.
    Meta. <https://react.dev/>

3.  **Node.js Documentation** - Official Node.js Documentation. OpenJS
    Foundation. <https://nodejs.org/docs/>

4.  **MySQL Reference Manual** - MySQL 8.0 Reference.
    Oracle. <https://dev.mysql.com/doc/refman/8.0/>

5.  **Express.js Guide** - Official Express
    Documentation. <https://expressjs.com/>

6.  **Leaflet Documentation** - Interactive Map
    Library. <https://leafletjs.com/reference.html>

7.  **Vite Guide** - Next Generation Frontend
    Tooling. <https://vitejs.dev/guide/>

8.  **OWASP** - Web Application Security Best
    Practices. <https://owasp.org/>

**Documento Elaborado por**: Luz Esmeralda Laredo Hinojosa  
**Última Actualización**: Diciembre 2025  
**Versión del Sistema**Ultima
