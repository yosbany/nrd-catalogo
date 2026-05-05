/**
 * Vista Success: confirmación, tiempo estimado. Visible unos segundos y luego va al carrito (pedido en curso).
 */
(function () {
  let successAutoNavTimeout = null;
  const SUCCESS_VIEW_SECONDS = 4;

  window.showSuccess = function () {
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    const mins = config.estimatedMinutes || '30-45';
    document.getElementById('success-time').textContent = 'Tiempo estimado: ' + mins + ' min. El comercio te confirmará el pedido.';
    document.getElementById('success-new').onclick = (e) => {
      e.preventDefault();
      if (successAutoNavTimeout) {
        clearTimeout(successAutoNavTimeout);
        successAutoNavTimeout = null;
      }
      window.showView('home');
    };
    window.showView('success');
    if (successAutoNavTimeout) clearTimeout(successAutoNavTimeout);
    successAutoNavTimeout = setTimeout(() => {
      successAutoNavTimeout = null;
      window.showView('cart');
    }, SUCCESS_VIEW_SECONDS * 1000);
  };

  window.initSuccess = function () {
    document.getElementById('success-new').addEventListener('click', (e) => {
      e.preventDefault();
      if (successAutoNavTimeout) {
        clearTimeout(successAutoNavTimeout);
        successAutoNavTimeout = null;
      }
      if (window.cart) window.cart.clear();
      if (typeof window.updateCartCount === 'function') window.updateCartCount();
      window.showView('home');
    });
  };
})();
