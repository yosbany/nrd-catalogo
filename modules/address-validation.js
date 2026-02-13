/**
 * Validación y estandarización de direcciones en texto libre para generar URL de Waze.
 * Uso: validarDireccion(texto) -> { status, direccionNormalizada?, wazeUrl?, mensajeParaCliente? }
 */
(function () {
  const CIUDAD_POR_DEFECTO = 'Montevideo Uruguay';

  const PALABRAS_AMBIGUAS = [
    'frente',
    'al lado',
    'cerca',
    'mi casa',
    'ya sabes',
    'la de siempre'
  ];

  const PALABRAS_CALLE = [
    'calle',
    'avenida',
    'av',
    'avda',
    'bulevar',
    'bvar',
    'dr',
    'doctor',
    'rambla',
    'paseo',
    'ruta',
    'camino',
    'pasaje',
    'bvd',
    'blvr'
  ];

  function quitarEmojis(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}]/gu, '');
  }

  function normalizarTexto(texto) {
    if (typeof texto !== 'string') return '';
    let s = texto;
    s = quitarEmojis(s);
    s = s.toLowerCase();
    s = s.replace(/#/g, '');
    s = s.replace(/\besq\.?\b/gi, ' ');
    s = s.replace(/\besquina\b/gi, ' ');
    s = s.replace(/\s+y\s+/g, ' ');
    s = s.replace(/[^a-záéíóúñü0-9\s]/gi, ' ');
    s = s.replace(/\s+/g, ' ').trim();
    if (s) s = s + ' ' + CIUDAD_POR_DEFECTO;
    return s.trim();
  }

  function contienePalabraAmbigua(texto) {
    const t = (texto || '').toLowerCase();
    return PALABRAS_AMBIGUAS.some((p) => t.includes(p));
  }

  function contienePalabraCalle(textoNormalizado) {
    const palabras = textoNormalizado.split(/\s+/).filter(Boolean);
    return PALABRAS_CALLE.some((p) => palabras.some((w) => w === p || w.startsWith(p + '.')));
  }

  function contieneNumero(texto) {
    return /\d+/.test(texto || '');
  }

  function indicaEsquina(textoOriginal) {
    const t = (textoOriginal || '').toLowerCase();
    return /\besq\.?\b/.test(t) || /\besquina\b/.test(t) || /\s+y\s+/.test(t);
  }

  function tieneDosPartesComoCalles(textoNormalizado) {
    const partes = textoNormalizado.replace(CIUDAD_POR_DEFECTO, '').trim().split(/\s+/).filter(Boolean);
    const sinCiudad = partes.filter((w) => w !== 'montevideo' && w !== 'uruguay');
    return sinCiudad.length >= 2;
  }

  function cantidadPalabrasSinCiudad(textoNormalizado) {
    const partes = textoNormalizado.replace(CIUDAD_POR_DEFECTO, '').trim().split(/\s+/).filter(Boolean);
    const sinCiudad = partes.filter((w) => w !== 'montevideo' && w !== 'uruguay');
    return sinCiudad.length;
  }

  /**
   * Valida y estandariza una dirección en texto libre.
   * @param {string} texto - Dirección en texto libre (ej. WhatsApp)
   * @returns {{ status: 'VALIDA'|'INVALIDA', direccionNormalizada?: string, wazeUrl?: string, mensajeParaCliente?: string }}
   */
  function validarDireccion(texto) {
    const mensajeInvalida = 'Por favor indicá la dirección con calle y número, o esquina de dos calles (ej: Av. 18 de Julio 1234, o Bvar. España esq. Colonia).';
    const vacio = !texto || String(texto).trim() === '';
    if (vacio) {
      return { status: 'INVALIDA', mensajeParaCliente: mensajeInvalida };
    }
    const original = String(texto).trim();
    if (contienePalabraAmbigua(original)) {
      return { status: 'INVALIDA', mensajeParaCliente: mensajeInvalida };
    }
    const direccionNormalizada = normalizarTexto(original);
    const sinCiudad = direccionNormalizada.replace(CIUDAD_POR_DEFECTO, '').trim();
    if (!sinCiudad) {
      return { status: 'INVALIDA', mensajeParaCliente: mensajeInvalida };
    }
    const tienePalabraCalle = contienePalabraCalle(direccionNormalizada);
    const tieneNumero = contieneNumero(original);
    const esEsquina = indicaEsquina(original);
    const dosCalles = esEsquina && tieneDosPartesComoCalles(direccionNormalizada);
    const palabrasOk = cantidadPalabrasSinCiudad(direccionNormalizada) >= 2;
    const valida =
      (tienePalabraCalle && (tieneNumero || dosCalles)) ||
      (tieneNumero && palabrasOk);
    if (!valida) {
      return { status: 'INVALIDA', mensajeParaCliente: mensajeInvalida };
    }
    const wazeUrl = 'https://waze.com/ul?q=' + encodeURIComponent(direccionNormalizada) + '&navigate=yes';
    return {
      status: 'VALIDA',
      direccionNormalizada,
      wazeUrl
    };
  }

  window.validarDireccion = validarDireccion;
})();
