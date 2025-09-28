import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { endpoints, AllocationConfig, AllocationStatus, AllocationMatch } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { AllocationAnimation } from '@/components/features/allocation-animation';
import { Play, Square, Settings, Brain, Users, Zap, Clock } from 'lucide-react';
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
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [milestoneShown, setMilestoneShown] = useState<Set<number>>(new Set()); // Track shown milestones
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Query allocation status with more aggressive polling
  const { data: status, error: statusError, isError: statusIsError, refetch: refetchStatus } = useQuery({
    queryKey: ['allocation-status'],
    queryFn: async () => {
      try {
        console.log('Fetching allocation status...'); // Debug log
        const response = await endpoints.allocationStatus();
        const statusData = response.data as AllocationStatus;
        console.log('Status received:', statusData); // Debug log
        setLastUpdateTime(Date.now());
        return statusData;
      } catch (error: any) {
        console.error('Status fetch error:', error); // Debug log
        // If it's a timeout error during polling, we'll retry
        if (error.code === 'ECONNABORTED' && isRunning) {
          console.warn('Status polling timeout, will retry...');
          throw error; // Let retry mechanism handle it
        }
        throw error;
      }
    },
    enabled: isRunning,
    refetchInterval: isRunning ? 2000 : false, // Poll every 2 seconds when running
    refetchIntervalInBackground: true,
    retry: (failureCount, error: any) => {
      // More aggressive retry for timeouts during running process
      if (error?.code === 'ECONNABORTED' && failureCount < 5) {
        return true;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000), // Faster retry
    staleTime: 0, // Always consider data stale to force fresh requests
    gcTime: 0, // Don't cache the data
  });

  // Query live matches with better timing
  const { data: liveMatchesResponse = {}, refetch: refetchMatches } = useQuery({
    queryKey: ['allocation-live-matches'],
    queryFn: async () => {
      try {
        console.log('Fetching live matches...'); // Debug log
        const response = await endpoints.allocationLiveMatches();
        return response.data;
      } catch (error: any) {
        console.warn('Live matches fetch error:', error); // Debug log
        // Silently fail live matches if there are connection issues
        if (error.code === 'ECONNABORTED') {
          console.warn('Live matches timeout, skipping...');
          return { current_matches: [] };
        }
        throw error;
      }
    },
    enabled: isRunning && (simulatedProgress || 0) > 10, // Start fetching earlier
    refetchInterval: isRunning && (simulatedProgress || 0) > 10 ? 3000 : false,
    retry: 1,
    retryDelay: 1000,
    staleTime: 0,
    gcTime: 0,
  });

  // Extract live matches from response
  const liveMatches = Array.isArray(liveMatchesResponse?.current_matches) 
    ? liveMatchesResponse.current_matches 
    : [];

  // Start allocation mutation
  const startAllocation = useMutation({
    mutationFn: async (config: AllocationConfig) => {
      try {
        console.log('Starting allocation with config:', config); // Debug log
        const response = await endpoints.allocationStart(config);
        return response.data;
      } catch (error: any) {
        console.error('Start allocation error:', error); // Debug log
        // Handle specific timeout errors
        if (error.code === 'ECONNABORTED') {
          throw new Error('Request timeout - please check if the backend is processing your request');
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Allocation started successfully:', data); // Debug log
      setIsRunning(true);
      setStartTime(Date.now());
      setSimulatedProgress(0);
      setLastUpdateTime(Date.now());
      setMilestoneShown(new Set()); // Reset milestones
      
      // Estimate total duration based on optimization time + some buffer
      const estimatedTotal = (config.optimization_time + 60) * 1000; // Add 60s buffer for processing
      setEstimatedDuration(estimatedTotal);
      
      // Start progress simulation
      startProgressSimulation(estimatedTotal);
      
      // Start elapsed time counter
      startTimeCounter();
      
      // Immediately start polling for status
      setTimeout(() => {
        refetchStatus();
      }, 1000);
      
      toast.success('🚀 Allocation engine started!', {
        style: {
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
          border: 'none'
        }
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to start allocation process';
      toast.error(errorMessage);
      console.error('Allocation start error:', error);
      setIsRunning(false);
      clearProgressSimulation();
      clearTimeCounter();
    },
  });

  // Progress simulation function
  const startProgressSimulation = (totalDuration: number) => {
    const interval = 500; // Update every 500ms for smooth animation
    const incrementPerInterval = (100 / (totalDuration / interval)) * 0.8; // Go to 80% gradually, wait for backend confirmation for 100%

    progressIntervalRef.current = setInterval(() => {
      setSimulatedProgress(prev => {
        const newProgress = prev + incrementPerInterval;
        
        // Don't go beyond 90% until we get backend confirmation
        if (newProgress >= 90) {
          return Math.min(90, newProgress);
        }
        
        return newProgress;
      });
    }, interval);
  };

  // Time counter function
  const startTimeCounter = () => {
    timeIntervalRef.current = setInterval(() => {
      if (startTime) {
        setElapsedTime(Date.now() - startTime);
      }
    }, 1000); // Update every second
  };

  // Clear progress simulation
  const clearProgressSimulation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Clear time counter
  const clearTimeCounter = () => {
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current);
      timeIntervalRef.current = null;
    }
  };

  // Additional manual polling with useEffect for more reliable updates
  useEffect(() => {
    if (!isRunning) return;

    const pollStatus = async () => {
      try {
        console.log('Manual status poll...'); // Debug log
        await refetchStatus();
        
        // Also fetch matches if progress is sufficient
        if (simulatedProgress > 10) {
          await refetchMatches();
        }
      } catch (error) {
        console.warn('Manual polling failed:', error);
      }
    };

    // Start polling immediately
    pollStatus();

    // Set up interval polling
    const intervalId = setInterval(pollStatus, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [isRunning, refetchStatus, refetchMatches, simulatedProgress]);

  // Update simulated progress based on actual backend status
  useEffect(() => {
    if (status && status.running && isRunning) {
      // If backend provides actual progress, use it to adjust our simulation
      if (status.progress && status.progress > simulatedProgress) {
        console.log('Adjusting progress based on backend:', status.progress);
        setSimulatedProgress(status.progress);
      }
      
      // If backend provides estimated time, adjust our simulation
      if (status.estimated_time && estimatedDuration) {
        const backendEstimate = status.estimated_time * 1000;
        if (Math.abs(backendEstimate - estimatedDuration) > 10000) { // If difference > 10s
          console.log('Adjusting duration estimate:', backendEstimate);
          setEstimatedDuration(backendEstimate);
          // Restart progress simulation with new estimate
          clearProgressSimulation();
          const remaining = backendEstimate - elapsedTime;
          if (remaining > 0) {
            startProgressSimulation(remaining);
          }
        }
      }
    }
  }, [status, isRunning, simulatedProgress, estimatedDuration, elapsedTime]);

  // Monitor for progress changes and provide feedback
  useEffect(() => {
    if (status && isRunning) {
      console.log('Progress update:', simulatedProgress, status.stage); // Debug log
      
      // Show progress milestones based on simulated progress (prevent duplicate toasts)
      const currentMilestone = Math.floor(simulatedProgress / 25); // 0%, 25%, 50%, 75%
      
      if (simulatedProgress >= 25 && simulatedProgress < 30 && !milestoneShown.has(25)) {
        toast('🧠 Similarity analysis in progress...', { 
          duration: 2000,
          icon: '⚡'
        });
        setMilestoneShown(prev => new Set(prev).add(25));
      } else if (simulatedProgress >= 50 && simulatedProgress < 55 && !milestoneShown.has(50)) {
        toast('🔮 Running prediction models...', { 
          duration: 2000,
          icon: '🎯'
        });
        setMilestoneShown(prev => new Set(prev).add(50));
      } else if (simulatedProgress >= 75 && simulatedProgress < 80 && !milestoneShown.has(75)) {
        toast('⚡ Optimizing allocations...', { 
          duration: 2000,
          icon: '🚀'
        });
        setMilestoneShown(prev => new Set(prev).add(75));
      }
    }
  }, [simulatedProgress, status?.stage, isRunning, milestoneShown]);

  // Stop polling when allocation is completed or failed
  useEffect(() => {
    if (status && !status.running && isRunning) {
      console.log('Allocation finished:', status.progress); // Debug log
      
      // Complete the progress bar
      setSimulatedProgress(100);
      setIsRunning(false);
      clearProgressSimulation();
      clearTimeCounter();
      
      if (status.progress >= 100) {
        // Success celebration
        toast.success('🎉 Allocation completed successfully!', {
          duration: 4000,
          style: {
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none'
          }
        });
        
        // Show completion time
        const totalTime = Math.round(elapsedTime / 1000);
        setTimeout(() => {
          toast(`✅ Process completed in ${totalTime}s`, {
            duration: 3000,
            icon: '⏱️'
          });
        }, 1000);
      } else if (status.progress > 0) {
        toast.error('❌ Allocation process encountered an error', {
          duration: 4000
        });
      }
    }
  }, [status?.running, status?.progress, isRunning, elapsedTime]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      clearProgressSimulation();
      clearTimeCounter();
    };
  }, []);

  const handleStart = () => {
    console.log('Starting allocation...'); // Debug log
    setSimulatedProgress(0);
    setElapsedTime(0);
    setStartTime(null);
    setEstimatedDuration(null);
    setMilestoneShown(new Set()); // Reset milestones
    startAllocation.mutate(config);
  };

  const handleStop = () => {
    setIsRunning(false);
    clearProgressSimulation();
    clearTimeCounter();
    setSimulatedProgress(0);
    setElapsedTime(0);
    setStartTime(null);
    setMilestoneShown(new Set()); // Reset milestones
    toast('⏹️ Allocation monitoring stopped', { 
      duration: 2000,
      style: {
        background: '#f59e0b',
        color: 'white'
      }
    });
  };

  const getDisplayProgress = () => {
    // Use simulated progress for smooth animation
    return Math.min(100, Math.max(0, simulatedProgress));
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEstimatedTimeRemaining = () => {
    if (!estimatedDuration || !startTime) return null;
    const remaining = estimatedDuration - elapsedTime;
    return Math.max(0, remaining);
  };

  // Show connection status
  const isConnected = !statusIsError || (Date.now() - lastUpdateTime) < 10000;

  return (
    <div className="p-6 space-y-6 animate-fade-in-up" id="allocation-content">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Allocation Engine</h2>
          <p className="text-muted-foreground">
            Configure and run the intelligent internship allocation algorithm
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant={isRunning ? "default" : "outline"} className="flex items-center space-x-1">
            <Brain className="h-3 w-3" />
            <span>
              {isRunning ? (
                !isConnected ? 'Connection Issues' : 
                status?.running ? 'Running' : 'Finishing...'
              ) : simulatedProgress === 100 ? 'Completed' : 'Ready'}
            </span>
          </Badge>
          
          {/* Connection indicator */}
          {isRunning && (
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          )}
        </div>
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
                  {startAllocation.isPending ? 'Starting...' : 'Start Allocation'}
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
              {isRunning && (
                <div className="ml-auto">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                    <span>Live Updates</span>
                  </div>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connection Error Display */}
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
                      refetchStatus();
                      toast('Attempting to reconnect...', { icon: '🔄' });
                    }}
                  >
                    Retry Now
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleStop}
                  >
                    Stop Monitoring
                  </Button>
                </div>
              </div>
            )}
            
            {/* Show initial loading state when starting */}
            {isRunning && simulatedProgress === 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Initializing allocation engine...</p>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            )}
            
            {/* Main progress display */}
            {(simulatedProgress > 0 || status) && (
              <>
                {/* Allocation Animation */}
                <AllocationAnimation
                  stage={status?.stage || 'loading'}
                  progress={getDisplayProgress()}
                  isRunning={isRunning}
                  isCompleted={simulatedProgress >= 100 && !isRunning}
                  isFailed={!isRunning && simulatedProgress > 0 && simulatedProgress < 100}
                />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.floor(Math.round(getDisplayProgress()))}%</span>
                  </div>
                  <Progress value={getDisplayProgress()} className="h-2" />
                  
                  {/* Time Information */}
                  {isRunning && startTime && (
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>Elapsed: {formatTime(elapsedTime)}</span>
                      </div>
                      {getEstimatedTimeRemaining() && (
                        <span>Est. remaining: {formatTime(getEstimatedTimeRemaining()!)}</span>
                      )}
                    </div>
                  )}
                  
                  {simulatedProgress >= 100 && !isRunning && (
                    <div className="text-xs text-green-600 text-right font-medium">
                      ✅ Completed in {formatTime(elapsedTime)}
                    </div>
                  )}
                </div>

                {status && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Current Stage</h3>
                    <Badge variant="outline" className="text-sm">
                      {status.stage || 'Initializing'}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{status.message || 'Starting allocation process...'}</p>
                    {status.total_students && (
                      <p className="text-xs text-muted-foreground">
                        Processing {status.total_students} students
                      </p>
                    )}
                  </div>
                )}

                {/* Live Matches Preview */}
                {liveMatches.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <Users className="h-4 w-4" />
                      <span>Live Matches ({liveMatches.length})</span>
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {liveMatches.slice(0, 5).map((match, index) => (
                        <div key={index} className="p-3 bg-muted rounded-lg text-sm animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
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
            )}

            {/* Default state when not running and no progress */}
            {!isRunning && simulatedProgress === 0 && (
              <AllocationAnimation
                stage=""
                progress={0}
                isRunning={false}
                isCompleted={false}
                isFailed={false}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}