// api/profil.js — Vercel Serverless Function
// Sauvegarde profil client dans Airtable + email de bienvenue via Resend
// Variables requises : AIRTABLE_API_KEY, AIRTABLE_BASE_ID, RESEND_API_KEY
//                      EMAIL_EXPEDITEUR, EMAIL_DESTINATAIRE

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prenom, nom, email, tel, types, regions, budget, surface, chambres, delai, objectif, notes, newsletter } = req.body;

  if (!prenom || !email) return res.status(400).json({ error: 'Prénom et email requis.' });

  const fullName = [prenom, nom].filter(Boolean).join(' ');
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  // ── 1. SAUVEGARDE AIRTABLE ──
  try {
    const atRes = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [{
          fields: {
            'Nom complet':    fullName,
            'Email':          email,
            'Téléphone':      tel || '',
            'Type de bien':   types,
            'Région':         regions,
            'Budget max':     budget,
            'Surface min':    surface ? surface + ' m²' : '',
            'Chambres min':   chambres || '',
            'Délai':          delai,
            'Objectif':       objectif,
            'Notes':          notes || '',
            'Newsletter':     newsletter === 'Oui',
            'Date inscription': now,
            'Statut':         'Nouveau',
          }
        }]
      }),
    });

    if (!atRes.ok) {
      const err = await atRes.json();
      console.error('Airtable error:', err);
    }
  } catch (e) {
    console.error('Airtable save error:', e);
  }

  // ── 2. EMAIL NOTIFICATION ÉQUIPE ──
  const emailEquipe = {
    from: process.env.EMAIL_EXPEDITEUR || 'DELLYSIA <onboarding@resend.dev>',
    to: [process.env.EMAIL_DESTINATAIRE],
    subject: `👤 Nouveau profil client — ${fullName}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:auto;border:1px solid #C9A84C;border-radius:12px;overflow:hidden;">
        <div style="background:#1a1a2e;padding:24px 28px;">
          <h1 style="color:#C9A84C;font-size:22px;letter-spacing:4px;margin:0;">DELLYSIA</h1>
          <p style="color:rgba(201,168,76,0.6);font-size:11px;letter-spacing:2px;margin:4px 0 0;">NOUVEAU PROFIL CLIENT</p>
        </div>
        <div style="padding:28px;background:#fff;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;width:150px;">Client</td><td style="padding:8px 0;font-weight:bold;">${fullName}</td></tr>
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;color:#b8860b;">${email}</td></tr>
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">Téléphone</td><td style="padding:8px 0;">${tel || 'Non renseigné'}</td></tr>
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">Type de bien</td><td style="padding:8px 0;">${types}</td></tr>
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">Région</td><td style="padding:8px 0;">${regions}</td></tr>
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">Budget max</td><td style="padding:8px 0;font-weight:bold;">${budget}</td></tr>
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">Surface min</td><td style="padding:8px 0;">${surface || 'Non précisé'} m²</td></tr>
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">Délai</td><td style="padding:8px 0;">${delai}</td></tr>
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">Objectif</td><td style="padding:8px 0;">${objectif}</td></tr>
            <tr style="border-bottom:1px solid #f0ece4;"><td style="padding:8px 0;color:#888;">Newsletter</td><td style="padding:8px 0;">${newsletter}</td></tr>
            <tr><td style="padding:8px 0;color:#888;">Notes</td><td style="padding:8px 0;">${notes || '—'}</td></tr>
          </table>
          <p style="margin-top:16px;font-size:12px;color:#aaa;">Reçu le ${now} — Profil sauvegardé dans Airtable</p>
        </div>
      </div>`,
  };

  // ── 3. EMAIL BIENVENUE CLIENT ──
  const emailClient = {
    from: process.env.EMAIL_EXPEDITEUR || 'DELLYSIA <onboarding@resend.dev>',
    to: [email],
    subject: `DELLYSIA — Bienvenue ${prenom}, votre profil est enregistré`,
    html: `
      <div style="font-family:Georgia,serif;max-width:560px;margin:auto;border:1px solid #C9A84C;border-radius:12px;overflow:hidden;">
        <div style="background:#1a1a2e;padding:24px 28px;">
          <h1 style="color:#C9A84C;font-size:22px;letter-spacing:4px;margin:0;">DELLYSIA</h1>
          <p style="color:rgba(201,168,76,0.6);font-size:11px;letter-spacing:2px;margin:4px 0 0;">VOTRE PROFIL CLIENT</p>
        </div>
        <div style="padding:28px;background:#fff;">
          <p style="font-size:15px;margin:0 0 16px;">Bonjour <strong>${prenom}</strong>,</p>
          <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 16px;">
            Nous avons bien enregistré votre profil de recherche. Notre équipe DELLYSIA va analyser 
            vos critères et vous proposer une sélection de biens personnalisés.
          </p>
          <div style="background:#fafaf7;border-left:3px solid #C9A84C;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:16px;">
            <p style="margin:0;font-size:13px;color:#555;line-height:1.8;">
              🏠 <strong>Type :</strong> ${types}<br/>
              🌍 <strong>Région :</strong> ${regions}<br/>
              💶 <strong>Budget max :</strong> ${budget}<br/>
              ⏱ <strong>Délai :</strong> ${delai}<br/>
              🎯 <strong>Objectif :</strong> ${objectif}
            </p>
          </div>
          ${newsletter === 'Oui'
            ? `<p style="font-size:13px;color:#b8860b;margin:0 0 16px;">📬 Vous recevrez chaque lundi une sélection de biens correspondant à votre profil.</p>`
            : ''}
          <p style="font-size:13px;color:#888;margin:0;">L'équipe DELLYSIA vous remercie de votre confiance et vous contactera rapidement.</p>
        </div>
      </div>`,
  };

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailEquipe),
    });
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(emailClient),
    });
  } catch (e) {
    console.error('Resend error:', e);
  }

  return res.status(200).json({ success: true });
};
