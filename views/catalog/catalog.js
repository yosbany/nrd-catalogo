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
    const displayName = typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || '');
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(displayName)}" class="w-full aspect-square object-cover bg-gray-100 rounded-none">`;
  }

  window.showCatalog = function (categoryId, productList) {
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    const categories = config.categories || [];
    const cat = categories.find((c) => c.id === categoryId);
    document.getElementById('catalog-title').textContent = cat ? cat.name : 'Productos';
    const container = document.getElementById('catalog-products');
    if (container) container.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';
    if (!container) return;
    container.innerHTML = '';
    (productList || []).forEach((p) => {
      const price = p.price != null ? p.price : 0;
      const desc = (typeof window.getProductDescription === 'function' ? window.getProductDescription(p) : (p.description || (p.attributes && p.attributes.description) || '').trim());
      const masVendido = isMasVendido(p);
      const card = document.createElement('div');
      card.className = 'flex bg-white border border-gray-200 overflow-hidden hover:border-red-300 transition-colors cursor-pointer';
      card.innerHTML = `
        <div class="flex-1 min-w-0 p-3 flex flex-col order-2 md:order-1">
          <div class="relative">
            ${masVendido ? '<span class="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 text-xs font-medium border border-amber-200 mb-1">Más vendido</span>' : ''}
            <h3 class="font-medium text-gray-900 line-clamp-2">${escapeHtml(typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || ''))}</h3>
            ${desc ? `<p class="text-sm text-gray-600 mt-0.5 line-clamp-2">${escapeHtml(desc)}</p>` : ''}
            <p class="text-red-600 font-medium mt-1">${formatCurrency(price)}</p>
          </div>
        </div>
        <div class="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 overflow-hidden bg-gray-100 rounded-none order-1 md:order-2">${productImageHtml(p)}</div>
      `;
      card.addEventListener('click', () => {
        if (typeof window.showProductDetail === 'function') window.showProductDetail(p);
      });
      container.appendChild(card);
    });
    document.getElementById('catalog-back').onclick = () => window.showView('home');
    window.showView('catalog');
  };

  window.initCatalog = function () {
    document.getElementById('catalog-back').addEventListener('click', () => window.showView('home'));
  };
})();
