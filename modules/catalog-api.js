/**
 * Cliente HTTP del catálogo → https://api.nrdonline.site
 * El PWA solo habla con esta API (Firebase queda en el server).
 */
(function () {
  const API_BASE = 'https://api.nrdonline.site';
  const CATALOG_API_KEY = 'nrd_cat_099199ad1a2afa6556de09e7a14f41647d4c83ee66d8af8c';

  function headers(extra) {
    const h = {
      Accept: 'application/json',
      'X-Catalog-Key': CATALOG_API_KEY
    };
    if (extra) Object.assign(h, extra);
    return h;
  }

  async function parseResponse(res) {
    let body = null;
    const text = await res.text();
    if (text) {
      try {
        body = JSON.parse(text);
      } catch (e) {
        body = { error: text };
      }
    }
    if (!res.ok) {
      const msg = (body && body.error) ? String(body.error) : ('Error ' + res.status);
      const err = new Error(msg);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  }

  /**
   * GET /catalog — vitrina pública
   */
  async function fetchCatalog() {
    const res = await fetch(API_BASE + '/catalog', {
      method: 'GET',
      headers: headers(),
      cache: 'no-store'
    });
    return parseResponse(res);
  }

  /**
   * POST /orders — crear pedido (sin price/total del cliente)
   */
  async function createOrder(payload) {
    const res = await fetch(API_BASE + '/orders', {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    });
    return parseResponse(res);
  }

  /**
   * GET /orders/{orderId} — estado del pedido activo
   */
  async function fetchOrder(orderId) {
    if (!orderId) throw new Error('orderId requerido');
    const res = await fetch(API_BASE + '/orders/' + encodeURIComponent(orderId), {
      method: 'GET',
      headers: headers(),
      cache: 'no-store'
    });
    return parseResponse(res);
  }

  /**
   * POST /payments/mercadopago — crear Preference Checkout Pro
   * @param {string} orderId
   */
  async function createMpPreference(orderId) {
    if (!orderId) throw new Error('orderId requerido');
    const res = await fetch(API_BASE + '/payments/mercadopago', {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ orderId: String(orderId) })
    });
    return parseResponse(res);
  }

  /**
   * GET /payments/mercadopago/{orderId} — sincronizar pago (útil al volver de back_url)
   * @param {string} orderId
   */
  async function syncMpPayment(orderId) {
    if (!orderId) throw new Error('orderId requerido');
    const res = await fetch(API_BASE + '/payments/mercadopago/' + encodeURIComponent(orderId), {
      method: 'GET',
      headers: headers(),
      cache: 'no-store'
    });
    return parseResponse(res);
  }

  window.CatalogAPI = {
    API_BASE,
    fetchCatalog,
    createOrder,
    fetchOrder,
    createMpPreference,
    syncMpPayment
  };
})();
