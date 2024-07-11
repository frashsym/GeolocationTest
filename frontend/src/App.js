import React, { useRef, useState } from "react";
import Webcam from "react-webcam";

function App() {
  const webcamRef = useRef(null);
  const [location, setLocation] = useState({ lat: null, long: null });
  const [photo, setPhoto] = useState(null);
  const [editedPhoto, setEditedPhoto] = useState(null);

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

  const editPhoto = () => {
    if (!photo || !location.lat || !location.long) {
      console.error("Foto atau data lokasi tidak lengkap");
      return;
    }

    const img = new Image();
    img.src = photo;
    img.onload = () => {
      console.log("Foto sedang diedit");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      // Draw the text and logo
      ctx.font = "bold 20px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "left";

      const date = new Date();
      const formattedDate = date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      const text = `Lat: ${location.lat}, Long: ${location.long}\n${formattedDate}, ${formattedTime}`;
      const lineHeight = 25;
      const x = 10;
      let y = canvas.height - 70;

      ctx.fillStyle = "black";
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
      ctx.fillStyle = "white";

      text.split("\n").forEach((line) => {
        ctx.fillText(line, x, y);
        y += lineHeight;
      });

      // Draw the logo
      const logo = new Image();
      logo.src = "img/GMT-no-bg.png"; // Path to your logo image
      logo.onload = () => {
        const logoWidth = 50;
        const logoHeight = 50;
        ctx.drawImage(logo, 10, canvas.height - 90, logoWidth, logoHeight);

        const editedImage = canvas.toDataURL("image/jpeg");
        setEditedPhoto(editedImage);
      };
    };
  };

  const handleSubmit = async () => {
    if (!editedPhoto || !location.lat || !location.long) {
      console.error("Foto atau data lokasi tidak lengkap");
      return;
    }

    const response = await fetch("http://localhost:5000/absensi", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photo: editedPhoto, location }),
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
          <button onClick={editPhoto}>Edit Photo</button>
        </div>
      )}
      {editedPhoto && (
        <div>
          <img src={editedPhoto} alt="Foto Karyawan yang diedit" />
        </div>
      )}
      {location.lat && location.long && editedPhoto && (
        <div>
          <p>Latitude: {location.lat}</p>
          <p>Longitude: {location.long}</p>
          <button onClick={handleSubmit}>Kirim Data</button>
        </div>
      )}
    </div>
  );
}

export default App;
