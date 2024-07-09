const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Buat koneksi ke database
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // ganti dengan user MySQL Anda
  password: "", // ganti dengan password MySQL Anda
  database: "absensi",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Koneksi ke database berhasil");
});

app.post("/absensi", (req, res) => {
  const { photo, location } = req.body;
  const photoName = `${uuidv4()}.jpeg`; // Buat nama file foto yang unik

  // Simpan foto ke dalam folder 'uploads'
  const photoPath = `uploads/${photoName}`;
  const base64Data = photo.replace(/^data:image\/jpeg;base64,/, "");
  fs.writeFile(photoPath, base64Data, "base64", (err) => {
    if (err) throw err;
    console.log("Foto disimpan ke", photoPath);

    // Simpan data ke database
    const sql =
      "INSERT INTO absen (photo, latitude, longitude) VALUES (?, ?, ?)";
    db.query(sql, [photoName, location.lat, location.long], (err, result) => {
      if (err) throw err;
      res.json({ message: "Data absensi diterima dan disimpan ke database" });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
