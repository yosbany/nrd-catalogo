/**
 * Configuración del catálogo: lee desde la API (GET /catalog).
 * Estado en memoria; productos UI se construyen con buildProductsFromCatalogConfig().
 */
const DEFAULT_CONFIG = {
  products: {},
  categories: [{ id: 'todos', name: 'Todos' }],
  optionsCatalog: {},
  shippingCost: 80,
  minimumForShipping: 200,
  estimatedMinutes: '30-45',
  brandName: "Nueva Río D'or",
  tagline: 'Horneamos con sabor cubano',
  storeOpenTime: '08:00',
  storeCloseTime: '20:00',
  storeManualOverride: null,
  paymentMethods: { efectivo: true, pos: true, mercadopago: true }
};

let catalogState = { ...DEFAULT_CONFIG };

function getCatalogConfig() {
  return catalogState;
}

/**
 * Establece la config del catálogo desde GET /catalog.
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
  if (remote.brandName != null) {
    const raw = String(remote.brandName).trim();
    catalogState.brandName = raw ? raw.replace(/\bDor\b/gi, "D'or") : DEFAULT_CONFIG.brandName;
  }
  if (remote.tagline != null) catalogState.tagline = String(remote.tagline).trim() || DEFAULT_CONFIG.tagline;
  if (remote.storeOpenTime != null) catalogState.storeOpenTime = String(remote.storeOpenTime).trim() || DEFAULT_CONFIG.storeOpenTime;
  if (remote.storeCloseTime != null) catalogState.storeCloseTime = String(remote.storeCloseTime).trim() || DEFAULT_CONFIG.storeCloseTime;
  if (remote.storeManualOverride !== undefined && remote.storeManualOverride !== null) {
    const v = String(remote.storeManualOverride).toLowerCase();
    catalogState.storeManualOverride = (v === 'open' || v === 'closed') ? v : null;
  } else {
    catalogState.storeManualOverride = null;
  }
  if (remote.paymentMethods && typeof remote.paymentMethods === 'object') {
    catalogState.paymentMethods = {
      efectivo: remote.paymentMethods.efectivo !== false,
      pos: remote.paymentMethods.pos !== false,
      mercadopago: remote.paymentMethods.mercadopago !== false
    };
  } else {
    catalogState.paymentMethods = { ...DEFAULT_CONFIG.paymentMethods };
  }
}

/**
 * Indica si el local está abierto según horario y override manual.
 * storeManualOverride: 'open' = siempre abierto, 'closed' = siempre cerrado, null = por horario.
 */
function isStoreOpen() {
  const cfg = catalogState;
  const override = (cfg.storeManualOverride || '').toLowerCase();
  if (override === 'closed') return false;
  if (override === 'open') return true;
  const openStr = (cfg.storeOpenTime || '').trim() || '08:00';
  const closeStr = (cfg.storeCloseTime || '').trim() || '20:00';
  const parseHHMM = (s) => {
    const m = String(s).match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return h * 60 + min;
  };
  const openMin = parseHHMM(openStr);
  const closeMin = parseHHMM(closeStr);
  if (openMin == null || closeMin == null) return true;
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  if (openMin <= closeMin) {
    return currentMin >= openMin && currentMin < closeMin;
  }
  return currentMin >= openMin || currentMin < closeMin;
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
  const sku = (product.sku || '').trim();
  if (!sku) return (product.imagePath || '').trim() || '';
  const cfg = getProductConfig(sku);
  if (cfg && cfg.image) return cfg.image;
  const variantMap = getVariantToDisplayProduct();
  const parentSku = variantMap[sku];
  if (parentSku) {
    const parentCfg = getProductConfig(parentSku);
    if (parentCfg && parentCfg.image) return parentCfg.image;
  }
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
    const disabledIds = Array.isArray(opt.disabledChoiceIds) ? opt.disabledChoiceIds : [];
    const catalogPrices = opt.catalogPrices || {};
    const choices = option.choices
      .filter((c) => {
        const id = String(c.id || '').trim();
        const name = String(c.name || '').trim();
        const sku = String(c.sku || '').trim();
        return !disabledIds.includes(id) && !disabledIds.includes(name) && !disabledIds.includes(sku);
      })
      .map((c) => {
        const variantSku = variantSkus[c.id] || variantSkus[c.name];
        const catalogPrice = catalogPrices[c.id] ?? catalogPrices[c.name];
        const out = {
          id: c.id,
          name: (c.commercialName && c.commercialName.trim()) ? c.commercialName.trim() : c.name,
          variantSku
        };
        if (catalogPrice != null && !Number.isNaN(Number(catalogPrice))) out.catalogPrice = Number(catalogPrice);
        return out;
      })
      .filter((c) => c.variantSku);
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
        return choice ? (choice.commercialName && choice.commercialName.trim() ? choice.commercialName.trim() : choice.name) : (variant.name || '');
      }
    }
  }
  return (variant.name || '');
}

