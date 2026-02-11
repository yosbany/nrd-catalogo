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

  function productImageHtml(p) {
    const path = (p && p.imagePath) ? p.imagePath.trim() : '';
    if (!path) return '<div class="aspect-square bg-gray-100 flex items-center justify-center text-gray-400 text-4xl">📦</div>';
    const src = path.startsWith('assets/') || path.startsWith('/') ? path : 'assets/' + path;
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.name || '')}" class="w-full aspect-square object-cover bg-gray-100">`;
  }

  window.showCatalog = function (categoryId, productList) {
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    const categories = config.categories || [];
    const cat = categories.find((c) => c.id === categoryId);
    document.getElementById('catalog-title').textContent = cat ? cat.name : 'Productos';
    const container = document.getElementById('catalog-products');
    if (!container) return;
    container.innerHTML = '';
    (productList || []).forEach((p) => {
      const price = p.price != null ? p.price : 0;
      const card = document.createElement('div');
      card.className = 'bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm';
      card.innerHTML = `
        <div class="aspect-square overflow-hidden bg-gray-100">${productImageHtml(p)}</div>
        <div class="p-3">
          <h3 class="font-medium text-gray-900 line-clamp-2">${escapeHtml(p.name || '')}</h3>
          <p class="text-sm text-gray-600 mt-0.5">${formatCurrency(price)}</p>
          <button type="button" class="mt-2 w-full py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 catalog-add-btn" data-product-id="${escapeHtml(p.id || '')}">Ver / Agregar</button>
        </div>
      `;
      card.querySelector('.catalog-add-btn').addEventListener('click', () => {
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
