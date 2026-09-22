import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../../utils/formatters';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  PlusCircle,
  ShoppingBag,
  Users,
  CreditCard,
  Calendar,
  MessageCircle,
  ArrowUpRight,
  DollarSign,
  TrendingDown,
  Save,
  CheckCircle,
  Wallet,
  Receipt,
  Trash2
} from 'lucide-react';
import { PeriodFilterBar, isDateInPeriod, getPeriodLabel } from './PeriodFilterBar';

export const DashboardOverview = () => {
  const { products, sales, customers, setActiveAdminTab, settings, personalFinance, syncAllData, isSaving, lastSavedTime, deleteSale } = useStore();

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
      ...(personalFinance || []).map((f) => Number(f.date?.split('-')[0])).filter(Boolean),
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

  // Filter sales and finances by period
  const periodSales = sales.filter((s) => isDateInPeriod(s.date, periodState));
  const periodFinance = (personalFinance || []).filter((f) => isDateInPeriod(f.date, periodState));

  // Calculations based on period
  const totalSalesAmount = periodSales.reduce((acc, s) => acc + s.total, 0);
  const totalReceivedCash = periodSales.reduce((acc, s) => acc + s.paidAtSale, 0);
  
  // Installments due in selected period
  const periodDueInstallments = [];
  sales.forEach((sale) => {
    if (sale.paymentMethod === 'boca_2x' && sale.installments) {
      sale.installments.forEach((inst) => {
        if (!inst.paid && isDateInPeriod(inst.dueDate, periodState)) {
          periodDueInstallments.push(inst);
        }
      });
    }
  });
  const totalToReceiveFiado = periodDueInstallments.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

  // Store purchases & expenses in the period (stock restocking, packaging, freight)
  const totalDespesasLoja = periodFinance
    .filter((f) => f.type === 'despesa_loja')
    .reduce((acc, f) => acc + (Number(f.amount) || 0), 0);

  // Net Cash Balance: in cash inflows minus store stock expenses
  const saldoCaixaLiquido = +(totalReceivedCash - totalDespesasLoja).toFixed(2);

  // Cost of Goods Sold (CMV) and Profit Calculation
  let totalCostAmount = 0;
  periodSales.forEach((sale) => {
    if (sale.items && sale.items.length > 0) {
      sale.items.forEach((item) => {
        const catalogProd = products.find((p) => p.id === item.productId);
        const unitCost = Number(item.costPrice ?? (catalogProd?.costPrice || 0));
        totalCostAmount += unitCost * (Number(item.quantity) || 1);
      });
    }
  });

  const totalEstimatedProfit = Math.max(0, totalSalesAmount - totalCostAmount);
  const profitMarginPercent = totalSalesAmount > 0 ? ((totalEstimatedProfit / totalSalesAmount) * 100).toFixed(1) : '0.0';
  const cashProfitRatio = totalSalesAmount > 0 ? (totalReceivedCash / totalSalesAmount) : 0;
  const realizedProfitCash = +(totalEstimatedProfit * cashProfitRatio).toFixed(2);

  const lowStockProducts = products.filter((p) => p.stock <= 3);

  // Group pending installments in period
  const pendingInstallments = [];
  periodSales.forEach((sale) => {
    if (sale.installments && sale.installments.length > 0) {
      sale.installments.forEach((inst) => {
        if (!inst.paid) {
          pendingInstallments.push({
            saleId: sale.id,
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            number: inst.number,
            amount: inst.amount,
            dueDate: inst.dueDate,
          });
        }
      });
    }
  });

  // Sort by due date
  pendingInstallments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Payment methods breakdown in period
  const paymentBreakdown = {
    a_vista: periodSales.filter((s) => s.paymentMethod === 'a_vista').reduce((acc, s) => acc + s.total, 0),
    cartao: periodSales.filter((s) => s.paymentMethod === 'cartao').reduce((acc, s) => acc + s.total, 0),
    boca_2x: periodSales.filter((s) => s.paymentMethod === 'boca_2x').reduce((acc, s) => acc + s.total, 0),
  };

  // Recent sales to display (prioritizes filtered period, fallback to latest overall)
  const recentSalesList = [...(periodSales && periodSales.length > 0 ? periodSales : sales)]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, 6);

  return (
    <div>
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

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card card-primary">
          <div className="metric-info">
            <h4>Total Faturado ({getPeriodLabel(periodState)})</h4>
            <div className="metric-value">{formatCurrency(totalSalesAmount)}</div>
            <div className="metric-sub">{periodSales.length} vendas no período</div>
          </div>
          <div className="metric-icon-box">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Lucro Bruto Estimado Card */}
        <div className="metric-card" style={{ borderLeft: '4px solid #10b981', background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)' }}>
          <div className="metric-info">
            <h4 style={{ color: '#047857' }}>Lucro Bruto Estimado</h4>
            <div className="metric-value" style={{ color: '#059669' }}>{formatCurrency(totalEstimatedProfit)}</div>
            <div className="metric-sub" style={{ color: '#065f46' }}>
              Margem: <strong>{profitMarginPercent}%</strong> • Custo: {formatCurrency(totalCostAmount)}
            </div>
          </div>
          <div className="metric-icon-box" style={{ background: '#dcfce7', color: '#059669' }}>
            <DollarSign size={24} />
          </div>
        </div>

        <div className="metric-card card-danger">
          <div className="metric-info">
            <h4>A Receber ({getPeriodLabel(periodState)})</h4>
            <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
              {formatCurrency(totalToReceiveFiado)}
            </div>
            <div className="metric-sub">
              {periodDueInstallments.length} a vencer no período • {pendingInstallments.length} no total
            </div>
          </div>
          <div className="metric-icon-box">
            <Clock size={24} />
          </div>
        </div>

        <div className="metric-card card-success" style={saldoCaixaLiquido < 0 ? { borderLeft: '4px solid var(--color-danger)' } : {}}>
          <div className="metric-info">
            <h4>Saldo em Caixa</h4>
            <div className="metric-value" style={{ color: saldoCaixaLiquido >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
              {formatCurrency(saldoCaixaLiquido)}
            </div>
            <div className="metric-sub">
              {totalDespesasLoja > 0 ? (
                <span>
                  Entradas: <strong>{formatCurrency(totalReceivedCash)}</strong> • Saídas/Gastos: <strong style={{ color: 'var(--color-danger)' }}>-{formatCurrency(totalDespesasLoja)}</strong>
                </span>
              ) : (
                'Entradas já pagas pelos clientes'
              )}
            </div>
          </div>
          <div className="metric-icon-box">
            <Wallet size={24} />
          </div>
        </div>

        <div className="metric-card card-purple">
          <div className="metric-info">
            <h4>Alerta de Estoque</h4>
            <div className="metric-value" style={{ color: lowStockProducts.length > 0 ? '#b45309' : '#10b981' }}>
              {lowStockProducts.length} itens
            </div>
            <div className="metric-sub">com 3 ou menos unidades</div>
          </div>
          <div className="metric-icon-box">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
        <button
          className="btn btn-primary"
          onClick={() => setActiveAdminTab('vendas')}
        >
          <PlusCircle size={18} />
          Nova Venda no Caixa (PDV)
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setActiveAdminTab('estoque')}
        >
          <ShoppingBag size={18} />
          Gerenciar Estoque ({products.length})
        </button>

        <button
          className="btn btn-outline"
          onClick={() => setActiveAdminTab('fiado')}
          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
        >
          <Clock size={18} />
          Cobranças Fiado ({pendingInstallments.length})
        </button>

        <button
          className="btn btn-outline"
          onClick={() => setActiveAdminTab('despesas')}
          style={{ borderColor: '#b91c1c', color: '#b91c1c', background: '#fff1f2' }}
        >
          <TrendingDown size={18} />
          Gastos da Loja ({totalDespesasLoja > 0 ? formatCurrency(totalDespesasLoja) : 'Araras, Mkt...'})
        </button>

        <button
          className="btn"
          onClick={syncAllData}
          disabled={isSaving}
          style={{
            background: '#10b981',
            color: '#ffffff',
            border: 'none',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
          }}
          title="Salva e sincroniza tudo no banco de dados e localmente"
        >
          <Save size={18} />
          {isSaving ? 'Salvando...' : 'Salvar / Sincronizar Tudo'}
        </button>
      </div>

      {/* 1. Indicadores Financeiros (Demonstrativo de Lucro & Forma de Pagamento em 2 Colunas Balanceadas) */}
      <div className="admin-two-cols" style={{ marginBottom: '24px' }}>
        {/* Demonstrativo de Lucro & Custos Card */}
        <div className="card" style={{ borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} color="#059669" />
                <h3 style={{ fontSize: '1.05rem', color: 'var(--color-secondary)' }}>
                  Demonstrativo de Lucro & Custos
                </h3>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                Margem: {profitMarginPercent}%
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                <span>(+) Faturamento Bruto:</span>
                <strong>{formatCurrency(totalSalesAmount)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                <span>(-) Custo Total de Compra das Peças:</span>
                <strong>- {formatCurrency(totalCostAmount)}</strong>
              </div>

              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', color: '#047857', fontSize: '0.98rem' }}>
                <span>(=) Lucro Bruto no Período:</span>
                <strong style={{ fontSize: '1.05rem' }}>{formatCurrency(totalEstimatedProfit)}</strong>
              </div>

              {totalDespesasLoja > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>(-) Gastos da Loja (Araras, Marketing, Adesivos...):</span>
                  <strong>- {formatCurrency(totalDespesasLoja)}</strong>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0369a1', fontSize: '0.82rem', background: '#f0f9ff', border: '1px solid #bae6fd', padding: '8px 12px', borderRadius: '6px', marginTop: '14px' }}>
            <span>💵 Saldo Líquido no Caixa da Loja:</span>
            <strong style={{ color: saldoCaixaLiquido >= 0 ? '#0284c7' : '#dc2626' }}>{formatCurrency(saldoCaixaLiquido)}</strong>
          </div>
        </div>

        {/* Vendas por Forma de Pagamento Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-secondary)' }}>
                Vendas por Forma de Pagamento
              </h3>
              <span style={{ fontSize: '0.78rem', color: 'var(--color-secondary-muted)' }}>
                Total: <strong>{formatCurrency(totalSalesAmount)}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                  <span>💵 À Vista (PIX / Dinheiro)</span>
                  <strong>{formatCurrency(paymentBreakdown.a_vista)}</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: totalSalesAmount > 0 ? `${(paymentBreakdown.a_vista / totalSalesAmount) * 100}%` : '0%',
                      height: '100%',
                      backgroundColor: '#10b981',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                  <span>💳 Cartão de Crédito / Débito</span>
                  <strong>{formatCurrency(paymentBreakdown.cartao)}</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: totalSalesAmount > 0 ? `${(paymentBreakdown.cartao / totalSalesAmount) * 100}%` : '0%',
                      height: '100%',
                      backgroundColor: '#3b82f6',
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '4px' }}>
                  <span>🤝 Fiado (A Prazo)</span>
                  <strong>{formatCurrency(paymentBreakdown.boca_2x)}</strong>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: totalSalesAmount > 0 ? `${(paymentBreakdown.boca_2x / totalSalesAmount) * 100}%` : '0%',
                      height: '100%',
                      backgroundColor: '#f59e0b',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tabelas Operacionais (Últimas Vendas Realizadas + Próximas Parcelas a Receber) */}
      <div className="admin-two-cols" style={{ marginBottom: '24px' }}>
        {/* Card: Últimas Vendas Realizadas */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={18} color="var(--color-primary)" />
                Últimas Vendas Realizadas
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-secondary-muted)' }}>
                Histórico recente de pedidos e vendas no caixa
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setActiveAdminTab('vendas')}
            >
              Ver Todas
            </button>
          </div>

          {recentSalesList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-secondary-muted)' }}>
              Nenhuma venda registrada no período selecionado.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Itens</th>
                    <th>Pagamento</th>
                    <th>Total</th>
                    <th style={{ textAlign: 'center' }}>Excluir</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSalesList.map((sale) => {
                    const payBadgeClass = sale.paymentMethod === 'a_vista' ? 'badge-success'
                      : sale.paymentMethod === 'cartao' ? 'badge-primary'
                      : 'badge-warning';
                    const payLabel = sale.paymentMethod === 'a_vista' ? 'À Vista'
                      : sale.paymentMethod === 'cartao' ? 'Cartão'
                      : 'Fiado';

                    return (
                      <tr key={sale.id}>
                        <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {formatDate(sale.date)}
                        </td>
                        <td>
                          <strong style={{ fontSize: '0.85rem' }}>{sale.customerName || 'Cliente Balcão'}</strong>
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--color-secondary-muted)', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sale.items?.map((it) => `${it.quantity}x ${it.name}`).join(', ') || 'Item'}
                        </td>
                        <td>
                          <span className={`badge ${payBadgeClass}`} style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                            {payLabel}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--color-secondary)', fontSize: '0.88rem' }}>
                            {formatCurrency(sale.total)}
                          </strong>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '3px 6px', borderColor: '#fca5a5', color: '#e11d48' }}
                            onClick={() => {
                              if (window.confirm(`Deseja excluir a venda de ${sale.customerName || 'Cliente'} (${formatCurrency(sale.total)})? O estoque dos produtos voltará para a loja.`)) {
                                deleteSale(sale.id);
                              }
                            }}
                            title="Excluir esta venda e devolver ao estoque"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Card: Próximas Parcelas a Receber (Fiado) */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--color-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--color-danger)" />
                Próximas Parcelas a Receber (Fiado)
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-secondary-muted)' }}>
                Controle de cobranças de parcelas no fiado
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setActiveAdminTab('fiado')}
            >
              Ver Todas
            </button>
          </div>

          {pendingInstallments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--color-success)' }}>
              🎉 Parabéns! Não há parcelas de fiado pendentes no momento.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Parcela</th>
                    <th>Valor</th>
                    <th>Vencimento</th>
                    <th>Lembrar</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInstallments.slice(0, 5).map((inst, index) => {
                    const isOverdue = new Date(inst.dueDate) < new Date(new Date().toISOString().split('T')[0]);
                    const reminderMsg = `Olá ${inst.customerName}, tudo bem? Passando para lembrar com carinho sobre a parcela ${inst.number} no valor de ${formatCurrency(inst.amount)} do bazar. Se precisar da chave PIX para acertar, só me avisar! Abraço.`;
                    const whatsAppUrl = generateWhatsAppLink(inst.customerPhone, reminderMsg);

                    return (
                      <tr key={index}>
                        <td>
                          <strong style={{ fontSize: '0.85rem' }}>{inst.customerName}</strong>
                        </td>
                        <td>
                          <span className="badge badge-warning" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>
                            {inst.number}ª Parcela
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--color-secondary)', fontSize: '0.88rem' }}>
                            {formatCurrency(inst.amount)}
                          </strong>
                        </td>
                        <td>
                          <span style={{ color: isOverdue ? 'var(--color-danger)' : 'inherit', fontWeight: isOverdue ? 700 : 500, fontSize: '0.8rem' }}>
                            {formatDate(inst.dueDate)} {isOverdue && '(Vencida)'}
                          </span>
                        </td>
                        <td>
                          {inst.customerPhone ? (
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-whatsapp btn-sm"
                              style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                              title="Enviar lembrete amigável no WhatsApp"
                            >
                              <MessageCircle size={13} />
                              Cobrar
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Sem tel</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Alertas de Estoque Baixo (Se houver produtos com estoque baixo) */}
      {lowStockProducts.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid #f59e0b', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={18} color="#b45309" />
              <h4 style={{ color: 'var(--color-secondary)', margin: 0 }}>Itens com Estoque Baixo ({lowStockProducts.length})</h4>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setActiveAdminTab('estoque')}
              style={{ fontSize: '0.78rem', borderColor: '#d97706', color: '#b45309' }}
            >
              <ShoppingBag size={14} /> Reabastecer no Estoque
            </button>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-secondary-muted)', marginBottom: '12px' }}>
            Reabasteça estes produtos para não perder vendas:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lowStockProducts.map((p) => (
              <span key={p.id} className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '4px 8px' }}>
                {p.name} ({p.stock} un)
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
