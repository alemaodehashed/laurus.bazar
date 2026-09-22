import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  TrendingDown,
  PlusCircle,
  Trash2,
  Tag,
  ShoppingBag,
  Calendar,
  X,
  Search,
  Package,
  Megaphone,
  Globe,
  Truck,
  Lightbulb,
  Armchair,
  Receipt
} from 'lucide-react';
import { PeriodFilterBar, isDateInPeriod, getPeriodLabel } from './PeriodFilterBar';

export const STORE_EXPENSE_CATEGORIES = [
  { id: 'estrutura', label: 'Estrutura & Móveis (Araras, Manequins, Cabides)', icon: Armchair },
  { id: 'embalagens', label: 'Embalagens & Adesivos (Sacolas, Etiquetas, Fitas)', icon: Package },
  { id: 'marketing', label: 'Marketing & Divulgação (Anúncios, Fotos, Panfletos)', icon: Megaphone },
  { id: 'tecnologia', label: 'Domínio, Site & Softwares', icon: Globe },
  { id: 'frete', label: 'Fretes & Logística (Entregas, Motoboy, Correios)', icon: Truck },
  { id: 'estoque', label: 'Mercadorias & Reposição de Estoque', icon: ShoppingBag },
  { id: 'operacional', label: 'Custos Operacionais (Luz da loja, Internet, Maquininha)', icon: Lightbulb },
  { id: 'outros', label: 'Outros Gastos da Loja', icon: Tag },
];

export const QUICK_EXPENSE_SUGGESTIONS = [
  { name: 'Arara de Roupas', category: 'Estrutura & Móveis (Araras, Manequins, Cabides)' },
  { name: 'Manequim', category: 'Estrutura & Móveis (Araras, Manequins, Cabides)' },
  { name: 'Adesivos com Logo', category: 'Embalagens & Adesivos (Sacolas, Etiquetas, Fitas)' },
  { name: 'Sacolas Personalizadas', category: 'Embalagens & Adesivos (Sacolas, Etiquetas, Fitas)' },
  { name: 'Domínio do Site (.com.br)', category: 'Domínio, Site & Softwares' },
  { name: 'Anúncios no Instagram/Facebook', category: 'Marketing & Divulgação (Anúncios, Fotos, Panfletos)' },
  { name: 'Cabides para a Loja', category: 'Estrutura & Móveis (Araras, Manequins, Cabides)' },
  { name: 'Etiquetas de Preço / Código de Barras', category: 'Embalagens & Adesivos (Sacolas, Etiquetas, Fitas)' },
  { name: 'Frete de Mercadorias', category: 'Fretes & Logística (Entregas, Motoboy, Correios)' },
];

