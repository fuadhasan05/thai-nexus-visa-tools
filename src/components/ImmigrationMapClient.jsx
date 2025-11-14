"use client";
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Navigation, X } from 'lucide-react';

// Custom icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><div style="width: 12px; height: 12px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);"></div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const createUserLocationIcon = (heading, isTracking) => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        position: relative;
        transform: rotate(${isTracking ? heading : 0}deg);
        transition: transform 0.3s ease-out;
      ">
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          style="filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.5));"
        >
          <polygon 
            points="3 11 22 2 13 21 11 13 3 11" 
            fill="#3B82F6" 
          />
        </svg>
          </div>
        `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

function MapController({ center, zoom, bounds, onMapMove }) {
  const map = useMap();

  useEffect(() => {
    const handleMoveStart = () => {
      if (onMapMove) {
        onMapMove();
      }
    };

    map.on('dragstart', handleMoveStart);

    return () => {
      map.off('dragstart', handleMoveStart);
    };
  }, [map, onMapMove]);

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [100, 100], maxZoom: 14 });
    } else if (center) {
      map.setView(center, zoom || 17, { duration: 0.5 });
    }
  }, [center, zoom, bounds, map]);

  return null;
}

export default function ImmigrationMapClient(props) {
  const {
    mapVariant = 'desktop',
    mapCenter,
    mapBounds,
    isMapMovedByUser,
    setIsMapMovedByUser,
    selectedOffice,
    setSelectedOffice,
    expandedOffice,
    setExpandedOffice,
    showRoute,
    visibleRouteCoordinates,
    userLocation,
    userHeading,
    filteredOffices = [],
    getDirections
  } = props;

  // Ensure Leaflet default icon configuration runs only on client
  useEffect(() => {
    try {
      // delete may throw in some environments; ignore silently
      try {
        delete L.Icon.Default.prototype._getIconUrl;
      } catch {}
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    } catch {
      // ignore
    }
  }, []);

  const isMobile = mapVariant === 'mobile';

  return (
    <MapContainer
      center={isMobile ? (userLocation || mapCenter) : mapCenter}
      zoom={isMobile ? 17 : 14}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      zoomControl={!isMobile}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution=""
      />

      <MapController
        center={!mapBounds && !isMapMovedByUser && selectedOffice ? [selectedOffice.latitude, selectedOffice.longitude] : (!mapBounds && !isMapMovedByUser && userLocation ? userLocation : null)}
        zoom={selectedOffice ? 15 : (isMobile ? 17 : 14)}
        bounds={mapBounds}
        onMapMove={() => setIsMapMovedByUser && setIsMapMovedByUser(true)}
      />

      {showRoute && visibleRouteCoordinates && visibleRouteCoordinates.length > 0 && (
        <Polyline
          positions={visibleRouteCoordinates}
          color="#BF1E2E"
          weight={isMobile ? 8 : 5}
          opacity={isMobile ? 0.95 : 0.8}
        />
      )}

      {userLocation && (
        <Marker position={userLocation} icon={createUserLocationIcon(userHeading, true)}>
          <Popup>
            <div className="text-center p-2">
              <p className="font-bold text-blue-600 mb-1">Your Location</p>
              <p className="text-xs text-gray-600">Live tracking</p>
            </div>
          </Popup>
        </Marker>
      )}

      {filteredOffices.map((office, index) => (
        <Marker
          key={office.id}
          position={[office.latitude, office.longitude]}
          icon={createCustomIcon(index === 0 ? '#BF1E2E' : '#272262')}
          eventHandlers={{
            click: () => {
              setSelectedOffice && setSelectedOffice(office);
              setExpandedOffice && setExpandedOffice(office.id);
            }
          }}
        >
          <Popup maxWidth={300}>
            <div className="p-2">
              <h3 className="font-bold text-[#272262] mb-2 text-base">{office.name}</h3>
              <p className="text-sm text-[#454545] mb-2">{office.address}</p>
              {office.distance && (
                <p className="text-sm text-[#BF1E2E] font-bold mb-2">
                  {office.distance.toFixed(1)} km from you
                </p>
              )}
              <Button
                size="sm"
                onClick={() => getDirections && getDirections(office)}
                className="w-full bg-[#BF1E2E] hover:bg-[#9d1825] text-white font-bold"
              >
                <Navigation className="w-3 h-3 mr-1" />
                Show Route
              </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
