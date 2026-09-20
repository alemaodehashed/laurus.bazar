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
  Tag
} from 'lucide-react';

export const VitrinePage = ({ onOpenAdminLogin }) => {
  const { products, settings, cart, setIsCartOpen } = useStore();
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = ['Todas', 'Roupas', 'Perfumes', 'Bazar'];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      const matchesCategory =
        selectedCategory === 'Todas' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="vitrine-page">
      {/* Top Announcement Bar */}
      <div className="top-announcement">
        <div className="top-announcement-content">
          <Sparkles size={16} color="#fbbf24" />
          <span>Bazar da Família: Roupas, Perfumes & Variedades com facilidade no pagamento!</span>
        </div>
        <a
          href={generateWhatsAppLink(settings.whatsapp, 'Olá! Gostaria de tirar uma dúvida sobre o bazar.')}
          target="_blank"
          rel="noopener noreferrer"
          className="top-announcement-link"
        >
          <Phone size={14} />
          <span>Fale Conosco: WhatsApp</span>
        </a>
      </div>

      {/* Main Header */}
      <header className="vitrine-header">
        <div className="vitrine-header-container">
          <div className="store-brand">
            <div className="brand-logo-wrapper">
              <img src="/logo.jpg" alt="Laurus Bazar - Brasão da Família" className="brand-logo-img" />
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
              placeholder="Buscar perfumes, fragrâncias, roupas, utilidades..."
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
              <span>Sacola</span>
              {totalCartCount > 0 && <span className="cart-badge">{totalCartCount}</span>}
            </button>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onOpenAdminLogin}
              title="Acessar painel interno da família"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Lock size={15} />
              <span>Área da Família</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="vitrine-hero">
        <div className="hero-container" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '32px' }}>
          <div style={{ flex: 1 }}>
            <div className="hero-pill">
              <Tag size={14} />
              <span>Laurus Bazar • Família Adam</span>
            </div>
            <h2 className="hero-title">
              O melhor da perfumaria importada e variedades selecionadas para você.
            </h2>
            <p className="hero-subtitle">
              Perfumes árabes refinados (Lattafa, Asdaaf, Armaf, Rasasi) e importados exclusivos. Fotos reais, amostras disponíveis e pagamento facilitado no carnê da casa.
            </p>

            <div className="hero-highlights">
              <div className="highlight-item">
                <CreditCard size={18} />
                <span>À vista, Cartão de Crédito ou Débito</span>
              </div>
              <div className="highlight-item">
                <CalendarCheck size={18} />
                <span>Pagamento facilitado em até 2x de boca</span>
              </div>
              <div className="highlight-item">
                <ShieldCheck size={18} />
                <span>Atendimento direto e familiar</span>
              </div>
            </div>
          </div>

          <div className="hero-logo-showcase">
            <img src="/logo.jpg" alt="Brasão da Família Laurus" className="hero-logo-img" />
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
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'Roupas' && '👗 Roupas'}
              {cat === 'Perfumes' && '✨ Perfumes'}
              {cat === 'Bazar' && '🎁 Bazar & Variedades'}
              {cat === 'Todas' && '✨ Todos os Produtos'}
            </button>
          ))}
        </div>

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
                  <span>Em até 2x no carnê da casa (de boca)</span>
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
