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
  User,
  Trash2,
  Edit2,
  Save
} from 'lucide-react';

export const FiadoManager = () => {
  const { sales, payInstallment, updateInstallmentDueDate, deleteSale, clearAllSales, customers, settings } = useStore();
  const [filterStatus, setFilterStatus] = useState('pendente'); // todos, pendente, vencido, pago
  const [searchCustomer, setSearchCustomer] = useState('');
  const [selectedForReminder, setSelectedForReminder] = useState(null);
  const [editingDueDateItem, setEditingDueDateItem] = useState(null);
  const [newDueDateValue, setNewDueDateValue] = useState('');
  const [customPixKey, setCustomPixKey] = useState(settings.whatsapp);

  // Flatten all installments with sale context
  const today = new Date().toISOString().split('T')[0];
  const allInstallments = [];

  sales.forEach((sale) => {
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

  // Totals
  const totalPendente = allInstallments
    .filter((i) => !i.paid)
    .reduce((acc, i) => acc + i.amount, 0);

  const totalQuitado = allInstallments
    .filter((i) => i.paid)
    .reduce((acc, i) => acc + i.amount, 0);

  const overdueCount = allInstallments.filter((i) => i.isOverdue).length;
  const pendingCount = allInstallments.filter((i) => !i.paid).length;
  const fullyPaidCount = allInstallments.filter((i) => i.paid && i.isSaleFullyPaid).length;
  const totalSalesFullyPaid = sales.filter(
    (s) => s.paymentMethod === 'boca_2x' && s.installments && s.installments.length > 0 && s.installments.every((i) => i.paid)
  ).length;

  // Filtered List: "Quitadas / Pagas" only displays fully paid sales (all installments paid, e.g. 2/2)
  const filteredInstallments = allInstallments.filter((item) => {
    const matchesSearch = item.customerName.toLowerCase().includes(searchCustomer.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'pendente') return !item.paid;
    if (filterStatus === 'vencido') return item.isOverdue;
    if (filterStatus === 'pago') return item.paid && item.isSaleFullyPaid;
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

        {allInstallments.length > 0 && (
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
            Zerar Todas as Vendas e Fiados de Teste
          </button>
        )}
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
            <div className="metric-sub">
              {totalSalesFullyPaid} {totalSalesFullyPaid === 1 ? 'venda 100% quitada' : 'vendas 100% quitadas'} ({allInstallments.filter((i) => i.paid).length} parcelas pagas)
            </div>
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
              Pendentes a Receber ({pendingCount})
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
              title="Apenas compras em que todas as parcelas foram pagas (100% quitado)"
            >
              Quitadas / Pagas (2/2) {totalSalesFullyPaid > 0 ? `(${totalSalesFullyPaid})` : ''}
            </button>
            <button
              className={`btn btn-sm ${filterStatus === 'todos' ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => setFilterStatus('todos')}
            >
              Todas ({allInstallments.length})
            </button>
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
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
                    {filterStatus === 'pago' ? (
                      <div>
                        <strong>Nenhuma compra 100% quitada (2/2) encontrada.</strong>
                        <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem' }}>
                          Clientes que pagaram apenas 1 de 2 parcelas permanecem em "Pendentes a Receber" até a quitação total da 2ª parcela.
                        </p>
                      </div>
                    ) : (
                      'Nenhuma parcela encontrada para os filtros selecionados.'
                    )}
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                            {item.number}ª Parcela (de {item.totalInstallments})
                          </span>
                          {item.isSaleFullyPaid && (
                            <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                              ✓ 100% Pago ({item.totalInstallments}/{item.totalInstallments})
                            </span>
                          )}
                          {item.isSalePartiallyPaid && !item.paid && (
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600, background: 'rgba(197, 160, 99, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                              1 de 2 já paga • Falta 2ª
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <strong style={{ fontSize: '1rem', color: 'var(--color-secondary)' }}>
                          {formatCurrency(item.amount)}
                        </strong>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Calendar size={14} color={item.isOverdue ? 'var(--color-danger)' : 'var(--color-taupe)'} />
                            <span style={{ fontWeight: item.isOverdue ? 700 : 600, color: item.isOverdue ? 'var(--color-danger)' : 'inherit' }}>
                              {formatDate(item.dueDate)}
                            </span>
                          </div>

                          {!item.paid && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '2px 7px', fontSize: '0.72rem', borderColor: 'var(--color-accent)', color: 'var(--color-primary)' }}
                              onClick={() => {
                                setEditingDueDateItem(item);
                                setNewDueDateValue(item.dueDate);
                              }}
                              title="Alterar data de vencimento desta parcela"
                            >
                              <Edit2 size={11} />
                              <span>Alterar</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td>
                        {item.paid ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className="badge badge-success">Paga em {formatDate(item.paidDate)}</span>
                            {item.isSaleFullyPaid ? (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-success)', fontWeight: 600 }}>
                                ✓ Dívida 100% Quitada (2/2)
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                                1ª Parcela recebida (resta 2ª)
                              </span>
                            )}
                          </div>
                        ) : item.isOverdue ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className="badge badge-danger">Vencida em Atraso</span>
                            {item.isSalePartiallyPaid && (
                              <span style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 600 }}>
                                Pagou 1ª • 2ª em atraso
                              </span>
                            )}
                          </div>
                        ) : item.isDueToday ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className="badge badge-warning">Vence Hoje!</span>
                            {item.isSalePartiallyPaid && (
                              <span style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
                                Pagou 1ª • Falta 2ª
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <span className="badge badge-secondary">A Vencer</span>
                            {item.isSalePartiallyPaid && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--color-taupe)', fontWeight: 600 }}>
                                1ª já paga • Falta 2ª
                              </span>
                            )}
                          </div>
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

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '6px 8px', borderColor: '#fca5a5', color: '#e11d48' }}
                            onClick={() => {
                              if (window.confirm(`Deseja excluir a venda de ${item.customerName} (${formatCurrency(item.amount)})?`)) {
                                deleteSale(item.saleId);
                              }
                            }}
                            title="Excluir esta venda/parcela fictícia"
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
                  {editingDueDateItem.number}ª Parcela (de 2) • <strong>{formatCurrency(editingDueDateItem.amount)}</strong>
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
                      const now = new Date();
                      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 10);
                      setNewDueDateValue(nextMonth.toISOString().split('T')[0]);
                    }}
                  >
                    Dia 10 do próx. mês
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => {
                      const now = new Date();
                      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 20);
                      setNewDueDateValue(nextMonth.toISOString().split('T')[0]);
                    }}
                  >
                    Dia 20 do próx. mês
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
                    alert('Por favor, selecione uma data válida!');
                    return;
                  }
                  updateInstallmentDueDate(editingDueDateItem.saleId, editingDueDateItem.number, newDueDateValue);
                  setEditingDueDateItem(null);
                }}
              >
                <Save size={16} />
                Salvar Novo Vencimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
