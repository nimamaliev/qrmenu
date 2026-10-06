import type { Dictionary } from "../dictionaries";

const fr: Dictionary = {
  meta: {
    title: "Menus 3D pour restaurants",
    description:
      "Vos clients scannent un QR code et voient vos plats en 3D, en taille réelle sur leur table. Sans application. Et un seul système pour les commandes, les tables, les additions, l'équipe et les statistiques.",
  },
  nav: {
    howItWorks: "Comment ça marche",
    owners: "Restaurateurs",
    plans: "Offres",
    faq: "FAQ",
    bookDemo: "Demander une démo",
    menu: "Menu",
    language: "Langue",
  },
  hero: {
    eyebrow: "Menus 3D · Sans application",
    title: "Vos clients voient le plat avant de commander",
    subtitle:
      "Un QR code sur la table ouvre votre carte, avec chaque plat en 3D, en taille réelle, directement sur la table du client.",
    ctaPrimary: "Demander une démo",
    ctaSecondary: "Voir comment ça marche",
    scrollHint: "Faites défiler pour monter le burger",
  },
  story: {
    stages: ["Pain", "Steak", "Cheddar", "Cornichons", "Oignons", "Sauce", "Chapeau"],
    captions: [
      {
        title: "On commande d'abord avec les yeux.",
        text: "Une photo à plat ne montre pas la taille, la fraîcheur ni l'appétit qu'inspire vraiment un plat.",
      },
      {
        title: "Nous mettons vos plats en 3D.",
        text: "Envoyez-nous 20 à 30 photos d'un plat. Notre équipe en crée un modèle 3D réaliste.",
      },
      {
        title: "Fidèle à la taille, fidèle aux détails.",
        text: "De vraies proportions et de vraies textures : ce qui arrive à table correspond à ce que le client attendait.",
      },
      {
        title: "Le client le tourne, zoome et choisit.",
        text: "Directement dans la carte, dans son navigateur. Rien à télécharger.",
      },
      {
        title: "Puis il le pose sur sa table.",
        text: "Il pointe la caméra vers la table et le plat apparaît en taille réelle, avant même d'être commandé.",
      },
    ],
    arDish: "Cheeseburger",
    arSize: "Ø 11 cm",
    arBadge: "AR taille réelle",
    reducedTitle: "De la photo au plat en 3D",
  },
  menu: { margherita: "Margherita", diavola: "Diavola", quattro: "Quatre fromages", funghi: "Champignons", lemonade: "Limonade", water: "Eau gazeuse", espresso: "Expresso", tiramisu: "Tiramisu" },
  journey: {
    eyebrow: "L'expérience client",
    title: "Du scan à la commande en moins d'une minute",
    subtitle: "Vos clients utilisent l'appareil photo qu'ils ont déjà. Rien à installer, aucun compte à créer.",
    steps: [
      { title: "Scanner le QR code", text: "Sur la table, sur la carte imprimée ou sur un autocollant. L'appareil photo fait le reste." },
      { title: "Parcourir la carte", text: "Toute votre carte s'ouvre dans le navigateur, avec photos, prix et plats en 3D." },
      { title: "Voir le plat en 3D", text: "Le client le fait pivoter et zoome pour voir chaque détail." },
      { title: "Le poser sur la table", text: "La réalité augmentée affiche le plat à sa taille réelle, juste devant lui." },
      { title: "Commander et payer", text: "Depuis le téléphone ou avec un serveur. Vous choisissez comment fonctionne votre restaurant." },
    ],
    demo: {
      label: "Essayez vous-même",
      title: "Scannez. Le burger arrive sur votre table.",
      text: "Pointez l’appareil photo de votre téléphone vers le code. Le burger du haut de cette page s’ouvre en 3D, directement dans le navigateur.",
      scan: "Scannez avec l’appareil photo",
      open: "Ouvrir la démo 3D",
      noApp: "Aucune appli requise",
    },
  },
  demo: {
    metaTitle: "Démo 3D",
    eyebrow: "Démo en direct",
    title: "Voici ce que voient vos clients",
    text: "Faites glisser pour tourner le burger, pincez pour zoomer. Sur les téléphones compatibles, posez-le sur votre table à taille réelle.",
    ar: "Voir sur ma table",
    note: "Plat d’exemple. Vos plats sont modélisés à partir de vos propres photos.",
    back: "Retour au site",
  },
  owners: {
    eyebrow: "Pour les restaurateurs",
    title: "Tout votre restaurant au même endroit",
    subtitle:
      "Le système qui affiche la carte vous montre aussi chaque table, chaque commande, chaque addition et votre équipe, en direct.",
    sampleData: "Données d'exemple",
    live: "En direct",
    kpis: { revenue: "Chiffre du jour", orders: "Commandes du jour", avgWait: "Attente moy. (min)", views3d: "Vues des plats 3D" },
    floor: {
      title: "Plan de salle",
      table: "Table",
      seats: "places",
      statuses: { free: "Libre", ordered: "Commandé", waiting: "Attente longue", bill: "Addition demandée" },
    },
    panel: {
      selectHint: "Sélectionnez une table pour voir sa commande",
      order: "Commande",
      waiting: "En attente depuis",
      waiter: "Serveur",
      bill: "Addition",
      empty: "Pas encore de commande",
    },
    charts: {
      topDishes: "Plats les plus vus en 3D",
      topDishesSub: "Vues cette semaine",
      peakHours: "Heures de pointe",
      peakHoursSub: "Commandes par heure aujourd'hui",
      peak: "Pic",
      orders: "commandes",
    },
    features: [
      { title: "Commandes par table", text: "Voyez ce que chaque table a commandé, et quand, dès que ça arrive." },
      { title: "Additions et paiements", text: "Les clients paient par téléphone ou via un serveur. Toutes les additions dans une seule liste." },
      { title: "Temps d'attente", text: "Repérez les tables qui attendent trop longtemps avant que les clients aient à demander." },
      { title: "Équipe", text: "Attribuez les serveurs aux tables et voyez qui s'occupe de quoi." },
      { title: "Gestion de la carte", text: "Modifiez plats, prix et disponibilités sans rien réimprimer." },
      { title: "Statistiques", text: "Plats populaires, heures de pointe et chiffre d'affaires, pour décider avec des chiffres." },
    ],
  },
  how: {
    eyebrow: "Comment ça marche",
    title: "Vous prenez les photos. Nous faisons le reste.",
    subtitle: "Passer à la 3D ne demande ni studio ni équipement. Juste un téléphone.",
    steps: [
      { title: "Prenez 20 à 30 photos", text: "Photographiez chaque plat sous tous les angles avec votre téléphone et envoyez-les-nous." },
      { title: "Nous créons les modèles 3D", text: "Notre équipe transforme vos photos en plats 3D réalistes." },
      { title: "Recevez vos QR codes", text: "Ajoutez-les à votre carte imprimée ou lancez une carte entièrement digitale." },
      { title: "Le client le voit sur sa table", text: "Il scanne, regarde et commande. Sans application." },
    ],
  },
  plans: {
    eyebrow: "Offres",
    title: "Commencez petit ou passez au tout digital",
    subtitle: "Choisissez jusqu'où aller. Vous pourrez ajouter le reste à tout moment.",
    cta: "Demander un devis",
    highlight: "La plus complète",
    items: [
      {
        name: "Plats 3D",
        text: "Gardez votre carte imprimée et ajoutez un QR code par plat.",
        features: [
          "Modèles 3D créés à partir de vos photos",
          "Un QR code pour chaque plat",
          "Vue en taille réelle sur la table du client",
          "Fonctionne sur le téléphone du client, sans application",
        ],
      },
      {
        name: "Carte digitale",
        text: "Toute votre carte sur le téléphone des clients, avec les plats en 3D.",
        features: [
          "Tout ce qu'inclut Plats 3D",
          "Carte digitale complète par QR code",
          "Commande depuis le téléphone",
          "Plats et prix modifiables à tout moment",
        ],
      },
      {
        name: "Système complet",
        text: "Gérez tout le restaurant depuis un seul endroit.",
        features: [
          "Tout ce qu'inclut Carte digitale",
          "Commandes et additions par table",
          "Temps d'attente en direct",
          "Gestion de l'équipe",
          "Paiement par téléphone ou via les serveurs",
          "Tableau de bord statistique",
        ],
      },
    ],
    note: "Chaque restaurant est différent : nous préparons une offre et un prix adaptés au vôtre.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Les questions des restaurateurs",
    items: [
      {
        q: "Les clients doivent-ils télécharger une application ?",
        a: "Non. Ils scannent le QR code avec l'appareil photo de leur téléphone et tout s'ouvre dans le navigateur.",
      },
      {
        q: "Sur quels téléphones cela fonctionne-t-il ?",
        a: "La vue 3D fonctionne dans le navigateur des smartphones récents. Pour poser le plat sur la table, le téléphone utilise sa réalité augmentée intégrée, prise en charge par la plupart des iPhone et téléphones Android récents.",
      },
      {
        q: "Comment les modèles 3D sont-ils créés ?",
        a: "Vous prenez 20 à 30 photos de chaque plat sous différents angles et vous nous les envoyez. Notre équipe crée le modèle 3D et le QR code.",
      },
      {
        q: "Pouvons-nous garder nos cartes imprimées ?",
        a: "Oui. Ajoutez un QR code à côté de chaque plat et vos clients le voient en 3D. Ou passez à une carte entièrement digitale quand vous le souhaitez.",
      },
      {
        q: "Les clients peuvent-ils payer par téléphone ?",
        a: "Oui, si vous voulez un service entièrement digital. Vous pouvez aussi garder les serveurs pour les commandes et les paiements, ou combiner les deux.",
      },
      {
        q: "Avons-nous besoin du système de gestion complet ?",
        a: "Non. Commencez avec les plats 3D ou une carte digitale, puis ajoutez commandes, tables, équipe et statistiques quand vous le souhaitez.",
      },
    ],
  },
  cta: {
    title: "Envie de voir vos plats en 3D ?",
    text: "Parlez-nous de votre restaurant et nous vous montrerons ce que cela donnerait avec votre carte.",
    button: "Demander une démo",
    emailSubject: "Demande de démo",
  },
  footer: {
    tagline: "Menus 3D et gestion de restaurant.",
    rights: "Tous droits réservés.",
  },
};

export default fr;
