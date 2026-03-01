import { useAuth } from './hooks/useAuth';
import { CardGenerator } from './components/CardGenerator';

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-lg">載入中...</p>
    </div>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen />;
  return <CardGenerator user={user} />;
}
