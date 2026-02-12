/**
 * Vista Home: nombre comercio, tiempo/envío/mínimo, buscador, categorías, listado productos.
 */
(function () {
  const config = window.getCatalogConfig || (() => ({}));
  const formatCurrency = (n) => {
    if (n == null || isNaN(n)) return '$ -';
    return '$ ' + Math.round(n).toLocaleString('es-UY');
  };

  function productImageHtml(p) {
    const path = (typeof window.getProductImagePath === 'function' ? window.getProductImagePath(p) : (p && p.imagePath) ? p.imagePath.trim() : '') || '';
    const raw = path ? (path.startsWith('assets/') || path.startsWith('/') ? path : 'assets/' + path) : (typeof window.getDefaultProductImage === 'function' ? window.getDefaultProductImage() : 'assets/icons/icon-192.png');
    const src = typeof window.assetUrl === 'function' ? window.assetUrl(raw) : raw;
    const fallback = (typeof window.getDefaultProductImageUrl === 'function' ? window.getDefaultProductImageUrl() : 'assets/icons/icon-192.png');
    const displayName = typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || '');
    return `<img src="${escapeHtml(src)}" alt="${escapeHtml(displayName)}" class="w-full h-full object-cover bg-gray-100 rounded-none" data-fallback="${escapeHtml(fallback)}" onerror="this.onerror=null;var f=this.getAttribute('data-fallback');if(f)this.src=f;">`;
  }

  function getProductTags(p) {
    const raw = p.tags;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : (typeof raw === 'object' ? Object.values(raw) : []);
  }

  function findProductCategory(product) {
    const cats = config().categories || [];
    const cfgCatId = typeof window.getProductCategoryId === 'function' ? window.getProductCategoryId(product) : null;
    if (cfgCatId) {
      const cat = cats.find((c) => c.id === cfgCatId);
      if (cat) return cat;
    }
    const tags = getProductTags(product).map((t) => String(t).toUpperCase());
    const catsWithTag = cats.filter((c) => c.tag);
    for (const cat of catsWithTag) {
      const tag = (cat.tag || '').toUpperCase();
      if (tags.includes(tag)) return cat;
    }
    return null;
  }

  function filterProducts(products, categoryId, searchTerm) {
    let list = products || [];
    const cat = (config().categories || []).find((c) => c.id === categoryId);
    if (cat && categoryId !== 'todos') {
      if (cat.tag) {
        const tag = cat.tag.toUpperCase();
        list = list.filter((p) => {
          const cfgCatId = typeof window.getProductCategoryId === 'function' ? window.getProductCategoryId(p) : null;
          if (cfgCatId === categoryId) return true;
          return getProductTags(p).some((t) => String(t).toUpperCase() === tag);
        });
      } else {
        list = list.filter((p) => (typeof window.getProductCategoryId === 'function' ? window.getProductCategoryId(p) : null) === categoryId);
      }
    }
    if (searchTerm && searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      list = list.filter((p) => ((typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || '')) || '').toLowerCase().includes(term));
    }
    return list;
  }

  function groupProductsBySection(products) {
    const cats = (config().categories || []).filter((c) => c.tag);
    const sections = cats.map((c) => ({ id: c.id, name: c.name, products: [] }));
    const otros = { id: 'otros', name: 'Otros', products: [] };

    for (const p of products) {
      const cat = findProductCategory(p);
      if (cat) {
        const sec = sections.find((s) => s.id === cat.id);
        if (sec) sec.products.push(p);
        else otros.products.push(p);
      } else {
        otros.products.push(p);
      }
    }

    return [...sections.filter((s) => s.products.length > 0), ...(otros.products.length > 0 ? [otros] : [])];
  }

  function isMasVendido(p) {
    if (p.masVendido === true) return true;
    if (p.attributes && p.attributes.masVendido === true) return true;
    const tags = getProductTags(p).map((t) => String(t).toUpperCase());
    return tags.includes('MAS_VENDIDO') || tags.includes('MASVENDIDO');
  }


  function addOneToCartFromProduct(p) {
    if (!window.cart) return;
    const productName = (typeof window.getProductDisplayName === 'function' ? window.getProductDisplayName(p) : (p.name || '')) || '';
    const hasVariants = p.variants && Array.isArray(p.variants) && p.variants.length > 0;
    if (hasVariants) {
      const v = p.variants[0];
      const variantId = (v.id ?? v.sku ?? v.name ?? '').toString().trim();
      const variantName = (v.name ?? '').toString().trim();
      const price = v.price != null ? v.price : (p.price != null ? p.price : 0);
      window.cart.add(p.id, productName, price, 1, { variantId, variantName });
    } else {
      const price = p.price != null ? p.price : 0;
      window.cart.add(p.id, productName, price, 1, {});
    }
    if (typeof window.updateCartCount === 'function') window.updateCartCount();
  }
  window.addOneToCartFromProduct = addOneToCartFromProduct;

  function addOneToCart(p) {
    addOneToCartFromProduct(p);
    render();
  }

  function renderProductCard(p) {
    const price = p.price != null ? p.price : 0;
    const desc = (typeof window.getProductDescription === 'function' ? window.getProductDescription(p) : (p.description || (p.attributes && p.attributes.description) || '').trim());
    const masVendido = isMasVendido(p);
    const productSku = (p && (p.sku || p.id || '')).toString().trim();
    const cartQty = typeof window.getCartQuantityForProduct === 'function' ? window.getCartQuantityForProduct(productSku) : 0;
    const optCfgs = typeof window.getProductOptionConfig === 'function' ? window.getProductOptionConfig(p) : [];
    const optArr = Array.isArray(optCfgs) ? optCfgs : (optCfgs ? [optCfgs] : []);
    const hasOptions = optArr.some((o) => o && o.choices && o.choices.length > 0);
    const plusSvg = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    const card = document.createElement('div');
    card.className = 'flex relative bg-white border border-gray-200 overflow-hidden hover:border-red-300 transition-colors cursor-pointer';
    card.dataset.productId = (p && p.id) ? String(p.id) : '';
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
        addOneToCart(p);
      }
    });
    return card;
  }

  function renderProducts(list, categoryId) {
    const container = document.getElementById('home-products');
    if (!container) return;
    container.innerHTML = '';

    const useSections = categoryId === 'todos' && list.length > 0;
    if (useSections) {
      const sections = groupProductsBySection(list);
      sections.forEach((sec) => {
        const header = document.createElement('h3');
        header.className = 'text-base font-semibold text-gray-900 py-3 border-b border-gray-200 mt-4 first:mt-0';
        header.textContent = sec.name;
        container.appendChild(header);
        const sectionWrap = document.createElement('div');
        sectionWrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';
        sec.products.forEach((p) => sectionWrap.appendChild(renderProductCard(p)));
        container.appendChild(sectionWrap);
      });
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'grid grid-cols-1 md:grid-cols-2 gap-2';
      (list || []).forEach((p) => wrap.appendChild(renderProductCard(p)));
      container.appendChild(wrap);
    }
    highlightLastAddedProduct();
  }

  function highlightLastAddedProduct() {
    const lastAdded = typeof window.getAndClearLastAddedProductFromStorage === 'function' ? window.getAndClearLastAddedProductFromStorage() : null;
    if (!lastAdded || !lastAdded.productId) return;
    requestAnimationFrame(() => {
      const container = document.getElementById('home-products');
      if (!container) return;
      const cards = container.querySelectorAll('[data-product-id]');
      const card = Array.from(cards).find((c) => c.dataset.productId === String(lastAdded.productId));
      if (!card) return;
      card.classList.add('ring-2', 'ring-red-500', 'ring-offset-2');
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        card.classList.remove('ring-2', 'ring-red-500', 'ring-offset-2');
      }, 3000);
    });
  }

  let currentCategoryId = 'todos';
  /** true = más bajo primero (asc), false = más alto primero (desc). Toggle entre ambos. */
  let sortByPriceAsc = true;

  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function openSectionDropdown() {
    const dd = document.getElementById('home-section-dropdown');
    if (dd) dd.classList.remove('hidden');
  }

  function closeSectionDropdown() {
    const dd = document.getElementById('home-section-dropdown');
    if (dd) dd.classList.add('hidden');
  }

  function render() {
    const bannerEl = document.getElementById('store-closed-banner');
    if (bannerEl && typeof window.isStoreOpen === 'function') {
      bannerEl.classList.toggle('hidden', window.isStoreOpen());
    }
    const cfg = config();
    const categories = cfg.categories || [];
    const sectionBtn = document.getElementById('home-section-btn');
    const sectionBtnText = document.getElementById('home-section-btn-text');
    const sectionDropdown = document.getElementById('home-section-dropdown');
    const currentCat = categories.find((c) => c.id === currentCategoryId);
    if (sectionBtnText) sectionBtnText.textContent = currentCat ? currentCat.name : 'Todos';
    if (sectionDropdown) {
      sectionDropdown.innerHTML = categories.map((c) => `<button type="button" class="home-section-option block w-full text-left px-3 py-2 text-sm hover:bg-red-50 hover:text-red-700 ${c.id === currentCategoryId ? 'bg-red-50 text-red-700 font-medium' : 'text-gray-700'}" data-category="${escapeHtml(c.id)}">${escapeHtml(c.name)}</button>`).join('');
      sectionDropdown.querySelectorAll('.home-section-option').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          currentCategoryId = btn.dataset.category;
          closeSectionDropdown();
          const sectionBtnTextEl = document.getElementById('home-section-btn-text');
          const selectedCat = categories.find((c) => c.id === currentCategoryId);
          if (sectionBtnTextEl) sectionBtnTextEl.textContent = selectedCat ? selectedCat.name : 'Todos';
          applyFiltersAndRender();
        });
      });
    }
    if (sectionBtn && sectionDropdown) {
      sectionBtn.onclick = (e) => {
        e.stopPropagation();
        if (sectionDropdown.classList.contains('hidden')) openSectionDropdown();
        else closeSectionDropdown();
          };
    }

    const sortPriceBtn = document.getElementById('home-sort-price-btn');
    const sortPriceBtnText = document.getElementById('home-sort-price-btn-text');
    const sortPriceBtnIcon = document.getElementById('home-sort-price-btn-icon');
    if (sortPriceBtnText) sortPriceBtnText.textContent = sortByPriceAsc ? 'Más bajo primero' : 'Más alto primero';
    if (sortPriceBtnIcon) {
      const upArrow = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
      const downArrow = '<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>';
      sortPriceBtnIcon.innerHTML = sortByPriceAsc ? upArrow : downArrow;
    }
    if (sortPriceBtn) {
      sortPriceBtn.onclick = () => {
        sortByPriceAsc = !sortByPriceAsc;
        render();
      };
    }

    applyFiltersAndRender();
  }

  function applyFiltersAndRender() {
    const searchEl = document.getElementById('home-search');
    const raw = window.getProducts() || [];
    const display = typeof window.getDisplayProducts === 'function' ? window.getDisplayProducts(raw) : raw;
    let list = filterProducts(display, currentCategoryId, searchEl ? searchEl.value : '');
    list = [...list].sort((a, b) => {
      const pa = a.price != null ? a.price : 0;
      const pb = b.price != null ? b.price : 0;
      return sortByPriceAsc ? pa - pb : pb - pa;
    });
    renderProducts(list, currentCategoryId);
  }

  window.initHome = function () {
    const searchEl = document.getElementById('home-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => applyFiltersAndRender());
      searchEl.addEventListener('search', () => applyFiltersAndRender());
    }
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('home-section-wrap');
      if (wrap && !wrap.contains(e.target)) closeSectionDropdown();
    });
    const sectionDropdown = document.getElementById('home-section-dropdown');
    if (sectionDropdown) sectionDropdown.addEventListener('click', (e) => e.stopPropagation());
    render();
  };

  window.renderView = window.renderView || (function () {});
  const orig = window.renderView;
  window.renderView = function (name) {
    if (typeof orig === 'function') orig(name);
    if (name === 'home') render();
  };
})();
