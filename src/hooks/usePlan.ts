import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PlanState {
  plan: 'free' | 'pro';
  isLoading: boolean;
}

export function usePlan(userId: string | null): PlanState {
  const [plan, setPlan] = useState<'free' | 'pro'>('free');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPlan('free');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const docRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setPlan(data.plan === 'pro' ? 'pro' : 'free');
      } else {
        setPlan('free');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { plan, isLoading };
}
