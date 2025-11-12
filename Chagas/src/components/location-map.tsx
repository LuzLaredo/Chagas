import React, { useEffect, useState } from "react";
import { Card, CardBody, Spinner, Button } from "@heroui/react";

interface LocationMapProps {
  viviendaId?: string | number | null;
}

const DEFAULT_CENTER = { lat: -17.3939, lng: -66.1550 };

export const LocationMap: React.FC<LocationMapProps> = ({ viviendaId }) => {
  const [vivienda, setVivienda] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number}>(DEFAULT_CENTER);
  const [clickedCoords, setClickedCoords] = useState<{lat: number, lng: number} | null>(null);
  const [showSaveButton, setShowSaveButton] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchVivienda = async () => {
      if (viviendaId === undefined || viviendaId === null || viviendaId === "") {
        setVivienda(null);
        setCurrentCoords(DEFAULT_CENTER);
        setLoading(false);
        setError("No se ha seleccionado una vivienda");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const idNum = Number(viviendaId);
        if (Number.isNaN(idNum)) throw new Error("viviendaId inválido");

        const resp = await fetch(`http://localhost:5000/api/viviendas/${idNum}`, {
          signal: controller.signal,
        });

        if (!resp.ok) {
          throw new Error(`Error al obtener vivienda (status ${resp.status})`);
        }

        const data = await resp.json();
        if (!isMounted) return;

        setVivienda(data);

        const latRaw = data.latitud ?? data.lat ?? data.latitude ?? data.Latitude ?? data.Lat ?? null;
        const lngRaw = data.longitud ?? data.lng ?? data.longitude ?? data.Longitude ?? data.Lng ?? null;
        
        const lat = latRaw !== null ? Number(latRaw) : NaN;
        const lng = lngRaw !== null ? Number(lngRaw) : NaN;

        if (isFinite(lat) && isFinite(lng)) {
          setCurrentCoords({ lat, lng });
          setError(null);
        } else {
          setCurrentCoords(DEFAULT_CENTER);
          setError("Vivienda encontrada pero coordenadas no válidas");
        }

      } catch (err: any) {
        if (!isMounted) return;
        if (err.name === "AbortError") return;
        setError(err.message || "Error desconocido al obtener vivienda");
        setVivienda(null);
        setCurrentCoords(DEFAULT_CENTER);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchVivienda();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [viviendaId]);

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calcular coordenadas basado en la posición del click en el mapa
    const latOffset = (rect.height / 2 - y) / 1000;
    const lngOffset = (x - rect.width / 2) / 1000;
    
    const newLat = currentCoords.lat + latOffset;
    const newLng = currentCoords.lng + lngOffset;
    
    setClickedCoords({ lat: newLat, lng: newLng });
    setShowSaveButton(true);
  };

  const handleSaveNewLocation = () => {
    // Por el momento no hace nada, solo muestra el mensaje en consola
    console.log("Guardar nueva ubicación:", clickedCoords);
    // Aquí en el futuro se podría implementar la lógica para guardar
  };

  const getMapUrl = () => {
    const { lat, lng } = currentCoords;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
  };

  return (
    <Card className="overflow-hidden shadow-md w-full">
      <CardBody className="p-0 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b bg-gray-50">
          {loading ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <span>Cargando vivienda...</span>
            </div>
          ) : error ? (
            <div className="flex justify-between items-center">
              <div className="text-amber-700 bg-amber-50 px-3 py-2 rounded-md flex-1">
                <strong>Info:</strong> {error}
                {vivienda && " - Usando coordenadas por defecto"}
              </div>
              {!vivienda && (
                <Button 
                  size="sm" 
                  color="primary" 
                  className="ml-2"
                >
                  Crear Nueva
                </Button>
              )}
            </div>
          ) : vivienda ? (
            <div className="text-green-700 bg-green-50 px-3 py-2 rounded-md">
              <strong>Vivienda encontrada:</strong> {vivienda.direccion || "Sin dirección"} 
              {vivienda.jefe_famila && ` - ${vivienda.jefe_famila}`}
            </div>
          ) : null}
        </div>

        {/* Mapa - MÁS ANCHO Y MENOS ALTO */}
        <div 
          className="relative bg-slate-200 w-full cursor-pointer" 
          style={{ height: '350px' }}
          onClick={handleMapClick}
        >
          <iframe
            src={getMapUrl()}
            className="w-full h-full border-0 pointer-events-none"
            title={`Mapa de ${vivienda?.direccion || "ubicación"}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          
          {/* Información */}
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg max-w-xs border">
            <div className="font-bold text-sm mb-1">
              {vivienda?.direccion || "Selecciona una vivienda"}
            </div>
            <div className="text-gray-600 text-xs">
              Lat: {currentCoords.lat.toFixed(4)}, Lng: {currentCoords.lng.toFixed(4)}
            </div>
            {clickedCoords && (
              <div className="text-red-600 text-xs mt-1">
                Nuevo: Lat: {clickedCoords.lat.toFixed(4)}, Lng: {clickedCoords.lng.toFixed(4)}
              </div>
            )}
          </div>

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

          {/* Marcador rojo para la nueva ubicación */}
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

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {vivienda ? "Vivienda cargada" : "Modo edición"}
            {showSaveButton && " - Haz clic en el mapa para marcar nueva ubicación"}
          </span>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="flat" 
              onPress={() => {
                setCurrentCoords(DEFAULT_CENTER);
                setClickedCoords(null);
                setShowSaveButton(false);
              }}
            >
              Restablecer
            </Button>
            
            {showSaveButton && (
              <Button 
                size="sm" 
                color="danger" 
                onPress={handleSaveNewLocation}
              >
                Guardar Nueva Ubicación
              </Button>
            )}
            
            <Button 
              size="sm" 
              color="primary" 
              onPress={() => console.log("Guardar:", currentCoords)}
            >
              Guardar Coordenadas
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};