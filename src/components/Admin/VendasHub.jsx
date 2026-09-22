import React, { useState } from 'react';
import { PdvVendas } from './PdvVendas';
import { FiadoManager } from './FiadoManager';
import { ShoppingCart, Clock } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const VendasHub = ({ initialSubTab = 'pdv' }) => {
  const [subTab, setSubTab] = useState(initialSubTab);
  const { sales } = useStore();

  const pendingFiadoCount = sales.reduce((acc, sale) => {
    if (sale.paymentMethod === 'boca_2x' && sale.installments) {
      return acc + sale.installments.filter((i) => !i.paid).length;
    }
    return acc;
  }, 0);

  return (
    <div>
      {/* Sub navigation pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${subTab === 'pdv' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem' }}
          onClick={() => setSubTab('pdv')}
        >
          <ShoppingCart size={18} />
          Caixa / Nova Venda (PDV)
        </button>

        <button
          type="button"
          className={`btn ${subTab === 'fiado' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem' }}
          onClick={() => setSubTab('fiado')}
        >
          <Clock size={18} />
          Parcelas a Receber, Fiado & Histórico {pendingFiadoCount > 0 && `(${pendingFiadoCount})`}
        </button>
      </div>

      {subTab === 'pdv' && <PdvVendas onSaleCompleted={() => setSubTab('fiado')} />}
      {subTab === 'fiado' && <FiadoManager />}
    </div>
  );
};
