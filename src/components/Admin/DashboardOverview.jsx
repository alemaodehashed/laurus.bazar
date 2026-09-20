import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../../utils/formatters';
import {
  TrendingUp,
  Clock,
  Wallet,
  AlertTriangle,
  PlusCircle,
  ShoppingBag,
  Users,
  CreditCard,
  Calendar,
  MessageCircle,
  ArrowUpRight
} from 'lucide-react';

export const DashboardOverview = () => {
  const { products, sales, customers, setActiveAdminTab, settings } = useStore();

  // Calculations
  const totalSalesAmount = sales.reduce((acc, s) => acc + s.total, 0);
  const totalReceivedCash = sales.reduce((acc, s) => acc + s.paidAtSale, 0);
  const totalToReceiveFiado = sales.reduce((acc, s) => acc + (s.remainingBalance || 0), 0);

  const lowStockProducts = products.filter((p) => p.stock <= 3);

  // Group pending installments
  const pendingInstallments = [];
  sales.forEach((sale) => {
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

  // Payment methods breakdown
  const paymentBreakdown = {
    a_vista: sales.filter((s) => s.paymentMethod === 'a_vista').reduce((acc, s) => acc + s.total, 0),
    cartao: sales.filter((s) => s.paymentMethod === 'cartao').reduce((acc, s) => acc + s.total, 0),
    boca_2x: sales.filter((s) => s.paymentMethod === 'boca_2x').reduce((acc, s) => acc + s.total, 0),
  };

  return (
    <div>
      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card card-primary">
          <div className="metric-info">
            <h4>Total Faturado</h4>
            <div className="metric-value">{formatCurrency(totalSalesAmount)}</div>
            <div className="metric-sub">{sales.length} vendas registradas</div>
          </div>
          <div className="metric-icon-box">
            <TrendingUp size={24} />
          </div>
        </div>

        <div className="metric-card card-danger">
          <div className="metric-info">
            <h4>A Receber ("De Boca 2x")</h4>
            <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
              {formatCurrency(totalToReceiveFiado)}
            </div>
            <div className="metric-sub">{pendingInstallments.length} parcelas pendentes</div>
          </div>
          <div className="metric-icon-box">
            <Clock size={24} />
          </div>
        </div>

        <div className="metric-card card-success">
          <div className="metric-info">
            <h4>Recebido no Caixa</h4>
            <div className="metric-value" style={{ color: 'var(--color-success)' }}>
              {formatCurrency(totalReceivedCash)}
            </div>
            <div className="metric-sub">Entradas já pagas pelos clientes</div>
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
          Cobranças "De Boca 2x" ({pendingInstallments.length})
        </button>

        <button
          className="btn btn-outline"
          onClick={() => setActiveAdminTab('financeiro')}
        >
          <Wallet size={18} />
          Finanças Pessoais & Casa
        </button>
      </div>

      {/* Grid with 2 columns: Pending 2x installments + Sales breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Pending Installments ("De Boca 2x") */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-secondary)' }}>
                Próximas Parcelas a Receber ("De Boca")
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-secondary-muted)' }}>
                Controle de pagamento em 2x de boca / fiado familiar
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
                          <strong>{inst.customerName}</strong>
                        </td>
                        <td>
                          <span className="badge badge-warning">{inst.number}ª Parcela</span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--color-secondary)' }}>
                            {formatCurrency(inst.amount)}
                          </strong>
                        </td>
                        <td>
                          <span style={{ color: isOverdue ? 'var(--color-danger)' : 'inherit', fontWeight: isOverdue ? 700 : 500 }}>
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
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
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

        {/* Sales Distribution & Low Stock Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Sales Distribution */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-secondary)', marginBottom: '14px' }}>
              Vendas por Forma de Pagamento
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                  <span>🤝 Em 2x "De Boca" (A Prazo / Fiado)</span>
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

          {/* Low Stock Box */}
          {lowStockProducts.length > 0 && (
            <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} color="#b45309" />
                <h4 style={{ color: 'var(--color-secondary)' }}>Itens com Estoque Baixo</h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-secondary-muted)', marginBottom: '12px' }}>
                Reabasteça estes produtos para não perder vendas:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {lowStockProducts.map((p) => (
                  <span key={p.id} className="badge badge-warning">
                    {p.name} ({p.stock} un)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
