/**
 * Vista Catálogo: listado filtrado por categoría.
 */
(function () {
  const formatCurrency = (n) => (n != null && !isNaN(n) ? '$ ' + Math.round(n).toLocaleString('es-UY') : '$ -');

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function getProductTags(p) {
    const raw = p.tags;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : (typeof raw === 'object' ? Object.values(raw) : []);
  }

  function isMasVendido(p) {
    if (p.masVendido === true) return true;
    if (p.attributes && p.attributes.masVendido === true) return true;
    const tags = getProductTags(p).map((t) => String(t).toUpperCase());
    return tags.includes('MAS_VENDIDO') || tags.includes('MASVENDIDO');
  }


  function productImageHtml(p) {
    const path = (typeof window.getProductImagePath === 'function' ? window.getProductImagePath(p) : (p && p.imagePath) ? p.imagePath.trim() : '') || '';
    const raw = path ? (path.startsWith('assets/') || path.startsWith('/') ? path : 'assets/' + path) : (typeof window.getDefaultProductImage === 'function' ? window.getDefaultProductImage() : 'assets/icons/icon-192.png');
    const src = typeof window.assetUrl === 'function' ? window.assetUrl(raw) : raw;
    const fallback = (typeof window.getDefaultProductImageUrl === 'function' ? window.getDefaultProductImageUrl() : 'assets/icons/icon-192.png');
    const displayName = typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || '');
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(displayName)}" class="w-full h-full object-cover bg-gray-100 rounded-none" data-fallback="${escapeHtml(fallback)}" onerror="this.onerror=null;var f=this.getAttribute('data-fallback');if(f)this.src=f;">`;
  }

  window.showCatalog = function (categoryId, productList) {
    window._lastCatalogCategoryId = categoryId;
    window._lastCatalogProductList = productList;
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    const categories = config.categories || [];
    const cat = categories.find((c) => c.id === categoryId);
    document.getElementById('catalog-title').textContent = cat ? cat.name : 'Productos';
    const container = document.getElementById('catalog-products');
    if (container) container.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';
    if (!container) return;
    container.innerHTML = '';
    const plusSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    (productList || []).forEach((p) => {
      const price = p.price != null ? p.price : 0;
      const desc = (typeof window.getProductDescription === 'function' ? window.getProductDescription(p) : (p.description || (p.attributes && p.attributes.description) || '').trim());
      const masVendido = isMasVendido(p);
      const productSku = (p && (p.sku || p.id || '')).toString().trim();
      const cartQty = typeof window.getCartQuantityForProduct === 'function' ? window.getCartQuantityForProduct(productSku) : 0;
      const optCfgs = typeof window.getProductOptionConfig === 'function' ? window.getProductOptionConfig(p) : [];
      const optArr = Array.isArray(optCfgs) ? optCfgs : (optCfgs ? [optCfgs] : []);
      const hasOptions = optArr.some((o) => o && o.choices && o.choices.length > 0);
      const card = document.createElement('div');
      card.className = 'flex relative bg-white border border-gray-200 overflow-hidden hover:border-red-300 transition-colors cursor-pointer';
      card.innerHTML = `
        ${cartQty > 0 ? `<span class="absolute top-1.5 right-1.5 z-10 min-w-[1.25rem] h-5 px-1 flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full">${cartQty}</span>` : ''}
        <button type="button" class="cart-add-one absolute bottom-1.5 right-1.5 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white border-2 border-red-600 text-red-600 hover:bg-red-50 hover:border-red-700 cursor-pointer" title="Agregar una unidad">${plusSvg}</button>
        <div class="flex-1 min-w-0 p-3 flex flex-col order-2 md:order-1">
          <div class="relative">
            ${masVendido ? '<span class="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-medium border border-amber-200 mb-1">Más vendido</span>' : ''}
            <h3 class="font-medium text-gray-900 line-clamp-2">${escapeHtml(typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || ''))}</h3>
            ${desc ? `<p class="text-sm text-gray-600 mt-0.5 line-clamp-2">${escapeHtml(desc)}</p>` : ''}
            <p class="text-red-600 font-medium mt-1">${formatCurrency(price)}</p>
            ${hasOptions ? '<button type="button" class="product-ver-opciones mt-1 text-left text-sm text-red-600 font-medium hover:text-red-700 hover:underline">Ver opciones →</button>' : ''}
          </div>
        </div>
        <div class="product-card-image w-24 md:w-32 flex-shrink-0 self-stretch overflow-hidden bg-gray-100 rounded-none order-1 md:order-2 flex items-stretch">${productImageHtml(p)}</div>
      `;
      card.addEventListener('click', (e) => {
        if (e.target.closest('.cart-add-one')) return;
        if (e.target.closest('.product-ver-opciones')) {
          e.preventDefault();
          if (typeof window.showProductDetail === 'function') window.showProductDetail(p, { openOptions: true });
          return;
        }
        if (typeof window.showProductDetail === 'function') window.showProductDetail(p);
      });
      const addBtn = card.querySelector('.cart-add-one');
      addBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        addBtn.classList.add('cart-add-one--pulse');
        addBtn.addEventListener('animationend', function removePulse() {
          addBtn.removeEventListener('animationend', removePulse);
          addBtn.classList.remove('cart-add-one--pulse');
        }, { once: true });
        if (hasOptions) {
          if (typeof window.showProductDetail === 'function') window.showProductDetail(p, { openOptions: true });
          if (typeof window.showView === 'function') window.showView('product');
        } else {
          if (typeof window.addOneToCartFromProduct === 'function') window.addOneToCartFromProduct(p);
          if (typeof window.refreshCatalogView === 'function') window.refreshCatalogView();
        }
      });
      container.appendChild(card);
    });
    document.getElementById('catalog-back').onclick = () => window.showView('home');
    window.showView('catalog');
  };

  window.refreshCatalogView = function () {
    if (window._lastCatalogCategoryId != null && window._lastCatalogProductList) {
      window.showCatalog(window._lastCatalogCategoryId, window._lastCatalogProductList);
    }
  };

  window.initCatalog = function () {
    document.getElementById('catalog-back').addEventListener('click', () => window.showView('home'));
  };
})();
