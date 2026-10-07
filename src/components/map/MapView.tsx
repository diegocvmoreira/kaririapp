import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Place } from '../../types';
import { mapService, CARIRI_DEFAULT_CENTER } from '../../services/api/mapService';
import { PlaceCard } from '../cards/PlaceCard';
import { Navigation, Layers, ZoomIn, ZoomOut, X } from 'lucide-react';

interface MapViewProps {
  places: Place[];
  selectedPlaceId?: number | null;
  onPlaceSelect?: (place: Place | null) => void;
  className?: string;
  heightClass?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlaceId,
  onPlaceSelect,
  className = '',
  heightClass = 'h-[calc(100vh-140px)]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [CARIRI_DEFAULT_CENTER.lat, CARIRI_DEFAULT_CENTER.lng],
      zoom: 12,
      zoomControl: false,
    });

    const tileLayer = mapService.createTileLayer();
    tileLayer.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when places change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const group = L.featureGroup();

    places.forEach((place) => {
      const isSelected = activePlace?.id === place.id;
      const icon = mapService.createCustomIcon(place.category_slug, isSelected);

      const marker = L.marker([place.latitude, place.longitude], { icon }).addTo(map);

      marker.on('click', () => {
        setActivePlace(place);
        if (onPlaceSelect) onPlaceSelect(place);
        map.panTo([place.latitude, place.longitude], { animate: true });
      });

      markersRef.current.set(place.id, marker);
      group.addLayer(marker);
    });

    // Fit bounds if places exist and no single place is selected
    if (places.length > 0 && !selectedPlaceId) {
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [places, onPlaceSelect]);

  // Sync selectedPlaceId prop
  useEffect(() => {
    if (selectedPlaceId) {
      const match = places.find((p) => p.id === selectedPlaceId);
      if (match) {
        setActivePlace(match);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([match.latitude, match.longitude], 15, { animate: true });
        }
      }
    }
  }, [selectedPlaceId, places]);

  // Handle current user location
  const handleLocateMe = async () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    setIsLocating(true);
    try {
      const coords = await mapService.getUserLocation();

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      const userIcon = mapService.createUserLocationIcon();
      const marker = L.marker([coords.lat, coords.lng], { icon: userIcon }).addTo(map);
      marker.bindPopup('Sua localização atual no Cariri').openPopup();
      userMarkerRef.current = marker;

      map.setView([coords.lat, coords.lng], 14, { animate: true });
    } catch {
      // Default to Juazeiro do Norte center if geolocation denied
      map.setView([-7.2139, -39.3153], 13, { animate: true });
    } finally {
      setIsLocating(false);
    }
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className={`relative w-full ${heightClass} ${className} overflow-hidden rounded-3xl border border-gray-200 shadow-inner`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Controls */}
      <div className="absolute right-3.5 top-3.5 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-gray-700 hover:text-[#D9262E] hover:bg-gray-50 active:scale-95 transition"
          aria-label="Minha localização atual"
          title="Minha localização atual"
        >
          <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin text-[#D9262E]' : ''}`} />
        </button>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col divide-y divide-gray-100">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition"
            aria-label="Aproximar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:scale-95 transition"
            aria-label="Afastar zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Place Overlay Card on Mobile & Desktop */}
      {activePlace && (
        <div className="absolute bottom-4 inset-x-4 sm:inset-x-auto sm:left-4 sm:w-84 z-20 animate-in slide-in-from-bottom duration-200">
          <div className="relative">
            <button
              onClick={() => {
                setActivePlace(null);
                if (onPlaceSelect) onPlaceSelect(null);
              }}
              className="absolute -top-2.5 -right-2.5 z-30 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-black border border-gray-100"
              aria-label="Fechar prévia"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <PlaceCard place={activePlace} variant="horizontal" className="shadow-2xl border-white" />
          </div>
        </div>
      )}
    </div>
  );
};
