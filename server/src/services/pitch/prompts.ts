import type { PitchRequestBody, PitchTemplate } from "../../types";

const SYSTEM_PROMPT_EN = `You are StartupPitch AI — an expert startup coach and pitch writing specialist with 20+ years of experience helping entrepreneurs raise funding from top-tier investors.

Your role is to transform business ideas into compelling, structured, investor-ready pitch documents.

Rules:
- Be specific and data-driven where possible.
- Use professional yet accessible language.
- Focus on the user's unique value proposition.
- Structure your output clearly using the sections requested.
- Return your response as a valid JSON object matching the requested schema.
- Do NOT include markdown code fences in your response — return raw JSON only.`;

const SYSTEM_PROMPT_FR = `Vous êtes StartupPitch AI — un expert en coaching de startups et en rédaction de pitchs avec plus de 20 ans d'expérience aidant les entrepreneurs à lever des fonds auprès d'investisseurs de premier rang.

Votre rôle est de transformer des idées d'entreprise en documents de pitch structurés et prêts pour les investisseurs.

Règles :
- Soyez spécifique et orienté données lorsque c'est possible.
- Utilisez un langage professionnel mais accessible.
- Concentrez-vous sur la proposition de valeur unique de l'utilisateur.
- Structurez clairement votre réponse en utilisant les sections demandées.
- Retournez votre réponse sous forme d'objet JSON valide correspondant au schéma demandé.
- N'incluez PAS de blocs de code markdown dans votre réponse — retournez uniquement du JSON brut.`;

const templateSchemas: Record<PitchTemplate, string> = {
  "lean-canvas": `{
  "sections": [
    { "title": "Problem", "content": "..." },
    { "title": "Customer Segments", "content": "..." },
    { "title": "Unique Value Proposition", "content": "..." },
    { "title": "Solution", "content": "..." },
    { "title": "Channels", "content": "..." },
    { "title": "Revenue Streams", "content": "..." },
    { "title": "Cost Structure", "content": "..." },
    { "title": "Key Metrics", "content": "..." },
    { "title": "Unfair Advantage", "content": "..." }
  ]
}`,
  "elevator-pitch": `{
  "sections": [
    { "title": "Hook", "content": "..." },
    { "title": "Problem", "content": "..." },
    { "title": "Solution", "content": "..." },
    { "title": "Target Market", "content": "..." },
    { "title": "Traction", "content": "..." },
    { "title": "Call to Action", "content": "..." }
  ]
}`,
  "investor-pitch": `{
  "sections": [
    { "title": "Executive Summary", "content": "..." },
    { "title": "Problem & Opportunity", "content": "..." },
    { "title": "Solution", "content": "..." },
    { "title": "Market Size (TAM/SAM/SOM)", "content": "..." },
    { "title": "Business Model", "content": "..." },
    { "title": "Competitive Advantage", "content": "..." },
    { "title": "Traction & Milestones", "content": "..." },
    { "title": "Team", "content": "..." },
    { "title": "Financial Projections", "content": "..." },
    { "title": "The Ask", "content": "..." }
  ]
}`,
  "executive-summary": `{
  "sections": [
    { "title": "Company Overview", "content": "..." },
    { "title": "Mission Statement", "content": "..." },
    { "title": "Product / Service", "content": "..." },
    { "title": "Market Opportunity", "content": "..." },
    { "title": "Business Model", "content": "..." },
    { "title": "Competitive Landscape", "content": "..." },
    { "title": "Financial Highlights", "content": "..." },
    { "title": "Funding Requirements", "content": "..." }
  ]
}`,
};

export function buildPrompts(body: PitchRequestBody): {
  systemPrompt: string;
  userPrompt: string;
} {
  const lang = body.language ?? "en";
  const systemPrompt = lang === "fr" ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;
  const schema = templateSchemas[body.template];

  const userPrompt =
    lang === "fr"
      ? `Créez un pitch de type "${body.template}" pour le projet suivant :

Nom du projet : ${body.projectName}
Description : ${body.description}
Marché cible : ${body.targetMarket}
Proposition de valeur unique : ${body.uniqueValue}
${body.features ? `Fonctionnalités clés : ${body.features}` : ""}

Retournez UNIQUEMENT un JSON brut correspondant exactement à ce schéma (remplissez chaque champ "content" avec un contenu professionnel et spécifique) :
${schema}`
      : `Create a "${body.template}" pitch document for the following project:

Project Name: ${body.projectName}
Description: ${body.description}
Target Market: ${body.targetMarket}
Unique Value Proposition: ${body.uniqueValue}
${body.features ? `Key Features: ${body.features}` : ""}

Return ONLY raw JSON exactly matching this schema (fill each "content" field with professional, specific content):
${schema}`;

  return { systemPrompt, userPrompt };
}
