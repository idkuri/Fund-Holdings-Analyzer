import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const DoughnutChart = (props) => {
  const [data, setData] = useState(props.holdings || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    setData(props.holdings || []);
  }, [props.holdings]);

  useEffect(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0
    );
    setTotalValue(total);
  }, [data]);

  const getOffsets = (labels) => {
    return labels.map((label) => {
      if (searchTerm !== '') {
        return label.toLowerCase().includes(searchTerm.toLowerCase()) ? 100 : 0;
      }
      return 0; // if searchTerm is empty, no pop-out
    });
  };

  const chartData = {
    labels: data.map((item) => item.title),
    datasets: [
      {
        label: 'Percentage Allocation',
        data: data.map((item) => (item.value / totalValue) * 100),
        backgroundColor: [
          '#172554', // Dark blue/black
          '#15616D', // Teal
          '#FFECD1', // Cream
          '#FF7D00', // Orange
          '#78290F', // Brown
        ],
        borderColor: [
          '#000000',
        ],
        borderWidth: 0.5,
        offset: getOffsets(data.map((item) => item.title)),
      },
    ],
  };


  const options = {
    responsive: true,
    cutout: '50%', // Makes it a donut instead of a full pie
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Portfolio Allocation Distribution', font: { size: 25 } },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.label + ': ' + context.raw.toFixed(2) + '%';
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  return (
    <div className='flex flex-col items-center w-[50vw] mt-6 border border-gray-300 rounded-lg p-4'>
      {/* Search Bar */}
      <input
        type='text'
        placeholder='Search company...'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className='mb-4 px-3 py-2 border border-gray-300 rounded-md w-1/2 focus:outline-none focus:ring-2 focus:ring-blue-400'
      />

      {/* Doughnut Chart */}
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

export default DoughnutChart;