/**
 * Construye la lista de productos para la UI solo desde /catalog (API).
 * Ya no se usa /products de Firebase en el cliente.
 */
function buildProductsFromCatalogConfig() {
  const productsConfig = catalogState.products || {};
  const optCatalog = catalogState.optionsCatalog || {};
  const categories = catalogState.categories || [];
  const catById = {};
  categories.forEach((c) => { if (c && c.id) catById[c.id] = c; });

  const result = [];
  for (const [sku, cfg] of Object.entries(productsConfig)) {
    if (!cfg || cfg.active === false) continue;
    const s = String(sku).trim();
    if (!s) continue;

    const basePrice = cfg.price != null && !Number.isNaN(Number(cfg.price)) ? Number(cfg.price) : 0;
    const optionsList = getProductOptionsList(cfg);
    const variants = [];
    const catalogPrices = cfg.catalogPrices || {};

    for (const opt of optionsList) {
      const option = optCatalog[opt.optionId];
      if (!option || !Array.isArray(option.choices)) continue;
      const variantSkus = opt.variantSkus || {};
      const disabledIds = Array.isArray(opt.disabledChoiceIds) ? opt.disabledChoiceIds : [];
      const optCatalogPrices = opt.catalogPrices || {};

      for (const c of option.choices) {
        const id = String(c.id || '').trim();
        const name = String((c.commercialName && c.commercialName.trim()) ? c.commercialName.trim() : (c.name || '')).trim();
        const choiceSku = String(variantSkus[id] || variantSkus[c.name] || c.sku || '').trim();
        if (!choiceSku) continue;
        if (disabledIds.includes(id) || disabledIds.includes(name) || disabledIds.includes(choiceSku)) continue;

        let price = basePrice;
        const cp = optCatalogPrices[id] ?? optCatalogPrices[c.name] ?? catalogPrices[id] ?? catalogPrices[choiceSku];
        if (cp != null && !Number.isNaN(Number(cp))) {
          price = Number(cp);
        } else if (c.priceAdjustment != null && !Number.isNaN(Number(c.priceAdjustment))) {
          price = basePrice + Number(c.priceAdjustment);
        } else if (c.price != null && !Number.isNaN(Number(c.price))) {
          price = Number(c.price);
        }

        variants.push({
          id: id || choiceSku,
          sku: choiceSku,
          name: name || choiceSku,
          price: Math.round(price),
          active: true,
          esVendible: true
        });
      }
    }

    const cat = catById[cfg.category];
    const tags = [];
    if (cat && cat.tag) tags.push(cat.tag);

    result.push({
      id: s,
      sku: s,
      name: (cfg.name || '').trim() || s,
      price: Math.round(basePrice),
      imagePath: (cfg.image || '').trim(),
      description: (cfg.description || '').trim(),
      category: cfg.category || null,
      tags,
      active: true,
      variants
    });
  }
  return result;
}

/** Lista de productos a mostrar (desde API /catalog). El argumento se ignora (compat). */
function getDisplayProducts(_products) {
  return buildProductsFromCatalogConfig();
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
  // Cache busting disabled for this project (keep URLs clean)
  return String(path);
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
window.buildProductsFromCatalogConfig = buildProductsFromCatalogConfig;
window.getDisplayProducts = getDisplayProducts;
window.getDefaultProductImage = () => DEFAULT_PRODUCT_IMAGE;
window.getDefaultProductImageUrl = getDefaultProductImageUrl;
window.assetUrl = assetUrl;
window.setCatalogConfigFromCompany = setCatalogConfigFromCompany;
window.isStoreOpen = isStoreOpen;

function getEnabledPaymentMethods() {
  const pm = (catalogState.paymentMethods && typeof catalogState.paymentMethods === 'object')
    ? catalogState.paymentMethods
    : DEFAULT_CONFIG.paymentMethods;
  return {
    efectivo: pm.efectivo !== false,
    pos: pm.pos !== false,
    mercadopago: pm.mercadopago !== false
  };
}

window.getEnabledPaymentMethods = getEnabledPaymentMethods;
