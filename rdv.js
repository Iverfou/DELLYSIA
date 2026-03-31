// api/rdv.js — Vercel Serverless Function
// Sauvegarde les RDV et envoie un email de confirmation via Resend
// Variables d'environnement requises :
//   RESEND_API_KEY      → votre clé Resend (resend.com — gratuit jusqu'à 3000 emails/mois)
//   EMAIL_DESTINATAIRE  → l'adresse qui reçoit les RDV (ex: contact@dellysia.com)
//   EMAIL_EXPEDITEUR    → l'adresse expéditrice vérifiée sur Resend (ex: noreply@dellysia.com)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { prenom, nom, tel, agent, date, heure, type, objet } = req.body;

  // Validation minimale
  if (!prenom || !date) {
    return res.status(400).json({ error: 'Prénom et date sont obligatoires.' });
  }

  const fullName = [prenom, nom].filter(Boolean).join(' ');
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

  // ── Email à l'équipe DELLYSIA ──
  const emailEquipe = {
    from: process.env.EMAIL_EXPEDITEUR || 'DELLYSIA <noreply@dellysia.com>',
    to: [process.env.EMAIL_DESTINATAIRE || 'contact@dellysia.com'],
    subject: `📅 Nouveau RDV — ${fullName} — ${date} à ${heure}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: auto; color: #1a1a2e; border: 1px solid #C9A84C; border-radius: 12px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 24px 28px;">
          <h1 style="color: #C9A84C; font-size: 22px; letter-spacing: 4px; margin: 0;">DELLYSIA</h1>
          <p style="color: rgba(201,168,76,0.6); font-size: 11px; letter-spacing: 2px; margin: 4px 0 0;">NOUVEAU RENDEZ-VOUS</p>
        </div>
        <div style="padding: 28px; background: #fff;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f0ece4;">
              <td style="padding: 10px 0; color: #888; width: 140px;">Client</td>
              <td style="padding: 10px 0; font-weight: bold;">${fullName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece4;">
              <td style="padding: 10px 0; color: #888;">Téléphone</td>
              <td style="padding: 10px 0;">${tel || 'Non renseigné'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece4;">
              <td style="padding: 10px 0; color: #888;">Responsable</td>
              <td style="padding: 10px 0; color: #b8860b; font-weight: bold;">${agent}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece4;">
              <td style="padding: 10px 0; color: #888;">Date</td>
              <td style="padding: 10px 0;">${date}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece4;">
              <td style="padding: 10px 0; color: #888;">Heure</td>
              <td style="padding: 10px 0;">${heure}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0ece4;">
              <td style="padding: 10px 0; color: #888;">Type</td>
              <td style="padding: 10px 0;">${type || 'Présentiel'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #888;">Objet</td>
              <td style="padding: 10px 0;">${objet || 'Consultation immobilière'}</td>
            </tr>
          </table>
          <p style="margin-top: 20px; font-size: 12px; color: #aaa;">Demande reçue le ${now}</p>
        </div>
      </div>
    `,
  };

  // ── Email de confirmation au client (si email fourni) ──
  const emailClient = req.body.email ? {
    from: process.env.EMAIL_EXPEDITEUR || 'DELLYSIA <noreply@dellysia.com>',
    to: [req.body.email],
    subject: `DELLYSIA — Confirmation de votre rendez-vous du ${date}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: auto; color: #1a1a2e; border: 1px solid #C9A84C; border-radius: 12px; overflow: hidden;">
        <div style="background: #1a1a2e; padding: 24px 28px;">
          <h1 style="color: #C9A84C; font-size: 22px; letter-spacing: 4px; margin: 0;">DELLYSIA</h1>
          <p style="color: rgba(201,168,76,0.6); font-size: 11px; letter-spacing: 2px; margin: 4px 0 0;">CONFIRMATION DE RENDEZ-VOUS</p>
        </div>
        <div style="padding: 28px; background: #fff;">
          <p style="font-size: 15px; margin: 0 0 20px;">Bonjour <strong>${prenom}</strong>,</p>
          <p style="font-size: 14px; color: #444; line-height: 1.7; margin: 0 0 20px;">
            Nous avons bien enregistré votre demande de rendez-vous avec <strong style="color: #b8860b;">${agent}</strong>.
            Notre équipe vous contactera prochainement pour confirmer ce créneau.
          </p>
          <div style="background: #fafaf7; border-left: 3px solid #C9A84C; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 13px; color: #555;">
              📅 <strong>${date}</strong> à <strong>${heure}</strong><br/>
              👤 ${agent}<br/>
              📋 ${objet || 'Consultation immobilière'}<br/>
              📍 ${type || 'Présentiel'}
            </p>
          </div>
          <p style="font-size: 13px; color: #888; margin: 0;">L'équipe DELLYSIA vous remercie de votre confiance.</p>
        </div>
      </div>
    `,
  } : null;

  try {
    // Envoi email équipe
    const r1 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailEquipe),
    });

    if (!r1.ok) {
      const err = await r1.json();
      console.error('Resend error (équipe):', err);
      return res.status(500).json({ error: 'Erreur envoi email équipe', details: err });
    }

    // Envoi email client si email fourni
    if (emailClient) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailClient),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Rendez-vous enregistré et email envoyé.',
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
