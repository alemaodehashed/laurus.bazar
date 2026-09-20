import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialData } from '../data/initialData';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { generateId } from '../utils/formatters';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [data, setData] = useState(() => loadStoredData(initialData));
  const [cart, setCart] = useState([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Auto-save whenever data changes
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === toastMessage?.id ? null : prev));
    }, 3500);
  };

  // Auth
  const loginAdmin = (password) => {
    if (password === data.settings.adminPassword) {
      setIsAdminAuthenticated(true);
      showToast('Bem-vindo à Área de Gestão!');
      return true;
    }
    showToast('Senha incorreta!', 'error');
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    showToast('Você saiu da Área de Gestão.');
  };

  // Cart operations
  const addToCart = (product, selectedSize = null) => {
    const size = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0] : 'Único');
    
    // Check stock
    if (product.stock <= 0) {
      showToast('Este produto está sem estoque!', 'error');
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.selectedSize === size
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + 1;
        if (newQty > product.stock) {
          showToast(`Estoque máximo atingido (${product.stock} un)`, 'warning');
          return prev;
        }
        updated[existingIndex].quantity = newQty;
        return updated;
      } else {
        return [...prev, { product, quantity: 1, selectedSize: size }];
      }
    });

    showToast(`Adicionado ao pedido: ${product.name}`);
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId, selectedSize, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId && item.selectedSize === selectedSize) {
          if (quantity > item.product.stock) {
            showToast(`Estoque disponível: apenas ${item.product.stock} un`, 'warning');
            return item;
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId, selectedSize) => {
    setCart((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.selectedSize === selectedSize)
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  // Products
  const addProduct = (productData) => {
    const newProduct = {
      id: generateId('prod'),
      active: true,
      featured: false,
      ...productData,
      costPrice: Number(productData.costPrice) || 0,
      price: Number(productData.price) || 0,
      stock: Number(productData.stock) || 0,
    };
    setData((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
    }));
    showToast('Produto cadastrado com sucesso!');
    return newProduct;
  };

  const updateProduct = (id, updatedData) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updatedData,
              costPrice: Number(updatedData.costPrice ?? p.costPrice),
              price: Number(updatedData.price ?? p.price),
              stock: Number(updatedData.stock ?? p.stock),
            }
          : p
      ),
    }));
    showToast('Produto atualizado!');
  };

  const deleteProduct = (id) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
    showToast('Produto removido!');
  };

  const adjustProductStock = (id, delta) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id === id) {
          const newStock = Math.max(0, p.stock + delta);
          return { ...p, stock: newStock };
        }
        return p;
      }),
    }));
  };

  // Customers
  const addCustomer = (customerData) => {
    const newCustomer = {
      id: generateId('cust'),
      createdAt: new Date().toISOString().split('T')[0],
      ...customerData,
    };
    setData((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
    }));
    showToast('Cliente cadastrado com sucesso!');
    return newCustomer;
  };

  const updateCustomer = (id, updatedData) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === id ? { ...c, ...updatedData } : c
      ),
    }));
    showToast('Dados do cliente atualizados!');
  };

  const deleteCustomer = (id) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));
    showToast('Cliente removido!');
  };

  // Sales and Fiado (2x de boca)
  const createSale = ({
    customerId,
    customerName,
    customerPhone,
    items,
    paymentMethod,
    paidAtSale = 0,
    firstDueDate = null,
    secondDueDate = null,
    firstPaidAtSale = false,
  }) => {
    const total = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const saleId = generateId('sale');
    const nowIso = new Date().toISOString();

    let installments = [];
    let remainingBalance = 0;
    let initialPaid = Number(paidAtSale);
    let status = 'pago';

    if (paymentMethod === 'boca_2x') {
      const half = +(total / 2).toFixed(2);
      const remainingHalf = +(total - half).toFixed(2);

      // Defaults for due dates (today or in 15 days, and 30 days)
      const d1 = firstDueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
      const d2 = secondDueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

      if (firstPaidAtSale) {
        initialPaid = half;
        remainingBalance = remainingHalf;
        status = 'parcial';
        installments = [
          {
            number: 1,
            amount: half,
            dueDate: d1,
            paid: true,
            paidDate: nowIso.split('T')[0],
          },
          {
            number: 2,
            amount: remainingHalf,
            dueDate: d2,
            paid: false,
            paidDate: null,
          },
        ];
      } else {
        initialPaid = 0;
        remainingBalance = total;
        status = 'pendente';
        installments = [
          {
            number: 1,
            amount: half,
            dueDate: d1,
            paid: false,
            paidDate: null,
          },
          {
            number: 2,
            amount: remainingHalf,
            dueDate: d2,
            paid: false,
            paidDate: null,
          },
        ];
      }
    } else {
      // À vista or Cartão
      initialPaid = total;
      remainingBalance = 0;
      status = 'pago';
    }

    const newSale = {
      id: saleId,
      date: nowIso,
      customerId: customerId || null,
      customerName: customerName || 'Cliente Balcão',
      customerPhone: customerPhone || '',
      items,
      total,
      paymentMethod,
      paidAtSale: initialPaid,
      remainingBalance,
      status,
      installments,
    };

    // Decrement stock for all items
    setData((prev) => {
      const updatedProducts = prev.products.map((p) => {
        const boughtItem = items.find((it) => it.productId === p.id);
        if (boughtItem) {
          return { ...p, stock: Math.max(0, p.stock - boughtItem.quantity) };
        }
        return p;
      });

      return {
        ...prev,
        products: updatedProducts,
        sales: [newSale, ...prev.sales],
      };
    });

    showToast('Venda registrada com sucesso!');
    return newSale;
  };

  // Pay an installment of "2x de boca"
  const payInstallment = (saleId, installmentNumber) => {
    setData((prev) => {
      const sale = prev.sales.find((s) => s.id === saleId);
      if (!sale) return prev;

      let amountPaid = 0;
      const updatedInstallments = sale.installments.map((inst) => {
        if (inst.number === installmentNumber && !inst.paid) {
          amountPaid = inst.amount;
          return {
            ...inst,
            paid: true,
            paidDate: new Date().toISOString().split('T')[0],
          };
        }
        return inst;
      });

      const newRemaining = Math.max(0, +(sale.remainingBalance - amountPaid).toFixed(2));
      const allPaid = updatedInstallments.every((inst) => inst.paid);
      const newStatus = allPaid ? 'pago' : 'parcial';

      const updatedSale = {
        ...sale,
        remainingBalance: newRemaining,
        paidAtSale: +(sale.paidAtSale + amountPaid).toFixed(2),
        status: newStatus,
        installments: updatedInstallments,
      };

      return {
        ...prev,
        sales: prev.sales.map((s) => (s.id === saleId ? updatedSale : s)),
      };
    });

    showToast(`Parcela ${installmentNumber} recebida com sucesso!`);
  };

  // Personal and Family Finance
  const addFinanceRecord = (recordData) => {
    const newRecord = {
      id: generateId('fin'),
      date: recordData.date || new Date().toISOString().split('T')[0],
      amount: Number(recordData.amount) || 0,
      ...recordData,
    };
    setData((prev) => ({
      ...prev,
      personalFinance: [newRecord, ...prev.personalFinance],
    }));
    showToast('Lançamento financeiro registrado!');
    return newRecord;
  };

  const deleteFinanceRecord = (id) => {
    setData((prev) => ({
      ...prev,
      personalFinance: prev.personalFinance.filter((f) => f.id !== id),
    }));
    showToast('Lançamento excluído!');
  };

  // Settings & Backups
  const updateSettings = (newSettings) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
    }));
    showToast('Configurações salvas!');
  };

  const resetToInitialData = () => {
    setData(initialData);
    showToast('Dados restaurados para o padrão de demonstração.');
  };

  const importBackupData = (imported) => {
    if (!imported || !imported.products) {
      showToast('Arquivo de backup inválido!', 'error');
      return false;
    }
    setData(imported);
    showToast('Backup restaurado com sucesso!');
    return true;
  };

  return (
    <StoreContext.Provider
      value={{
        data,
        products: data.products,
        customers: data.customers,
        sales: data.sales,
        personalFinance: data.personalFinance,
        settings: data.settings,
        cart,
        isCartOpen,
        setIsCartOpen,
        toastMessage,
        isAdminAuthenticated,
        activeAdminTab,
        setActiveAdminTab,
        loginAdmin,
        logoutAdmin,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustProductStock,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        createSale,
        payInstallment,
        addFinanceRecord,
        deleteFinanceRecord,
        updateSettings,
        resetToInitialData,
        importBackupData,
        showToast,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore deve ser usado dentro de um StoreProvider');
  }
  return context;
};
