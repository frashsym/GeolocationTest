import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

function App() {
  const webcamRef = useRef(null);
  const [location, setLocation] = useState({ lat: null, long: null });
  const [photo, setPhoto] = useState(null);

  const capture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setPhoto(imageSrc);

    // Mengatur opsi untuk permintaan geolocation
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // timeout setelah 15 detik
      maximumAge: 0, // data tidak di-cache
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, long: longitude });
      },
      (error) => {
        console.error("Error getting location:", error.message);
      },
      options // menggunakan opsi yang telah ditetapkan
    );
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
