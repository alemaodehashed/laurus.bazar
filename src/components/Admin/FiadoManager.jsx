import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../../utils/formatters';
import {
  Receipt,
  Banknote,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Search,
  Check,
  Send,
  Calendar,
  X,
  User,
  Trash2,
  Edit2,
  Filter,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  DollarSign
} from 'lucide-react';

import { PeriodFilterBar, isDateInPeriod, getPeriodLabel, MONTHS } from './PeriodFilterBar';

export const FiadoManager = () => {
  const { sales, payInstallment, updateInstallmentDueDate, deleteSale, customers, settings } = useStore();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  const currentSemester = currentMonth < 6 ? 1 : 2;

  // Find latest sale or installment date to initialize period
  const getInitialPeriod = () => {
    if (sales && sales.length > 0) {
      const sorted = [...sales].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (sorted[0]?.date) {
        const [y, m] = sorted[0].date.split('T')[0].split('-').map(Number);
        if (y && m) {
          return {
            year: y,
            month: m - 1,
            date: sorted[0].date.split('T')[0],
            quarter: Math.floor((m - 1) / 3) + 1,
            semester: m <= 6 ? 1 : 2,
          };
        }
      }
    }
    return {
      year: currentYear,
      month: currentMonth,
      date: now.toISOString().split('T')[0],
      quarter: currentQuarter,
      semester: currentSemester,
    };
  };

  const initialPeriod = getInitialPeriod();
  const [viewMode, setViewMode] = useState('mes'); // 'mes', 'data', 'trimestre', 'semestre', 'ano', 'todos'
  const [selectedDate, setSelectedDate] = useState(initialPeriod.date);
  const [selectedMonth, setSelectedMonth] = useState(initialPeriod.month);
  const [selectedQuarter, setSelectedQuarter] = useState(initialPeriod.quarter);
  const [selectedSemester, setSelectedSemester] = useState(initialPeriod.semester);
  const [selectedYear, setSelectedYear] = useState(initialPeriod.year);

  // Main navigation tab: 'parcelas' (focus on receivables) or 'vendas' (full sales history)
  const [mainTab, setMainTab] = useState('parcelas');

  const today = new Date().toISOString().split('T')[0];

  // Flatten all installments across the whole store
  const storeInstallments = [];
  sales.forEach((sale) => {
    if (sale.paymentMethod === 'boca_2x' && sale.installments) {
      sale.installments.forEach((inst) => {
        const isOverdue = !inst.paid && inst.dueDate < today;
        const isDueToday = !inst.paid && inst.dueDate === today;

        storeInstallments.push({
          ...inst,
          saleId: sale.id,
          saleDate: sale.date,
          customerId: sale.customerId,
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          items: sale.items || [],
          totalSale: sale.total,
          totalInstallments: sale.installments.length,
          isOverdue,
          isDueToday,
        });
      });
    }
  });

  const availableYears = Array.from(
    new Set([
      currentYear - 1,
      currentYear,
      currentYear + 1,
      currentYear + 2,
      ...sales.map((s) => Number(s.date?.split('-')[0])).filter(Boolean),
      ...storeInstallments.map((i) => Number(i.dueDate?.split('-')[0])).filter(Boolean),
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

  // 1. Installments with dueDate in the selected period
  const periodDueInstallments = storeInstallments.filter((inst) =>
    isDateInPeriod(inst.dueDate, periodState)
  );

  const totalAReceberPeriodo = periodDueInstallments
    .filter((inst) => !inst.paid)
    .reduce((acc, inst) => acc + (Number(inst.amount) || 0), 0);

  const countAReceberPeriodo = periodDueInstallments.filter((inst) => !inst.paid).length;

  const totalRecebidoFiadoPeriodo = storeInstallments
    .filter((inst) => inst.paid && isDateInPeriod(inst.paidDate || inst.dueDate, periodState))
    .reduce((acc, inst) => acc + (Number(inst.amount) || 0), 0);

  const countRecebidoFiadoPeriodo = storeInstallments
    .filter((inst) => inst.paid && isDateInPeriod(inst.paidDate || inst.dueDate, periodState)).length;

  // Global store pending fiados
  const totalGeralAReceber = storeInstallments
    .filter((inst) => !inst.paid)
    .reduce((acc, inst) => acc + (Number(inst.amount) || 0), 0);

  const countGeralAReceber = storeInstallments.filter((inst) => !inst.paid).length;
  const countGeralAtrasadas = storeInstallments.filter((inst) => inst.isOverdue).length;
  const overdueCountInPeriod = periodDueInstallments.filter((inst) => inst.isOverdue).length;

  // 2. Sales made in selected period (by sale.date)
  const periodSales = sales.filter((s) => isDateInPeriod(s.date, periodState));
  const totalSalesAmount = periodSales.reduce((acc, s) => acc + s.total, 0);
  const totalAVistaCartao = periodSales
    .filter((s) => s.paymentMethod !== 'boca_2x')
    .reduce((acc, s) => acc + s.total, 0);

  const countAVista = periodSales.filter((s) => s.paymentMethod === 'a_vista').length;
  const countCartao = periodSales.filter((s) => s.paymentMethod === 'cartao').length;
  const countFiado = periodSales.filter((s) => s.paymentMethod === 'boca_2x').length;

  // 3. Monthly forecast for selectedYear ("mês tal a receber X")
  const monthlyForecast = MONTHS.map((m) => {
    const monthPeriod = {
      viewMode: 'mes',
      selectedYear: selectedYear,
      selectedMonth: m.value,
    };
    const instInMonth = storeInstallments.filter((inst) => isDateInPeriod(inst.dueDate, monthPeriod));
    const pendingAmount = instInMonth
      .filter((i) => !i.paid)
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const paidAmount = instInMonth
      .filter((i) => i.paid)
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const pendingCount = instInMonth.filter((i) => !i.paid).length;
    const paidCount = instInMonth.filter((i) => i.paid).length;
    const overdueMonthCount = instInMonth.filter((i) => i.isOverdue).length;

    return {
      monthIndex: m.value,
      monthLabel: m.label,
      pendingAmount,
      paidAmount,
      pendingCount,
      paidCount,
      overdueCount: overdueMonthCount,
      totalExpected: pendingAmount + paidAmount,
      isSelected: viewMode === 'mes' && selectedMonth === m.value,
    };
  });

  const totalAnoAReceber = monthlyForecast.reduce((acc, m) => acc + m.pendingAmount, 0);
  const totalAnoRecebido = monthlyForecast.reduce((acc, m) => acc + m.paidAmount, 0);

  const semesterMonths = selectedSemester === 1 ? [0, 1, 2, 3, 4, 5] : [6, 7, 8, 9, 10, 11];
  const totalSemestreAReceber = monthlyForecast
    .filter((m) => semesterMonths.includes(m.monthIndex))
    .reduce((acc, m) => acc + m.pendingAmount, 0);

  // Filters for the tables
  const [filterPayment, setFilterPayment] = useState('todas'); // todas, a_vista, cartao, boca_2x
  const [filterFiadoStatus, setFilterFiadoStatus] = useState('todos'); // todos, pendente, vencido, pago
  const [filterInstallmentStatus, setFilterInstallmentStatus] = useState('pendente'); // pendente, vencido, pago, todos
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedForReminder, setSelectedForReminder] = useState(null);
  const [reminderPhone, setReminderPhone] = useState('');
  const [editingDueDateItem, setEditingDueDateItem] = useState(null);
  const [newDueDateValue, setNewDueDateValue] = useState('');
  const [customPixKey, setCustomPixKey] = useState(settings.whatsapp);

  // Accordion state for expandable installments per row in sales history
  const [expandedSales, setExpandedSales] = useState({});
  const toggleExpandSale = (saleId) => {
    setExpandedSales((prev) => ({
      ...prev,
      [saleId]: !prev[saleId]
    }));
  };

  // Filtered Installments
  const filteredInstallments = periodDueInstallments.filter((inst) => {
    if (filterInstallmentStatus === 'pendente' && inst.paid) return false;
    if (filterInstallmentStatus === 'vencido' && (!inst.isOverdue || inst.paid)) return false;
    if (filterInstallmentStatus === 'pago' && !inst.paid) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesCustomer = (inst.customerName || '').toLowerCase().includes(q);
      const matchesPhone = (inst.customerPhone || '').includes(q);
      const matchesItem = inst.items && inst.items.some((it) => (it.name || '').toLowerCase().includes(q));
      if (!matchesCustomer && !matchesPhone && !matchesItem) return false;
    }

    return true;
  });

  // Filtered Sales within period
  const filteredSales = periodSales.filter((sale) => {
    if (filterPayment !== 'todas' && sale.paymentMethod !== filterPayment) {
      return false;
    }

    if (sale.paymentMethod === 'boca_2x' && filterFiadoStatus !== 'todos') {
      const hasUnpaid = sale.installments && sale.installments.some((i) => !i.paid);
      const isFullyPaid = sale.installments && sale.installments.length > 0 && sale.installments.every((i) => i.paid);
      const hasOverdue = sale.installments && sale.installments.some((i) => !i.paid && i.dueDate < today);

      if (filterFiadoStatus === 'pendente' && !hasUnpaid) return false;
      if (filterFiadoStatus === 'vencido' && !hasOverdue) return false;
      if (filterFiadoStatus === 'pago' && !isFullyPaid) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesCustomer = (sale.customerName || '').toLowerCase().includes(q);
      const matchesPhone = (sale.customerPhone || '').includes(q);
      const matchesItem = sale.items && sale.items.some((it) => (it.name || '').toLowerCase().includes(q));
      if (!matchesCustomer && !matchesPhone && !matchesItem) return false;
    }

    return true;
  });

  // Build Friendly WhatsApp reminder / cobrança for installment
  const buildReminderMessage = (item) => {
    const itemsList = (item.items && item.items.length > 0)
      ? item.items.map((it) => `• ${it.quantity}x ${it.name}${it.size ? ` (${it.size})` : ''} - ${formatCurrency(it.unitPrice)}`).join('\n')
      : '• Compra na loja';

    const statusText = item.isOverdue
      ? `🚨 *Status:* Vencida em ${formatDate(item.dueDate)}`
      : `📅 *Vencimento:* ${formatDate(item.dueDate)}`;

    const totalInfo = item.totalInstallments > 1
      ? `*${item.number}ª parcela* (de ${item.totalInstallments}x)`
      : `*Parcela única*`;

    return `Olá, *${item.customerName || 'Cliente'}*! Tudo bem? 😊\n\nPassando com carinho pelo *${settings.storeName || 'Laurus'}* para enviar o lembrete da sua compra:\n\n🛍️ *Produto(s):*\n${itemsList}\n\n💳 *Detalhes da Parcela:*\n• ${totalInfo}\n• *Valor a Pagar:* ${formatCurrency(item.amount)}\n• ${statusText}\n\n👉 *Chave PIX para pagamento:*\n*${customPixKey || settings.whatsapp}*\n\nQualquer dúvida ou comprovante, basta responder por aqui. Agradecemos pela preferência! 💛`;
  };

  const handleOpenReminder = (item) => {
    setSelectedForReminder(item);
    setReminderPhone(item.customerPhone || '');
  };

  const handleSendReminder = () => {
    if (!selectedForReminder) return;
    const cleanPhone = (reminderPhone || selectedForReminder.customerPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      alert('Por favor, informe o WhatsApp do cliente com DDD (ex: 11999998888)!');
      return;
    }
    const msg = buildReminderMessage(selectedForReminder);
    const url = generateWhatsAppLink(cleanPhone, msg);
    window.open(url, '_blank');
    setSelectedForReminder(null);
  };

  return (
    <div>
      {/* Section Header */}
      <div className="admin-section-header">
        <div className="admin-section-title">
          <h2>Vendas no Geral & Histórico de Parcelas</h2>
          <p>Acompanhe parcelas a receber no mês, previsões por semestre e ano, e todo o histórico de vendas</p>
        </div>
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
        {/* Total Vendido no Período */}
        <div className="metric-card card-primary">
          <div className="metric-info">
            <h4>Total Vendido ({getPeriodLabel(periodState)})</h4>
            <div className="metric-value" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(totalSalesAmount)}
            </div>
            <div className="metric-sub">{periodSales.length} compras no período</div>
          </div>
          <div className="metric-icon-box">
            <Receipt size={24} />
          </div>
        </div>

        {/* Recebido à Vista e Cartão */}
        <div className="metric-card card-success">
          <div className="metric-info">
            <h4>À Vista & Cartão (No Ato)</h4>
            <div className="metric-value" style={{ color: 'var(--color-success)' }}>
              {formatCurrency(totalAVistaCartao)}
            </div>
            <div className="metric-sub">{countAVista + countCartao} vendas pagas no ato</div>
          </div>
          <div className="metric-icon-box">
            <Banknote size={24} />
          </div>
        </div>

        {/* A Receber no Período (Vencimento no Mês / Semestre / Ano Selecionado) */}
        <div className="metric-card card-danger" style={{ borderLeft: '4px solid #d97706', background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)' }}>
          <div className="metric-info">
            <h4 style={{ color: '#b45309' }}>A Receber em {getPeriodLabel(periodState)}</h4>
            <div className="metric-value" style={{ color: '#b45309' }}>
              {formatCurrency(totalAReceberPeriodo)}
            </div>
            <div className="metric-sub" style={{ color: '#92400e' }}>
              <strong>{countAReceberPeriodo}</strong> parcela(s) com vencimento no período
            </div>
          </div>
          <div className="metric-icon-box" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Clock size={24} />
          </div>
        </div>

        {/* Total Geral da Loja a Receber */}
        <div className="metric-card" style={{ borderLeft: '4px solid var(--color-primary)', background: 'linear-gradient(135deg, #ffffff 0%, #FAF7EE 100%)' }}>
          <div className="metric-info">
            <h4 style={{ color: 'var(--color-primary)' }}>Total Geral a Receber</h4>
            <div className="metric-value" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(totalGeralAReceber)}
            </div>
            <div className="metric-sub">
              {countGeralAReceber} parcelas no total • {countGeralAtrasadas} em atraso
            </div>
          </div>
          <div className="metric-icon-box" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <DollarSign size={24} />
          </div>
        </div>

        {/* Fiados em Atraso */}
        <div className="metric-card card-warning">
          <div className="metric-info">
            <h4>Fiados em Atraso</h4>
            <div className="metric-value" style={{ color: countGeralAtrasadas > 0 ? '#b91c1c' : '#10b981' }}>
              {countGeralAtrasadas} atrasadas
            </div>
            <div className="metric-sub">
              {overdueCountInPeriod > 0 ? `${overdueCountInPeriod} vencem neste período` : 'Nenhum atraso no período'}
            </div>
          </div>
          <div className="metric-icon-box">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Previsão Mês a Mês ("Mês tal a receber X") */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          padding: '20px',
          background: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 700 }}>
              <Calendar size={18} color="var(--color-accent)" />
              Previsão de Recebimento por Mês — Ano {selectedYear}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-secondary-muted)', margin: '4px 0 0 0' }}>
              Clique em qualquer mês para abrir as parcelas com vencimento nele
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {viewMode === 'semestre' && (
              <span className="badge" style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.78rem', padding: '5px 10px' }}>
                {selectedSemester}º Semestre a Receber: <strong>{formatCurrency(totalSemestreAReceber)}</strong>
              </span>
            )}
            <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontSize: '0.78rem', padding: '5px 10px' }}>
              Total Ano {selectedYear} a Receber: <strong>{formatCurrency(totalAnoAReceber)}</strong>
            </span>
            <span className="badge" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', fontSize: '0.78rem', padding: '5px 10px' }}>
              Total Geral Pendente: <strong>{formatCurrency(totalGeralAReceber)}</strong>
            </span>
          </div>
        </div>

        {/* 12 Months Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {monthlyForecast.map((m) => {
            const isSelected = viewMode === 'mes' && selectedMonth === m.monthIndex;
            const hasPending = m.pendingAmount > 0;
            const isPaid = m.paidAmount > 0 && !hasPending;

            return (
              <button
                key={m.monthIndex}
                type="button"
                onClick={() => {
                  setViewMode('mes');
                  setSelectedMonth(m.monthIndex);
                  setMainTab('parcelas');
                }}
                style={{
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(95, 45, 63, 0.12) 0%, rgba(197, 160, 99, 0.15) 100%)'
                    : hasPending
                    ? '#fff'
                    : '#f8fafc',
                  border: isSelected
                    ? '2px solid var(--color-primary)'
                    : hasPending
                    ? '1px solid #f59e0b'
                    : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 2px 8px rgba(95, 45, 63, 0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--color-primary)' : 'var(--color-secondary)' }}>
                  {m.monthLabel}
                </div>

                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    marginTop: '4px',
                    color: hasPending ? '#b45309' : isPaid ? '#059669' : '#94a3b8',
                  }}
                >
                  {formatCurrency(m.pendingAmount)}
                </div>

                <div style={{ fontSize: '0.7rem', color: hasPending ? '#d97706' : '#94a3b8', marginTop: '2px' }}>
                  {hasPending ? (
                    <span>{m.pendingCount} parc. a receber</span>
                  ) : isPaid ? (
                    <span style={{ color: '#059669' }}>✓ Quitado</span>
                  ) : (
                    <span>Sem parcelas</span>
                  )}
                </div>

                {m.overdueCount > 0 && (
                  <div style={{ fontSize: '0.68rem', color: '#b91c1c', fontWeight: 700, marginTop: '2px' }}>
                    ⚠️ {m.overdueCount} atrasada(s)
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main View Mode Tabs (Toggle) */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${mainTab === 'parcelas' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem' }}
          onClick={() => setMainTab('parcelas')}
        >
          <Clock size={17} />
          Parcelas a Receber ({periodDueInstallments.filter(i => !i.paid).length} no período)
        </button>

        <button
          type="button"
          className={`btn ${mainTab === 'vendas' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem' }}
          onClick={() => setMainTab('vendas')}
        >
          <Receipt size={17} />
          Histórico de Vendas Realizadas ({periodSales.length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Subfilters when in 'parcelas' mode */}
          {mainTab === 'parcelas' ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-secondary)', marginRight: '4px' }}>
                Status:
              </span>
              <button
                type="button"
                className={`btn btn-sm ${filterInstallmentStatus === 'pendente' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setFilterInstallmentStatus('pendente')}
              >
                A Receber / Pendentes ({countAReceberPeriodo})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterInstallmentStatus === 'vencido' ? 'btn-danger' : 'btn-outline'}`}
                onClick={() => setFilterInstallmentStatus('vencido')}
              >
                Vencidas em Atraso ({periodDueInstallments.filter(i => i.isOverdue).length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterInstallmentStatus === 'pago' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setFilterInstallmentStatus('pago')}
              >
                Já Pagas / Quitadas ({periodDueInstallments.filter(i => i.paid).length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterInstallmentStatus === 'todos' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setFilterInstallmentStatus('todos')}
              >
                Todas ({periodDueInstallments.length})
              </button>
            </div>
          ) : (
            /* Subfilters when in 'vendas' mode */
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-secondary)', marginRight: '4px' }}>
                Forma:
              </span>
              <button
                type="button"
                className={`btn btn-sm ${filterPayment === 'todas' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => {
                  setFilterPayment('todas');
                  setFilterFiadoStatus('todos');
                }}
              >
                Todas as Vendas ({periodSales.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterPayment === 'a_vista' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setFilterPayment('a_vista')}
              >
                <Banknote size={14} />
                À Vista ({countAVista})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterPayment === 'cartao' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setFilterPayment('cartao')}
              >
                <CreditCard size={14} />
                Cartão ({countCartao})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${filterPayment === 'boca_2x' ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setFilterPayment('boca_2x')}
              >
                <Clock size={14} />
                Fiado ({countFiado})
              </button>
            </div>
          )}

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por cliente ou produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', paddingBottom: '7px', paddingTop: '7px' }}
            />
          </div>
        </div>

        {/* Extra subfilters for 'vendas' mode */}
        {mainTab === 'vendas' && (filterPayment === 'boca_2x' || filterPayment === 'todas') && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-taupe)', fontWeight: 600 }}>
              Filtro do Fiado:
            </span>
            <button
              type="button"
              className={`btn btn-sm ${filterFiadoStatus === 'todos' ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => setFilterFiadoStatus('todos')}
            >
              Todos os Fiados
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterFiadoStatus === 'pendente' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => setFilterFiadoStatus('pendente')}
            >
              Pendentes a Receber
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterFiadoStatus === 'vencido' ? 'btn-danger' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => setFilterFiadoStatus('vencido')}
            >
              Vencidas em Atraso
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterFiadoStatus === 'pago' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => setFilterFiadoStatus('pago')}
            >
              Quitadas 100%
            </button>

            <button
              type="button"
              className="btn btn-sm btn-outline"
              style={{ fontSize: '0.75rem', padding: '3px 8px', marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={() => {
                const anyOpen = Object.values(expandedSales).some(Boolean);
                if (anyOpen) {
                  setExpandedSales({});
                } else {
                  const all = {};
                  filteredSales.forEach((s) => {
                    if (s.paymentMethod === 'boca_2x') all[s.id] = true;
                  });
                  setExpandedSales(all);
                }
              }}
              title="Expandir ou recolher os detalhes de todas as parcelas de uma vez"
            >
              {Object.values(expandedSales).some(Boolean) ? (
                <>
                  <ChevronUp size={13} /> Recolher Todas as Parcelas
                </>
              ) : (
                <>
                  <ChevronDown size={13} /> Expandir Todas as Parcelas
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: Tab 'parcelas' or Tab 'vendas' */}
      {mainTab === 'parcelas' ? (
        /* TAB 1: PARCELAS A RECEBER NO PERÍODO */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vencimento</th>
                  <th>Cliente</th>
                  <th>Parcela</th>
                  <th>Valor a Receber</th>
                  <th>Compra de Origem</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações de Cobrança / Baixa</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstallments.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary-muted)' }}>
                      🎉 Nenhuma parcela a receber com vencimento em <strong>{getPeriodLabel(periodState)}</strong>.
                    </td>
                  </tr>
                ) : (
                  filteredInstallments.map((inst, index) => {
                    const isOverdue = !inst.paid && inst.dueDate < today;
                    const isDueToday = !inst.paid && inst.dueDate === today;

                    return (
                      <tr key={`${inst.saleId}_${inst.number}_${index}`}>
                        {/* Vencimento */}
                        <td style={{ verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem' }}>
                            <Calendar size={15} color={isOverdue ? 'var(--color-danger)' : isDueToday ? '#d97706' : 'var(--color-primary)'} />
                            <span style={{ color: isOverdue ? 'var(--color-danger)' : isDueToday ? '#d97706' : 'inherit' }}>
                              {formatDate(inst.dueDate)}
                            </span>
                          </div>
                          <div style={{ marginTop: '3px' }}>
                            {inst.paid ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600 }}>
                                ✓ Paga em {formatDate(inst.paidDate || inst.dueDate)}
                              </span>
                            ) : isDueToday ? (
                              <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 700 }}>
                                ⚡ Vence Hoje!
                              </span>
                            ) : isOverdue ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 700 }}>
                                🚨 Vencida em atraso
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-taupe)' }}>
                                📅 A vencer
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Cliente */}
                        <td style={{ verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary)' }}>
                              <User size={16} />
                            </div>
                            <div>
                              <strong style={{ color: 'var(--color-secondary)', fontSize: '0.9rem' }}>{inst.customerName}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-muted)' }}>
                                {inst.customerPhone || 'Sem telefone'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Parcela */}
                        <td style={{ verticalAlign: 'middle' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                            {inst.number}ª Parcela (de {inst.totalInstallments}x)
                          </span>
                        </td>

                        {/* Valor */}
                        <td style={{ verticalAlign: 'middle' }}>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--color-secondary)' }}>
                            {formatCurrency(inst.amount)}
                          </strong>
                        </td>

                        {/* Compra de Origem */}
                        <td style={{ verticalAlign: 'middle', maxWidth: '240px' }}>
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-main)' }}>
                            Venda em <strong>{formatDate(inst.saleDate)}</strong> ({formatCurrency(inst.totalSale)})
                          </div>
                          {inst.items && inst.items.length > 0 && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--color-secondary-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {inst.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ verticalAlign: 'middle' }}>
                          {inst.paid ? (
                            <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                              ✓ Quitado
                            </span>
                          ) : isOverdue ? (
                            <span className="badge badge-danger" style={{ fontSize: '0.78rem' }}>
                              🚨 Em Atraso
                            </span>
                          ) : (
                            <span className="badge badge-secondary" style={{ fontSize: '0.78rem' }}>
                              ⏳ Pendente
                            </span>
                          )}
                        </td>

                        {/* Ações */}
                        <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {inst.paid ? (
                              <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.8rem' }}>
                                ✓ Quitado
                              </span>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm"
                                  style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => {
                                    if (window.confirm(`Confirmar o recebimento da ${inst.number}ª parcela (${formatCurrency(inst.amount)}) de ${inst.customerName}?`)) {
                                      payInstallment(inst.saleId, inst.number);
                                    }
                                  }}
                                  title="Confirmar que o cliente pagou esta parcela"
                                >
                                  <Check size={13} /> Receber
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-outline btn-sm"
                                  style={{ padding: '5px 8px', fontSize: '0.78rem', borderColor: 'var(--color-accent)' }}
                                  onClick={() => {
                                    setEditingDueDateItem(inst);
                                    setNewDueDateValue(inst.dueDate);
                                  }}
                                  title="Alterar a data de vencimento desta parcela"
                                >
                                  <Edit2 size={13} />
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-whatsapp btn-sm"
                                  style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  onClick={() => handleOpenReminder(inst)}
                                  title="Enviar mensagem de cobrança amigável no WhatsApp"
                                >
                                  <MessageCircle size={13} /> Cobrar
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '5px 8px', fontSize: '0.78rem', borderColor: '#fca5a5', color: '#e11d48' }}
                              onClick={() => {
                                if (window.confirm(`Deseja excluir a venda de ${inst.customerName} (${formatCurrency(inst.totalSale)})? O estoque dos produtos será devolvido e todas as parcelas canceladas.`)) {
                                  deleteSale(inst.saleId);
                                }
                              }}
                              title="Excluir permanentemente esta venda e devolver itens ao estoque"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAB 2: HISTÓRICO GERAL DE VENDAS REALIZADAS */
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data & Venda</th>
                  <th>Cliente</th>
                  <th>Itens Vendidos</th>
                  <th>Forma de Pagamento</th>
                  <th>Total</th>
                  <th>Status & Cobrança</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary-muted)' }}>
                      Nenhuma venda encontrada para o período selecionado ({getPeriodLabel(periodState)}).
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => {
                    const isFiado = sale.paymentMethod === 'boca_2x';
                    const installments = sale.installments || [];
                    const paidCount = installments.filter((i) => i.paid).length;
                    const totalInst = installments.length;
                    const isFullyPaid = totalInst > 0 && paidCount === totalInst;
                    const isPartial = paidCount > 0 && !isFullyPaid;
                    const overdueList = installments.filter((i) => !i.paid && i.dueDate < today);
                    const pendingList = installments.filter((i) => !i.paid);
                    const nextDue = pendingList.find((i) => i.dueDate >= today) || pendingList[0];
                    const isExpanded = !!expandedSales[sale.id];

                    return (
                      <tr key={sale.id}>
                        {/* Date & Time */}
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                            <Calendar size={14} color="var(--color-taupe)" />
                            <span>{formatDate(sale.date)}</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-secondary-muted)', marginTop: '3px' }}>
                            {sale.date?.includes('T') ? sale.date.split('T')[1].substring(0, 5) : ''}
                          </div>
                        </td>

                        {/* Customer */}
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary-muted)' }}>
                              <User size={16} />
                            </div>
                            <div>
                              <strong style={{ color: 'var(--color-secondary)' }}>{sale.customerName}</strong>
                              <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-muted)' }}>
                                {sale.customerPhone || 'Sem telefone'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Items */}
                        <td style={{ verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '220px' }}>
                            {sale.items?.map((it, idx) => (
                              <div key={idx} style={{ fontSize: '0.78rem', color: 'var(--color-text-main)' }}>
                                <span style={{ fontWeight: 700 }}>{it.quantity}x</span> {it.name}{' '}
                                <span style={{ color: 'var(--color-taupe)', fontSize: '0.72rem' }}>({it.size})</span>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Payment Method Badge */}
                        <td style={{ verticalAlign: 'top' }}>
                          {sale.paymentMethod === 'a_vista' && (
                            <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Banknote size={13} /> À Vista (PIX/Dinheiro)
                            </span>
                          )}
                          {sale.paymentMethod === 'cartao' && (
                            <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CreditCard size={13} /> Cartão Débito/Crédito
                            </span>
                          )}
                          {sale.paymentMethod === 'boca_2x' && (
                            <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={13} /> Fiado ({totalInst}x)
                            </span>
                          )}
                        </td>

                        {/* Total Amount */}
                        <td style={{ verticalAlign: 'top' }}>
                          <strong style={{ fontSize: '1rem', color: 'var(--color-secondary)' }}>
                            {formatCurrency(sale.total)}
                          </strong>
                        </td>

                        {/* Status & Detailed Installments for Fiado */}
                        <td style={{ verticalAlign: 'top' }}>
                          {!isFiado ? (
                            <div>
                              <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                                ✓ Pago no Ato
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '240px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {isFullyPaid ? (
                                  <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                                    ✓ 100% Quitado ({paidCount}/{totalInst})
                                  </span>
                                ) : overdueList.length > 0 ? (
                                  <span className="badge badge-danger" style={{ fontSize: '0.75rem', padding: '3px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    🚨 {overdueList.length === 1 ? '1 Parcela em Atraso' : `${overdueList.length} Parcelas em Atraso`}
                                  </span>
                                ) : isPartial ? (
                                  <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                                    ⏳ Parcial ({paidCount}/{totalInst} pagas)
                                  </span>
                                ) : (
                                  <span className="badge badge-secondary" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                                    ⏳ Pendente a Receber
                                  </span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => toggleExpandSale(sale.id)}
                                  className="btn btn-outline btn-sm"
                                  style={{
                                    fontSize: '0.72rem',
                                    padding: '2px 8px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    borderColor: isExpanded ? 'var(--color-primary)' : '#cbd5e1',
                                    color: isExpanded ? 'var(--color-primary)' : '#475569',
                                    backgroundColor: isExpanded ? 'rgba(95, 45, 63, 0.08)' : '#fff',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    borderRadius: '5px'
                                  }}
                                  title={isExpanded ? 'Recolher detalhes das parcelas' : 'Abrir e ver todas as parcelas'}
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp size={13} /> Fechar
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown size={13} /> Ver Parcelas ({totalInst})
                                    </>
                                  )}
                                </button>
                              </div>

                              {!isExpanded && (
                                <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>
                                  {isFullyPaid ? (
                                    <span style={{ color: 'var(--color-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      ✓ Todas as {totalInst} parcelas quitadas
                                    </span>
                                  ) : overdueList.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                      <div style={{ color: 'var(--color-danger)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        <span>⚠️ Vencida em {formatDate(overdueList[0].dueDate)}</span>
                                        <span style={{ color: '#475569', fontWeight: 500 }}>({formatCurrency(overdueList[0].amount)})</span>
                                      </div>
                                    </div>
                                  ) : nextDue ? (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                      <span style={{ color: nextDue.dueDate === today ? '#d97706' : '#64748b', fontWeight: 500 }}>
                                        {nextDue.dueDate === today ? '⚡ Vence HOJE:' : '📅 A vencer:'}
                                      </span>
                                      <strong style={{ color: nextDue.dueDate === today ? '#d97706' : 'var(--color-secondary)' }}>
                                        {formatDate(nextDue.dueDate)}
                                      </strong>
                                      <span style={{ color: 'var(--color-taupe)', fontSize: '0.72rem' }}>
                                        ({nextDue.number}ª parc: {formatCurrency(nextDue.amount)})
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              )}

                              {isExpanded && (
                                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '260px', marginTop: '4px' }}>
                                  {installments.map((inst) => {
                                    const isOverdue = !inst.paid && inst.dueDate < today;

                                    const instItem = {
                                      saleId: sale.id,
                                      number: inst.number,
                                      amount: inst.amount,
                                      dueDate: inst.dueDate,
                                      customerName: sale.customerName,
                                      customerPhone: sale.customerPhone,
                                      items: sale.items || [],
                                      totalSale: sale.total,
                                      totalInstallments: installments.length,
                                      isOverdue,
                                    };

                                    return (
                                      <div
                                        key={inst.number}
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          fontSize: '0.75rem',
                                          padding: '4px 6px',
                                          borderRadius: '4px',
                                          background: inst.paid ? 'rgba(16, 185, 129, 0.08)' : isOverdue ? 'rgba(239, 68, 68, 0.08)' : '#fff',
                                          border: '1px solid',
                                          borderColor: inst.paid ? '#a7f3d0' : isOverdue ? '#fca5a5' : '#e2e8f0',
                                        }}
                                      >
                                        <div>
                                          <span style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                                            {inst.number}ª Parcela:
                                          </span>{' '}
                                          <strong>{formatCurrency(inst.amount)}</strong>
                                          <div style={{ fontSize: '0.7rem', color: isOverdue ? 'var(--color-danger)' : 'var(--color-taupe)' }}>
                                            Venc: <strong>{formatDate(inst.dueDate)}</strong>
                                          </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                          {inst.paid ? (
                                            <span style={{ color: 'var(--color-success)', fontWeight: 700, fontSize: '0.72rem' }}>
                                              ✓ Paga ({formatDate(inst.paidDate)})
                                            </span>
                                          ) : (
                                            <>
                                              <button
                                                type="button"
                                                className="btn btn-success btn-sm"
                                                style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                                onClick={() => {
                                                  if (window.confirm(`Dar baixa no recebimento da ${inst.number}ª parcela (${formatCurrency(inst.amount)}) de ${sale.customerName}?`)) {
                                                    payInstallment(sale.id, inst.number);
                                                  }
                                                }}
                                                title="Confirmar recebimento desta parcela"
                                              >
                                                <Check size={11} /> Receber
                                              </button>

                                              <button
                                                type="button"
                                                className="btn btn-outline btn-sm"
                                                style={{ padding: '2px 5px', fontSize: '0.7rem', borderColor: 'var(--color-accent)' }}
                                                onClick={() => {
                                                  setEditingDueDateItem(instItem);
                                                  setNewDueDateValue(inst.dueDate);
                                                }}
                                                title="Alterar data de vencimento desta parcela"
                                              >
                                                <Edit2 size={11} />
                                              </button>

                                              <button
                                                type="button"
                                                className="btn btn-whatsapp btn-sm"
                                                style={{ padding: '2px 6px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                                                onClick={() => handleOpenReminder(instItem)}
                                                title="Enviar cobrança desta parcela no WhatsApp"
                                              >
                                                <MessageCircle size={11} /> Cobrar
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ verticalAlign: 'top', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                            {isFiado && !isFullyPaid && (
                              <button
                                type="button"
                                className="btn btn-whatsapp btn-sm"
                                style={{ padding: '5px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                                onClick={() => {
                                  const nextUnpaid = installments.find((i) => !i.paid);
                                  if (nextUnpaid) {
                                    handleOpenReminder({
                                      saleId: sale.id,
                                      number: nextUnpaid.number,
                                      amount: nextUnpaid.amount,
                                      dueDate: nextUnpaid.dueDate,
                                      customerName: sale.customerName,
                                      customerPhone: sale.customerPhone,
                                      items: sale.items || [],
                                      totalSale: sale.total,
                                      totalInstallments: installments.length,
                                      isOverdue: nextUnpaid.dueDate < today,
                                    });
                                  }
                                }}
                                title="Enviar cobrança da parcela pendente via WhatsApp"
                              >
                                <MessageCircle size={13} /> Cobrança WPP
                              </button>
                            )}

                            {sale.customerPhone && (
                              <a
                                href={generateWhatsAppLink(
                                  sale.customerPhone,
                                  `Olá ${sale.customerName}! Aqui é da ${settings.storeName}. Segue o comprovante da sua compra de ${formatCurrency(sale.total)} realizada em ${formatDate(sale.date)}.`
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-whatsapp btn-sm"
                                style={{ padding: '5px 8px' }}
                                title="Enviar comprovante geral via WhatsApp"
                              >
                                <MessageCircle size={13} />
                              </a>
                            )}

                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '5px 8px', borderColor: '#fca5a5', color: '#e11d48' }}
                              onClick={() => {
                                if (window.confirm(`Deseja excluir permanentemente a venda de ${sale.customerName} (${formatCurrency(sale.total)})?`)) {
                                  deleteSale(sale.id);
                                }
                              }}
                              title="Excluir esta venda"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Friendly WhatsApp Cobrança */}
      {selectedForReminder && (
        <div className="modal-overlay" onClick={() => setSelectedForReminder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={20} color="#25d366" />
                <h3>Enviar Cobrança no WhatsApp</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedForReminder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-secondary)' }}>
                  {selectedForReminder.customerName}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-main)', marginTop: '3px' }}>
                  {selectedForReminder.number}ª Parcela • <strong>{formatCurrency(selectedForReminder.amount)}</strong> • Vencimento: {formatDate(selectedForReminder.dueDate)}
                </div>
                {selectedForReminder.items && selectedForReminder.items.length > 0 && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--color-taupe)', marginTop: '4px' }}>
                    <strong>Produtos:</strong> {selectedForReminder.items.map((it) => `${it.quantity}x ${it.name}`).join(', ')}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp do Cliente (DDD + Número):</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="Ex: 11999998888"
                  value={reminderPhone}
                  onChange={(e) => setReminderPhone(e.target.value)}
                  required
                />
                {!selectedForReminder.customerPhone && (
                  <span style={{ fontSize: '0.74rem', color: '#b45309', display: 'block', marginTop: '4px' }}>
                    ⚠️ Este cliente não possuía telefone cadastrado. Digite o número acima para enviar a cobrança.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Sua Chave PIX para pagamento:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: CPF, Telefone ou E-mail da chave PIX"
                  value={customPixKey}
                  onChange={(e) => setCustomPixKey(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prévia da Mensagem Padronizada:</label>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px', borderRadius: '8px', fontSize: '0.84rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#1e293b' }}>
                  {buildReminderMessage(selectedForReminder)}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setSelectedForReminder(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-whatsapp" onClick={handleSendReminder}>
                <Send size={16} />
                Abrir e Enviar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Editing Due Date */}
      {editingDueDateItem && (
        <div className="modal-overlay" onClick={() => setEditingDueDateItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="var(--color-primary)" />
                <h3>Alterar Vencimento da Parcela</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditingDueDateItem(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-primary)' }}>
                  {editingDueDateItem.customerName}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)', marginTop: '4px' }}>
                  {editingDueDateItem.number}ª Parcela • <strong>{formatCurrency(editingDueDateItem.amount)}</strong>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-taupe)', marginTop: '4px' }}>
                  Vencimento atual cadastrado: <strong>{formatDate(editingDueDateItem.dueDate)}</strong>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Selecione a Nova Data de Vencimento:</label>
                <input
                  type="date"
                  className="form-control"
                  value={newDueDateValue}
                  onChange={(e) => setNewDueDateValue(e.target.value)}
                  required
                  style={{ fontSize: '1rem', padding: '10px 14px' }}
                />
              </div>

              {/* Quick shortcut buttons */}
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-taupe)' }}>
                  Atalhos Rápidos de Vencimento:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 15);
                      setNewDueDateValue(d.toISOString().split('T')[0]);
                    }}
                  >
                    +15 dias
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 30);
                      setNewDueDateValue(d.toISOString().split('T')[0]);
                    }}
                  >
                    +30 dias
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 1);
                      setNewDueDateValue(d.toISOString().split('T')[0]);
                    }}
                  >
                    Próximo Mês
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditingDueDateItem(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!newDueDateValue) {
                    alert('Por favor selecione uma data de vencimento válida.');
                    return;
                  }
                  updateInstallmentDueDate(editingDueDateItem.saleId, editingDueDateItem.number, newDueDateValue);
                  setEditingDueDateItem(null);
                }}
              >
                Salvar Nova Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
