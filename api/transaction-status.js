// api/transaction-status.js
// Serverless function (Vercel). Consulta o status de uma transação na Velani.
// Usada pelo payment.html em polling (a cada poucos segundos) pra saber
// quando o PIX foi pago, sem nunca expor a Secret Key no navegador.

const VELANI_BASE = "https://api.velanipagamentos.com.br/api/v1/api-gateway/v1/transactions";

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const secretKey = process.env.VELANI_SECRET_KEY;
  if (!secretKey) {
    console.error("VELANI_SECRET_KEY não configurada nas variáveis de ambiente da Vercel");
    return res.status(500).json({ success: false, error: "Indisponível no momento." });
  }

  const id = (req.query && req.query.id) || "";
  if (!id) {
    return res.status(400).json({ success: false, error: "Parâmetro id é obrigatório." });
  }

  try {
    const velaniRes = await fetch(`${VELANI_BASE}/${encodeURIComponent(id)}`, {
      headers: { "x-api-key": secretKey },
    });
    const raw = await velaniRes.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch (e) {
      return res.status(502).json({ success: false, error: "Resposta inválida do gateway." });
    }

    if (!velaniRes.ok || !data || data.success === false) {
      return res.status(velaniRes.status || 502).json({ success: false, error: "Falha ao consultar status." });
    }

    const t = data.data || {};
    return res.status(200).json({
      success: true,
      status: t.status, // pending | processing | paid | failed | expired | refunded
      paid_at: t.paidAt || null,
    });
  } catch (err) {
    console.error("Erro ao consultar status Velani:", err);
    return res.status(500).json({ success: false, error: "Erro interno." });
  }
};
