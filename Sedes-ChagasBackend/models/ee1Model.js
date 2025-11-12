import db from "../config/db.js";

export const insertarDetalle = (data, callback) => {
  const query = `
    INSERT INTO EE1_Detalles_Capturas (
      evaluacion_id, numero_vivienda, jefe_familia,
      intra_pared, intra_techo, intra_cama, intra_otros,
      peri_pared, peri_corral, peri_gallinero, peri_conejera,
      peri_zarzo_troje, peri_otros
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    data.evaluacion_id,
    data.numero_vivienda,
    data.jefe_familia,
    data.intra_pared,
    data.intra_techo,
    data.intra_cama,
    data.intra_otros,
    data.peri_pared,
    data.peri_corral,
    data.peri_gallinero,
    data.peri_conejera,
    data.peri_zarzo_troje,
    data.peri_otros,
  ];

  db.query(query, values, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

export const obtenerDetalles = (callback) => {
  const query = "SELECT * FROM EE1_Detalles_Capturas";
  db.query(query, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

export const actualizarDetalle = (id, data, callback) => {
  const query = `
    UPDATE EE1_Detalles_Capturas SET
      evaluacion_id = ?, numero_vivienda = ?, jefe_familia = ?,
      intra_pared = ?, intra_techo = ?, intra_cama = ?, intra_otros = ?,
      peri_pared = ?, peri_corral = ?, peri_gallinero = ?, peri_conejera = ?,
      peri_zarzo_troje = ?, peri_otros = ?
    WHERE id_detalle = ?
  `;

  const values = [
    data.evaluacion_id,
    data.numero_vivienda,
    data.jefe_familia,
    data.intra_pared,
    data.intra_techo,
    data.intra_cama,
    data.intra_otros,
    data.peri_pared,
    data.peri_corral,
    data.peri_gallinero,
    data.peri_conejera,
    data.peri_zarzo_troje,
    data.peri_otros,
    id,
  ];

  db.query(query, values, (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

export const eliminarDetalle = (id, callback) => {
  const query = "DELETE FROM EE1_Detalles_Capturas WHERE id_detalle = ?";
  db.query(query, [id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};
