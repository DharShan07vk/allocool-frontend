import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats } from '@/lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface DashboardChartsProps {
  data: DashboardStats;
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  // Category Distribution Chart
  const categoryData = {
    labels: Object.keys(data.category_distribution || {}),
    datasets: [
      {
        data: Object.values(data.category_distribution || {}),
        backgroundColor: [
          'hsl(238, 75%, 71%)',
          'hsl(267, 40%, 58%)',
          'hsl(199, 89%, 48%)',
          'hsl(142, 76%, 36%)',
          'hsl(38, 92%, 50%)',
        ],
        borderWidth: 0,
      },
    ],
  };

  // Skills Demand Chart
  const skillsData = {
    labels: Object.keys(data.skill_demand || {}),
    datasets: [
      {
        label: 'Demand Count',
        data: Object.values(data.skill_demand || {}),
        backgroundColor: 'hsl(238, 75%, 71%)',
        borderColor: 'hsl(238, 75%, 71%)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  // Company Tiers Chart
  const tiersData = {
    labels: Object.keys(data.company_tiers || {}),
    datasets: [
      {
        data: Object.values(data.company_tiers || {}),
        backgroundColor: [
          'hsl(142, 76%, 36%)',
          'hsl(38, 92%, 50%)',
          'hsl(0, 84%, 60%)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
    },
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'hsl(var(--border))',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={categoryData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">Skills Demand</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={skillsData} options={barOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">Company Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={tiersData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}