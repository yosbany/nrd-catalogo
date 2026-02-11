/**
 * Vista Detalle de producto: imagen, descripción, precio, cantidad, notas, opciones obligatorias, agregar al carrito.
 */
(function () {
  let currentProduct = null;
  const formatCurrency = (n) => (n != null && !isNaN(n) ? '$ ' + Math.round(n).toLocaleString('es-UY') : '$ -');

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function productImageHtml(p) {
    const path = (p && p.imagePath) ? p.imagePath.trim() : '';
    if (!path) return '<div class="aspect-video bg-gray-100 flex items-center justify-center text-5xl text-gray-400">📦</div>';
    const src = path.startsWith('assets/') || path.startsWith('/') ? path : 'assets/' + path;
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.name || '')}" class="w-full aspect-video object-cover bg-gray-100">`;
  }

  function getVariants(product) {
    const v = product.variants;
    if (!v) return [];
    return Array.isArray(v) ? v : (typeof v === 'object' ? Object.values(v) : []);
  }

  function hasRequiredOptions(product) {
    const variants = getVariants(product).filter((x) => x.active !== false && x.esVendible !== false);
    return variants.length > 0;
  }

  window.showProductDetail = function (product) {
    currentProduct = product;
    const content = document.getElementById('product-content');
    const addBtn = document.getElementById('product-add-cart');
    if (!content || !addBtn) return;

    const variants = getVariants(product).filter((v) => v.active !== false && v.esVendible !== false);
    const price = product.price != null ? product.price : 0;
    const hasVariants = variants.length > 0;
    let selectedVariant = hasVariants ? variants[0] : null;
    const priceDisplay = selectedVariant != null ? selectedVariant.price : price;

    content.innerHTML = `
      <div class="aspect-video overflow-hidden bg-gray-100">${productImageHtml(product)}</div>
      <div class="p-4">
        <h2 class="text-lg font-semibold text-gray-900">${escapeHtml(product.name || '')}</h2>
        <p class="text-red-600 font-medium mt-1">${formatCurrency(priceDisplay)}</p>
        ${hasVariants ? `
          <label class="block text-sm font-medium text-gray-700 mt-3">Elegir opción *</label>
          <select id="product-variant-select" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
            ${variants.map((v) => `<option value="${escapeHtml(v.id || v.name)}" data-price="${v.price != null ? v.price : 0}">${escapeHtml(v.name)} - ${formatCurrency(v.price)}</option>`).join('')}
          </select>
        ` : ''}
        <label class="block text-sm font-medium text-gray-700 mt-3">Cantidad</label>
        <input type="number" id="product-qty" min="1" value="1" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
        <label class="block text-sm font-medium text-gray-700 mt-3">Notas para este producto (opcional)</label>
        <input type="text" id="product-notes" placeholder="Ej: sin cebolla" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg">
      </div>
    `;

    const qtyEl = content.querySelector('#product-qty');
    const notesEl = content.querySelector('#product-notes');
    const variantSelect = content.querySelector('#product-variant-select');

    function getQuantity() {
      return Math.max(1, parseInt(qtyEl?.value || '1', 10) || 1);
    }
    function getNotes() {
      return (notesEl?.value || '').trim();
    }
    function getSelectedVariant() {
      if (!variantSelect) return null;
      const opt = variantSelect.options[variantSelect.selectedIndex];
      if (!opt) return null;
      const id = opt.value;
      return variants.find((v) => (v.id || v.name) === id) || null;
    }
    function getPrice() {
      const v = getSelectedVariant();
      if (v && v.price != null) return v.price;
      return price;
    }

    if (variantSelect) {
      variantSelect.addEventListener('change', () => {
        const v = getSelectedVariant();
        if (v) content.querySelector('.text-red-600').textContent = formatCurrency(v.price);
      });
    }

    addBtn.onclick = () => {
      if (hasVariants && !getSelectedVariant()) return;
      const qty = getQuantity();
      const notes = getNotes();
      const v = getSelectedVariant();
      const finalPrice = getPrice();
      const productName = product.name || '';
      const variantId = v ? (v.id || v.name) : null;
      const variantName = v ? v.name : null;
      window.cart.add(product.id, productName, finalPrice, qty, { variantId, variantName, notes });
      window.updateCartCount();
      window.showView('home');
    };

    document.getElementById('product-back').onclick = () => window.showView('home');
    window.showView('product');
  };

  window.initProductDetail = function () {
    document.getElementById('product-back').addEventListener('click', () => window.showView('home'));
  };
})();
