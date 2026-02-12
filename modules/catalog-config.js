/**
 * Configuración del catálogo: lee desde la API (nrd.catalogConfig).
 * Estado en memoria actualizado con get() y onValue(); ya no usa config constante.
 */
const DEFAULT_CONFIG = {
  products: {},
  categories: [{ id: 'todos', name: 'Todos' }],
  optionsCatalog: {},
  shippingCost: 80,
  minimumForShipping: 200,
  estimatedMinutes: '30-45',
  brandName: "Nueva Río D'or",
  tagline: 'Horneamos con sabor cubano'
};

let catalogState = { ...DEFAULT_CONFIG };

function getCatalogConfig() {
  return catalogState;
}

/**
 * Establece la config del catálogo desde la API (Firebase).
 * Llamado desde app.js con nrd.catalogConfig.get() o onValue().
 */
function setCatalogConfig(remote) {
  if (!remote || typeof remote !== 'object') return;
  if (remote.products && typeof remote.products === 'object') {
    catalogState.products = { ...remote.products };
  }
  if (Array.isArray(remote.categories) && remote.categories.length > 0) {
    catalogState.categories = remote.categories;
  }
  if (remote.optionsCatalog && typeof remote.optionsCatalog === 'object') {
    catalogState.optionsCatalog = { ...remote.optionsCatalog };
  }
  if (remote.shippingCost != null) catalogState.shippingCost = Number(remote.shippingCost);
  if (remote.minimumForShipping != null) catalogState.minimumForShipping = Number(remote.minimumForShipping);
  if (remote.estimatedMinutes != null) catalogState.estimatedMinutes = String(remote.estimatedMinutes);
  if (remote.brandName != null) catalogState.brandName = String(remote.brandName).trim() || DEFAULT_CONFIG.brandName;
  if (remote.tagline != null) catalogState.tagline = String(remote.tagline).trim() || DEFAULT_CONFIG.tagline;
}

function getProductConfig(sku) {
  const s = (sku || '').trim();
  return (catalogState.products || {})[s] || null;
}

/** Indica si el producto está activo en el catálogo (se debe mostrar). */
function isProductActiveInCatalog(sku) {
  const cfg = getProductConfig((sku || '').trim());
  return !!(cfg && cfg.active !== false);
}

function getProductOptionsList(cfg) {
  if (!cfg) return [];
  if (Array.isArray(cfg.options) && cfg.options.length > 0) return cfg.options;
  if (cfg.optionId && cfg.variantSkus && typeof cfg.variantSkus === 'object') {
    return [{ optionId: cfg.optionId, variantSkus: cfg.variantSkus }];
  }
  return [];
}

function getVariantToDisplayProduct() {
  const map = {};
  const prods = catalogState.products || {};
  for (const [productSku, cfg] of Object.entries(prods)) {
    const optionsList = getProductOptionsList(cfg);
    for (const opt of optionsList) {
      const variantSkus = opt.variantSkus;
      if (variantSkus && typeof variantSkus === 'object') {
        for (const vs of Object.values(variantSkus)) {
          if (vs) map[String(vs).trim()] = productSku;
        }
      }
    }
  }
  return map;
}

function getProductImagePath(product) {
  if (!product) return '';
  const cfg = getProductConfig(product.sku);
  if (cfg && cfg.image) return cfg.image;
  return (product.imagePath || '').trim() || '';
}

function getProductDisplayName(product) {
  if (!product) return '';
  const cfg = getProductConfig(product.sku);
  if (cfg && (cfg.name || '').trim()) return cfg.name.trim();
  return (product.name || '').trim();
}

function getProductDescription(product) {
  if (!product) return '';
  const cfg = getProductConfig(product.sku);
  if (cfg && (cfg.description || '').trim()) return cfg.description.trim();
  return (product.description || (product.attributes && product.attributes.description) || '').trim();
}

function getProductOptionConfig(product) {
  if (!product) return [];
  const cfg = getProductConfig(product.sku);
  const optionsList = getProductOptionsList(cfg);
  if (optionsList.length === 0) return [];
  const optCatalog = catalogState.optionsCatalog || {};
  const result = [];
  for (const opt of optionsList) {
    const option = optCatalog[opt.optionId];
    if (!option || !option.choices) continue;
    const variantSkus = opt.variantSkus || {};
    const choices = option.choices.map((c) => ({
      id: c.id,
      name: c.name,
      variantSku: variantSkus[c.id] || variantSkus[c.name]
    })).filter((c) => c.variantSku);
    if (choices.length > 0) result.push({ optionId: opt.optionId, label: option.label, choices });
  }
  return result;
}

