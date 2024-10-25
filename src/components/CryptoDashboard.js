// components/CryptoDashboard.js

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  PointElement,
  LineElement,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(CategoryScale, LinearScale, TimeScale, Tooltip, PointElement, LineElement, Legend);

const CryptoDashboard = ({ data, loading, error }) => {
  const chartData = {
    datasets: [
      {
        label: 'Price',
        data: data.map((point) => ({ x: new Date(point.t), y: point.c })),
        borderColor: 'rgba(75,192,192,1)',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { intersect: false, mode: 'index' },
    },
    scales: {
      x: { type: 'time', time: { unit: 'minute' } },
      y: { title: { display: true, text: 'Price' } },
    },
  };

  if (loading) return <p className="text-center text-gray-600">Loading data...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return <div style={{ height: 400, width: '80%' }}>{data.length ? <Line data={chartData} options={options} /> : <p>No data available</p>}</div>;
};

export default CryptoDashboard;
