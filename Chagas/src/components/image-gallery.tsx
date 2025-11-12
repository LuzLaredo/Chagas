import React, { useState, useEffect } from "react";
import { Card, CardBody, Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { viviendasService } from "../services/viviendasService";
import { Vivienda } from "../types/viviendas";

interface ImageGalleryProps {
  viviendaId: number;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ viviendaId }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [vivienda, setVivienda] = useState<Vivienda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVivienda = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await viviendasService.getViviendaById(viviendaId);
        setVivienda(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (viviendaId) {
      fetchVivienda();
    }
  }, [viviendaId]);

  const nextImage = () => {
    if (vivienda?.foto_entrada) {
      setCurrentImage((prev) => (prev + 1) % 1); // Solo una imagen por ahora
    }
  };

  const prevImage = () => {
    if (vivienda?.foto_entrada) {
      setCurrentImage((prev) => (prev - 1 + 1) % 1); // Solo una imagen por ahora
    }
  };

  if (loading) return <Spinner label="Cargando..." />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!vivienda) return <div>No se encontró la vivienda</div>;

  // Crear array de imágenes
  const images: string[] = [];
  if (vivienda.foto_entrada) {
    if (vivienda.foto_entrada.startsWith('data:')) {
      images.push(vivienda.foto_entrada);
    } else {
      images.push(`data:image/jpeg;base64,${vivienda.foto_entrada}`);
    }
  }

  return (
    <Card className="overflow-visible shadow-lg">
      <CardBody className="p-0 relative overflow-hidden">
        {images.length > 0 ? (
          <>
            <img 
              src={images[currentImage]} 
              alt={`Vivienda ${vivienda.direccion}`}
              className="w-full h-64 object-cover"
            />
            
            {images.length > 1 && (
              <>
                <div className="absolute inset-y-0 left-0 flex items-center">
                  <Button 
                    isIconOnly 
                    variant="flat" 
                    color="primary" 
                    className="bg-blue-500 text-white rounded-r-none opacity-80"
                    onPress={prevImage}
                  >
                    <Icon icon="lucide:chevron-left" className="text-xl" />
                  </Button>
                </div>
                
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <Button 
                    isIconOnly 
                    variant="flat" 
                    color="primary" 
                    className="bg-blue-500 text-white rounded-l-none opacity-80"
                    onPress={nextImage}
                  >
                    <Icon icon="lucide:chevron-right" className="text-xl" />
                  </Button>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">No hay imagen disponible</span>
          </div>
        )}
        
        {/* Información de la vivienda */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3">
          <div className="font-semibold">{vivienda.direccion}</div>
          <div className="text-sm">
            {vivienda.nombre_comunidad} - {vivienda.nombre_municipio}
          </div>
        </div>
      </CardBody>
    </Card>
  );
};