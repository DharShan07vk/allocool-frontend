import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { endpoints, AllocationConfig, AllocationStatus, AllocationMatch } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { Play, Square, Settings, Brain, Users, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_CONFIG: AllocationConfig = {
  rural_quota: 30,
  reserved_quota: 50,
  female_quota: 33,
  top_k_similarity: 10,
  optimization_time: 60,
};

export function Allocation() {
  const [config, setConfig] = useState<AllocationConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState(false);
  const queryClient = useQueryClient();

  // Query allocation status
  const { data: status, error: statusError, isError: statusIsError } = useQuery({
    queryKey: ['allocation-status'],
    queryFn: async () => {
      try {
        const response = await endpoints.allocationStatus();
        return response.data as AllocationStatus;
      } catch (error: any) {
        // If it's a timeout error during polling, we'll retry
        if (error.code === 'ECONNABORTED' && isRunning) {
          console.warn('Status polling timeout, will retry...');
          throw error; // Let retry mechanism handle it
        }
        throw error;
      }
    },
    enabled: isRunning,
    retry: (failureCount, error: any) => {
      // More aggressive retry for timeouts during running process
      if (error?.code === 'ECONNABORTED' && failureCount < 5) {
        return true;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff, max 5s
  });

  // Query live matches
  const { data: liveMatchesResponse = {} } = useQuery({
    queryKey: ['allocation-live-matches'],
    queryFn: async () => {
      try {
        const response = await endpoints.allocationLiveMatches();
        return response.data;
      } catch (error: any) {
        // Silently fail live matches if there are connection issues
        if (error.code === 'ECONNABORTED') {
          console.warn('Live matches timeout, skipping...');
          return { current_matches: [] };
        }
        throw error;
      }
    },
    enabled: isRunning && status?.progress > 50,
    retry: 1,
    retryDelay: 2000,
  });

  // Extract live matches from response
  const liveMatches = Array.isArray(liveMatchesResponse?.current_matches) 
    ? liveMatchesResponse.current_matches 
    : [];

  // Start allocation mutation
  const startAllocation = useMutation({
    mutationFn: async (config: AllocationConfig) => {
      try {
        const response = await endpoints.allocationStart(config);
        return response.data;
      } catch (error: any) {
        // Handle specific timeout errors
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - please check if the backend is processing your request');
        }
        throw error;
      }
    },
    onSuccess: () => {
      setIsRunning(true);
      toast.success('Allocation process started successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to start allocation process';
      toast.error(errorMessage);
      console.error('Allocation start error:', error);
      setIsRunning(false);
    },
  });

  // Polling for status updates
  usePolling(
    async () => {
      if (isRunning && !statusIsError) {
        try {
          await queryClient.invalidateQueries({ queryKey: ['allocation-status'] });
          if (status?.progress > 50) {
            await queryClient.invalidateQueries({ queryKey: ['allocation-live-matches'] });
          }
        } catch (error) {
          console.warn('Polling update failed, will retry on next interval');
        }
      }
    },
    {
      interval: 3000, // Poll every 3 seconds with faster timeout
      enabled: isRunning,
    }
  );

  // Stop polling when allocation is completed or failed
  useEffect(() => {
    if (status && !status.running) {
      setIsRunning(false);
      if (status.progress >= 100) {
        toast.success('Allocation process completed successfully');
      } else {
        toast.error('Allocation process failed or stopped');
      }
    }
  }, [status?.running, status?.progress]);

  const handleStart = () => {
    startAllocation.mutate(config);
  };

  const handleStop = () => {
    setIsRunning(false);
    toast('Allocation process stopped', { icon: '⏹️' });
  };

  const getStageProgress = () => {
    if (!status) return 0;
    return status.progress || 0;
  };

  const getStageColor = (stage: string) => {
    if (!status) return 'text-muted-foreground';
    
    // Map stage names to progress ranges
    const stageProgress = {
      'loading': 0,
      'similarity': 25,
      'prediction': 50,
      'optimization': 75,
      'completed': 100
    };
    
    const currentProgress = status.progress || 0;
    const stageThreshold = stageProgress[stage as keyof typeof stageProgress] || 0;
    
    if (currentProgress > stageThreshold) return 'text-success';
    if (currentProgress >= stageThreshold - 10) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Allocation Engine</h2>
          <p className="text-muted-foreground">
            Configure and run the intelligent internship allocation algorithm
          </p>
        </div>
        <Badge variant={isRunning ? "default" : "outline"} className="flex items-center space-x-1">
          <Brain className="h-3 w-3" />
          <span>
            {isRunning ? (
              statusIsError ? 'Connection Issues' : 
              status?.running ? 'Running' : 'Finishing...'
            ) : 'Idle'}
          </span>
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Configuration Panel */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quota Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Quota Settings</h3>
              
              <div className="space-y-2">
                <Label>Rural Quota: {config.rural_quota}%</Label>
                <Slider
                  value={[config.rural_quota]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, rural_quota: value }))}
                  max={100}
                  step={5}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <Label>Reserved Quota: {config.reserved_quota}%</Label>
                <Slider
                  value={[config.reserved_quota]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, reserved_quota: value }))}
                  max={100}
                  step={5}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <Label>Female Quota: {config.female_quota}%</Label>
                <Slider
                  value={[config.female_quota]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, female_quota: value }))}
                  max={100}
                  step={5}
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Algorithm Parameters */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Algorithm Parameters</h3>
              
              <div className="space-y-2">
                <Label>Top-K Similarity: {config.top_k_similarity}</Label>
                <Slider
                  value={[config.top_k_similarity]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, top_k_similarity: value }))}
                  min={5}
                  max={20}
                  step={1}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <Label>Optimization Time: {config.optimization_time}s</Label>
                <Slider
                  value={[config.optimization_time]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, optimization_time: value }))}
                  min={30}
                  max={300}
                  step={30}
                  disabled={isRunning}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t">
              {!isRunning ? (
                <Button 
                  onClick={handleStart} 
                  className="w-full gradient-primary text-white"
                  disabled={startAllocation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Allocation
                </Button>
              ) : (
                <Button 
                  onClick={handleStop} 
                  variant="destructive" 
                  className="w-full"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop Allocation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Panel */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {statusError && statusIsError && isRunning && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm text-destructive">
                  ⚠️ Temporary connection issues. The allocation is likely still running.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Status updates will resume automatically when connection is restored.
                </p>
                <div className="flex space-x-2 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['allocation-status'] });
                      toast('Attempting to reconnect...', { icon: '🔄' });
                    }}
                  >
                    Retry Now
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsRunning(false)}
                  >
                    Stop Monitoring
                  </Button>
                </div>
              </div>
            )}
            
            {status ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round(getStageProgress())}%</span>
                  </div>
                  <Progress value={getStageProgress()} className="h-2" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Current Stage</h3>
                  <Badge variant="outline" className="text-sm">
                    {status.stage}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{status.message}</p>
                  {status.estimated_time && (
                    <p className="text-xs text-muted-foreground">
                      Estimated time: {status.estimated_time}s
                    </p>
                  )}
                  {status.total_students && (
                    <p className="text-xs text-muted-foreground">
                      Processing {status.total_students} students
                    </p>
                  )}
                </div>

                {/* Stage Indicators */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Stages</h3>
                  <div className="space-y-2">
                    {['loading', 'similarity', 'prediction', 'optimization', 'completed'].map((stage, index) => (
                      <div key={stage} className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          getStageColor(stage) === 'text-success' ? 'bg-success' :
                          getStageColor(stage) === 'text-primary' ? 'bg-primary animate-pulse' :
                          'bg-muted'
                        }`} />
                        <span className={`text-sm capitalize ${getStageColor(stage)}`}>
                          {stage.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live Matches Preview */}
                {liveMatches.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Live Matches ({liveMatches.length})</span>
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {liveMatches.slice(0, 5).map((match, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                          <div className="font-medium">{match.student_name}</div>
                          <div className="text-muted-foreground">
                            {match.company} - {match.position}
                          </div>
                          <div className="flex justify-between mt-1">
                            <span>Similarity: {(match.similarity_score * 100).toFixed(1)}%</span>
                            <span>Success: {(match.success_probability * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                      {liveMatches.length > 5 && (
                        <div className="text-center text-xs text-muted-foreground">
                          +{liveMatches.length - 5} more matches
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No allocation process running</p>
                <p className="text-sm">Configure settings and start allocation to see progress</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}