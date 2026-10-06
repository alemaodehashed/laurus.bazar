import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { X, ShoppingBag, MessageCircle, Check, Clock } from 'lucide-react';
import { getPerfumeProfile } from '../../data/perfumesDb';

export const ProductModal = ({ product, onClose }) => {
  const { addToCart, settings } = useStore();
  const [selectedSize, setSelectedSize] = useState(
    product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Único'
  );

  const images = product?.image ? product.image.split('|||').filter(Boolean) : ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80'];
  const [activeImage, setActiveImage] = useState(images[0]);

  if (!product) return null;

  let displayDesc = product.description || '';
  let customFrag = null;

  if (displayDesc.includes('||FRAG||')) {
    const parts = displayDesc.split('||FRAG||');
    displayDesc = parts[0].trim();
    try {
      const parsed = JSON.parse(parts[1]);
      const accordsArr = parsed.accords.split(',').map(s => s.trim()).filter(Boolean);
      
      const getAccordColor = (name) => {
        const map = {
          'amadeirado': '#78350f', 'fresco especiado': '#84cc16', 'doce': '#f472b6',
          'especiado quente': '#c2410c', 'frutado': '#ef4444', 'floral': '#f472b6',
          'citrinos': '#facc15', 'almiscarado': '#9ca3af', 'aromático': '#14b8a6',
          'baunilha': '#fef08a', 'âmbar': '#d97706', 'couro': '#451a03',
          'rosa': '#f43f5e', 'patchouli': '#166534', 'esfumaçado': '#4b5563',
          'atalcado': '#d6d3d1'
        };
        return map[name.toLowerCase()] || '#3b82f6';
      };

      customFrag = {
        accords: accordsArr.map((a, idx) => ({
           name: a,
           color: getAccordColor(a),
           width: `${Math.max(40, 100 - (idx * 15))}%`
        })),
        seasons: parsed.seasons
      };
    } catch(e) {}
  }

  const perfumeProfile = customFrag || (product?.category === 'Perfumes' ? getPerfumeProfile(product.name) : null);

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
              src={activeImage}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '-12px' }}>
              {images.map((imgUrl, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImage(imgUrl)}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: activeImage === imgUrl ? '2px solid var(--color-primary)' : '2px solid transparent',
                    cursor: 'pointer',
                    opacity: activeImage === imgUrl ? 1 : 0.6,
                    transition: 'all 0.2s'
                  }}
                >
                  <img src={imgUrl} alt={`Thumb ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--color-secondary)', marginBottom: '8px' }}>
              {product.name}
            </h2>
            <p style={{ color: 'var(--color-secondary-muted)', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {displayDesc}
            </p>
          </div>

          {perfumeProfile && (
            <div style={{ marginTop: '0px', background: '#1e1e1e', padding: '16px', borderRadius: '12px', color: '#fff' }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: '#a1a1aa', textTransform: 'uppercase' }}>Principais Acordes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {perfumeProfile.accords.map((accord, i) => (
                    <div key={i} style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                      <div style={{
                        background: accord.color,
                        width: accord.width,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: ['#fef08a', '#facc15'].includes(accord.color) ? '#000' : '#fff',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textShadow: ['#fef08a', '#facc15'].includes(accord.color) ? 'none' : '0px 1px 2px rgba(0,0,0,0.4)',
                        textAlign: 'center'
                      }}>
                        {accord.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: '#a1a1aa', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#facc15' }}>🕒</span> Quando Usar
                </h4>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', textAlign: 'center', flexWrap: 'wrap' }}>
                  {Object.entries(perfumeProfile.seasons).map(([season, value]) => {
                    const colors = {
                      inverno: '#38bdf8', primavera: '#a3e635', verao: '#fca5a5',
                      outono: '#fb923c', dia: '#facc15', noite: '#60a5fa'
                    };
                    const labels = {
                      inverno: 'Inverno', primavera: 'Primavera', verao: 'Verão',
                      outono: 'Outono', dia: 'Dia', noite: 'Noite'
                    };
                    const icons = {
                      inverno: '❄️', primavera: '🍃', verao: '🏖️',
                      outono: '🍂', dia: '☀️', noite: '🌙'
                    };
                    return (
                      <div key={season} style={{ flex: 1, minWidth: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: '4px', opacity: value < 30 ? 0.3 : 1, filter: value < 30 ? 'grayscale(100%)' : 'none' }}>{icons[season]}</div>
                        <div style={{ fontSize: '0.65rem', color: '#a1a1aa', marginBottom: '4px' }}>{labels[season]}</div>
                        <div style={{ width: '100%', height: '4px', background: '#3f3f46', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${value}%`, height: '100%', background: colors[season] }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

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
