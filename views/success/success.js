/**
 * Vista Success: confirmación, tiempo estimado, aclaración de que el comercio confirmará.
 */
(function () {
  window.showSuccess = function () {
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    const mins = config.estimatedMinutes || '30-45';
    document.getElementById('success-time').textContent = 'Tiempo estimado: ' + mins + ' min. El comercio te confirmará el pedido.';
    document.getElementById('success-new').onclick = (e) => {
      e.preventDefault();
      window.showView('home');
    };
    window.showView('success');
  };

  window.initSuccess = function () {
    document.getElementById('success-new').addEventListener('click', (e) => {
      e.preventDefault();
      if (window.cart) window.cart.clear();
      if (typeof window.updateCartCount === 'function') window.updateCartCount();
      window.showView('home');
    });
  };
})();
