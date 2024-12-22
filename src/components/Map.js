import React, { useEffect } from "react";

const Map = () => {
  useEffect(() => {
    const initMap = () => {
      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: { lat: 1.3521, lng: 103.8198 }, // Default: Singapore
      });

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentPosition = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            map.setCenter(currentPosition);
            new google.maps.Marker({
              position: currentPosition,
              map: map,
              title: "Your Location",
            });
          },
          () => alert("Geolocation failed!")
        );
      }
    };

    initMap();
  }, []);

  return <div id="map" style={{ width: "100%", height: "400px" }}></div>;
};

export default Map;