export const DespesasManager = () => {
  const { personalFinance, addFinanceRecord, deleteFinanceRecord, sales } = useStore();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  const currentSemester = currentMonth < 6 ? 1 : 2;

  const [viewMode, setViewMode] = useState('mes');
  const [selectedDate, setSelectedDate] = useState(now.toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);
  const [selectedSemester, setSelectedSemester] = useState(currentSemester);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const availableYears = Array.from(
    new Set([
      currentYear - 1,
      currentYear,
      currentYear + 1,
      ...(personalFinance || []).map((f) => Number(f.date?.split('-')[0])).filter(Boolean),
      ...sales.map((s) => Number(s.date?.split('-')[0])).filter(Boolean),
    ])
  ).sort((a, b) => b - a);

  const periodState = {
    viewMode,
    selectedDate,
    selectedMonth,
    selectedQuarter,
    selectedSemester,
    selectedYear,
  };

  // Filter store expenses by selected period (only type === 'despesa_loja')
  const storeExpenses = (personalFinance || []).filter(
    (f) => f.type === 'despesa_loja' || !f.type // include despesa_loja
  );

  const periodExpenses = storeExpenses.filter((f) => isDateInPeriod(f.date, periodState));

  // Category and search filters
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: STORE_EXPENSE_CATEGORIES[0].label,
    amount: '',
    date: now.toISOString().split('T')[0],
    notes: '',
  });

  // Calculate Metrics
  const totalDespesasPeriodo = periodExpenses.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalEstrutura = periodExpenses
    .filter((f) => (f.category || '').toLowerCase().includes('estrutura') || (f.category || '').toLowerCase().includes('móve'))
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalEmbalagens = periodExpenses
    .filter((f) => (f.category || '').toLowerCase().includes('embalage') || (f.category || '').toLowerCase().includes('adesivo'))
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalMarketingTech = periodExpenses
    .filter((f) => (f.category || '').toLowerCase().includes('marketing') || (f.category || '').toLowerCase().includes('domínio') || (f.category || '').toLowerCase().includes('site'))
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const totalEstoque = periodExpenses
    .filter((f) => (f.category || '').toLowerCase().includes('estoque') || (f.category || '').toLowerCase().includes('mercadoria'))
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  // Filtered expenses list
  const filteredExpenses = periodExpenses.filter((f) => {
    if (selectedCategoryFilter !== 'todas' && f.category !== selectedCategoryFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = (f.description || '').toLowerCase().includes(q);
      const matchCat = (f.category || '').toLowerCase().includes(q);
      const matchNotes = (f.notes || '').toLowerCase().includes(q);
      if (!matchDesc && !matchCat && !matchNotes) return false;
    }
    return true;
  });

  const handleOpenModal = () => {
    setFormData({
      description: '',
      category: STORE_EXPENSE_CATEGORIES[0].label,
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleApplySuggestion = (sug) => {
    setFormData((prev) => ({
      ...prev,
      description: sug.name,
      category: sug.category,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      alert('Por favor informe a descrição do gasto (ex: Arara de roupas, Adesivos, Domínio)');
      return;
    }
    const parsedAmount = parseFloat(String(formData.amount).replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Por favor informe um valor válido para o gasto');
      return;
    }

    await addFinanceRecord({
      type: 'despesa_loja',
      category: formData.category,
      description: formData.description.trim(),
      amount: parsedAmount,
      date: formData.date || new Date().toISOString().split('T')[0],
      notes: formData.notes?.trim() || '',
    });

    setIsModalOpen(false);
  };

  return (
    <div>
      {/* Section Header */}
      <div className="admin-section-header">
        <div className="admin-section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={24} color="#b91c1c" />
            <h2>Gastos & Despesas da Loja</h2>
          </div>
          <p>Cadastre e controle custos operacionais da loja (araras, manequins, adesivos, embalagens, marketing, domínio, etc.)</p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={handleOpenModal}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700 }}
        >
          <PlusCircle size={18} />
          + Lançar Novo Gasto da Loja
        </button>
      </div>

      {/* Period Filter Bar */}
      <PeriodFilterBar
        viewMode={viewMode}
        setViewMode={setViewMode}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedQuarter={selectedQuarter}
        setSelectedQuarter={setSelectedQuarter}
        selectedSemester={selectedSemester}
        setSelectedSemester={setSelectedSemester}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        availableYears={availableYears}
      />

      {/* Summary Metrics Grid */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        {/* Total Gasto no Período */}
        <div className="metric-card card-danger" style={{ borderLeft: '4px solid #b91c1c', background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)' }}>
          <div className="metric-info">
            <h4 style={{ color: '#991b1b' }}>Total de Gastos ({getPeriodLabel(periodState)})</h4>
            <div className="metric-value" style={{ color: '#b91c1c' }}>
              {formatCurrency(totalDespesasPeriodo)}
            </div>
            <div className="metric-sub" style={{ color: '#991b1b' }}>
              {periodExpenses.length} despesa(s) registrada(s)
            </div>
          </div>
          <div className="metric-icon-box" style={{ background: '#fee2e2', color: '#b91c1c' }}>
            <TrendingDown size={24} />
          </div>
        </div>

        {/* Estrutura & Móveis */}
        <div className="metric-card" style={{ borderLeft: '4px solid #d97706' }}>
          <div className="metric-info">
            <h4>Estrutura & Móveis</h4>
            <div className="metric-value" style={{ color: '#b45309' }}>
              {formatCurrency(totalEstrutura)}
            </div>
            <div className="metric-sub">Araras, manequins, cabides, etc.</div>
          </div>
          <div className="metric-icon-box" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Armchair size={22} />
          </div>
        </div>

        {/* Embalagens & Adesivos */}
        <div className="metric-card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="metric-info">
            <h4>Embalagens & Adesivos</h4>
            <div className="metric-value" style={{ color: '#1d4ed8' }}>
              {formatCurrency(totalEmbalagens)}
            </div>
            <div className="metric-sub">Sacolas, adesivos com logo, fitas</div>
          </div>
          <div className="metric-icon-box" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            <Package size={22} />
          </div>
        </div>

        {/* Marketing & Domínio */}
        <div className="metric-card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div className="metric-info">
            <h4>Marketing & Domínio</h4>
            <div className="metric-value" style={{ color: '#6d28d9' }}>
              {formatCurrency(totalMarketingTech)}
            </div>
            <div className="metric-sub">Anúncios, redes e site laurus</div>
          </div>
          <div className="metric-icon-box" style={{ background: '#ede9fe', color: '#6d28d9' }}>
            <Globe size={22} />
          </div>
        </div>

        {/* Compras de Estoque */}
        <div className="metric-card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
          <div className="metric-info">
            <h4>Mercadorias & Estoque</h4>
            <div className="metric-value" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(totalEstoque)}
            </div>
            <div className="metric-sub">Peças e reposição do bazar</div>
          </div>
          <div className="metric-icon-box" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <ShoppingBag size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Quick Category Filters */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-secondary)', marginRight: '4px' }}>
              Categoria:
            </span>
            <button
              type="button"
              className={`btn btn-sm ${selectedCategoryFilter === 'todas' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setSelectedCategoryFilter('todas')}
            >
              Todas ({periodExpenses.length})
            </button>
            {STORE_EXPENSE_CATEGORIES.map((cat) => {
              const count = periodExpenses.filter((f) => f.category === cat.label).length;
              if (count === 0 && selectedCategoryFilter !== cat.label) return null;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`btn btn-sm ${selectedCategoryFilter === cat.label ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={() => setSelectedCategoryFilter(cat.label)}
                >
                  {cat.label.split('(')[0].trim()} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar gasto (arara, adesivo, etc)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', paddingBottom: '7px', paddingTop: '7px' }}
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição do Gasto</th>
                <th>Categoria</th>
                <th>Valor Gasto</th>
                <th>Observações</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary-muted)' }}>
                    Nenhum gasto registrado para <strong>{getPeriodLabel(periodState)}</strong>.
                    <div style={{ marginTop: '10px' }}>
                      <button type="button" className="btn btn-outline btn-sm" onClick={handleOpenModal}>
                        <PlusCircle size={14} /> Cadastrar primeiro gasto
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    {/* Date */}
                    <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                        <Calendar size={14} color="var(--color-taupe)" />
                        <span>{formatDate(exp.date)}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td style={{ verticalAlign: 'middle' }}>
                      <strong style={{ color: 'var(--color-secondary)', fontSize: '0.92rem' }}>
                        {exp.description}
                      </strong>
                    </td>

                    {/* Category */}
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="badge badge-secondary" style={{ fontSize: '0.78rem' }}>
                        {exp.category}
                      </span>
                    </td>

                    {/* Amount */}
                    <td style={{ verticalAlign: 'middle' }}>
                      <strong style={{ color: '#b91c1c', fontSize: '1rem' }}>
                        -{formatCurrency(exp.amount)}
                      </strong>
                    </td>

                    {/* Notes */}
                    <td style={{ verticalAlign: 'middle', maxWidth: '240px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--color-taupe)' }}>
                        {exp.notes || '—'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px', borderColor: '#fca5a5', color: '#e11d48' }}
                        onClick={() => {
                          if (window.confirm(`Excluir o gasto "${exp.description}" no valor de ${formatCurrency(exp.amount)}?`)) {
                            deleteFinanceRecord(exp.id);
                          }
                        }}
                        title="Excluir este lançamento de gasto"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Novo Gasto da Loja */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingDown size={20} color="#b91c1c" />
                <h3>Lançar Gasto da Loja</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Quick Suggestions Chips */}
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-taupe)', display: 'block', marginBottom: '6px' }}>
                    💡 Sugestões Rápidas de Gastos (clique para preencher):
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {QUICK_EXPENSE_SUGGESTIONS.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.72rem', padding: '3px 8px', borderColor: 'var(--color-accent)' }}
                        onClick={() => handleApplySuggestion(sug)}
                      >
                        + {sug.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Descrição do Gasto / Compra:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Arara de chão, 100 adesivos, Domínio .com.br, Manequim..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                {/* Category */}
                <div className="form-group">
                  <label className="form-label">Categoria do Gasto:</label>
                  <select
                    className="form-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    {STORE_EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.label}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount and Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Valor Pago (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      placeholder="0,00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      style={{ fontSize: '1.05rem', fontWeight: 700 }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Data do Pagamento:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Observações / Fornecedor (opcional):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Comprado no Mercado Livre, Pago via PIX..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div style={{ background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '10px 12px', fontSize: '0.78rem', color: '#92400e' }}>
                  💰 <strong>Impacto no Caixa:</strong> Este valor é debitado automaticamente do <em>Saldo em Caixa</em> da loja no período correspondente.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <PlusCircle size={16} /> Salvar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
