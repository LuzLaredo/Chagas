// ===========================================================
// controllers/rr1Controller.js - CON REDIRECCIÓN POR ROL
// ===========================================================

import {
    crearFormularioRR1,
    obtenerFormulariosRR1,
    obtenerFormularioRR1PorId
} from "../models/rr1Model.js";
import db from "../config/db.js";

// 🆕 IMPORTAR MODELO DE NOTIFICACIONES
import { crearNotificacion, obtenerTecnicosPorMunicipio } from "../models/notificacionesModel.js";

// ===========================================================
// 🔄 FUNCIÓN AUXILIAR PARA ACTUALIZAR ESTADOS POST-RR1
// ===========================================================
const actualizarEstadosPostRR1 = async (vivienda_id, denuncia_id, rociado, no_rociado, rr1_id) => {
    return new Promise(async (resolve, reject) => {
        try {
            console.log("🔄 Actualizando estados post-RR1:", {
                vivienda_id,
                denuncia_id,
                rociado,
                no_rociado,
                rr1_id
            });

            const actualizaciones = [];

            // 1. ACTUALIZAR ESTADO DE LA DENUNCIA
            if (denuncia_id) {
                let nuevoEstadoDenuncia = rociado ? 'realizada' : (no_rociado ? 'en_proceso' : 'verificado');

                const queryDenuncia = `
                    UPDATE Denuncias 
                    SET estado_denuncia = ?, fecha_ejecucion = NOW(), fecha_modificacion = NOW()
                    WHERE denuncia_id = ?
                `;

                actualizaciones.push(
                    new Promise((resolveDenuncia, rejectDenuncia) => {
                        db.query(queryDenuncia, [nuevoEstadoDenuncia, denuncia_id], (err, result) => {
                            if (err) {
                                console.error("❌ Error al actualizar denuncia:", err);
                                rejectDenuncia(err);
                            } else {
                                console.log(`✅ Denuncia ${denuncia_id} actualizada a estado: ${nuevoEstadoDenuncia}`);
                                resolveDenuncia();
                            }
                        });
                    })
                );
            }

            // 2. ACTUALIZAR ESTADO DE LA VIVIENDA
            if (vivienda_id) {
                let nuevoEstadoVivienda = rociado ? 'rociada' : 'en_proceso';

                const queryVivienda = `
                    UPDATE Viviendas 
                    SET estado = ?, fecha_modificacion = NOW()
                    WHERE vivienda_id = ?
                `;

                actualizaciones.push(
                    new Promise((resolveVivienda, rejectVivienda) => {
                        db.query(queryVivienda, [nuevoEstadoVivienda, vivienda_id], (err, result) => {
                            if (err) {
                                console.error("❌ Error al actualizar vivienda:", err);
                                rejectVivienda(err);
                            } else {
                                console.log(`✅ Vivienda ${vivienda_id} actualizada a estado: ${nuevoEstadoVivienda}`);
                                resolveVivienda();
                            }
                        });
                    })
                );
            }

            // 3. REGISTRAR RELACIÓN RR1-DENUNCIA
            if (denuncia_id && rr1_id) {
                const queryRelacion = `
                    INSERT INTO RR1_Denuncias (rr1_id, denuncia_id, fecha_relacion)
                    VALUES (?, ?, NOW())
                `;

                actualizaciones.push(
                    new Promise((resolveRelacion, rejectRelacion) => {
                        db.query(queryRelacion, [rr1_id, denuncia_id], (err, result) => {
                            if (err && err.code !== "ER_DUP_ENTRY") {
                                console.error("❌ Error al crear relación RR1-Denuncia:", err);
                                resolveRelacion();
                            } else {
                                console.log(`✅ Relación RR1-Denuncia creada o ya existía.`);
                                resolveRelacion();
                            }
                        });
                    })
                );
            }

            await Promise.allSettled(actualizaciones);
            console.log("🎉 Todas las actualizaciones post-RR1 completadas");
            resolve();

        } catch (error) {
            console.error("💥 Error en actualización de estados:", error);
            reject(error);
        }
    });
};

