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
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const recyclableProperties = {
    "PET Bottle":
      "Easily recyclable, used in water bottles and containers. Recyclability Score: 9/10",
    HDPE: "Widely recyclable, used in milk jugs, detergent bottles. Recyclability Score: 8/10",
    PVC: "Recyclable in some areas, often used for pipes and cable insulation. Recyclability Score: 5/10",
    LDPE: "Recyclable in some programs, used in plastic bags and films. Recyclability Score: 6/10",
    PP: "Recyclable, used in yogurt containers and bottle caps. Recyclability Score: 7/10",
    PS: "Difficult to recycle, used in foam cups and containers. Recyclability Score: 3/10",
    Other:
      "Not easily recyclable, used in multi-material plastics. Recyclability Score: 2/10",
    "HDPE Plastic":
      "Widely recyclable, used in milk jugs, detergent bottles. Recyclability Score: 8/10",
    "Multi-layer Plastic":
      "Not easily recyclable, used in packaging. Recyclability Score: 2/10",
    "Single-Use-Plastic":
      "Difficult to recycle, often used in disposable items. Recyclability Score: 3/10",
    "Single-layer Plastic":
      "Recyclable in some programs, used in various packaging. Recyclability Score: 5/10",
    "Squeeze-Tube":
      "Not easily recyclable, used in toothpaste and creams. Recyclability Score: 4/10",
    "UHT-Box":
      "Recyclable in some areas, used in long-life milk and juice cartons. Recyclability Score: 5/10",
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

  const handleCameraClick = () => {
    setIsCameraOpen(true);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      })
      .catch((err) => {
        console.error("Error accessing camera:", err);
        setError("Unable to access the camera.");
      });
  };

  const handleCapture = async () => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    const base64String = canvas.toDataURL("image/jpeg").split(",")[1];

    setBase64Image(base64String);
    setPreview(canvas.toDataURL("image/jpeg"));
    setIsCameraOpen(false);

    const response = await axios({
      method: "POST",
      url: "https://detect.roboflow.com/plastic-recyclable-detection/2",
      params: { api_key: "raJDUCC0UZjkFno0DYYz" },
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: base64String,
    });

    setPredictions(response.data.predictions);

    // Stop the camera
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach((track) => track.stop());
  };

  const handleSubmit = async (event) => {
    // console.log("API URL:", process.env.REACT_APP_API_URL);
    // console.log("API KEY:", process.env.REACT_APP_API_KEY);
    event.preventDefault();
    if (!base64Image) {
      alert("Please select or capture an image.");
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
      <h2 className="rancho-regular">PlastiSeek</h2>
      <div>
        <form onSubmit={handleSubmit}>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <button
            style={{ margin: "25px" }}
            type="button"
            onClick={handleCameraClick}
          >
            Open Camera
          </button>
          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Detect Plastic Type"}
          </button>
        </form>

        {isCameraOpen && (
          <div>
            <video
              ref={videoRef}
              style={{ width: "100%", maxWidth: "600px" }}
            />
            <button onClick={handleCapture}>Capture</button>
            <canvas ref={captureCanvasRef} style={{ display: "none" }}></canvas>
          </div>
        )}
      </div>
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

      <footer>
        <span className="gaegu-regular">アビク・ゴーシュ</span>
      </footer>
    </div>
  );
}

export default App;
