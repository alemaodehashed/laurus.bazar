import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { exportDataAsJSON } from '../../utils/storage';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  ShieldAlert,
  Save,
  Key,
  Store,
  Phone,
  Check
} from 'lucide-react';

export const BackupSettings = () => {
  const { data, settings, updateSettings, resetToInitialData, loadSpreadsheetData, importBackupData, showToast, isCloudConnected } = useStore();

  const currentPassword = localStorage.getItem('bazar_admin_password') || settings.adminPassword || '1234';

  const [formSettings, setFormSettings] = useState({
    storeName: settings.storeName || '',
    storeSubtitle: settings.storeSubtitle || '',
    whatsapp: settings.whatsapp || '',
    adminPassword: currentPassword,
  });

  useEffect(() => {
    const pwd = localStorage.getItem('bazar_admin_password') || settings.adminPassword || '1234';
    setFormSettings((prev) => ({
      ...prev,
      storeName: settings.storeName || prev.storeName,
      storeSubtitle: settings.storeSubtitle || prev.storeSubtitle,
      whatsapp: settings.whatsapp || prev.whatsapp,
      adminPassword: pwd,
    }));
  }, [settings]);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings(formSettings);
  };

  const handleExportBackup = () => {
    exportDataAsJSON(data);
    showToast('Backup exportado com sucesso! Guarde o arquivo em local seguro.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (window.confirm('Tem certeza que deseja restaurar este backup? Todos os dados atuais serão substituídos pelos do arquivo.')) {
          importBackupData(json);
        }
      } catch (err) {
        alert('Erro ao ler arquivo JSON. Verifique se é um arquivo de backup válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset input
  };

  const handleResetDemo = () => {
    if (window.confirm('Atenção: deseja realmente restaurar os dados de demonstração iniciais?')) {
      resetToInitialData();
    }
  };

  return (
    <div>
      <div className="admin-section-header">
        <div className="admin-section-title">
          <h2>Configurações & Backup do Sistema</h2>
          <p>Personalize os dados da sua loja, altere senhas e salve cópias de segurança dos seus dados</p>
        </div>
      </div>

      {/* Cloud Status Banner */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          background: isCloudConnected ? '#ecfdf5' : '#fffbeb',
          borderLeft: `5px solid ${isCloudConnected ? '#10b981' : '#f59e0b'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.98rem', color: isCloudConnected ? '#065f46' : '#92400e' }}>
            {isCloudConnected
              ? '🟢 Banco de Dados na Nuvem Conectado (Supabase)'
              : '🟡 Armazenamento Local Ativo (Nenhum banco de dados configurado)'}
          </div>
          <p style={{ fontSize: '0.82rem', color: isCloudConnected ? '#047857' : '#78350f', marginTop: '2px' }}>
            {isCloudConnected
              ? 'Seus produtos, vendas e fiados sincronizam em tempo real entre o celular e computador.'
              : 'Seus dados estão salvos no navegador. Para sincronizar entre celulares da família, configure as variáveis do Supabase na Vercel.'}
          </p>
        </div>
        <span className={`badge ${isCloudConnected ? 'badge-success' : 'badge-warning'}`}>
          {isCloudConnected ? 'Nuvem Ativa' : 'Modo Offline'}
        </span>
      </div>

      <div className="admin-two-cols">
        {/* Store Settings Form */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Store size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Dados do Bazar & Loja</h3>
          </div>

          <form onSubmit={handleSaveSettings}>
            <div className="form-group">
              <label className="form-label">Nome da Loja / Bazar:</label>
              <input
                type="text"
                className="form-control"
                value={formSettings.storeName}
                onChange={(e) => setFormSettings({ ...formSettings, storeName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slogan / Subtítulo:</label>
              <input
                type="text"
                className="form-control"
                value={formSettings.storeSubtitle}
                onChange={(e) => setFormSettings({ ...formSettings, storeSubtitle: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">WhatsApp de Atendimento da Família:</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ex: 5511999998888 (com DDD)"
                value={formSettings.whatsapp}
                onChange={(e) => setFormSettings({ ...formSettings, whatsapp: e.target.value })}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-muted)', marginTop: '4px' }}>
                Os pedidos dos clientes na vitrine serão enviados diretamente para este número.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Senha de Acesso ao Painel:</label>
              <input
                type="text"
                className="form-control"
                value={formSettings.adminPassword}
                onChange={(e) => setFormSettings({ ...formSettings, adminPassword: e.target.value })}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-secondary-muted)', marginTop: '4px' }}>
                A senha padrão atual é 1234. Altere caso deseje mais privacidade.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Save size={16} />
              Salvar Alterações
            </button>
          </form>
        </div>

        {/* Backup & Data Safety */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Download size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.15rem' }}>Backup & Segurança dos Dados</h3>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--color-secondary-muted)', lineHeight: '1.5', marginBottom: '20px' }}>
            Seus produtos, vendas, clientes, histórico de fiado e finanças ficam salvos com segurança diretamente no seu navegador. Você pode baixar um arquivo de backup a qualquer momento para guardar em seu computador ou celular.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Real Spreadsheet Sync */}
            <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#065f46' }}>📊 Carregar Planilhas Reais</strong>
                <div style={{ fontSize: '0.78rem', color: '#047857' }}>
                  Carrega instantaneamente seus 42 perfumes importados, 27 clientes e todos os fiados reais da planilha.
                </div>
              </div>

              <button
                type="button"
                className="btn btn-success btn-sm"
                onClick={() => {
                  if (window.confirm('Deseja carregar e sincronizar todos os 42 perfumes, 27 clientes e fiados reais da sua planilha?')) {
                    loadSpreadsheetData();
                  }
                }}
              >
                <RefreshCw size={15} />
                Sincronizar Planilha Real
              </button>
            </div>

            {/* Export */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.92rem' }}>Exportar Cópia de Segurança</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-secondary-muted)' }}>
                  Baixa um arquivo .json com todos os produtos, vendas e fiados atuais.
                </div>
              </div>

              <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportBackup}>
                <Download size={15} />
                Baixar Backup
              </button>
            </div>

            {/* Import */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ fontSize: '0.92rem' }}>Restaurar Backup</strong>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-secondary-muted)' }}>
                  Carrega os dados de um arquivo .json baixado anteriormente.
                </div>
              </div>

              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={15} />
                Importar Arquivo
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            {/* Reset to Demo */}
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div>
                <strong style={{ fontSize: '0.92rem', color: '#9f1239' }}>Restaurar Demonstração</strong>
                <div style={{ fontSize: '0.78rem', color: '#be123c' }}>
                  Volta os produtos, clientes e vendas aos valores iniciais de exemplo.
                </div>
              </div>

              <button type="button" className="btn btn-danger btn-sm" onClick={handleResetDemo}>
                <RefreshCw size={15} />
                Restaurar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
