// EE1.jsx
import React, { useState, useEffect } from "react";
import "../../css/EE1.css";

const API_URL = "http://localhost:5000/api/ee1"; // Cambiar si hay backend real

const EE1 = () => {
  const [formData, setFormData] = useState({
    sedes: "La Paz",
    redSalud: "Red Urbana",
    eSalud: "Centro de Salud Central",
    municipio: "La Paz",
    comunidad: "Villa San Antonio",
    fechaEjecucion: "2023-10-15",
    evaluaciones: [
      {
        numeroVivienda: "001",
        nombreJefeFamilia: "Juan Pérez Mendoza",
        hora: "08:30",
        nroHabitantes: "4",
        totalHabitaciones: "3",
        fechaUltimoRociado: "2023-05-20",
        viviendaMejorada: "SI",
        ejemplaresCapturados: "2",
        lugarCaptura: "Intra-domicilio"
      }
    ],
    tecnico1: "Ana Martínez Condori",
    tecnico2: "José Quispe Mamani",
    fechaReunion: "2023-10-16"
  });

  const [totales, setTotales] = useState({
    totalViviendas: 1,
    totalEjemplares: 2,
    porcentajeInfestacion: 100,
    promedioEjemplares: 2
  });

  const [registros, setRegistros] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    // fetchRegistros(); // Descomenta si hay backend
  }, []);

  // Manejo de cambios en inputs
  const handleInputChange = (e, index, field) => {
    const value = e.target.value;
    if (index !== undefined) {
      const updatedEvaluaciones = [...formData.evaluaciones];
      updatedEvaluaciones[index][field] = value;
      setFormData({ ...formData, evaluaciones: updatedEvaluaciones });
      calcularTotales(updatedEvaluaciones);
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const addNewRow = () => {
    const nuevasEvaluaciones = [
      ...formData.evaluaciones,
      {
        numeroVivienda: "",
        nombreJefeFamilia: "",
        hora: "",
        nroHabitantes: "",
        totalHabitaciones: "",
        fechaUltimoRociado: "",
        viviendaMejorada: "",
        ejemplaresCapturados: "",
        lugarCaptura: ""
      }
    ];
    setFormData({ ...formData, evaluaciones: nuevasEvaluaciones });
    calcularTotales(nuevasEvaluaciones);
  };

  const removeRow = (index) => {
    if (formData.evaluaciones.length <= 1) return;
    const nuevasEvaluaciones = formData.evaluaciones.filter((_, i) => i !== index);
    setFormData({ ...formData, evaluaciones: nuevasEvaluaciones });
    calcularTotales(nuevasEvaluaciones);
  };

  const calcularTotales = (evaluaciones) => {
    const totalViviendas = evaluaciones.length;
    const totalEjemplares = evaluaciones.reduce(
      (sum, e) => sum + (parseInt(e.ejemplaresCapturados) || 0),
      0
    );
    const viviendasInfestadas = evaluaciones.filter(e => parseInt(e.ejemplaresCapturados) > 0).length;
    const porcentajeInfestacion = totalViviendas > 0 ? ((viviendasInfestadas / totalViviendas) * 100).toFixed(2) : 0;
    const promedioEjemplares = totalViviendas > 0 ? (totalEjemplares / totalViviendas).toFixed(2) : 0;

    setTotales({ totalViviendas, totalEjemplares, porcentajeInfestacion, promedioEjemplares });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    alert("Formulario enviado con éxito");
    // Aquí podrías hacer POST a backend si existe
  };

  const handleReset = () => {
    if (window.confirm("¿Está seguro de que desea limpiar el formulario?")) {
      setFormData({
        sedes: "",
        redSalud: "",
        eSalud: "",
        municipio: "",
        comunidad: "",
        fechaEjecucion: "",
        evaluaciones: [
          {
            numeroVivienda: "",
            nombreJefeFamilia: "",
            hora: "",
            nroHabitantes: "",
            totalHabitaciones: "",
            fechaUltimoRociado: "",
            viviendaMejorada: "",
            ejemplaresCapturados: "",
            lugarCaptura: ""
          }
        ],
        tecnico1: "",
        tecnico2: "",
        fechaReunion: ""
      });
      setTotales({ totalViviendas: 0, totalEjemplares: 0, porcentajeInfestacion: 0, promedioEjemplares: 0 });
    }
  };

  return (
    <div className="ee1-container">
      <div className="ee1-header">
        <h1>MINISTERIO DE SALUD Y DEPORTES</h1>
        <h2>DIRECCIÓN GENERAL DE EPIDEMIOLOGÍA</h2>
        <h3>PROGRAMA NACIONAL DE ENFERMEDADES TRANSMITIDAS POR VECTORES - COMPONENTE CHAGAS</h3>
        <h3>PLANILLA DIARIA DE EVALUACIÓN ENTOMOLÓGICA EE-1</h3>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Aquí incluirías los campos generales como sedes, redSalud, municipio, etc. */}
        <div className="form-section evaluation-table">
          <table>
            <thead>
              <tr>
                <th>Nº Vivienda</th>
                <th>Jefe de Familia</th>
                <th>Hora</th>
                <th>Nº Habitantes</th>
                <th>Total Habitaciones</th>
                <th>Fecha Último Rociado</th>
                <th>Vivienda Mejorada</th>
                <th>Ejemplares Capturados</th>
                <th>Lugar de Captura</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {formData.evaluaciones.map((e, index) => (
                <tr key={index}>
                  <td><input type="text" value={e.numeroVivienda} onChange={ev => handleInputChange(ev, index, 'numeroVivienda')} /></td>
                  <td><input type="text" value={e.nombreJefeFamilia} onChange={ev => handleInputChange(ev, index, 'nombreJefeFamilia')} /></td>
                  <td><input type="time" value={e.hora} onChange={ev => handleInputChange(ev, index, 'hora')} /></td>
                  <td><input type="number" min="0" value={e.nroHabitantes} onChange={ev => handleInputChange(ev, index, 'nroHabitantes')} /></td>
                  <td><input type="number" min="0" value={e.totalHabitaciones} onChange={ev => handleInputChange(ev, index, 'totalHabitaciones')} /></td>
                  <td><input type="date" value={e.fechaUltimoRociado} onChange={ev => handleInputChange(ev, index, 'fechaUltimoRociado')} /></td>
                  <td>
                    <select value={e.viviendaMejorada} onChange={ev => handleInputChange(ev, index, 'viviendaMejorada')}>
                      <option value="">Seleccione</option>
                      <option value="SI">SI</option>
                      <option value="NO">NO</option>
                    </select>
                  </td>
                  <td><input type="number" min="0" value={e.ejemplaresCapturados} onChange={ev => handleInputChange(ev, index, 'ejemplaresCapturados')} /></td>
                  <td>
                    <select value={e.lugarCaptura} onChange={ev => handleInputChange(ev, index, 'lugarCaptura')}>
                      <option value="">Seleccione</option>
                      <option value="Intra-domicilio">Intra-domicilio</option>
                      <option value="Peri-domicilio">Peri-domicilio</option>
                      <option value="Ambos">Ambos</option>
                    </select>
                  </td>
                  <td>
                    <button type="button" onClick={() => removeRow(index)} disabled={formData.evaluaciones.length <= 1}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addNewRow}>+ Agregar Fila</button>
        </div>

        <div className="form-section capture-info">
          <h4>TOTALES Y ESTADÍSTICAS</h4>
          <p><strong>Total Viviendas Evaluadas:</strong> {totales.totalViviendas}</p>
          <p><strong>Total Ejemplares Capturados:</strong> {totales.totalEjemplares}</p>
          <p><strong>Porcentaje de Infestación:</strong> {totales.porcentajeInfestacion}%</p>
          <p><strong>Promedio de Ejemplares por Vivienda:</strong> {totales.promedioEjemplares}</p>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleReset}>Limpiar Formulario</button>
          <button type="submit">Guardar Evaluación</button>
        </div>
      </form>
    </div>
  );
};

export default EE1;