function getVariantDisplayName(product, variant) {
  if (!product || !variant) return (variant && variant.name) || '';
  const cfg = getProductConfig(product.sku);
  const optionsList = getProductOptionsList(cfg);
  const optCatalog = catalogState.optionsCatalog || {};
  const variantId = String(variant.id || variant.sku || variant.name || '').trim();
  for (const opt of optionsList) {
    const option = optCatalog[opt.optionId];
    if (!option || !option.choices) continue;
    const variantSkus = opt.variantSkus || {};
    for (const [choiceId, vs] of Object.entries(variantSkus)) {
      if (String(vs || '').trim() === variantId) {
        const choice = option.choices.find((c) => c.id === choiceId || c.name === choiceId);
        return choice ? choice.name : (variant.name || '');
      }
    }
  }
  return (variant.name || '');
}

/** Agrupa variantes bajo el producto a mostrar. Solo retorna productos definidos en la config del catálogo y activos (active !== false). */
function getDisplayProducts(products) {
  const variantMap = getVariantToDisplayProduct();
  const productsConfig = catalogState.products || {};
  const catalogSkus = new Set(
    Object.entries(productsConfig)
      .filter(([, cfg]) => cfg && cfg.active !== false)
      .map(([sku]) => sku)
  );

  const groups = {};
  const standalones = [];

  for (const p of products || []) {
    const sku = (p.sku || (p.productId && p.variantId ? p.productId + '_' + p.variantId : null) || p.id || '').trim();
    if (!sku) continue;
    const parentSku = variantMap[sku];
    if (parentSku) {
      if (!groups[parentSku]) {
        groups[parentSku] = {
          product: { ...p, sku: parentSku, id: p.id || parentSku },
          variants: []
        };
      }
      groups[parentSku].variants.push(p);
    } else if (catalogSkus.has(sku)) {
      standalones.push(p);
    }
  }

  const result = [];
  for (const g of Object.values(groups)) {
    if (!catalogSkus.has(g.product.sku)) continue;
    result.push({ ...g.product, variants: g.variants });
  }
  return [...result, ...standalones];
}

function getProductCategoryId(product) {
  if (!product) return null;
  const cfg = getProductConfig(product.sku);
  return (cfg && cfg.category) || null;
}

function getOrderProductId(productId, variantId) {
  const pid = (productId || '').trim();
  const vid = (variantId || '').trim();
  if (!pid) return null;
  if (!vid) return pid;
  const cfg = getProductConfig(pid);
  const optionsList = getProductOptionsList(cfg);
  for (const opt of optionsList) {
    const variantSkus = opt.variantSkus || {};
    const sku = variantSkus[vid];
    if (sku) return String(sku).trim();
  }
  if (/^P\d+(_\w+)?$/i.test(vid)) return vid;
  return pid;
}

const DEFAULT_PRODUCT_IMAGE = 'assets/icons/icon-192.png';

function getDefaultProductImageUrl() {
  return typeof window.assetUrl === 'function' ? window.assetUrl(DEFAULT_PRODUCT_IMAGE) : DEFAULT_PRODUCT_IMAGE;
}

function assetUrl(path) {
  if (!path) return '';
  const v = (typeof window !== 'undefined' && window.CATALOG_CACHE_VERSION) || Date.now();
  const sep = path.includes('?') ? '&' : '?';
  return path + sep + 'v=' + v;
}

/** Sobrescribe envío y datos de negocio desde companyInfo (API). */
function setCatalogConfigFromCompany(companyInfo) {
  if (!companyInfo) return;
  if (companyInfo.shippingCost != null) catalogState.shippingCost = Number(companyInfo.shippingCost);
  if (companyInfo.minimumForShipping != null) catalogState.minimumForShipping = Number(companyInfo.minimumForShipping);
  if (companyInfo.estimatedDeliveryMinutes != null) catalogState.estimatedMinutes = String(companyInfo.estimatedDeliveryMinutes);
}

/** Alias para compatibilidad: establece la config desde la API de catálogo (Firebase). */
function setCatalogConfigFromFirebase(remote) {
  setCatalogConfig(remote);
}

window.getCatalogConfig = getCatalogConfig;
window.isProductActiveInCatalog = isProductActiveInCatalog;
window.setCatalogConfig = setCatalogConfig;
window.setCatalogConfigFromFirebase = setCatalogConfigFromFirebase;
window.getProductImagePath = getProductImagePath;
window.getProductCategoryId = getProductCategoryId;
window.getOrderProductId = getOrderProductId;
window.getProductDescription = getProductDescription;
window.getProductDisplayName = getProductDisplayName;
window.getProductOptionConfig = getProductOptionConfig;
window.getVariantDisplayName = getVariantDisplayName;
window.getDisplayProducts = getDisplayProducts;
window.getDefaultProductImage = () => DEFAULT_PRODUCT_IMAGE;
window.getDefaultProductImageUrl = getDefaultProductImageUrl;
window.assetUrl = assetUrl;
window.setCatalogConfigFromCompany = setCatalogConfigFromCompany;
