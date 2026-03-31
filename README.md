# DELLYSIA — Agence Immobilière Internationale

Chatbot IA propulsé par **Claude (Anthropic)** pour l'agence immobilière **DELLYSIA**.
Développé dans le cadre d'un portfolio professionnel.

---

## 🏢 L'Équipe

| Nom | Poste |
|-----|-------|
| **Dalila Malek** | CEO |
| **Ryma Malek** | Directrice Générale — Espagne |
| **Sara Malek** | Directrice Générale — France |
| **Yacine Malek** | Directeur Général — Maghreb |
| **Soumaya Malek** | Gestion des activités & Comptabilité |

---

## ✨ Fonctionnalités

- **Chatbot IA réel** — propulsé par Claude (Anthropic), comprend toute question en français
- **Prise de rendez-vous** — formulaire complet avec confirmation par email (Resend)
- **Email automatique** — l'équipe DELLYSIA reçoit chaque RDV instantanément
- **Email client** — confirmation envoyée au visiteur si email renseigné
- **Design responsive** — mobile, tablette, ordinateur
- **Sidebar équipe** sur desktop avec accès direct aux RDV

---

## 📁 Structure du projet

```
dellysia/
├── index.html          → Application complète (UI + logique front)
├── vercel.json         → Configuration déploiement Vercel
├── README.md           → Ce fichier
└── api/
    ├── chat.js         → Fonction serverless — IA Claude (Anthropic)
    └── rdv.js          → Fonction serverless — Email RDV (Resend)
```

---

## 🔑 Variables d'environnement (à configurer sur Vercel)

Allez sur **Vercel → votre projet → Settings → Environment Variables** et ajoutez :

| Variable | Description | Où obtenir |
|----------|-------------|------------|
| `ANTHROPIC_API_KEY` | Clé API Claude | [console.anthropic.com](https://console.anthropic.com) |
| `RESEND_API_KEY` | Clé API Resend | [resend.com](https://resend.com) — gratuit |
| `EMAIL_DESTINATAIRE` | Email qui reçoit les RDV | Votre email |
| `EMAIL_EXPEDITEUR` | Email expéditeur vérifié | Votre domaine vérifié sur Resend |

> ⚠️ Ne jamais mettre ces clés dans le code — uniquement dans les variables Vercel.

---

## 🚀 Déploiement

### Étape 1 — GitHub
1. Créer un repository public `dellysia`
2. Uploader les **5 fichiers** (respecter le dossier `api/`)
3. Commit

### Étape 2 — Vercel
1. [vercel.com](https://vercel.com) → **Add New Project**
2. Sélectionner le repo GitHub `dellysia`
3. Ajouter les 4 variables d'environnement (Settings → Environment Variables)
4. Cliquer **Deploy**
5. Lien partageable généré : `https://dellysia.vercel.app`

---

## 🛠️ Technologies

- HTML5 / CSS3 / JavaScript vanille (zéro framework)
- **Claude claude-opus-4-5** (Anthropic) — intelligence du chatbot
- **Resend** — envoi d'emails transactionnels
- **Vercel Serverless Functions** — API sécurisées (clés cachées côté serveur)
- Google Fonts : Cormorant Garamond + Jost

---

## 📱 Responsive Design

| Écran | Comportement |
|-------|-------------|
| Mobile < 480px | Chat plein écran, barre équipe scrollable |
| Tablette 480–900px | Chat plein écran, barre équipe scrollable |
| Desktop > 900px | Chat + sidebar équipe côte à côte |

---

*Projet fictif à des fins de démonstration portfolio — © 2025 DELLYSIA*
