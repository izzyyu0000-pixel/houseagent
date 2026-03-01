import { useEffect } from "react";

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlan: (plan: 'single' | 'pro') => void;
}

export default function PaywallModal({ isOpen, onClose, onSelectPlan }: PaywallModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white/80 transition-colors z-10 text-2xl leading-none"
        >
          ✕
        </button>

        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center">
          <div className="text-4xl mb-4">🚀</div>
          <h2
            className="text-2xl font-bold text-white mb-3 leading-tight"
            style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.02em' }}
          >
            距離成交，只差這張完美的圖卡！
          </h2>
          <p className="text-white/55 text-sm leading-relaxed max-w-md mx-auto">
            去除浮水印、解鎖尊榮版型，展現百萬經紀人的絕對專業。
          </p>
        </div>

        {/* Divider */}
        <div className="mx-8 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.12), transparent)' }} />

        {/* Plan Cards */}
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Card A - Single */}
          <div
            className="rounded-xl p-6 flex flex-col gap-4 cursor-pointer group"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          >
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">單次使用</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">$49</span>
                <span className="text-white/40 text-sm">/ 次</span>
              </div>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {['下載一張無浮水印圖卡', '可選任意版型（含PRO）', '即買即用'].map(item => (
                <li key={item} className="flex items-center gap-2 text-white/60 text-sm">
                  <span className="text-white/30">✓</span> {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => onSelectPlan('single')}
              className="w-full py-2.5 rounded-lg text-sm font-medium text-white/70 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'transparent' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
            >
              私訊粉專客服單次解鎖
            </button>
          </div>

          {/* Card B - PRO */}
          <div
            className="rounded-xl p-6 flex flex-col gap-4 relative cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, rgba(234,179,8,0.15) 0%, rgba(251,146,60,0.10) 100%)',
              border: '1.5px solid rgba(234,179,8,0.6)',
              boxShadow: '0 0 32px rgba(234,179,8,0.12)',
            }}
          >
            {/* Badge */}
            <div
              className="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: 'linear-gradient(to right, #f59e0b, #ef4444)', color: 'white' }}
            >
              🔥 最划算
            </div>

            <div>
              <p className="text-yellow-400/70 text-xs uppercase tracking-widest mb-1">PRO 月費會員</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-yellow-300">$399</span>
                <span className="text-yellow-400/50 text-sm">/ 月</span>
              </div>
              <p className="text-yellow-400/40 text-xs mt-1">平均每天不到 $14</p>
            </div>

            <ul className="flex flex-col gap-2 flex-1">
              {[
                '無限次下載，完全無浮水印',
                '解鎖全部尊榮版型',
                '賀成交、霸氣、喜氣版型',
                '優先獲得新版型搶先體驗',
                '專屬客服支援',
              ].map(item => (
                <li key={item} className="flex items-center gap-2 text-yellow-100/80 text-sm">
                  <span className="text-yellow-400 text-xs">✦</span> {item}
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPlan('pro')}
              className="w-full py-3 rounded-lg text-sm font-bold text-white transition-all"
              style={{
                background: 'linear-gradient(to right, #f59e0b, #f97316)',
                boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,0.6)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              👉 私訊粉專客服，人工開通 PRO
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-8 text-center">
          <p className="text-white/25 text-xs">
            🔒 本站採用綠界科技 ECPay 安全加密結帳
          </p>
        </div>
      </div>
    </div>
  );
}