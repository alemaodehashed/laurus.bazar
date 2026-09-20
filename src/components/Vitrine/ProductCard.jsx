import React from 'react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/formatters';
import { ShoppingBag, Eye } from 'lucide-react';

export const ProductCard = ({ product, onOpenModal }) => {
  const { addToCart } = useStore();
  const halfPrice = +(product.price / 2).toFixed(2);
  const isOutOfStock = product.stock <= 0;

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
            <span className={`stock-indicator ${isOutOfStock ? 'out-of-stock' : ''}`}>
              {isOutOfStock ? 'Esgotado' : `${product.stock} un disponíveis`}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => (product.sizes?.length > 1 ? onOpenModal(product) : addToCart(product))}
            disabled={isOutOfStock}
            title={isOutOfStock ? 'Produto indisponível' : 'Adicionar ao pedido'}
          >
            <ShoppingBag size={16} />
            {isOutOfStock ? 'Esgotado' : 'Pedir'}
          </button>
        </div>
      </div>
    </div>
  );
};
