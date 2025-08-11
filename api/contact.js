const { Resend } = require('resend');

const escapeHtml = (str) => String(str || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const buildEmailHtml = (d) => `
  <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;color:#0b1220">
    <h2 style="margin:0 0 10px">Nuevo diagnóstico de IA</h2>
    <p style="margin:0 0 16px;color:#334155">De: <strong>${escapeHtml(d.nombre)}</strong> &lt;${escapeHtml(d.email)}&gt;</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
    ${Object.entries(d).filter(([k]) => !['nombre','email'].includes(k)).map(([k,v]) => `
      <p style="margin:6px 0"><strong>${escapeHtml(k)}:</strong> ${escapeHtml(v)}</p>
    `).join('')}
  </div>`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const str = Buffer.concat(chunks).toString('utf8');
    const data = str ? JSON.parse(str) : {};

    const nombre = (data.nombre||'').trim();
    const email = (data.email||'').trim();
    if (!nombre || !email) return res.status(400).json({ error: 'Faltan nombre o email' });

    const resend = new Resend(process.env.RESEND_API_KEY);
    const to = process.env.CONTACT_TO_EMAIL;
    const from = process.env.CONTACT_FROM_EMAIL || 'onboarding@resend.dev';

    const { error } = await resend.emails.send({
      from,
      to,
      reply_to: email,
      subject: `Diagnóstico IA - ${nombre}`,
      html: buildEmailHtml(data),
    });

    if (error) return res.status(500).json({ error: error.message || 'Error enviando email' });

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Solicitud inválida' });
  }
};
