import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

function App() {
  const webcamRef = useRef(null);
  const [location, setLocation] = useState({ lat: null, long: null });
  const [photo, setPhoto] = useState(null);

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setPhoto(imageSrc);
    } else {
      console.error("Webcam tidak tersedia");
    }
  };

  const captureLocation = () => {
    if ("geolocation" in navigator) {
      const options = {
        enableHighAccuracy: true,
        timeout: 60000,
        maximumAge: 0,
      };

      let bestPosition = null;

      const stopWatching = (watchId) => {
        navigator.geolocation.clearWatch(watchId);
      };

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(
            `Watch position: lat=${latitude}, long=${longitude}, accuracy=${accuracy}`
          );

          if (!bestPosition || accuracy < bestPosition?.coords?.accuracy) {
            bestPosition = position;
            setLocation({ lat: latitude, long: longitude });
          }
        },
        (error) => {
          console.error("Error watching location:", error.message);
        },
        options
      );

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          console.log(
            `Current position: lat=${latitude}, long=${longitude}, accuracy=${accuracy}`
          );

          if (!bestPosition || accuracy < bestPosition?.coords?.accuracy) {
            bestPosition = position;
            setLocation({ lat: latitude, long: longitude });
          }

          stopWatching(watchId);
        },
        (error) => {
          console.error("Error getting current location:", error.message);
        },
        options
      );

      setTimeout(() => stopWatching(watchId), options.timeout);
    } else {
      console.error("Geolocation tidak didukung oleh browser ini.");
    }
  };

  const capturePhotoAndLocation = () => {
    capturePhoto();
    captureLocation();
  };

  const handleSubmit = async () => {
    if (!photo || !location.lat || !location.long) {
      console.error("Foto atau data lokasi tidak lengkap");
      return;
    }

    const response = await fetch("http://localhost:5000/absensi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photo, location }),
    });
    const data = await response.json();
    console.log(data);
  };

  return (
    <div>
      <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" />
      <button onClick={capturePhotoAndLocation}>Capture</button>
      {photo && (
        <div>
          <img src={photo} alt="Foto Karyawan" />
        </div>
      )}
      {location.lat && location.long && (
        <div>
          <p>Latitude: {location.lat}</p>
          <p>Longitude: {location.long}</p>
          {photo && <button onClick={handleSubmit}>Kirim Data</button>}
        </div>
      )}
    </div>
  );
}

export default App;
