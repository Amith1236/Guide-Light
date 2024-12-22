import React, { useState, useEffect, useRef } from "react";
import { Bluetooth } from "./components/Bluetooth.js";
import { GoogleMap, LoadScript, DirectionsRenderer, Marker } from "@react-google-maps/api";
import "./homepage.css";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAP_LIBRARIES = ["geometry", "places"];
const PROXIMITY_THRESHOLD_METERS = 50;
const SIMULATION_SPEED_MS = 1000; // Speed of movement simulation (milliseconds per update)

console.log("Google Maps API Key:", GOOGLE_MAPS_API_KEY);

// Rest of your app logic

function App() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [destination, setDestination] = useState("");
  const [instructions, setInstructions] = useState("");
  const [directions, setDirections] = useState(null);
  const [steps, setSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showTextBox, setShowTextBox] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isBluetoothConnected, setBluetoothConnected] = useState(false);


  const simulationInterval = useRef(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error getting location: ", error);
        alert("Please enable location services to use this app.");
      }
    );

    Bluetooth.connectToBluetooth();
  }, []);

  useEffect(() => {
    const locationWatcher = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
      },
      (error) => {
        console.error("Error watching location: ", error);
      },
      { enableHighAccuracy: true }
    );

    return () => {
      navigator.geolocation.clearWatch(locationWatcher);
    };
  }, []);

  useEffect(() => {
    if (currentLocation && steps.length > 0 && currentStepIndex < steps.length) {
      const currentStep = steps[currentStepIndex];
      const stepLocation = {
        lat: currentStep.start_location.lat(),
        lng: currentStep.start_location.lng(),
      };
  
      const distanceToStep = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        stepLocation.lat,
        stepLocation.lng
      );
  
      if (distanceToStep <= PROXIMITY_THRESHOLD_METERS) {
        const nextInstruction = currentStep.instructions.replace(/<[^>]*>/g, "");
        setInstructions(nextInstruction);
        console.log("Next instruction:", nextInstruction);
        Bluetooth.sendNextInstruction(nextInstruction);
  
        if (currentStepIndex < steps.length - 1) {
          setCurrentStepIndex((prevIndex) => prevIndex + 1);
        }
      }
    }
  }, [currentLocation, steps, currentStepIndex]);
  

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };


  const fetchDirections = async () => {
    if (!destination || !currentLocation) {
      alert("Please ensure both current location and destination are set!");
      return;
    }

    setDirections(null);
    setSteps([]);
    setInstructions("");

    const directionsService = new window.google.maps.DirectionsService();
    const result = await directionsService.route({
      origin: currentLocation,
      destination,
      travelMode: window.google.maps.TravelMode.BICYCLING,
    });

    const routeSteps = result.routes[0].legs[0].steps;
    setSteps(routeSteps);
    setDirections(result);
    setCurrentStepIndex(0);

    const firstInstruction = routeSteps[0].instructions.replace(/<[^>]*>/g, "");
    setInstructions(firstInstruction);
    console.log("First instruction:", firstInstruction);
    Bluetooth.sendNextInstruction(firstInstruction);
  };

  const startSimulation = () => {
    if (steps.length === 0 || !currentLocation) {
      alert("Please fetch directions first!");
      return;
    }
  
    setIsSimulating(true);
    let stepIndex = 0;
    let progress = 0;
  
    simulationInterval.current = setInterval(() => {
      if (stepIndex >= steps.length) {
        clearInterval(simulationInterval.current);
        setIsSimulating(false);
        return;
      }
  
      const step = steps[stepIndex];
      const start = step.start_location;
      const end = step.end_location;
  
      const lat = start.lat() + (progress / 100) * (end.lat() - start.lat());
      const lng = start.lng() + (progress / 100) * (end.lng() - start.lng());
  
      setCurrentLocation({ lat, lng }); // Update currentLocation for Marker
      progress += 10;
  
      if (progress > 100) {
        progress = 0;
        stepIndex++;
      }
    }, SIMULATION_SPEED_MS);
  };

  const stopSimulation = () => {
    clearInterval(simulationInterval.current);
    setIsSimulating(false);
  };

  const [mapKey, setMapKey] = useState(0);

  const clearAll = () => {
    setDirections(null);
    setSteps([]);
    setInstructions("");
    setCurrentStepIndex(0);
    setDestination("");
  
    setMapKey((prevKey) => prevKey + 1); // Force re-render
  
    Bluetooth.sendNextInstruction("Trip ended. Kickstand down.");
  };

  const handleBluetoothConnect = async () => {
    try {
      await Bluetooth.connectToBluetooth();
      setBluetoothConnected(true);
      console.log("Bluetooth connection established.");
    } catch (error) {
      console.error("Bluetooth connection failed:", error);
    }
  };

  return (
    <div className="homepage-container">
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={GOOGLE_MAP_LIBRARIES}>
        <GoogleMap
          key={mapKey} 
          mapContainerClassName="map-background"
          center={currentLocation || { lat: 1.3521, lng: 103.8198 }}
          zoom={currentLocation ? 14 : 12}
          mapTypeId="satellite"
        >
          {directions && <DirectionsRenderer directions={directions} />}
          {currentLocation && <Marker position={currentLocation} />}
        </GoogleMap>
      </LoadScript>

      <div className="logo-container">
        <div className="logo">
          <span className="logo-icon"></span>Loose Screws
        </div>
      </div>

      <div className="content-box">
        <h1>Spin the wheel, where are we going today?</h1>
        <button onClick={handleBluetoothConnect} className="connect-bluetooth-btn">
          {isBluetoothConnected ? "Bluetooth Connected" : "Connect to Bluetooth"}
        </button>
        <button className="enter-destination-btn" onClick={() => setShowTextBox(true)}>
          Enter Destination
        </button>

        {showTextBox && (
          <div className="input-container">
            <input
              type="text"
              placeholder="Enter your destination"
              className="destination-input"
              onChange={(e) => setDestination(e.target.value)}
            />
            <button onClick={fetchDirections} className="fetch-directions-btn">
              Set Destination
            </button>
          </div>
        )}

        <h2>Next Instruction: {instructions}</h2>

        {!isSimulating ? (
          <button onClick={startSimulation} className="simulation-btn">
            Start Simulation
          </button>
        ) : (
          <button onClick={stopSimulation} className="simulation-btn">
            Stop Simulation
          </button>
        )}

        <button onClick={clearAll} className="clear-data-btn">
          Kickstand Down / End Your Trip
        </button>
      </div>
    </div>
  );
}

export default App;
