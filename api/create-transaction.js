// api/create-transaction.js
// Serverless function (Vercel). Roda no servidor - a Secret Key NUNCA chega ao navegador.
//
// Configuração necessária (Vercel > Project Settings > Environment Variables):
//   VELANI_SECRET_KEY   = sk_live_...   (obrigatória)
//   VELANI_POSTBACK_URL = https://SEU-DOMINIO/api/webhook-velani   (opcional)
//
// O front-end (checkout/index.html) faz POST aqui com os dados do pedido;
// esta função repassa pra Velani com a Secret Key e devolve só o necessário
// pro front (código PIX, id da transação, validade).

const VELANI_URL = "https://api.velanipagamentos.com.br/api/v1/api-gateway/v1/transactions";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const secretKey = process.env.VELANI_SECRET_KEY;
  if (!secretKey) {
    console.error("VELANI_SECRET_KEY não configurada nas variáveis de ambiente da Vercel");
    return res.status(500).json({
      success: false,
      error: "Pagamento indisponível no momento. Tente novamente em instantes.",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};

    // ---- valor (recebido em reais, ex: 69.83) ----
    const amountReais = Number(body.amount);
    if (!Number.isFinite(amountReais) || amountReais <= 0) {
      return res.status(400).json({ success: false, error: "Valor inválido." });
    }
    const amountCents = Math.round(amountReais * 100);
    if (amountCents < 100) {
      return res.status(400).json({ success: false, error: "Valor mínimo de R$ 1,00." });
    }

    // ---- comprador ----
    const comprador = body.comprador || {};
    const nome = String(comprador.nome || "").trim();
    if (!nome) {
      return res.status(400).json({ success: false, error: "Nome do comprador é obrigatório." });
    }
    const email = String(comprador.email || "").trim();
    const telefoneDigits = String(comprador.telefone || "").replace(/\D/g, "");
    const cpfDigits = String(comprador.cpf || "").replace(/\D/g, "");

    // ---- itens do carrinho ----
    const items =
      Array.isArray(body.carrinho) && body.carrinho.length
        ? body.carrinho.map((item) => ({
            title: String(item.titulo || "Produto").slice(0, 120),
            unitPrice: Math.round(Number(item.preco || 0) * 100) || amountCents,
            quantity: Math.max(1, parseInt(item.quantidade, 10) || 1),
          }))
        : [{ title: "Produto", unitPrice: amountCents, quantity: 1 }];

    const payload = {
      paymentMethod: "pix",
      amount: amountCents,
      customer: {
        name: nome,
        ...(email ? { email } : {}),
        ...(telefoneDigits ? { phone: telefoneDigits } : {}),
        ...(cpfDigits
          ? { document: { type: cpfDigits.length > 11 ? "cnpj" : "cpf", number: cpfDigits } }
          : {}),
      },
      items,
      externalId: `pedido-${Date.now()}`,
    };

    // ---- UTMs (string "utm_source=x&utm_campaign=y...") ----
    if (body.utm && typeof body.utm === "string") {
      const tracking = {};
      new URLSearchParams(body.utm).forEach((value, key) => {
        if (value) tracking[key] = value;
      });
      if (Object.keys(tracking).length) payload.tracking = tracking;
    }

    if (process.env.VELANI_POSTBACK_URL) {
      payload.postbackUrl = process.env.VELANI_POSTBACK_URL;
    }

    const velaniRes = await fetch(VELANI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": secretKey },
      body: JSON.stringify(payload),
    });

    const raw = await velaniRes.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error("Resposta não-JSON da Velani:", raw);
      return res.status(502).json({ success: false, error: "Resposta inválida do gateway de pagamento." });
    }

    if (!velaniRes.ok || !data || data.success === false) {
      const msg = (data && data.error && data.error.message) || "Falha ao gerar cobrança Pix.";
      console.error("Erro Velani:", velaniRes.status, msg);
      const status = velaniRes.status >= 400 && velaniRes.status < 600 ? velaniRes.status : 502;
      return res.status(status).json({ success: false, error: msg });
    }

    const t = data.data || {};
    return res.status(200).json({
      success: true,
      transaction_id: t.id,
      pix_code: t.pixQrCode,
      pix_qrcode_image: t.pixQrCodeImage || null, // a Velani costuma devolver vazio - o front gera o QR a partir do pix_code
      status: t.status,
      amount_cents: t.amount,
      expires_at: t.expiresAt,
    });
  } catch (err) {
    console.error("Erro ao criar transação Velani:", err);
    return res.status(500).json({ success: false, error: "Erro interno ao gerar Pix." });
  }
};
