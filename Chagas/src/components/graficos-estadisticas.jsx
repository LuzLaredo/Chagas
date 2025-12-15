import React from 'react';
import InfoTooltip from "./InfoTooltip";
import { Card, CardBody, CardHeader } from "@heroui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line, Pie } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const GraficosEstadisticas = ({ estadisticas, evolucionData, denunciasData }) => {
  // Datos para el gráfico de barras - Actividades principales
  const datosBarras = {
    labels: ['Viviendas Registradas', 'Viviendas Evaluadas', 'Viviendas Rociadas', 'Viviendas Positivas'],
    datasets: [
      {
        label: 'Cantidad',
        data: [
          estadisticas.viviendasRegistradas,
          estadisticas.viviendasEvaluadas,
          estadisticas.viviendasRociadas,
          estadisticas.viviendasPositivas
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const opcionesBarras = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Resumen de Actividades',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  // Datos para el gráfico de dona - Cobertura e Infestación
  const datosDona = {
    labels: ['Cobertura de Rociado', 'Tasa de Infestación'],
    datasets: [
      {
        label: 'Porcentaje %',
        data: [
          parseFloat(estadisticas.coberturaRociado),
          parseFloat(estadisticas.tasaInfestacion)
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 99, 132, 0.8)'
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const opcionesDona = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Porcentajes Clave',
      },
    },
  };

  // Datos para el gráfico de capturas
  const datosCapturas = {
    labels: ['Intradomicilio', 'Peridomicilio'],
    datasets: [
      {
        label: 'Ejemplares Capturados',
        data: [estadisticas.intraTotal || estadisticas.ejemplaresIntra, estadisticas.periTotal || estadisticas.ejemplaresPeri],
        backgroundColor: [
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderColor: [
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  // NUEVO 1: Datos para Evolución Temporal (Línea)
  const labelsEvolucion = evolucionData && evolucionData.length > 0 ? evolucionData.map(d => d.mes || d.fecha) : [];
  const datosInfestacion = evolucionData && evolucionData.length > 0 ? evolucionData.map(d => d.infestacion || d.valor) : [];

  const datosLinea = {
    labels: labelsEvolucion.length ? labelsEvolucion : ['Sin datos'],
    datasets: [
      {
        label: 'Evolución Infestación (%)',
        data: datosInfestacion.length ? datosInfestacion : [0],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.3,
      }
    ],
  };

  const opcionesLinea = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Tendencia Histórica' },
    },
  };

  // NUEVO 2: Datos para Tipos de Denuncia (Pie)
  // Agrupar denunciasData si viene detallado o usarlo directo si ya viene agrupado (asumo array de {estado: 'recibida', total: 10})
  let denunciasPorEstado = { recibida: 0, programada: 0, realizada: 0, cancelada: 0 };
  if (denunciasData && Array.isArray(denunciasData)) {
    denunciasData.forEach(d => {
      // Ajustar según estructura real de API, aquí un intento genérico
      if (d.estado) denunciasPorEstado[d.estado] = (denunciasPorEstado[d.estado] || 0) + 1;
      // Si la API ya devuelve agregados:
      if (d.recibidas) denunciasPorEstado.recibida += parseInt(d.recibidas);
      if (d.programada || d.programadas) denunciasPorEstado.programada += parseInt(d.programada || d.programadas);
      if (d.realizada || d.realizadas) denunciasPorEstado.realizada += parseInt(d.realizada || d.realizadas);
    });
  }

  const datosPie = {
    labels: ['Recibidas', 'Programadas', 'Realizadas'],
    datasets: [
      {
        label: '# de Denuncias',
        data: [denunciasPorEstado.recibida, denunciasPorEstado.programada, denunciasPorEstado.realizada],
        backgroundColor: [
          'rgba(255, 206, 86, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
        ],
        borderColor: [
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="graficos-container">
      <Card className="grafico-card">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <h4 className="text-lg font-bold text-blue-800 flex items-center gap-2">
            Actividades Principales
            <InfoTooltip text="Comparativa de las principales actividades: viviendas registradas, evaluadas, rociadas y positivas." />
          </h4>
        </CardHeader>
        <CardBody>
          <Bar data={datosBarras} options={opcionesBarras} />
        </CardBody>
      </Card>

      <div className="graficos-grid">
        <Card className="grafico-card">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <h4 className="text-lg font-bold text-green-800 flex items-center gap-2">
              Métricas de Porcentaje
              <InfoTooltip text="Visualización de la Cobertura de Rociado y la Tasa de Infestación." />
            </h4>
          </CardHeader>
          <CardBody>
            <Doughnut data={datosDona} options={opcionesDona} />
          </CardBody>
        </Card>

        <Card className="grafico-card">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <h4 className="text-lg font-bold text-purple-800 flex items-center gap-2">
              Distribución de Capturas
              <InfoTooltip text="Proporción de vinchucas encontradas dentro (Intra) y fuera (Peri) de la vivienda." />
            </h4>
          </CardHeader>
          <CardBody>
            <Doughnut data={datosCapturas} options={opcionesDona} />
          </CardBody>
        </Card>
      </div>

      {/* Gráfico adicional para insecticida y habitaciones */}
      <Card className="grafico-card">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
          <h4 className="text-lg font-bold text-orange-800 flex items-center gap-2">
            Recursos y Excepciones
            <InfoTooltip text="Cantidad de insecticida utilizado y número de habitaciones que no pudieron ser rociadas." />
          </h4>
        </CardHeader>
        <CardBody>
          <Bar
            data={{
              labels: ['Insecticida Aplicado (L)', 'Habitaciones No Rociadas'],
              datasets: [
                {
                  label: 'Cantidad',
                  data: [estadisticas.totalInsecticida, estadisticas.habitacionesNoRociadas],
                  backgroundColor: ['rgba(255, 159, 64, 0.8)', 'rgba(201, 203, 207, 0.8)'],
                  borderColor: ['rgba(255, 159, 64, 1)', 'rgba(201, 203, 207, 1)'],
                  borderWidth: 1,
                },
              ],
            }}
            options={{ responsive: true, plugins: { legend: { position: 'top' } } }}
          />
        </CardBody>
      </Card>

      {/* NUEVOS GRÁFICOS */}
      <div className="graficos-grid">
        <Card className="grafico-card">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
            <h4 className="text-lg font-bold text-red-800 flex items-center gap-2">
              Evolución de Infestación
              <InfoTooltip text="Tendencia histórica de la tasa de infestación en el período seleccionado." />
            </h4>
          </CardHeader>
          <CardBody>
            <Line data={datosLinea} options={opcionesLinea} />
          </CardBody>
        </Card>

        <Card className="grafico-card">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100">
            <h4 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
              Estado de Denuncias
              <InfoTooltip text="Distribución de denuncias según su estado de atención." />
            </h4>
          </CardHeader>
          <CardBody>
            <Pie data={datosPie} options={{ responsive: true, plugins: { legend: { position: 'right' } } }} />
          </CardBody>
        </Card>
      </div>

    </div>
  );
};

export default GraficosEstadisticas;