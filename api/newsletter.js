// api/newsletter.js — Vercel Serverless Function
// Récupère les clients newsletter depuis Airtable,
// Claude génère un email personnalisé pour chacun,
// Resend envoie les emails.
//
// Déclencher manuellement : POST /api/newsletter { "secret": "NEWSLETTER_SECRET" }
// Ou configurer un cron Vercel (vercel.json) pour chaque lundi 8h00
//
// Variables requises :
//   AIRTABLE_API_KEY, AIRTABLE_BASE_ID
//   ANTHROPIC_API_KEY
//   RESEND_API_KEY, EMAIL_EXPEDITEUR
//   NEWSLETTER_SECRET  (clé secrète pour déclencher manuellement)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Vérification secret
  const { secret } = req.body || {};
  if (secret !== process.env.NEWSLETTER_SECRET) {
    return res.status(401).json({ error: 'Non autorisé — secret invalide' });
  }

  // ── CATALOGUE DE BIENS (même données que biens.html) ──
  const BIENS = [
    { titre:'Villa Côte Dorée',    loc:'Marbella, Espagne',     prix:'1 250 000 €', type:'Villa',        region:'Espagne',  surface:320, emoji:'🏖️', features:'Piscine à débordement, vue mer, spa privatif' },
    { titre:'Penthouse Eixample',  loc:'Barcelone, Espagne',    prix:'895 000 €',   type:'Appartement',  region:'Espagne',  surface:185, emoji:'🏙️', features:'Terrasse 80m², vue Sagrada Família' },
    { titre:'Villa Ibiza Dreams',  loc:'Ibiza, Espagne',        prix:'2 100 000 €', type:'Villa',        region:'Espagne',  surface:450, emoji:'🌊', features:'Piscine chauffée, jacuzzi, jardin 2000m²' },
    { titre:'Haussmannien Paris 8e',loc:'Paris, France',        prix:'1 450 000 €', type:'Appartement',  region:'France',   surface:145, emoji:'🗼', features:'Parquet chevrons, moulures, Triangle d\'Or' },
    { titre:'Villa Belle Époque',  loc:'Nice, Côte d\'Azur',   prix:'3 200 000 €', type:'Villa',        region:'France',   surface:520, emoji:'🌿', features:'Parc 3000m², piscine, court de tennis' },
    { titre:'Loft Confluence',     loc:'Lyon, France',          prix:'520 000 €',   type:'Appartement',  region:'France',   surface:165, emoji:'🍷', features:'Double hauteur, verrières atelier, terrasse' },
    { titre:'Riad Palmeraie',      loc:'Marrakech, Maroc',      prix:'680 000 €',   type:'Villa',        region:'Maroc',    surface:380, emoji:'🌴', features:'Patio fontaine, piscine, zelliges artisanaux' },
    { titre:'Penthouse El Biar',   loc:'Alger, Algérie',        prix:'320 000 €',   type:'Appartement',  region:'Algérie',  surface:220, emoji:'🏛️', features:'Vue baie d\'Alger, terrasse 100m²' },
    { titre:'Villa Sidi Bou Saïd', loc:'Tunis, Tunisie',        prix:'480 000 €',   type:'Villa',        region:'Tunisie',  surface:290, emoji:'🌅', features:'Vue Méditerranée, jardin fleuri, piscine' },
    { titre:'Marina Barceloneta',  loc:'Barcelone, Espagne',    prix:'650 000 €',   type:'Appartement',  region:'Espagne',  surface:110, emoji:'⛵', features:'Vue marina, baies vitrées, proche plages' },
    { titre:'Bastide Provençale',  loc:'Aix-en-Provence',       prix:'1 850 000 €', type:'Villa',        region:'France',   surface:420, emoji:'🏰', features:'Domaine 2 hectares, vignes, piscine naturelle' },
    { titre:'Appartement Anfa',    loc:'Casablanca, Maroc',     prix:'195 000 €',   type:'Appartement',  region:'Maroc',    surface:130, emoji:'🌿', features:'Vue Atlantique, piscine commune, proche Corniche' },
  ];

  // ── RÉCUPÉRER LES CLIENTS NEWSLETTER DEPUIS AIRTABLE ──
  let clients = [];
  try {
    const filterFormula = encodeURIComponent("AND({Newsletter}=TRUE(), {Email}!='')");
    const atRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Clients?filterByFormula=${filterFormula}&maxRecords=100`,
      { headers: { 'Authorization': `Bearer ${process.env.AIRTABLE_API_KEY}` } }
    );
    const atData = await atRes.json();
    clients = (atData.records || []).map(r => r.fields);
  } catch (e) {
    console.error('Airtable fetch error:', e);
    return res.status(500).json({ error: 'Erreur récupération Airtable', message: e.message });
  }

  if (!clients.length) {
    return res.status(200).json({ success: true, message: 'Aucun client newsletter trouvé.', sent: 0 });
  }

  let sent = 0;
  const errors = [];

  for (const client of clients) {
    try {
      const prenom   = client['Nom complet']?.split(' ')[0] || 'Client';
      const email    = client['Email'];
      const types    = client['Type de bien'] || '';
      const regions  = client['Région'] || '';
      const budget   = client['Budget max'] || '';
      const objectif = client['Objectif'] || '';

      if (!email) continue;

      // Filtrer les biens qui correspondent au profil
      const matching = BIENS.filter(b => {
        const regionMatch = !regions || regions.toLowerCase().includes(b.region.toLowerCase()) || regions.toLowerCase().includes('tout');
        const typeMatch   = !types   || types.toLowerCase().includes(b.type.toLowerCase());
        return regionMatch && typeMatch;
      }).slice(0, 4); // Max 4 biens par email

      const biensTexte = matching.length
        ? matching.map(b => `- ${b.emoji} ${b.titre} (${b.loc}) — ${b.prix} — ${b.surface}m² — ${b.features}`).join('\n')
        : BIENS.slice(0, 3).map(b => `- ${b.emoji} ${b.titre} (${b.loc}) — ${b.prix}`).join('\n');

      // ── CLAUDE GÉNÈRE L'EMAIL PERSONNALISÉ ──
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 500,
          system: `Tu es le rédacteur de la newsletter hebdomadaire de DELLYSIA, agence immobilière de prestige. 
Rédige un email chaleureux, élégant et personnalisé. Ton professionnel mais humain. 
Ne mets PAS de HTML, seulement du texte brut avec des sauts de ligne.
Maximum 200 mots. Commence directement par "Bonjour [prénom],"`,
          messages: [{
            role: 'user',
            content: `Rédige la newsletter hebdomadaire personnalisée pour ce client :
Prénom : ${prenom}
Profil : ${types} | ${regions} | Budget ${budget} | Objectif : ${objectif}

Biens sélectionnés cette semaine :
${biensTexte}

Termine par une invitation douce à visiter notre site ou prendre RDV avec notre équipe.`,
          }],
        }),
      });

      const claudeData = await claudeRes.json();
      const emailText  = claudeData.content?.[0]?.text || `Bonjour ${prenom},\n\nVoici notre sélection de biens de la semaine.\n\nL'équipe DELLYSIA`;

      // Convertir le texte en HTML simple
      const emailHtml = `
        <div style="font-family:Georgia,serif;max-width:560px;margin:auto;border:1px solid #C9A84C;border-radius:12px;overflow:hidden;">
          <div style="background:#1a1a2e;padding:24px 28px;">
            <h1 style="color:#C9A84C;font-size:22px;letter-spacing:4px;margin:0;">DELLYSIA</h1>
            <p style="color:rgba(201,168,76,0.6);font-size:11px;letter-spacing:2px;margin:4px 0 0;">NEWSLETTER HEBDOMADAIRE</p>
          </div>
          <div style="padding:28px;background:#fff;">
            <div style="font-size:14px;color:#444;line-height:1.8;white-space:pre-line;margin-bottom:24px;">${emailText}</div>
            ${matching.length ? `
            <div style="border-top:1px solid #f0ece4;padding-top:20px;margin-top:4px;">
              <p style="font-size:12px;color:#b8860b;letter-spacing:1px;margin-bottom:12px;">SÉLECTION DE LA SEMAINE</p>
              ${matching.map(b => `
                <div style="border:1px solid #f0ece4;border-radius:8px;padding:12px;margin-bottom:10px;">
                  <p style="font-size:13px;font-weight:bold;margin:0 0 4px;">${b.emoji} ${b.titre}</p>
                  <p style="font-size:12px;color:#888;margin:0 0 4px;">${b.loc} — ${b.prix} — ${b.surface}m²</p>
                  <p style="font-size:11px;color:#b8860b;margin:0;">${b.features}</p>
                </div>`).join('')}
            </div>` : ''}
            <div style="margin-top:20px;text-align:center;">
              <a href="https://dellysia.vercel.app/biens.html" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg,#b8860b,#daa520);color:#fff;text-decoration:none;border-radius:8px;font-size:13px;letter-spacing:1px;">Voir tous nos biens →</a>
            </div>
            <p style="font-size:11px;color:#ccc;text-align:center;margin-top:16px;">DELLYSIA — Agence Immobilière Internationale</p>
          </div>
        </div>`;

      // ── ENVOI EMAIL ──
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_EXPEDITEUR || 'DELLYSIA <onboarding@resend.dev>',
          to: [email],
          subject: `DELLYSIA — Vos biens de la semaine ${new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long' })}`,
          html: emailHtml,
        }),
      });

      sent++;
      // Pause pour éviter le rate limiting
      await new Promise(r => setTimeout(r, 300));

    } catch (e) {
      console.error(`Error for client ${client['Email']}:`, e);
      errors.push(client['Email']);
    }
  }

  return res.status(200).json({
    success: true,
    sent,
    total: clients.length,
    errors: errors.length ? errors : undefined,
  });
};
