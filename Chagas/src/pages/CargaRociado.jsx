import React, { useEffect, useState } from "react";
import "../css/CargaRociado.css";
import { Header } from "../components/header";
import { ServiceCard } from "../components/service-card";
import { ImageGallery } from "../components/image-gallery";
import { ActionButtons } from "../components/action-buttons";
import { LocationMap } from "../components/location-map";
import { Icon } from "@iconify/react";
import { baseUrl } from "../api/BaseUrl"; 

export default function CargaRociado() {
  const [viviendaData, setViviendaData] = useState(null);
  const [denunciaData, setDenunciaData] = useState(null);
  const [viviendasList, setViviendasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viviendaId, setViviendaId] = useState("");

  const fetchData = async (endpoint) => {
    try {
      const response = await fetch(`${baseUrl}/api/${endpoint}`);
      if (!response.ok) throw new Error(`Error al obtener datos de ${endpoint}`);
      return await response.json();
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const loadViviendasList = async () => {
    const viviendas = await fetchData("viviendas/all");
    console.log("Viviendas cargadas:", viviendas);
    if (viviendas?.length > 0) {
      setViviendasList(viviendas);
      setViviendaId(viviendas[0].vivienda_id);
      return viviendas[0].vivienda_id;
    }
    return null;
  };

  const loadViviendaData = async (id) => {
    // Cargar datos de vivienda
    const vivienda = await fetchData(`viviendas/${id}`);
    console.log("Datos vivienda:", vivienda);
    if (vivienda) setViviendaData(vivienda);

    // Cargar denuncias relacionadas con esta vivienda
    const denuncias = await fetchData(`denuncias/vivienda/${id}`);
    console.log("Denuncias:", denuncias);
    if (denuncias && denuncias.length > 0) {
      // Tomar la denuncia más reciente
      const denunciaReciente = denuncias.sort((a, b) => 
        new Date(b.fecha_denuncia) - new Date(a.fecha_denuncia)
      )[0];
      setDenunciaData(denunciaReciente);
    } else {
      setDenunciaData(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const firstId = await loadViviendasList();
        if (firstId) await loadViviendaData(firstId);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleViviendaChange = async (e) => {
    const newId = e.target.value;
    setViviendaId(newId);
    setLoading(true);
    try {
      await loadViviendaData(newId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Preparar datos para las cards
  const getDatosGenerales = () => {
    if (!viviendaData) return [];
    
    const items = [
      { label: "Nombre del jefe de familia:", value: viviendaData.jefe_familia || "No disponible" },
      { label: "Nº de vivienda:", value: viviendaData.numero_vivienda || "No disponible" },
      { label: "Dirección:", value: viviendaData.direccion || "No disponible" },
      { label: "Comunidad:", value: viviendaData.nombre_comunidad || "No disponible" }
    ];

    // Agregar descripción de la denuncia si existe
    if (denunciaData?.descripcion) {
      items.push({ 
        label: "Descripción:", 
        value: denunciaData.descripcion 
      });
    }

    return items;
  };

  const getEstadoServicio = () => {
    const items = [
      { label: "Servicio Requerido:", value: "Rocio y Exterminacion" }
    ];

    // Agregar programación si existe
    if (denunciaData?.fecha_programacion) {
      const fechaProgramacion = new Date(denunciaData.fecha_programacion);
      items.push({ 
        label: "Programación:", 
        value: fechaProgramacion.toLocaleDateString('es-ES') 
      });
    } else {
      items.push({ label: "Programación:", value: "No programado" });
    }

    // Agregar estado
    items.push({ 
      label: "Estado:", 
      value: denunciaData?.estado_denuncia || "Pendiente" 
    });

    return items;
  };

  if (loading && viviendasList.length === 0) {
    return (
      <div className="home-container">

        <div className="loading-container">
          <Icon icon="eos-icons:loading" className="loading-icon" />
          <p>Cargando viviendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error-container">
          <Icon icon="ion:alert-circle-outline" className="error-icon" />
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <main className="home-main">
        <div className="home-title-container">
          <Icon icon="ci:menu-alt-03" className="menu-icon" />
          <h1 className="home-title">ROCIADO CRUD</h1>
        </div>

        <div className="vivienda-selector">
          <label htmlFor="vivienda-select" className="selector-label">Seleccionar Vivienda:</label>
          <select 
            id="vivienda-select"
            className="selector-input"
            value={viviendaId}
            onChange={handleViviendaChange}
          >
            {viviendasList.map((v) => (
              <option key={v.vivienda_id} value={v.vivienda_id}>
                {v.numero_vivienda || 'N/A'} - {v.jefe_familia || 'N/A'} 
                {v.nombre_comunidad ? ` (${v.nombre_comunidad})` : ''}
              </option>
            ))}
          </select>
        </div>

        {viviendaData && (
          <div className="home-content">
            <div className="home-left">
              <ServiceCard 
                title="Datos generales"
                items={getDatosGenerales()}
                className="service-card-general"
              />

              <ServiceCard 
                title="Estado del Servicio"
                items={getEstadoServicio()}
                className="service-card-status"
              />

              <ActionButtons viviendaId={viviendaId} denunciaData={denunciaData} />
            </div>

            <div className="home-right">
              <ImageGallery viviendaId={Number(viviendaId)} />
              <LocationMap viviendaId={viviendaId} />
            </div>
          </div>
        )}

        {!viviendaData && !loading && (
          <div className="no-data-message">
            <p>No hay datos de vivienda disponibles. Selecciona una vivienda del listado.</p>
          </div>
        )}
      </main>
    </div>
  );
}