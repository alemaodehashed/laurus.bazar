import React from 'react';
import { useStore } from '../../context/StoreContext';
import { isSupabaseConfigured } from '../../utils/supabaseClient';
import { DashboardOverview } from './DashboardOverview';
import { VendasHub } from './VendasHub';
import { EstoqueHub } from './EstoqueHub';
import { ClientesManager } from './ClientesManager';
import { BackupSettings } from './BackupSettings';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Save,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

export const AdminPage = ({ onGoToVitrine }) => {
  const {
    settings,
    logoutAdmin,
    activeAdminTab,
    setActiveAdminTab,
    sales,
    syncAllData,
    syncWithCloud,
    isSaving,
    lastSavedTime,
    isCloudConnected
  } = useStore();
  const cloudConfigured = isSupabaseConfigured();

  // Count pending installments for badge
  const pendingFiadoCount = sales.reduce((acc, sale) => {
    if (sale.paymentMethod === 'boca_2x' && sale.installments) {
      return acc + sale.installments.filter((i) => !i.paid).length;
    }
    return acc;
  }, 0);

  // Unified tabs: 5 clean pillars
  const tabs = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'vendas', label: 'Vendas & Caixa (PDV)', icon: ShoppingCart, badge: pendingFiadoCount },
    { id: 'estoque', label: 'Estoque & Gastos da Loja', icon: ShoppingBag },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

  // Resolve active tab if previously set to subtabs (fiado -> vendas, despesas -> estoque)
  const resolvedTab = (activeAdminTab === 'fiado') ? 'vendas'
    : (activeAdminTab === 'despesas') ? 'estoque'
    : activeAdminTab;

  return (
    <div className="admin-layout">
      {/* Top Navbar */}
      <header className="admin-navbar">
        <div className="admin-nav-container">
          <div className="admin-brand">
            <div className="admin-brand-logo">
              <img
                src="/monogram.png"
                alt="Laurus - Monograma LL"
              />
            </div>
            <h2>
              {settings.storeName}
            </h2>
            <span className="admin-badge-family">Painel da Família</span>
          </div>

          <div className="admin-nav-actions">
            {/* Botão de Salvar Tudo / Sincronizar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  background: isSaving ? '#059669' : '#10b981',
                  color: '#ffffff',
                  border: '1px solid #059669',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  cursor: isSaving ? 'wait' : 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={syncAllData}
                disabled={isSaving}
                title="Garante que tudo que você fez fique salvo no navegador e na nuvem"
              >
                <Save size={15} />
                <span>{isSaving ? 'Salvando...' : 'Salvar Tudo'}</span>
              </button>

              <button
                type="button"
                className="btn btn-sm"
                style={{
                  background: 'transparent',
                  color: '#10b981',
                  border: '1px solid #10b981',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={async () => {
                   const ok = await syncWithCloud();
                   alert(ok
                     ? "Nuvem atualizada! Dados de outros dispositivos foram baixados."
                     : "⚠️ Não foi possível conectar à nuvem. As alterações estão ficando só neste navegador.");
                }}
                title="Puxar últimas alterações de outros dispositivos"
              >
                <RefreshCw size={15} />
                <span className="desktop-nav-text">Atualizar</span>
              </button>

              <span
                className="desktop-nav-text"
                style={{
                  fontSize: '0.72rem',
                  color: '#F5F5DC',
                  opacity: 0.9,
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <CheckCircle size={12} color="#10b981" /> {lastSavedTime}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ color: '#F5F5DC', borderColor: '#C5A063' }}
              onClick={onGoToVitrine}
              title="Abrir a vitrine que os clientes visualizam"
            >
              <ExternalLink size={15} />
              <span className="desktop-nav-text">Ver Vitrine dos Clientes</span>
              <span className="mobile-nav-text">Vitrine</span>
            </button>

            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                logoutAdmin();
                onGoToVitrine();
              }}
              title="Sair do painel administrativo"
            >
              <LogOut size={15} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {(!cloudConfigured || !isCloudConnected) && (
        <div
          role="alert"
          style={{
            background: '#7f1d1d',
            color: '#fff',
            padding: '10px 16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {!cloudConfigured
            ? '⚠️ Nuvem NÃO configurada: tudo que você alterar fica SOMENTE neste navegador e não aparece para os clientes.'
            : '⚠️ Sem conexão com a nuvem agora. Clique em "Atualizar" ou "Salvar Tudo" para tentar novamente.'}
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <nav className="admin-tabs-bar">
        <div className="admin-tabs-container">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = resolvedTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`admin-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => setActiveAdminTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.badge > 0 && <span className="tab-badge">{tab.badge}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main Tab Content */}
      <main className="admin-main">
        {resolvedTab === 'dashboard' && <DashboardOverview />}
        {resolvedTab === 'vendas' && <VendasHub initialSubTab={activeAdminTab === 'fiado' ? 'fiado' : 'pdv'} />}
        {resolvedTab === 'estoque' && <EstoqueHub initialSubTab={activeAdminTab === 'despesas' ? 'gastos' : 'produtos'} />}
        {resolvedTab === 'clientes' && <ClientesManager />}
        {resolvedTab === 'config' && <BackupSettings />}
      </main>
    </div>
  );
};
