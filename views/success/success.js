/**
 * Vista Success: confirmación, tiempo estimado. Visible unos segundos y luego va al carrito (pedido en curso).
 */
(function () {
  let successAutoNavTimeout = null;
  const SUCCESS_VIEW_SECONDS = 4;

  /**
   * @param {{ paymentReturn?: string, paymentStatus?: string }|undefined} opts
   */
  window.showSuccess = function (opts) {
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    const mins = config.estimatedMinutes || '30-45';
    const titleEl = document.getElementById('success-title');
    const msgEl = document.getElementById('success-message');
    const timeEl = document.getElementById('success-time');
    const iconEl = document.getElementById('success-icon');

    const paymentReturn = opts && opts.paymentReturn;
    const paymentStatus = (opts && opts.paymentStatus) || '';

    let title = 'Pedido enviado';
    let message = 'Te contactaremos para confirmarlo.';
    let timeText = 'Tiempo estimado: ' + mins + ' min. El comercio te confirmará el pedido.';
    let icon = '✓';
    let titleClass = 'text-xl font-semibold text-green-700 mb-2';

    if (paymentReturn === 'success' || paymentStatus === 'approved') {
      title = 'Pago aprobado';
      message = 'Tu pedido ya está registrado. Te confirmaremos la preparación.';
      timeText = 'Tiempo estimado: ' + mins + ' min.';
      icon = '✓';
    } else if (paymentReturn === 'pending' || paymentStatus === 'pending') {
      title = 'Pago pendiente';
      message = 'Mercado Pago aún está procesando el pago. Te avisaremos cuando se acredite.';
      timeText = 'Podés seguir el estado en Mi pedido.';
      icon = '…';
      titleClass = 'text-xl font-semibold text-amber-700 mb-2';
    } else if (paymentReturn === 'failure' || paymentStatus === 'rejected' || paymentStatus === 'cancelled') {
      title = 'Pago no completado';
      message = 'El pago no se acreditó. El pedido quedó pendiente; podés intentar de nuevo o elegir otro medio.';
      timeText = 'Revisá el estado en Mi pedido o contactá al local.';
      icon = '!';
      titleClass = 'text-xl font-semibold text-red-700 mb-2';
    }

    if (titleEl) {
      titleEl.textContent = title;
      titleEl.className = titleClass;
    }
    if (msgEl) msgEl.textContent = message;
    if (timeEl) timeEl.textContent = timeText;
    if (iconEl) iconEl.textContent = icon;

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
