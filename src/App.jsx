import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { VitrinePage } from './components/Vitrine/VitrinePage';
import { AdminPage } from './components/Admin/AdminPage';
import { LoginModal } from './components/Admin/LoginModal';
import { Toast } from './components/common/Toast';
import './styles/theme.css';
import './styles/components.css';
import './styles/vitrine.css';
import './styles/admin.css';

const MainApp = () => {
  const { isAdminAuthenticated } = useStore();
  const [currentView, setCurrentView] = useState('vitrine'); // 'vitrine' | 'admin'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleOpenAdminLogin = () => {
    if (isAdminAuthenticated) {
      setCurrentView('admin');
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
          onGoToVitrine={() => setCurrentView('vitrine')}
        />
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => {
          setIsLoginModalOpen(false);
          // If login succeeded, move to admin view
          if (isAdminAuthenticated) {
            setCurrentView('admin');
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
