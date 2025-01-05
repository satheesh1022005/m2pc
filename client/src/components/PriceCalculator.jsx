import React, { useState } from "react";
import "./style.css";  // Import the custom CSS file

const PriceCalculator = ({ data }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalPrice, setTotalPrice] = useState(0);

  const calculateTotalPrice = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      alert("Please select valid start and end dates!");
      return;
    }

    const filteredData = data.filter((item) => {
      const itemDate = new Date(item.uploadTime);
      return itemDate >= start && itemDate <= end && typeof item.price === "number";
    });

    const total = filteredData.reduce((acc, curr) => acc + curr.price, 0);
    setTotalPrice(total);
  };

  return (
    <div className="price-calculator-container">
      <h2 className="price-calculator-header">Revenue Calculator</h2>
      <div className="input-group">
        <label>
          Start Date: 
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="date-input"
          />
        </label>
      </div>
      <div className="input-group">
        <label>
          End Date: 
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="date-input"
          />
        </label>
      </div>
      <button 
        onClick={calculateTotalPrice} 
        className="calculate-btn"
      >
        Calculate Total Revenue
      </button>
      <div className="total-price">
        <strong>Total Price:</strong> {totalPrice.toFixed(2)}
      </div>
    </div>
  );
};

export default PriceCalculator;
