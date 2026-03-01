import type { TemplateConfig } from '../types';

interface PreviewPanelProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  template: TemplateConfig;
  plan: 'free' | 'pro';
}

export function PreviewPanel({ canvasRef, template }: PreviewPanelProps) {
  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">{template.name}</h3>
        <p className="text-sm text-gray-600">
          {template.canvasSize.width} × {template.canvasSize.height} px
        </p>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={template.canvasSize.width}
          height={template.canvasSize.height}
          className="w-full aspect-square border rounded"
        />
      </div>
    </div>
  );
}
