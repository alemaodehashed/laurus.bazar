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
  Receipt,
  Edit3,
  Tag,
  Calendar
} from 'lucide-react';

export const PdvVendas = () => {
  const { products, customers, addCustomer, createSale, addProduct, setActiveAdminTab } = useStore();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [saleItems, setSaleItems] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('a_vista'); // a_vista, cartao, boca_2x

  // Automatic sale date (defaults to today, can be changed for retroactive sales)
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Quick customer registration state
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Custom / Avulso product state (for products outside catalog)
  const [isAddingCustomProduct, setIsAddingCustomProduct] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customSize, setCustomSize] = useState('Único');
  const [customQty, setCustomQty] = useState(1);
  const [saveToStock, setSaveToStock] = useState(false);
  const [customCategory, setCustomCategory] = useState('Bazar');
  const [extraStockQty, setExtraStockQty] = useState(0);

  // Fiado parcelado parameters (Configurable installments)
  const [installmentCount, setInstallmentCount] = useState(2);
  const [installmentDates, setInstallmentDates] = useState(() => {
    const d1 = new Date();
    d1.setDate(d1.getDate() + 15);
    const d2 = new Date();
    d2.setDate(d2.getDate() + 30);
    return [d1.toISOString().split('T')[0], d2.toISOString().split('T')[0]];
  });
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
          originalPrice: product.price,
          specialPrice: product.specialPrice || null,
          priceTier: 'padrao',
          quantity: 1,
          size: defaultSize,
          availableSizes: product.sizes || ['Único'],
          maxStock: product.stock,
          isCustomItem: false,
        },
      ];
    });
  };

  // Add custom / random item that is not in the catalog
  const handleAddCustomProduct = async (e) => {
    if (e) e.preventDefault();
    if (!customName.trim()) {
      alert('Informe o nome ou descrição do produto avulso!');
      return;
    }
    const cleanPrice = parseFloat(String(customPrice).replace(',', '.'));
    if (isNaN(cleanPrice) || cleanPrice < 0) {
      alert('Informe um valor válido em reais (ex: 29,90)!');
      return;
    }

    const qty = Math.max(1, parseInt(customQty) || 1);
    const size = customSize.trim() || 'Único';

    let newItem;

    if (saveToStock) {
      // Include this product into store stock / catalog
      const totalInitialStock = qty + Math.max(0, parseInt(extraStockQty) || 0);
      const created = await addProduct({
        name: customName.trim(),
        price: cleanPrice,
        costPrice: 0,
        stock: totalInitialStock,
        sizes: [size],
        category: customCategory || 'Bazar',
        active: true,
        description: 'Cadastrado direto pelo Caixa / PDV',
      });

      newItem = {
        productId: created ? created.id : ('prod_' + Date.now()),
        name: customName.trim(),
        unitPrice: cleanPrice,
        originalPrice: cleanPrice,
        specialPrice: null,
        priceTier: 'padrao',
        quantity: qty,
        size: size,
        availableSizes: [size],
        maxStock: totalInitialStock,
        isCustomItem: false, // will update catalog stock
      };
    } else {
      newItem = {
        productId: 'avulso_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: customName.trim(),
        unitPrice: cleanPrice,
        originalPrice: cleanPrice,
        specialPrice: null,
        priceTier: 'padrao',
        quantity: qty,
        size: size,
        availableSizes: [size],
        maxStock: 99999,
        isCustomItem: true, // will not affect catalog
      };
    }

    setSaleItems((prev) => [...prev, newItem]);
    setCustomName('');
    setCustomPrice('');
    setCustomSize('Único');
    setCustomQty(1);
    setSaveToStock(false);
    setExtraStockQty(0);
    setIsAddingCustomProduct(false);
  };

  const updateItemPriceTier = (index, tier) => {
    setSaleItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const orig = Number(item.originalPrice || item.unitPrice);
      item.priceTier = tier;

      if (tier === 'padrao') {
        item.unitPrice = orig;
      } else if (tier === 'diferenciado' && item.specialPrice) {
        item.unitPrice = Number(item.specialPrice);
      } else if (tier === 'desc_5') {
        item.unitPrice = +(orig * 0.95).toFixed(2);
      } else if (tier === 'desc_10') {
        item.unitPrice = +(orig * 0.90).toFixed(2);
      } else if (tier === 'desc_15') {
        item.unitPrice = +(orig * 0.85).toFixed(2);
      } else if (tier === 'desc_20') {
        item.unitPrice = +(orig * 0.80).toFixed(2);
      } else if (tier === 'desc_30') {
        item.unitPrice = +(orig * 0.70).toFixed(2);
      }

      updated[index] = item;
      return updated;
    });
  };

  const updateItemDirectPrice = (index, val) => {
    const clean = Math.max(0, parseFloat(String(val).replace(',', '.')) || 0);
    setSaleItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], unitPrice: clean, priceTier: 'custom' };
      return updated;
    });
  };

  const updateItemQty = (index, qty) => {
    if (qty <= 0) {
      removeItem(index);
      return;
    }
    setSaleItems((prev) => {
      const item = prev[index];
      if (!item.isCustomItem && qty > item.maxStock) {
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

  // Dynamic installments calculation
  const installmentBaseAmount = totalSale > 0 && installmentCount > 0
    ? +(totalSale / installmentCount).toFixed(2)
    : 0;

  const handleInstallmentCountChange = (count) => {
    const num = Math.max(1, Math.min(12, Number(count) || 1));
    setInstallmentCount(num);
    setInstallmentDates((prev) => {
      const newDates = [];
      for (let i = 0; i < num; i++) {
        if (prev && prev[i]) {
          newDates.push(prev[i]);
        } else {
          const d = new Date();
          const daysToAdd = i === 0 ? 15 : (i + 1) * 30;
          d.setDate(d.getDate() + daysToAdd);
          newDates.push(d.toISOString().split('T')[0]);
        }
      }
      return newDates;
    });
  };

  const handleInstallmentDateChange = (idx, value) => {
    setInstallmentDates((prev) => {
      const updated = [...prev];
      updated[idx] = value;
      return updated;
    });
  };

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
      alert('Para venda no fiado / "de boca", é obrigatório selecionar ou cadastrar o cliente!');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);

    // Build installment dates
    const datesToSend = [];
    for (let i = 0; i < installmentCount; i++) {
      if (installmentDates[i]) {
        datesToSend.push(installmentDates[i]);
      } else {
        const d = new Date();
        d.setDate(d.getDate() + (i === 0 ? 15 : (i + 1) * 30));
        datesToSend.push(d.toISOString().split('T')[0]);
      }
    }

    const saleRecord = createSale({
      customerId: customer ? customer.id : null,
      customerName: customer ? customer.name : 'Cliente Balcão',
      customerPhone: customer ? customer.phone : '',
      items: saleItems,
      paymentMethod,
      paidAtSale: paymentMethod === 'boca_2x' ? (firstPaidToday ? installmentBaseAmount : 0) : totalSale,
      firstPaidAtSale: firstPaidToday,
      installmentCount,
      installmentDates: datesToSend,
      saleDate,
    });

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    } catch (e) {}

    setLastSale(saleRecord);
    setSaleItems([]);
    setSelectedCustomerId('');
    setSaleDate(new Date().toISOString().split('T')[0]);
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
                  Pagamento: <strong>{lastSale.paymentMethod === 'boca_2x' ? `Fiado (${lastSale.installments?.length || 2}x)` : lastSale.paymentMethod === 'cartao' ? 'Cartão' : 'À Vista'}</strong>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {lastSale.customerPhone && (
                <a
                  href={generateWhatsAppLink(
                    lastSale.customerPhone,
                    `Olá ${lastSale.customerName}! Obrigado pela sua compra no valor de ${lastSale.total ? formatCurrency(lastSale.total) : ''}. ${
                      lastSale.paymentMethod === 'boca_2x'
                        ? `Sua compra foi parcelada em ${lastSale.installments?.length || 2}x no fiado. Qualquer dúvida estamos à disposição!`
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
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Buscar produto cadastrado..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-primary)', fontWeight: 700, padding: '7px 12px' }}
              onClick={() => {
                setIsAddingCustomProduct(true);
                if (search.trim()) setCustomName(search.trim());
              }}
              title="Adicionar um produto avulso que não está cadastrado no catálogo"
            >
              <Plus size={15} />
              + Item Avulso
            </button>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', width: '100%' }}>
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

            {filteredProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 14px', background: 'var(--bg-subtle)', borderRadius: '10px', width: '100%', gridColumn: '1 / -1' }}>
                <p style={{ color: 'var(--color-secondary-muted)', fontSize: '0.9rem', marginBottom: '10px' }}>
                  {search ? (
                    <>Produto "<strong>{search}</strong>" não está cadastrado no catálogo.</>
                  ) : (
                    <>Nenhum produto cadastrado nesta categoria.</>
                  )}
                </p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setIsAddingCustomProduct(true);
                    if (search.trim()) setCustomName(search.trim());
                  }}
                >
                  <Plus size={14} />
                  {search.trim() ? `Adicionar "${search.trim()}" como Item Avulso` : '+ Digitar Produto Avulso'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Current Sale Checkout */}
        <div className="pdv-cart-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--color-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={20} color="var(--color-primary)" />
              Resumo da Venda ({saleItems.length})
            </h3>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-subtle)', padding: '4px 10px', borderRadius: '6px' }} title="A data da venda é puxada automaticamente para hoje. Você pode alterar caso esteja registrando uma venda passada.">
              <Calendar size={13} color="var(--color-taupe)" />
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                style={{ fontSize: '0.78rem', border: 'none', background: 'transparent', color: 'var(--color-secondary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              />
            </div>
          </div>

          {/* Quick Custom Product Toggle Button */}
          <div style={{ marginBottom: '12px' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderColor: isAddingCustomProduct ? 'var(--color-primary)' : 'var(--color-accent)',
                background: isAddingCustomProduct ? 'rgba(95, 45, 63, 0.06)' : '#fff',
                color: 'var(--color-primary)',
                fontWeight: 700,
                padding: '9px 12px'
              }}
              onClick={() => setIsAddingCustomProduct(!isAddingCustomProduct)}
            >
              <Edit3 size={15} />
              {isAddingCustomProduct ? 'Fechar Cadastro de Item Avulso' : '+ Escrever Produto Avulso (Fora do Catálogo)'}
            </button>
          </div>

          {/* Form for Custom / Random Product */}
          {isAddingCustomProduct && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#92400e', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>✍️ Digitar Produto Fora do Catálogo:</span>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomProduct(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400e', fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#78350f', display: 'block', marginBottom: '2px' }}>Nome / Descrição do Produto:</label>
                  <input
                    type="text"
                    placeholder="Ex: Vestido vintage azul, Bijuteria avulsa, Ajuste..."
                    className="form-control"
                    style={{ fontSize: '0.85rem', padding: '7px 10px', background: '#fff' }}
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#78350f', display: 'block', marginBottom: '2px' }}>Preço R$:</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="form-control"
                      style={{ fontSize: '0.85rem', padding: '6px 8px', background: '#fff' }}
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#78350f', display: 'block', marginBottom: '2px' }}>Tamanho:</label>
                    <input
                      type="text"
                      placeholder="Ex: Único, M, G..."
                      className="form-control"
                      style={{ fontSize: '0.85rem', padding: '6px 8px', background: '#fff' }}
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#78350f', display: 'block', marginBottom: '2px' }}>Qtd:</label>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      style={{ fontSize: '0.85rem', padding: '6px 8px', background: '#fff' }}
                      value={customQty}
                      onChange={(e) => setCustomQty(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>
                </div>

                {/* Option to include or not in store stock/catalog */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-secondary)', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={saveToStock}
                      onChange={(e) => setSaveToStock(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--color-primary)' }}
                    />
                    <span>📦 Cadastrar e incluir este produto no Estoque / Catálogo da loja?</span>
                  </label>

                  {saveToStock && (
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--color-secondary-muted)', display: 'block', marginBottom: '2px' }}>
                          Categoria no Catálogo:
                        </label>
                        <select
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '5px 8px', background: '#fff' }}
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                        >
                          <option value="Bazar">Bazar</option>
                          <option value="Roupas">Roupas</option>
                          <option value="Perfumes">Perfumes</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.72rem', color: 'var(--color-secondary-muted)', display: 'block', marginBottom: '2px' }}>
                          Estoque Extra Restante:
                        </label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Ex: 0 ou 5 un"
                          className="form-control"
                          style={{ fontSize: '0.8rem', padding: '5px 8px', background: '#fff' }}
                          value={extraStockQty}
                          onChange={(e) => setExtraStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                          title="Quantas peças vão sobrar no estoque além da que você está vendendo agora"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', padding: '9px', marginTop: '6px' }}
                  onClick={handleAddCustomProduct}
                >
                  <Plus size={14} />
                  {saveToStock ? 'Cadastrar no Estoque e Adicionar à Venda' : 'Adicionar Item Avulso à Venda'}
                </button>
              </div>
            </div>
          )}

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
                Nenhum item adicionado à venda. Clique nos produtos ao lado ou escreva um produto avulso acima.
              </div>
            ) : (
              saleItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-subtle)', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{item.name}</span>
                      {item.isCustomItem && (
                        <span className="badge" style={{ fontSize: '0.68rem', padding: '1px 6px', background: 'rgba(95, 45, 63, 0.12)', color: 'var(--color-primary)' }}>
                          Avulso
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                      {item.isCustomItem ? (
                        <span style={{ fontSize: '0.73rem', color: 'var(--color-taupe)', fontWeight: 600 }}>
                          Tam: {item.size}
                        </span>
                      ) : (
                        <select
                          value={item.size}
                          onChange={(e) => updateItemSize(idx, e.target.value)}
                          style={{ fontSize: '0.73rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                        >
                          {item.availableSizes.map((s, sIdx) => (
                            <option key={sIdx} value={s}>{s}</option>
                          ))}
                        </select>
                      )}

                      {/* Selector de Preço Diferenciado */}
                      <select
                        value={item.priceTier || 'padrao'}
                        onChange={(e) => updateItemPriceTier(idx, e.target.value)}
                        style={{
                          fontSize: '0.73rem',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: item.priceTier && item.priceTier !== 'padrao' ? 'rgba(197, 160, 99, 0.15)' : '#fff',
                          color: item.priceTier && item.priceTier !== 'padrao' ? 'var(--color-primary)' : 'inherit',
                          fontWeight: 600,
                          maxWidth: '135px'
                        }}
                        title="Selecione um preço diferenciado ou desconto para este produto"
                      >
                        <option value="padrao">Normal ({formatCurrency(item.originalPrice || item.unitPrice)})</option>
                        {item.specialPrice && (
                          <option value="diferenciado">Especial ({formatCurrency(item.specialPrice)})</option>
                        )}
                        <option value="desc_5">Desc. 5% ({formatCurrency((item.originalPrice || item.unitPrice) * 0.95)})</option>
                        <option value="desc_10">Desc. 10% ({formatCurrency((item.originalPrice || item.unitPrice) * 0.90)})</option>
                        <option value="desc_15">Desc. 15% ({formatCurrency((item.originalPrice || item.unitPrice) * 0.85)})</option>
                        <option value="desc_20">Desc. 20% ({formatCurrency((item.originalPrice || item.unitPrice) * 0.80)})</option>
                        <option value="desc_30">Desc. 30% ({formatCurrency((item.originalPrice || item.unitPrice) * 0.70)})</option>
                        <option value="custom">Preço Manual / Digitar...</option>
                      </select>

                      {item.priceTier === 'custom' ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-primary)' }}>R$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPrice}
                            onChange={(e) => updateItemDirectPrice(idx, e.target.value)}
                            style={{ width: '62px', padding: '2px 4px', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-accent)', fontWeight: 700, color: 'var(--color-primary)', background: '#fff' }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: item.unitPrice < (item.originalPrice || item.unitPrice) ? 'var(--color-primary)' : 'var(--color-secondary)',
                            cursor: 'pointer'
                          }}
                          onClick={() => updateItemPriceTier(idx, 'custom')}
                          title="Clique para digitar o valor manualmente"
                        >
                          {formatCurrency(item.unitPrice)}
                        </span>
                      )}
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
                <span>Fiado</span>
              </button>
            </div>
          </div>

          {/* Specific Box for Fiado with Configurable Installments */}
          {paymentMethod === 'boca_2x' && (
            <div className="fiado-special-box" style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', padding: '14px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#92400e' }}>
                  🤝 Condição: {installmentCount}x de {formatCurrency(installmentBaseAmount)}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#78350f', margin: 0 }}>Parcelas:</label>
                  <select
                    className="form-control"
                    value={installmentCount}
                    onChange={(e) => handleInstallmentCountChange(e.target.value)}
                    style={{ width: 'auto', padding: '4px 8px', fontSize: '0.82rem', fontWeight: 700, background: '#fff' }}
                  >
                    <option value="1">1x (A Prazo)</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                    <option value="4">4x</option>
                    <option value="5">5x</option>
                    <option value="6">6x</option>
                    <option value="7">7x</option>
                    <option value="8">8x</option>
                    <option value="9">9x</option>
                    <option value="10">10x</option>
                    <option value="12">12x</option>
                  </select>
                </div>
              </div>

              {/* Quick shortcut pills for parcelas */}
              <div style={{ display: 'flex', gap: '5px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`btn btn-sm ${installmentCount === num ? 'btn-primary' : 'btn-outline'}`}
                    style={{ padding: '3px 10px', fontSize: '0.75rem', minWidth: '38px' }}
                    onClick={() => handleInstallmentCountChange(num)}
                  >
                    {num}x
                  </button>
                ))}
              </div>

              {/* Installment dates list */}
              <div style={{ maxHeight: '150px', overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                {Array.from({ length: installmentCount }).map((_, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#78350f', minWidth: '105px', margin: 0 }}>
                      Venc. {idx + 1}ª Parcela:
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      style={{ fontSize: '0.82rem', padding: '5px 8px', background: '#fff' }}
                      value={installmentDates[idx] || ''}
                      onChange={(e) => handleInstallmentDateChange(idx, e.target.value)}
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#92400e', minWidth: '65px', textAlign: 'right' }}>
                      {formatCurrency(installmentBaseAmount)}
                    </span>
                  </div>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.82rem', color: '#78350f', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={firstPaidToday}
                  onChange={(e) => setFirstPaidToday(e.target.checked)}
                />
                <span><strong>1ª parcela foi paga hoje no ato?</strong> (Entrada de {formatCurrency(installmentBaseAmount)})</span>
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
