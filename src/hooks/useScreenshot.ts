import { useCallback } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

interface ScreenshotOptions {
  filename?: string;
  quality?: number;
  scale?: number;
  format?: 'png' | 'jpeg';
  orientation?: 'auto' | 'portrait' | 'landscape';
}

export const useScreenshot = () => {
  const captureAndDownload = useCallback(async (
    elementId: string, 
    options: ScreenshotOptions = {}
  ) => {
    try {
      const {
        filename = 'dashboard-screenshot',
        quality = 1.0,
        scale = 3,
        format = 'png',
        orientation = 'portrait'
      } = options;

      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
      }

      // Show loading state
      const loadingToast = toast.loading('📸 Preparing high-quality screenshot...', {
        duration: 0,
        style: {
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white',
        }
      });

      // Wait a bit for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 500));

      // Detect current theme
      const isDarkMode = document.documentElement.classList.contains('dark') || 
                        document.body.classList.contains('dark') ||
                        window.matchMedia('(prefers-color-scheme: dark)').matches;

      // Get computed background color of the element
      const computedStyle = window.getComputedStyle(element);
      const currentBgColor = computedStyle.backgroundColor;
      
      // Set appropriate background color based on theme
      let backgroundColor = '#ffffff'; // Default white
      
      if (isDarkMode) {
        // Try to get the actual dark theme background
        if (currentBgColor && currentBgColor !== 'rgba(0, 0, 0, 0)' && currentBgColor !== 'transparent') {
          backgroundColor = currentBgColor;
        } else {
          // Common dark theme backgrounds
          backgroundColor = '#0a0a0a'; // or '#1a1a1a', '#111827', etc.
        }
      }

      // Calculate optimal dimensions for portrait orientation
      const originalWidth = element.scrollWidth;
      const originalHeight = element.scrollHeight;
      
      let targetWidth = originalWidth;
      let targetHeight = originalHeight;
      
      if (orientation === 'portrait' && originalWidth > originalHeight) {
        targetWidth = Math.min(originalWidth, 1200);
      }

      // Configure html2canvas for maximum quality with proper theme support
      const canvas = await html2canvas(element, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: backgroundColor, // Use detected background color
        width: targetWidth,
        height: targetHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: targetWidth,
        windowHeight: targetHeight,
        ignoreElements: (element) => {
          return element.classList.contains('screenshot-ignore');
        },
        onclone: (clonedDoc) => {
          // Ensure the cloned document preserves the theme
          const clonedElement = clonedDoc.getElementById(elementId);
          if (clonedElement) {
            // Copy theme classes to cloned document
            if (isDarkMode) {
              clonedDoc.documentElement.classList.add('dark');
              clonedDoc.body.classList.add('dark');
            }
            
            // Set font properties
            clonedElement.style.fontDisplay = 'block';
            clonedElement.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            
            // Ensure background color is applied
            clonedElement.style.backgroundColor = backgroundColor;
            
            // Optimize layout for portrait if needed
            if (orientation === 'portrait') {
              clonedElement.style.maxWidth = '1200px';
              clonedElement.style.margin = '0 auto';
            }

            // Force all elements to use their computed colors
            const allElements = clonedElement.querySelectorAll('*');
            allElements.forEach((el: Element) => {
              const htmlEl = el as HTMLElement;
              const originalEl = document.querySelector(`#${elementId} ${el.tagName.toLowerCase()}:nth-of-type(${Array.from(el.parentElement?.children || []).indexOf(el) + 1})`);
              
              if (originalEl) {
                const originalComputed = window.getComputedStyle(originalEl as Element);
                htmlEl.style.color = originalComputed.color;
                htmlEl.style.backgroundColor = originalComputed.backgroundColor;
                htmlEl.style.borderColor = originalComputed.borderColor;
              }
            });
          }
        },
      }as any);

      // Convert to blob with high quality
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, `image/${format}`, quality);
      });

      const actualWidth = canvas.width;
      const actualHeight = canvas.height;

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Add timestamp and theme info to filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const orientationSuffix = orientation === 'portrait' ? '_portrait' : orientation === 'landscape' ? '_landscape' : '';
      const themeSuffix = isDarkMode ? '_dark' : '_light';
      link.download = `${filename}${orientationSuffix}${themeSuffix}_${actualWidth}x${actualHeight}_${timestamp}.${format}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
      toast.dismiss(loadingToast);

      // Success message with details
      const aspectRatio = actualWidth / actualHeight;
      const orientationText = aspectRatio < 1 ? '📱 Portrait' : aspectRatio > 1.5 ? '🖥️ Landscape' : '⬜ Square';
      const themeText = isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode';
      
      toast.success(
        `📷 Screenshot saved successfully!\n${orientationText} ${themeText}\n🖼️ ${actualWidth}×${actualHeight}px\n💾 ${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        {
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            whiteSpace: 'pre-line',
          }
        }
      );

      return { success: true, blob, width: actualWidth, height: actualHeight };
      
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      toast.error('❌ Failed to capture screenshot. Please try again.', {
        duration: 4000
      });
      return { success: false, error };
    }
  }, []);

  return { captureAndDownload };
};