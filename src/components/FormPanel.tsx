import type { TemplateConfig, PropertyData, TextFieldElement } from '../types';

interface FormPanelProps {
  templates: TemplateConfig[];
  selectedTemplate: TemplateConfig;
  onTemplateChange: (t: TemplateConfig) => void;
  data: PropertyData;
  onDataChange: (field: keyof PropertyData, value: string) => void;
  onPropertyImageChange: (src: string) => void;
  onAvatarImageChange: (src: string) => void;
  plan: 'free' | 'pro';
  onDownload: () => void;
  isRendering: boolean;
}

export function FormPanel({
  templates,
  selectedTemplate,
  onTemplateChange,
  data,
  onDataChange,
  onPropertyImageChange,
  onAvatarImageChange,
  plan: _plan,
  onDownload,
  isRendering,
}: FormPanelProps) {
  const visibleFields = selectedTemplate.elements
    .filter((el): el is TextFieldElement => el.kind === 'text-field')
    .map((el) => el.fieldKey);

  const uniqueFields = Array.from(new Set(visibleFields));

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (src: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => callback(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleTemplateClick = (template: TemplateConfig) => {
    onTemplateChange(template);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">選擇模板</h3>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{scrollbarWidth: 'none'}}>
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className={`relative flex-shrink-0 cursor-pointer flex flex-col items-center gap-1`}
            >
              <div className={`relative rounded-lg overflow-hidden ${
                selectedTemplate.id === template.id 
                  ? 'ring-2 ring-blue-500 ring-offset-1' 
                  : 'ring-1 ring-gray-200'
              }`}>
                <img
                  src={`/thumbnails/thumb_${template.id}.jpg`}
                  alt={template.name}
                  className="w-20 h-20 object-cover"
                />
                {template.tier === 'free' ? (
                  <span className="absolute top-1 right-1 text-xs px-1 py-0.5 rounded font-bold bg-green-500 text-white">
                    免費
                  </span>
                ) : (
                  <span className="absolute top-1 right-1 text-xs px-1 py-0.5 rounded font-bold bg-yellow-500 text-white">
                    Pro
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600 text-center w-20 truncate">{template.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">上傳圖片</h3>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium mb-1">物件主圖</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, onPropertyImageChange)}
              className="block w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">經紀人大頭照</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, onAvatarImageChange)}
              className="block w-full text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">物件資訊</h3>
        <div className="space-y-3">
          {uniqueFields.map((field) => (
            <div key={field}>
              <label className="block text-sm font-medium mb-1">
                {field === 'title' && '標題'}
                {field === 'price' && '價格'}
                {field === 'area' && '坪數'}
                {field === 'layout' && '格局'}
                {field === 'description' && '描述'}
                {field === 'phone' && '聯絡電話'}
                {field === 'lineId' && 'LINE ID'}
                {field === 'agentName' && '經紀人姓名'}
                {field === 'companyName' && '公司名稱'}
              </label>
              {field === 'description' ? (
                <textarea
                  value={data[field]}
                  onChange={(e) => onDataChange(field, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  value={data[field]}
                  onChange={(e) => onDataChange(field, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t">
        <button
          onClick={onDownload}
          disabled={isRendering}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isRendering ? '⏳ 生成中...' : '⬇️ 下載圖片'}
        </button>
      </div>
    </div>
  );
}
