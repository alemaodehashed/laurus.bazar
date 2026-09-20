const STORAGE_KEY = 'bazar_familia_data_v2';

export const loadStoredData = (fallbackData) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const localPassword = localStorage.getItem('bazar_admin_password');

    if (!raw) {
      if (localPassword) {
        return {
          ...fallbackData,
          settings: { ...fallbackData.settings, adminPassword: localPassword },
        };
      }
      return fallbackData;
    }

    const parsed = JSON.parse(raw);
    return {
      ...fallbackData,
      ...parsed,
      settings: {
        ...fallbackData.settings,
        ...(parsed.settings || {}),
        adminPassword: localPassword || parsed.settings?.adminPassword || fallbackData.settings.adminPassword,
      },
    };
  } catch (error) {
    console.error('Erro ao carregar dados do LocalStorage:', error);
    return fallbackData;
  }
};

export const saveStoredData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar dados no LocalStorage:', error);
  }
};

export const exportDataAsJSON = (data) => {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `backup_bazar_familia_${date}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
