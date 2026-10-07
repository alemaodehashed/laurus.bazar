import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { ProductCard } from './ProductCard';
import { ProductModal } from './ProductModal';
import { CartDrawer } from './CartDrawer';
import { formatWhatsAppNumber, generateWhatsAppLink } from '../../utils/formatters';
import {
  ShoppingBag,
  Search,
  Lock,
  Sparkles,
  Phone,
  CreditCard,
  CalendarCheck,
  ShieldCheck,
  CheckCircle,
  Tag,
  Repeat
} from 'lucide-react';

export const getPerfumeGender = (p) => {
  if (!p || (p.category !== 'Perfumes' && !p.category?.toLowerCase().includes('perfume'))) return null;
  const desc = (p.description || '').toLowerCase();
  const sizes = (p.sizes || []).join(' ').toLowerCase();
  const cat = (p.category || '').toLowerCase();
  if (desc.includes('gênero: masculino') || desc.includes('genero: masculino') || sizes.includes('masc') || cat.includes('masculin')) return 'masculino';
  if (desc.includes('gênero: feminino') || desc.includes('genero: feminino') || sizes.includes('fem') || cat.includes('feminin')) return 'feminino';
  if (desc.includes('unisex') || desc.includes('unissex') || sizes.includes('unisex') || sizes.includes('unissex')) return 'unissex';
  if (desc.includes('masculino')) return 'masculino';
  if (desc.includes('feminino')) return 'feminino';
  return 'unissex';
};