// ===========================================================
// 🔸 CREAR RR1 CON REDIRECCIÓN POR ROL
// ===========================================================
export const crearRR1 = async (req, res) => {
    try {
        const {
            sede_id, redsalud_id, establecimiento_id,
            municipio_id, comunidad_id, numero_vivienda, jefe_familia,
            habitantes_protegidos, cerrada, renuente, habitaciones_rociadas,
            habitaciones_no_rociadas, corrales, gallineros, conejeras,
            zarzos_trojes, otros_peridomicilio, numero_cargas,
            cantidad_insecticida, firma_conformidad, rociado, no_rociado,
            insecticida_utilizado, lote, dosis, tecnico_id, jefe1_id, jefe2_id, jefe3_id, jefe4_id,
            vivienda_id, denuncia_id
        } = req.body;

        // Validaciones básicas
        if (!numero_vivienda || !jefe_familia || !tecnico_id) {
            return res.status(400).json({
                error: "Faltan campos obligatorios: numero_vivienda, jefe_familia, tecnico_id"
            });
        }

        // Si la vivienda está cerrada, renuente o no rociada, poner todos los valores en 0
        const isViviendaNoDisponible = cerrada || renuente || no_rociado;

        // Calcular total de habitaciones
        const habitaciones_total = isViviendaNoDisponible ? 0 :
            (parseInt(habitaciones_rociadas) || 0) + (parseInt(habitaciones_no_rociadas) || 0);

        // 🆕 NUEVO: Log mejorado con información del insecticida
        console.log("🔧 Procesando datos RR1:", {
            vivienda_no_disponible: isViviendaNoDisponible,
            total_habitaciones: habitaciones_total,
            rociado: rociado,
            no_rociado: no_rociado,
            cerrada: cerrada,
            renuente: renuente,
            vivienda_id: vivienda_id,
            denuncia_id: denuncia_id,
            // 🆕 INFORMACIÓN DEL INSECTICIDA
            insecticida: insecticida_utilizado,
            dosis: dosis,
            cantidad_insecticida: cantidad_insecticida,
            numero_cargas: numero_cargas,
            lote: lote,
            timestamp: new Date().toISOString()
        });

        // 🆕 NUEVO: Función para obtener unidad del insecticida
        const getUnidadInsecticida = (insecticida) => {
            switch (insecticida) {
                case "LAMBDACIALOTRINA": return "ml";
                case "BENDIOCARB": return "gr";
                case "OTRO": return "unidades";
                default: return "ml";
            }
        };

        const unidadInsecticida = getUnidadInsecticida(insecticida_utilizado);
        console.log(`🔧 Insecticida: ${insecticida_utilizado}, Unidad: ${unidadInsecticida}, Cantidad: ${cantidad_insecticida}`);

        // Crear formulario principal
        crearFormularioRR1({
            tecnico_id: parseInt(tecnico_id),
            jefe1_id: parseInt(jefe1_id) || null, jefe2_id: parseInt(jefe2_id) || null,
            jefe3_id: parseInt(jefe3_id) || null, jefe4_id: parseInt(jefe4_id) || null,
            sede_id: parseInt(sede_id) || 1, redsalud_id: parseInt(redsalud_id) || 1,
            establecimiento_id: parseInt(establecimiento_id) || 1,
            municipio_id: parseInt(municipio_id) || 1, comunidad_id: parseInt(comunidad_id) || 1,
            numero_vivienda, jefe_familia,
            habitantes_protegidos: parseInt(habitantes_protegidos) || 0,
            cerrada: cerrada ? 1 : 0, renuente: renuente ? 1 : 0,
            habitaciones_rociadas: isViviendaNoDisponible ? 0 : parseInt(habitaciones_rociadas) || 0,
            habitaciones_no_rociadas: isViviendaNoDisponible ? 0 : parseInt(habitaciones_no_rociadas) || 0,
            habitaciones_total: habitaciones_total,
            corrales: isViviendaNoDisponible ? 0 : parseInt(corrales) || 0,
            gallineros: isViviendaNoDisponible ? 0 : parseInt(gallineros) || 0,
            conejeras: isViviendaNoDisponible ? 0 : parseInt(conejeras) || 0,
            zarzos_trojes: isViviendaNoDisponible ? 0 : parseInt(zarzos_trojes) || 0,
            otros_peridomicilio: isViviendaNoDisponible ? 0 : parseInt(otros_peridomicilio) || 0,
            numero_cargas: isViviendaNoDisponible ? 0 : parseInt(numero_cargas) || 0,
            cantidad_insecticida: isViviendaNoDisponible ? 0 : parseFloat(cantidad_insecticida) || 0,
            firma_conformidad: firma_conformidad || "",
            rociado: rociado ? 1 : 0, no_rociado: no_rociado ? 1 : 0,
            insecticida_utilizado: insecticida_utilizado || "", lote: lote || "",
            dosis: isViviendaNoDisponible ? 0 : parseFloat(dosis) || 0,
            estado: rociado ? 'activo' : 'inactivo'
        }, async (err, resultado) => {
            if (err) {
                console.error("❌ Error al crear formulario RR1:", err);
                return res.status(500).json({
                    error: "Error al crear formulario RR1", details: err.sqlMessage || err.message, sql: err.sql
                });
            }

            const rr1Id = resultado.insertId;
            console.log("✅ Formulario RR1 creado exitosamente:", {
                id_rr1: rr1Id,
                insecticida: insecticida_utilizado,
                dosis: dosis,
                cantidad: cantidad_insecticida,
                unidad: unidadInsecticida
            });

            // 🔔 NOTIFICAR AL DENUNCIANTE SI ES CASA CERRADA O RENUENTE
            if ((cerrada || renuente) && denuncia_id) {
                const queryDenunciante = `
                    SELECT d.usuario_id, v.numero_vivienda 
                    FROM Denuncias d 
                    JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
                    WHERE d.denuncia_id = ?
                `;

                db.query(queryDenunciante, [denuncia_id], (errUser, resultUser) => {
                    if (!errUser && resultUser.length > 0) {
                        const info = resultUser[0];
                        const razon = cerrada ? 'Casa Cerrada' : 'Renuente';
                        const mensaje = `Visita Fallida: El rociado en la vivienda N° ${info.numero_vivienda} no se pudo completar por ${razon}.`;

                        // 1. Notificar al Denunciante
                        crearNotificacion({
                            usuario_receptor_id: info.usuario_id,
                            tipo_entidad_origen: 'rociado_fallido',
                            id_entidad_origen: info.numero_vivienda,
                            mensaje: mensaje,
                            ruta_destino: '/denuncia'
                        }, (errNoti) => {
                            if (errNoti) console.error(`❌ Falló notificación de rociado fallido:`, errNoti);
                            else console.log(`✅ Notificación de rociado fallido enviada al denunciante ${info.usuario_id}.`);
                        });
                    }
                });
            }

            // 🔔 NOTIFICACIÓN GRUPAL A TÉCNICOS/SUPERVISORES (CUALQUIER CASO DE FALLA)
            if (cerrada || renuente) {
                const razon = cerrada ? 'Casa Cerrada' : 'Renuente';
                obtenerTecnicosPorMunicipio(municipio_id, (errGroup, userGroup) => {
                    if (!errGroup && userGroup.length > 0) {
                        userGroup.forEach(user => {
                            crearNotificacion({
                                usuario_receptor_id: user.usuario_id,
                                tipo_entidad_origen: 'rociado_fallido_grupal',
                                id_entidad_origen: numero_vivienda, // O id_rr1
                                mensaje: `ALERTA: Visita fallida en vivienda N° ${numero_vivienda}. Razón: ${razon}.`,
                                ruta_destino: '/admin/rr2'
                            }, () => { });
                        });
                        console.log(`✅ Notificaciones grupales de falla enviadas a ${userGroup.length} usuarios.`);
                    }
                });
            }

            // ✅ ACTUALIZAR ESTADOS DE DENUNCIA Y VIVIENDA
            try {
                await actualizarEstadosPostRR1(vivienda_id, denuncia_id, rociado, no_rociado, rr1Id);

                // 🎯 DETERMINAR REDIRECCIÓN BASADA EN ROL DEL USUARIO
                const usuarioId = req.user?.usuario_id;
                let redireccion = "/admin/rr2"; // Por defecto

                if (usuarioId) {
                    const queryRol = `SELECT rol FROM Usuarios WHERE usuario_id = ?`;

                    db.query(queryRol, [usuarioId], (errRol, resultRol) => {
                        if (!errRol && resultRol.length > 0) {
                            const rolUsuario = resultRol[0].rol;

                            if (rolUsuario === 'tecnico') {
                                redireccion = "/CargaRociado";
                            } else if (rolUsuario === 'jefe_grupo' || rolUsuario === 'administrador') {
                                redireccion = "/admin/rr2";
                            }

                            console.log(`🔄 Redirigiendo usuario ${rolUsuario} a: ${redireccion}`);

                            res.status(201).json({
                                message: "Formulario RR1 creado exitosamente",
                                id_rr1: rr1Id,
                                vivienda_no_disponible: isViviendaNoDisponible,
                                fecha_registro: new Date().toISOString(),
                                redireccion: redireccion,
                                // 🆕 NUEVO: Información adicional del insecticida
                                insecticida_info: {
                                    tipo: insecticida_utilizado,
                                    dosis: dosis,
                                    cantidad: cantidad_insecticida,
                                    unidad: unidadInsecticida
                                }
                            });
                        } else {
                            // Si no se puede obtener el rol, usar redirección por defecto
                            console.log("⚠️ No se pudo obtener el rol del usuario, usando redirección por defecto");
                            res.status(201).json({
                                message: "Formulario RR1 creado exitosamente",
                                id_rr1: rr1Id,
                                redireccion: redireccion
                            });
                        }
                    });
                } else {
                    // Si no hay usuario ID, usar redirección por defecto
                    console.log("⚠️ No hay usuario ID en la request, usando redirección por defecto");
                    res.status(201).json({
                        message: "Formulario RR1 creado exitosamente",
                        id_rr1: rr1Id,
                        redireccion: redireccion
                    });
                }

            } catch (error) {
                console.error("⚠️ Formulario RR1 creado pero error en actualización de estados:", error);
                res.status(201).json({
                    message: "Formulario RR1 creado, pero hubo un error en la actualización de estados",
                    id_rr1: rr1Id,
                    warning: "Error en actualización de estados",
                    redireccion: "/admin/rr2"
                });
            }
        });

    } catch (error) {
        console.error("💥 Error general en RR1:", error);
        res.status(500).json({
            error: "Error interno del servidor", details: error.message
        });
    }
};

