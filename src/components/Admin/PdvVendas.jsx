import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserPlus,
  CheckCircle2,
  Banknote,
  CreditCard,
  Clock,
  MessageCircle,
  ShoppingBag,
  Receipt
} from 'lucide-react';

export const PdvVendas = () => {
  const { products, customers, addCustomer, createSale, setActiveAdminTab } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [saleItems, setSaleItems] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('a_vista'); // a_vista, cartao, boca_2x

  // Quick customer registration state
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // 2x Fiado parameters
  const todayStr = new Date().toISOString().split('T')[0];
  const nextMonthDate = new Date();
  nextMonthDate.setDate(nextMonthDate.getDate() + 30);
  const nextMonthStr = nextMonthDate.toISOString().split('T')[0];

  const in15DaysDate = new Date();
  in15DaysDate.setDate(in15DaysDate.getDate() + 15);
  const in15DaysStr = in15DaysDate.toISOString().split('T')[0];

  const [firstDueDate, setFirstDueDate] = useState(in15DaysStr);
  const [secondDueDate, setSecondDueDate] = useState(nextMonthStr);
  const [firstPaidToday, setFirstPaidToday] = useState(false);

  // Last finished sale for receipt/WhatsApp
  const [lastSale, setLastSale] = useState(null);

  const categories = ['Todas', 'Roupas', 'Perfumes', 'Bazar'];

  const filteredProducts = products.filter((p) => {
    if (!p.active) return false;
    const matchesCat = selectedCategory === 'Todas' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addItemToSale = (product) => {
    if (product.stock <= 0) {
      alert('Produto sem estoque!');
      return;
    }

    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Único';

    setSaleItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === product.id && i.size === defaultSize);
      if (idx > -1) {
        const item = prev[idx];
        if (item.quantity + 1 > product.stock) {
          alert(`Estoque máximo disponível: ${product.stock} un`);
          return prev;
        }
        const updated = [...prev];
        updated[idx] = { ...item, quantity: item.quantity + 1 };
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity: 1,
          size: defaultSize,
          availableSizes: product.sizes || ['Único'],
          maxStock: product.stock,
        },
      ];
    });
  };

  const updateItemQty = (index, qty) => {
    if (qty <= 0) {
      removeItem(index);
      return;
    }
    setSaleItems((prev) => {
      const item = prev[index];
      if (qty > item.maxStock) {
        alert(`Estoque disponível: apenas ${item.maxStock} un`);
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...item, quantity: qty };
      return updated;
    });
  };

  const updateItemSize = (index, size) => {
    setSaleItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], size };
      return updated;
    });
  };

  const removeItem = (index) => {
    setSaleItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalSale = saleItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const halfSale = +(totalSale / 2).toFixed(2);

  const handleSaveQuickCustomer = (e) => {
    e.preventDefault();
    if (!newCustName) return;
    const created = addCustomer({
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddress,
      notes: 'Cadastrado no Caixa / PDV',
    });
    setSelectedCustomerId(created.id);
    setIsAddingCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  const handleFinalizeSale = () => {
    if (saleItems.length === 0) {
      alert('Adicione ao menos um item para registrar a venda!');
      return;
    }

    if (paymentMethod === 'boca_2x' && !selectedCustomerId) {
      alert('Para venda "em 2x de boca", é obrigatório selecionar ou cadastrar o cliente!');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);

    const saleRecord = createSale({
      customerId: customer ? customer.id : null,
      customerName: customer ? customer.name : 'Cliente Balcão',
      customerPhone: customer ? customer.phone : '',
      items: saleItems,
      paymentMethod,
      paidAtSale: paymentMethod === 'boca_2x' ? (firstPaidToday ? halfSale : 0) : totalSale,
      firstDueDate,
      secondDueDate,
      firstPaidAtSale: firstPaidToday,
    });

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch (e) {}

    setLastSale(saleRecord);
    setSaleItems([]);
    setSelectedCustomerId('');
  };

  return (
    <div>
      <div className="admin-section-header">
        <div className="admin-section-title">
          <h2>Frente de Caixa (PDV) & Vendas</h2>
          <p>Registre vendas à vista, no cartão ou parcele em 2x "de boca" para clientes</p>
        </div>
      </div>

      {lastSale && (
        <div className="card" style={{ marginBottom: '24px', background: '#ecfdf5', borderColor: '#6ee7b7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={24} color="#059669" />
              <div>
                <strong style={{ color: '#065f46', fontSize: '1.05rem' }}>Venda finalizada com sucesso!</strong>
                <div style={{ color: '#047857', fontSize: '0.85rem' }}>
                  Cliente: <strong>{lastSale.customerName}</strong> • Total: <strong>{formatCurrency(lastSale.total)}</strong> •
                  Pagamento: <strong>{lastSale.paymentMethod === 'boca_2x' ? 'Em 2x De Boca' : lastSale.paymentMethod === 'cartao' ? 'Cartão' : 'À Vista'}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {lastSale.customerPhone && (
                <a
                  href={generateWhatsAppLink(
                    lastSale.customerPhone,
                    `Olá ${lastSale.customerName}! Obrigado pela sua compra no ${lastSale.total ? formatCurrency(lastSale.total) : ''}. ${
                      lastSale.paymentMethod === 'boca_2x'
                        ? `Sua compra foi parcelada em 2x. Qualquer dúvida estamos à disposição!`
                        : `Pagamento recebido com sucesso. Volte sempre!`
                    }`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-sm"
                >
                  <MessageCircle size={15} />
                  Enviar Comprovante WhatsApp
                </a>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setLastSale(null)}>
                Fechar Aviso
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pdv-container">
        {/* Left column: Products catalog to pick from */}
        <div className="pdv-products-panel">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Buscar produto para adicionar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`btn btn-sm ${selectedCategory === cat ? 'btn-secondary' : 'btn-outline'}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="pdv-item-grid">
            {filteredProducts.map((p) => {
              const outOfStock = p.stock <= 0;
              return (
                <div
                  key={p.id}
                  className="pdv-product-chip"
                  onClick={() => !outOfStock && addItemToSale(p)}
                  style={{ opacity: outOfStock ? 0.5 : 1, cursor: outOfStock ? 'not-allowed' : 'pointer' }}
                >
                  <div className="pdv-chip-title">{p.name}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                    <span className="pdv-chip-price">{formatCurrency(p.price)}</span>
                    <span className={`badge ${outOfStock ? 'badge-danger' : 'badge-secondary'}`}>
                      {outOfStock ? 'Sem estoque' : `${p.stock} un`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: Current Sale Checkout */}
        <div className="pdv-cart-panel">
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-secondary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--color-primary)" />
            Resumo da Venda ({saleItems.length})
          </h3>

          {/* Customer Selection */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Cliente da Venda:</label>
              <button
                type="button"
                onClick={() => setIsAddingCustomer(!isAddingCustomer)}
                style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 700 }}
              >
                {isAddingCustomer ? 'Cancelar' : '+ Novo Cliente'}
              </button>
            </div>

            {isAddingCustomer ? (
              <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Nome completo..."
                  className="form-control"
                  style={{ marginBottom: '6px', padding: '6px 10px', fontSize: '0.85rem' }}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="WhatsApp (ex: 11999998888)..."
                  className="form-control"
                  style={{ marginBottom: '6px', padding: '6px 10px', fontSize: '0.85rem' }}
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Endereço ou referência..."
                  className="form-control"
                  style={{ marginBottom: '8px', padding: '6px 10px', fontSize: '0.85rem' }}
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                  onClick={handleSaveQuickCustomer}
                >
                  Cadastrar e Selecionar
                </button>
              </div>
            ) : (
              <select
                className="form-control"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                <option value="">Consumidor Geral / Balcão</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Cart items list */}
          <div style={{ flex: 1, maxHeight: '240px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {saleItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '0.88rem' }}>
                Nenhum item adicionado à venda. Clique nos produtos ao lado para incluir.
              </div>
            ) : (
              saleItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <select
                        value={item.size}
                        onChange={(e) => updateItemSize(idx, e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                      >
                        {item.availableSizes.map((s, sIdx) => (
                          <option key={sIdx} value={s}>{s}</option>
                        ))}
                      </select>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-secondary-muted)' }}>
                        {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="qty-btn"
                      onClick={() => updateItemQty(idx, item.quantity - 1)}
                    >
                      <Minus size={11} />
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem', minWidth: '18px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => updateItemQty(idx, item.quantity + 1)}
                    >
                      <Plus size={11} />
                    </button>
                    <button
                      onClick={() => removeItem(idx)}
                      style={{ color: '#94a3b8', padding: '4px', marginLeft: '4px' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="form-label" style={{ marginBottom: '6px' }}>Forma de Pagamento:</label>
            <div className="payment-selector">
              <button
                type="button"
                className={`payment-btn ${paymentMethod === 'a_vista' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('a_vista')}
              >
                <Banknote size={20} />
                <span>À Vista (PIX/Dinheiro)</span>
              </button>

              <button
                type="button"
                className={`payment-btn ${paymentMethod === 'cartao' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cartao')}
              >
                <CreditCard size={20} />
                <span>Cartão Débito/Crédito</span>
              </button>

              <button
                type="button"
                className={`payment-btn ${paymentMethod === 'boca_2x' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('boca_2x')}
              >
                <Clock size={20} />
                <span>Em 2x "De Boca"</span>
              </button>
            </div>
          </div>

          {/* Specific Box for 2x "De Boca" (Fiado) */}
          {paymentMethod === 'boca_2x' && (
            <div className="fiado-special-box">
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#92400e' }}>
                🤝 Condição Especial: 2x de {formatCurrency(halfSale)}
              </div>

              <div className="fiado-dates-row">
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#78350f' }}>Venc. 1ª Parcela:</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ fontSize: '0.82rem', padding: '6px' }}
                    value={firstDueDate}
                    onChange={(e) => setFirstDueDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#78350f' }}>Venc. 2ª Parcela:</label>
                  <input
                    type="date"
                    className="form-control"
                    style={{ fontSize: '0.82rem', padding: '6px' }}
                    value={secondDueDate}
                    onChange={(e) => setSecondDueDate(e.target.value)}
                  />
                </div>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#78350f' }}>
                <input
                  type="checkbox"
                  checked={firstPaidToday}
                  onChange={(e) => setFirstPaidToday(e.target.checked)}
                />
                <span><strong>1ª parcela foi paga hoje no ato?</strong> (Entrada de {formatCurrency(halfSale)})</span>
              </label>
            </div>
          )}

          {/* Total & Finalize Button */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-secondary)' }}>Total a Pagar:</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(totalSale)}
              </span>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              onClick={handleFinalizeSale}
              disabled={saleItems.length === 0}
            >
              <CheckCircle2 size={20} />
              Confirmar e Concluir Venda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
