import React, { useState } from 'react';
import { EstoqueManager } from './EstoqueManager';
import { DespesasManager } from './DespesasManager';
import { ShoppingBag, TrendingDown } from 'lucide-react';

export const EstoqueHub = ({ initialSubTab = 'produtos' }) => {
  const [subTab, setSubTab] = useState(initialSubTab);

  return (
    <div>
      {/* Sub navigation pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn ${subTab === 'produtos' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem' }}
          onClick={() => setSubTab('produtos')}
        >
          <ShoppingBag size={18} />
          Estoque & Produtos da Loja
        </button>

        <button
          type="button"
          className={`btn ${subTab === 'gastos' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem' }}
          onClick={() => setSubTab('gastos')}
        >
          <TrendingDown size={18} />
          Gastos da Loja (Araras, Manequins, Adesivos, Mkt...)
        </button>
      </div>

      {subTab === 'produtos' && <EstoqueManager />}
      {subTab === 'gastos' && <DespesasManager />}
    </div>
  );
};
