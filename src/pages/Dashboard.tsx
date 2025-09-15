import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { endpoints, DashboardStats } from '@/lib/api';
import { Users, Building2, Target, TrendingUp, PieChart, BarChart } from 'lucide-react';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';

export function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await endpoints.dashboardStats();
      return response.data as DashboardStats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Connection Error</h3>
              <p className="text-sm">Unable to fetch dashboard data. Please check if the backend is running.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of the internship allocation system
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Live Data
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={data?.total_students}
          icon={Users}
          isLoading={isLoading}
          color="text-blue-600"
        />
        <StatCard
          title="Total Internships"
          value={data?.total_internships}
          icon={Building2}
          isLoading={isLoading}
          color="text-green-600"
        />
        <StatCard
          title="Total Capacity"
          value={data?.total_capacity}
          icon={Target}
          isLoading={isLoading}
          color="text-purple-600"
        />
        <StatCard
          title="Placement Potential"
          value={data?.placement_potential}
          icon={TrendingUp}
          isLoading={isLoading}
          color="text-orange-600"
          suffix="%"
        />
      </div>

      {/* Charts */}
      {data && <DashboardCharts data={data} />}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value?: number;
  icon: React.ComponentType<any>;
  isLoading: boolean;
  color: string;
  suffix?: string;
}

function StatCard({ title, value, icon: Icon, isLoading, color, suffix = '' }: StatCardProps) {
  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-20" />
        ) : (
          <div className="text-2xl font-bold">
            {value?.toLocaleString()}{suffix}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Updated just now
        </p>
      </CardContent>
    </Card>
  );
}