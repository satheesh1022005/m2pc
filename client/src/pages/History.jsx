import React, { useState, useEffect } from 'react';
import './History.css';

const History = () => {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterColor, setFilterColor] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetch('http://localhost:3000/history')
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(err => console.error('Error fetching history:', err));
  }, []);

  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.file_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType ? item.file_type_name === filterType : true;
      const matchesColor = filterColor ? item.file_type_color === filterColor : true;
      return matchesSearch && matchesType && matchesColor;
    })
    .sort((a, b) => {
      const priceA = parseFloat(a.file_type_price);
      const priceB = parseFloat(b.file_type_price);
      return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    });

  const uniqueTypes = [...new Set(history.map(item => item.file_type_name))];
  const uniqueColors = [...new Set(history.map(item => item.file_type_color))];

  return (
    <div className="history-container">
      <h2>Upload History</h2>

      <div className="controls">
        <input
          type="text"
          placeholder="Search by file name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>

        <select value={filterColor} onChange={(e) => setFilterColor(e.target.value)}>
          <option value="">All Colors</option>
          {uniqueColors.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="asc">Price Low to High</option>
          <option value="desc">Price High to Low</option>
        </select>
      </div>

      <table className="history-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>File Name</th>
            <th>Pages</th>
            <th>Layout</th>
            <th>Color</th>
            <th>Price (₹)</th>
            <th>Upload Time</th>
          </tr>
        </thead>
        <tbody>
          {filteredHistory.length > 0 ? (
            filteredHistory.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td title={item.file_name}>{item.file_name}</td>
                <td>{item.file_type_pages}</td>
                <td>{item.file_type_layout}</td>
                <td>{item.file_type_color}</td>
                <td>{item.file_type_price}</td>
                <td>{new Date(item.upload_time).toLocaleString()}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No records found.</td>
            </tr>
          )}
        </tbody>
      </table>

      {/*<h3 style={{ marginTop: '30px' }}>Price Trend (₹ per Upload)</h3>
      <div className="line-chart">
        {filteredHistory.map((item, index) => (
          <div key={index} className="bar-container">
            <div
              className="bar"
              style={{ height: `${parseFloat(item.file_type_price) * 4}px` }}
              title={`₹${item.file_type_price}`}
            ></div>
            <span>{item.id}</span>
          </div>
        ))}
      </div>*/}
    </div>
  );
};

export default History;
