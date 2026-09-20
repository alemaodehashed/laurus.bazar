import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Lock, Eye, EyeOff, X, KeyRound } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { loginAdmin } = useStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = loginAdmin(password);
    if (success) {
      setPassword('');
      setError(false);
      onClose();
    } else {
      setError(true);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: '1.2rem' }}>Acesso da Família</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.9rem', color: 'var(--color-secondary-muted)', marginBottom: '16px' }}>
              Digite a senha de administrador para gerenciar estoque, vendas, fiado ("de boca"), clientes e finanças.
            </p>

            <div className="form-group">
              <label className="form-label">Senha de Acesso:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Digite a senha..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  autoFocus
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && (
                <span style={{ color: 'var(--color-danger)', fontSize: '0.82rem', marginTop: '4px' }}>
                  Senha incorreta! A senha padrão é <strong>1234</strong> (você pode alterá-la depois).
                </span>
              )}
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--color-secondary-muted)' }}>
              💡 <em>Dica:</em> A senha inicial de fábrica é <strong>1234</strong>.
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Lock size={16} />
              Entrar no Painel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
