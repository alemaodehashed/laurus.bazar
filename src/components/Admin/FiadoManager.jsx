import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../../utils/formatters';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Search,
  Check,
  Send,
  Calendar,
  X,
  User
} from 'lucide-react';

export const FiadoManager = () => {
  const { sales, payInstallment, customers, settings } = useStore();
  const [filterStatus, setFilterStatus] = useState('pendente'); // todos, pendente, vencido, pago
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedForReminder, setSelectedForReminder] = useState(null);
  const [customPixKey, setCustomPixKey] = useState(settings.whatsapp);

  // Flatten all installments with sale context
  const today = new Date().toISOString().split('T')[0];
  const allInstallments = [];

  sales.forEach((sale) => {
    if (sale.paymentMethod === 'boca_2x' && sale.installments) {
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
        });
      });
    }
  });

  // Totals
  const totalPendente = allInstallments
    .filter((i) => !i.paid)
    .reduce((acc, i) => acc + i.amount, 0);

  const totalQuitado = allInstallments
    .filter((i) => i.paid)
    .reduce((acc, i) => acc + i.amount, 0);

  const overdueCount = allInstallments.filter((i) => i.isOverdue).length;

  // Filtered List
  const filteredInstallments = allInstallments.filter((item) => {
    const matchesSearch = item.customerName.toLowerCase().includes(searchCustomer.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'pendente') return !item.paid;
    if (filterStatus === 'vencido') return item.isOverdue;
    if (filterStatus === 'pago') return item.paid;
    return true; // todos
  });

  // Build Friendly WhatsApp message
  const buildReminderMessage = (item) => {
    const statusText = item.isOverdue
      ? `que venceu em ${formatDate(item.dueDate)}`
      : `com vencimento para ${formatDate(item.dueDate)}`;

    return `Olá *${item.customerName}*, tudo bem com você?\n\nPassando aqui com todo o carinho pelo *${settings.storeName}* para lembrar sobre a *${item.number}ª parcela* da sua compra, no valor de *${formatCurrency(item.amount)}* (${statusText}).\n\nCaso prefira transferir via PIX, nossa chave é:\n👉 *${customPixKey}*\n\nSe já tiver acertado ou quiser combinar outra data, me avise por aqui. Muito obrigado e um abraço!`;
  };

  const handleOpenReminder = (item) => {
    setSelectedForReminder(item);
  };

  const handleSendReminder = () => {
    if (!selectedForReminder) return;
    const msg = buildReminderMessage(selectedForReminder);
    const url = generateWhatsAppLink(selectedForReminder.customerPhone, msg);
    window.open(url, '_blank');
    setSelectedForReminder(null);
  };

  return (
    <div>
      <div className="admin-section-header">
        <div className="admin-section-title">
          <h2>Controle de Fiado ("2x de Boca")</h2>
          <p>Acompanhe datas de vencimento, registre recebimentos e envie lembretes amigáveis no WhatsApp</p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="metrics-grid" style={{ marginBottom: '24px' }}>
        <div className="metric-card card-danger">
          <div className="metric-info">
            <h4>A Receber ("De Boca")</h4>
            <div className="metric-value" style={{ color: 'var(--color-danger)' }}>
              {formatCurrency(totalPendente)}
            </div>
            <div className="metric-sub">{allInstallments.filter((i) => !i.paid).length} parcelas a receber</div>
          </div>
          <div className="metric-icon-box">
            <Clock size={24} />
          </div>
        </div>

        <div className="metric-card card-success">
          <div className="metric-info">
            <h4>Já Recebido do Fiado</h4>
            <div className="metric-value" style={{ color: 'var(--color-success)' }}>
              {formatCurrency(totalQuitado)}
            </div>
            <div className="metric-sub">{allInstallments.filter((i) => i.paid).length} parcelas quitadas</div>
          </div>
          <div className="metric-icon-box">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="metric-card card-primary">
          <div className="metric-info">
            <h4>Parcelas em Atraso</h4>
            <div className="metric-value" style={{ color: overdueCount > 0 ? '#b91c1c' : '#10b981' }}>
              {overdueCount} atrasadas
            </div>
            <div className="metric-sub">requerem atenção amigável</div>
          </div>
          <div className="metric-icon-box">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn btn-sm ${filterStatus === 'pendente' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setFilterStatus('pendente')}
            >
              Pendentes a Receber
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'vencido' ? 'btn-danger' : 'btn-outline'}`}
              onClick={() => setFilterStatus('vencido')}
            >
              Vencidas ({overdueCount})
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'pago' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setFilterStatus('pago')}
            >
              Quitadas / Pagas
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'todos' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setFilterStatus('todos')}
            >
              Todas
            </button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar pelo nome do cliente..."
              value={searchCustomer}
              onChange={(e) => setSearchCustomer(e.target.value)}
              style={{ paddingLeft: '36px', paddingBottom: '7px', paddingTop: '7px' }}
            />
          </div>
        </div>
      </div>

      {/* Installments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Parcela</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
                <th>Ações de Baixa & Cobrança</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstallments.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary-muted)' }}>
                    Nenhuma parcela encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredInstallments.map((item, idx) => {
                  return (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-secondary-muted)' }}>
                            <User size={18} />
                          </div>
                          <div>
                            <strong style={{ color: 'var(--color-secondary)' }}>{item.customerName}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--color-secondary-muted)' }}>
                              {item.customerPhone || 'Sem telefone cadastrado'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                          {item.number}ª Parcela (de 2)
                        </span>
                      </td>

                      <td>
                        <strong style={{ fontSize: '1rem', color: 'var(--color-secondary)' }}>
                          {formatCurrency(item.amount)}
                        </strong>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="#64748b" />
                          <span style={{ fontWeight: item.isOverdue ? 700 : 500, color: item.isOverdue ? 'var(--color-danger)' : 'inherit' }}>
                            {formatDate(item.dueDate)}
                          </span>
                        </div>
                      </td>

                      <td>
                        {item.paid ? (
                          <span className="badge badge-success">Paga em {formatDate(item.paidDate)}</span>
                        ) : item.isOverdue ? (
                          <span className="badge badge-danger">Vencida em Atraso</span>
                        ) : item.isDueToday ? (
                          <span className="badge badge-warning">Vence Hoje!</span>
                        ) : (
                          <span className="badge badge-secondary">A Vencer</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {!item.paid ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => {
                                  if (window.confirm(`Confirmar recebimento de ${formatCurrency(item.amount)} de ${item.customerName}?`)) {
                                    payInstallment(item.saleId, item.number);
                                  }
                                }}
                                title="Dar baixa nesta parcela (cliente pagou)"
                              >
                                <Check size={14} />
                                Receber
                              </button>

                              {item.customerPhone && (
                                <button
                                  type="button"
                                  className="btn btn-whatsapp btn-sm"
                                  onClick={() => handleOpenReminder(item)}
                                  title="Enviar lembrete amigável no WhatsApp"
                                >
                                  <MessageCircle size={14} />
                                  Cobrança WhatsApp
                                </button>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: '0.82rem', color: 'var(--color-success-text)', fontWeight: 600 }}>
                              ✓ Quitado
                            </span>
                          )}
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

      {/* Modal for Friendly WhatsApp Reminder */}
      {selectedForReminder && (
        <div className="modal-overlay" onClick={() => setSelectedForReminder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageCircle size={20} color="#25d366" />
                <h3>Lembrete Amigável de Pagamento</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedForReminder(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--color-secondary-muted)', marginBottom: '14px' }}>
                Enviar mensagem carinhosa para <strong>{selectedForReminder.customerName}</strong> referente à {selectedForReminder.number}ª parcela ({formatCurrency(selectedForReminder.amount)}).
              </p>

              <div className="form-group">
                <label className="form-label">Sua Chave PIX para envio na mensagem:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ex: CPF, Telefone ou E-mail da chave PIX"
                  value={customPixKey}
                  onChange={(e) => setCustomPixKey(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Prévia do texto que será enviado no WhatsApp:</label>
                <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '14px', borderRadius: '8px', fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: '1.5', color: '#1e293b' }}>
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
    </div>
  );
};
