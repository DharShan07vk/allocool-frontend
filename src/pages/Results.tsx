import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { endpoints, AllocationResult } from '@/lib/api';
import { Download, TrendingUp, Users, Award, BarChart3 } from 'lucide-react';
import toast from 'react-hot-toast';

export function Results() {
  const { data: results, isLoading, error } = useQuery({
    queryKey: ['allocations-latest'],
    queryFn: async () => {
      const response = await endpoints.allocationsLatest();
      return response.data as AllocationResult;
    },
  });

  const handleDownloadAllocations = async () => {
    try {
      const response = await endpoints.downloadAllocations();
      const blob = new Blob([response.data], { type: 'application/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'allocations.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Allocations downloaded successfully');
    } catch (error) {
      toast.error('Failed to download allocations');
      console.error('Download error:', error);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Failed to Load Results</h3>
              <p className="text-sm">No allocation results found. Please run the allocation process first.</p>
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
          <h2 className="text-3xl font-bold tracking-tight">Allocation Results</h2>
          <p className="text-muted-foreground">
            View and analyze the final allocation outcomes
          </p>
        </div>
        <Button 
          onClick={handleDownloadAllocations} 
          variant="outline" 
          className="flex items-center space-x-2"
          disabled={!results}
        >
          <Download className="h-4 w-4" />
          <span>Download Results</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Summary Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-8 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Results Table Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : results ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              title="Placement Rate"
              value={`${(results.summary.placement_rate * 100).toFixed(1)}%`}
              icon={TrendingUp}
              color="text-green-600"
            />
            <SummaryCard
              title="Total Allocated"
              value={results.summary.total_allocated.toLocaleString()}
              icon={Users}
              color="text-blue-600"
            />
            <SummaryCard
              title="Avg Similarity"
              value={`${(results.summary.avg_similarity * 100).toFixed(1)}%`}
              icon={BarChart3}
              color="text-purple-600"
            />
            <SummaryCard
              title="Fairness Index"
              value={results.summary.fairness_index.toFixed(2)}
              icon={Award}
              color="text-orange-600"
            />
          </div>

          {/* Detailed Results Table */}
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-xl">Detailed Allocation Results</CardTitle>
              <p className="text-sm text-muted-foreground">
                {results.matches.length} students allocated to internships
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Student</th>
                      <th className="text-left py-3 px-4 font-medium">Company</th>
                      <th className="text-left py-3 px-4 font-medium">Position</th>
                      <th className="text-center py-3 px-4 font-medium">Similarity</th>
                      <th className="text-center py-3 px-4 font-medium">Success Probability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.matches.map((match, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 font-medium">{match.student_name}</td>
                        <td className="py-3 px-4">{match.company}</td>
                        <td className="py-3 px-4 text-muted-foreground">{match.position}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge 
                            variant={match.similarity_score >= 0.8 ? "default" : match.similarity_score >= 0.6 ? "secondary" : "outline"}
                          >
                            {(match.similarity_score * 100).toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge 
                            variant={match.success_probability >= 0.8 ? "default" : match.success_probability >= 0.6 ? "secondary" : "outline"}
                          >
                            {(match.success_probability * 100).toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Results Available</h3>
              <p className="text-sm">Run the allocation process to see results here.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  color: string;
}

function SummaryCard({ title, value, icon: Icon, color }: SummaryCardProps) {
  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Latest allocation run
        </p>
      </CardContent>
    </Card>
  );
}