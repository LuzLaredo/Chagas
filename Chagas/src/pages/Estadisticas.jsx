import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Importar useNavigate
import EstadisticasCard from "../components/estadisticas-card";
import GraficosEstadisticas from "../components/graficos-estadisticas";
import { Icon } from "@iconify/react";
import { useAuth } from './AuthContext'; // Ajusta la ruta según tu estructura
import "../css/Estadisticas1.css";
import { baseUrl } from "../api/BaseUrl"; 

const Estadisticas = () => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { hasRole } = useAuth();
  const navigate = useNavigate(); // Hook para navegación

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${baseUrl}/api/estadisticas/generales`);

      
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setEstadisticas(data);
    } catch (err) {
      console.error(err);
      setError("No se pudo conectar con el backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEstadisticas(); }, []);

  // Función para manejar el clic en el botón de estadísticas avanzadas
  const handleEstadisticasAvanzadas = () => {
    navigate("/estadisticas-avanzadas"); // Redirigir a la ruta de Nivo
  };

  if (loading)
    return (
      <div className="estadisticas-container">
        <div className="loading-container">
          <Icon icon="eos-icons:loading" className="loading-icon" />
          <p>Cargando estadísticas...</p>
        </div>
      </div>
    );

  if (error) return <p>{error}</p>;

  const estadisticasItems = [
    { label: "Viviendas registradas:", value: estadisticas?.viviendasRegistradas || 0 },
    { label: "Habitantes protegidos:", value: estadisticas?.habitantesProtegidos || 0 },
    { label: "Viviendas evaluadas:", value: estadisticas?.viviendasEvaluadas || 0 },
    { label: "Viviendas positivas:", value: `${estadisticas?.viviendasPositivas || 0} → Tasa de infestación: ${estadisticas?.tasaInfestacion || 0}%`, highlight: true },
    { label: "Ejemplares capturados:", value: estadisticas?.ejemplaresCapturados || 0, subtext: `(${estadisticas?.intraTotal || 0} intra / ${estadisticas?.periTotal || 0} peri)` },
    { label: "Viviendas rociadas:", value: `${estadisticas?.viviendasRociadas || 0} → Cobertura de rociado: ${estadisticas?.coberturaRociado || 0}%`, highlight: true },
    { label: "Total insecticida aplicado:", value: `${estadisticas?.totalInsecticida || 0} L` },
    { label: "Habitaciones no rociadas:", value: estadisticas?.habitacionesNoRociadas || 0 },
    { label: "Denuncias vinchucas:", value: estadisticas?.denunciasVinchucas || 0 }
  ];

  // Verificar si el usuario tiene permisos para ver el botón
  const showAdvancedButton = hasRole(["tecnico", "administrador", "jefe_grupo"]);

  return (
    <div className="estadisticas-container">
      {/* Botón de estadísticas avanzadas */}
      {showAdvancedButton && (
        <div className="advanced-stats-button-container">
          <button 
            className="advanced-stats-button"
            onClick={handleEstadisticasAvanzadas}
            title="Ir a Estadísticas Avanzadas"
          >
            <Icon icon="mdi:chart-box" className="button-icon" />
            Ir a Estadísticas Avanzadas
          </button>
        </div>
      )}
      
      <main className="estadisticas-main">
        <EstadisticasCard title="Resumen de Actividades" items={estadisticasItems || []} />
        <GraficosEstadisticas estadisticas={estadisticas} />
      </main>
    </div>
  );
};

export default Estadisticas;