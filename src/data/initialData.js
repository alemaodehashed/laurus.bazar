export const initialData = {
  settings: {
    storeName: 'Laurus',
    storeSubtitle: 'Perfumaria Importada, Roupas e Variedades',
    whatsapp: '5511999998888',
    adminPassword: '1234',
    acceptInstallments: true,
    maxInstallments: 3,
    welcomeMessage: 'Olá! Vim pela vitrine online e gostaria de saber mais sobre este perfume:',
  },
  products: [],
  customers: [
    { id: 'c_1', name: 'CESAR', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_2', name: 'JÁU', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_3', name: 'VICTOR EB', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_4', name: 'LARA', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_5', name: 'DUDU', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_6', name: 'ISAQUE', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_7', name: 'CB AURELIO', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_8', name: 'IGOR', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_9', name: 'CB MACHADO', phone: '', address: '', notes: 'Paga todo Dia 01' },
    { id: 'c_10', name: 'CB R. BARBOZA', phone: '', address: '', notes: 'Paga todo Dia 01' },
    { id: 'c_11', name: 'PAULINHO KOSTTA', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_12', name: 'TEN HEISHEN', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_13', name: 'CB FERNANDES', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_14', name: 'PAITZ', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_15', name: 'CB LEANDRO', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_16', name: 'CB LEAL', phone: '', address: '', notes: 'Paga todo Dia 01' },
    { id: 'c_17', name: 'VITOR SANTOS', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_18', name: 'ANA JULIA', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_19', name: 'LACOMSKI', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_20', name: 'NARIZ', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_21', name: 'CESAR CSB', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_22', name: 'BRUNAO CSB', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_23', name: 'GABE CSB', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_24', name: 'asafeh EB', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_25', name: 'TIO ZINHO', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_26', name: 'LUANA MONTEIRO', phone: '', address: '', notes: 'Cliente Laurus' },
    { id: 'c_27', name: 'CARLÃO CSB', phone: '', address: '', notes: 'Cliente Laurus' }
  ],
  sales: [
    {
      id: 'sale_real_1',
      date: '2026-08-26',
      customerId: 'c_24',
      customerName: 'asafeh EB',
      customerPhone: '',
      items: [{ productId: 'prod_1', name: 'Perfume Importado', quantity: 1, unitPrice: 700.0, size: 'Original' }],
      total: 700.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 350.0,
      remainingBalance: 350.0,
      status: 'parcial',
      installments: [
        { number: 1, amount: 350.0, dueDate: '2026-08-26', paid: true, paidDate: '2026-08-26' },
        { number: 2, amount: 350.0, dueDate: '2026-09-26', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_2',
      date: '2026-08-25',
      customerId: 'c_22',
      customerName: 'BRUNAO CSB',
      customerPhone: '',
      items: [{ productId: 'prod_6', name: 'ASAD ELIXIR', quantity: 1, unitPrice: 290.0, size: 'Masc - Lattafa' }],
      total: 290.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 0,
      remainingBalance: 290.0,
      status: 'pendente',
      installments: [
        { number: 1, amount: 145.0, dueDate: '2026-09-15', paid: false, paidDate: null },
        { number: 2, amount: 145.0, dueDate: '2026-10-15', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_3',
      date: '2026-07-30',
      customerId: 'c_16',
      customerName: 'CB LEAL',
      customerPhone: '',
      items: [{ productId: 'prod_16', name: 'FAKHAR BLACK', quantity: 1, unitPrice: 180.0, size: 'Masc - Lattafa' }],
      total: 180.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 120.0,
      remainingBalance: 60.0,
      status: 'parcial',
      installments: [
        { number: 1, amount: 60.0, dueDate: '2026-08-01', paid: true, paidDate: '2026-08-01' },
        { number: 2, amount: 60.0, dueDate: '2026-09-01', paid: true, paidDate: '2026-09-01' },
        { number: 3, amount: 60.0, dueDate: '2026-10-01', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_4',
      date: '2026-08-04',
      customerId: 'c_9',
      customerName: 'CB MACHADO',
      customerPhone: '',
      items: [
        { productId: 'prod_7', name: 'ASAD TRADICIONAL + YARA + CREME', quantity: 1, unitPrice: 570.0, size: 'Combo' }
      ],
      total: 570.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 190.0,
      remainingBalance: 380.0,
      status: 'parcial',
      installments: [
        { number: 1, amount: 190.0, dueDate: '2026-08-04', paid: true, paidDate: '2026-08-04' },
        { number: 2, amount: 190.0, dueDate: '2026-09-01', paid: false, paidDate: null },
        { number: 3, amount: 190.0, dueDate: '2026-10-01', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_5',
      date: '2026-07-15',
      customerId: 'c_10',
      customerName: 'CB R. BARBOZA',
      customerPhone: '',
      items: [{ productId: 'prod_39', name: 'SABAH GARDEN OF EDEN', quantity: 1, unitPrice: 300.0, size: 'Fem - Al Wataniah' }],
      total: 300.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 200.0,
      remainingBalance: 100.0,
      status: 'parcial',
      installments: [
        { number: 1, amount: 100.0, dueDate: '2026-08-01', paid: true, paidDate: '2026-08-01' },
        { number: 2, amount: 100.0, dueDate: '2026-09-01', paid: true, paidDate: '2026-09-01' },
        { number: 3, amount: 100.0, dueDate: '2026-10-01', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_6',
      date: '2026-08-15',
      customerId: 'c_23',
      customerName: 'GABE CSB',
      customerPhone: '',
      items: [{ productId: 'prod_5', name: 'ASAD BOURBON', quantity: 1, unitPrice: 260.0, size: 'Masc - Lattafa' }],
      total: 260.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 130.0,
      remainingBalance: 130.0,
      status: 'parcial',
      installments: [
        { number: 1, amount: 130.0, dueDate: '2026-08-15', paid: true, paidDate: '2026-08-15' },
        { number: 2, amount: 130.0, dueDate: '2026-09-15', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_7',
      date: '2026-08-31',
      customerId: 'c_19',
      customerName: 'LACOMSKI',
      customerPhone: '',
      items: [{ productId: 'prod_1', name: 'Produto Perfumaria', quantity: 1, unitPrice: 150.0, size: 'Original' }],
      total: 150.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 0,
      remainingBalance: 150.0,
      status: 'pendente',
      installments: [
        { number: 1, amount: 150.0, dueDate: '2026-09-30', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_8',
      date: '2026-08-20',
      customerId: 'c_20',
      customerName: 'NARIZ',
      customerPhone: '',
      items: [{ productId: 'prod_36', name: 'PERSEUS', quantity: 1, unitPrice: 110.0, size: 'Masc - Maison' }],
      total: 110.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 0,
      remainingBalance: 110.0,
      status: 'pendente',
      installments: [
        { number: 1, amount: 110.0, dueDate: '2026-09-20', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_9',
      date: '2026-08-24',
      customerId: 'c_20',
      customerName: 'NARIZ',
      customerPhone: '',
      items: [{ productId: 'prod_5', name: 'ASAD BOURBON', quantity: 1, unitPrice: 270.0, size: 'Masc - Lattafa' }],
      total: 270.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 0,
      remainingBalance: 270.0,
      status: 'pendente',
      installments: [
        { number: 1, amount: 135.0, dueDate: '2026-09-24', paid: false, paidDate: null },
        { number: 2, amount: 135.0, dueDate: '2026-10-24', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_10',
      date: '2026-08-26',
      customerId: 'c_25',
      customerName: 'TIO ZINHO',
      customerPhone: '',
      items: [{ productId: 'prod_21', name: 'HIS CONFESSION', quantity: 1, unitPrice: 260.0, size: 'Masc - Lattafa' }],
      total: 260.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 130.0,
      remainingBalance: 130.0,
      status: 'parcial',
      installments: [
        { number: 1, amount: 130.0, dueDate: '2026-08-26', paid: true, paidDate: '2026-08-26' },
        { number: 2, amount: 130.0, dueDate: '2026-09-26', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_11',
      date: '2026-08-06',
      customerId: 'c_17',
      customerName: 'VITOR SANTOS',
      customerPhone: '',
      items: [{ productId: 'prod_28', name: 'MASHMALLOW BLUSH', quantity: 1, unitPrice: 300.0, size: 'Fem - Paris Corner' }],
      total: 300.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 150.0,
      remainingBalance: 150.0,
      status: 'parcial',
      installments: [
        { number: 1, amount: 150.0, dueDate: '2026-08-06', paid: true, paidDate: '2026-07-31' },
        { number: 2, amount: 150.0, dueDate: '2026-09-06', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_12',
      date: '2026-08-17',
      customerId: 'c_17',
      customerName: 'VITOR SANTOS',
      customerPhone: '',
      items: [{ productId: 'prod_20', name: 'HAWAS MALIBU', quantity: 1, unitPrice: 330.0, size: 'Masc - Rasasi' }],
      total: 330.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 0,
      remainingBalance: 330.0,
      status: 'pendente',
      installments: [
        { number: 1, amount: 165.0, dueDate: '2026-09-17', paid: false, paidDate: null },
        { number: 2, amount: 165.0, dueDate: '2026-10-17', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_13',
      date: '2026-08-28',
      customerId: 'c_26',
      customerName: 'LUANA MONTEIRO',
      customerPhone: '',
      items: [{ productId: 'prod_8', name: 'ATHEERI', quantity: 1, unitPrice: 600.0, size: 'Fem - Lattafa' }],
      total: 600.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 0,
      remainingBalance: 600.0,
      status: 'pendente',
      installments: [
        { number: 1, amount: 150.0, dueDate: '2026-09-28', paid: false, paidDate: null },
        { number: 2, amount: 150.0, dueDate: '2026-10-28', paid: false, paidDate: null },
        { number: 3, amount: 150.0, dueDate: '2026-11-28', paid: false, paidDate: null },
        { number: 4, amount: 150.0, dueDate: '2026-12-28', paid: false, paidDate: null }
      ]
    },
    {
      id: 'sale_real_14',
      date: '2026-08-19',
      customerId: 'c_27',
      customerName: 'CARLÃO CSB',
      customerPhone: '',
      items: [{ productId: 'prod_7', name: 'ASAD TRADICIONAL', quantity: 1, unitPrice: 250.0, size: 'Masc - Lattafa' }],
      total: 250.0,
      paymentMethod: 'boca_2x',
      paidAtSale: 0,
      remainingBalance: 250.0,
      status: 'pendente',
      installments: [
        { number: 1, amount: 125.0, dueDate: '2026-09-19', paid: false, paidDate: null },
        { number: 2, amount: 125.0, dueDate: '2026-10-19', paid: false, paidDate: null }
      ]
    }
  ],
  personalFinance: []
};
