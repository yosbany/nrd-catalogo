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
    const path = (typeof window.getProductImagePath === 'function' ? window.getProductImagePath(p) : (p && p.imagePath) ? p.imagePath.trim() : '') || '';
    const raw = path ? (path.startsWith('assets/') || path.startsWith('/') ? path : 'assets/' + path) : (typeof window.getDefaultProductImage === 'function' ? window.getDefaultProductImage() : 'assets/icons/icon-192.png');
    const src = typeof window.assetUrl === 'function' ? window.assetUrl(raw) : raw;
    const fallback = (typeof window.getDefaultProductImageUrl === 'function' ? window.getDefaultProductImageUrl() : 'assets/icons/icon-192.png');
    const displayName = typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || '');
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(displayName)}" class="w-full aspect-[4/3] object-cover bg-gray-100 rounded-none" data-fallback="${escapeHtml(fallback)}" onerror="this.onerror=null;var f=this.getAttribute('data-fallback');if(f)this.src=f;">`;
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

  function updateAddButton(addBtn, qty, total, needsSelection) {
    if (!addBtn) return;
    if (needsSelection) {
      addBtn.innerHTML = '<span class="flex-1 text-center text-sm">Seleccione opción</span>';
      addBtn.disabled = true;
      addBtn.classList.add('opacity-70', 'cursor-not-allowed');
      return;
    }
    addBtn.disabled = false;
    addBtn.classList.remove('opacity-70', 'cursor-not-allowed');
    addBtn.innerHTML = `
      <span class="flex items-center justify-center w-7 h-7 rounded-full bg-white/25 text-white font-medium text-xs">${qty}</span>
      <span class="flex-1 text-center text-sm">Agregar a mi pedido</span>
      <span class="font-semibold text-sm">${formatCurrency(total)}</span>
    `;
  }

  window.showProductDetail = function (product, opts) {
    opts = opts && typeof opts === 'object' ? opts : {};
    const openOptionsModal = !!opts.openOptions;
    const sku = (product && (product.sku || product.id || '')).trim();
    if (sku && typeof window.isProductActiveInCatalog === 'function' && !window.isProductActiveInCatalog(sku)) {
      if (typeof window.showView === 'function') window.showView('home');
      return;
    }
    currentProduct = product;
    const content = document.getElementById('product-content');
    const addBtn = document.getElementById('product-add-cart');
    if (!content || !addBtn) return;

    let variants = getVariants(product).filter((v) => v.active !== false && v.esVendible !== false);
    let optCfgs = typeof window.getProductOptionConfig === 'function' ? window.getProductOptionConfig(product) : [];
    if (!Array.isArray(optCfgs)) optCfgs = optCfgs ? [optCfgs] : [];
    const optCfg = optCfgs.length > 0 ? optCfgs[0] : null;
    const basePrice = product.price != null ? product.price : 0;
    if (optCfg && optCfg.choices && optCfg.choices.length > 0) {
      const ordered = optCfg.choices.map((c) => {
        const sku = String(c.variantSku || c.variantId || '').trim();
        const found = variants.find((v) => String(v.sku ?? v.id ?? v.name ?? '').trim() === sku);
        const price = found && found.price != null ? found.price : basePrice;
        return { sku, id: c.id || sku, name: c.name, price };
      }).filter((c) => c.sku);
      if (ordered.length > 0) variants = ordered;
    }
    const price = product.price != null ? product.price : 0;
    const hasVariants = variants.length > 0;
    const selectedVariant = null;
    const priceDisplay = price;
    const desc = (typeof window.getProductDescription === 'function' ? window.getProductDescription(product) : (product.description || (product.attributes && product.attributes.description) || '').trim());
    const optionLabel = (optCfg && optCfg.label) || 'Elegir opción *';
    const getVariantLabel = (v) => {
      const vId = String(v.id ?? '').trim();
      const vSku = String(v.sku ?? v.id ?? v.name ?? '').trim();
      let choice = null;
      if (optCfg && optCfg.choices) {
        choice = optCfg.choices.find((c) => (c.id || '').trim() === vId) || optCfg.choices.find((c) => (c.variantSku || c.variantId || '').trim() === vSku);
      }
      return choice ? choice.name : (typeof window.getVariantDisplayName === 'function' ? window.getVariantDisplayName(product, v) : v.name) || v.name || '';
    };

    content.innerHTML = `
      <div class="relative aspect-[3/2] max-h-[40vh] overflow-hidden bg-gray-100 rounded-none">
        ${productImageHtml(product)}
        <button type="button" id="product-back" class="absolute top-2 left-2 w-9 h-9 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 text-base font-light">✕</button>
      </div>
      <div class="px-3 pt-2 pb-1">
        <h3 class="text-lg font-bold text-gray-900">${escapeHtml(typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(product) : (product.name || ''))}</h3>
        ${desc ? `<p class="text-xs text-gray-600 mt-0.5 line-clamp-2">${escapeHtml(desc)}</p>` : ''}
        <p id="product-price-display" class="text-lg font-bold text-gray-900 mt-1">${formatCurrency(priceDisplay)}</p>
        ${hasVariants ? `
          <div class="mt-2 flex items-center justify-between p-2 border border-gray-300 rounded-lg bg-white">
            <span class="text-xs font-semibold text-gray-900">${escapeHtml(optionLabel)}</span>
            <button type="button" id="product-variant-btn" class="py-1 px-2.5 text-xs text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50">Seleccione</button>
          </div>
          <div id="product-option-modal" class="fixed inset-0 bg-black/50 p-4 z-[100]" style="display: none; align-items: center; justify-content: center;">
            <div class="bg-white rounded-lg w-full max-w-sm shadow-xl">
              <div class="flex items-center gap-2 p-4 border-b border-gray-200">
                <button type="button" id="product-option-modal-back" class="p-1 text-gray-600 hover:bg-gray-100 rounded">‹</button>
                <h3 class="font-semibold text-gray-900">${escapeHtml(optionLabel)}</h3>
              </div>
              <div class="p-4">
                <p class="text-sm font-semibold text-gray-900 mb-3">Elige</p>
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                  ${variants.map((v, i) => `<label class="flex items-center gap-3 p-3 border-b border-gray-200 last:border-b-0 cursor-pointer hover:bg-gray-50 product-option-radio">
                    <input type="radio" name="product-option-choice" value="${escapeHtml(String(v.id ?? v.sku ?? v.name ?? '').trim())}" data-price="${v.price != null ? v.price : 0}" class="text-red-600">
                    <span class="text-gray-900">${escapeHtml(getVariantLabel(v))} - ${formatCurrency(v.price)}</span>
                  </label>`).join('')}
                </div>
              </div>
              <div class="p-4 border-t border-gray-200">
                <button type="button" id="product-option-aceptar" class="w-full py-3 bg-red-600 text-white font-medium hover:bg-red-700 rounded-lg">Aceptar</button>
              </div>
            </div>
          </div>
        ` : ''}
        <div class="flex items-center justify-between mt-2">
          <label class="text-xs font-semibold text-gray-900">Unidades</label>
          <div class="flex items-center rounded-lg border border-gray-300 overflow-hidden">
            <button type="button" id="product-qty-minus" class="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-lg font-light">−</button>
            <input type="number" id="product-qty" min="1" value="1" class="w-10 text-center py-1.5 text-sm border-0 border-x border-gray-300 focus:outline-none focus:ring-0">
            <button type="button" id="product-qty-plus" class="w-9 h-9 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 text-lg font-light">+</button>
          </div>
        </div>
        <label class="block text-xs font-semibold text-gray-900 mt-2">Notas para este producto</label>
        <textarea id="product-notes" maxlength="250" rows="2" placeholder="El local intentará seguirlas cuando lo prepare." class="mt-0.5 w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"></textarea>
        <p id="product-notes-counter" class="text-[10px] text-gray-500 mt-0.5 text-right">0/250</p>
      </div>
    `;

    const qtyEl = content.querySelector('#product-qty');
    const notesEl = content.querySelector('#product-notes');
    const notesCounter = content.querySelector('#product-notes-counter');
    const variantBtn = content.querySelector('#product-variant-btn');
    const optionModal = content.querySelector('#product-option-modal');
    const optionModalBack = content.querySelector('#product-option-modal-back');
    const optionAceptar = content.querySelector('#product-option-aceptar');
    const qtyMinus = content.querySelector('#product-qty-minus');
    const qtyPlus = content.querySelector('#product-qty-plus');

    function getVariantKey(v) {
      return String(v.id ?? v.sku ?? v.name ?? '').trim();
    }
    function getSelectedVariant() {
      if (!hasVariants) return null;
      const radio = content.querySelector('input[name="product-option-choice"]:checked');
      if (!radio) return null;
      const key = (radio.value || '').trim();
      if (!key) return null;
      return variants.find((v) => getVariantKey(v) === key) || null;
    }
    function updateVariantButton() {
      const v = getSelectedVariant();
      if (variantBtn) variantBtn.textContent = v ? getVariantLabel(v) : 'Seleccione';
    }

    if (variantBtn && optionModal) {
      variantBtn.addEventListener('click', () => {
        optionModal.style.display = 'flex';
      });
    }
    if (optionModalBack) optionModalBack.addEventListener('click', () => { optionModal.style.display = 'none'; });
    if (optionAceptar) {
      optionAceptar.addEventListener('click', () => {
        if (optionModal) optionModal.style.display = 'none';
        const v = getSelectedVariant();
        const priceEl = content.querySelector('#product-price-display');
        if (v && priceEl) priceEl.textContent = formatCurrency(v.price);
        updateVariantButton();
        updateAddButton(addBtn, getQuantity(), getPrice() * getQuantity(), hasVariants && !getSelectedVariant());
      });
    }
    content.querySelectorAll('input[name="product-option-choice"]').forEach((r) => {
      r.addEventListener('change', () => {
        updateVariantButton();
        const priceEl = content.querySelector('#product-price-display');
        const v = getSelectedVariant();
        if (v && priceEl) priceEl.textContent = formatCurrency(v.price);
        updateAddButton(addBtn, getQuantity(), getPrice() * getQuantity(), hasVariants && !getSelectedVariant());
      });
    });
    updateVariantButton();

    if (notesEl && notesCounter) {
      const updateCounter = () => { notesCounter.textContent = (notesEl.value || '').length + '/250'; };
      notesEl.addEventListener('input', updateCounter);
      notesEl.addEventListener('change', updateCounter);
    }

    function getQuantity() {
      return Math.max(1, parseInt(qtyEl?.value || '1', 10) || 1);
    }
    function setQuantity(n) {
      const v = Math.max(1, n);
      if (qtyEl) qtyEl.value = String(v);
      updateAddButton(addBtn, v, getPrice() * v, hasVariants && !getSelectedVariant());
    }
    function getNotes() {
      return (notesEl?.value || '').trim();
    }
    function getPrice() {
      const v = getSelectedVariant();
      if (v && v.price != null) return v.price;
      return price;
    }

    if (qtyMinus) qtyMinus.addEventListener('click', () => setQuantity(getQuantity() - 1));
    if (qtyPlus) qtyPlus.addEventListener('click', () => setQuantity(getQuantity() + 1));
    if (qtyEl) {
      qtyEl.addEventListener('change', () => updateAddButton(addBtn, getQuantity(), getPrice() * getQuantity(), hasVariants && !getSelectedVariant()));
    }

    updateAddButton(addBtn, 1, getPrice(), hasVariants && !getSelectedVariant());

    addBtn.onclick = () => {
      if (hasVariants && !getSelectedVariant()) return;
      const qty = getQuantity();
      const notes = getNotes();
      const v = getSelectedVariant();
      const finalPrice = getPrice();
      const productName = (typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(product) : (product.name || '')) || '';
      const variantId = v ? (v.id || v.name) : null;
      const variantName = v ? v.name : null;
      window.cart.add(product.id, productName, finalPrice, qty, { variantId, variantName, notes });
      if (typeof window.setLastAddedProductToStorage === 'function') {
        window.setLastAddedProductToStorage({ productId: product.id, variantId });
      }
      window.updateCartCount();
      window.showView('home');
    };

    document.getElementById('product-back').onclick = () => window.showView('home');
    window.showView('product');
    if (openOptionsModal && hasVariants && optionModal) {
      setTimeout(() => {
        optionModal.style.display = 'flex';
        optionModal.style.alignItems = 'center';
        optionModal.style.justifyContent = 'center';
      }, 50);
    }
  };

  window.initProductDetail = function () {
    // product-back is created dynamically in showProductDetail
  };
})();
