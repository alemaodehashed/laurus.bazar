import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { VitrinePage } from './components/Vitrine/VitrinePage';
import { AdminPage } from './components/Admin/AdminPage';
import { LoginModal } from './components/Admin/LoginModal';
import { Toast } from './components/common/Toast';
import './styles/theme.css';
import './styles/components.css';
import './styles/vitrine.css';
import './styles/admin.css';

const VIEW_STORAGE_KEY = 'bazar_current_view';

const MainApp = () => {
  const { isAdminAuthenticated } = useStore();
  const [currentView, setCurrentView] = useState(() => {
    try {
      const isAuth = localStorage.getItem('bazar_admin_session') === 'true';
      const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
      if (isAuth && savedView === 'admin') {
        return 'admin';
      }
    } catch (e) {}
    return 'vitrine';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const setView = (view) => {
    setCurrentView(view);
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch (e) {}
  };

  useEffect(() => {
    if (!isAdminAuthenticated && currentView === 'admin') {
      setView('vitrine');
    }
  }, [isAdminAuthenticated, currentView]);

  const handleOpenAdminLogin = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      <Toast />

      {currentView === 'vitrine' ? (
        <VitrinePage
          onOpenAdminLogin={handleOpenAdminLogin}
        />
      ) : (
        <AdminPage
          onGoToVitrine={() => setView('vitrine')}
        />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          // If login succeeded, move to admin view
          if (isAdminAuthenticated) {
            setView('admin');
          }
        }}
      />
    </>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainApp />
    </StoreProvider>
  );
}
