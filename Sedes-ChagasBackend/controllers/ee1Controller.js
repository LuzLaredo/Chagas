import {
  insertarDetalle,
  obtenerDetalles,
  actualizarDetalle,
  eliminarDetalle,
} from "../models/ee1Model.js";

export const crearDetalle = (req, res) => {
  const data = req.body;
  insertarDetalle(data, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Detalle creado", id: result.insertId });
  });
};

export const listarDetalles = (req, res) => {
  obtenerDetalles((err, detalles) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(detalles);
  });
};

export const editarDetalle = (req, res) => {
  const id = req.params.id;
  const data = req.body;
  actualizarDetalle(id, data, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Detalle actualizado" });
  });
};

export const borrarDetalle = (req, res) => {
  const id = req.params.id;
  eliminarDetalle(id, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Detalle eliminado" });
  });
};
