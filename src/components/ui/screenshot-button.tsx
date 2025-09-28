import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel 
} from '@/components/ui/dropdown-menu';
import { Camera, Download, Image, Sparkles } from 'lucide-react';
import { useScreenshot } from '@/hooks/useScreenshot';

interface ScreenshotButtonProps {
  targetElementId: string;
  filename?: string;
  className?: string;
}

export function ScreenshotButton({ 
  targetElementId, 
  filename = 'dashboard-screenshot',
  className = '' 
}: ScreenshotButtonProps) {
  const { captureAndDownload } = useScreenshot();
  const [isCapturing, setIsCapturing] = useState(false);

  const handleScreenshot = async (scale: number, format: 'png' | 'jpeg' = 'png') => {
    setIsCapturing(true);
    try {
      await captureAndDownload(targetElementId, {
        filename,
        scale,
        format,
        quality: format === 'jpeg' ? 0.95 : 1.0,
      });
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`${className} relative overflow-hidden group`}
          disabled={isCapturing}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isCapturing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
              Capturing...
            </>
          ) : (
            <>
              <Camera className="h-4 w-4 mr-2" />
              Download Screenshot
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center">
          <Image className="h-4 w-4 mr-2" />
          Screenshot Quality
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleScreenshot(2, 'png')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>📱 Standard HD</span>
            <span className="text-xs text-muted-foreground">PNG, 2x</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleScreenshot(3, 'png')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>🖥️ High Quality</span>
            <span className="text-xs text-muted-foreground">PNG, 3x</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => handleScreenshot(4, 'png')}
          className="cursor-pointer flex items-center"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Sparkles className="h-3 w-3 mr-1" />
              <span>✨ Ultra 4K</span>
            </div>
            <span className="text-xs text-muted-foreground">PNG, 4x</span>
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleScreenshot(3, 'jpeg')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>📄 Compressed</span>
            <span className="text-xs text-muted-foreground">JPEG, 3x</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}