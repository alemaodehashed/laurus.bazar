import React from 'react';
import { useStore } from '../../context/StoreContext';
import { DashboardOverview } from './DashboardOverview';
import { EstoqueManager } from './EstoqueManager';
import { PdvVendas } from './PdvVendas';
import { FiadoManager } from './FiadoManager';
import { ClientesManager } from './ClientesManager';
import { DespesasManager } from './DespesasManager';
import { BackupSettings } from './BackupSettings';
import {
  LayoutDashboard,
  ShoppingBag,
  ShoppingCart,
  Receipt,
  TrendingDown,
  Users,
  Settings,
  LogOut,
  ExternalLink,
  Store
} from 'lucide-react';

export const AdminPage = ({ onGoToVitrine }) => {
  const { settings, logoutAdmin, activeAdminTab, setActiveAdminTab, sales } = useStore();

  // Count pending installments for badge
  const pendingFiadoCount = sales.reduce((acc, sale) => {
    if (sale.paymentMethod === 'boca_2x' && sale.installments) {
      return acc + sale.installments.filter((i) => !i.paid).length;
    }
    return acc;
  }, 0);

  const tabs = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'estoque', label: 'Estoque & Produtos', icon: ShoppingBag },
    { id: 'vendas', label: 'Caixa & Vendas (PDV)', icon: ShoppingCart },
    { id: 'fiado', label: 'Vendas no Geral', icon: Receipt, badge: pendingFiadoCount },
    { id: 'despesas', label: 'Gastos da Loja', icon: TrendingDown },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'config', label: 'Configurações', icon: Settings },
  ];

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

      {/* Navigation Tabs */}
      <nav className="admin-tabs-bar">
        <div className="admin-tabs-container">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeAdminTab === tab.id;
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
        {activeAdminTab === 'dashboard' && <DashboardOverview />}
        {activeAdminTab === 'estoque' && <EstoqueManager />}
        {activeAdminTab === 'vendas' && <PdvVendas />}
        {activeAdminTab === 'fiado' && <FiadoManager />}
        {activeAdminTab === 'despesas' && <DespesasManager />}
        {activeAdminTab === 'clientes' && <ClientesManager />}
        {activeAdminTab === 'config' && <BackupSettings />}
      </main>
    </div>
  );
};
