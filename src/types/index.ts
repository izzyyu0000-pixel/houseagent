export interface PropertyData {
  title: string;
  price: string;
  area: string;
  layout: string;
  description: string;
  phone: string;
  lineId: string;
  agentName: string;
  companyName: string;
}

export interface BaseElement {
  id: string;
  zIndex: number;
}

export interface PropertyImageElement extends BaseElement {
  kind: 'property-image';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AvatarImageElement extends BaseElement {
  kind: 'avatar-image';
  x: number;
  y: number;
  width: number;
  height: number;
  shape: 'circle' | 'rect';
  borderColor?: string;
  borderWidth?: number;
}

export interface OverlayImageElement extends BaseElement {
  kind: 'overlay-image';
  assetPath: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextFieldElement extends BaseElement {
  kind: 'text-field';
  fieldKey: keyof PropertyData;
  x: number;
  y: number;
  font: string;
  color: string;
  align?: CanvasTextAlign;
  maxWidth?: number;
  lineHeight?: number;
}

export interface StaticTextElement extends BaseElement {
  kind: 'static-text';
  value: string;
  x: number;
  y: number;
  font: string;
  color: string;
  align?: CanvasTextAlign;
}

export interface ShapeElement extends BaseElement {
  kind: 'shape';
  shapeType: 'rect' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor?: string;
  lineWidth?: number;
}

export type TemplateElement =
  | PropertyImageElement
  | AvatarImageElement
  | OverlayImageElement
  | TextFieldElement
  | StaticTextElement
  | ShapeElement;

export interface TemplateConfig {
  id: string;
  name: string;
  tier: 'free' | 'pro';
  canvasSize: { width: number; height: number };
  backgroundColor: string;
  elements: TemplateElement[];
}

export interface CanvasAssets {
  propertyImageSrc?: string;
  avatarImageSrc?: string;
}

export interface RenderOptions {
  watermark?: string;      // bottom-right small watermark
  fullWatermark?: string;  // full canvas tiled watermark
}
