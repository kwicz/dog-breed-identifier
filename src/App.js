import React, { useState, useRef, useEffect } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";
import "./App.css";

function prettifyLabel(raw) {
  const first = raw.split(",")[0].trim();
  return first.replace(/\b\w/g, (c) => c.toUpperCase());
}

function App() {
  const [model, setModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageURL, setImageURL] = useState(null);
  const [results, setResults] = useState([]);
  const [identifying, setIdentifying] = useState(false);
  const imageRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    mobilenet.load().then((m) => {
      setModel(m);
      setLoading(false);
    });
  }, []);

  const upload = () => inputRef.current.click();

  const handleUpload = async (event) => {
    const { files } = event.target;
    if (files.length === 0) return;
    const url = URL.createObjectURL(files[0]);
    setImageURL(url);
    setResults([]);
  };

  const handleImageLoad = async () => {
    if (!model || !imageRef.current) return;
    setIdentifying(true);
    const r = await model.classify(imageRef.current);
    setResults(r);
    setIdentifying(false);
  };

  const reset = () => {
    setImageURL(null);
    setResults([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const top = results[0];
  const topConfidence = top ? Math.round(top.probability * 100) : 0;
  const confidenceWord =
    topConfidence >= 80 ? "confident" : topConfidence >= 55 ? "fairly sure" : "guessing";

  return (
    <div className="page">
      <section>
        <div className="wrap center">
          <h1>Fetch</h1>
          <p className="subtitle">Upload a dog photo. We'll guess the breed.</p>

          {loading ? (
            <p className="status">Loading model…</p>
          ) : !imageURL ? (
            <div className="dropzone" onClick={upload} role="button" tabIndex={0}>
              <p><strong>Drop a photo here</strong></p>
              <p>or tap to choose one</p>
            </div>
          ) : (
            <div className="card">
              <img
                src={imageURL}
                alt="upload preview"
                ref={imageRef}
                className="preview"
                onLoad={handleImageLoad}
              />
              {identifying ? (
                <p className="status">Sniffing…</p>
              ) : top ? (
                <div className="results">
                  <div className="breed">{prettifyLabel(top.className)}</div>
                  <div className="confidence">
                    <span>{topConfidence}%</span>
                    <span className="bar"><i style={{ width: `${topConfidence}%` }} /></span>
                    <span>{confidenceWord}</span>
                  </div>
                  {results.length > 1 && (
                    <div className="also">
                      Also maybe: {results.slice(1, 3).map((r) => prettifyLabel(r.className)).join(", ")}
                    </div>
                  )}
                </div>
              ) : null}
              <button className="btn btn-primary" onClick={reset}>
                Try another
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            capture="camera"
            onChange={handleUpload}
            ref={inputRef}
          />
        </div>
      </section>

      <img
        src={`${process.env.PUBLIC_URL}/two-dogs-t.png`}
        alt=""
        aria-hidden="true"
        className="dogs-bottom"
      />
    </div>
  );
}

export default App;
