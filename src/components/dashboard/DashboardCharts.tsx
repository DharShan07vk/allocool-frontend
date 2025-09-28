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
    labels: Object.keys(data.top_skills || {}),
    datasets: [
      {
        label: 'Demand Count',
        data: Object.values(data.top_skills || {}),
        backgroundColor: 'hsl(238, 75%, 71%)',
        borderColor: 'hsl(238, 75%, 71%)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  };

  // Company Tiers Chart
  const tiersData = {
    labels: Object.keys(data.tier_distribution || {}),
    datasets: [
      {
        data: Object.values(data.tier_distribution || {}),
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
    devicePixelRatio: 2, // Ensures crisp rendering
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 18,
            family: 'system-ui, -apple-system, sans-serif',
          },
        },
      },
      tooltip: {
        titleFont: {
          family: 'system-ui, -apple-system, sans-serif',
        },
        bodyFont: {
          family: 'system-ui, -apple-system, sans-serif',
        },
      },
    },
    animation: {
      duration: 0, // Disable animations for crisp screenshots
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
        ticks: {
          font: {
            size: 20,
            family: 'system-ui, -apple-system, sans-serif',
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 15,
            color: 'rgb(255, 99, 71)',
            family: 'system-ui, -apple-system, sans-serif',
          },
        },
      },
    },
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="border bg-card shadow-sm" style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold antialiased">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64" style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <Doughnut data={categoryData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="border bg-card shadow-sm" style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold antialiased">Top Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 text-sm text-black" style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <Bar data={skillsData} options={barOptions} />
          </div>
        </CardContent>
      </Card>

      <Card className="border bg-card shadow-sm" style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold antialiased">Company Tiers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64" style={{ backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <Doughnut data={tiersData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}