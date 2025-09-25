import { Brain, Users, Zap, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AllocationAnimationProps {
  stage: string;
  progress: number;
  isRunning: boolean;
  isCompleted: boolean;
  isFailed: boolean;
}

export function AllocationAnimation({ 
  stage, 
  progress, 
  isRunning, 
  isCompleted, 
  isFailed 
}: AllocationAnimationProps) {
  if (isFailed) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <XCircle className="h-16 w-16 text-destructive animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Allocation Failed</h3>
          <p className="text-sm text-muted-foreground">Please try again</p>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="relative">
          <CheckCircle className="h-16 w-16 text-green-500 animate-bounce" />
          <div className="absolute -top-2 -right-2">
            <div className="w-6 h-6 bg-green-500 rounded-full animate-ping opacity-75" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-green-600">Allocation Complete!</h3>
          <p className="text-sm text-muted-foreground">All students have been matched</p>
        </div>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!isRunning) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Brain className="h-16 w-16 text-muted-foreground/50" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">Ready to Allocate</h3>
          <p className="text-sm text-muted-foreground">Configure settings and start allocation</p>
        </div>
      </div>
    );
  }

  // Running animation based on stage
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      {/* Main animated icon */}
      <div className="relative">
        {stage === 'loading' && (
          <div className="relative">
            <Brain className="h-16 w-16 text-primary animate-pulse" />
            <div className="absolute inset-0 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        
        {stage === 'similarity' && (
          <div className="relative">
            <Users className="h-16 w-16 text-blue-500 animate-bounce" />
            <div className="absolute -top-2 -right-2 w-6 h-6">
              <Zap className="h-6 w-6 text-yellow-500 animate-pulse" />
            </div>
          </div>
        )}
        
        {stage === 'prediction' && (
          <div className="relative">
            <Brain className="h-16 w-16 text-purple-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-full animate-ping" />
          </div>
        )}
        
        {stage === 'optimization' && (
          <div className="relative">
            <Zap className="h-16 w-16 text-orange-500 animate-pulse" />
            <div className="absolute -inset-4">
              <div className="w-full h-full border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          </div>
        )}
        
        {!['loading', 'similarity', 'prediction', 'optimization'].includes(stage) && (
          <Brain className="h-16 w-16 text-primary animate-pulse" />
        )}
      </div>

      {/* Stage info */}
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold capitalize">
          {stage === 'loading' ? 'Initializing...' :
           stage === 'similarity' ? 'Analyzing Similarities' :
           stage === 'prediction' ? 'Predicting Outcomes' :
           stage === 'optimization' ? 'Optimizing Matches' :
           'Processing...'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {progress}% complete
        </p>
      </div>

      {/* Progress dots */}
      <div className="flex space-x-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-300",
              i <= Math.floor(progress / 20) - 1 ? "bg-primary animate-pulse" : "bg-muted"
            )}
            style={{ 
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s'
            }}
          />
        ))}
      </div>

      {/* Neural network animation */}
      <div className="relative w-32 h-8 opacity-50">
        <svg viewBox="0 0 120 30" className="w-full h-full">
          {/* Animated connections */}
          <line x1="10" y1="15" x2="50" y2="8" stroke="currentColor" strokeWidth="1" className="animate-pulse" />
          <line x1="10" y1="15" x2="50" y2="22" stroke="currentColor" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
          <line x1="50" y1="8" x2="90" y2="15" stroke="currentColor" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
          <line x1="50" y1="22" x2="90" y2="15" stroke="currentColor" strokeWidth="1" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
          
          {/* Nodes */}
          <circle cx="10" cy="15" r="3" fill="currentColor" className="animate-pulse" />
          <circle cx="50" cy="8" r="2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.1s' }} />
          <circle cx="50" cy="22" r="2" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
          <circle cx="90" cy="15" r="3" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
          <circle cx="110" cy="15" r="3" fill="currentColor" className="animate-pulse" style={{ animationDelay: '0.7s' }} />
        </svg>
      </div>
    </div>
  );
}