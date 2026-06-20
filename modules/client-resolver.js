/**
 * Resuelve clientId en checkout del catálogo sin leer /clients (seguro con reglas Firebase).
 * Usa clientPhoneIndex/{telNormalizado} → clientId
 */
(function () {
  const DATABASE_URL = 'https://nrd-db-default-rtdb.firebaseio.com';

  function normalizePhone(phone) {
    return (phone || '').replace(/\s+/g, '').replace(/[^\d+]/g, '').trim();
  }

  function phoneIndexKey(phoneNorm) {
    return phoneNorm.replace(/\+/g, 'plus').replace(/[.#$\[\]]/g, '_');
  }

  async function getIdToken(nrd) {
    const user = nrd && nrd.auth ? nrd.auth.getCurrentUser() : null;
    if (!user || typeof user.getIdToken !== 'function') return null;
    return user.getIdToken();
  }

  async function rtdbGet(path, idToken) {
    const url = DATABASE_URL + '/' + path + '.json?auth=' + encodeURIComponent(idToken);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Lectura RTDB falló (' + res.status + ')');
    return res.json();
  }

  async function rtdbPut(path, value, idToken) {
    const url = DATABASE_URL + '/' + path + '.json?auth=' + encodeURIComponent(idToken);
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
    if (!res.ok) throw new Error('Escritura RTDB falló (' + res.status + ')');
    return res.json();
  }

  /**
   * @returns {Promise<string>} clientId
   */
  async function resolveCatalogClientId(nrd, name, phone, address) {
    const phoneNorm = normalizePhone(phone);
    if (!nrd || !nrd.clients || !phoneNorm) return 'catalogo';

    const idToken = await getIdToken(nrd);
    if (!idToken) return 'catalogo';

    const indexPath = 'clientPhoneIndex/' + phoneIndexKey(phoneNorm);

    try {
      const indexed = await rtdbGet(indexPath, idToken);
      if (indexed && typeof indexed === 'string' && indexed.trim()) {
        return indexed.trim();
      }
    } catch (e) {
      console.warn('clientPhoneIndex lookup:', e);
    }

    const clientData = { name: name || 'Cliente catálogo', phone: phoneNorm };
    if (address != null && String(address).trim() !== '') {
      clientData.address = String(address).trim();
    }

    let newId = null;
    try {
      newId = await nrd.clients.create(clientData);
    } catch (e) {
      console.error('Error creando cliente:', e);
      return 'catalogo';
    }

    if (!newId) return 'catalogo';

    try {
      await rtdbPut(indexPath, newId, idToken);
    } catch (e) {
      console.warn('No se pudo indexar teléfono (el cliente igual se creó):', e);
    }

    return newId;
  }

  window.resolveCatalogClientId = resolveCatalogClientId;
  window.normalizeCatalogPhone = normalizePhone;
})();
