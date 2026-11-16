// api/webhook-velani.js
// Recebe os eventos que a Velani manda (postbackUrl / configurado no painel deles).
// Não é obrigatório pro checkout funcionar (o payment.html já confirma o pagamento
// via polling em /api/transaction-status), mas é a fonte mais confiável e rápida -
// use isto se depois quiser, por exemplo, liberar acesso automaticamente ou gravar
// a venda em algum lugar assim que o PIX cair.
//
// Configure em: painel Velani > Developers > Webhooks -> aponte pra
//   https://SEU-DOMINIO/api/webhook-velani
// (ou deixe fixo via env VELANI_POSTBACK_URL, usado em api/create-transaction.js)

const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
    const { event, data, signature } = body;

    const secret = process.env.VELANI_SECRET_KEY || "";
    if (signature && secret) {
      const expected = crypto.createHmac("sha256", secret).update(JSON.stringify(data)).digest("hex");
      if (expected !== signature) {
        console.warn("Webhook Velani: assinatura inválida, ignorando");
        return res.status(401).json({ received: false });
      }
    }

    console.log("Webhook Velani recebido:", event, data && data.id, data && data.status);

    // TODO (opcional): se quiser persistir o pagamento em algum lugar
    // (banco de dados, planilha, etc.) é aqui que entraria essa lógica
    // quando event === 'transaction.paid'.

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Erro no webhook Velani:", err);
    // responde 200 mesmo em erro nosso, pra Velani não ficar reenviando à toa
    return res.status(200).json({ received: true });
  }
};
