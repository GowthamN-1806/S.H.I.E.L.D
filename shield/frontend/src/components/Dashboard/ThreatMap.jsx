import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ZONES = [
    { id: 'zone-1', name: 'Commercial District', lat: 18.52, lng: 73.85, status: 'SECURE', radius: 800 },
    { id: 'zone-2', name: 'Industrial Zone', lat: 18.55, lng: 73.88, status: 'SECURE', radius: 600 },
    { id: 'zone-3', name: 'Residential North', lat: 18.58, lng: 73.82, status: 'ELEVATED', radius: 700 },
    { id: 'zone-4', name: 'IT Park', lat: 18.59, lng: 73.74, status: 'SECURE', radius: 500 },
    { id: 'zone-5', name: 'Water Treatment', lat: 18.50, lng: 73.90, status: 'ELEVATED', radius: 400 },
    { id: 'zone-6', name: 'Power Station', lat: 18.54, lng: 73.79, status: 'SECURE', radius: 450 },
];

const COLOR_MAP = { SECURE: '#22c55e', ELEVATED: '#eab308', INCIDENT: '#ef4444' };

export default function ThreatMap({ alerts = [] }) {
    // Update zone status based on alerts
    const zones = ZONES.map(z => {
        const relatedAlert = alerts.find(a => a.targetSystem && z.name.toLowerCase().includes(a.targetSystem));
        if (relatedAlert && relatedAlert.severity === 'CRITICAL') return { ...z, status: 'INCIDENT' };
        return z;
    });

    return (
        <div className="bg-[#1e293b] border border-gray-800 rounded-xl overflow-hidden h-full">
            <div className="p-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-white">🗺️ City Threat Map</h3>
            </div>
            <div className="h-[350px]">
                <MapContainer center={[18.54, 73.83]} zoom={12} className="h-full w-full" style={{ background: '#0f172a' }}
                    scrollWheelZoom={false} attributionControl={false}>
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                    {zones.map(z => (
                        <CircleMarker key={z.id} center={[z.lat, z.lng]} radius={z.status === 'INCIDENT' ? 20 : 15}
                            pathOptions={{ color: COLOR_MAP[z.status], fillColor: COLOR_MAP[z.status], fillOpacity: 0.3, weight: 2 }}>
                            <Tooltip direction="top" permanent={z.status !== 'SECURE'}>
                                <span className="text-xs font-medium">{z.name}: {z.status}</span>
                            </Tooltip>
                            <Popup>
                                <div className="text-xs">
                                    <p className="font-bold">{z.name}</p>
                                    <p>Status: <span style={{ color: COLOR_MAP[z.status] }}>{z.status}</span></p>
                                </div>
                            </Popup>
                        </CircleMarker>
                    ))}
                </MapContainer>
            </div>
        </div>
    );
}
