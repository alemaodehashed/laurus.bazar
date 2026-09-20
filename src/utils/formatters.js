export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  // If it's YYYY-MM-DD, parse year, month, day to avoid timezone offsets
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR').format(new Date(y, m - 1, d));
  }
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

export const formatWhatsAppNumber = cleanPhoneNumber;

export const generateWhatsAppLink = (phone, message) => {
  let cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return '#';
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`;
  }
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
};

export const generateId = (prefix = 'id') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};
