import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { X, ShoppingBag, MessageCircle, Check, Clock } from 'lucide-react';

export const ProductModal = ({ product, onClose }) => {
  const { addToCart, settings } = useStore();
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Único'
  );

  if (!product) return null;

  const halfPrice = +(product.price / 2).toFixed(2);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    addToCart(product, selectedSize);
    onClose();
  };

  const whatsappMessage = `Olá! Gostei do produto: *${product.name}* (Variação/Tamanho: ${selectedSize}) por *${formatCurrency(product.price)}*. Ainda está disponível?`;
  const whatsappUrl = generateWhatsAppLink(settings.whatsapp, whatsappMessage);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-warning">{product.category}</span>
            {isOutOfStock ? (
              <span className="badge badge-danger" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }}>
                📦 Sob Encomenda
              </span>
            ) : (
              <span className="badge badge-success">
                ✓ {product.stock} un em Estoque
              </span>
            )}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ width: '100%', height: '300px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
            <img
              src={product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80'}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--color-secondary)', marginBottom: '8px' }}>
              {product.name}
            </h2>
            <p style={{ color: 'var(--color-secondary-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              {product.description}
            </p>
          </div>

          {/* Size / Variation selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '8px' }}>
                Escolha o Tamanho / Variação:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.sizes.map((s, idx) => {
                  const isSelected = selectedSize === s;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        background: isSelected ? 'var(--color-primary-light)' : '#ffffff',
                        fontWeight: 700,
                        color: isSelected ? 'var(--color-primary-hover)' : 'var(--color-secondary)',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {isSelected && <Check size={14} />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing & Installment details */}
          <div style={{ background: 'var(--bg-subtle)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-secondary-muted)' }}>Preço à vista:</div>
              <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--color-secondary)', fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(product.price)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="badge badge-warning" style={{ marginBottom: '4px' }}>Facilidade</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--color-primary-hover)' }}>
                Ou 2x de {formatCurrency(halfPrice)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-secondary-muted)' }}>
                (À vista, Cartão ou no Carnê da Família)
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
            style={{ textDecoration: 'none' }}
          >
            <MessageCircle size={18} />
            Dúvida no WhatsApp
          </a>

          {isOutOfStock ? (
            <a
              href={generateWhatsAppLink(
                settings.whatsapp,
                `Olá! Gostaria de encomendar o produto: *${product.name}* (Variação: ${selectedSize}) no valor de ${formatCurrency(product.price)}. Como funciona para fazer o pedido sob encomenda?`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-warning"
              style={{
                background: '#d97706',
                borderColor: '#b45309',
                color: '#fff',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none'
              }}
            >
              <Clock size={18} />
              Encomendar no WhatsApp
            </a>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleAddToCart}
            >
              <ShoppingBag size={18} />
              Adicionar ao Carrinho
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
