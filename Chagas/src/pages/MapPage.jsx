import React, { useState } from 'react';
import { LocationMap } from '../components/location-map1';
import "../css/MapPage.css";

const MapPage = () => {
  const [selectedViviendaId, setSelectedViviendaId] = useState(null);

  return (
    <div className="map-page" style={{ width: '100vw', height: '100vh' }}>
      {/* Título mínimo */}
      <div className="header-title">
        <h1>CHAGAS COCHABAMBA RONDAS</h1>
      </div>

      {/* Contenido principal */}
      <div className="main-content">
        {/* Mapa */}
        <div className="map-container">
          <div className="map-real" style={{ width: '100%', height: '100%' }}>
            <LocationMap viviendaId={selectedViviendaId} />
          </div>
        </div>

        {/* Panel derecho de botones */}
        <div className="buttons-panel">
          <button className="btn-red">SIN MAPA</button>
          <button className="btn-info">INFORMACIÓN</button>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
