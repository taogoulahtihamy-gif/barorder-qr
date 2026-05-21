import { useEffect } from 'react';
import AppRouter from './router';
import { useApp } from './context/AppContext';
import { initCustomerOrderTracking } from './services/realtimeNotificationService';

function ActiveOrderTracker() {
  const { t } = useApp();
  useEffect(() => {
    initCustomerOrderTracking(t);
  }, [t]);
  return null;
}

export default function App() {
  return (
    <>
      <ActiveOrderTracker />
      <AppRouter />
    </>
  );
}