// ===========================================================
// 🔸 FUNCIONES RESTANTES (sin cambios)
// ===========================================================

// Obtener todos los formularios RR1
// En controllers/rr1Controller.js, modifica obtenerFormulariosRR1 en el modelo o aquí mismo:

// Obtener todos los formularios RR1
// En rr1Controller.js, modifica la función obtenerRR1:
export const obtenerRR1 = (req, res) => {
    const usuarioId = req.user?.usuario_id;
    const rol = req.user?.rol;

    console.log("📋 Solicitando formularios RR1 para usuario:", { usuarioId, rol });

    let query = `
    SELECT 
      fr.*,
      DATE_FORMAT(fr.fecha_registro, '%d/%m/%Y') as fecha_registro_formateada,
      u2.nombre_completo as jefe1_nombre
    FROM Formulario_RR1 fr
    LEFT JOIN Usuarios u2 ON fr.jefe1_id = u2.usuario_id
    WHERE fr.estado = 'activo'
  `;

    const queryParams = [];

    // Si NO es administrador, filtrar por municipios asignados
    if (rol !== 'administrador' && usuarioId) {
        query += `
      AND fr.municipio_id IN (
        SELECT um.municipio_id 
        FROM Usuario_Municipio um 
        WHERE um.usuario_id = ?
      )
    `;
        queryParams.push(usuarioId);
    }

    query += ` ORDER BY fr.fecha_registro DESC`;

    console.log("🔍 Query SQL:", query);
    console.log("📊 Parámetros:", queryParams);

    db.query(query, queryParams, (err, formularios) => {
        if (err) {
            console.error("❌ Error al obtener formularios RR1:", err);
            return res.status(500).json({
                error: "Error al obtener formularios",
                details: err.message
            });
        }

        console.log(`✅ ${formularios.length} formularios RR1 obtenidos`);
        res.json(formularios);
    });
};

// Obtener un formulario RR1 específico
export const obtenerRR1PorId = (req, res) => {
    const { id } = req.params;
    obtenerFormularioRR1PorId(id, (err, formulario) => {
        if (err) { return res.status(500).json({ error: "Error al obtener formulario", details: err.message }); }
        if (!formulario) { return res.status(404).json({ error: "Formulario no encontrado" }); }
        res.json(formulario);
    });
};

