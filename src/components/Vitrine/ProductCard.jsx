import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { ShoppingBag, MessageCircle } from 'lucide-react';

export const ProductCard = ({ product, onOpenModal }) => {
  const { addToCart, settings } = useStore();
  const halfPrice = +(product.price / 2).toFixed(2);
  const isOutOfStock = product.stock <= 0;

  const handleEncomendarClick = (e) => {
    e.stopPropagation();
    const message = `Olá! Gostaria de encomendar o produto *${product.name}* no valor de ${formatCurrency(product.price)}. Como funciona para fazer o pedido sob encomenda?`;
    const url = generateWhatsAppLink(settings.whatsapp, message);
    window.open(url, '_blank');
  };

  return (
    <div className="product-card">
      <div className="product-image-container" onClick={() => onOpenModal(product)}>
        <img
          src={product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80'}
          alt={product.name}
          className="product-img"
          loading="lazy"
        />
      </div>

      <div className="product-info">
        <h3 className="product-name" onClick={() => onOpenModal(product)}>
          {product.name}
        </h3>
        <p className="product-desc">{product.description}</p>

        {product.sizes && product.sizes.length > 0 && (
          <div className="product-sizes-bar">
            {product.sizes.map((s, idx) => (
              <span key={idx} className="size-pill">
                {s}
              </span>
            ))}
          </div>
        )}

        <div className="product-footer">
          <div className="price-box">
            <span className="price-main">{formatCurrency(product.price)}</span>
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
              onClick={() => (product.sizes?.length > 1 ? onOpenModal(product) : addToCart(product))}
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
