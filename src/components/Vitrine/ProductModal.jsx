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

  const [selectedColor, setSelectedColor] = useState(
    availableColors.length > 0 ? availableColors[0] : null
  );

  let customFrag = null;
  let customPerformance = null;

  if (displayDesc.includes('||FRAG||')) {
    const parts = displayDesc.split('||FRAG||');
    displayDesc = parts[0].trim();
    try {
      const parsed = JSON.parse(parts[1]);
      customPerformance = parsed.performance || null;
      const accordsArr = (parsed.accords || '').split(',').map(s => s.trim()).filter(Boolean);
      
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

      customFrag = accordsArr.length === 0 ? null : {
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

  const isPerfume = product?.category === 'Perfumes' || product?.category?.toLowerCase().includes('perfume');
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

  // Módulo de Desempenho (Longevidade / Rastro)
  const parseVotes = (v) => {
    if (v === null || v === undefined) return 0;
    const s = String(v).trim().toLowerCase().replace(',', '.');
    if (!s) return 0;
    const n = parseFloat(s);
    if (isNaN(n)) return 0;
    return s.endsWith('k') ? Math.round(n * 1000) : Math.round(n);
  };
  const formatVotes = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace('.0', '')}k` : `${n}`);
  const performanceGroups = customPerformance ? [
    {
      key: 'longevidade', title: 'Longevidade', icon: '⏳',
      rows: [
        ['muitoFraco', 'Muito Fraco'], ['fraco', 'Fraco'], ['moderada', 'Moderada'],
        ['longaDuracao', 'Longa Duração'], ['eterno', 'Eterno']
      ]
    },
    {
      key: 'rastro', title: 'Rastro', icon: '💨',
      rows: [['intimo', 'Íntimo'], ['moderada', 'Moderada'], ['forte', 'Forte'], ['enorme', 'Enorme']]
    }
  ].map(g => {
    const rows = g.rows.map(([k, label]) => ({ label, votes: parseVotes(customPerformance[g.key]?.[k]) }));
    const max = Math.max(0, ...rows.map(r => r.votes));
    return { ...g, rows, max };
  }).filter(g => g.max > 0) : [];

  const halfPrice = +(product.price / 2).toFixed(2);
  const isOutOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor);
    onClose();
  };

  const colorNotice = selectedColor ? ` • Cor: ${selectedColor}` : '';
  const whatsappMessage = `Olá! Gostei do produto: *${product.name}* (Tamanho: ${selectedSize}${colorNotice}) por *${formatCurrency(product.price)}*. Ainda está disponível?`;
  const whatsappUrl = generateWhatsAppLink(settings.whatsapp, whatsappMessage);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-product-detail" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
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
          <div className="modal-product-img-wrapper">
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
            {perfumeGender && (
              <div style={{ marginBottom: '8px' }}>
                <span className={`product-badge-gender badge-${perfumeGender}`} style={{ fontSize: '0.78rem', padding: '4px 10px', borderRadius: '8px' }}>
                  {perfumeGender === 'masculino' && '👔 Linha Masculina'}
                  {perfumeGender === 'feminino' && '🌸 Linha Feminina'}
                  {perfumeGender === 'unissex' && '✨ Linha Unissex'}
                </span>
              </div>
            )}
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

          {performanceGroups.length > 0 && (
            <div style={{ background: '#1e1e1e', padding: '16px', borderRadius: '12px', color: '#fff' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: '#a1a1aa', textTransform: 'uppercase', textAlign: 'center', letterSpacing: '2px' }}>Desempenho</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {performanceGroups.map(g => (
                  <div key={g.key} style={{ background: '#27272a', borderRadius: '10px', padding: '12px 14px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '1.3rem' }}>{g.icon}</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>{g.title}</div>
                    </div>
                    {g.rows.map(r => {
                      const isTop = r.votes === g.max;
                      return (
                        <div key={r.label} style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.78rem', color: isTop ? '#fff' : '#d4d4d8', fontWeight: isTop ? 700 : 400 }}>{r.label}</span>
                          <span style={{ fontSize: '0.7rem', color: '#a1a1aa', textAlign: 'right' }}>{formatVotes(r.votes)}</span>
                          <div style={{ height: '6px', background: '#3f3f46', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${g.max ? (r.votes / g.max) * 100 : 0}%`, height: '100%', background: '#14b8a6', borderRadius: '3px', transition: 'width 0.6s ease' }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Color selector */}
          {availableColors && availableColors.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                  🎨 Escolha a Cor:
                </label>
                {selectedColor && (
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                    Cor: {selectedColor}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {availableColors.map((colorName, idx) => {
                  const isSelected = selectedColor === colorName;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedColor(colorName);
                        // Troca de foto se houver foto correspondente à posição da cor
                        if (images[idx]) {
                          setActiveImage(images[idx]);
                        }
                      }}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                        background: isSelected ? 'var(--color-primary-light)' : '#ffffff',
                        fontWeight: 700,
                        color: isSelected ? 'var(--color-primary-hover)' : 'var(--color-secondary)',
                        fontSize: '0.88rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSelected && <Check size={14} />}
                      {colorName}
                    </button>
                  );
                })}
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
                (À vista, Cartão de Crédito ou Débito)
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer modal-product-footer" style={{ justifyContent: 'space-between' }}>
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
                `Olá! Gostaria de encomendar o produto: *${product.name}* (Tamanho: ${selectedSize}${colorNotice}) no valor de ${formatCurrency(product.price)}. Como funciona para fazer o pedido sob encomenda?`
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
