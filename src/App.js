import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";

function App() {
  const [base64Image, setBase64Image] = useState("");
  const [preview, setPreview] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const recyclableProperties = {
    "PET Bottle": "Easily recyclable, used in water bottles and containers.",
    HDPE: "Widely recyclable, used in milk jugs, detergent bottles.",
    PVC: "Recyclable in some areas, often used for pipes and cable insulation.",
    LDPE: "Recyclable in some programs, used in plastic bags and films.",
    PP: "Recyclable, used in yogurt containers and bottle caps.",
    PS: "Difficult to recycle, used in foam cups and containers.",
    Other: "Not easily recyclable, used in multi-material plastics.",
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result.split(",")[1];
        setBase64Image(base64String);
        setPreview(reader.result);
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

    setLoading(true);
    setError(null);

    try {
      const response = await axios({
        method: "POST",
        url: process.env.REACT_APP_API_URL,
        params: {
          api_key: process.env.REACT_APP_API_KEY,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: base64Image,
      });

      setPredictions(response.data.predictions);
    } catch (error) {
      setError("Error detecting plastic type. Please try again.");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (predictions.length > 0 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const image = new Image();
      image.src = preview;

      image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0, image.width, image.height);

        predictions.forEach((prediction) => {
          const { x, y, width, height, class: detectedClass } = prediction;

          ctx.strokeStyle = "#FF0000";
          ctx.lineWidth = 2;
          ctx.strokeRect(x - width / 2, y - height / 2, width, height);

          ctx.fillStyle = "#FF0000";
          ctx.font = "16px Arial";
          ctx.fillText(
            detectedClass,
            x - width / 2,
            y - height / 2 > 16 ? y - height / 2 - 5 : y - height / 2 + 15
          );
        });
      };
    }
  }, [predictions, preview]);

  return (
    <div className="App">
      <h2>Green Wave</h2>

      <form onSubmit={handleSubmit}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>
          {loading ? "Processing..." : "Detect Plastic Type"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {preview && (
        <div>
          <h3>Image Preview with Detections:</h3>
          <canvas
            ref={canvasRef}
            style={{ width: "100%", maxWidth: "600px" }}
          ></canvas>
        </div>
      )}

      {predictions.length > 0 && (
        <div>
          <h3>Detected Plastic Types:</h3>
          <ul>
            {predictions.map((prediction, index) => {
              const plasticType = prediction.class;
              const recyclableInfo =
                recyclableProperties[plasticType] || "Recyclability unknown";

              return (
                <li key={index}>
                  <strong>{plasticType}</strong> - Confidence:{" "}
                  {Math.round(prediction.confidence * 100)}% <br />
                  <em>Recyclable Info:</em> {recyclableInfo}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;
