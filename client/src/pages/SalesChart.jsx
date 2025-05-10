import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const SalesChart = () => {
  const [salesData, setSalesData] = useState([]);
  const [range, setRange] = useState('all');
  const fetchSalesData = async () => {
    try {
      const res = await axios.get('http://localhost:3000/sales-per-day');
      setSalesData(res.data);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const filterData = () => {
    const now = new Date();
    let filteredData = salesData;

    if (range === '30days') {
      const past30 = new Date(now.setDate(now.getDate() - 30));
      filteredData = salesData.filter(item => new Date(item.date) >= past30);
    } else if (range === '3months') {
      const past3M = new Date(now.setMonth(now.getMonth() - 3));
      filteredData = salesData.filter(item => new Date(item.date) >= past3M);
    } else if (range === '3years') {
      const past3Y = new Date(now.setFullYear(now.getFullYear() - 3));
      filteredData = salesData.filter(item => new Date(item.date) >= past3Y);
    }

    return filteredData;
  };

  const chartData = {
    labels: filterData().map(item => item.date),
    datasets: [
      {
        label: 'Total Sales (₹)',
        data: filterData().map(item => item.total_sales),
        backgroundColor: '#4ade80',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#22c55e',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 14 },
        },
      },
      title: {
        display: true,
        text: 'Sales Overview',
        font: { size: 22 },
        color: '#333',
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ₹ ${context.raw}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          font: { size: 12 },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}`,
        },
      },
    },
  };

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '20px', borderRadius: '12px', background: '#f9fafb', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#111827' }}>📊 Sales Chart</h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => setRange('all')} style={buttonStyle(range === 'all')}>All Time</button>
        <button onClick={() => setRange('30days')} style={buttonStyle(range === '30days')}>Last 30 Days</button>
        <button onClick={() => setRange('3months')} style={buttonStyle(range === '3months')}>Last 3 Months</button>
        <button onClick={() => setRange('3years')} style={buttonStyle(range === '3years')}>Last 3 Years</button>
      </div>

      <Bar data={chartData} options={chartOptions} />
    </div>
  );
};

const buttonStyle = (active) => ({
  padding: '10px 20px',
  borderRadius: '6px',
  border: 'none',
  background: active ? '#22c55e' : '#e5e7eb',
  color: active ? '#fff' : '#374151',
  cursor: 'pointer',
  fontWeight: '500',
});

export default SalesChart;
