import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../../utils/formatters';
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  MessageCircle,
  Edit2,
  Trash2,
  X,
  ShoppingBag,
  Clock
} from 'lucide-react';

export const ClientesManager = () => {
  const { customers, sales, addCustomer, updateCustomer, deleteCustomer } = useStore();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomerHistory, setViewingCustomerHistory] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  const openNewModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', address: '', notes: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (c) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      phone: c.phone || '',
      address: c.address || '',
      notes: c.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData);
    } else {
      addCustomer(formData);
    }
    setIsModalOpen(false);
  };

  // Filter
  const filteredCustomers = customers.filter((c) => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.address?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Calculate customer total spent & debt
  const getCustomerMetrics = (customerId) => {
    const customerSales = sales.filter((s) => s.customerId === customerId);
    const totalSpent = customerSales.reduce((acc, s) => acc + s.total, 0);
    const totalDebt = customerSales.reduce((acc, s) => acc + (s.remainingBalance || 0), 0);
    return { customerSales, totalSpent, totalDebt };
  };

  return (
    <div>
      <div className="admin-section-header">
        <div className="admin-section-title">
          <h2>Gestão de Clientes</h2>
          <p>Cadastre amigos e clientes da família, acompanhe histórico de compras e saldo a receber</p>
        </div>

        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar cliente por nome, telefone ou endereço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', paddingBottom: '7px', paddingTop: '7px' }}
            />
          </div>

          <div style={{ fontSize: '0.85rem', color: 'var(--color-secondary-muted)' }}>
            Total de {customers.length} clientes cadastrados
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Telefone / WhatsApp</th>
                <th>Endereço / Referência</th>
                <th>Total Comprado</th>
                <th>Em Aberto (Fiado)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary-muted)' }}>
                    Nenhum cliente cadastrado.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const { customerSales, totalSpent, totalDebt } = getCustomerMetrics(c.id);

                  return (
                    <tr key={c.id}>
                      <td>
                        <strong style={{ color: 'var(--color-secondary)', fontSize: '0.95rem' }}>{c.name}</strong>
                        {c.notes && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--color-secondary-muted)', marginTop: '2px' }}>
                            {c.notes}
                          </div>
                        )}
                      </td>

                      <td>
                        {c.phone ? (
                          <a
                            href={generateWhatsAppLink(c.phone, `Olá ${c.name}!`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600 }}
                          >
                            <Phone size={14} />
                            {c.phone}
                          </a>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.85rem' }}>
                          <MapPin size={14} color="#94a3b8" />
                          <span>{c.address || 'Não informado'}</span>
                        </div>
                      </td>

                      <td>
                        <strong style={{ color: 'var(--color-secondary)' }}>{formatCurrency(totalSpent)}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-muted)' }}>
                          {customerSales.length} compras
                        </div>
                      </td>

                      <td>
                        {totalDebt > 0 ? (
                          <span className="badge badge-danger">
                            {formatCurrency(totalDebt)}
                          </span>
                        ) : (
                          <span className="badge badge-success">Em dia</span>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '6px 8px' }}
                            onClick={() => setViewingCustomerHistory({ customer: c, sales: customerSales })}
                            title="Ver histórico de compras"
                          >
                            <ShoppingBag size={14} />
                            Histórico
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '6px 8px' }}
                            onClick={() => openEditModal(c)}
                            title="Editar dados"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px 8px' }}
                            onClick={() => {
                              if (window.confirm(`Excluir cliente ${c.name}?`)) {
                                deleteCustomer(c.id);
                              }
                            }}
                            title="Excluir cliente"
                          >
                            <Trash2 size={14} />
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

      {/* Customer Add/Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3>{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome Completo / Apelido:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Dona Rosa (Vizinha da Maria)"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: 11988887777 (com DDD)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Endereço / Referência:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Rua das Rosas 120 ou Em frente à padaria"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Anotações / Preferências:</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Ex: Gosta de pagar dia 10, prefere perfumes doces..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Purchase History Modal */}
      {viewingCustomerHistory && (
        <div className="modal-overlay" onClick={() => setViewingCustomerHistory(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3>Histórico de {viewingCustomerHistory.customer.name}</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary-muted)' }}>
                  {viewingCustomerHistory.sales.length} vendas registradas
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setViewingCustomerHistory(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {viewingCustomerHistory.sales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                  Nenhuma compra registrada para este cliente ainda.
                </div>
              ) : (
                viewingCustomerHistory.sales.map((sale) => (
                  <div key={sale.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {formatDate(sale.date)}
                      </span>
                      <strong style={{ color: 'var(--color-primary)' }}>
                        {formatCurrency(sale.total)}
                      </strong>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#475569', marginBottom: '8px' }}>
                      Pagamento: <strong>{sale.paymentMethod === 'boca_2x' ? `Fiado (${sale.installments?.length || 2}x)` : sale.paymentMethod === 'cartao' ? 'Cartão' : 'À Vista'}</strong>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {sale.items?.map((item, iIdx) => (
                        <div key={iIdx} style={{ fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{item.quantity}x {item.name} ({item.size})</span>
                          <span>{formatCurrency(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {sale.installments?.length > 0 && (
                      <div style={{ marginTop: '10px', background: '#fffbeb', border: '1px dashed #f59e0b', borderRadius: '6px', padding: '8px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#92400e', marginBottom: '4px' }}>Parcelas:</div>
                        {sale.installments.map((inst) => (
                          <div key={inst.number} style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', color: '#78350f' }}>
                            <span>Parcela {inst.number} (Venc. {formatDate(inst.dueDate)}):</span>
                            <span>{formatCurrency(inst.amount)} - {inst.paid ? '✓ Paga' : 'Pendente'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setViewingCustomerHistory(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
