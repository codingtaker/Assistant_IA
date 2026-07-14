const fr = {
  translation: {
    // Nav
    nav: {
      home: "Générateur",
      history: "Historique",
      tagline: "Votre co-fondateur IA",
    },
    // Hero
    hero: {
      title: "Transformez votre idée en pitch\nprêt pour les investisseurs",
      subtitle:
        "Plateforme propulsée par l'IA qui aide les entrepreneurs à rédiger des pitchs professionnels en quelques minutes.",
    },
    // Templates
    templates: {
      title: "Choisissez un template",
      "lean-canvas": {
        name: "Lean Canvas",
        description: "Modèle d'affaires en 9 blocs",
      },
      "elevator-pitch": {
        name: "Elevator Pitch",
        description: "Pitch convaincant de 30 secondes",
      },
      "investor-pitch": {
        name: "Pitch Investisseur",
        description: "Deck complet pour lever des fonds",
      },
      "executive-summary": {
        name: "Résumé Exécutif",
        description: "Vue d'ensemble de haut niveau",
      },
    },
    // Form
    form: {
      title: "Décrivez votre projet",
      projectName: "Nom du projet / Startup",
      projectNamePlaceholder: "ex. EcoRide",
      description: "Que fait votre startup ?",
      descriptionPlaceholder:
        "Décrivez brièvement votre produit ou service et le problème qu'il résout...",
      targetMarket: "Marché cible",
      targetMarketPlaceholder: "ex. Navetteurs urbains de 20–40 ans en Europe",
      uniqueValue: "Proposition de valeur unique",
      uniqueValuePlaceholder:
        "En quoi votre solution est-elle meilleure que les alternatives existantes ?",
      features: "Fonctionnalités clés (optionnel)",
      featuresPlaceholder: "Listez 3–5 fonctionnalités principales...",
      provider: "Fournisseur IA",
      providerFallbackNote:
        "Si le fournisseur choisi n'a plus de crédits, le système bascule automatiquement vers le suivant disponible.",
      generate: "Générer le pitch",
      generating: "Génération en cours…",
    },
    // Result
    result: {
      generatedBy: "Généré par {{model}}",
      copy: "Copier",
      copied: "Copié !",
      exportTxt: "Exporter TXT",
      exportPdf: "Exporter PDF",
      exportJson: "Exporter JSON",
      save: "Sauvegarder",
      saved: "Sauvegardé !",
      regenerate: "Régénérer",
      fallbackBadge: "Basculé → {{provider}}",
      fallbackTooltip:
        "{{requested}} n'avait plus de crédits — basculé automatiquement vers {{used}}",
    },
    // History
    history: {
      title: "Pitchs sauvegardés",
      empty: "Aucun pitch sauvegardé. Générez votre premier pitch !",
      delete: "Supprimer",
      open: "Ouvrir",
    },
    // Errors
    errors: {
      generic: "Une erreur est survenue. Veuillez réessayer.",
      noProvider:
        "Aucun fournisseur IA disponible. Configurez au moins une clé API.",
      validation: "Veuillez remplir tous les champs requis.",
    },
    // Footer
    footer: {
      tagline: "Créez des pitchs prêts pour les investisseurs avec l'IA",
      madeWith: "Conçu avec",
    },
    // Misc
    language: "English",
  },
};

export default fr;
