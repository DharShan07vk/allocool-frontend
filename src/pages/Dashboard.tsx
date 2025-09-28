import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { endpoints, DashboardStats } from '@/lib/api';
import { Users, Building2, Target, TrendingUp, PieChart, BarChart } from 'lucide-react';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { StatsCard } from '@/components/features/stats-cards';
import { RealtimeIndicator } from '@/components/features/realtime-indicator';

export function Dashboard() {
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
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
        error
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
    <div className="p-6 space-y-6" id="dashboard-content">
      {/* Header with Download Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of internship allocations and statistics
          </p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="card-elevated">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-16 mt-1" />
              </CardContent>
            </Card>
          ))
        ) : data ? (
          <>
            <StatsCard
              title="Total Students"
              value={data.total_students || 0}
              change={12}
              changeLabel="from last week"
              icon={Users}
              color="text-blue-600"
            />
            <StatsCard
              title="Total Internships"
              value={data.total_internships || 0}
              change={5}
              changeLabel="new this month"
              icon={Building2}
              color="text-green-600"
            />
            <StatsCard
              title="Total Capacity"
              value={data.total_capacity || 0}
              change={-2}
              changeLabel="vs last month"
              icon={Target}
              color="text-purple-600"
            />
            <StatsCard
              title="Placement Potential"
              value={typeof data?.placement_potential === 'string' ? data.placement_potential : `${data?.placement_potential || 0}%`}
              change={8}
              changeLabel="improvement"
              icon={TrendingUp}
              color="text-orange-600"
              format="percentage"
            />
          </>
        ) : null}
      </div>

      {/* Charts */}
      {data && <DashboardCharts data={data} />}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value?: number | string;
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
            {typeof value === 'string' ? value : value?.toLocaleString()}{suffix}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Updated just now
        </p>
      </CardContent>
    </Card>
  );
}