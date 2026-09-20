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
  ChevronUp
} from 'lucide-react';

import { PeriodFilterBar, isDateInPeriod, getPeriodLabel } from './PeriodFilterBar';

export const FiadoManager = () => {
  const { sales, payInstallment, updateInstallmentDueDate, deleteSale, clearAllSales, customers, settings } = useStore();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;
  const currentSemester = currentMonth < 6 ? 1 : 2;

  // Find latest sale date if any to initialize period
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

  const availableYears = Array.from(
    new Set([
      currentYear - 1,
      currentYear,
      currentYear + 1,
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

  // Filter sales by selected period (month, date, quarter, semester, year, all)
  const periodSales = sales.filter((s) => isDateInPeriod(s.date, periodState));

  // Filters
  const [filterPayment, setFilterPayment] = useState('todas'); // todas, a_vista, cartao, boca_2x
  const [filterFiadoStatus, setFilterFiadoStatus] = useState('todos'); // todos, pendente, vencido, pago
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedForReminder, setSelectedForReminder] = useState(null);
  const [reminderPhone, setReminderPhone] = useState('');
  const [editingDueDateItem, setEditingDueDateItem] = useState(null);
  const [newDueDateValue, setNewDueDateValue] = useState('');
  const [customPixKey, setCustomPixKey] = useState(settings.whatsapp);

  // Accordion state for expandable installments per row
  const [expandedSales, setExpandedSales] = useState({});
  const toggleExpandSale = (saleId) => {
    setExpandedSales((prev) => ({
      ...prev,
      [saleId]: !prev[saleId]
    }));
  };

  const today = new Date().toISOString().split('T')[0];

  // Flatten installments for metric counts based on period
  const allInstallments = [];
  periodSales.forEach((sale) => {
    if (sale.paymentMethod === 'boca_2x' && sale.installments) {
      const totalInstallments = sale.installments.length;
      const paidInstallmentsCount = sale.installments.filter((i) => i.paid).length;
      const isSaleFullyPaid = totalInstallments > 0 && paidInstallmentsCount === totalInstallments;
      const isSalePartiallyPaid = paidInstallmentsCount > 0 && !isSaleFullyPaid;

      sale.installments.forEach((inst) => {
        const isOverdue = !inst.paid && inst.dueDate < today;
        const isDueToday = !inst.paid && inst.dueDate === today;

        allInstallments.push({
          saleId: sale.id,
          saleDate: sale.date,
          customerId: sale.customerId,
          customerName: sale.customerName,
          customerPhone: sale.customerPhone,
          items: sale.items,
          number: inst.number,
          amount: inst.amount,
          dueDate: inst.dueDate,
          paid: inst.paid,
          paidDate: inst.paidDate,
          isOverdue,
          isDueToday,
          totalInstallments,
          paidInstallmentsCount,
          isSaleFullyPaid,
          isSalePartiallyPaid,
        });
      });
    }
  });

  // Metrics based on periodSales
  const totalSalesAmount = periodSales.reduce((acc, s) => acc + s.total, 0);

  const totalAVistaCartao = periodSales
    .filter((s) => s.paymentMethod !== 'boca_2x')
    .reduce((acc, s) => acc + s.total, 0);

  const totalPendenteFiado = allInstallments
    .filter((i) => !i.paid)
    .reduce((acc, i) => acc + i.amount, 0);

  const totalQuitadoFiado = allInstallments
    .filter((i) => i.paid)
    .reduce((acc, i) => acc + i.amount, 0);

  const overdueCount = allInstallments.filter((i) => i.isOverdue).length;
  const pendingInstallmentsCount = allInstallments.filter((i) => !i.paid).length;
  const totalSalesFullyPaid = periodSales.filter(
    (s) => s.paymentMethod === 'boca_2x' && s.installments && s.installments.length > 0 && s.installments.every((i) => i.paid)
  ).length;

  const countAVista = periodSales.filter((s) => s.paymentMethod === 'a_vista').length;
  const countCartao = periodSales.filter((s) => s.paymentMethod === 'cartao').length;
  const countFiado = periodSales.filter((s) => s.paymentMethod === 'boca_2x').length;

  // Filtered Sales within period
  const filteredSales = periodSales.filter((sale) => {
    // 1. Payment Method Filter
    if (filterPayment !== 'todas' && sale.paymentMethod !== filterPayment) {
      return false;
    }

    // 2. Fiado Status Filter (if filtering Fiado or looking at Fiado sales)
    if (sale.paymentMethod === 'boca_2x' && filterFiadoStatus !== 'todos') {
      const hasUnpaid = sale.installments && sale.installments.some((i) => !i.paid);
      const isFullyPaid = sale.installments && sale.installments.length > 0 && sale.installments.every((i) => i.paid);
      const hasOverdue = sale.installments && sale.installments.some((i) => !i.paid && i.dueDate < today);

      if (filterFiadoStatus === 'pendente' && !hasUnpaid) return false;
      if (filterFiadoStatus === 'vencido' && !hasOverdue) return false;
      if (filterFiadoStatus === 'pago' && !isFullyPaid) return false;
    }

    // 3. Search Query Filter
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

    return `Olá, *${item.customerName || 'Cliente'}*! Tudo bem? 😊\n\nPassando com carinho pelo *${settings.storeName || 'Laurus Bazar'}* para enviar o lembrete da sua compra:\n\n🛍️ *Produto(s):*\n${itemsList}\n\n💳 *Detalhes da Parcela:*\n• ${totalInfo}\n• *Valor a Pagar:* ${formatCurrency(item.amount)}\n• ${statusText}\n\n👉 *Chave PIX para pagamento:*\n*${customPixKey || settings.whatsapp}*\n\nQualquer dúvida ou comprovante, basta responder por aqui. Agradecemos pela preferência! 💛`;
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
          <h2>Vendas no Geral & Histórico</h2>
          <p>Acompanhe todas as vendas realizadas (À Vista, Cartão e Fiado/De Boca) com filtros detalhados e controle de cobrança</p>
        </div>

        {sales.length > 0 && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ borderColor: '#fca5a5', color: '#be123c' }}
            onClick={() => {
              if (window.confirm('Atenção: deseja realmente excluir todas as vendas e parcelas fictícias de teste para zerar tudo?')) {
                clearAllSales();
              }
            }}
          >
            <Trash2 size={15} />
            Zerar Todas as Vendas de Teste
          </button>
        )}
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
        <div className="metric-card card-primary">
          <div className="metric-info">
            <h4>Total Vendido ({getPeriodLabel(periodState)})</h4>
            <div className="metric-value" style={{ color: 'var(--color-primary)' }}>
              {formatCurrency(totalSalesAmount)}
            </div>
            <div className="metric-sub">{periodSales.length} vendas no período</div>
          </div>
          <div className="metric-icon-box">
            <Receipt size={24} />
          </div>
        </div>

        <div className="metric-card card-success">
          <div className="metric-info">
            <h4>À Vista & Cartão (Recebido)</h4>
            <div className="metric-value" style={{ color: 'var(--color-success)' }}>
              {formatCurrency(totalAVistaCartao)}
            </div>
            <div className="metric-sub">{countAVista + countCartao} vendas pagas no ato</div>
          </div>
          <div className="metric-icon-box">
            <Banknote size={24} />
          </div>
        </div>

        <div className="metric-card card-danger">
          <div className="metric-info">
            <h4>A Receber do Fiado</h4>
            <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
              {formatCurrency(totalPendenteFiado)}
            </div>
            <div className="metric-sub">{pendingInstallmentsCount} parcelas a receber</div>
          </div>
          <div className="metric-icon-box">
            <Clock size={24} />
          </div>
        </div>

        <div className="metric-card card-warning">
          <div className="metric-info">
            <h4>Fiados em Atraso</h4>
            <div className="metric-value" style={{ color: overdueCount > 0 ? '#b91c1c' : '#10b981' }}>
              {overdueCount} atrasadas
            </div>
            <div className="metric-sub">
              {totalSalesFullyPaid} fiados 100% quitados
            </div>
          </div>
          <div className="metric-icon-box">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Primary Payment Method Filters */}
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
              Fiado / "De Boca" ({countFiado})
            </button>
          </div>

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

        {/* Secondary Subfilter: Fiado Status (Visible when Fiado is active or all is selected) */}
        {(filterPayment === 'boca_2x' || filterPayment === 'todas') && (
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
              Pendentes a Receber ({pendingInstallmentsCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterFiadoStatus === 'vencido' ? 'btn-danger' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => setFilterFiadoStatus('vencido')}
            >
              Vencidas em Atraso ({overdueCount})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${filterFiadoStatus === 'pago' ? 'btn-secondary' : 'btn-outline'}`}
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => setFilterFiadoStatus('pago')}
              title="Apenas compras no fiado onde 100% das parcelas foram pagas"
            >
              Quitadas 100% ({totalSalesFullyPaid})
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

      {/* Main Sales Table */}
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
                  const hasOverdue = installments.some((i) => !i.paid && i.dueDate < today);
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
                            <Clock size={13} /> Fiado ({totalInst}x de Boca)
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
                            {/* Badges + Botão do lado para abrir/fechar */}
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

                              {/* Botão do lado para abrir / fechar as parcelas */}
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

                            {/* Se NÃO apertar o botão: só aparecem as informações mais importantes (se tá atrasado ou não ou a vencer) */}
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
                                    {overdueList.length > 1 && (
                                      <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)' }}>
                                        + {overdueList.length - 1} outra(s) parcela(s) em atraso
                                      </span>
                                    )}
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

                            {/* Detalhamento das parcelas (só aparece após apertar para abrir) */}
                            {isExpanded && (
                              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '260px', marginTop: '4px' }}>
                                {installments.map((inst) => {
                                  const isOverdue = !inst.paid && inst.dueDate < today;
                                  const isDueToday = !inst.paid && inst.dueDate === today;

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
                                `Olá ${sale.customerName}! Aqui é do ${settings.storeName}. Segue o comprovante da sua compra de ${formatCurrency(sale.total)} realizada em ${formatDate(sale.date)}.`
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
