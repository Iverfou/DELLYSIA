// api/chat.js — Vercel Serverless Function
// Chatbot DELLYSIA — Claude (Anthropic) — Multilingue FR/EN/ES/AR

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { messages, system, lang } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid format — messages[] required' });
  }

  // Fallback system prompts if frontend doesn't send one
  const FALLBACK_PROMPTS = {
    fr: `Tu es l'assistant virtuel de DELLYSIA, agence immobilière internationale de prestige. Réponds en FRANÇAIS, ton élégant et professionnel, 3-5 phrases max. Services: vente/achat résidentiel et commercial, investissement international. Équipe: Dalila Malek (CEO), Ryma Malek (Espagne), Sara Malek (France), Yacine Malek (Maghreb), Soumaya Malek (Gestion). Si RDV souhaité, oriente vers le formulaire. Pas de coordonnées ni prix fictifs.`,
    en: `You are the virtual assistant of DELLYSIA, a prestigious international real estate agency. Reply in ENGLISH, elegant and professional tone, 3-5 sentences max. Services: residential & commercial sales, international investment. Team: Dalila Malek (CEO), Ryma Malek (Spain), Sara Malek (France), Yacine Malek (Maghreb), Soumaya Malek (Admin). If appointment requested, direct to the form. No contact details or prices.`,
    es: `Eres el asistente virtual de DELLYSIA, agencia inmobiliaria internacional de prestigio. Responde en ESPAÑOL, tono elegante y profesional, 3-5 frases máx. Servicios: compraventa residencial y comercial, inversión internacional. Equipo: Dalila Malek (CEO), Ryma Malek (España), Sara Malek (Francia), Yacine Malek (Magreb), Soumaya Malek (Gestión). Si desea cita, indica el formulario. Sin datos de contacto ni precios.`,
    ar: `أنت المساعد الافتراضي لوكالة DELLYSIA العقارية الدولية. أجب بالعربية، أسلوب راقٍ ومهني، 3-5 جمل كحد أقصى. الخدمات: بيع وشراء عقارات سكنية وتجارية، استثمار دولي. الفريق: دليلة مالك (CEO)، ريما (إسبانيا)، سارة (فرنسا)، ياسين (المغرب العربي)، سمية (الإدارة). إذا طُلب موعد، وجّه إلى النموذج. بدون أرقام أو أسعار.`,
  };

  const systemPrompt = system || FALLBACK_PROMPTS[lang] || FALLBACK_PROMPTS.fr;

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
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('Anthropic error:', err);
      return res.status(500).json({ error: 'Anthropic API error', details: err });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error', message: error.message });
  }
};
