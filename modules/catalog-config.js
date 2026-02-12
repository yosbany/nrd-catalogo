/**
 * Configuración del catálogo: categorías, envío, mínimo, tiempo estimado.
 * Los valores pueden venir de companyInfo o definirse aquí.
 */
const CATALOG_CONFIG = {
  /** Un solo diccionario por producto: SKU → { name, image, category, description, options?: [{ optionId, variantSkus }] } */
  products: {
    'P0026': {
      name: 'Pan baguette',
      image: 'assets/images/pan-baguette.jpg',
      category: 'panaderia',
      description: 'Crocante por fuera y suave por dentro. Clásico de mesa y refuerzos.'
    },
    'P0027': {
      name: 'Pan porteño',
      image: 'assets/images/pan-portenno.jpg',
      category: 'panaderia',
      description: 'Pan individual, crocante y rendidor. Ideal para el día a día.'
    },
    'P0030': {
      name: 'Pan pancho',
      image: 'assets/images/pan-pancho.jpg',
      category: 'panaderia',
      description: 'Pan liviano y práctico, ideal para panchos.'
    },
    'P0309': {
      name: 'Pan flauta',
      image: 'assets/images/pan-flauta.jpg',
      category: 'panaderia',
      description: 'Largo, aireado y versátil. Ideal para cortar o armar refuerzos.'
    },
    'P0014': {
      name: 'Pan marsellés',
      image: 'assets/images/pan-marselles.jpg',
      category: 'panaderia',
      description: 'Pan rústico con harina de maíz, sabor intenso y textura crocante.'
    },
    'P0028': {
      name: 'Pan tortugas',
      image: 'assets/images/pan-tortuga.jpg',
      category: 'panaderia',
      description: 'Panes suaves para hamburguesas y refuerzos.'
    },
    'P0992': {
      name: 'Galleta malteada',
      image: 'assets/images/galleta-malteada.jpg',
      category: 'galletas',
      description: 'Galletas clásicas, crocantes y rendidoras para el mate.',
      options: [
        { optionId: 'con-o-sin-sal', variantSkus: { 'con-sal': 'P0992_1', 'sin-sal': 'P0992_2' } }
      ]
    },
    'P0993': {
      name: 'Galleta marina',
      image: 'assets/images/galleta-marina.jpg',
      category: 'galletas',
      description: 'Galletas secas, livianas y crocantes. Acompañan cualquier momento.',
      options: [
        { optionId: 'con-o-sin-sal', variantSkus: { 'con-sal': 'P0992_3', 'sin-sal': 'P0992_4' } }
      ]
    },
    'P0598': {
      name: 'Empanada caseras',
      image: 'assets/images/empanada-casera.jpg',
      category: 'rotiseria',
      description: 'Empanadas jugosas, recién hechas y llenas de sabor.',
      options: [
        {
          optionId: 'sabor-empanada',
          variantSkus: {
            'jamon-y-queso': 'P0598_1',
            'carne': 'P0598_2',
            'carne-y-aceituna': 'P0598_3',
            'pollo': 'P0598_4'
          }
        }
      ]
    },
    'P0048': {
      name: 'Pre-pizza 30 cm',
      image: 'assets/images/pre-pizzas-30-cm.jpg',
      category: 'rotiseria',
      description: 'Bases listas con salsa para armar tu pizza como más te guste.'
    },
    'P0047': {
      name: 'Pre-pizza muzzarella 30 cm',
      image: 'assets/images/pre-pizza-muzzarella-30-cm.jpg',
      category: 'rotiseria',
      description: 'Base casera con salsa y muzzarella lista para hornear.'
    },
    'P0222_5': {
      name: 'Pastel de carne',
      image: 'assets/images/pastel-carne.jpeg',
      category: 'rotiseria',
      description: 'Pastel casero con puré natural y muzzarella gratinada.'
    },
    'P0213': {
      name: 'Alfajor',
      image: 'assets/images/alfajor-dulce-leche.jpg',
      category: 'dulces',
      description: 'Alfajor casero con relleno generoso y sabor tradicional.'
    },
    'P0213_6': {
      name: 'Alfajor yoyo',
      image: 'assets/images/alfajor-yoyo.jpg',
      category: 'dulces',
      description: 'Dos tapas unidas con dulce de leche, suave y rendidor.'
    },
    'P0213_5': {
      name: 'Alfajor de maicena',
      image: 'assets/images/alfajor-maicena.jpg',
      category: 'dulces',
      description: 'Alfajor suave con coco y relleno cremoso.'
    },
    'P0213_4': {
      name: 'Alfajor Suizo',
      image: 'assets/images/alfajor-suizo.jpg',
      category: 'dulces',
      description: 'Alfajor bañado en chocolate con detalle de salsa de frutilla.'
    },
    'P0994': {
      name: 'Ojito',
      image: 'assets/images/ojito.jpg',
      category: 'dulces',
      description: 'Galletita suave con centro de mermelada de frutilla.'
    },
    'P0995': {
      name: 'Polvoron',
      image: 'assets/images/polvoron.jpg',
      category: 'dulces',
      description: 'Dulce seco y arenoso que se deshace en la boca.'
    },
    'P0996': {
      name: 'Galletas chips de chocolate',
      image: 'assets/images/galletas-chips-chocolate.jpeg',
      category: 'dulces',
      description: 'Galletas con chips de chocolate. Incluye 4 unidades.'
    },
    'P0997': {
      name: 'Pastafrola',
      image: 'assets/images/pasta-frola.jpg',
      category: 'dulces',
      description: 'Pastafrola con dulce de membrillo de 20 cm.'
    },
    'P0625': {
      name: 'Pebetes de jamón y queso',
      image: 'assets/images/pebetes.jpg',
      category: 'sandwiches',
      description: '6 pebetes suaves y rellenos. Ideales para compartir.'
    },
    'P0044': {
      name: 'Medialuna rellena',
      image: 'assets/images/medialuna.jpg',
      category: 'sandwiches',
      description: 'Medialuna rellena con fiambre y queso.'
    },
    'P0035': {
      name: 'Sándwich de miga',
      image: 'assets/images/sandwiches-miga.jpg',
      category: 'sandwiches',
      description: 'Clásico, fresco y rendidor. Ideal para cualquier hora.',
      options: [
        {
          optionId: 'sabor-sandwich-miga',
          variantSkus: {
            'jamon-tomate': 'P0035_1',
            'jamon-choclo': 'P0035_2',
            'jamon-palmito': 'P0035_3',
            'jamon-huevo': 'P0035_6',
            'doble-queso': 'P0035_7'
          }
        }
      ]
    },
    'P0531': {
      name: 'Bocata olímpica',
      image: 'assets/images/bocata-olimpica.jpg',
      category: 'sandwiches',
      description: 'Bocata completa con mayonesa, lechuga, tomate y huevo duro.',
      options: [
        {
          optionId: 'tipo-bocata-olimpica',
          variantSkus: {
            'jamon': 'P0531_1',
            'salame': 'P0531_2'
          }
        }
      ]
    },
    'P0377': {
      name: 'Refuerzo clásico',
      image: 'assets/images/refuerzo.jpg',
      category: 'sandwiches',
      description: 'Pan tortuga relleno con fiambre y queso, simple y sabroso.',
      options: [
        {
          optionId: 'tipo-refuerzo',
          variantSkus: {
            'jamon-queso': 'P0377_1',
            'salame-queso': 'P0377_2'
          }
        }
      ]
    },
    'P0068': {
      name: 'Coca cola 1.5 Lt',
      image: 'assets/images/coca-cola-original-1.5ml.jpg',
      category: 'bebidas',
      description: 'Bebida clásica en formato grande para compartir.',
      options: [
        {
          optionId: 'coca-original-light',
          variantSkus: {
            'original': 'P0068',
            'light': 'P0068'
          }
        }
      ]
    },
    'P0070': {
      name: 'Coca cola 600 ml',
      image: 'assets/images/coca-cola-original-600ml.jpg',
      category: 'bebidas',
      description: 'Tamaño ideal para acompañar tu comida.',
      options: [
        {
          optionId: 'coca-original-light',
          variantSkus: {
            'original': 'P0070',
            'light': 'P0070'
          }
        }
      ]
    },
    'P0088': {
      name: 'Colet Conaprole 250 ml',
      image: 'assets/images/colet-250ml.jpeg',
      category: 'bebidas',
      description: 'Leche chocolatada cremosa y deliciosa.'
    },
    'P0239': {
      name: 'Jugo Conaprole 250 ml',
      image: 'assets/images/jugo-conaprole-250ml.jpeg',
      category: 'bebidas',
      description: 'Jugo natural refrescante, práctico y liviano.'
    }
  },
  /** Catálogo de opciones reutilizables. id → { label, choices: [{ id, name }] } */
  optionsCatalog: {
    'con-o-sin-sal': {
      label: 'Con o sin sal',
      choices: [
        { id: 'con-sal', name: 'Con sal' },
        { id: 'sin-sal', name: 'Sin sal' }
      ]
    },
    'sabor-empanada': {
      label: 'Sabor',
      choices: [
        { id: 'jamon-y-queso', name: 'Jamón y queso' },
        { id: 'carne', name: 'Carne' },
        { id: 'carne-y-aceituna', name: 'Carne y aceituna' },
        { id: 'pollo', name: 'Pollo' }
      ]
    },
    'sabor-sandwich-miga': {
      label: 'Sabor',
      choices: [
        { id: 'jamon-tomate', name: 'Jamón y tomate' },
        { id: 'jamon-choclo', name: 'Jamón y choclo' },
        { id: 'jamon-palmito', name: 'Jamón y palmito' },
        { id: 'jamon-huevo', name: 'Jamón y huevo' },
        { id: 'doble-queso', name: 'Doble queso' }
      ]
    },
    'tipo-bocata-olimpica': {
      label: 'Tipo',
      choices: [
        { id: 'jamon', name: 'Jamón' },
        { id: 'salame', name: 'Salame' }
      ]
    },
    'tipo-refuerzo': {
      label: 'Tipo',
      choices: [
        { id: 'jamon-queso', name: 'Jamón y queso' },
        { id: 'salame-queso', name: 'Salame y queso' }
      ]
    },
    'coca-original-light': {
      label: 'Variante',
      choices: [
        { id: 'original', name: 'Original' },
        { id: 'light', name: 'Light' }
      ]
    }
  },
  categories: [
    { id: 'todos', name: 'Todos' },
    { id: 'combos', name: 'Combos', tag: 'COMBO' },
    { id: 'panaderia', name: 'Panadería', tag: 'PANADERIA' },
    { id: 'galletas', name: 'Galletas y bizcochos', tag: 'GALLETAS' },
    { id: 'rotiseria', name: 'Rotisería', tag: 'ROTISERIA' },
    { id: 'dulces', name: 'Dulces', tag: 'DULCES' },
    { id: 'sandwiches', name: 'Sándwiches y refuerzos', tag: 'SANDWICH' },
    { id: 'bebidas', name: 'Bebidas', tag: 'BEBIDAS' }
  ],
  shippingCost: 80,
  minimumForShipping: 200,
  estimatedMinutes: '30-45',
  /** Marca mostrada en el header (izquierda) */
  brandName: "Nueva Río D'or",
  /** Tagline debajo de la marca */
  tagline: 'Horneamos con sabor cubano'
};

