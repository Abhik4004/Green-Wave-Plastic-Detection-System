import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [base64Image, setBase64Image] = useState("");
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState("");
  const [boundingBox, setBoundingBox] = useState(null); // Store bounding box data
  const canvasRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1]; // Only get base64 part
        setBase64Image(base64String);
        setPreview(reader.result); // Use the full data URL for preview
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!base64Image) {
      alert("Please select an image.");
      return;
    }

    try {
      // Call Roboflow API directly from the frontend
      const response = await axios({
        method: "POST",
        url: "https://detect.roboflow.com/plastic-recyclable-detection/2",
        params: {
          api_key: "raJDUCC0UZjkFno0DYYz", // Replace with your actual Roboflow API key
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: base64Image, // Send only the base64 image data
      });

      // Process the result
      const detectedObject = response.data.predictions[0].class;
      const { x, y, width, height, class: objectClass } = detectedObject;
      console.log(detectedObject);

      // Set result and bounding box
      setResult(`Detected Plastic Type: ${objectClass}`);
      setBoundingBox({ x, y, width, height });
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (boundingBox && preview) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.src = preview;

      img.onload = () => {
        // Draw image on canvas
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Draw bounding box
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        const scaleX = canvas.width / img.width;
        const scaleY = canvas.height / img.height;

        ctx.strokeRect(
          boundingBox.x * scaleX, // Adjust coordinates based on scale
          boundingBox.y * scaleY,
          boundingBox.width * scaleX,
          boundingBox.height * scaleY
        );
      };
    }
  }, [boundingBox, preview]);

  return (
    <div className="App">
      <h2>Plastic Type Detection</h2>

      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit">Detect Plastic Type</button>
      </form>

      {preview && (
        <div>
          <h3>Image Preview with Bounding Box:</h3>
          <canvas ref={canvasRef} style={{ border: "1px solid black" }} />
        </div>
      )}

      {result && <h3>{result}</h3>}
    </div>
  );
}

export default App;
