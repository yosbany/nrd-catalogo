/**
 * Configuración del catálogo: categorías, envío, mínimo, tiempo estimado.
 * Los valores pueden venir de companyInfo o definirse aquí.
 */
const CATALOG_CONFIG = {
  categories: [
    { id: 'todos', name: 'Todos' },
    { id: 'combos', name: 'Combos', tag: 'COMBO' },
    { id: 'panaderia', name: 'Panadería', tag: 'PANADERIA' },
    { id: 'galletas', name: 'Galletas y bizcochos', tag: 'GALLETAS' },
    { id: 'rotiseria', name: 'Rotisería', tag: 'ROTISERIA' },
    { id: 'sandwiches', name: 'Sándwiches', tag: 'SANDWICH' }
  ],
  shippingCost: 0,
  minimumForShipping: 0,
  estimatedMinutes: '30-45'
};

function getCatalogConfig() {
  return CATALOG_CONFIG;
}

function setCatalogConfigFromCompany(companyInfo) {
  if (!companyInfo) return;
  if (companyInfo.shippingCost != null) CATALOG_CONFIG.shippingCost = Number(companyInfo.shippingCost);
  if (companyInfo.minimumForShipping != null) CATALOG_CONFIG.minimumForShipping = Number(companyInfo.minimumForShipping);
  if (companyInfo.estimatedDeliveryMinutes != null) CATALOG_CONFIG.estimatedMinutes = String(companyInfo.estimatedDeliveryMinutes);
}

window.getCatalogConfig = getCatalogConfig;
window.setCatalogConfigFromCompany = setCatalogConfigFromCompany;
