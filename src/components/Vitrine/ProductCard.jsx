import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { ShoppingBag, MessageCircle } from 'lucide-react';

export const ProductCard = ({ product, onOpenModal }) => {
  const { addToCart, settings } = useStore();
  const halfPrice = +(product.price / 2).toFixed(2);
  const isOutOfStock = product.stock <= 0;
  const coverImage = product.image ? product.image.split('|||')[0] : 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80';

  const handleEncomendarClick = (e) => {
    e.stopPropagation();
    const message = `Olá! Gostaria de encomendar o produto *${product.name}* no valor de ${formatCurrency(product.price)}. Como funciona para fazer o pedido sob encomenda?`;
    const url = generateWhatsAppLink(settings.whatsapp, message);
    window.open(url, '_blank');
  };

  let displayDesc = product.description || '';
  let availableColors = [];

  if (displayDesc.includes('||COLORS||')) {
    const cParts = displayDesc.split('||COLORS||');
    displayDesc = cParts[0].trim();
    try {
      const parsedColors = JSON.parse(cParts[1].split('||FRAG||')[0]);
      availableColors = Array.isArray(parsedColors) ? parsedColors : [];
    } catch (e) {}
  } else if (product.colors && Array.isArray(product.colors)) {
    availableColors = product.colors;
  }

  if (displayDesc.includes('||COLOR_STOCK||')) {
    displayDesc = displayDesc.split('||COLOR_STOCK||')[0].trim();
  }

  if (displayDesc.includes('||FRAG||')) {
    displayDesc = displayDesc.split('||FRAG||')[0].trim();
  }

  if (displayDesc.includes('||PROMO||')) {
    displayDesc = displayDesc.split('||PROMO||')[0].trim();
  }

  let originalPrice = product.originalPrice || null;
  if (!originalPrice && product.description?.includes('||PROMO||')) {
    try {
      const promoData = JSON.parse(product.description.split('||PROMO||')[1].split('\n')[0].split('||FRAG||')[0].split('||COLORS||')[0]);
      originalPrice = Number(promoData.originalPrice) || null;
    } catch (e) {}
  }
  const hasPromo = Boolean(originalPrice && originalPrice > product.price);
  const discountPct = hasPromo ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;

  const isPerfume = product.category === 'Perfumes' || product.category?.toLowerCase().includes('perfume');
  let perfumeGender = null;
  if (isPerfume) {
    const dLower = (product.description || '').toLowerCase();
    const sLower = (product.sizes || []).join(' ').toLowerCase();
    if (dLower.includes('gênero: masculino') || dLower.includes('genero: masculino') || sLower.includes('masc')) {
      perfumeGender = 'masculino';
    } else if (dLower.includes('gênero: feminino') || dLower.includes('genero: feminino') || sLower.includes('fem')) {
      perfumeGender = 'feminino';
    } else if (dLower.includes('unisex') || dLower.includes('unissex') || sLower.includes('unisex') || sLower.includes('unissex')) {
      perfumeGender = 'unissex';
    } else if (dLower.includes('masculino')) {
      perfumeGender = 'masculino';
    } else if (dLower.includes('feminino')) {
      perfumeGender = 'feminino';
    } else {
      perfumeGender = 'unissex';
    }
  }

  return (
    <div className="product-card">
      <div className="product-image-container" onClick={() => onOpenModal(product)}>
        <img
          src={coverImage}
          alt={product.name}
          className="product-img"
          loading="lazy"
        />
        <div className="product-badges-corner">
          {product.featured && (
            <span className="product-badge-destaque">
              ⭐ Destaque
            </span>
          )}
          {hasPromo && (
            <span className="product-badge-promo">
              🔥 -{discountPct}% OFF
            </span>
          )}
          {perfumeGender && (
            <span className={`product-badge-gender badge-${perfumeGender}`}>
              {perfumeGender === 'masculino' && '👔 Masc'}
              {perfumeGender === 'feminino' && '🌸 Fem'}
              {perfumeGender === 'unissex' && '✨ Unisex'}
            </span>
          )}
        </div>
      </div>

      <div className="product-info">
        <h3 className="product-name" onClick={() => onOpenModal(product)}>
          {product.name}
        </h3>
        <p className="product-desc">{displayDesc}</p>

        {product.sizes && product.sizes.length > 0 && (
          <div className="product-sizes-bar">
            {product.sizes.map((s, idx) => (
              <span key={idx} className="size-pill">
                {s}
              </span>
            ))}
          </div>
        )}

        {availableColors && availableColors.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '6px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Cores:</span>
            {availableColors.slice(0, 3).map((c, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#334155',
                  fontWeight: 500
                }}
              >
                {c}
              </span>
            ))}
            {availableColors.length > 3 && (
              <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 600 }}>
                +{availableColors.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="product-footer">
          <div className="price-box">
            {hasPromo ? (
              <div className="price-promo-container">
                <span className="price-de">De {formatCurrency(originalPrice)}</span>
                <span className="price-main price-por">Por {formatCurrency(product.price)}</span>
              </div>
            ) : (
              <span className="price-main">{formatCurrency(product.price)}</span>
            )}
            <span className="price-installment">
              ou 2x de {formatCurrency(halfPrice)}
            </span>
            <span
              className={`stock-indicator ${isOutOfStock ? 'out-of-stock' : ''}`}
              style={isOutOfStock ? { color: '#b45309', fontWeight: 600 } : {}}
            >
              {isOutOfStock ? '📦 Sob Encomenda' : `${product.stock} un disponíveis`}
            </span>
          </div>

          {isOutOfStock ? (
            <button
              type="button"
              className="btn btn-warning btn-sm"
              style={{
                background: '#d97706',
                borderColor: '#b45309',
                color: '#fff',
                fontSize: '0.78rem',
                padding: '5px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700
              }}
              onClick={handleEncomendarClick}
              title="Pedir este produto sob encomenda via WhatsApp"
            >
              <MessageCircle size={14} />
              Encomendar
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => ((product.sizes?.length > 1 || availableColors.length > 0) ? onOpenModal(product) : addToCart(product))}
              title="Adicionar à sacola"
            >
              <ShoppingBag size={16} />
              Pedir
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
