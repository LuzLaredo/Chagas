// ===========================================================
// models/viviendasModel.js - VERSIÓN ACTUALIZADA
// ===========================================================

import db from "../config/db.js";

class Vivienda {
  // ===========================================================
  // 🔸 CREAR VIVIENDA (usado en denunciasController)
  // ===========================================================
  static create(data, callback) {
    const {
      numero_vivienda,
      jefe_familia,
      direccion,
      latitud,
      longitud,
      altura,
      comunidad_id,
      municipio_id, // 🆕 NUEVO CAMPO
      foto_entrada,
    } = data;

    const query = `
      INSERT INTO Viviendas 
        (numero_vivienda, jefe_familia, direccion, latitud, longitud, altura, comunidad_id, municipio_id, foto_entrada)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      numero_vivienda,
      jefe_familia,
      direccion || null,
      latitud || null,
      longitud || null,
      altura || null,
      comunidad_id,
      municipio_id, // 🆕 NUEVO CAMPO
      foto_entrada || null,
    ];

    db.query(query, values, (err, results) => {
      if (err) {
        console.error("❌ Error al crear vivienda:", err);
        return callback(err);
      }
      callback(null, { insertId: results.insertId });
    });
  }

  // ===========================================================
  // 🔸 OBTENER TODAS LAS VIVIENDAS
  // ===========================================================
  static async getAll() {
    try {
      const [rows] = await db
        .promise()
        .query(
          "SELECT vivienda_id, numero_vivienda, jefe_familia, direccion, latitud, longitud, altura, foto_entrada, comunidad_id, municipio_id FROM Viviendas"
        );
      return rows;
    } catch (err) {
      console.error("❌ Error en Vivienda.getAll:", err);
      throw err;
    }
  }

  // ===========================================================
  // 🔸 OBTENER VIVIENDA POR ID
  // ===========================================================
  static async getById(id) {
    try {
      const [rows] = await db
        .promise()
        .query(
          "SELECT vivienda_id, numero_vivienda, jefe_familia, direccion, latitud, longitud, altura, foto_entrada, comunidad_id, municipio_id FROM Viviendas WHERE vivienda_id = ?",
          [id]
        );
      return rows[0];
    } catch (err) {
      console.error("❌ Error en Vivienda.getById:", err);
      throw err;
    }
  }

  // ===========================================================
  // 🔸 OBTENER SOLO LA IMAGEN DE UNA VIVIENDA
  // ===========================================================
  static async getImageById(id) {
    try {
      const [rows] = await db
        .promise()
        .query(
          "SELECT foto_entrada FROM Viviendas WHERE vivienda_id = ?",
          [id]
        );
      return rows[0];
    } catch (err) {
      console.error("❌ Error en Vivienda.getImageById:", err);
      throw err;
    }
  }
}

export default Vivienda;