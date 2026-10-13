import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Place } from '../../types';
import { mapService, CARIRI_DEFAULT_CENTER } from '../../services/api/mapService';
import { PlaceCard } from '../cards/PlaceCard';
import { GeolocationConsentModal } from '../common/GeolocationConsentModal';
import { Navigation, Layers, ZoomIn, ZoomOut, X } from 'lucide-react';

interface MapViewProps {
  places: Place[];
  selectedPlaceId?: number | null;
  onPlaceSelect?: (place: Place | null) => void;
  className?: string;
  heightClass?: string;
  onManualCitySelect?: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  places,
  selectedPlaceId,
  onPlaceSelect,
  className = '',
  heightClass = 'h-[calc(100vh-140px)]',
  onManualCitySelect,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isGeoModalOpen, setIsGeoModalOpen] = useState(false);

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

    // Filtra marcadores para renderizar somente locais com coordenadas válidas confirmadas
    const validPlaces = places.filter(
      (place) =>
        typeof place.latitude === 'number' &&
        typeof place.longitude === 'number' &&
        Number.isFinite(place.latitude) &&
        Number.isFinite(place.longitude)
    );

    validPlaces.forEach((place) => {
      const isSelected = activePlace?.id === place.id;
      const icon = mapService.createCustomIcon(place.category_slug, isSelected);

      const lat = place.latitude as number;
      const lng = place.longitude as number;
      const marker = L.marker([lat, lng], { icon }).addTo(map);

      marker.on('click', () => {
        setActivePlace(place);
        if (onPlaceSelect) onPlaceSelect(place);
        if (typeof place.latitude === 'number' && typeof place.longitude === 'number') {
          map.panTo([place.latitude, place.longitude], { animate: true });
        }
      });

      markersRef.current.set(place.id, marker);
      group.addLayer(marker);
    });

    // Fit bounds if valid places exist and no single place is selected
    if (validPlaces.length > 0 && !selectedPlaceId) {
      map.fitBounds(group.getBounds().pad(0.15));
    }
  }, [places, onPlaceSelect]);

  // Sync selectedPlaceId prop
  useEffect(() => {
    if (selectedPlaceId) {
      const match = places.find((p) => p.id === selectedPlaceId);
      if (match) {
        setActivePlace(match);
        if (
          mapInstanceRef.current &&
          typeof match.latitude === 'number' &&
          typeof match.longitude === 'number' &&
          Number.isFinite(match.latitude) &&
          Number.isFinite(match.longitude)
        ) {
          mapInstanceRef.current.setView([match.latitude, match.longitude], 15, { animate: true });
        }
      }
    }
  }, [selectedPlaceId, places]);

  // Update marker visual state (size, ring, zIndex) when activePlace changes
  useEffect(() => {
    markersRef.current.forEach((marker, placeId) => {
      const place = places.find((p) => p.id === placeId);
      if (place) {
        const isSelected = activePlace?.id === placeId;
        marker.setIcon(mapService.createCustomIcon(place.category_slug, isSelected));
        if (isSelected) {
          marker.setZIndexOffset(1000);
        } else {
          marker.setZIndexOffset(0);
        }
      }
    });
  }, [activePlace, places]);

  // Open consent modal before accessing geolocation
  const handleLocateMeClick = () => {
    setIsGeoModalOpen(true);
  };

  const handleConsentGranted = (coords: { latitude: number; longitude: number }) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const userIcon = mapService.createUserLocationIcon();
    const marker = L.marker([coords.latitude, coords.longitude], { icon: userIcon }).addTo(map);
    marker.bindPopup('Sua localização aproximada no Cariri').openPopup();
    userMarkerRef.current = marker;

    map.setView([coords.latitude, coords.longitude], 14, { animate: true });
  };

  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();

  return (
    <div className={`relative w-full ${heightClass} ${className} overflow-hidden rounded-3xl border border-gray-200 shadow-inner`}>
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Geolocation consent modal with explicit purpose and manual choice */}
      <GeolocationConsentModal
        isOpen={isGeoModalOpen}
        onClose={() => setIsGeoModalOpen(false)}
        onConsentGranted={handleConsentGranted}
        onManualSelect={() => {
          setIsGeoModalOpen(false);
          if (onManualCitySelect) {
            onManualCitySelect();
          }
        }}
      />

      {/* Floating Controls */}
      <div className="absolute right-3.5 top-3.5 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateMeClick}
          disabled={isLocating}
          className="w-10 h-10 rounded-2xl bg-white shadow-md flex items-center justify-center text-gray-700 hover:text-[#DE1F2A] hover:bg-gray-50 active:scale-95 transition"
          aria-label="Minha localização aproximada"
          title="Minha localização aproximada (com explicação de finalidade)"
        >
          <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin text-[#DE1F2A]' : ''}`} />
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
