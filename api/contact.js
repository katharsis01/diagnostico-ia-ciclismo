const { Resend } = require('resend');

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[m]));
}

function emailHtml(d = {}) {
  const row = (k, v) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee;color:#555">${k}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(v)}</td></tr>`;
  return `<!doctype html><meta charset="utf-8"/><div style="font-family:system-ui,Segoe UI,Arial,sans-serif;color:#111">
  <h2 style="margin:0 0 8px">Nuevo diagnóstico IA</h2>
  <p style="margin:0 0 12px;color:#555">Formulario de la web</p>
  <table style="border-collapse:collapse;width:100%">${[
    row('Nombre', d.nombre),
    row('Email', d.email),
    row('Teléfono', d.telefono),
    row('Tienda', d.tienda),
    row('Mensaje', d.mensaje),
    row('Inventario', d.inventario),
    row('Atención', d.atencion),
    row('Marketing', d.marketing),
    row('Recomendaciones', d.recomendaciones),
    row('Operaciones', d.operaciones),
    row('Datos', d.datos),
    row('Comentario', d.extra)
  ].join('')}</table>
</div>`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = process.env.CONTACT_TO_EMAIL || 'you@example.com';
  const from = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';
  const body = req.body || {};
  if (!body.nombre || !body.email) return res.status(400).json({ error: 'Faltan campos obligatorios' });
  try {
    await resend.emails.send({
      from,
      to,
      subject: `Diagnóstico IA - ${body.nombre}`,
      html: emailHtml(body),
      reply_to: body.email,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'No se pudo enviar' });
  }
};