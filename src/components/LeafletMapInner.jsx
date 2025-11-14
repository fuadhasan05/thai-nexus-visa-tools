import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon paths for CDN markers
try {
  // Defensive: may run only in browser
  delete L.Icon.Default.prototype._getIconUrl;
} catch {}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createThaiNexusIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #BF1E2E; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"><div style="width: 12px; height: 12px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);"></div></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

export default function LeafletMapInner({ officeLocation, setMapReady }) {
  return (
    <MapContainer
      center={[officeLocation.lat, officeLocation.lng]}
      zoom={15}
      style={{ height: '100%', width: '100%', zIndex: 1 }}
      whenReady={() => setMapReady && setMapReady(true)}
      attributionControl={false}
      zoomControl={true}
    >
      <TileLayer
        attribution=""
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[officeLocation.lat, officeLocation.lng]} icon={createThaiNexusIcon()}>
        <Popup>
          <div className="text-center p-2">
            <h3 className="font-bold text-[#272262] mb-1">{officeLocation.name}</h3>
            <p className="text-xs text-[#454545] mb-2">{officeLocation.address}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.open(officeLocation.googleMapsUrl, '_blank')}
                className="px-3 py-1 bg-[#BF1E2E] text-white rounded text-xs font-medium hover:bg-[#9d1825]"
              >
                Google Maps
              </button>
              <button
                onClick={() => window.open(officeLocation.appleMapsUrl, '_blank')}
                className="px-3 py-1 bg-[#272262] text-white rounded text-xs font-medium hover:bg-[#1d1847]"
              >
                Apple Maps
              </button>
            </div>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
