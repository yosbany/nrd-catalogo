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
    const isEnvio = getDeliveryType() === 'envio';
    if (isEnvio && payEfectivo && payEfectivo.checked && cashWrap) {
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

  function preloadFromLastOrder() {
    const preload = typeof window.getAndClearPendingCheckoutPreload === 'function' ? window.getAndClearPendingCheckoutPreload() : null;
    if (preload) {
      const nameEl = document.getElementById('checkout-name');
      const phoneEl = document.getElementById('checkout-phone');
      const addrEl = document.getElementById('checkout-address');
      if (nameEl && preload.name) nameEl.value = preload.name;
      if (phoneEl && preload.phone) phoneEl.value = preload.phone;
      if (addrEl && preload.address) addrEl.value = preload.address;
      return;
    }
    const last = typeof window.getLastOrdersFromStorage === 'function' ? window.getLastOrdersFromStorage() : [];
    const recent = last[0];
    if (recent && (recent.name || recent.phone || recent.address)) {
      const nameEl = document.getElementById('checkout-name');
      const phoneEl = document.getElementById('checkout-phone');
      const addrEl = document.getElementById('checkout-address');
      if (nameEl && recent.name) nameEl.value = recent.name;
      if (phoneEl && recent.phone) phoneEl.value = recent.phone;
      if (addrEl && recent.address) addrEl.value = recent.address;
    }
  }

  window.renderCheckout = function () {
    preloadFromLastOrder();
    const storeOpen = typeof window.isStoreOpen === 'function' ? window.isStoreOpen() : true;
    const confirmBtn = document.getElementById('checkout-confirm-btn');
    if (confirmBtn) {
      confirmBtn.disabled = !storeOpen;
      confirmBtn.classList.toggle('opacity-50', !storeOpen);
      confirmBtn.classList.toggle('cursor-not-allowed', !storeOpen);
      confirmBtn.textContent = storeOpen ? 'Confirmar pedido' : 'Local cerrado — no se pueden finalizar pedidos';
    }
    const isEnvio = getDeliveryType() === 'envio';
    document.getElementById('checkout-address-wrap').classList.toggle('hidden', !isEnvio);
    const retiroTimeWrap = document.getElementById('checkout-retiro-time-wrap');
    if (retiroTimeWrap) retiroTimeWrap.classList.toggle('hidden', isEnvio);
    const payWrap = document.getElementById('checkout-payment-wrap');
    const payRequired = document.getElementById('checkout-payment-required');
    if (payWrap) payWrap.classList.toggle('hidden', !isEnvio);
    if (payRequired) payRequired.textContent = isEnvio ? '*' : '(opcional)';
    document.querySelectorAll('.checkout-type-option').forEach((el) => {
      el.classList.toggle('has-border', (el.dataset.type || '') === getDeliveryType());
    });
    updateTotals();
  };

  window.initCheckout = function () {
    document.querySelectorAll('input[name="deliveryType"]').forEach((r) => {
      r.addEventListener('change', () => {
        const isEnvio = r.value === 'envio';
        document.getElementById('checkout-address-wrap').classList.toggle('hidden', !isEnvio);
        const retiroTimeWrap = document.getElementById('checkout-retiro-time-wrap');
        if (retiroTimeWrap) retiroTimeWrap.classList.toggle('hidden', isEnvio);
        const payWrap = document.getElementById('checkout-payment-wrap');
        const payRequired = document.getElementById('checkout-payment-required');
        if (payWrap) payWrap.classList.toggle('hidden', !isEnvio);
        if (payRequired) payRequired.textContent = isEnvio ? '*' : '(opcional)';
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
        const isEnvio = type === 'envio';
        document.getElementById('checkout-address-wrap').classList.toggle('hidden', !isEnvio);
        const retiroTimeWrap = document.getElementById('checkout-retiro-time-wrap');
        if (retiroTimeWrap) retiroTimeWrap.classList.toggle('hidden', isEnvio);
        const payWrap = document.getElementById('checkout-payment-wrap');
        const payRequired = document.getElementById('checkout-payment-required');
        if (payWrap) payWrap.classList.toggle('hidden', !isEnvio);
        if (payRequired) payRequired.textContent = isEnvio ? '*' : '(opcional)';
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
      if (typeof window.isStoreOpen === 'function' && !window.isStoreOpen()) {
        alert('El local está cerrado en este momento. No se pueden finalizar pedidos hasta que abramos.');
        return;
      }
      const name = document.getElementById('checkout-name').value.trim();
      const phone = document.getElementById('checkout-phone').value.trim();
      if (!name || !phone) return;
      const type = getDeliveryType();
      const subtotal = window.cart.getSubtotal();
      const minimum = getMinimum();
      if (subtotal < minimum) {
        alert('El pedido no alcanza el mínimo de ' + formatCurrency(minimum) + '. Agregá más productos.');
        return;
      }
      const address = type === 'envio' ? document.getElementById('checkout-address').value.trim() : '';
      if (type === 'envio' && !address) {
        alert('Ingresá la dirección de envío.');
        return;
      }
      const payment = type === 'envio' ? document.querySelector('input[name="payment"]:checked') : null;
      if (type === 'envio' && !payment) {
        alert('Seleccioná un medio de pago.');
        return;
      }
      const notes = document.getElementById('checkout-notes').value.trim();
      const retiroTime = type === 'retiro' ? (document.getElementById('checkout-retiro-time') && document.getElementById('checkout-retiro-time').value) || '' : '';
      const cashNote = payment && payment.value === 'efectivo' ? document.getElementById('checkout-cash').value.trim() : '';
      const nrd = window.nrd;
      if (!nrd || !nrd.orders) {
        alert('No se puede enviar el pedido. Intentá más tarde.');
        return;
      }
      const shipping = getShippingCost();
      const total = subtotal + shipping;
      const orderNotes = [
        notes,
        type === 'envio' ? 'Envío: ' + address : ('Retiro en local' + (retiroTime ? ' - Horario: ' + retiroTime : '')),
        type === 'envio' && payment ? ('Pago: ' + (payment.value === 'efectivo' ? 'Efectivo' + (cashNote ? ' (paga con $' + cashNote + ')' : '') : payment.value === 'pos' ? 'POS' : 'Mercado Pago')) : null,
        'Cliente: ' + name + ' - Tel: ' + phone
      ].filter(Boolean).join('\n');

      const getOrderProductId = typeof window.getOrderProductId === 'function' ? window.getOrderProductId : (pid, vid) => vid && /^P\d+(_\w+)?$/i.test(vid) ? vid : pid;
      const items = window.cart.items.map((i) => {
        const productId = getOrderProductId(i.productId, i.variantId) || i.productId;
        return {
          productId,
          productName: i.productName,
          quantity: i.quantity,
          price: i.price
        };
      });

      try {
        const normalizePhone = (p) => (p || '').replace(/\s+/g, '').replace(/[^\d+]/g, '').trim();
        const phoneNorm = normalizePhone(phone);
        let clientId = 'catalogo';
        if (nrd.clients && phoneNorm) {
          let existing = null;
          try {
            const byPhone = typeof nrd.clients.queryByChild === 'function' ? await nrd.clients.queryByChild('phone', phone) : [];
            const list = Array.isArray(byPhone) ? byPhone : (byPhone ? Object.values(byPhone) : []);
            existing = list.find((c) => normalizePhone(c.phone) === phoneNorm);
          } catch (_) {
            const all = await nrd.clients.getAll();
            const list = Array.isArray(all) ? all : Object.values(all || {});
            existing = list.find((c) => normalizePhone(c.phone) === phoneNorm);
          }
          if (existing && existing.id) {
            clientId = existing.id;
          } else {
            const clientData = { name, phone };
            if (address != null && String(address).trim() !== '') clientData.address = String(address).trim();
            const newId = await nrd.clients.create(clientData);
            if (newId) clientId = newId;
          }
        }

        const cfg = typeof window.getCatalogConfig === 'function' ? window.getCatalogConfig() : {};
        const now = Date.now();
        let estMinutes = 60;
        if (type === 'envio') {
          const estStr = String(cfg.estimatedMinutes || '30').trim();
          const firstNum = estStr.match(/\d+/) ? parseInt(estStr.match(/\d+/)[0], 10) : 30;
          estMinutes = isNaN(firstNum) || firstNum <= 0 ? 30 : Math.min(firstNum, 180);
        } else {
          estMinutes = 60;
        }
        let deliveryDate = now + estMinutes * 60 * 1000;
        if (deliveryDate < now) deliveryDate = now;

        const orderData = {
          clientId,
          clientName: name + ' - ' + phone,
          createdAt: Date.now(),
          status: 'Pendiente',
          items,
          total: Math.round(total),
          notes: orderNotes || null,
          deliveryDate
        };
        const orderId = await nrd.orders.create(orderData);
        if (typeof window.addLastOrderToStorage === 'function') {
          window.addLastOrderToStorage({ name, phone, address, items: window.cart.items, total: Math.round(total) });
        }
        if (orderId && typeof window.setActiveOrderIdToStorage === 'function') {
          window.setActiveOrderIdToStorage(orderId);
        }
        window.cart.clear();
        window.updateCartCount();
        if (typeof window.showSuccess === 'function') window.showSuccess();
        else window.showView('success');
      } catch (err) {
        const msg = (err && err.message) ? err.message : String(err || 'Error desconocido');
        console.error('Error al enviar pedido:', err);
        alert('Error al enviar el pedido: ' + msg + '. Intentá de nuevo.');
      }
    });
  };
})();
