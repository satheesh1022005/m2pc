import React, { useState } from "react";
import "./FileConfigPopup.css";

function FileConfigPopup({ onClose, onSave, price }) {
  const [config, setConfig] = useState({
    pages: "",
    pagePerSheet: 1,
    layout: "portrait",
    color: "black",
    flip: false,
  });

  const calculatePrice = () => {
    let numPages = 1;
    if (config.pages.includes("-")) {
      const [start, end] = config.pages.split("-").map(Number);
      numPages = end - start + 1;
    } else if (!isNaN(Number(config.pages)) && config.pages.trim() !== "") {
      numPages = Number(config.pages);
    }
    const copyPrice =
      (numPages / config.pagePerSheet) *
      (config.color === "black" ? price.blackPrice : price.colorPrice);

    if (config.flip) return Math.round(copyPrice) + copyPrice - copyPrice / 2;
    if (!isFinite(copyPrice)) return 1;
    return copyPrice;
  };

  return (
    <div className="popup-overlay">
      <div className="popup">
        <h3>File Configuration</h3>
        <input
          type="text"
          placeholder="Pages (e.g. 1-5)"
          value={config.pages}
          onChange={(e) => setConfig({ ...config, pages: e.target.value })}
        />
        <input
          type="number"
          placeholder="Pages per sheet"
          value={config.pagePerSheet}
          onChange={(e) =>
            setConfig({ ...config, pagePerSheet: Number(e.target.value) })
          }
        />
        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="portrait"
              checked={config.layout === "portrait"}
              onChange={(e) => setConfig({ ...config, layout: e.target.value })}
            />
            Portrait
          </label>
          <label>
            <input
              type="radio"
              value="landscape"
              checked={config.layout === "landscape"}
              onChange={(e) => setConfig({ ...config, layout: e.target.value })}
            />
            Landscape
          </label>
        </div>

        <div className="radio-group">
          <label>
            <input
              type="radio"
              value="black"
              checked={config.color === "black"}
              onChange={(e) => setConfig({ ...config, color: e.target.value })}
            />
            Black
          </label>
          <label>
            <input
              type="radio"
              value="color"
              checked={config.color === "color"}
              onChange={(e) => setConfig({ ...config, color: e.target.value })}
            />
            Color
          </label>
        </div>

        <label>
          <input
            type="checkbox"
            checked={config.flip}
            onChange={(e) => setConfig({ ...config, flip: e.target.checked })}
          />
          Double sided
        </label>

        <p>Price: ${calculatePrice().toFixed(2)}</p>

        <div className="popup-buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={() => onSave(config)}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default FileConfigPopup;
