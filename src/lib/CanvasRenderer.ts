import type {
  TemplateConfig,
  PropertyData,
  CanvasAssets,
  RenderOptions,
  PropertyImageElement,
  AvatarImageElement,
  OverlayImageElement,
  TextFieldElement,
  StaticTextElement,
  ShapeElement,
} from '../types';

export class CanvasRenderer {
  private imageCache = new Map<string, HTMLImageElement>();

  async render(
    ctx: CanvasRenderingContext2D,
    template: TemplateConfig,
    data: PropertyData,
    assets: CanvasAssets,
    options?: RenderOptions
  ): Promise<void> {
    ctx.clearRect(0, 0, template.canvasSize.width, template.canvasSize.height);
    ctx.fillStyle = template.backgroundColor;
    ctx.fillRect(0, 0, template.canvasSize.width, template.canvasSize.height);

    const sorted = [...template.elements].sort((a, b) => a.zIndex - b.zIndex);

    for (const element of sorted) {
      switch (element.kind) {
        case 'property-image':
          await this.drawPropertyImage(ctx, element, assets.propertyImageSrc);
          break;
        case 'avatar-image':
          await this.drawAvatarImage(ctx, element, assets.avatarImageSrc);
          break;
        case 'overlay-image':
          await this.drawOverlayImage(ctx, element);
          break;
        case 'text-field':
          this.drawTextField(ctx, element, data);
          break;
        case 'static-text':
          this.drawStaticText(ctx, element);
          break;
        case 'shape':
          this.drawShape(ctx, element);
          break;
      }
    }

    if (options?.fullWatermark) {
      this.drawFullWatermark(ctx, template.canvasSize.width, template.canvasSize.height, options.fullWatermark);
    }
    if (options?.watermark) {
      this.drawWatermark(ctx, options.watermark, template.canvasSize.width, template.canvasSize.height);
    }
  }

  private async loadImage(src: string): Promise<HTMLImageElement | null> {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  private async drawPropertyImage(
    ctx: CanvasRenderingContext2D,
    el: PropertyImageElement,
    src?: string
  ): Promise<void> {
    if (!src) {
      ctx.fillStyle = '#e0e0e0';
      ctx.fillRect(el.x, el.y, el.width, el.height);
      ctx.fillStyle = '#666666';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('請上傳物件主圖', el.x + el.width / 2, el.y + el.height / 2);
      return;
    }

    const img = await this.loadImage(src);
    if (!img) return;

    const scale = Math.max(el.width / img.naturalWidth, el.height / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const sx = el.x + (el.width - sw) / 2;
    const sy = el.y + (el.height - sh) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(el.x, el.y, el.width, el.height);
    ctx.clip();
    ctx.drawImage(img, sx, sy, sw, sh);
    ctx.restore();
  }

  private async drawAvatarImage(
    ctx: CanvasRenderingContext2D,
    el: AvatarImageElement,
    src?: string
  ): Promise<void> {
    if (!src) {
      ctx.fillStyle = '#cccccc';
      if (el.shape === 'circle') {
        const r = Math.min(el.width, el.height) / 2;
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(el.x, el.y, el.width, el.height);
      }
      ctx.fillStyle = '#666666';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('大頭照', el.x + el.width / 2, el.y + el.height / 2);
      return;
    }

    const img = await this.loadImage(src);
    if (!img) return;

    const scale = Math.max(el.width / img.naturalWidth, el.height / img.naturalHeight);
    const sw = img.naturalWidth * scale;
    const sh = img.naturalHeight * scale;
    const sx = el.x + (el.width - sw) / 2;
    const sy = el.y + (el.height - sh) / 2;

    if (el.shape === 'circle') {
      const r = Math.min(el.width, el.height) / 2;
      const cx = el.x + el.width / 2;
      const cy = el.y + el.height / 2;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh);
      ctx.restore();

      if (el.borderColor) {
        ctx.strokeStyle = el.borderColor;
        ctx.lineWidth = el.borderWidth ?? 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(el.x, el.y, el.width, el.height);
      ctx.clip();
      ctx.drawImage(img, sx, sy, sw, sh);
      ctx.restore();
    }
  }

  private async drawOverlayImage(
    ctx: CanvasRenderingContext2D,
    el: OverlayImageElement
  ): Promise<void> {
    const img = await this.loadImage(el.assetPath);
    if (!img) {
      console.warn(`Failed to load overlay image: ${el.assetPath}`);
      return;
    }
    ctx.drawImage(img, el.x, el.y, el.width, el.height);
  }

  private drawTextField(
    ctx: CanvasRenderingContext2D,
    el: TextFieldElement,
    data: PropertyData
  ): void {
    const text = String(data[el.fieldKey] ?? '');
    ctx.font = el.font;
    ctx.fillStyle = el.color;
    ctx.textAlign = el.align ?? 'left';
    ctx.textBaseline = 'alphabetic';

    if (!el.maxWidth) {
      ctx.fillText(text, el.x, el.y);
      return;
    }

    const match = el.font.match(/(\d+)px/);
    const fontSize = match ? parseInt(match[1]) : 16;
    const lh = el.lineHeight ?? fontSize * 1.4;
    const chars = text.split('');
    const lines: string[] = [];
    let current = '';

    for (const char of chars) {
      const test = current + char;
      if (ctx.measureText(test).width > el.maxWidth && current !== '') {
        lines.push(current);
        current = char;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);

    lines.forEach((line, i) => {
      ctx.fillText(line, el.x, el.y + i * lh);
    });
  }

  private drawStaticText(ctx: CanvasRenderingContext2D, el: StaticTextElement): void {
    ctx.font = el.font;
    ctx.fillStyle = el.color;
    ctx.textAlign = el.align ?? 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(el.value, el.x, el.y);
  }

  private drawShape(ctx: CanvasRenderingContext2D, el: ShapeElement): void {
    if (el.shapeType === 'rect') {
      if (el.fillColor) {
        ctx.fillStyle = el.fillColor;
        ctx.fillRect(el.x, el.y, el.width, el.height);
      }
      if (el.strokeColor) {
        ctx.strokeStyle = el.strokeColor;
        ctx.lineWidth = el.lineWidth ?? 1;
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      }
    } else if (el.shapeType === 'line') {
      ctx.strokeStyle = el.strokeColor ?? '#000000';
      ctx.lineWidth = el.lineWidth ?? 1;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y);
      ctx.lineTo(el.x + el.width, el.y);
      ctx.stroke();
    }
  }

  private drawFullWatermark(ctx: CanvasRenderingContext2D, w: number, h: number, text: string): void {
    ctx.save();
    ctx.globalAlpha = 0.30;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Rotate 45 degrees and tile across canvas
    const spacing = 220;
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 4);
    
    for (let y = -h; y < h; y += spacing) {
      for (let x = -w; x < w; x += spacing) {
        ctx.fillText(text, x, y);
      }
    }
    ctx.restore();
  }

  private drawWatermark(ctx: CanvasRenderingContext2D, text: string, w: number, h: number): void {
    const x = w - 40;
    const y = h * 0.80;

    ctx.save();
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'right';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

export const canvasRenderer = new CanvasRenderer();
