
import { ProjectData, GeneratedPitch } from '@/pages/Index';

export interface PitchTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  generator: (data: ProjectData) => GeneratedPitch;
}

export const pitchTemplates: PitchTemplate[] = [
  {
    id: 'lean-canvas',
    name: 'Lean Canvas',
    description: 'Approche classique basée sur le Lean Canvas',
    icon: '📊',
    generator: (data: ProjectData) => ({
      problem: `Les utilisateurs dans le domaine "${data.targetMarket}" font face à des défis majeurs qui limitent leur efficacité et leur satisfaction. Les solutions actuelles ne répondent pas entièrement à leurs besoins spécifiques.`,
      solution: `${data.projectName} propose une approche innovante qui intègre ${data.keyFeatures}. Notre solution automatise les processus complexes et offre une expérience utilisateur intuitive.`,
      targetCustomer: `Notre client cible principal sont les professionnels et entreprises dans le secteur "${data.targetMarket}" qui cherchent à optimiser leurs opérations et améliorer leurs résultats.`,
      valueProposition: `Nous permettons à nos clients de gagner du temps, réduire leurs coûts opérationnels et améliorer leurs performances grâce à notre solution ${data.projectName} unique sur le marché.`,
      channels: `Nous atteindrons nos clients via le marketing digital, les partenariats stratégiques, les réseaux sociaux professionnels, et la participation à des événements sectoriels.`
    })
  },
  {
    id: 'elevator-pitch',
    name: 'Elevator Pitch',
    description: 'Pitch concis et percutant pour 30 secondes',
    icon: '🚀',
    generator: (data: ProjectData) => ({
      problem: `Imaginez que vous travaillez dans "${data.targetMarket}" et que vous perdez du temps chaque jour avec des processus inefficaces.`,
      solution: `${data.projectName} résout ce problème en utilisant ${data.keyFeatures} pour simplifier votre quotidien.`,
      targetCustomer: `Nous nous adressons spécifiquement aux professionnels de "${data.targetMarket}" qui valorisent l'efficacité.`,
      valueProposition: `En 5 minutes d'utilisation, ${data.projectName} vous fait économiser 2 heures de travail par jour.`,
      channels: `Nous touchons nos clients directement via des démonstrations personnalisées et le bouche-à-oreille.`
    })
  },
  {
    id: 'investor-pitch',
    name: 'Pitch Investisseur',
    description: 'Orienté croissance et retour sur investissement',
    icon: '💰',
    generator: (data: ProjectData) => ({
      problem: `Le marché "${data.targetMarket}" représente une opportunité de plusieurs milliards d'euros avec des inefficacités majeures non résolues.`,
      solution: `${data.projectName} révolutionne ce secteur grâce à ${data.keyFeatures}, créant une solution scalable et défendable.`,
      targetCustomer: `Notre marché cible comprend les entreprises de taille moyenne à grande dans "${data.targetMarket}", représentant un TAM de plusieurs millions d'utilisateurs potentiels.`,
      valueProposition: `${data.projectName} génère un ROI de 300% pour nos clients tout en créant de nouveaux revenus récurrents.`,
      channels: `Notre stratégie go-to-market combine vente directe B2B, partenariats stratégiques et croissance virale organique.`
    })
  }
];

export const generatePitchFromTemplate = (templateId: string, data: ProjectData): GeneratedPitch => {
  const template = pitchTemplates.find(t => t.id === templateId);
  if (!template) {
    return pitchTemplates[0].generator(data);
  }
  return template.generator(data);
};
