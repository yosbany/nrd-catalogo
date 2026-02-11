/**
 * Vista Checkout: tipo entrega (retiro/envío), dirección si envío, nombre, teléfono, observaciones, medio de pago, efectivo (monto/cambio), resumen, confirmar.
 */
(function () {
  const formatCurrency = (n) => (n != null && !isNaN(n) ? '$ ' + Math.round(n).toLocaleString('es-UY') : '$ -');

  function getDeliveryType() {
    const r = document.querySelector('input[name="deliveryType"]:checked');
    return r ? r.value : 'retiro';
  }

  function getShippingCost() {
    if (getDeliveryType() !== 'envio') return 0;
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    return config.shippingCost || 0;
  }

  function getMinimum() {
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    return config.minimumForShipping || 0;
  }

  function updateTotals() {
    const subtotal = window.cart ? window.cart.getSubtotal() : 0;
    const shipping = getShippingCost();
    const total = subtotal + shipping;
    document.getElementById('checkout-subtotal').textContent = formatCurrency(subtotal);
    const shipRow = document.getElementById('checkout-shipping-row');
    const shipVal = document.getElementById('checkout-shipping');
    if (getDeliveryType() === 'envio') {
      shipRow.classList.remove('hidden');
      shipVal.textContent = formatCurrency(shipping);
    } else {
      shipRow.classList.add('hidden');
    }
    document.getElementById('checkout-total').textContent = formatCurrency(total);
    const payEfectivo = document.querySelector('input[name="payment"][value="efectivo"]');
    const cashWrap = document.getElementById('checkout-cash-wrap');
    const cashInput = document.getElementById('checkout-cash');
    const changeEl = document.getElementById('checkout-change');
    const warnEl = document.getElementById('checkout-cash-warning');
    if (payEfectivo && payEfectivo.checked && cashWrap) {
      cashWrap.classList.remove('hidden');
      const cash = parseFloat(cashInput?.value || '0') || 0;
      if (cash > total && changeEl) {
        changeEl.textContent = 'Cambio estimado: ' + formatCurrency(cash - total);
        changeEl.classList.remove('hidden');
        if (warnEl) warnEl.classList.add('hidden');
      } else if (cash > 0 && cash < total && warnEl) {
        warnEl.textContent = 'El monto es menor al total.';
        warnEl.classList.remove('hidden');
        if (changeEl) changeEl.classList.add('hidden');
      } else {
        if (changeEl) changeEl.classList.add('hidden');
        if (warnEl) warnEl.classList.add('hidden');
      }
    } else if (cashWrap) {
      cashWrap.classList.add('hidden');
    }
  }

  window.renderCheckout = function () {
    const isEnvio = getDeliveryType() === 'envio';
    document.getElementById('checkout-address-wrap').classList.toggle('hidden', !isEnvio);
    document.querySelectorAll('.checkout-type-option').forEach((el) => {
      el.classList.toggle('has-border', (el.dataset.type || '') === getDeliveryType());
    });
    updateTotals();
  };

  window.initCheckout = function () {
    document.querySelectorAll('input[name="deliveryType"]').forEach((r) => {
      r.addEventListener('change', () => {
        document.getElementById('checkout-address-wrap').classList.toggle('hidden', r.value !== 'envio');
        document.querySelectorAll('.checkout-type-option').forEach((opt) => {
          opt.classList.toggle('has-border', (opt.dataset.type || '') === r.value);
        });
        updateTotals();
      });
    });
    document.querySelectorAll('.checkout-type-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        const type = opt.dataset.type;
        const radio = document.querySelector(`input[name="deliveryType"][value="${type}"]`);
        if (radio) radio.checked = true;
        document.getElementById('checkout-address-wrap').classList.toggle('hidden', type !== 'envio');
        document.querySelectorAll('.checkout-type-option').forEach((o) => o.classList.toggle('has-border', (o.dataset.type || '') === type));
        updateTotals();
      });
    });
    document.querySelectorAll('input[name="payment"]').forEach((r) => {
      r.addEventListener('change', updateTotals);
    });
    const cashInput = document.getElementById('checkout-cash');
    if (cashInput) cashInput.addEventListener('input', updateTotals);

    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('checkout-name').value.trim();
      const phone = document.getElementById('checkout-phone').value.trim();
      if (!name || !phone) return;
      const type = getDeliveryType();
      const subtotal = window.cart.getSubtotal();
      const minimum = getMinimum();
      if (type === 'envio' && subtotal < minimum) {
        alert('El pedido no alcanza el mínimo de ' + formatCurrency(minimum) + ' para envío.');
        return;
      }
      const address = type === 'envio' ? document.getElementById('checkout-address').value.trim() : '';
      if (type === 'envio' && !address) {
        alert('Ingresá la dirección de envío.');
        return;
      }
      const payment = document.querySelector('input[name="payment"]:checked');
      if (!payment) {
        alert('Seleccioná un medio de pago.');
        return;
      }
      const notes = document.getElementById('checkout-notes').value.trim();
      const cashNote = payment.value === 'efectivo' ? document.getElementById('checkout-cash').value.trim() : '';
      const nrd = window.nrd;
      if (!nrd || !nrd.orders) {
        alert('No se puede enviar el pedido. Intentá más tarde.');
        return;
      }
      const shipping = getShippingCost();
      const total = subtotal + shipping;
      const orderNotes = [
        notes,
        type === 'envio' ? 'Envío: ' + address : 'Retiro en local',
        'Pago: ' + (payment.value === 'efectivo' ? 'Efectivo' + (cashNote ? ' (paga con $' + cashNote + ')' : '') : payment.value === 'pos' ? 'POS' : 'Mercado Pago'),
        'Cliente: ' + name + ' - Tel: ' + phone
      ].filter(Boolean).join('\n');

      const items = window.cart.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId || undefined,
        productName: i.productName,
        quantity: i.quantity,
        price: i.price
      }));

      try {
        await nrd.orders.create({
          clientId: 'catalogo',
          clientName: name + ' - ' + phone,
          status: 'Pendiente',
          total: Math.round(total),
          items,
          notes: orderNotes
        });
        window.cart.clear();
        window.updateCartCount();
        if (typeof window.showSuccess === 'function') window.showSuccess();
        else window.showView('success');
      } catch (err) {
        alert('Error al enviar el pedido. Intentá de nuevo.');
      }
    });
  };
})();
