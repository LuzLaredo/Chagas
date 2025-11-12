import React, { useEffect, useState } from "react";

const DEFAULT_CENTER = { lat: -17.3939, lng: -66.1550 };

export const LocationMap = ({ viviendaId }) => {
  const [vivienda, setVivienda] = useState(null);
  const [currentCoords, setCurrentCoords] = useState(DEFAULT_CENTER);
  const [clickedCoords, setClickedCoords] = useState(null);

  useEffect(() => {
    // ... (el mismo código del useEffect anterior)
  }, [viviendaId]);

  const handleMapClick = (e) => {
    // ... (el mismo código del handleMapClick anterior)
  };

  const getMapUrl = () => {
    const { lat, lng } = currentCoords;
    // Zoom más cercano para mejor visualización
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.02}%2C${lat-0.02}%2C${lng+0.02}%2C${lat+0.02}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  return (
    <div className="location-map-container">
      <div 
        className="map-area w-full h-full cursor-pointer" 
        onClick={handleMapClick}
      >
        <iframe
          src={getMapUrl()}
          className="w-full h-full border-0 pointer-events-none"
          title="Mapa de Cochabamba - Rondas Chagas"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ 
            width: '100%', 
            height: '100%', 
            minHeight: '100%',
            border: 'none',
            borderRadius: '16px' // Aseguramos bordes redondeados
          }}
        />
        
        {/* Marcador principal */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className={`
            w-8 h-8 rounded-full border-4 border-white flex items-center justify-center 
            shadow-lg animate-pulse
            ${vivienda ? 'bg-blue-600' : 'bg-red-600'}
          `}>
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Marcador de clic */}
        {clickedCoords && (
          <div 
            className="absolute pointer-events-none z-20"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(${((clickedCoords.lng - currentCoords.lng) * 10000)}px, ${((currentCoords.lat - clickedCoords.lat) * 10000)}px)`
            }}
          >
            <div className="w-6 h-6 rounded-full border-3 border-white bg-red-600 shadow-lg flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};