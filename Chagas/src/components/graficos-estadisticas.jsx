import React from 'react';
import { Card, CardBody, CardHeader } from "@heroui/react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const GraficosEstadisticas = ({ estadisticas }) => {
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
        data: [estadisticas.intraTotal, estadisticas.periTotal],
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

  return (
    <div className="graficos-container">
      <Card className="grafico-card">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <h4 className="text-lg font-bold text-blue-800">Actividades Principales</h4>
        </CardHeader>
        <CardBody>
          <Bar data={datosBarras} options={opcionesBarras} />
        </CardBody>
      </Card>

      <div className="graficos-grid">
        <Card className="grafico-card">
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
            <h4 className="text-lg font-bold text-green-800">Métricas de Porcentaje</h4>
          </CardHeader>
          <CardBody>
            <Doughnut data={datosDona} options={opcionesDona} />
          </CardBody>
        </Card>

        <Card className="grafico-card">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <h4 className="text-lg font-bold text-purple-800">Distribución de Capturas</h4>
          </CardHeader>
          <CardBody>
            <Doughnut data={datosCapturas} options={opcionesDona} />
          </CardBody>
        </Card>
      </div>

      {/* Gráfico adicional para insecticida y habitaciones */}
      <Card className="grafico-card">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
          <h4 className="text-lg font-bold text-orange-800">Recursos y Excepciones</h4>
        </CardHeader>
        <CardBody>
          <Bar 
            data={{
              labels: ['Insecticida Aplicado (L)', 'Habitaciones No Rociadas'],
              datasets: [
                {
                  label: 'Cantidad',
                  data: [estadisticas.totalInsecticida, estadisticas.habitacionesNoRociadas],
                  backgroundColor: [
                    'rgba(255, 159, 64, 0.8)',
                    'rgba(201, 203, 207, 0.8)'
                  ],
                  borderColor: [
                    'rgba(255, 159, 64, 1)',
                    'rgba(201, 203, 207, 1)'
                  ],
                  borderWidth: 1,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                },
              },
            }}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default GraficosEstadisticas;