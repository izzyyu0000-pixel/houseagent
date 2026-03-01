import { useEffect, useRef, useState } from 'react';
import type { TemplateConfig, PropertyData, CanvasAssets } from '../types';
import { canvasRenderer } from '../lib/CanvasRenderer';

export function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  template: TemplateConfig,
  data: PropertyData,
  assets: CanvasAssets,
  watermark?: string,
  fullWatermark?: string
): { isRendering: boolean } {
  const [isRendering, setIsRendering] = useState(false);
  const timerRef = useRef<number>();

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      setIsRendering(true);
      try {
        await canvasRenderer.render(ctx, template, data, assets, {
          watermark,
          fullWatermark,
        });
      } finally {
        setIsRendering(false);
      }
    }, 150);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [canvasRef, template, data, assets, watermark, fullWatermark]);

  return { isRendering };
}
