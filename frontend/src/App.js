import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import "./App.css";

function App() {
  const webcamRef = useRef(null);
  const [location, setLocation] = useState({ lat: null, long: null });
  const [photo, setPhoto] = useState(null);
  const [editedPhoto, setEditedPhoto] = useState(null);
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");
  const [isFrontCamera, setIsFrontCamera] = useState(true);

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

  const editPhoto = () => {
    if (!photo || !location.lat || !location.long) {
      console.error("Foto atau data lokasi tidak lengkap");
      return;
    }

    const img = new Image();
    img.src = photo;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const scaleFactor = 0.8; // Mengubah ukuran elemen dalam foto
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      ctx.font = "bold 16px Arial"; // Ukuran font lebih kecil
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

      setFormattedDate(formattedDate);
      setFormattedTime(formattedTime);

      const text = `${location.lat}, ${location.long}\n${formattedDate}, ${formattedTime}`;
      const lineHeight = 20; // Tinggi baris lebih kecil
      const padding = 8;
      const logoWidth = 40; // Lebar logo lebih kecil
      const logoHeight = 40; // Tinggi logo lebih kecil
      const textX = logoWidth + padding * 2;

      const backgroundHeight =
        Math.max(logoHeight, lineHeight * 2) + padding * 2;
      const backgroundY = canvas.height - backgroundHeight;

      ctx.fillStyle = "black";
      ctx.fillRect(0, backgroundY, canvas.width, backgroundHeight);

      ctx.fillStyle = "white";
      let y = backgroundY + padding + lineHeight;

      text.split("\n").forEach((line) => {
        ctx.fillText(line, textX, y);
        y += lineHeight;
      });

      const logo = new Image();
      logo.src = "img/GMT-no-bg.png";
      logo.onload = () => {
        ctx.drawImage(
          logo,
          padding,
          backgroundY + (backgroundHeight - logoHeight) / 2,
          logoWidth,
          logoHeight
        );

        const editedImage = canvas.toDataURL("image/jpeg");
        setEditedPhoto(editedImage);
      };
    };
  };

  useEffect(() => {
    if (photo && location.lat && location.long) {
      editPhoto();
    }
  }, [photo, location]);

  const capturePhotoAndLocation = async () => {
    capturePhoto();
    captureLocation();
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
      body: JSON.stringify({
        photo: editedPhoto,
        location,
        formattedDate,
        formattedTime,
      }),
    });
    const data = await response.json();
    console.log(data);
  };

  const toggleCamera = () => {
    setIsFrontCamera((prev) => !prev);
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: isFrontCamera ? "user" : { exact: "environment" },
  };

  return (
    <div className="app-container">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        style={{
          transform: isFrontCamera ? "scaleX(-1)" : "none",
          width: "320px",
          height: "240px",
          border: "2px solid #ccc",
          borderRadius: "8px",
        }}
      />
      <div className="button-container">
        <button onClick={toggleCamera} className="toggle-button">
          Flip Camera
        </button>
        <button onClick={capturePhotoAndLocation} className="capture-button">
          Capture
        </button>
      </div>
      {editedPhoto && (
        <div className="result-container">
          <img
            src={editedPhoto}
            alt="Foto Karyawan yang diedit"
            style={{ transform: "none" }}
          />
          <button onClick={handleSubmit} className="submit-button">
            Kirim Data
          </button>
        </div>
      )}
      {location.lat && location.long && editedPhoto && (
        <div>
          <p>
            Lokasi Anda: {location.lat}, {location.long}
          </p>
          <p>Tanggal: {formattedDate}</p>
          <p>Jam: {formattedTime}</p>
        </div>
      )}
    </div>
  );
}

export default App;
