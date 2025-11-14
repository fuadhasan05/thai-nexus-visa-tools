
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
const ClientOnlyMap = dynamic(() => import('@/components/ClientOnlyMap'), { ssr: false });
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, Navigation, Phone, Clock, Info, Search, Star, Crosshair, NavigationOff, Loader2, AlertCircle, ExternalLink, ChevronDown, ChevronUp, X, ArrowRight, ArrowLeft, ArrowUp, TrendingUp } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ContactCTA from '../../components/ContactCTA';
import SEOHead from '../../components/SEOHead';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';

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

// Custom user location icon - blue navigation icon only, no border
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
          style="
            filter: drop-shadow(0 2px 8px rgba(59, 130, 246, 0.5));
          "
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

// Map controller - removed rotation support since Leaflet doesn't support setBearing
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

export default function ImmigrationMap() {
  // Ensure Leaflet default icon configuration runs only on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      // Use imported Leaflet (L) - adjust default icon URLs for client runtime
      try {
        // delete may throw in some environments; ignore silently
        delete L.Icon.Default.prototype._getIconUrl;
      } catch {
        // ignore
      }
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });
    } catch {
      // ignore during server build or if leaflet isn't available
    }
  }, []);
  const [userLocation, setUserLocation] = useState(null);
  const [prevUserLocation, setPrevUserLocation] = useState(null);
  const [userHeading, setUserHeading] = useState(0); // 0-360 degrees
  const [userSpeed, setUserSpeed] = useState(0); // Track user speed in m/s
  const [lastSpeedUpdate, setLastSpeedUpdate] = useState(null);
  const [selectedOffice, setSelectedOffice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tracking, setTracking] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt');
  const [expandedOffice, setExpandedOffice] = useState(null);
  const [sortBy, setSortBy] = useState('distance');
  const [routeData, setRouteData] = useState(null); // Contains coordinates and allCoordinates
  const [showRoute, setShowRoute] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [showMobileSheet, setShowMobileSheet] = useState(false);
  const [directions, setDirections] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isMapMovedByUser, setIsMapMovedByUser] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const { data: offices = [], isLoading } = useQuery({
    queryKey: ['immigration-offices'],
    queryFn: () => base44.entities.ImmigrationOffice.filter({ is_active: true }),
    initialData: []
  });

  // Calculate distance between two points in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate distance in kilometers for display
  const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
    return calculateDistance(lat1, lon1, lat2, lon2) / 1000;
  };

  // Calculate heading from movement
  const calculateHeading = (lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
    const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
              Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  };

  // Update current step based on user location
  const updateCurrentStep = (userLoc, steps) => {
    if (!userLoc || !steps || steps.length === 0) return;

    // Find the closest upcoming step
    let closestIndex = currentStepIndex;
    let minDistance = Infinity;

    for (let i = currentStepIndex; i < steps.length; i++) {
      const step = steps[i];
      if (step.location) {
        // step.location is [lng, lat] from OSRM
        const dist = calculateDistance(
          userLoc[0], userLoc[1],
          step.location[1], step.location[0]
        );
        
        // If we're within 30m of this step, and it's ahead of current, advance
        if (dist < 30 && i > closestIndex) {
          closestIndex = i;
          break;
        }
        
        // Track minimum distance to find closest step
        if (dist < minDistance && i >= currentStepIndex) {
          minDistance = dist;
          closestIndex = i;
        }
      }
    }

    // Only update if we've progressed forward
    if (closestIndex > currentStepIndex) {
      setCurrentStepIndex(closestIndex);
    }
  };

  // Check if user has deviated from route
  const checkRouteDeviation = (userLoc, routeCoords) => {
    if (!userLoc || !routeCoords || routeCoords.length === 0) return false;

    // Find minimum distance to any point on the route
    let minDistance = Infinity;
    for (const coord of routeCoords) {
      const dist = calculateDistance(userLoc[0], userLoc[1], coord[0], coord[1]);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    // If more than 50m from route, recalculate
    return minDistance > 50;
  };

  // Filter route to show only waypoints ahead
  const filterRouteAhead = (userLoc, allCoords) => {
    if (!userLoc || !allCoords || allCoords.length < 2) return allCoords; // Need at least 2 points for a segment

    let closestIndex = 0;
    let minDistance = Infinity;

    // Find the closest point on the route (or segment) to the user
    for (let i = 0; i < allCoords.length - 1; i++) {
        const p1 = L.latLng(allCoords[i][0], allCoords[i][1]);
        const p2 = L.latLng(allCoords[i+1][0], allCoords[i+1][1]);
        const userPoint = L.latLng(userLoc[0], userLoc[1]);

        // Leaflet's `closestLayerPoint` for polylines might be better, but not directly exposed
        // Approximate by checking distance to points and segment
        const distToP1 = userPoint.distanceTo(p1);
        if (distToP1 < minDistance) {
            minDistance = distToP1;
            closestIndex = i;
        }

        // Project user point onto the segment (p1, p2)
        const segmentLengthSq = p1.distanceTo(p2) * p1.distanceTo(p2);
        if (segmentLengthSq === 0) continue; // Points are the same

        const t = ((userPoint.lat - p1.lat) * (p2.lat - p1.lat) + (userPoint.lng - p1.lng) * (p2.lng - p1.lng)) / segmentLengthSq;

        let projectionLat, projectionLng;
        if (t < 0) {
            projectionLat = p1.lat;
            projectionLng = p1.lng;
        } else if (t > 1) {
            projectionLat = p2.lat;
            projectionLng = p2.lng;
        } else {
            projectionLat = p1.lat + t * (p2.lat - p1.lat);
            projectionLng = p1.lng + t * (p2.lng - p1.lng);
        }
        const distToSegment = userPoint.distanceTo(L.latLng(projectionLat, projectionLng));

        if (distToSegment < minDistance) {
            minDistance = distToSegment;
            closestIndex = i; // Keep track of the segment index
        }
    }

    // Return coordinates from the closest segment onwards.
    // If the user is very close to a segment, we'll show that segment and everything after it.
    // Let's return from `closestIndex` + 1 to show points ahead.
    return allCoords.slice(closestIndex);
  };

  const requestLocation = () => {
    setLocationError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = [position.coords.latitude, position.coords.longitude];
          setUserLocation(newLocation);
          setPermissionState('granted');
          setLocationError(null);
          
          // Auto-start tracking after getting location
          if (!tracking) {
            startTracking();
          }
        },
        (error) => {
          console.error('Location error:', error);
          setPermissionState('denied');
          if (error.code === 1) {
            setLocationError('Location permission denied. Please enable location in your browser settings.');
          } else if (error.code === 2) {
            setLocationError('Location unavailable. Please check your device settings.');
          } else {
            setLocationError('Unable to get your location. Please try again.');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  };

  const startTracking = () => {
    if (navigator.geolocation) {
      console.log('Starting GPS tracking with high accuracy');
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = [position.coords.latitude, position.coords.longitude];
          const timestamp = Date.now();

          // Calculate heading and speed from movement if we have previous location
          if (prevUserLocation && lastSpeedUpdate) {
            const movedDistance = calculateDistance(
              prevUserLocation[0], prevUserLocation[1],
              newLocation[0], newLocation[1]
            );
            
            const timeDiff = (timestamp - lastSpeedUpdate) / 1000; // seconds
            const speed = timeDiff > 0 ? movedDistance / timeDiff : 0; // m/s
            setUserSpeed(speed);

            // Only update heading if moved more than 2 meters (to avoid jitter)
            if (movedDistance > 2) {
              const heading = calculateHeading(
                prevUserLocation[0], prevUserLocation[1],
                newLocation[0], newLocation[1]
              );
              setUserHeading(heading);
              console.log(`Speed: ${speed.toFixed(1)} m/s, Heading: ${heading.toFixed(0)}°`);
            }
          }

          setPrevUserLocation(userLocation);
          setUserLocation(newLocation);
          setLastSpeedUpdate(timestamp);
          setLocationError(null);
          setPermissionState('granted');

          // Update current navigation step based on proximity
          if (showRoute && directions.length > 0) {
            updateCurrentStep(newLocation, directions);
          }

          // Check if user deviated from route and recalculate if needed
          if (showRoute && routeData && routeData.allCoordinates && !isRecalculating) {
            const hasDeviated = checkRouteDeviation(newLocation, routeData.allCoordinates);
            if (hasDeviated) {
              console.log('User deviated from route, recalculating...');
              recalculateRoute(newLocation);
            }
          }
        },
        (error) => {
          console.error('Tracking error:', error);
          if (error.code === 1) {
            setLocationError('Location permission denied. Please enable location access in your device settings.');
          } else if (error.code === 2) {
            setLocationError('Location unavailable. Make sure location services are enabled on your device.');
          } else {
            setLocationError('Live tracking failed. Please check location permissions and try again.');
          }
          // Don't stop tracking on temporary errors
          if (error.code === 1) {
            stopTracking();
          }
        },
        { 
          enableHighAccuracy: true, 
          maximumAge: 3000, 
          timeout: 15000 
        }
      );
      setWatchId(id);
      setTracking(true);
      console.log('GPS tracking started, watch ID:', id);
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setTracking(false);
      setUserSpeed(0);
      console.log('GPS tracking stopped');
    }
  };

  const recalculateRoute = async (currentLocation) => {
    if (!selectedOffice || isRecalculating) return;

    setIsRecalculating(true);

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${currentLocation[1]},${currentLocation[0]};${selectedOffice.longitude},${selectedOffice.latitude}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

        const steps = [];
        route.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            if (step.maneuver) {
              const bearing = step.maneuver.bearing_after || 0;
              const direction = getDirectionFromBearing(bearing);
              const distance = (step.distance / 1000).toFixed(1);

              steps.push({
                instruction: step.maneuver.instruction || direction.text,
                distance: `${distance} km`,
                direction: direction,
                location: step.maneuver.location
              });
            }
          });
        });

        steps.push({
          instruction: `Arrive at ${selectedOffice.name}`,
          distance: '0 km',
          direction: { text: 'Destination', icon: MapPin },
          location: [selectedOffice.longitude, selectedOffice.latitude]
        });

        setRouteData({
          coordinates, // This is the original full route geometry
          allCoordinates: coordinates, // Store all for deviation checking
          distance: (route.distance / 1000).toFixed(1),
          duration: Math.round(route.duration / 60),
        });
        setDirections(steps);
        setCurrentStepIndex(0); // Reset steps
      }
    } catch (error) {
      console.error('Error recalculating route:', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  useEffect(() => {
    if (userLocation && !tracking) {
      console.log('User location available but not tracking, starting...');
      startTracking();
    }
  }, [userLocation, tracking]);

  // Force tracking to start when navigation begins
  useEffect(() => {
    if (showRoute) {
      console.log('Navigation started - checking GPS tracking');
      if (!userLocation) {
        console.log('No location yet, requesting...');
        requestLocation();
      } else if (!tracking) {
        console.log('Location available, starting tracking...');
        startTracking();
      } else {
        console.log('Already tracking');
      }
    }
  }, [showRoute, userLocation, tracking]);

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionState(result.state);
        if (result.state === 'granted') {
          requestLocation();
        }
      });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const getDirectionFromBearing = (bearing) => {
    if (bearing >= 337.5 || bearing < 22.5) return { text: 'Head North', icon: ArrowUp };
    if (bearing >= 22.5 && bearing < 67.5) return { text: 'Turn Northeast', icon: TrendingUp };
    if (bearing >= 67.5 && bearing < 112.5) return { text: 'Turn Right', icon: ArrowRight };
    if (bearing >= 112.5 && bearing < 157.5) return { text: 'Turn Southeast', icon: TrendingUp };
    if (bearing >= 157.5 && bearing < 202.5) return { text: 'Head South', icon: ArrowUp };
    if (bearing >= 202.5 && bearing < 247.5) return { text: 'Turn Southwest', icon: TrendingUp };
    if (bearing >= 247.5 && bearing < 292.5) return { text: 'Turn Left', icon: ArrowLeft };
    return { text: 'Turn Northwest', icon: TrendingUp };
  };

  const getDirections = async (office) => {
    if (!userLocation) {
      alert('Please enable location first');
      return;
    }

    setLoadingRoute(true);
    setSelectedOffice(office);
    setShowMobileSheet(true);
    setSheetExpanded(false);
    setCurrentStepIndex(0);
    setIsMapMovedByUser(false);

    // Force GPS tracking to start for navigation - with extra checks
    console.log('Getting directions, checking GPS state:', { tracking, watchId, userLocation: !!userLocation });
    if (!tracking) {
      console.log('Starting GPS tracking for navigation');
      startTracking();
    }

    // Try to request location permissions again if not granted
    if (permissionState !== 'granted') {
      console.log('Permission not granted, requesting...');
      requestLocation();
    }

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLocation[1]},${userLocation[0]};${office.longitude},${office.latitude}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

        const steps = [];
        route.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            if (step.maneuver) {
              const bearing = step.maneuver.bearing_after || 0;
              const direction = getDirectionFromBearing(bearing);
              const distance = (step.distance / 1000).toFixed(1);

              steps.push({
                instruction: step.maneuver.instruction || direction.text,
                distance: `${distance} km`,
                direction: direction,
                location: step.maneuver.location
              });
            }
          });
        });

        steps.push({
          instruction: `Arrive at ${office.name}`,
          distance: '0 km',
          direction: { text: 'Destination', icon: MapPin },
          location: [office.longitude, office.latitude]
        });

        setRouteData({
          coordinates, // Original coordinates for bounds
          allCoordinates: coordinates, // Store all for deviation checking
          distance: (route.distance / 1000).toFixed(1),
          duration: Math.round(route.duration / 60),
        });
        setShowRoute(true);
        setDirections(steps);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      alert('Failed to get directions. Please try again.');
    } finally {
      setLoadingRoute(false);
    }
  };

  const clearRoute = () => {
    setRouteData(null);
    setShowRoute(false);
    setSelectedOffice(null);
    setShowMobileSheet(false);
    setDirections([]);
    setCurrentStepIndex(0);
    setSheetExpanded(false);
    setIsMapMovedByUser(false);
    setUserHeading(0); // Reset heading when route is cleared
    // Keep tracking active even after clearing route
  };

  const openGoogleMaps = (office) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation ? `${userLocation[0]},${userLocation[1]}` : 'Current+Location'}&destination=${office.latitude},${office.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openAppleMaps = (office) => {
    const url = `http://maps.apple.com/?daddr=${office.latitude},${office.longitude}&dirflg=d`;
    window.open(url, '_blank');
  };

  const filteredOffices = offices
    .filter(office =>
      office.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.province?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(office => ({
      ...office,
      distance: userLocation ? calculateDistanceKm(userLocation[0], userLocation[1], office.latitude, office.longitude) : null
    }))
    .sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.distance || Infinity) - (b.distance || Infinity);
      } else if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  const mapCenter = selectedOffice
    ? [selectedOffice.latitude, selectedOffice.longitude]
    : userLocation
    ? userLocation
    : [13.7563, 100.5018];

  const mapBounds = showRoute && routeData
    ? L.latLngBounds(routeData.coordinates)
    : null;

  const nearestOffice = filteredOffices[0];
  const currentStep = directions[currentStepIndex];

  // Filter route to show only ahead
  const visibleRouteCoordinates = routeData && userLocation
    ? filterRouteAhead(userLocation, routeData.allCoordinates)
    : routeData?.coordinates;

  const handleRecenter = () => {
    if (userLocation) {
      setIsMapMovedByUser(false); // Re-enable auto-tracking and rotation
    }
  };

  // Auto-scroll selected office into view with better centering
  useEffect(() => {
    if (selectedOffice) {
      const element = document.getElementById(`office-${selectedOffice.id}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }, 100);
      }
    }
  }, [selectedOffice]);

  // Get cardinal direction from heading
  const getCardinalDirection = (heading) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  // Check if user is driving (speed > 1.5 m/s or ~5.4 km/h)
  const isDriving = userSpeed > 1.5;

  return (
    <>
      <SEOHead page="ImmigrationMap" />    <div className="max-w-7xl mx-auto space-y-8">
      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
          50% { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0); }
        }
        .leaflet-container {
          border-radius: 1.5rem;
          z-index: 1;
        }
        .custom-marker {
          background: transparent;
          border: none;
        }
        .user-location-marker {
          background: transparent;
          border: none;
        }

        /* Hide default Leaflet attribution completely and show only custom text */
        .leaflet-control-attribution {
          background: rgba(255, 255, 255, 0.9) !important;
          font-size: 11px !important;
          padding: 3px 8px !important;
          border-radius: 4px !important;
          font-weight: 600 !important;
          color: #272262 !important;
        }
        
        .leaflet-control-attribution a,
        .leaflet-control-attribution span {
          display: none !important;
        }

        @media (max-width: 1024px) {
          .mobile-gps-sheet {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            top: 0;
            background: transparent;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            pointer-events: none;
          }

          .mobile-gps-sheet.show {
            pointer-events: auto;
          }

          .mobile-gps-header {
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(10px);
            color: white;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1001;
            pointer-events: auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          }

          .mobile-gps-map-container {
            position: fixed;
            top: 72px;
            left: 0;
            right: 0;
            bottom: 220px;
            overflow: hidden;
            pointer-events: auto;
            z-index: 1;
          }

          .mobile-route-info {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            background: white;
            border-radius: 24px 24px 0 0;
            box-shadow: 0 -4px 24px rgba(0,0,0,0.2);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            pointer-events: auto;
            max-height: 85vh;
            display: flex;
            flex-direction: column;
          }

          .mobile-route-info.minimized {
            transform: translateY(calc(100% - 220px));
            padding-bottom: 10px;
          }

          .mobile-route-info.expanded {
            transform: translateY(0);
          }

          .sheet-handle-area {
            padding: 16px;
            cursor: pointer;
            flex-shrink: 0;
            -webkit-tap-highlight-color: transparent;
          }

          .sheet-handle {
            width: 48px;
            height: 5px;
            background: #D1D5DB;
            border-radius: 3px;
            margin: 0 auto;
            transition: background 0.2s;
          }

          .sheet-handle-area:active .sheet-handle {
            background: #9CA3AF;
          }

          .sheet-content-scroll {
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 24px 34px;
            -webkit-overflow-scrolling: touch;
          }

          .sheet-content-scroll.minimized {
            overflow: hidden;
          }

          .recenter-button {
            position: absolute;
            bottom: 26px;
            right: 26px;
            z-index: 700;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: white;
            border: 2px solid #E7E7E7;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
          }

          .recenter-button:active {
            transform: scale(0.95);
            background: #F8F9FA;
          }

          .recenter-button.tracking {
            background: #3B82F6;
            border-color: #3B82F6;
          }

          .recenter-button.manual {
            background: #F59E0B;
            border-color: #F59E0B;
            animation: pulse-orange 2s infinite;
          }

          @keyframes pulse-orange {
            0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7); }
            50% { box-shadow: 0 0 0 8px rgba(245, 158, 11, 0); }
          }
        }

        .office-list-container {
          max-height: 800px;
          overflow-y: auto;
          padding-right: 8px;
        }

        .office-list-container::-webkit-scrollbar {
          width: 6px;
        }

        .office-list-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        .office-list-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }

        .office-list-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#272262] via-[#3d3680] to-[#272262] p-10 text-center">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-4">
            <MapPin className="w-5 h-5 text-white" />
            <span className="text-white text-sm font-bold">Live GPS Navigation</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Find Your Immigration Office</h1>
          <p className="text-white/90 text-lg">Turn-by-turn GPS directions to the nearest immigration office in Thailand</p>
        </div>
      </div>

      {/* Location Controls - Updated */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {!userLocation ? (
            <>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-[#272262] mb-2">Enable Location Services</h3>
                <p className="text-[#454545] text-sm">Allow location access to find offices near you and get live GPS navigation</p>
                {locationError && (
                  <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{locationError}</p>
                  </div>
                )}
              </div>
              <Button
                onClick={requestLocation}
                className="bg-[#BF1E2E] hover:bg-[#9d1825] text-white px-8 py-6 text-lg font-bold shadow-lg"
              >
                <Crosshair className="w-5 h-5 mr-2" />
                Enable Location
              </Button>
            </>
          ) : (
            <>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#272262]">Live Tracking Active</h3>
                    <p className="text-sm text-[#454545]">GPS location updating in real-time</p>
                  </div>
                </div>
                {nearestOffice && (
                  <p className="text-sm text-[#454545] mt-2">
                    Nearest office: <span className="font-bold text-[#BF1E2E]">{nearestOffice.name}</span> ({nearestOffice.distance.toFixed(1)} km away)
                  </p>
                )}
              </div>
              <Button
                onClick={() => {
                  stopTracking();
                  setUserLocation(null);
                  setPrevUserLocation(null);
                  setUserHeading(0);
                }}
                variant="outline"
                className="border border-[#E7E7E7] text-[#454545] hover:bg-[#F8F9FA]"
              >
                Disable Location
              </Button>
            </>
          )}
        </div>
      </GlassCard>

      {/* Current Navigation Step - Show speed indicator when tracking */}
      {showRoute && currentStep && (
        <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center shadow-xl">
              {React.createElement(currentStep.direction.icon, { className: "w-8 h-8 text-white" })}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="text-sm text-[#454545] font-medium">Step {currentStepIndex + 1} of {directions.length}</div>
                {tracking && userSpeed > 0 && (
                  <div className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                    {(userSpeed * 3.6).toFixed(0)} km/h
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-[#272262] mb-1">{currentStep.instruction}</h3>
              <p className="text-[#BF1E2E] font-bold text-lg">{currentStep.distance}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
            <Button
              onClick={() => setCurrentStepIndex(Math.min(directions.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex === directions.length - 1}
              className="flex-1 bg-[#BF1E2E] hover:bg-[#9d1825] text-white"
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Search and Sort */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by city, province, or office name..."
              className="pl-10 h-12 text-lg border"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#E7E7E7] bg-white text-[#272262] font-medium h-12"
          >
            <option value="distance">Sort by Distance</option>
            <option value="rating">Sort by Rating</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Office List - With proper scrolling and containment */}
        <div className="office-list-container space-y-4">
          {isLoading ? (
            <GlassCard className="p-8 text-center">
              <Loader2 className="w-12 h-12 text-[#272262] animate-spin mx-auto mb-4" />
              <p className="text-[#454545] font-medium">Loading immigration offices...</p>
            </GlassCard>
          ) : filteredOffices.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No offices found matching your search</p>
              <Button onClick={() => setSearchTerm('')} variant="outline" className="mt-4">
                Clear Search
              </Button>
            </GlassCard>
          ) : (
            filteredOffices.map((office, index) => (
              <GlassCard
                id={`office-${office.id}`}
                key={office.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedOffice?.id === office.id
                    ? 'ring-2 ring-[#BF1E2E] shadow-xl bg-red-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => {
                  setSelectedOffice(office);
                  if (expandedOffice === office.id) {
                    setExpandedOffice(null);
                  } else {
                    setExpandedOffice(office.id);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${index === 0 ? 'bg-gradient-to-br from-[#BF1E2E] to-[#d94656]' : 'bg-gradient-to-br from-[#272262] to-[#3d3680]'} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <span className="text-white text-base font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="text-base font-bold text-[#272262] mb-1 break-words line-clamp-2">{office.name}</h3>
                      <p className="text-sm text-[#454545] mb-2 break-words">{office.city}, {office.province}</p>
                      {office.distance && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BF1E2E]/10 border border-[#BF1E2E]/30">
                          <Navigation className="w-3 h-3 text-[#BF1E2E] flex-shrink-0" />
                          <span className="text-[#BF1E2E] font-bold text-xs whitespace-nowrap">{office.distance.toFixed(1)} km</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedOffice(expandedOffice === office.id ? null : office.id);
                    }}
                    variant="ghost"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {expandedOffice === office.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                </div>

                {office.rating && (
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < Math.floor(office.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-xs text-[#454545] ml-1 font-medium">({office.rating})</span>
                  </div>
                )}

                {expandedOffice === office.id && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-[#E7E7E7]">
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-[#272262] mt-0.5 flex-shrink-0" />
                      <span className="text-[#454545] break-words">{office.address}</span>
                    </div>
                    {office.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-[#272262] flex-shrink-0" />
                        <a href={`tel:${office.phone}`} className="text-[#BF1E2E] hover:underline font-medium break-all">
                          {office.phone}
                        </a>
                      </div>
                    )}
                    {office.hours && (
                      <div className="flex items-start gap-2 text-sm">
                        <Clock className="w-4 h-4 text-[#272262] mt-0.5 flex-shrink-0" />
                        <span className="text-[#454545] break-words">{office.hours}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation Options */}
                <div className="grid grid-cols-1 gap-2 mt-4">
                  {userLocation && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        getDirections(office);
                      }}
                      disabled={loadingRoute}
                      className="w-full bg-[#BF1E2E] hover:bg-[#9d1825] text-white font-bold py-3 text-sm"
                    >
                      {loadingRoute && selectedOffice?.id === office.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 h-4 mr-2" />
                          Show Route
                        </>
                      )}
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openGoogleMaps(office);
                      }}
                      variant="outline"
                      className="w-full border border-[#272262] text-[#272262] hover:bg-[#F8F9FA] font-bold text-xs py-2"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Google
                    </Button>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAppleMaps(office);
                      }}
                      variant="outline"
                      className="w-full border border-[#272262] text-[#272262] hover:bg-[#F8F9FA] font-bold text-xs py-2"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Apple
                    </Button>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Desktop Map - Sticky on desktop */}
        <div className="lg:sticky lg:top-24 h-[600px] lg:h-[800px]">
          <div className="h-full rounded-3xl overflow-hidden shadow-xl border-2 border-[#E7E7E7] relative">
            {showRoute && routeData && (
              <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-[#E7E7E7]" style={{ marginTop: (showRoute && userLocation) ? '0' : '0' }}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-[#272262] truncate pr-2">To {selectedOffice?.name}</h3>
                  <Button onClick={clearRoute} size="sm" variant="ghost" className="flex-shrink-0">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-xl font-bold text-[#272262]">{routeData.distance} km</div>
                    <div className="text-xs text-[#454545] font-medium">Distance</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-xl font-bold text-[#272262]">{routeData.duration} min</div>
                    <div className="text-xs text-[#454545] font-medium">Drive Time</div>
                  </div>
                </div>
                {isRecalculating && (
                  <div className="mt-2 text-xs text-[#BF1E2E] font-medium flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Recalculating route...
                  </div>
                )}
              </div>
            )}

            {userLocation && (
              <button
                onClick={handleRecenter}
                className={`absolute bottom-[26px] right-[26px] z-[1000] w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  isMapMovedByUser
                    ? 'bg-[#F59E0B] border-2 border-[#F59E0B] animate-pulse'
                    : tracking && showRoute
                    ? 'bg-[#3B82F6] border-2 border-[#3B82F6]'
                    : 'bg-white border-2 border-[#E7E7E7]'
                }`}
                aria-label="Recenter on my location"
              >
                <Navigation className={`w-6 h-6 ${
                  isMapMovedByUser || (tracking && showRoute) ? 'text-white' : 'text-[#272262]'
                }`} />
              </button>
            )}

            <MapContainer
              center={mapCenter}
              zoom={14}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              zoomControl={true}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution=''
              />
              <MapController
                center={!mapBounds && !isMapMovedByUser && selectedOffice ? [selectedOffice.latitude, selectedOffice.longitude] : (!mapBounds && !isMapMovedByUser && userLocation ? userLocation : null)}
                zoom={selectedOffice ? 15 : 13}
                bounds={mapBounds}
                onMapMove={() => setIsMapMovedByUser(true)}
              />

              {showRoute && visibleRouteCoordinates && visibleRouteCoordinates.length > 0 && (
                <Polyline
                  positions={visibleRouteCoordinates}
                  color="#BF1E2E"
                  weight={5}
                  opacity={0.8}
                />
              )}

              {userLocation && (
                <Marker position={userLocation} icon={createUserLocationIcon(userHeading, tracking && showRoute)}>
                  <Popup>
                    <div className="text-center p-2">
                      <p className="font-bold text-blue-600 mb-1">Your Location</p>
                      <p className="text-xs text-gray-600">{tracking ? 'Live tracking active' : 'GPS locked'}</p>
                      {showRoute && <p className="text-xs text-[#272262] font-medium">Heading: {getCardinalDirection(userHeading)}</p>}
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
                      setSelectedOffice(office);
                      setExpandedOffice(office.id);
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
                        onClick={() => getDirections(office)}
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

            {/* Custom attribution overlay */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '3px 8px',
              borderRadius: '4px 0 0 0',
              fontSize: '11px',
              fontWeight: 600,
              color: '#272262'
            }}>
              Thai Nexus Map 1.1
            </div>
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Directions List */}
      {showRoute && directions.length > 0 && (
        <GlassCard className="p-8">
          <h2 className="text-2xl font-bold text-[#272262] mb-6">Turn-by-Turn Directions</h2>
          <div className="space-y-3">
            {directions.map((step, index) => (
              <div
                key={index}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
                  index === currentStepIndex
                    ? 'border-2 border-[#BF1E2E] bg-red-50 shadow-lg'
                    : 'border-[#E7E7E7] hover:bg-[#F8F9FA]'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  index === currentStepIndex ? 'bg-[#BF1E2E]' : 'bg-[#272262]'
                }`}>
                  {React.createElement(step.direction.icon, { className: "w-5 h-5 text-white" })}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#272262] mb-1">{step.instruction}</p>
                  <p className="text-sm text-[#454545]">{step.distance}</p>
                </div>
                {index === currentStepIndex && (
                  <div className="px-3 py-1 rounded-full bg-[#BF1E2E] text-white text-xs font-bold">
                    Current
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Mobile GPS View - Fixed Layout */}
      {showRoute && routeData && (
        <div className={`mobile-gps-sheet lg:hidden ${showMobileSheet ? 'show' : ''}`}>
          {/* GPS Header - Fixed at top */}
          <div className="mobile-gps-header px-6 py-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-white/70 mb-1">Navigating to</div>
              <h3 className="text-lg font-bold text-white truncate">{selectedOffice?.name}</h3>
            </div>
            <button
              onClick={clearRoute}
              className="ml-3 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* GPS Map Container - Centered */}
          <div className="mobile-gps-map-container">
            <button
              onClick={handleRecenter}
              className={`recenter-button ${
                isMapMovedByUser
                  ? 'manual'
                  : tracking && showRoute
                  ? 'tracking'
                  : ''
              }`}
              aria-label="Recenter on my location"
            >
              <Navigation className={`w-6 h-6 ${
                isMapMovedByUser || (tracking && showRoute) ? 'text-white' : 'text-[#272262]'
              }`} />
            </button>

            <MapContainer
              center={userLocation || mapCenter}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
              zoomControl={false}
              dragging={true}
              touchZoom={true}
              attributionControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution=''
              />
              <MapController
                center={!isMapMovedByUser ? userLocation : null}
                zoom={17}
                bounds={null}
                onMapMove={() => setIsMapMovedByUser(true)}
              />

              {showRoute && visibleRouteCoordinates && visibleRouteCoordinates.length > 0 && (
                <Polyline
                  positions={visibleRouteCoordinates}
                  color="#BF1E2E"
                  weight={8}
                  opacity={0.95}
                />
              )}

              {userLocation && (
                <Marker position={userLocation} icon={createUserLocationIcon(userHeading, tracking && showRoute)} />
              )}

              {selectedOffice && (
                <Marker
                  position={[selectedOffice.latitude, selectedOffice.longitude]}
                  icon={createCustomIcon('#BF1E2E')}
                />
              )}
            </MapContainer>

            {/* Custom attribution overlay for mobile */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.9)',
              padding: '3px 8px',
              borderRadius: '4px 0 0 0',
              fontSize: '11px',
              fontWeight: 600,
              color: '#272262'
            }}>
              Thai Nexus Map 1.1
            </div>
          </div>

          {/* Bottom Sheet - Fixed at bottom */}
          <div className={`mobile-route-info ${sheetExpanded ? 'expanded' : 'minimized'}`}>
            {/* Tap Handle */}
            <div
              className="sheet-handle-area"
              onClick={() => setSheetExpanded(!sheetExpanded)}
            >
              <div className="sheet-handle" />
              {!sheetExpanded && (
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500 font-medium">Tap to expand</p>
                </div>
              )}
              {sheetExpanded && (
                <div className="text-center mt-2">
                  <p className="text-xs text-gray-500 font-medium">Tap to minimize</p>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className={`sheet-content-scroll ${sheetExpanded ? '' : 'minimized'}`}>
              {isRecalculating && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-[#BF1E2E] font-medium flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recalculating route...
                </div>
              )}
              {/* Current Turn + Distance/Time - Only when minimized */}
              {!sheetExpanded && currentStep && (
                <div className="space-y-3 mb-6">
                  {/* Current Direction */}
                  <div className="p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl border-2 border-[#BF1E2E]">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#BF1E2E] flex items-center justify-center shadow-lg flex-shrink-0">
                        {React.createElement(currentStep.direction.icon, { className: "w-6 h-6 text-white" })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 font-medium mb-1">In {currentStep.distance}</div>
                        <p className="text-base font-bold text-[#272262] truncate">{currentStep.instruction}</p>
                      </div>
                    </div>
                  </div>

                  {/* Compact Distance & Time - Made smaller */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-2.5 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xs text-gray-500">Distance</div>
                      <div className="text-base font-bold text-[#272262]">{routeData.distance} km</div>
                    </div>
                    <div className="flex-1 px-2.5 py-1.5 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-xs text-gray-500">Time</div>
                      <div className="text-base font-bold text-[#272262]">{routeData.duration} min</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expanded Content */}
              {sheetExpanded && (
                <>
                  {/* Distance and Time - Large when expanded */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 shadow-lg">
                      <div className="text-4xl font-bold text-[#272262] mb-1">{routeData.distance}</div>
                      <div className="text-sm text-[#454545] font-medium">km remaining</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 shadow-lg">
                      <div className="text-4xl font-bold text-[#272262] mb-1">{routeData.duration}</div>
                      <div className="text-sm text-[#454545] font-medium">min</div>
                    </div>
                  </div>

                  {/* Upcoming Turns */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Upcoming Turns</h4>
                      <span className="text-xs text-gray-500">Step {currentStepIndex + 1}/{directions.length}</span>
                    </div>

                    <div className="space-y-2">
                      {directions.slice(currentStepIndex, currentStepIndex + 5).map((step, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-3 rounded-xl border ${
                            idx === 0
                              ? 'bg-red-50 border-[#BF1E2E] border-2'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            idx === 0 ? 'bg-[#BF1E2E]' : 'bg-gray-300'
                          }`}>
                            {React.createElement(step.direction.icon, {
                              className: `w-4 h-4 ${idx === 0 ? 'text-white' : 'text-gray-600'}`
                            })}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              idx === 0 ? 'text-[#272262]' : 'text-gray-600'
                            }`}>{step.instruction}</p>
                            <p className="text-xs text-gray-500">{step.distance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <Button
                      onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
                      disabled={currentStepIndex === 0}
                      variant="outline"
                      className="w-full py-3 font-bold"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentStepIndex(Math.min(directions.length - 1, currentStepIndex + 1))}
                      disabled={currentStepIndex === directions.length - 1}
                      className="w-full bg-[#BF1E2E] hover:bg-[#9d1825] text-white py-3 font-bold"
                    >
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>

                  {/* External Navigation */}
                  <div className="border-t border-gray-200 pt-4 pb-2">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3 text-center">
                      Open in External App
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => openGoogleMaps(selectedOffice)}
                        variant="outline"
                        className="w-full border-2 border-[#272262] text-[#272262] hover:bg-[#F8F9FA] font-bold py-3"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Google
                      </Button>
                      <Button
                        onClick={() => openAppleMaps(selectedOffice)}
                        variant="outline"
                        className="w-full border-2 border-[#272262] text-[#272262] hover:bg-[#F8F9FA] font-bold py-3"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Apple
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedOffice && selectedOffice.tips && selectedOffice.tips.length > 0 && (
        <GlassCard className="p-8 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#272262] to-[#3d3680] flex items-center justify-center shadow-lg">
              <Info className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-[#272262]">Insider Tips for {selectedOffice.name}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {selectedOffice.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-blue-200 shadow-sm">
                <span className="text-[#BF1E2E] font-bold text-lg mt-0.5">•</span>
                <span className="text-[#454545] leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <ContactCTA message="Need help navigating Thai Immigration?" />
    </div>    </>

  );
}
