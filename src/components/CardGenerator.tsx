import { useRef, useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { PropertyData, CanvasAssets } from '../types';
import { TEMPLATE_REGISTRY, DEFAULT_PROPERTY_DATA } from '../constants/templates';
import { useCanvasRenderer } from '../hooks/useCanvasRenderer';
import { usePlan } from '../hooks/usePlan';
import { FormPanel } from './FormPanel';
import { PreviewPanel } from './PreviewPanel';
import PaywallModal from './PaywallModal';

interface CardGeneratorProps {
  user: User | null;
}

export function CardGenerator({ user }: CardGeneratorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_REGISTRY[0]);
  const [data, setData] = useState<PropertyData>(DEFAULT_PROPERTY_DATA);
  const [assets, setAssets] = useState<CanvasAssets>({});
  const [showPaywall, setShowPaywall] = useState(false);

  const { plan } = usePlan(user?.uid ?? null);

  // Load user profile from Firestore
  const loadUserProfile = async (userId: string) => {
    const ref = doc(db, 'users', userId, 'profile', 'info');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const profileData = snap.data();
      setData(prev => ({
        ...prev,
        agentName: profileData.agentName ?? prev.agentName,
        companyName: profileData.companyName ?? prev.companyName,
        phone: profileData.phone ?? prev.phone,
        lineId: profileData.lineId ?? prev.lineId,
      }));
    }
  };

  // Save user profile to Firestore (debounced)
  const saveUserProfile = async (userId: string, profileData: Partial<PropertyData>) => {
    const ref = doc(db, 'users', userId, 'profile', 'info');
    await setDoc(ref, {
      agentName: profileData.agentName,
      companyName: profileData.companyName,
      phone: profileData.phone,
      lineId: profileData.lineId,
    }, { merge: true });
  };

  // Load profile when user logs in
  useEffect(() => {
    if (user?.uid) {
      loadUserProfile(user.uid);
      
      // Save user email to Firestore for admin panel
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        email: user.email,
        lastLogin: new Date().toISOString(),
      }, { merge: true });
    }
  }, [user?.uid]);

  // Auto-save profile when fields change (debounced)
  useEffect(() => {
    if (!user?.uid) return;
    const timer = setTimeout(() => {
      saveUserProfile(user.uid, data);
    }, 1000);
    return () => clearTimeout(timer);
  }, [data.agentName, data.companyName, data.phone, data.lineId, user?.uid]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Free user viewing PRO template → full tiled watermark
  const fullWatermark = (plan === 'free' && selectedTemplate.tier === 'pro')
    ? '👑 升級 PRO 解鎖'
    : undefined;

  // Free user (any template) → bottom-right search watermark  
  const watermark = (user && plan === 'free' && selectedTemplate.tier !== 'pro')
    ? '🔍 搜尋：房仲圖卡神器'
    : undefined;

  const { isRendering } = useCanvasRenderer(canvasRef, selectedTemplate, data, assets, watermark, fullWatermark);

  const handleDataChange = (field: keyof PropertyData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePropertyImageChange = (src: string) => {
    setAssets((prev) => ({ ...prev, propertyImageSrc: src }));
  };

  const handleAvatarImageChange = (src: string) => {
    setAssets((prev) => ({ ...prev, avatarImageSrc: src }));
  };

  // 獨立的登入按鈕邏輯
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("登入失敗", error);
    }
  };

  const handleDownload = async () => {
    if (isRendering) return;

    // Not logged in: show login popup
    if (!user) {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        // After login, check if still need paywall
        if (selectedTemplate.tier === 'pro' && plan === 'free') {
          setShowPaywall(true);
          return;
        }
      } catch {
        return;
      }
    }

    // Pro template check for free users
    if (selectedTemplate.tier === 'pro' && plan === 'free') {
      setShowPaywall(true);
      return;
    }

    // Download
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `房產圖卡-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">房仲圖卡神器</h1>
          
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">{user.email}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                  plan === 'pro' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-green-500 text-white'
                }`}>
                  {plan === 'pro' ? 'PRO' : '免費版'}
                </span>
                <button
                  onClick={() => signOut(auth)}
                  className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 px-3 py-1 rounded transition-colors"
                >
                  登出
                </button>
              </>
            ) : (
              // 行銷總監指定的引流按鈕
              <button
                onClick={handleLogin}
                className="text-sm font-bold text-blue-600 border-2 border-blue-600 px-4 py-1.5 rounded-full hover:bg-blue-50 hover:shadow-sm transition-all flex items-center gap-2"
              >
                <span>👤</span> 登入 / 免費註冊
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow">
            <FormPanel
              templates={TEMPLATE_REGISTRY}
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
              data={data}
              onDataChange={handleDataChange}
              onPropertyImageChange={handlePropertyImageChange}
              onAvatarImageChange={handleAvatarImageChange}
              plan={plan}
              onDownload={handleDownload}
              isRendering={isRendering}
            />
          </div>
          <div className="bg-white rounded-lg shadow">
            <PreviewPanel canvasRef={canvasRef} template={selectedTemplate} plan={plan} />
          </div>
        </div>
      </main>
      
      {/* 行銷總監指定的信任感頁尾 - FB 粉專版 */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            <span className="font-bold text-gray-700">🏠 房仲圖卡神器</span>
            <span className="mx-2">|</span> 
            © 2026 All rights reserved.
          </div>
          
          <div className="flex items-center gap-6">
            <a 
              href="mailto:izzyyu0000@gmail.com" 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              ✉️ 客服信箱
            </a>
            <a 
              href="https://www.facebook.com/profile.php?id=61588599432496" 
              target="_blank" 
              rel="noreferrer"
              className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-full transition-colors flex items-center gap-2"
            >
              {/* Facebook Messenger Icon */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.477 2 2 6.145 2 11.25c0 2.898 1.48 5.485 3.8 7.156v3.702l3.468-1.916c.868.24 1.782.358 2.732.358 5.523 0 10-4.145 10-9.25S17.523 2 12 2zm1.09 12.356l-2.89-3.085-5.63 3.085 6.18-6.55 2.89 3.084 5.63-3.084-6.18 6.55z"/></svg>
              私訊粉專客服開通
            </a>
          </div>
        </div>
      </footer>
      
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onSelectPlan={() => {
          setShowPaywall(false);
          // 引導至 FB Messenger 進行人工開通
          window.open('https://www.facebook.com/profile.php?id=61588599432496', '_blank');
        }}
      />
    </div>
  );
}