function getCatalogConfig() {
  return CATALOG_CONFIG;
}

function getProductConfig(sku) {
  const s = (sku || '').trim();
  return (CATALOG_CONFIG.products || {})[s] || null;
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
  const prods = CATALOG_CONFIG.products || {};
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

/** Devuelve el nombre comercial del producto. Prioridad: products[SKU].name > product.name */
function getProductDisplayName(product) {
  if (!product) return '';
  const cfg = getProductConfig(product.sku);
  if (cfg && (cfg.name || '').trim()) return cfg.name.trim();
  return (product.name || '').trim();
}

/** Devuelve la descripción del producto. Prioridad: products[SKU].description > product.description */
function getProductDescription(product) {
  if (!product) return '';
  const cfg = getProductConfig(product.sku);
  if (cfg && (cfg.description || '').trim()) return cfg.description.trim();
  return (product.description || (product.attributes && product.attributes.description) || '').trim();
}

/** Devuelve la config de opciones del producto. Una entrada por opción: [{ label, choices }, ...] */
function getProductOptionConfig(product) {
  if (!product) return [];
  const cfg = getProductConfig(product.sku);
  const optionsList = getProductOptionsList(cfg);
  if (optionsList.length === 0) return [];
  const optCatalog = CATALOG_CONFIG.optionsCatalog || {};
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

/** Devuelve el nombre a mostrar para una variante. Busca en todas las opciones del producto. */
function getVariantDisplayName(product, variant) {
  if (!product || !variant) return (variant && variant.name) || '';
  const cfg = getProductConfig(product.sku);
  const optionsList = getProductOptionsList(cfg);
  const optCatalog = CATALOG_CONFIG.optionsCatalog || {};
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

/** Agrupa variantes bajo el producto a mostrar. Solo retorna productos definidos en products. */
function getDisplayProducts(products) {
  const variantMap = getVariantToDisplayProduct();
  const catalogSkus = new Set(Object.keys(CATALOG_CONFIG.products || {}));
  const groups = {};
  const standalones = [];

  for (const p of products || []) {
    const sku = (p.sku || '').trim();
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

/** Devuelve el id de categoría del producto (por SKU). */
function getProductCategoryId(product) {
  if (!product) return null;
  const cfg = getProductConfig(product.sku);
  return (cfg && cfg.category) || null;
}

/** Resuelve cart item (productId, variantId) al SKU real para el pedido en la API. */
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

/** Ruta del icono de la app (imagen por defecto cuando el producto no tiene imagen). */
const DEFAULT_PRODUCT_IMAGE = 'assets/icons/icon-192.png';

/** Añade ?v= para cache busting a URLs de assets locales. */
function assetUrl(path) {
  if (!path) return '';
  const v = (typeof window !== 'undefined' && window.CATALOG_CACHE_VERSION) || Date.now();
  const sep = path.includes('?') ? '&' : '?';
  return path + sep + 'v=' + v;
}

function setCatalogConfigFromCompany(companyInfo) {
  if (!companyInfo) return;
  if (companyInfo.shippingCost != null) CATALOG_CONFIG.shippingCost = Number(companyInfo.shippingCost);
  if (companyInfo.minimumForShipping != null) CATALOG_CONFIG.minimumForShipping = Number(companyInfo.minimumForShipping);
  if (companyInfo.estimatedDeliveryMinutes != null) CATALOG_CONFIG.estimatedMinutes = String(companyInfo.estimatedDeliveryMinutes);
}

window.getCatalogConfig = getCatalogConfig;
window.getProductImagePath = getProductImagePath;
window.getProductCategoryId = getProductCategoryId;
window.getOrderProductId = getOrderProductId;
window.getProductDescription = getProductDescription;
window.getProductDisplayName = getProductDisplayName;
window.getProductOptionConfig = getProductOptionConfig;
window.getVariantDisplayName = getVariantDisplayName;
window.getDisplayProducts = getDisplayProducts;
window.getDefaultProductImage = () => DEFAULT_PRODUCT_IMAGE;
window.assetUrl = assetUrl;
window.setCatalogConfigFromCompany = setCatalogConfigFromCompany;
