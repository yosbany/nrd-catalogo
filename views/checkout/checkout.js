/**
 * Vista Checkout: tipo entrega (retiro/envío), dirección si envío, nombre, teléfono, observaciones, medio de pago, efectivo (monto/cambio), resumen, confirmar.
 */
(function () {
  const WHATSAPP_PANADERIA = '59899646848';
  const formatCurrency = (n) => (n != null && !isNaN(n) ? '$ ' + Math.round(n).toLocaleString('es-UY') : '$ -');
  function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

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

  /**
   * Construye las opciones de horario de retiro en formato 24h, cada 30 minutos:
   * desde la media hora siguiente (30 min después del pedido) redondeada al :00 o :30, hasta la hora de cierre.
   * Valor por defecto: primera franja disponible.
   */
  function updateRetiroTimeSelect() {
    const select = document.getElementById('checkout-retiro-time');
    if (!select) return;
    const config = window.getCatalogConfig ? window.getCatalogConfig() : {};
    const closeStr = (config.storeCloseTime || '20:00').trim();
    const closeMatch = closeStr.match(/^(\d{1,2}):(\d{2})$/);
    const closeMin = closeMatch
      ? parseInt(closeMatch[1], 10) * 60 + parseInt(closeMatch[2], 10)
      : 20 * 60;
    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const inThirtyMin = currentMin + 30;
    const firstSlotMin = Math.ceil(inThirtyMin / 30) * 30;
    if (firstSlotMin >= 24 * 60) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Sin horarios disponibles';
      select.innerHTML = '';
      select.appendChild(opt);
      select.value = '';
      return;
    }
    const options = [];
    for (let m = firstSlotMin; m <= closeMin; m += 30) {
      const h = Math.floor(m / 60) % 24;
      const min = m % 60;
      options.push(String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0'));
    }
    select.innerHTML = '';
    if (options.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'Sin horarios disponibles';
      select.appendChild(opt);
      select.value = '';
      return;
    }
    options.forEach(function (val) {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
    select.value = options[0];
  }

  /** Devuelve true si hay horarios de retiro disponibles (select con valor HH:MM válido). */
  function hasRetiroTimesAvailable() {
    if (getDeliveryType() !== 'retiro') return true;
    const select = document.getElementById('checkout-retiro-time');
    if (!select) return false;
    const val = (select.value || '').trim();
    return /^\d{1,2}:\d{2}$/.test(val);
  }

  function updateConfirmButtonState() {
    const storeOpen = typeof window.isStoreOpen === 'function' ? window.isStoreOpen() : true;
    const isRetiro = getDeliveryType() === 'retiro';
    const hasRetiroTimes = !isRetiro || hasRetiroTimesAvailable();
    const canConfirm = storeOpen && hasRetiroTimes;
    const confirmBtn = document.getElementById('checkout-confirm-btn');
    if (!confirmBtn) return;
    confirmBtn.disabled = !canConfirm;
    confirmBtn.classList.toggle('opacity-50', !canConfirm);
    confirmBtn.classList.toggle('cursor-not-allowed', !canConfirm);
    if (!storeOpen) {
      confirmBtn.textContent = 'Local cerrado — no se pueden finalizar pedidos';
    } else if (isRetiro && !hasRetiroTimes) {
      confirmBtn.textContent = 'Sin horarios de retiro disponibles';
    } else {
      confirmBtn.textContent = 'Confirmar pedido';
    }
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
    const isEnvio = getDeliveryType() === 'envio';
    document.getElementById('checkout-address-wrap').classList.toggle('hidden', !isEnvio);
    const retiroTimeWrap = document.getElementById('checkout-retiro-time-wrap');
    if (retiroTimeWrap) retiroTimeWrap.classList.toggle('hidden', isEnvio);
    if (!isEnvio) updateRetiroTimeSelect();
    updateConfirmButtonState();
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
        if (!isEnvio) updateRetiroTimeSelect();
        updateConfirmButtonState();
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
        if (!isEnvio) updateRetiroTimeSelect();
        updateConfirmButtonState();
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
        if (typeof window.showAlert === 'function') window.showAlert('Local cerrado', 'El local está cerrado en este momento. No se pueden finalizar pedidos hasta que abramos.');
        else alert('El local está cerrado en este momento. No se pueden finalizar pedidos hasta que abramos.');
        return;
      }
      const name = document.getElementById('checkout-name').value.trim();
      const phone = document.getElementById('checkout-phone').value.trim();
      if (!name || !phone) return;
      const type = getDeliveryType();
      if (type === 'retiro' && !hasRetiroTimesAvailable()) {
        if (typeof window.showAlert === 'function') window.showAlert('Horarios', 'No hay horarios de retiro disponibles en este momento. Elegí envío a domicilio o intentá más tarde.');
        else alert('No hay horarios de retiro disponibles en este momento. Elegí envío a domicilio o intentá más tarde.');
        return;
      }
      const subtotal = window.cart.getSubtotal();
      const minimum = getMinimum();
      if (subtotal < minimum) {
        if (typeof window.showAlert === 'function') window.showAlert('Mínimo no alcanzado', 'El pedido no alcanza el mínimo de ' + formatCurrency(minimum) + '. Agregá más productos.');
        else alert('El pedido no alcanza el mínimo de ' + formatCurrency(minimum) + '. Agregá más productos.');
        return;
      }
      const addressRaw = type === 'envio' ? document.getElementById('checkout-address').value.trim() : '';
      if (type === 'envio' && !addressRaw) {
        if (typeof window.showAlert === 'function') window.showAlert('Dirección', 'Ingresá la dirección de envío.');
        else alert('Ingresá la dirección de envío.');
        return;
      }
      const address = addressRaw;
      let addressWazeUrl = null;
      if (type === 'envio' && address && typeof window.validarDireccion === 'function') {
        const resultado = window.validarDireccion(address);
        if (resultado.status === 'INVALIDA') {
          if (typeof window.showAlert === 'function') {
            window.showAlert('Dirección', resultado.mensajeParaCliente || 'Por favor indicá la dirección con calle y número, o esquina de dos calles.');
          } else {
            alert(resultado.mensajeParaCliente || 'Por favor indicá la dirección con calle y número, o esquina de dos calles.');
          }
          return;
        }
        if (resultado.wazeUrl) addressWazeUrl = resultado.wazeUrl;
      }
      const payment = type === 'envio' ? document.querySelector('input[name="payment"]:checked') : null;
      if (type === 'envio' && !payment) {
        if (typeof window.showAlert === 'function') window.showAlert('Medio de pago', 'Seleccioná un medio de pago.');
        else alert('Seleccioná un medio de pago.');
        return;
      }
      const notes = document.getElementById('checkout-notes').value.trim();
      const retiroTime = type === 'retiro' ? (document.getElementById('checkout-retiro-time') && document.getElementById('checkout-retiro-time').value) || '' : '';
      const cashNote = payment && payment.value === 'efectivo' ? document.getElementById('checkout-cash').value.trim() : '';
      const nrd = window.nrd;
      if (!nrd || !nrd.orders) {
        if (typeof window.showAlert === 'function') window.showAlert('Error', 'No se puede enviar el pedido. Intentá más tarde.');
        else alert('No se puede enviar el pedido. Intentá más tarde.');
        return;
      }
      const shipping = getShippingCost();
      const total = subtotal + shipping;
      const wazeHref = type === 'envio' && address ? (addressWazeUrl || 'https://waze.com/ul?q=' + encodeURIComponent(address)) : '';
      const envioLine = type === 'envio' && address
        ? 'Envío: ' + '<a href="' + wazeHref + '" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 hover:underline">' + escapeHtml(address) + '</a>'
        : (type === 'envio' ? null : null);
      const retiroLine = type !== 'envio' ? ('Retiro en local' + (retiroTime ? ' - Horario: ' + retiroTime : '')) : null;
      const orderNotes = [
        notes,
        envioLine,
        retiroLine,
        type === 'envio' && payment ? ('Pago: ' + (payment.value === 'efectivo' ? 'Efectivo' + (cashNote ? ' (paga con $' + cashNote + ')' : '') : payment.value === 'pos' ? 'Tarjeta débito o crédito' : 'Mercado Pago')) : null,
        phone ? 'Tel: ' + phone : null
      ].filter(Boolean).join('\n');

      // productId/variantId asociados al artículo u opción del catálogo para que en pedidos se vea qué se pidió
      const getOrderProductId = typeof window.getOrderProductId === 'function' ? window.getOrderProductId : (pid, vid) => vid && /^P\d+(_\w+)?$/i.test(vid) ? vid : pid;
      const items = window.cart.items.map((i) => {
        const productId = getOrderProductId(i.productId, i.variantId) || i.productId;
        const item = {
          productId,
          productName: i.productName,
          quantity: i.quantity,
          price: i.price
        };
        if (i.variantId != null && String(i.variantId).trim() !== '') {
          item.variantId = String(i.variantId).trim();
        }
        return item;
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
        let deliveryDate;
        if (type === 'retiro' && retiroTime && /^\d{1,2}:\d{2}$/.test(retiroTime.trim())) {
          const [h, m] = retiroTime.trim().split(':').map((n) => parseInt(n, 10));
          const today = new Date();
          const slot = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m || 0, 0, 0);
          deliveryDate = slot.getTime();
          if (deliveryDate <= now) slot.setDate(slot.getDate() + 1);
          deliveryDate = slot.getTime();
        } else {
          let estMinutes = type === 'envio' ? 30 : 60;
          if (type === 'envio') {
            const estStr = String(cfg.estimatedMinutes || '30').trim();
            const firstNum = estStr.match(/\d+/) ? parseInt(estStr.match(/\d+/)[0], 10) : 30;
            estMinutes = isNaN(firstNum) || firstNum <= 0 ? 30 : Math.min(firstNum, 180);
          }
          deliveryDate = now + estMinutes * 60 * 1000;
          if (deliveryDate < now) deliveryDate = now;
        }

        const orderData = {
          clientId,
          clientName: name + ' - ' + phone,
          createdAt: Date.now(),
          status: 'Pendiente',
          items,
          total: Math.round(total),
          notes: orderNotes || null,
          deliveryDate,
          deliveryType: type
        };
        const orderId = await nrd.orders.create(orderData);
        if (typeof window.addLastOrderToStorage === 'function') {
          window.addLastOrderToStorage({ name, phone, address, items: window.cart.items, total: Math.round(total) });
        }
        if (orderId && typeof window.setActiveOrderIdToStorage === 'function') {
          window.setActiveOrderIdToStorage(orderId);
        }
        if (typeof window.updateActiveOrderIndicator === 'function') {
          window.updateActiveOrderIndicator();
        }
        var resumen = '*Nuevo pedido*\n\n';
        resumen += 'Cliente: ' + (name || '') + '\n';
        resumen += 'Tel: ' + (phone || '') + '\n';
        resumen += type === 'envio' ? 'Entrega: ' + (address || '') + '\n' : 'Retiro en local' + (retiroTime ? ' - ' + retiroTime : '') + '\n';
        if (type === 'envio' && payment) {
          resumen += 'Pago: ' + (payment.value === 'efectivo' ? 'Efectivo' + (cashNote ? ' (paga con $' + cashNote + ')' : '') : payment.value === 'pos' ? 'Tarjeta débito o crédito' : 'Mercado Pago') + '\n';
        }
        resumen += '\n*Pedido:*\n';
        (window.cart.items || []).forEach(function (i) {
          resumen += '• ' + (i.quantity || 0) + ' x ' + (i.productName || '') + ' - ' + formatCurrency((i.price || 0) * (i.quantity || 0)) + '\n';
        });
        resumen += '\nTotal: ' + formatCurrency(total) + '\n';
        if (notes && notes.trim()) {
          resumen += '\nObservaciones:\n' + notes.trim() + '\n';
        }
        try {
          window.open('https://wa.me/' + WHATSAPP_PANADERIA + '?text=' + encodeURIComponent(resumen), '_blank');
        } catch (e) {
          console.warn('No se pudo abrir WhatsApp:', e);
        }
        window.cart.clear();
        window.updateCartCount();
        if (typeof window.showSuccess === 'function') window.showSuccess();
        else window.showView('success');
      } catch (err) {
        const msg = (err && err.message) ? err.message : String(err || 'Error desconocido');
        console.error('Error al enviar pedido:', err);
        if (typeof window.showAlert === 'function') window.showAlert('Error', 'Error al enviar el pedido: ' + msg + '. Intentá de nuevo.');
        else alert('Error al enviar el pedido: ' + msg + '. Intentá de nuevo.');
      }
    });
  };
})();
