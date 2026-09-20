import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialData } from '../data/initialData';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { generateId } from '../utils/formatters';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const [data, setData] = useState(() => loadStoredData(initialData));
  const [cart, setCart] = useState([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState('dashboard');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConfigured());

  // Auto-save whenever data changes (keeps local backup always up to date)
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Load from Supabase on mount if configured
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) return;

    const loadCloudData = async () => {
      try {
        const [prodRes, custRes, salesRes, finRes, setRes] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('customers').select('*'),
          supabase.from('sales').select('*'),
          supabase.from('personal_finance').select('*'),
          supabase.from('store_settings').select('*').eq('id', 'default').single(),
        ]);

        let hasAnyCloudData = false;
        const newProducts = (prodRes.data && prodRes.data.length > 0)
          ? prodRes.data.map((p) => ({
              ...p,
              costPrice: p.cost_price,
            }))
          : null;

        const newCustomers = custRes.data && custRes.data.length > 0 ? custRes.data : null;
        const newSales = (salesRes.data && salesRes.data.length > 0)
          ? salesRes.data.map((s) => ({
              ...s,
              customerId: s.customer_id,
              customerName: s.customer_name,
              customerPhone: s.customer_phone,
              paymentMethod: s.payment_method,
              paidAtSale: s.paid_at_sale,
              remainingBalance: s.remaining_balance,
            }))
          : null;

        const newFinance = finRes.data && finRes.data.length > 0 ? finRes.data : null;
        const newSettings = setRes.data?.data ? setRes.data.data : null;

        if (newProducts || newCustomers || newSales || newFinance || newSettings) {
          hasAnyCloudData = true;
          setData((prev) => ({
            ...prev,
            products: newProducts || prev.products,
            customers: newCustomers || prev.customers,
            sales: newSales || prev.sales,
            personalFinance: newFinance || prev.personalFinance,
            settings: newSettings || prev.settings,
          }));
        } else {
          // If Supabase tables are freshly created and empty, seed them with initial data!
          seedSupabaseInitialData();
        }

        setIsCloudConnected(true);
      } catch (err) {
        console.warn('Aviso ao carregar dados do Supabase:', err);
      }
    };

    loadCloudData();
  }, []);

  const seedSupabaseInitialData = async () => {
    if (!supabase) return;
    try {
      const prodRows = data.products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        cost_price: p.costPrice || 0,
        price: p.price,
        stock: p.stock,
        sizes: p.sizes || [],
        image: p.image || '',
        description: p.description || '',
        featured: Boolean(p.featured),
        active: Boolean(p.active),
      }));
      await supabase.from('products').upsert(prodRows);

      const custRows = data.customers.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        address: c.address || '',
        notes: c.notes || '',
      }));
      await supabase.from('customers').upsert(custRows);

      const salesRows = data.sales.map((s) => ({
        id: s.id,
        date: s.date,
        customer_id: s.customerId || null,
        customer_name: s.customerName || 'Cliente Balcão',
        customer_phone: s.customerPhone || '',
        items: s.items,
        total: s.total,
        payment_method: s.paymentMethod,
        paid_at_sale: s.paidAtSale || 0,
        remaining_balance: s.remainingBalance || 0,
        status: s.status,
        installments: s.installments || [],
      }));
      await supabase.from('sales').upsert(salesRows);

      const finRows = data.personalFinance.map((f) => ({
        id: f.id,
        date: f.date,
        type: f.type,
        category: f.category,
        description: f.description,
        amount: f.amount,
      }));
      await supabase.from('personal_finance').upsert(finRows);

      await supabase.from('store_settings').upsert({
        id: 'default',
        data: data.settings,
      });

      console.log('Dados iniciais sincronizados com o Supabase com sucesso!');
    } catch (e) {
      console.warn('Erro ao popular dados iniciais no Supabase:', e);
    }
  };

  const loadSpreadsheetData = async () => {
    setData(initialData);
    saveStoredData(initialData);
    if (supabase) {
      // Clear old test data in Supabase and re-seed with real data
      try {
        await supabase.from('products').delete().neq('id', 'none');
        await supabase.from('customers').delete().neq('id', 'none');
        await supabase.from('sales').delete().neq('id', 'none');
      } catch (e) {}
      await seedSupabaseInitialData();
    }
    showToast('Planilhas reais de perfumes, clientes e fiados sincronizadas com sucesso!');
  };

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
  const addProduct = async (productData) => {
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

    if (supabase) {
      try {
        await supabase.from('products').insert({
          id: newProduct.id,
          name: newProduct.name,
          category: newProduct.category,
          cost_price: newProduct.costPrice,
          price: newProduct.price,
          stock: newProduct.stock,
          sizes: newProduct.sizes || [],
          image: newProduct.image || '',
          description: newProduct.description || '',
          featured: newProduct.featured,
          active: newProduct.active,
        });
      } catch (err) {
        console.warn('Erro ao salvar produto no Supabase:', err);
      }
    }

    showToast('Produto cadastrado com sucesso!');
    return newProduct;
  };

  const updateProduct = async (id, updatedData) => {
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

    if (supabase) {
      try {
        await supabase.from('products').update({
          name: updatedData.name,
          category: updatedData.category,
          cost_price: updatedData.costPrice,
          price: updatedData.price,
          stock: updatedData.stock,
          sizes: updatedData.sizes,
          image: updatedData.image,
          description: updatedData.description,
          featured: updatedData.featured,
          active: updatedData.active,
        }).eq('id', id);
      } catch (err) {
        console.warn('Erro ao atualizar produto no Supabase:', err);
      }
    }

    showToast('Produto atualizado!');
  };

  const deleteProduct = async (id) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));

    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao excluir produto no Supabase:', err);
      }
    }

    showToast('Produto removido!');
  };

  const adjustProductStock = async (id, delta) => {
    let newStockVal = 0;
    setData((prev) => ({
      ...prev,
      products: prev.products.map((p) => {
        if (p.id === id) {
          newStockVal = Math.max(0, p.stock + delta);
          return { ...p, stock: newStockVal };
        }
        return p;
      }),
    }));

    if (supabase) {
      try {
        await supabase.from('products').update({ stock: newStockVal }).eq('id', id);
      } catch (err) {
        console.warn('Erro ao ajustar estoque no Supabase:', err);
      }
    }
  };

  // Customers
  const addCustomer = async (customerData) => {
    const newCustomer = {
      id: generateId('cust'),
      createdAt: new Date().toISOString().split('T')[0],
      ...customerData,
    };

    setData((prev) => ({
      ...prev,
      customers: [newCustomer, ...prev.customers],
    }));

    if (supabase) {
      try {
        await supabase.from('customers').insert({
          id: newCustomer.id,
          name: newCustomer.name,
          phone: newCustomer.phone || '',
          address: newCustomer.address || '',
          notes: newCustomer.notes || '',
        });
      } catch (err) {
        console.warn('Erro ao salvar cliente no Supabase:', err);
      }
    }

    showToast('Cliente cadastrado com sucesso!');
    return newCustomer;
  };

  const updateCustomer = async (id, updatedData) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.map((c) =>
        c.id === id ? { ...c, ...updatedData } : c
      ),
    }));

    if (supabase) {
      try {
        await supabase.from('customers').update({
          name: updatedData.name,
          phone: updatedData.phone,
          address: updatedData.address,
          notes: updatedData.notes,
        }).eq('id', id);
      } catch (err) {
        console.warn('Erro ao atualizar cliente no Supabase:', err);
      }
    }

    showToast('Dados do cliente atualizados!');
  };

  const deleteCustomer = async (id) => {
    setData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
    }));

    if (supabase) {
      try {
        await supabase.from('customers').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao deletar cliente no Supabase:', err);
      }
    }

    showToast('Cliente removido!');
  };

  // Sales and Fiado (2x de boca)
  const createSale = async ({
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

    // Decrement stock locally
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

    // Sync to Supabase
    if (supabase) {
      try {
        await supabase.from('sales').insert({
          id: newSale.id,
          date: newSale.date,
          customer_id: newSale.customerId,
          customer_name: newSale.customerName,
          customer_phone: newSale.customerPhone,
          items: newSale.items,
          total: newSale.total,
          payment_method: newSale.paymentMethod,
          paid_at_sale: newSale.paidAtSale,
          remaining_balance: newSale.remainingBalance,
          status: newSale.status,
          installments: newSale.installments,
        });

        // Update product stocks in Supabase
        for (const item of items) {
          const prod = data.products.find((p) => p.id === item.productId);
          if (prod) {
            const newStk = Math.max(0, prod.stock - item.quantity);
            await supabase.from('products').update({ stock: newStk }).eq('id', prod.id);
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar venda no Supabase:', err);
      }
    }

    showToast('Venda registrada com sucesso!');
    return newSale;
  };

  // Pay an installment of "2x de boca"
  const payInstallment = async (saleId, installmentNumber) => {
    let updatedSaleToSync = null;

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

      updatedSaleToSync = updatedSale;

      return {
        ...prev,
        sales: prev.sales.map((s) => (s.id === saleId ? updatedSale : s)),
      };
    });

    if (supabase && updatedSaleToSync) {
      try {
        await supabase.from('sales').update({
          remaining_balance: updatedSaleToSync.remainingBalance,
          paid_at_sale: updatedSaleToSync.paidAtSale,
          status: updatedSaleToSync.status,
          installments: updatedSaleToSync.installments,
        }).eq('id', saleId);
      } catch (err) {
        console.warn('Erro ao atualizar parcela no Supabase:', err);
      }
    }

    showToast(`Parcela ${installmentNumber} recebida com sucesso!`);
  };

  // Update installment due date (e.g., renegotiated or corrected due date)
  const updateInstallmentDueDate = async (saleId, installmentNumber, newDueDate) => {
    let updatedSaleToSync = null;

    setData((prev) => {
      const sale = prev.sales.find((s) => s.id === saleId);
      if (!sale) return prev;

      const updatedInstallments = sale.installments.map((inst) => {
        if (inst.number === installmentNumber) {
          return {
            ...inst,
            dueDate: newDueDate,
          };
        }
        return inst;
      });

      const updatedSale = {
        ...sale,
        installments: updatedInstallments,
      };

      updatedSaleToSync = updatedSale;

      return {
        ...prev,
        sales: prev.sales.map((s) => (s.id === saleId ? updatedSale : s)),
      };
    });

    if (supabase && updatedSaleToSync) {
      try {
        await supabase.from('sales').update({
          installments: updatedSaleToSync.installments,
        }).eq('id', saleId);
      } catch (err) {
        console.warn('Erro ao atualizar vencimento da parcela no Supabase:', err);
      }
    }

    showToast('Data de vencimento atualizada com sucesso!');
  };

  const deleteSale = async (saleId) => {
    setData((prev) => ({
      ...prev,
      sales: prev.sales.filter((s) => s.id !== saleId),
    }));

    if (supabase) {
      try {
        await supabase.from('sales').delete().eq('id', saleId);
      } catch (err) {
        console.warn('Erro ao excluir venda no Supabase:', err);
      }
    }

    showToast('Registro de venda e parcelas removido com sucesso!');
  };

  const clearAllSales = async () => {
    setData((prev) => ({
      ...prev,
      sales: [],
    }));

    if (supabase) {
      try {
        await supabase.from('sales').delete().neq('id', 'none');
      } catch (err) {
        console.warn('Erro ao limpar vendas no Supabase:', err);
      }
    }

    showToast('Todas as vendas e fiados de teste foram zerados!');
  };

  // Personal and Family Finance
  const addFinanceRecord = async (recordData) => {
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

    if (supabase) {
      try {
        await supabase.from('personal_finance').insert({
          id: newRecord.id,
          date: newRecord.date,
          type: newRecord.type,
          category: newRecord.category,
          description: newRecord.description,
          amount: newRecord.amount,
        });
      } catch (err) {
        console.warn('Erro ao salvar finança no Supabase:', err);
      }
    }

    showToast('Lançamento financeiro registrado!');
    return newRecord;
  };

  const deleteFinanceRecord = async (id) => {
    setData((prev) => ({
      ...prev,
      personalFinance: prev.personalFinance.filter((f) => f.id !== id),
    }));

    if (supabase) {
      try {
        await supabase.from('personal_finance').delete().eq('id', id);
      } catch (err) {
        console.warn('Erro ao excluir finança no Supabase:', err);
      }
    }

    showToast('Lançamento excluído!');
  };

  // Settings & Backups
  const updateSettings = async (newSettings) => {
    const merged = { ...data.settings, ...newSettings };
    setData((prev) => ({
      ...prev,
      settings: merged,
    }));

    if (supabase) {
      try {
        await supabase.from('store_settings').upsert({
          id: 'default',
          data: merged,
        });
      } catch (err) {
        console.warn('Erro ao atualizar configurações no Supabase:', err);
      }
    }

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
        isCloudConnected,
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
        deleteSale,
        clearAllSales,
        payInstallment,
        updateInstallmentDueDate,
        addFinanceRecord,
        deleteFinanceRecord,
        updateSettings,
        resetToInitialData,
        loadSpreadsheetData,
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
