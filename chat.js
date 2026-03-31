// api/chat.js — Vercel Serverless Function
// Connecte le chatbot DELLYSIA à Claude (Anthropic)
// Variable d'environnement requise : ANTHROPIC_API_KEY

export default async function handler(req, res) {
  // CORS — autorise les requêtes depuis votre domaine
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Format invalide — messages[] requis' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 600,
        system: `Tu es l'assistant virtuel de DELLYSIA, une agence immobilière internationale de prestige.
Réponds toujours en français, avec un ton élégant, professionnel et chaleureux.
Sois concis (3-5 phrases maximum par réponse).

L'équipe DELLYSIA :
- Dalila Malek : CEO — supervise toutes les opérations internationales
- Ryma Malek : Directrice Générale Espagne — Barcelone, Madrid, Marbella, Valence, Ibiza
- Sara Malek : Directrice Générale France — Paris, Lyon, Bordeaux, Côte d'Azur
- Yacine Malek : Directeur Général Maghreb — Algérie, Maroc, Tunisie
- Soumaya Malek : Gestion des activités courantes et Comptabilité

Services : biens résidentiels et commerciaux de prestige, investissements immobiliers, accompagnement personnalisé.

Si le visiteur souhaite un rendez-vous ou un rappel, encourage-le à utiliser le formulaire disponible sur la page.
Ne donne jamais de numéros de téléphone, d'adresses email ou de prix fictifs.
Si tu ne sais pas, oriente vers l'équipe via le formulaire de contact.`,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'Erreur API Anthropic', details: err });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || "Je suis désolé, je n'ai pas pu générer de réponse.";

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Erreur serveur', message: error.message });
  }
}
