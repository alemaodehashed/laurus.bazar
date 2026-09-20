import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/formatters';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  PlusCircle,
  MinusCircle,
  X,
  Sparkles,
  PackageCheck,
  Upload,
  Camera,
  Image as ImageIcon
} from 'lucide-react';

export const EstoqueManager = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustProductStock, addBatchPurchase } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Form State
  const initialFormState = {
    name: '',
    category: 'Roupas',
    costPrice: '',
    price: '',
    specialPrice: '',
    stock: 1,
    sizes: 'P, M, G',
    image: '',
    description: '',
    featured: false,
    active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

  // Batch purchase form state
  const initialBatchState = {
    totalAmount: '',
    totalPieces: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    targetMode: 'new_product', // 'new_product' | 'existing_product' | 'cash_only'
    productId: '',
    newProductName: '',
    newProductPrice: '',
    newProductCategory: 'Roupas',
  };

  const [batchData, setBatchData] = useState(initialBatchState);

  const openBatchModal = () => {
    setBatchData({
      ...initialBatchState,
      date: new Date().toISOString().split('T')[0],
    });
    setIsBatchModalOpen(true);
  };

  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    const totalAmount = parseFloat(batchData.totalAmount) || 0;
    const totalPieces = parseInt(batchData.totalPieces, 10) || 0;

    if (totalAmount <= 0) {
      alert('Por favor, informe o valor total pago no lote!');
      return;
    }
    if (totalPieces <= 0) {
      alert('Por favor, informe a quantidade de peças no lote!');
      return;
    }

    const avgCost = +(totalAmount / totalPieces).toFixed(2);
    const desc = batchData.description?.trim() || `Lote de Roupas (${totalPieces} peças)`;

    await addBatchPurchase({
      totalAmount,
      totalPieces,
      description: desc,
      targetMode: batchData.targetMode,
      productId: batchData.productId,
      date: batchData.date,
      newProductData: {
        name: batchData.newProductName?.trim() || desc,
        price: parseFloat(batchData.newProductPrice) || +(avgCost * 2).toFixed(2),
        category: batchData.newProductCategory || 'Roupas',
      },
    });

    setIsBatchModalOpen(false);
  };

  const categories = ['Todas', 'Roupas', 'Perfumes', 'Bazar'];

  const filteredProducts = products.filter((p) => {
    const matchesCat = filterCategory === 'Todas' || p.category === filterCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const openNewModal = () => {
    setEditingProduct(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      costPrice: product.costPrice || '',
      price: product.price || '',
      specialPrice: product.specialPrice || '',
      stock: product.stock,
      sizes: product.sizes ? product.sizes.join(', ') : '',
      image: product.image || '',
      description: product.description || '',
      featured: product.featured || false,
      active: product.active !== false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      alert('Por favor, informe ao menos o nome e o preço de venda!');
      return;
    }

    const sizesArray = formData.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const productPayload = {
      ...formData,
      sizes: sizesArray.length > 0 ? sizesArray : ['Único'],
      costPrice: parseFloat(formData.costPrice) || 0,
      price: parseFloat(formData.price) || 0,
      specialPrice: formData.specialPrice ? parseFloat(formData.specialPrice) : null,
      stock: parseInt(formData.stock, 10) || 0,
    };

    if (editingProduct) {
      updateProduct(editingProduct.id, productPayload);
    } else {
      addProduct(productPayload);
    }

    setIsModalOpen(false);
  };

  // Image helpers for quick suggestions
  const setQuickImage = (category) => {
    if (category === 'Roupas') {
      setFormData((prev) => ({
        ...prev,
        image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&auto=format&fit=crop&q=80',
      }));
    } else if (category === 'Perfumes') {
      setFormData((prev) => ({
        ...prev,
        image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=700&auto=format&fit=crop&q=80',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&auto=format&fit=crop&q=80',
      }));
    }
  };

  // Upload and compress image from device camera / file picker
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).');
      return;
    }

    setIsUploadingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 800px to maintain quality while keeping file size small (~60-90kb)
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.84);
        setFormData((prev) => ({ ...prev, image: compressedDataUrl }));
        setIsUploadingImage(false);
      };
      img.onerror = () => {
        setIsUploadingImage(false);
        alert('Erro ao processar a imagem selecionada.');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset input
  };

  // Calculate margin preview
  const cost = parseFloat(formData.costPrice) || 0;
  const sell = parseFloat(formData.price) || 0;
  const profit = sell - cost;
  const marginPct = cost > 0 ? ((profit / cost) * 100).toFixed(0) : 100;

  const modalAddedStock = editingProduct
    ? Math.max(0, (parseInt(formData.stock, 10) || 0) - (editingProduct.stock || 0))
    : (parseInt(formData.stock, 10) || 0);
  const modalCostTotal = modalAddedStock * cost;

  const batchTotal = parseFloat(batchData.totalAmount) || 0;
  const batchPieces = parseInt(batchData.totalPieces, 10) || 0;
  const batchAvgCost = batchPieces > 0 ? +(batchTotal / batchPieces).toFixed(2) : 0;
  const selectedBatchProd = products.find((p) => p.id === batchData.productId);

  return (
    <div>
      <div className="admin-section-header">
        <div className="admin-section-title">
          <h2>Controle de Estoque & Produtos</h2>
          <p>Cadastre roupas, perfumes e variedades, controle unidades e reposições (o custo das peças adicionadas desconta automaticamente do seu Caixa)</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openBatchModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
              borderColor: '#b45309',
              color: '#fff',
              boxShadow: '0 2px 6px rgba(180, 83, 9, 0.25)',
              fontWeight: 600,
            }}
            title="Entrada rápida de compras de roupas em lote ou fardos com cálculo automático do custo médio"
          >
            <Sparkles size={18} />
            📦 Entrada por Lote (Custo Médio)
          </button>

          <button className="btn btn-primary" onClick={openNewModal}>
            <Plus size={18} />
            Cadastrar Novo Produto
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn btn-sm ${filterCategory === cat ? 'btn-secondary' : 'btn-outline'}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar no estoque..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', paddingBottom: '7px', paddingTop: '7px' }}
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Custo</th>
                <th>Venda</th>
                <th>Lucro Unit.</th>
                <th>Estoque</th>
                <th>Variações</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--color-secondary-muted)' }}>
                    Nenhum produto cadastrado com esses critérios.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const unitProfit = (p.price || 0) - (p.costPrice || 0);
                  const isLow = p.stock <= 3;

                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={p.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80'}
                            alt={p.name}
                            style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>{p.name}</div>
                            {p.featured && <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Destaque</span>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="badge badge-secondary">{p.category}</span>
                      </td>

                      <td style={{ color: 'var(--color-secondary-muted)' }}>
                        {formatCurrency(p.costPrice || 0)}
                      </td>

                      <td>
                        <strong style={{ color: 'var(--color-secondary)', fontSize: '0.95rem' }}>
                          {formatCurrency(p.price)}
                        </strong>
                        {p.specialPrice && (
                          <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600 }}>
                            Diferenciado: {formatCurrency(p.specialPrice)}
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{ color: 'var(--color-success-text)', fontWeight: 600 }}>
                          +{formatCurrency(unitProfit)}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => adjustProductStock(p.id, -1)}
                            style={{ color: '#94a3b8' }}
                            title="Diminuir estoque"
                          >
                            <MinusCircle size={18} />
                          </button>
                          <span
                            className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}
                            style={{ minWidth: '34px', justifyContent: 'center' }}
                          >
                            {p.stock} un
                          </span>
                          <button
                            type="button"
                            onClick={() => adjustProductStock(p.id, 1)}
                            style={{ color: 'var(--color-primary)' }}
                            title={p.costPrice ? `Repor +1 un (Debita ${formatCurrency(p.costPrice)} do caixa)` : 'Aumentar estoque (+1 un)'}
                          >
                            <PlusCircle size={18} />
                          </button>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {p.sizes?.map((s, idx) => (
                            <span key={idx} style={{ fontSize: '0.72rem', background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '6px' }}
                            onClick={() => openEditModal(p)}
                            title="Editar produto"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px' }}
                            onClick={() => {
                              if (window.confirm(`Tem certeza que deseja remover ${p.name}?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            title="Excluir produto"
                          >
                            <Trash2 size={15} />
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome do Produto / Descrição Curta:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Vestido Midi Floral, Perfume Silver 100ml, Garrafa Inox..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Categoria:</label>
                    <select
                      className="form-control"
                      value={formData.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setFormData({ ...formData, category: newCat });
                        if (!formData.image) setQuickImage(newCat);
                      }}
                    >
                      <option value="Roupas">👗 Roupas</option>
                      <option value="Perfumes">✨ Perfumes</option>
                      <option value="Bazar">🎁 Bazar & Variedades</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estoque Inicial (unidades):</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Pricing & Profit Calculator */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Preço de Custo (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="Ex: 35.00"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preço de Venda (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="Ex: 79.90"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preço Diferenciado (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="Ex: 69.90 (Opcional)"
                      value={formData.specialPrice}
                      onChange={(e) => setFormData({ ...formData, specialPrice: e.target.value })}
                      title="Preço especial ou promocional configurado para este produto"
                    />
                  </div>
                </div>

                {/* Profit indicator box */}
                {sell > 0 && (
                  <div style={{ background: 'var(--color-success-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.85rem', color: 'var(--color-success-text)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Lucro estimado por peça: <strong>{formatCurrency(profit)}</strong></span>
                    <span>Margem: <strong>+{marginPct}%</strong></span>
                  </div>
                )}

                {/* Cash deduction impact notice */}
                {modalCostTotal > 0 && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '9px 13px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.83rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>💳 <strong>Impacto no Caixa:</strong> Será debitado <strong>{formatCurrency(modalCostTotal)}</strong> do Caixa da loja ({modalAddedStock} {modalAddedStock === 1 ? 'peça adicionada' : 'peças adicionadas'} a {formatCurrency(cost)} de custo cada).</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Variações / Tamanhos (separados por vírgula):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: P, M, G, GG ou 50ml, 100ml ou Único"
                    value={formData.sizes}
                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  />
                </div>

                {/* Photo Upload & Preview Section */}
                <div className="form-group" style={{ background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Camera size={16} color="var(--color-primary)" />
                      <span>Foto do Produto</span>
                    </label>
                    <button
                      type="button"
                      style={{ fontSize: '0.78rem', color: 'var(--color-taupe)', fontWeight: 600 }}
                      onClick={() => setQuickImage(formData.category)}
                    >
                      Preencher foto modelo de {formData.category}
                    </button>
                  </div>

                  {/* Hidden File Input for Native Camera/Gallery Picker */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageFileChange}
                    style={{ display: 'none' }}
                  />

                  {/* Image Preview & Upload Controls */}
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {formData.image ? (
                      <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden', border: '2px solid var(--color-accent)', boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                        <img
                          src={formData.image}
                          alt="Prévia do produto"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, image: '' })}
                          title="Remover foto"
                          style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            background: 'rgba(0,0,0,0.7)',
                            color: '#ffffff',
                            borderRadius: '50%',
                            width: '22px',
                            height: '22px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '90px', height: '90px', borderRadius: '10px', border: '2px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-taupe)', background: '#ffffff', flexShrink: 0 }}>
                        <Camera size={24} />
                        <span style={{ fontSize: '0.68rem', marginTop: '4px' }}>Sem foto</span>
                      </div>
                    )}

                    <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', width: 'fit-content' }}
                      >
                        <Upload size={15} />
                        <span>{isUploadingImage ? 'Carregando foto...' : formData.image ? '📷 Trocar Foto (Celular / PC)' : '📷 Escolher Foto do Celular / PC'}</span>
                      </button>

                      <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                        Selecione da galeria ou tire uma foto na hora com a câmera.
                      </span>

                      {/* Or paste link */}
                      <details style={{ marginTop: '4px' }}>
                        <summary style={{ fontSize: '0.75rem', color: 'var(--color-taupe)', cursor: 'pointer', fontWeight: 600 }}>
                          Ou colar link de imagem da internet (URL)
                        </summary>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://exemplo.com/imagem.jpg"
                          value={formData.image && formData.image.startsWith('data:') ? '' : formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          style={{ marginTop: '6px', fontSize: '0.84rem', padding: '6px 10px' }}
                        />
                      </details>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição / Detalhes do Produto:</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Tecido, fixação, acabamento, instruções de uso..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    />
                    <span>Destacar na vitrine inicial</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    />
                    <span>Produto ativo (visível aos clientes)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <PackageCheck size={18} />
                  {editingProduct ? 'Salvar Alterações' : 'Cadastrar no Estoque'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Entrada por Lote com Custo Médio */}
      {isBatchModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: '#fef3c7', color: '#b45309', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Entrada por Lote com Custo Médio</h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-taupe)' }}>
                    Ideal para compras de roupas em atacado, fardos e lotes de peças variadas
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsBatchModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit}>
              <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                {/* Key Inputs: Total Paid + Total Pieces */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                      Valor Total Pago no Lote (R$)*:
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      className="form-control"
                      placeholder="Ex: 800.00"
                      value={batchData.totalAmount}
                      onChange={(e) => setBatchData({ ...batchData, totalAmount: e.target.value })}
                      required
                      autoFocus
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-danger)' }}>
                      * Será descontado integralmente do Caixa
                    </span>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontWeight: 700, color: 'var(--color-secondary)' }}>
                      Quantidade de Peças*:
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="form-control"
                      placeholder="Ex: 20"
                      value={batchData.totalPieces}
                      onChange={(e) => setBatchData({ ...batchData, totalPieces: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '0.74rem', color: 'var(--color-taupe)' }}>
                      * Total de itens contidos no fardo/lote
                    </span>
                  </div>
                </div>

                {/* Realtime Average Cost Highlight */}
                <div
                  style={{
                    background: batchAvgCost > 0 ? '#ecfdf5' : '#f8fafc',
                    border: `1.5px dashed ${batchAvgCost > 0 ? '#10b981' : '#cbd5e1'}`,
                    padding: '12px 16px',
                    borderRadius: '10px',
                    marginBottom: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Custo Médio Calculado por Peça
                    </span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: batchAvgCost > 0 ? '#059669' : '#94a3b8' }}>
                      {batchAvgCost > 0 ? formatCurrency(batchAvgCost) : 'R$ 0,00'}
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#047857', marginLeft: '6px' }}>/ un</span>
                    </div>
                  </div>
                  {batchAvgCost > 0 && (
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#065f46' }}>
                      <strong>{batchPieces} peças</strong> x {formatCurrency(batchAvgCost)}<br />
                      = <strong>{formatCurrency(batchTotal)}</strong> no total
                    </div>
                  )}
                </div>

                {/* Description and Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Identificação / Fornecedor do Lote:</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Lote Blusinhas e Croppeds - Brás"
                      value={batchData.description}
                      onChange={(e) => setBatchData({ ...batchData, description: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Data da Compra:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={batchData.date}
                      onChange={(e) => setBatchData({ ...batchData, date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Target Mode: How to handle items in stock */}
                <div className="form-group" style={{ background: '#fdf8f4', border: '1px solid #fed7aa', padding: '14px', borderRadius: '10px', marginBottom: '12px' }}>
                  <label className="form-label" style={{ fontWeight: 700, color: '#9a3412', marginBottom: '8px' }}>
                    Como deseja registrar estas peças no estoque?
                  </label>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input
                        type="radio"
                        name="targetMode"
                        value="new_product"
                        checked={batchData.targetMode === 'new_product'}
                        onChange={() => setBatchData({ ...batchData, targetMode: 'new_product' })}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <strong>Cadastrar como novo item/lote no catálogo para venda rápida no PDV</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-taupe)' }}>
                          Cria um produto com as {batchPieces || 0} unidades e o custo médio de {formatCurrency(batchAvgCost)}
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input
                        type="radio"
                        name="targetMode"
                        value="existing_product"
                        checked={batchData.targetMode === 'existing_product'}
                        onChange={() => setBatchData({ ...batchData, targetMode: 'existing_product' })}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <strong>Adicionar peças a um produto de roupa já existente</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-taupe)' }}>
                          Soma as unidades e recalcula o custo médio ponderado do produto
                        </div>
                      </div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input
                        type="radio"
                        name="targetMode"
                        value="cash_only"
                        checked={batchData.targetMode === 'cash_only'}
                        onChange={() => setBatchData({ ...batchData, targetMode: 'cash_only' })}
                        style={{ marginTop: '3px' }}
                      />
                      <div>
                        <strong>Apenas lançar o gasto no caixa agora</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-taupe)' }}>
                          Desconta do caixa e salva o registro nas finanças (você etiqueta e distribui as peças depois)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sub-fields depending on targetMode */}
                {batchData.targetMode === 'new_product' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Nome do Produto / Lote:</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={batchData.description || 'Ex: Roupas Lote Atacado'}
                          value={batchData.newProductName}
                          onChange={(e) => setBatchData({ ...batchData, newProductName: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Preço Sugerido de Venda (R$):</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          placeholder={batchAvgCost > 0 ? `Ex: ${(batchAvgCost * 2).toFixed(2)}` : 'Ex: 79.90'}
                          value={batchData.newProductPrice}
                          onChange={(e) => setBatchData({ ...batchData, newProductPrice: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {batchData.targetMode === 'existing_product' && (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '14px', borderRadius: '10px', marginBottom: '8px' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>Selecione o produto de destino:</label>
                    <select
                      className="form-control"
                      value={batchData.productId}
                      onChange={(e) => setBatchData({ ...batchData, productId: e.target.value })}
                      required
                    >
                      <option value="">Selecione um produto cadastrado...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Atual: {p.stock} un • Custo atual: {formatCurrency(p.costPrice || 0)})
                        </option>
                      ))}
                    </select>

                    {selectedBatchProd && batchAvgCost > 0 && (
                      <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#047857' }}>
                        ✓ Novo estoque total: <strong>{(Number(selectedBatchProd.stock) || 0) + batchPieces} un</strong> • 
                        Novo custo médio: <strong>{formatCurrency(
                          +(((Number(selectedBatchProd.stock) || 0) * (Number(selectedBatchProd.costPrice) || 0) + batchTotal) / 
                          ((Number(selectedBatchProd.stock) || 0) + batchPieces)).toFixed(2)
                        )}/un</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsBatchModalOpen(false)}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: '#059669', borderColor: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <PackageCheck size={18} />
                  Confirmar e Descontar {batchTotal > 0 ? formatCurrency(batchTotal) : ''} do Caixa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
