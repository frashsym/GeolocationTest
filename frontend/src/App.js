import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

function App() {
  const webcamRef = useRef(null);
  const [location, setLocation] = useState({ lat: null, long: null });
  const [photo, setPhoto] = useState(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPhoto(imageSrc);

    const options = {
      enableHighAccuracy: true,
      timeout: 60000,
      maximumAge: 0,
    };

    let bestPosition = null;

    const stopWatching = () => {
      navigator.geolocation.clearWatch(watchId);
    };

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
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

        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
          setLocation({ lat: latitude, long: longitude });
        }

        stopWatching();
      },
      (error) => {
        console.error("Error getting current location:", error.message);
      },
      options
    );

    setTimeout(stopWatching, options.timeout);
  };

  const handleSubmit = async () => {
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
      <button onClick={capture}>Ambil Foto</button>
      {photo && (
        <div>
          <img src={photo} alt="Foto Karyawan" />
          <p>Latitude: {location.lat}</p>
          <p>Longitude: {location.long}</p>
          <button onClick={handleSubmit}>Kirim Data</button>
        </div>
      )}
    </div>
  );
}

export default App;
