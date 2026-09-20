import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Wallet,
  Plus,
  Home,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Trash2,
  X,
  PieChart,
  Calendar,
  CheckCircle2
} from 'lucide-react';

export const FinanceiroPessoal = () => {
  const { personalFinance, addFinanceRecord, deleteFinanceRecord, sales } = useStore();
  const [filterType, setFilterType] = useState('todos'); // todos, despesa_casa, retirada_loja, despesa_loja
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'despesa_casa',
    category: 'Supermercado',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const categoriesCasa = [
    'Supermercado',
    'Contas (Luz/Água/Net)',
    'Aluguel / Condomínio',
    'Saúde & Farmácia',
    'Educação / Filhos',
    'Transporte / Combustível',
    'Lazer & Família',
    'Outras Despesas de Casa',
  ];

  const categoriesLoja = [
    'Compra de Mercadorias',
    'Embalagens & Sacolas',
    'Frete / Transporte',
    'Outros Gastos da Loja',
  ];

  // Totals calculations
  const totalVendasLoja = sales.reduce((acc, s) => acc + s.paidAtSale, 0);

  const totalRetiradasFamilia = personalFinance
    .filter((f) => f.type === 'retirada_loja')
    .reduce((acc, f) => acc + f.amount, 0);

  const totalDespesasCasa = personalFinance
    .filter((f) => f.type === 'despesa_casa')
    .reduce((acc, f) => acc + f.amount, 0);

  const totalDespesasLoja = personalFinance
    .filter((f) => f.type === 'despesa_loja')
    .reduce((acc, f) => acc + f.amount, 0);

  // Remaining family cash: Retiradas - Despesas da casa
  const saldoFamilia = totalRetiradasFamilia - totalDespesasCasa;

  // Percentage of household costs covered by store withdrawals
  const coberturaContas = totalDespesasCasa > 0
    ? Math.min(100, Math.round((totalRetiradasFamilia / totalDespesasCasa) * 100))
    : 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    addFinanceRecord(formData);
    setFormData({
      type: 'despesa_casa',
      category: 'Supermercado',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(false);
  };

  const filteredRecords = personalFinance.filter((f) => {
    if (filterType === 'todos') return true;
    return f.type === filterType;
  });

  return (
    <div>
      <div className="admin-section-header">
        <div className="admin-section-title">
          <h2>Finanças Pessoais & da Família</h2>
          <p>Mantenha as contas de casa separadas do caixa da loja e veja o quanto o bazar ajuda na renda familiar</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Lançar Entrada / Despesa
        </button>
      </div>

      {/* Main Household Balance Banner */}
      <div className="finance-balance-banner">
        <div>
          <div style={{ fontSize: '0.85rem', color: '#e0e7ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Balanço Familiar do Mês
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>
            {formatCurrency(saldoFamilia)}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#c7d2fe', marginTop: '4px' }}>
            {saldoFamilia >= 0 ? '✓ Finanças da casa com saldo positivo' : '⚠️ Despesas da casa superaram as retiradas'}
          </div>
        </div>

        <div className="finance-breakdown">
          <div className="breakdown-item">
            <span className="breakdown-label">Retiradas da Loja (Pró-labore):</span>
            <span className="breakdown-val" style={{ color: '#34d399' }}>
              +{formatCurrency(totalRetiradasFamilia)}
            </span>
          </div>

          <div className="breakdown-item">
            <span className="breakdown-label">Despesas da Casa:</span>
            <span className="breakdown-val" style={{ color: '#fca5a5' }}>
              -{formatCurrency(totalDespesasCasa)}
            </span>
          </div>

          <div className="breakdown-item">
            <span className="breakdown-label">Cobertura dos Custos de Casa:</span>
            <span className="breakdown-val" style={{ color: '#fde047' }}>
              {coberturaContas}%
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card card-purple">
          <div className="metric-info">
            <h4>Contas da Casa Pagas</h4>
            <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
              {formatCurrency(totalDespesasCasa)}
            </div>
            <div className="metric-sub">Supermercado, água, luz, etc.</div>
          </div>
          <div className="metric-icon-box">
            <Home size={22} />
          </div>
        </div>

        <div className="metric-card card-success">
          <div className="metric-info">
            <h4>Retiradas / Pró-Labore</h4>
            <div className="metric-value" style={{ color: 'var(--color-success)' }}>
              {formatCurrency(totalRetiradasFamilia)}
            </div>
            <div className="metric-sub">Lucro do bazar transferido para casa</div>
          </div>
          <div className="metric-icon-box">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="metric-card card-primary">
          <div className="metric-info">
            <h4>Despesas da Loja</h4>
            <div className="metric-value">
              {formatCurrency(totalDespesasLoja)}
            </div>
            <div className="metric-sub">Sacolas, embalagens e fretes</div>
          </div>
          <div className="metric-icon-box">
            <ShoppingBag size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className={`btn btn-sm ${filterType === 'todos' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilterType('todos')}
          >
            Todos os Lançamentos
          </button>
          <button
            className={`btn btn-sm ${filterType === 'despesa_casa' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilterType('despesa_casa')}
          >
            🏠 Despesas da Casa
          </button>
          <button
            className={`btn btn-sm ${filterType === 'retirada_loja' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilterType('retirada_loja')}
          >
            💰 Retiradas do Bazar
          </button>
          <button
            className={`btn btn-sm ${filterType === 'despesa_loja' ? 'btn-secondary' : 'btn-outline'}`}
            onClick={() => setFilterType('despesa_loja')}
          >
            🛍️ Custos Operacionais da Loja
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary-muted)' }}>
                    Nenhum lançamento registrado neste filtro.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  return (
                    <tr key={item.id}>
                      <td style={{ color: '#475569' }}>
                        {formatDate(item.date)}
                      </td>

                      <td>
                        {item.type === 'despesa_casa' && (
                          <span className="badge badge-danger">Despesa da Casa</span>
                        )}
                        {item.type === 'retirada_loja' && (
                          <span className="badge badge-success">Retirada da Loja</span>
                        )}
                        {item.type === 'despesa_loja' && (
                          <span className="badge badge-warning">Custo da Loja</span>
                        )}
                      </td>

                      <td>
                        <strong>{item.category}</strong>
                      </td>

                      <td>{item.description}</td>

                      <td>
                        <strong
                          style={{
                            fontSize: '0.95rem',
                            color: item.type === 'retirada_loja' ? 'var(--color-success)' : 'var(--color-danger)',
                          }}
                        >
                          {item.type === 'retirada_loja' ? '+' : '-'} {formatCurrency(item.amount)}
                        </strong>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => {
                            if (window.confirm('Excluir este lançamento financeiro?')) {
                              deleteFinanceRecord(item.id);
                            }
                          }}
                          title="Excluir lançamento"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Finance Record Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>Novo Lançamento Financeiro</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Tipo de Lançamento:</label>
                  <select
                    className="form-control"
                    value={formData.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      setFormData({
                        ...formData,
                        type: t,
                        category: t === 'despesa_casa' ? 'Supermercado' : t === 'retirada_loja' ? 'Pró-Labore / Retirada' : 'Compra de Mercadorias',
                      });
                    }}
                  >
                    <option value="despesa_casa">🏠 Despesa Pessoal / da Casa (Saída de Casa)</option>
                    <option value="retirada_loja">💰 Retirada da Loja / Pró-labore (Entrada em Casa)</option>
                    <option value="despesa_loja">🛍️ Custo Operacional da Loja (Embalagens, Frete)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Categoria:</label>
                  {formData.type === 'despesa_casa' ? (
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categoriesCasa.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : formData.type === 'despesa_loja' ? (
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categoriesLoja.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      value={formData.category}
                      readOnly
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição / Observação:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Mercado semanal, Conta de Luz da casa, Sacolas..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Valor (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
