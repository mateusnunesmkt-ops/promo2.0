/* =============================================================================
 * Pagina de oferta adicional (upsell) - renderiza a pagina a partir de um
 * objeto de configuracao. Cada oferta e OPCIONAL: o cliente pode seguir sem
 * comprar. O pagamento usa o mesmo backend PIX do checkout (pix.js).
 * Depende de: helpers.js (isValidCPF, bindCpfMask, initExitTrap) e pix.js.
 * ========================================================================== */
(function () {
  'use strict';

  function esc(s) { var d = document.createElement('div'); d.textContent = (s == null ? '' : String(s)); return d.innerHTML; }
  function brl(v) { return 'R$ ' + Number(v).toFixed(2).replace('.', ','); }

  window.renderUpsell = function (cfg) {
    var accent = cfg.accent || '#EE4D2D';
    var ds = cfg.downsell || null;
    var h = '';

    h += '<header class="bg-white border-b" style="border-color:rgba(0,0,0,.09)"><div class="mx-auto flex max-w-xl items-center justify-between px-4 py-3">'
      + '<span class="text-sm font-bold text-gray-800">Seu pedido foi confirmado &#10003;</span>'
      + '<span class="text-xs font-semibold text-gray-500">Oferta ' + cfg.stepNum + ' de ' + cfg.totalSteps + '</span></div>'
      + '<div class="h-1 w-full bg-gray-100"><div class="h-1" style="width:' + Math.round(cfg.stepNum / cfg.totalSteps * 100) + '%;background:' + accent + '"></div></div></header>';

    h += '<main class="mx-auto max-w-xl px-4 pb-16 pt-5">';

    h += '<section class="overflow-hidden rounded-2xl border bg-white shadow-sm" style="border-color:rgba(0,0,0,.09)">'
      + '<div class="px-5 pb-4 pt-6 text-center">'
      + '<span class="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase" style="background:#FFF4F2;color:' + accent + ';letter-spacing:.06em">Oferta opcional</span>'
      + '<div class="mt-4 text-5xl">' + esc(cfg.icon) + '</div>'
      + '<h1 class="mt-3 text-xl font-black leading-tight text-gray-900">' + esc(cfg.name) + '</h1>'
      + '<p class="mt-2 text-sm leading-relaxed text-gray-600">' + esc(cfg.description) + '</p></div>';

    h += '<div class="border-t px-5 py-4" style="border-color:rgba(0,0,0,.07)"><p class="mb-2 text-xs font-bold uppercase text-gray-400" style="letter-spacing:.06em">O que está incluído</p><ul class="space-y-2">';
    (cfg.includes || []).forEach(function (t) {
      h += '<li class="flex items-start gap-2 text-sm text-gray-700"><span class="font-black" style="color:#00A650">&#10003;</span><span>' + esc(t) + '</span></li>';
    });
    h += '</ul></div>';

    var pInt = Math.floor(cfg.price);
    var pCents = ('0' + Math.round((cfg.price - pInt) * 100)).slice(-2);
    h += '<div id="offer-section" class="border-t px-5 py-5 text-center" style="border-color:rgba(0,0,0,.07);background:#FAFAFA">'
      + '<p class="text-xs font-semibold text-gray-500">Pagamento único via PIX</p>'
      + '<div class="my-1 flex items-end justify-center gap-1"><span class="text-lg font-bold text-gray-800">R$</span>'
      + '<span class="font-black leading-none text-gray-900" style="font-size:2.75rem">' + pInt + '</span>'
      + '<span class="mb-1 text-xl font-black text-gray-900">,' + pCents + '</span></div>'
      + (cfg.note ? '<p class="mx-auto mt-1 max-w-sm text-xs text-gray-500">' + esc(cfg.note) + '</p>' : '')
      + '<div id="cpf-gate" class="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left" style="display:none">'
      + '<p class="mb-2 text-xs font-bold text-amber-800">Confirme seus dados para gerar o PIX</p>'
      + '<input id="nome-input" placeholder="Nome completo" class="mb-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none">'
      + '<input id="cpf-input" inputmode="numeric" placeholder="000.000.000-00" class="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-center text-base font-bold tracking-wide text-gray-800 outline-none">'
      + '<p id="cpf-error" class="mt-1 text-xs font-medium text-red-600" style="display:none"></p>'
      + '<button onclick="confirmCpf()" class="mt-2 w-full rounded-lg py-3 text-sm font-extrabold text-white" style="background:' + accent + '">Gerar PIX</button></div>'
      + '<button id="main-cta" onclick="startUpsellPay(\'main\')" class="mt-4 w-full rounded-xl py-4 text-base font-black text-white shadow-md" style="background:' + accent + '">' + esc(cfg.ctaText || 'Adicionar ao meu pedido') + ' — ' + brl(cfg.price) + '</button>'
      + '<button onclick="declineOffer()" class="mt-3 text-sm font-medium text-gray-500 underline">Não, obrigado. Seguir sem adicionar</button>'
      + '</div></section>';

    h += '<div id="pix-main" class="mt-4" style="display:none"></div><div id="pix-downsell" class="mt-4" style="display:none"></div>';

    var faq = cfg.faq || [];
    if (faq.length) {
      h += '<div class="mt-6"><p class="mb-2 text-sm font-extrabold text-gray-700">Perguntas frequentes</p><div class="space-y-2">';
      faq.forEach(function (f) {
        h += '<div class="overflow-hidden rounded-xl border bg-white" style="border-color:rgba(0,0,0,.09)">'
          + '<button class="faq-toggle flex w-full items-center justify-between gap-2 px-4 py-3 text-left"><span class="text-sm font-semibold text-gray-700">' + esc(f.q) + '</span><span class="faq-icon text-lg text-gray-400">+</span></button>'
          + '<div class="faq-answer border-t px-4 py-3 text-sm leading-relaxed text-gray-500" style="border-color:rgba(0,0,0,.07);display:none">' + esc(f.a) + '</div></div>';
      });
      h += '</div></div>';
    }
    h += '<p class="mt-6 text-center text-xs text-gray-400">&#128274; Pagamento seguro &bull; Você não precisa comprar este item para receber seu pedido</p>';
    h += '</main>';

    if (ds) {
      h += '<div id="downsell-modal" class="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center" style="background:rgba(0,0,0,.6);display:none" onclick="closeDownsell()">'
        + '<div class="w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 text-center shadow-2xl" onclick="event.stopPropagation()">'
        + '<p class="text-xs font-bold uppercase" style="color:' + accent + ';letter-spacing:.08em">Condição especial</p>'
        + '<h3 class="mt-1 text-lg font-black text-gray-900">' + esc(ds.title) + '</h3>'
        + '<p class="mt-1.5 text-sm leading-relaxed text-gray-600">' + esc(ds.desc) + '</p>'
        + '<div class="my-3 flex items-end justify-center gap-2"><span class="text-sm text-gray-400 line-through">' + brl(cfg.price) + '</span>'
        + '<span class="text-4xl font-black text-emerald-600">' + brl(ds.price) + '</span></div>'
        + '<button onclick="startUpsellPay(\'downsell\')" class="w-full rounded-xl py-4 text-base font-black text-white shadow-md" style="background:' + accent + '">Adicionar por ' + brl(ds.price) + '</button>'
        + '<button onclick="declineOffer()" class="mt-3 text-sm text-gray-500 underline">Não, obrigado</button>'
        + '</div></div>';
    }

    document.getElementById('upsell-root').innerHTML = h;
    bindCpfMask('cpf-input');
    initFaqAccordion();

    var customer = {
      name: localStorage.getItem('funil_nome') || '',
      email: localStorage.getItem('funil_email') || '',
      phone: localStorage.getItem('funil_phone') || '',
      document: localStorage.getItem('funil_cpf') || ''
    };
    var pendingTarget = null;

    function withUtms(url) {
      var s = {};
      try { s = JSON.parse(localStorage.getItem('funil_utms') || '{}'); } catch (e) {}
      try { new URLSearchParams(window.location.search).forEach(function (v, k) { if (!s[k]) s[k] = v; }); } catch (e) {}
      var q = [];
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'src', 'sck', 'utm_id'].forEach(function (k) {
        if (s[k]) q.push(encodeURIComponent(k) + '=' + encodeURIComponent(s[k]));
      });
      return q.length ? url + (url.indexOf('?') >= 0 ? '&' : '?') + q.join('&') : url;
    }

    function needsData() {
      return !(customer.name && customer.name.trim().length >= 3) || !isValidCPF(customer.document || '');
    }

    window.startUpsellPay = function (target) {
      if (needsData()) {
        pendingTarget = target;
        closeDownsell();
        var gate = document.getElementById('cpf-gate');
        gate.style.display = 'block';
        var n = document.getElementById('nome-input');
        if (customer.name) n.value = customer.name;
        return;
      }
      launchPix(target);
    };

    window.confirmCpf = function () {
      var name = document.getElementById('nome-input').value.trim();
      var cpf = document.getElementById('cpf-input').value.replace(/\D/g, '');
      var err = document.getElementById('cpf-error');
      if (name.length < 3) { err.textContent = 'Informe seu nome completo.'; err.style.display = 'block'; return; }
      if (!isValidCPF(cpf)) { err.textContent = 'CPF inválido. Confira os números.'; err.style.display = 'block'; return; }
      err.style.display = 'none';
      document.getElementById('cpf-gate').style.display = 'none';
      customer.name = name; customer.document = cpf;
      localStorage.setItem('funil_nome', name);
      localStorage.setItem('funil_cpf', cpf);
      launchPix(pendingTarget || 'main');
    };

    function launchPix(target) {
      closeDownsell();
      var isDs = (target === 'downsell' && ds);
      var box = document.getElementById(isDs ? 'pix-downsell' : 'pix-main');
      document.getElementById('offer-section').style.display = 'none';
      document.getElementById('pix-main').style.display = 'none';
      document.getElementById('pix-downsell').style.display = 'none';
      box.style.display = 'block';
      initPixPanel(box.id, {
        productType: cfg.slug,
        productName: cfg.name,
        amount: isDs ? ds.price : cfg.price,
        client: customer,
        onPaid: function () { window.location.href = withUtms(cfg.nextUrl); },
        accent: accent
      });
      box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    window.showDownsellModal = function () { var m = document.getElementById('downsell-modal'); if (m) m.style.display = 'flex'; };
    window.closeDownsell = function () { var m = document.getElementById('downsell-modal'); if (m) m.style.display = 'none'; };
    window.declineOffer = function () { window.location.href = withUtms(cfg.nextUrl); };

    /* 1o "voltar": mostra a condicao especial (se houver); 2o: segue para a proxima etapa */
    initExitTrap({ onFirstExit: ds ? window.showDownsellModal : window.declineOffer, nextUrl: withUtms(cfg.nextUrl) });
  };
})();
