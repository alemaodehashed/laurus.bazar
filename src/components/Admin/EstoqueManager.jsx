import React, { useState } from 'react';
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
  PackageCheck
} from 'lucide-react';

export const EstoqueManager = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustProductStock } = useStore();
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form State
  const initialFormState = {
    name: '',
    category: 'Roupas',
    costPrice: '',
    price: '',
    stock: 1,
    sizes: 'P, M, G',
    image: '',
    description: '',
    featured: false,
    active: true,
  };

  const [formData, setFormData] = useState(initialFormState);

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

  // Calculate margin preview
  const cost = parseFloat(formData.costPrice) || 0;
  const sell = parseFloat(formData.price) || 0;
  const profit = sell - cost;
  const marginPct = cost > 0 ? ((profit / cost) * 100).toFixed(0) : 100;

  return (
    <div>
      <div className="admin-section-header">
        <div className="admin-section-title">
          <h2>Controle de Estoque & Produtos</h2>
          <p>Cadastre roupas, perfumes e variedades, atualize preços e controle unidades</p>
        </div>

        <button className="btn btn-primary" onClick={openNewModal}>
          <Plus size={18} />
          Cadastrar Novo Produto
        </button>
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
                            title="Aumentar estoque"
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                </div>

                {/* Profit indicator box */}
                {sell > 0 && (
                  <div style={{ background: 'var(--color-success-bg)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', color: 'var(--color-success-text)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Lucro estimado por peça: <strong>{formatCurrency(profit)}</strong></span>
                    <span>Margem: <strong>+{marginPct}%</strong></span>
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

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label">Link da Imagem / Foto:</label>
                    <button
                      type="button"
                      style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}
                      onClick={() => setQuickImage(formData.category)}
                    >
                      Preencher foto modelo de {formData.category}
                    </button>
                  </div>
                  <input
                    type="url"
                    className="form-control"
                    placeholder="https://..."
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  />
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
    </div>
  );
};