// Actualizar formulario RR1
// Actualizar formulario RR1
// Actualizar formulario RR1 - VERSIÓN FINAL CORREGIDA
// Actualizar formulario RR1 - SIN RELACIÓN RR1_DENUNCIAS
// Actualizar formulario RR1 - VERSIÓN COMPLETA CORREGIDA
// Actualizar formulario RR1 - VERSIÓN COMPLETA CON RELACIÓN RR1_DENUNCIAS
export const actualizarRR1 = async (req, res) => {
    const { id } = req.params;

    try {
        const {
            sede_id, redsalud_id, establecimiento_id,
            municipio_id, comunidad_id, numero_vivienda, jefe_familia,
            habitantes_protegidos, cerrada, renuente, habitaciones_rociadas,
            habitaciones_no_rociadas, corrales, gallineros, conejeras,
            zarzos_trojes, otros_peridomicilio, numero_cargas,
            cantidad_insecticida, firma_conformidad, rociado, no_rociado,
            insecticida_utilizado, lote, dosis, tecnico_id, jefe1_id, jefe2_id, jefe3_id, jefe4_id,
            denuncia_id
        } = req.body;

        console.log(`🔄 Actualizando formulario RR1 ID: ${id}`, {
            rociado: typeof rociado === 'boolean' ? (rociado ? 'true' : 'false') : rociado,
            no_rociado: typeof no_rociado === 'boolean' ? (no_rociado ? 'true' : 'false') : no_rociado,
            denuncia_id: denuncia_id || 'NINGUNA',
            cerrada: cerrada,
            renuente: renuente,
            timestamp: new Date().toISOString()
        });

        // Convertir booleanos a números (0 o 1)
        const rociadoNum = rociado === true || rociado === 1 || rociado === '1' ? 1 : 0;
        const no_rociadoNum = no_rociado === true || no_rociado === 1 || no_rociado === '1' ? 1 : 0;
        const cerradaNum = cerrada === true || cerrada === 1 || cerrada === '1' ? 1 : 0;
        const renuenteNum = renuente === true || renuente === 1 || renuente === '1' ? 1 : 0;

        console.log(`🔢 Valores convertidos: rociado=${rociadoNum}, no_rociado=${no_rociadoNum}, cerrada=${cerradaNum}, renuente=${renuenteNum}`);

        // 1. OBTENER DATOS ACTUALES DEL RR1
        const queryObtenerActual = `
            SELECT 
                municipio_id, comunidad_id, numero_vivienda, 
                jefe1_id, tecnico_id, jefe2_id, jefe3_id, jefe4_id
            FROM Formulario_RR1 
            WHERE id_rr1 = ?
        `;

        db.query(queryObtenerActual, [id], (errActual, resultsActual) => {
            if (errActual) {
                console.error(`❌ Error al obtener datos actuales RR1 ID ${id}:`, errActual);
                return res.status(500).json({
                    error: "Error al verificar datos actuales",
                    details: errActual.message
                });
            }

            if (resultsActual.length === 0) {
                return res.status(404).json({ error: "Formulario no encontrado" });
            }

            const datosActuales = resultsActual[0];

            // 2. MANTENER LOS CAMPOS INMUTABLES
            const camposInmutables = {
                municipio_id: datosActuales.municipio_id,
                comunidad_id: datosActuales.comunidad_id,
                numero_vivienda: datosActuales.numero_vivienda,
                jefe1_id: datosActuales.jefe1_id,
                tecnico_id: datosActuales.tecnico_id,
                jefe2_id: datosActuales.jefe2_id,
                jefe3_id: datosActuales.jefe3_id,
                jefe4_id: datosActuales.jefe4_id
            };

            console.log("📌 Campos inmutables:", camposInmutables);

            const isViviendaNoDisponible = cerradaNum === 1 || renuenteNum === 1 || no_rociadoNum === 1;
            const habitaciones_total = isViviendaNoDisponible ? 0 :
                (parseInt(habitaciones_rociadas) || 0) + (parseInt(habitaciones_no_rociadas) || 0);

            // 3. ACTUALIZAR EL FORMULARIO RR1
            const queryActualizarRR1 = `
                UPDATE Formulario_RR1 SET
                    sede_id = ?, redsalud_id = ?, establecimiento_id = ?,
                    municipio_id = ?, comunidad_id = ?, numero_vivienda = ?, jefe_familia = ?,
                    habitantes_protegidos = ?, cerrada = ?, renuente = ?, habitaciones_rociadas = ?,
                    habitaciones_no_rociadas = ?, habitaciones_total = ?, corrales = ?, gallineros = ?,
                    conejeras = ?, zarzos_trojes = ?, otros_peridomicilio = ?, numero_cargas = ?,
                    cantidad_insecticida = ?, firma_conformidad = ?, rociado = ?, no_rociado = ?,
                    insecticida_utilizado = ?, lote = ?, dosis = ?, estado = ?
                WHERE id_rr1 = ?
            `;

            const valoresRR1 = [
                parseInt(sede_id) || null,
                parseInt(redsalud_id) || null,
                parseInt(establecimiento_id) || null,
                camposInmutables.municipio_id, // Inmutable
                camposInmutables.comunidad_id, // Inmutable
                camposInmutables.numero_vivienda, // Inmutable
                jefe_familia,
                parseInt(habitantes_protegidos) || 0,
                cerradaNum,
                renuenteNum,
                isViviendaNoDisponible ? 0 : parseInt(habitaciones_rociadas) || 0,
                isViviendaNoDisponible ? 0 : parseInt(habitaciones_no_rociadas) || 0,
                habitaciones_total,
                isViviendaNoDisponible ? 0 : parseInt(corrales) || 0,
                isViviendaNoDisponible ? 0 : parseInt(gallineros) || 0,
                isViviendaNoDisponible ? 0 : parseInt(conejeras) || 0,
                isViviendaNoDisponible ? 0 : parseInt(zarzos_trojes) || 0,
                isViviendaNoDisponible ? 0 : parseInt(otros_peridomicilio) || 0,
                isViviendaNoDisponible ? 0 : parseInt(numero_cargas) || 0,
                isViviendaNoDisponible ? 0 : parseFloat(cantidad_insecticida) || 0,
                firma_conformidad || "",
                rociadoNum,
                no_rociadoNum,
                insecticida_utilizado || "",
                lote || "",
                isViviendaNoDisponible ? 0 : parseFloat(dosis) || 0,
                'activo',
                parseInt(id)
            ];

            console.log("📊 Valores para actualizar RR1:", valoresRR1.slice(-10));

            // 4. EJECUTAR ACTUALIZACIÓN DEL RR1
            db.query(queryActualizarRR1, valoresRR1, (errRR1, resultRR1) => {
                if (errRR1) {
                    console.error(`❌ Error al actualizar formulario RR1 ID ${id}:`, errRR1);
                    return res.status(500).json({
                        error: "Error al actualizar formulario",
                        details: errRR1.message,
                        sql: errRR1.sql
                    });
                }

                if (resultRR1.affectedRows === 0) {
                    return res.status(404).json({ error: "Formulario no encontrado" });
                }

                console.log(`✅ Formulario RR1 ID ${id} actualizado exitosamente, filas afectadas: ${resultRR1.affectedRows}`);

                // 5. ACTUALIZAR DENUNCIA Y CREAR RELACIÓN (SI SE PROPORCIONA denuncia_id)
                if (denuncia_id) {
                    // 🎯 SOLO ACTUALIZAR DENUNCIA SI ESTÁ MARCADO COMO "ROCIADO"
                    if (rociadoNum === 1) {
                        const queryActualizarDenuncia = `
                            UPDATE Denuncias 
                            SET estado_denuncia = 'realizada', 
                                fecha_ejecucion = NOW(), 
                                fecha_modificacion = NOW()
                            WHERE denuncia_id = ?
                        `;

                        console.log(`🎯 Actualizando denuncia ${denuncia_id} a estado: realizada`);

                        db.query(queryActualizarDenuncia, [denuncia_id], (errDenuncia, resultDenuncia) => {
                            if (errDenuncia) {
                                console.error(`❌ Error al actualizar denuncia ID ${denuncia_id}:`, errDenuncia);

                                // 🆕 Aún así, intentar crear la relación
                                const queryCrearRelacion = `
                                    INSERT INTO RR1_Denuncias (rr1_id, denuncia_id, fecha_relacion)
                                    VALUES (?, ?, NOW())
                                    ON DUPLICATE KEY UPDATE fecha_relacion = NOW()
                                `;

                                db.query(queryCrearRelacion, [id, denuncia_id], (errRelacion) => {
                                    if (errRelacion) {
                                        console.error(`❌ Error al crear/actualizar relación RR1-Denuncia:`, errRelacion);
                                    } else {
                                        console.log(`✅ Relación RR1-Denuncia creada/actualizada: RR1=${id}, Denuncia=${denuncia_id}`);
                                    }

                                    // Responder con advertencia
                                    return res.json({
                                        message: "Formulario RR1 actualizado, pero error al actualizar denuncia",
                                        id_rr1: id,
                                        warning: "Error al actualizar estado de denuncia, pero se creó la relación",
                                        estado_rr1: 'activo',
                                        rociado: rociadoNum,
                                        no_rociado: no_rociadoNum,
                                        denuncia_id: denuncia_id,
                                        error_details: errDenuncia.message
                                    });
                                });
                            } else {
                                console.log(`✅ Denuncia ${denuncia_id} actualizada a estado: realizada, filas afectadas: ${resultDenuncia.affectedRows}`);

                                // 🆕 CREAR/ACTUALIZAR RELACIÓN EN RR1_DENUNCIAS
                                const queryCrearRelacion = `
                                    INSERT INTO RR1_Denuncias (rr1_id, denuncia_id, fecha_relacion)
                                    VALUES (?, ?, NOW())
                                    ON DUPLICATE KEY UPDATE fecha_relacion = NOW()
                                `;

                                db.query(queryCrearRelacion, [id, denuncia_id], (errRelacion) => {
                                    if (errRelacion) {
                                        console.error(`❌ Error al crear/actualizar relación RR1-Denuncia:`, errRelacion);

                                        // Aún así responder éxito
                                        return res.json({
                                            message: "Formulario RR1 y denuncia actualizados exitosamente, pero error en relación",
                                            id_rr1: id,
                                            warning: "Error al crear relación RR1-Denuncia",
                                            estado_rr1: 'activo',
                                            estado_denuncia: 'realizada',
                                            rociado: rociadoNum,
                                            no_rociado: no_rociadoNum,
                                            cerrada: cerradaNum,
                                            renuente: renuenteNum,
                                            denuncia_id: denuncia_id
                                        });
                                    } else {
                                        console.log(`✅ Relación RR1-Denuncia creada/actualizada: RR1=${id}, Denuncia=${denuncia_id}`);

                                        // 🆕 NOTIFICAR AL DENUNCIANTE SI ES NECESARIO
                                        if (cerradaNum === 1 || renuenteNum === 1) {
                                            const queryDenunciante = `
                                                SELECT d.usuario_id, v.numero_vivienda 
                                                FROM Denuncias d 
                                                JOIN Viviendas v ON d.vivienda_id = v.vivienda_id
                                                WHERE d.denuncia_id = ?
                                            `;

                                            db.query(queryDenunciante, [denuncia_id], (errUser, resultUser) => {
                                                if (!errUser && resultUser.length > 0) {
                                                    const info = resultUser[0];
                                                    const razon = cerradaNum === 1 ? 'Casa Cerrada' : 'Renuente';
                                                    const mensaje = `Visita Fallida: El rociado en la vivienda N° ${info.numero_vivienda} no se pudo completar por ${razon}.`;

                                                    // 1. Notificar Denunciante
                                                    crearNotificacion({
                                                        usuario_receptor_id: info.usuario_id,
                                                        tipo_entidad_origen: 'rociado_fallido',
                                                        id_entidad_origen: info.numero_vivienda,
                                                        mensaje: mensaje,
                                                        ruta_destino: '/denuncia'
                                                    }, (errNoti) => {
                                                        if (errNoti) {
                                                            console.error(`❌ Falló notificación de rociado fallido:`, errNoti);
                                                        } else {
                                                            console.log(`✅ Notificación de rociado fallido enviada al denunciante ${info.usuario_id}.`);
                                                        }
                                                    });
                                                }
                                            });
                                        }

                                        // 🔔 NOTIFICACIÓN GRUPAL (UPDATE)
                                        if (cerradaNum === 1 || renuenteNum === 1) {
                                            const razon = cerradaNum === 1 ? 'Casa Cerrada' : 'Renuente';
                                            const nroVivienda = camposInmutables.numero_vivienda;

                                            obtenerTecnicosPorMunicipio(camposInmutables.municipio_id, (errGroup, userGroup) => {
                                                if (!errGroup && userGroup.length > 0) {
                                                    userGroup.forEach(user => {
                                                        crearNotificacion({
                                                            usuario_receptor_id: user.usuario_id,
                                                            tipo_entidad_origen: 'rociado_fallido_grupal',
                                                            id_entidad_origen: nroVivienda,
                                                            mensaje: `ALERTA (Actualización): Visita fallida en vivienda N° ${nroVivienda}. Razón: ${razon}.`,
                                                            ruta_destino: '/admin/rr2'
                                                        }, () => { });
                                                    });
                                                    console.log(`✅ Notificaciones grupales de falla (update) enviadas.`);
                                                }
                                            });
                                        }

                                        // Enviar respuesta exitosa
                                        res.json({
                                            message: "Formulario RR1, denuncia y relación actualizados exitosamente",
                                            id_rr1: id,
                                            warning: "Campos inmutables no modificados (municipio, comunidad, número de vivienda, personal)",
                                            estado_rr1: 'activo',
                                            estado_denuncia: 'realizada',
                                            rociado: rociadoNum,
                                            no_rociado: no_rociadoNum,
                                            cerrada: cerradaNum,
                                            renuente: renuenteNum,
                                            denuncia_id: denuncia_id
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        // 🎯 SI NO ESTÁ ROCIADO, NO CAMBIAR LA DENUNCIA PERO CREAR RELACIÓN
                        console.log(`ℹ️ RR1 no marcado como rociado (rociado=${rociadoNum}), denuncia ${denuncia_id} no se modifica`);

                        // 🆕 CREAR/ACTUALIZAR RELACIÓN EN RR1_DENUNCIAS (aunque no esté rociado)
                        const queryCrearRelacion = `
                            INSERT INTO RR1_Denuncias (rr1_id, denuncia_id, fecha_relacion)
                            VALUES (?, ?, NOW())
                            ON DUPLICATE KEY UPDATE fecha_relacion = NOW()
                        `;

                        db.query(queryCrearRelacion, [id, denuncia_id], (errRelacion) => {
                            if (errRelacion) {
                                console.error(`❌ Error al crear/actualizar relación RR1-Denuncia:`, errRelacion);
                            } else {
                                console.log(`✅ Relación RR1-Denuncia creada/actualizada (sin rociado): RR1=${id}, Denuncia=${denuncia_id}`);
                            }

                            res.json({
                                message: "Formulario RR1 actualizado exitosamente",
                                id_rr1: id,
                                warning: "Campos inmutables no modificados. Denuncia no actualizada (no rociado). Relación creada.",
                                estado_rr1: 'activo',
                                rociado: rociadoNum,
                                no_rociado: no_rociadoNum,
                                cerrada: cerradaNum,
                                renuente: renuenteNum,
                                nota: "Estado de denuncia se mantuvo sin cambios (no se marcó como rociado)",
                                denuncia_id: denuncia_id
                            });
                        });
                    }
                } else {
                    // Si no se proporciona denuncia_id, solo responder éxito
                    console.log(`ℹ️ No se proporcionó denuncia_id para actualizar`);
                    res.json({
                        message: "Formulario RR1 actualizado exitosamente",
                        id_rr1: id,
                        warning: "Campos inmutables no modificados (municipio, comunidad, número de vivienda, personal)",
                        estado_rr1: 'activo',
                        rociado: rociadoNum,
                        no_rociado: no_rociadoNum,
                        cerrada: cerradaNum,
                        renuente: renuenteNum,
                        nota: "No se proporcionó ID de denuncia para actualizar"
                    });
                }
            });
        });

    } catch (error) {
        console.error(`💥 Error general al actualizar RR1 ID ${id}:`, error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

// Desactivar formulario RR1
export const desactivarRR1 = (req, res) => {
    const { id } = req.params;

    console.log(`🗑️ Desactivando formulario RR1 ID: ${id}`);

    const query = `UPDATE Formulario_RR1 SET estado = 'apagado' WHERE id_rr1 = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(`❌ Error al desactivar formulario RR1 ID ${id}:`, err);
            return res.status(500).json({
                error: "Error al desactivar formulario",
                details: err.message,
                sql: err.sql
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Formulario no encontrado" });
        }

        console.log(`✅ Formulario RR1 ID ${id} desactivado exitosamente`);
        res.json({
            message: "Formulario RR1 desactivado exitosamente",
            id_rr1: id,
            estado: 'apagado'
        });
    });
};

// Obtener RR1 para edición
// En la función obtenerRR1ParaEdicion, modifica la consulta SQL:
// Obtener RR1 para edición - VERSIÓN MEJORADA CON BÚSQUEDA DE DENUNCIA
export const obtenerRR1ParaEdicion = (req, res) => {
    const { id } = req.params;

    console.log(`🔍 Solicitando RR1 para edición ID: ${id}`);

    // Primero obtener el RR1 básico
    const queryRR1Basico = `
        SELECT 
            fr.*,
            u1.nombre_completo as tecnico_nombre, u2.nombre_completo as jefe1_nombre,
            u3.nombre_completo as jefe2_nombre, u4.nombre_completo as jefe3_nombre,
            u5.nombre_completo as jefe4_nombre, m.nombre_municipio as municipio_nombre,
            c.nombre_comunidad as comunidad_nombre, s.nombre_sede as sede_nombre,
            rs.nombre_red as redsalud_nombre, es.nombre_establecimiento as establecimiento_nombre
        FROM Formulario_RR1 fr
        LEFT JOIN Usuarios u1 ON fr.tecnico_id = u1.usuario_id
        LEFT JOIN Usuarios u2 ON fr.jefe1_id = u2.usuario_id
        LEFT JOIN Usuarios u3 ON fr.jefe2_id = u3.usuario_id
        LEFT JOIN Usuarios u4 ON fr.jefe3_id = u4.usuario_id
        LEFT JOIN Usuarios u5 ON fr.jefe4_id = u5.usuario_id
        LEFT JOIN Municipios m ON fr.municipio_id = m.municipio_id
        LEFT JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
        LEFT JOIN Sedes s ON fr.sede_id = s.sede_id
        LEFT JOIN RedSalud rs ON fr.redsalud_id = rs.redsalud_id
        LEFT JOIN EstablecimientosSalud es ON fr.establecimiento_id = es.establecimiento_id
        WHERE fr.id_rr1 = ? AND fr.estado != 'apagado'
    `;

    db.query(queryRR1Basico, [id], (err, results) => {
        if (err) {
            console.error(`❌ Error al obtener formulario RR1 para edición ID ${id}:`, err);
            return res.status(500).json({
                error: "Error al obtener formulario para edición",
                details: err.message,
                sql: err.sql
            });
        }

        if (results.length === 0) {
            console.log(`⚠️ Formulario RR1 ID ${id} no encontrado o está desactivado`);
            return res.status(404).json({ error: "Formulario no encontrado o desactivado" });
        }

        const formulario = results[0];

        // Buscar denuncia_id en RR1_Denuncias
        const queryBuscarRelacion = `
            SELECT denuncia_id 
            FROM RR1_Denuncias 
            WHERE rr1_id = ?
            ORDER BY fecha_relacion DESC 
            LIMIT 1
        `;

        db.query(queryBuscarRelacion, [id], (errRelacion, resultsRelacion) => {
            if (errRelacion) {
                console.error(`❌ Error al buscar relación RR1-Denuncia para RR1 ${id}:`, errRelacion);
                formulario.denuncia_id = null;
            } else if (resultsRelacion.length > 0) {
                formulario.denuncia_id = resultsRelacion[0].denuncia_id;
                console.log(`✅ Relación encontrada en RR1_Denuncias: denuncia_id=${formulario.denuncia_id}`);
            } else {
                formulario.denuncia_id = null;
                console.log(`ℹ️ No hay relación en RR1_Denuncias para RR1 ${id}`);

                // Intentar buscar denuncia por número de vivienda
                if (formulario.numero_vivienda) {
                    const queryBuscarDenuncia = `
                        SELECT denuncia_id 
                        FROM Denuncias 
                        WHERE numero_vivienda = ? 
                        AND estado_denuncia IN ('programada', 'reprogramada', 'recibida', 'realizada')
                        ORDER BY fecha_denuncia DESC 
                        LIMIT 1
                    `;

                    db.query(queryBuscarDenuncia, [formulario.numero_vivienda], (errDenuncia, resultsDenuncia) => {
                        if (errDenuncia) {
                            console.error(`❌ Error al buscar denuncia por número de vivienda:`, errDenuncia);
                        } else if (resultsDenuncia.length > 0) {
                            formulario.denuncia_id = resultsDenuncia[0].denuncia_id;
                            console.log(`✅ Denuncia encontrada por número de vivienda: ${formulario.denuncia_id}`);

                            // Crear la relación para futuras consultas
                            const queryCrearRelacion = `
                                INSERT INTO RR1_Denuncias (rr1_id, denuncia_id, fecha_relacion)
                                VALUES (?, ?, NOW())
                            `;

                            db.query(queryCrearRelacion, [id, formulario.denuncia_id], (errCrearRelacion) => {
                                if (errCrearRelacion) {
                                    console.error(`❌ Error al crear relación RR1-Denuncia:`, errCrearRelacion);
                                } else {
                                    console.log(`✅ Relación RR1-Denuncia creada para futuras consultas`);
                                }
                            });
                        }

                        console.log(`✅ Formulario RR1 ID ${id} obtenido para edición, denuncia_id: ${formulario.denuncia_id || 'NINGUNA'}`);
                        return res.json(formulario);
                    });
                } else {
                    console.log(`✅ Formulario RR1 ID ${id} obtenido para edición, denuncia_id: NINGUNA (sin número de vivienda)`);
                    return res.json(formulario);
                }

                return; // Salir para evitar doble respuesta
            }

            console.log(`✅ Formulario RR1 ID ${id} obtenido para edición, denuncia_id: ${formulario.denuncia_id || 'NINGUNA'}`);
            res.json(formulario);
        });
    });
};
// Obtener denuncias relacionadas con un RR1
export const obtenerDenunciasPorRR1 = (req, res) => {
    const { id } = req.params;

    console.log(`🔍 Solicitando denuncias para RR1 ID: ${id}`);

    const query = `
        SELECT 
            d.*,
            rd.fecha_relacion
        FROM RR1_Denuncias rd
        INNER JOIN Denuncias d ON rd.denuncia_id = d.denuncia_id
        WHERE rd.rr1_id = ?
        ORDER BY rd.fecha_relacion DESC
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error(`❌ Error al obtener denuncias para RR1 ${id}:`, err);
            return res.status(500).json({
                error: "Error al obtener denuncias relacionadas",
                details: err.message
            });
        }

        console.log(`✅ ${results.length} denuncias obtenidas para RR1 ${id}`);
        res.json(results);
    });
};

// Actualizar fecha de registros existentes
export const actualizarFechasRR1 = (req, res) => {
    const { id } = req.params;

    console.log(`🔄 Actualizando fecha para RR1 ID: ${id}`);

    const query = `UPDATE Formulario_RR1 SET fecha_registro = NOW() WHERE id_rr1 = ?`;

    db.query(query, [id], (err, result) => {
        if (err) {
            console.error(`❌ Error al actualizar fecha RR1 ID ${id}:`, err);
            return res.status(500).json({
                error: "Error al actualizar fecha",
                details: err.message
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Formulario no encontrado" });
        }

        console.log(`✅ Fecha actualizada para RR1 ID ${id}`);
        res.json({
            message: "Fecha actualizada exitosamente",
            id_rr1: id,
            fecha_actualizada: new Date().toISOString()
        });
    });
};
// NUEVA FUNCIÓN: Buscar RR1 por jefe de familia
export const buscarRR1PorJefeFamilia = (req, res) => {
    const { jefeFamilia } = req.params;

    console.log(`🔍 Buscando RR1 por jefe de familia: ${jefeFamilia}`);

    // Usar LIKE para búsqueda parcial
    const query = `
    SELECT 
      fr.*,
      DATE_FORMAT(fr.fecha_registro, '%d/%m/%Y') as fecha_registro_formateada,
      m.nombre_municipio as municipio_nombre,
      c.nombre_comunidad as comunidad_nombre,
      u2.nombre_completo as jefe1_nombre
    FROM Formulario_RR1 fr
    LEFT JOIN Municipios m ON fr.municipio_id = m.municipio_id
    LEFT JOIN Comunidades c ON fr.comunidad_id = c.comunidad_id
    LEFT JOIN Usuarios u2 ON fr.jefe1_id = u2.usuario_id
    WHERE fr.estado = 'activo' 
      AND fr.jefe_familia LIKE ?
    ORDER BY fr.fecha_registro DESC
  `;

    // Usar % para búsqueda parcial
    const searchTerm = `%${jefeFamilia}%`;

    db.query(query, [searchTerm], (err, resultados) => {
        if (err) {
            console.error("❌ Error al buscar RR1 por jefe de familia:", err);
            return res.status(500).json({
                error: "Error en la búsqueda",
                details: err.message
            });
        }

        console.log(`✅ ${resultados.length} resultados encontrados para: ${jefeFamilia}`);
        res.json(resultados);
    });
};
// Agregar esta función al rr1Controller.js
// Agregar esta función al rr1Controller.js
export const obtenerRR1PorMunicipiosUsuario = (req, res) => {
    const usuarioId = req.user?.usuario_id;
    const rol = req.user?.rol;

    console.log("📋 Solicitando RR1 por municipios del usuario:", { usuarioId, rol });

    // Si es administrador, obtener todos
    if (rol === 'administrador') {
        console.log("✅ Usuario es administrador, mostrando todos los RR1");

        const query = `
      SELECT 
        fr.*,
        DATE_FORMAT(fr.fecha_registro, '%d/%m/%Y') as fecha_registro_formateada,
        u2.nombre_completo as jefe1_nombre
      FROM Formulario_RR1 fr
      LEFT JOIN Usuarios u2 ON fr.jefe1_id = u2.usuario_id
      WHERE fr.estado = 'activo' 
      ORDER BY fr.fecha_registro DESC
    `;

        return db.query(query, (err, formularios) => {
            if (err) {
                console.error("❌ Error al obtener formularios RR1:", err);
                return res.status(500).json({
                    error: "Error al obtener formularios",
                    details: err.message
                });
            }

            console.log(`✅ ${formularios.length} formularios RR1 obtenidos (administrador)`);
            res.json(formularios);
        });
    }

    // Para técnicos, jefes_grupo y supervisores, obtener solo sus municipios
    const query = `
    SELECT 
      fr.*,
      DATE_FORMAT(fr.fecha_registro, '%d/%m/%Y') as fecha_registro_formateada,
      u2.nombre_completo as jefe1_nombre
    FROM Formulario_RR1 fr
    LEFT JOIN Usuarios u2 ON fr.jefe1_id = u2.usuario_id
    INNER JOIN Usuario_Municipio um ON fr.municipio_id = um.municipio_id
    WHERE fr.estado = 'activo' 
      AND um.usuario_id = ?
    GROUP BY fr.id_rr1
    ORDER BY fr.fecha_registro DESC
  `;

    db.query(query, [usuarioId], (err, formularios) => {
        if (err) {
            console.error("❌ Error al obtener formularios RR1 por municipios del usuario:", err);
            return res.status(500).json({
                error: "Error al obtener formularios",
                details: err.message
            });
        }

        console.log(`✅ ${formularios.length} formularios RR1 obtenidos para usuario ${usuarioId}`);
        res.json(formularios);
    });
};