export const VitrinePage = ({ onOpenAdminLogin }) => {
  const { products, settings, cart, setIsCartOpen } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [perfumeGenderFilter, setPerfumeGenderFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = ['Todas', 'Destaques', 'Roupas Femininas', 'Roupas Masculinas', 'Perfumes', 'Bazar'];

  const perfumeCounts = useMemo(() => {
    const activePerfumes = products.filter(
      (p) => p.active && (p.category === 'Perfumes' || p.category?.toLowerCase().includes('perfume'))
    );
    let masc = 0;
    let fem = 0;
    let uni = 0;
    activePerfumes.forEach((p) => {
      const g = getPerfumeGender(p);
      if (g === 'masculino') masc++;
      else if (g === 'feminino') fem++;
      else uni++;
    });
    return {
      todos: activePerfumes.length,
      masculino: masc,
      feminino: fem,
      unissex: uni,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      let matchesCategory = false;
      if (selectedCategory === 'Todas') {
        matchesCategory = true;
      } else if (selectedCategory === 'Destaques') {
        matchesCategory = Boolean(p.featured);
      } else if (selectedCategory === 'Roupas Femininas') {
        const catLower = p.category?.toLowerCase() || '';
        matchesCategory = catLower === 'roupas femininas' || catLower === 'roupas';
      } else if (selectedCategory === 'Perfumes') {
        const isPerf = p.category?.toLowerCase() === 'perfumes' || p.category?.toLowerCase().includes('perfume');
        if (!isPerf) {
          matchesCategory = false;
        } else if (perfumeGenderFilter === 'todos') {
          matchesCategory = true;
        } else {
          matchesCategory = getPerfumeGender(p) === perfumeGenderFilter;
        }
      } else {
        matchesCategory = p.category?.toLowerCase() === selectedCategory.toLowerCase();
      }

      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery, perfumeGenderFilter]);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="vitrine-page">
      {/* Top Announcement Bar */}
      <div className="top-announcement">
        <div className="top-announcement-content">
          <Sparkles size={15} color="var(--color-accent)" />
          <span>Promoção do Mês</span>
        </div>
        <a
          href={generateWhatsAppLink(settings.whatsapp, 'Olá! Gostaria de tirar uma dúvida sobre o bazar.')}
          target="_blank"
          rel="noopener noreferrer"
          className="top-announcement-link"
        >
          <Phone size={13} />
          <span>WhatsApp da Loja</span>
        </a>
      </div>

      {/* Main Header */}
      <header className="vitrine-header">
        <div className="vitrine-header-container">
          <div className="store-brand">
            <div className="brand-logo-wrapper">
              <img src="/monogram.png" alt="Laurus - Monograma Oficial LL" className="brand-logo-img" />
            </div>
            <div className="brand-text">
              <h1>{settings.storeName}</h1>
              <p>{settings.storeSubtitle}</p>
            </div>
          </div>

          <div className="header-search">
            <Search size={18} className="header-search-icon" />
            <input
              type="text"
              placeholder="Buscar perfumes, roupas, utilidades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <button
              className="cart-button"
              onClick={() => setIsCartOpen(true)}
              title="Abrir sacola de compras"
            >
              <ShoppingBag size={18} color="var(--color-primary)" />
              <span className="cart-button-label">Sacola</span>
              {totalCartCount > 0 && <span className="cart-badge">{totalCartCount}</span>}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm header-admin-btn"
              onClick={onOpenAdminLogin}
              title="Acessar painel interno da família"
            >
              <Lock size={15} />
              <span className="header-admin-label">Área da Família</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="vitrine-hero">
        <div className="hero-container">
          <div style={{ flex: 1 }}>
            <div className="hero-pill">
              <Tag size={14} />
              <span>Laurus • Família Adam</span>
            </div>
            <h2 className="hero-title">
              O que você precisa, nós temos.
            </h2>
            <p className="hero-subtitle">
              Nossa loja é pioneira em logística reversa, trazendo o melhor da perfumaria importada e árabe, moda feminina e masculina e variedades selecionadas com total confiança e agilidade.
            </p>

            <div className="hero-highlights">
              <div className="highlight-item">
                <CreditCard size={18} />
                <span>À vista, Cartão de Crédito ou Débito</span>
              </div>
              <div className="highlight-item">
                <Repeat size={18} />
                <span>Pioneira em Logística Reversa</span>
              </div>
              <div className="highlight-item">
                <ShieldCheck size={18} />
                <span>Atendimento direto e familiar</span>
              </div>
            </div>
          </div>

          <div className="hero-logo-showcase" title="Monograma Oficial da Família">
            <img src="/monogram.png" alt="Monograma da Família Laurus" className="hero-logo-img" />
          </div>
        </div>
      </section>

      {/* Main Catalog Body */}
      <main className="vitrine-content">
        {/* Category filters */}
        <div className="category-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''} ${cat === 'Destaques' ? 'category-btn-destaque' : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                if (cat !== 'Perfumes') setPerfumeGenderFilter('todos');
              }}
            >
              {cat === 'Todas' && (
                <>
                  <span className="cat-label-full">✨ Todos os Produtos</span>
                  <span className="cat-label-mobile">✨ Todos</span>
                </>
              )}
              {cat === 'Destaques' && (
                <>
                  <span className="cat-label-full">⭐ Em Destaque</span>
                  <span className="cat-label-mobile">⭐ Destaques</span>
                </>
              )}
              {cat === 'Roupas Femininas' && (
                <>
                  <span className="cat-label-full">👗 Roupas Femininas</span>
                  <span className="cat-label-mobile">👗 Roupas Fem</span>
                </>
              )}
              {cat === 'Roupas Masculinas' && (
                <>
                  <span className="cat-label-full">👕 Roupas Masculinas</span>
                  <span className="cat-label-mobile">👕 Roupas Masc</span>
                </>
              )}
              {cat === 'Perfumes' && (
                <>
                  <span className="cat-label-full">💎 Perfumes</span>
                  <span className="cat-label-mobile">💎 Perfumes</span>
                </>
              )}
              {cat === 'Bazar' && (
                <>
                  <span className="cat-label-full">🎁 Bazar & Variedades</span>
                  <span className="cat-label-mobile">🎁 Bazar</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Perfume Gender Sub-filter Bar (appears when Perfumes is selected) */}
        {selectedCategory === 'Perfumes' && (
          <div className="perfume-subfilter-wrapper">
            <div className="perfume-subfilter-header">
              <span>Linha:</span>
            </div>
            <div className="perfume-subfilter-bar">
              <button
                type="button"
                className={`perfume-sub-pill ${perfumeGenderFilter === 'todos' ? 'active' : ''}`}
                onClick={() => setPerfumeGenderFilter('todos')}
              >
                <span>✨ Todos</span>
                <span className="perfume-sub-badge">{perfumeCounts.todos}</span>
              </button>
              <button
                type="button"
                className={`perfume-sub-pill pill-masc ${perfumeGenderFilter === 'masculino' ? 'active' : ''}`}
                onClick={() => setPerfumeGenderFilter('masculino')}
              >
                <span>👔 Masculinos</span>
                <span className="perfume-sub-badge">{perfumeCounts.masculino}</span>
              </button>
              <button
                type="button"
                className={`perfume-sub-pill pill-fem ${perfumeGenderFilter === 'feminino' ? 'active' : ''}`}
                onClick={() => setPerfumeGenderFilter('feminino')}
              >
                <span>🌸 Femininos</span>
                <span className="perfume-sub-badge">{perfumeCounts.feminino}</span>
              </button>
              <button
                type="button"
                className={`perfume-sub-pill pill-unissex ${perfumeGenderFilter === 'unissex' ? 'active' : ''}`}
                onClick={() => setPerfumeGenderFilter('unissex')}
              >
                <span>🌟 Unissex</span>
                <span className="perfume-sub-badge">{perfumeCounts.unissex}</span>
              </button>
            </div>
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <ShoppingBag size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--color-secondary)', marginBottom: '8px' }}>Nenhum produto encontrado</h3>
            <p style={{ color: 'var(--color-secondary-muted)', fontSize: '0.95rem', marginBottom: '16px' }}>
              Não encontramos itens na categoria "{selectedCategory}" para a busca "{searchQuery}".
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setSelectedCategory('Todas');
                setSearchQuery('');
              }}
            >
              Ver todos os produtos
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenModal={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer />

      {/* Vitrine Footer */}
      <footer className="vitrine-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div style={{ maxWidth: '360px' }}>
              <h3 style={{ color: '#ffffff', fontSize: '1.2rem', marginBottom: '8px' }}>
                {settings.storeName}
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Bazar familiar completo com moda feminina e masculina, perfumaria importada e nacional, e variedades para o seu dia a dia.
              </p>
            </div>

            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '12px' }}>Formas de Pagamento</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10b981" />
                  <span>PIX e Dinheiro (à vista)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10b981" />
                  <span>Cartões de Débito e Crédito</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={15} color="#10b981" />
                  <span>Logística Reversa & Trocas Ágeis</span>
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ color: '#ffffff', fontSize: '0.95rem', marginBottom: '12px' }}>Atendimento</h4>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '10px' }}>
                Tire dúvidas sobre tamanhos, fotos adicionais ou combine a entrega:
              </p>
              <a
                href={generateWhatsAppLink(settings.whatsapp, 'Olá! Gostaria de informações sobre os produtos do bazar.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-sm"
              >
                <Phone size={15} />
                Chamar no WhatsApp
              </a>
            </div>
          </div>

          <div className="footer-copy">
            <div>
              © {new Date().getFullYear()} {settings.storeName} - Todos os direitos reservados.
            </div>

            <button
              type="button"
              className="btn-admin-access"
              onClick={onOpenAdminLogin}
            >
              <Lock size={14} />
              <span>Painel Administrativo da Família</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
