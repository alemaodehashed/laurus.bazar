import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, generateWhatsAppLink } from '../../utils/formatters';
import { X, Trash2, Plus, Minus, MessageCircle, ShoppingBag } from 'lucide-react';

export const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, updateCartQuantity, removeFromCart, clearCart, settings } = useStore();

  if (!isCartOpen) return null;

  const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const halfTotal = +(total / 2).toFixed(2);

  const buildWhatsAppMessage = () => {
    let msg = `🛍️ *Novo Pedido - ${settings.storeName}*\n\n`;
    msg += `Olá! Gostaria de reservar os seguintes itens da vitrine:\n\n`;

    cart.forEach((item, index) => {
      msg += `${index + 1}. *${item.product.name}*\n`;
      msg += `   • Variação: ${item.selectedSize}\n`;
      msg += `   • Qtd: ${item.quantity}x de ${formatCurrency(item.product.price)} = ${formatCurrency(item.product.price * item.quantity)}\n\n`;
    });

    msg += `----------------------------\n`;
    msg += `💰 *Total: ${formatCurrency(total)}*\n`;
    msg += `💳 *Opção de Pagamento desejada:* ( ) À vista / PIX  ( ) Cartão  ( ) Em 2x no carnê\n\n`;
    msg += `Como podemos combinar a entrega/retirada?`;

    return msg;
  };

  const handleCheckoutWhatsApp = () => {
    const msg = buildWhatsAppMessage();
    const url = generateWhatsAppLink(settings.whatsapp, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag size={22} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--color-secondary)' }}>
              Minha Sacola ({cart.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>
          </div>
          <button className="modal-close-btn" onClick={() => setIsCartOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
            <ShoppingBag size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <h4 style={{ color: 'var(--color-secondary)', marginBottom: '6px' }}>Sua sacola está vazia</h4>
            <p style={{ color: 'var(--color-secondary-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Explore nossa vitrine de roupas, perfumes e utilidades e adicione seus favoritos!
            </p>
            <button className="btn btn-outline btn-sm" onClick={() => setIsCartOpen(false)}>
              Continuar Vendo Produtos
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {cart.map((item, idx) => (
                <div key={`${item.product.id}_${item.selectedSize}_${idx}`} className="cart-item">
                  <img
                    src={item.product.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&auto=format&fit=crop&q=80'}
                    alt={item.product.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <div>
                      <div className="cart-item-title">{item.product.name}</div>
                      <div className="cart-item-size">Variação: {item.selectedSize}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="cart-item-qty">
                        <button
                          className="qty-btn"
                          onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                          {item.quantity}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => updateCartQuantity(item.product.id, item.selectedSize, item.quantity + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id, item.selectedSize)}
                          style={{ color: '#94a3b8', padding: '4px', borderRadius: '4px' }}
                          title="Remover item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={clearCart}
                  style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Trash2 size={14} /> Esvaziar Sacola
                </button>
              </div>
            </div>

            <div className="cart-footer">
              <div className="cart-total-row">
                <span>Total dos Produtos:</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(total)}</span>
              </div>

              <div className="cart-installment-notice">
                Ou pague em até <strong>2x de {formatCurrency(halfTotal)}</strong> no carnê da casa!
              </div>

              <button
                type="button"
                className="btn btn-whatsapp"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                onClick={handleCheckoutWhatsApp}
              >
                <MessageCircle size={20} />
                Finalizar Pedido pelo WhatsApp
              </button>

              <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-secondary-muted)' }}>
                Ao clicar, você será direcionado para conversar direto com a nossa família.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
