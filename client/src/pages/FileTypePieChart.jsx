import React, { useEffect, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import axios from 'axios';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const FileTypePieChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchPieData = async () => {
      try {
        const res = await axios.get('http://localhost:3000/sales-by-filetype-color');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching pie data:', error);
      }
    };

    fetchPieData();
  }, []);

  const chartData = {
    labels: data.map(item => item.file_type_color),
    datasets: [
      {
        label: 'Sales ₹',
        data: data.map(item => item.total_sales),
        backgroundColor: ['#facc15', '#34d399', '#60a5fa', '#f87171', '#a78bfa'],
      },
    ],
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto' }}>
      <Pie data={chartData} />
    </div>
  );
};

export default FileTypePieChart;
