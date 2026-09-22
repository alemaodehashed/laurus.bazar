import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { initialData } from '../data/initialData';
import { loadStoredData, saveStoredData } from '../utils/storage';
import { generateId, formatCurrency } from '../utils/formatters';
import { supabase, isSupabaseConfigured } from '../utils/supabaseClient';

const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
  const AUTH_STORAGE_KEY = 'bazar_admin_session';
  const ADMIN_TAB_STORAGE_KEY = 'bazar_admin_tab';

  const [data, setData] = useState(() => {
    const loaded = loadStoredData(initialData);
    if (loaded && loaded.settings && (!loaded.settings.storeName || loaded.settings.storeName === 'Laurus Bazar')) {
      loaded.settings.storeName = 'Laurus';
    }
    return loaded;
  });
  const [cart, setCart] = useState([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  });

  const [activeAdminTab, setActiveAdminTabState] = useState(() => {
    try {
      const saved = localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
      return (saved && saved !== 'financeiro') ? saved : 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });

  const setActiveAdminTab = (tabId) => {
    setActiveAdminTabState(tabId);
    try {
      localStorage.setItem(ADMIN_TAB_STORAGE_KEY, tabId);
    } catch (e) {}
  };

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimerRef = useRef(null);
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConfigured());
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(() => {
    try {
      return localStorage.getItem('bazar_last_saved_time') || 'Salvo localmente';
    } catch (e) {
      return 'Salvo localmente';
    }
  });

  // Helper to merge local items with cloud items without deleting local additions
  const mergeListById = (localList = [], cloudList = []) => {
    if (!cloudList || cloudList.length === 0) return localList || [];
    if (!localList || localList.length === 0) return cloudList || [];

    const map = new Map();
    // Add cloud items first
    cloudList.forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    // Local items take precedence and local-only items are preserved!
    localList.forEach((item) => {
      if (item && item.id) {
        const cloudItem = map.get(item.id);
        map.set(item.id, {
          ...(cloudItem || {}),
          ...item,
        });
      }
    });
    return Array.from(map.values());
  };

  // Auto-save whenever data changes (keeps local backup always up to date)
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Load from Supabase on mount if configured with smart merge
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
          const localPassword = localStorage.getItem('bazar_admin_password');

          setData((prev) => {
            const mergedSettings = newSettings
              ? {
                  ...prev.settings,
                  ...newSettings,
                  adminPassword: localPassword || newSettings.adminPassword || prev.settings.adminPassword,
                }
              : prev.settings;

            return {
              ...prev,
              products: mergeListById(prev.products, newProducts),
              customers: mergeListById(prev.customers, newCustomers),
              sales: mergeListById(prev.sales, newSales),
              personalFinance: mergeListById(prev.personalFinance, newFinance),
              settings: mergedSettings,
            };
          });
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

  const hideToast = () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToastMessage(null);
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToastMessage({ message, type, id });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  };

  // Auth
  const loginAdmin = (password) => {
    const localPassword = localStorage.getItem('bazar_admin_password');
    const validPassword = localPassword || data.settings?.adminPassword || '1234';

    if (password === validPassword || password === data.settings?.adminPassword) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, 'true');
      } catch (e) {}
      setIsAdminAuthenticated(true);
      showToast('Bem-vindo à Área da Família!');
      return true;
    }
    showToast('Senha incorreta! Tente novamente.', 'error');
    return false;
  };

  const logoutAdmin = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem('bazar_current_view');
    } catch (e) {}
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

    let finRecord = null;
    if (newProduct.stock > 0 && newProduct.costPrice > 0) {
      const expenseAmount = +(newProduct.stock * newProduct.costPrice).toFixed(2);
      const today = new Date().toISOString().split('T')[0];
      finRecord = {
        id: generateId('fin'),
        date: today,
        type: 'despesa_loja',
        category: 'Compra de Mercadorias',
        description: `Compra de estoque (${newProduct.stock} un): ${newProduct.name}`,
        amount: expenseAmount,
      };
    }

    setData((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
      personalFinance: finRecord ? [finRecord, ...(prev.personalFinance || [])] : (prev.personalFinance || []),
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

        if (finRecord) {
          await supabase.from('personal_finance').insert({
            id: finRecord.id,
            date: finRecord.date,
            type: finRecord.type,
            category: finRecord.category,
            description: finRecord.description,
            amount: finRecord.amount,
          });
        }
      } catch (err) {
        console.warn('Erro ao salvar produto ou finança no Supabase:', err);
      }
    }

    if (finRecord) {
      showToast(`Produto cadastrado! (Descontado ${formatCurrency(finRecord.amount)} do caixa)`);
    } else {
      showToast('Produto cadastrado com sucesso!');
    }
    return newProduct;
  };

  const updateProduct = async (id, updatedData) => {
    let finRecord = null;
    setData((prev) => {
      const existing = prev.products.find((p) => p.id === id);
      const newStock = Number(updatedData.stock ?? existing?.stock ?? 0);
      const oldStock = Number(existing?.stock ?? 0);
      const cost = Number(updatedData.costPrice ?? existing?.costPrice ?? 0);

      if (newStock > oldStock && cost > 0) {
        const addedQty = newStock - oldStock;
        const expenseAmount = +(addedQty * cost).toFixed(2);
        const today = new Date().toISOString().split('T')[0];
        finRecord = {
          id: generateId('fin'),
          date: today,
          type: 'despesa_loja',
          category: 'Compra de Mercadorias',
          description: `Reposição de estoque (+${addedQty} un): ${updatedData.name || existing?.name}`,
          amount: expenseAmount,
        };
      }

      return {
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
        personalFinance: finRecord ? [finRecord, ...(prev.personalFinance || [])] : (prev.personalFinance || []),
      };
    });

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

        if (finRecord) {
          await supabase.from('personal_finance').insert({
            id: finRecord.id,
            date: finRecord.date,
            type: finRecord.type,
            category: finRecord.category,
            description: finRecord.description,
            amount: finRecord.amount,
          });
        }
      } catch (err) {
        console.warn('Erro ao atualizar produto ou finança no Supabase:', err);
      }
    }

    if (finRecord) {
      showToast(`Produto atualizado! (Descontado ${formatCurrency(finRecord.amount)} do caixa)`);
    } else {
      showToast('Produto atualizado!');
    }
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
    let targetProduct = null;
    let finRecord = null;

    setData((prev) => {
      const prod = prev.products.find((p) => p.id === id);
      if (!prod) return prev;
      targetProduct = prod;
      newStockVal = Math.max(0, prod.stock + delta);

      let updatedFinance = prev.personalFinance || [];
      const cost = Number(prod.costPrice) || 0;
      if (delta > 0 && cost > 0) {
        const expenseAmount = +(delta * cost).toFixed(2);
        const today = new Date().toISOString().split('T')[0];
        finRecord = {
          id: generateId('fin'),
          date: today,
          type: 'despesa_loja',
          category: 'Compra de Mercadorias',
          description: `Reposição de estoque (+${delta} un): ${prod.name}`,
          amount: expenseAmount,
        };
        updatedFinance = [finRecord, ...updatedFinance];
      }

      return {
        ...prev,
        products: prev.products.map((p) => (p.id === id ? { ...p, stock: newStockVal } : p)),
        personalFinance: updatedFinance,
      };
    });

    if (supabase && targetProduct) {
      try {
        await supabase.from('products').update({ stock: newStockVal }).eq('id', id);
        if (finRecord) {
          await supabase.from('personal_finance').insert({
            id: finRecord.id,
            date: finRecord.date,
            type: finRecord.type,
            category: finRecord.category,
            description: finRecord.description,
            amount: finRecord.amount,
          });
        }
      } catch (err) {
        console.warn('Erro ao ajustar estoque ou salvar finança no Supabase:', err);
      }
    }

    if (finRecord) {
      showToast(`+${delta} un de ${targetProduct.name} adicionado (Descontado ${formatCurrency(finRecord.amount)} do caixa)`);
    } else {
      showToast(delta > 0 ? `Estoque aumentado (+${delta} un)` : `Estoque diminuído (-${Math.abs(delta)} un)`);
    }
  };

  // Batch/Lot purchases with average cost (ideal for clothes and wholesale packages)
  const addBatchPurchase = async ({
    totalAmount,
    totalPieces,
    description,
    targetMode, // 'new_product' | 'existing_product' | 'cash_only'
    productId,
    newProductData,
    date,
  }) => {
    const expenseAmount = Number(totalAmount) || 0;
    const pieces = Math.max(1, Number(totalPieces) || 1);
    const avgCost = +(expenseAmount / pieces).toFixed(2);
    const purchaseDate = date || new Date().toISOString().split('T')[0];
    const desc = description?.trim() || `Lote de Roupas (${pieces} peças)`;

    const finRecord = {
      id: generateId('fin'),
      date: purchaseDate,
      type: 'despesa_loja',
      category: 'Compra de Mercadorias',
      description: `Compra de Lote (${pieces} un): ${desc} - Custo Médio ${formatCurrency(avgCost)}/un`,
      amount: expenseAmount,
    };

    let newProdCreated = null;
    let updatedExistingProd = null;

    setData((prev) => {
      let updatedProducts = [...prev.products];

      if (targetMode === 'new_product') {
        newProdCreated = {
          id: generateId('prod'),
          active: true,
          featured: false,
          name: newProductData?.name?.trim() || desc,
          category: newProductData?.category || 'Roupas',
          costPrice: avgCost,
          price: Number(newProductData?.price) || +(avgCost * 2).toFixed(2),
          specialPrice: newProductData?.specialPrice ? Number(newProductData.specialPrice) : null,
          stock: pieces,
          sizes: newProductData?.sizes && newProductData.sizes.length > 0 ? newProductData.sizes : ['Variados'],
          image: newProductData?.image || 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=700&auto=format&fit=crop&q=80',
          description: newProductData?.description || `Peças adquiridas em lote com custo médio de ${formatCurrency(avgCost)} por unidade.`,
        };
        updatedProducts = [newProdCreated, ...updatedProducts];
      } else if (targetMode === 'existing_product' && productId) {
        updatedProducts = updatedProducts.map((p) => {
          if (p.id === productId) {
            const oldStock = Number(p.stock) || 0;
            const oldCost = Number(p.costPrice) || 0;
            const newStock = oldStock + pieces;
            // Weighted average cost
            const weightedCost = newStock > 0 ? +((oldStock * oldCost + pieces * avgCost) / newStock).toFixed(2) : avgCost;
            updatedExistingProd = {
              ...p,
              stock: newStock,
              costPrice: weightedCost,
            };
            return updatedExistingProd;
          }
          return p;
        });
      }

      return {
        ...prev,
        products: updatedProducts,
        personalFinance: [finRecord, ...(prev.personalFinance || [])],
      };
    });

    if (supabase) {
      try {
        await supabase.from('personal_finance').insert({
          id: finRecord.id,
          date: finRecord.date,
          type: finRecord.type,
          category: finRecord.category,
          description: finRecord.description,
          amount: finRecord.amount,
        });

        if (newProdCreated) {
          await supabase.from('products').insert({
            id: newProdCreated.id,
            name: newProdCreated.name,
            category: newProdCreated.category,
            cost_price: newProdCreated.costPrice,
            price: newProdCreated.price,
            stock: newProdCreated.stock,
            sizes: newProdCreated.sizes || [],
            image: newProdCreated.image || '',
            description: newProdCreated.description || '',
            featured: newProdCreated.featured,
            active: newProdCreated.active,
          });
        } else if (updatedExistingProd) {
          await supabase.from('products').update({
            stock: updatedExistingProd.stock,
            cost_price: updatedExistingProd.costPrice,
          }).eq('id', updatedExistingProd.id);
        }
      } catch (err) {
        console.warn('Erro ao salvar entrada de lote no Supabase:', err);
      }
    }

    showToast(`Lote registrado! ${formatCurrency(expenseAmount)} descontado do caixa (Custo médio: ${formatCurrency(avgCost)}/un)`);
    return { finRecord, product: newProdCreated || updatedExistingProd };
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

  // Sales and Fiado (parcelado / de boca)
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
    installmentCount = 2,
    installmentDates = null,
    customInstallments = null,
    saleDate = null,
  }) => {
    const total = items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    const saleId = generateId('sale');
    const nowIso = saleDate 
      ? (saleDate.includes('T') ? saleDate : `${saleDate}T12:00:00.000Z`)
      : new Date().toISOString();

    let installments = [];
    let remainingBalance = 0;
    let initialPaid = Number(paidAtSale);
    let status = 'pago';

    if (paymentMethod === 'boca_2x') {
      if (customInstallments && Array.isArray(customInstallments) && customInstallments.length > 0) {
        installments = customInstallments.map((inst, idx) => ({
          number: idx + 1,
          amount: +(Number(inst.amount)).toFixed(2),
          dueDate: inst.dueDate,
          paid: Boolean(inst.paid),
          paidDate: inst.paid ? (inst.paidDate || nowIso.split('T')[0]) : null,
        }));
      } else {
        const count = Math.max(1, Number(installmentCount) || 2);
        const baseAmount = +(total / count).toFixed(2);
        installments = [];
        let accumulated = 0;

        for (let i = 0; i < count; i++) {
          const isLast = i === count - 1;
          const amt = isLast ? +(total - accumulated).toFixed(2) : baseAmount;
          accumulated += amt;
          const isFirstPaid = i === 0 && firstPaidAtSale;

          let d = installmentDates && installmentDates[i] ? installmentDates[i] : null;
          if (!d) {
            if (i === 0 && firstDueDate) {
              d = firstDueDate;
            } else if (i === 1 && secondDueDate) {
              d = secondDueDate;
            } else {
              const defaultDays = i === 0 ? 15 : (i + 1) * 30;
              d = new Date(Date.now() + defaultDays * 86400000).toISOString().split('T')[0];
            }
          }

          installments.push({
            number: i + 1,
            amount: amt,
            dueDate: d,
            paid: isFirstPaid,
            paidDate: isFirstPaid ? nowIso.split('T')[0] : null,
          });
        }
      }

      const totalPaid = installments.filter((i) => i.paid).reduce((acc, i) => acc + i.amount, 0);
      initialPaid = totalPaid;
      remainingBalance = +(total - totalPaid).toFixed(2);
      const allPaid = installments.length > 0 && installments.every((i) => i.paid);
      status = allPaid ? 'pago' : totalPaid > 0 ? 'parcial' : 'pendente';
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

    // Decrement stock locally (only for catalog items, ignore avulso items)
    setData((prev) => {
      const updatedProducts = prev.products.map((p) => {
        const boughtItem = items.find((it) => it.productId === p.id && !it.isCustomItem);
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
    const saleToDelete = (data.sales || []).find((s) => s.id === saleId);

    setData((prev) => {
      // Return sold quantities back to stock if products exist
      let updatedProducts = prev.products;
      if (saleToDelete && Array.isArray(saleToDelete.items)) {
        updatedProducts = prev.products.map((p) => {
          const item = saleToDelete.items.find((it) => it.productId === p.id && !it.isCustomItem);
          if (item) {
            return { ...p, stock: p.stock + (Number(item.quantity) || 1) };
          }
          return p;
        });
      }

      return {
        ...prev,
        products: updatedProducts,
        sales: prev.sales.filter((s) => s.id !== saleId),
      };
    });

    if (supabase && isSupabaseConfigured()) {
      try {
        await supabase.from('sales').delete().eq('id', saleId);
        if (saleToDelete && Array.isArray(saleToDelete.items)) {
          for (const item of saleToDelete.items) {
            const prod = (data.products || []).find((p) => p.id === item.productId);
            if (prod) {
              const restoredStock = prod.stock + (Number(item.quantity) || 1);
              await supabase.from('products').update({ stock: restoredStock }).eq('id', prod.id);
            }
          }
        }
      } catch (err) {
        console.warn('Erro ao excluir venda no Supabase:', err);
      }
    }

    showToast('Venda excluída e itens devolvidos ao estoque!');
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
    if (newSettings.adminPassword) {
      try {
        localStorage.setItem('bazar_admin_password', newSettings.adminPassword);
      } catch (e) {}
    }

    let updatedSettingsToSync = null;

    setData((prev) => {
      const merged = { ...prev.settings, ...newSettings };
      updatedSettingsToSync = merged;
      const updated = {
        ...prev,
        settings: merged,
      };
      saveStoredData(updated);
      return updated;
    });

    if (supabase && updatedSettingsToSync) {
      try {
        await supabase.from('store_settings').upsert({
          id: 'default',
          data: updatedSettingsToSync,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      } catch (err) {
        console.warn('Erro ao atualizar configurações no Supabase:', err);
      }
    }

    showToast('Configurações e nova senha salvas com sucesso!');
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

  const syncAllData = async () => {
    setIsSaving(true);
    try {
      // 1. Force save to LocalStorage immediately
      saveStoredData(data);
      const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const displaySaved = `Salvo às ${timeStr}`;
      setLastSavedTime(displaySaved);
      try {
        localStorage.setItem('bazar_last_saved_time', displaySaved);
      } catch (e) {}

      // 2. If Supabase configured, push everything (upsert)
      if (supabase && isSupabaseConfigured()) {
        try {
          const prodRows = data.products.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            cost_price: Number(p.costPrice) || 0,
            price: Number(p.price) || 0,
            stock: Number(p.stock) || 0,
            sizes: p.sizes || [],
            image: p.image || '',
            description: p.description || '',
            featured: Boolean(p.featured),
            active: Boolean(p.active),
          }));
          if (prodRows.length > 0) await supabase.from('products').upsert(prodRows);

          const custRows = data.customers.map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone || '',
            address: c.address || '',
            notes: c.notes || '',
          }));
          if (custRows.length > 0) await supabase.from('customers').upsert(custRows);

          const salesRows = data.sales.map((s) => ({
            id: s.id,
            date: s.date,
            customer_id: s.customerId || null,
            customer_name: s.customerName || 'Cliente Balcão',
            customer_phone: s.customerPhone || '',
            items: s.items || [],
            total: Number(s.total) || 0,
            payment_method: s.paymentMethod,
            paid_at_sale: Number(s.paidAtSale) || 0,
            remaining_balance: Number(s.remainingBalance) || 0,
            status: s.status,
            installments: s.installments || [],
          }));
          if (salesRows.length > 0) await supabase.from('sales').upsert(salesRows);

          const finRows = (data.personalFinance || []).map((f) => ({
            id: f.id,
            date: f.date,
            type: f.type || 'despesa_loja',
            category: f.category,
            description: f.description,
            amount: Number(f.amount) || 0,
          }));
          if (finRows.length > 0) await supabase.from('personal_finance').upsert(finRows);

          await supabase.from('store_settings').upsert({
            id: 'default',
            data: data.settings,
            updated_at: new Date().toISOString(),
          });

          setIsCloudConnected(true);
          showToast('✅ Tudo salvo e sincronizado com a nuvem!');
          return true;
        } catch (cloudErr) {
          console.warn('Erro ao salvar na nuvem, salvo localmente:', cloudErr);
          showToast('💾 Dados salvos com segurança no seu computador!');
          return true;
        }
      } else {
        showToast('💾 Dados salvos com segurança no seu computador!');
        return true;
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      showToast('⚠️ Erro ao salvar dados');
      return false;
    } finally {
      setIsSaving(false);
    }
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
        isSaving,
        lastSavedTime,
        syncAllData,
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
        addBatchPurchase,
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
        hideToast,
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
