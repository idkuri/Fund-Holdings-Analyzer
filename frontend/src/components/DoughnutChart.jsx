import { useState } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, Title)

const COLORS = ['#172554', '#15616D', '#FFECD1', '#FF7D00', '#78290F']

const DoughnutChart = ({ holdings }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const totalValue = holdings.reduce((sum, item) => sum + item.value, 0)

  const labels = holdings.map((item) => item.title)
  const offsets = labels.map((label) =>
    searchTerm && label.toLowerCase().includes(searchTerm.toLowerCase()) ? 100 : 0
  )

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Percentage Allocation',
        data: holdings.map((item) => (item.value / totalValue) * 100),
        backgroundColor: holdings.map((_, i) => COLORS[i % COLORS.length]),
        borderColor: ['#000000'],
        borderWidth: 0.5,
        offset: offsets,
      },
    ],
  }

  const options = {
    responsive: true,
    cutout: '50%',
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Portfolio Allocation Distribution',
        font: { size: 25 },
      },
      tooltip: {
        callbacks: {
          label(context) {
            return `${context.label}: ${context.raw.toFixed(2)}%`
          },
        },
      },
    },
    animation: { animateRotate: true, animateScale: true },
  }

  return (
    <div className="flex flex-col items-center w-[75vw] min-w-[500px] bg-white border border-gray-200 rounded-xl shadow-sm p-6 gap-4">
      <input
        type="text"
        placeholder="Search company to highlight..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg w-1/2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

export default DoughnutChart
