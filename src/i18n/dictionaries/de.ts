import type { Dictionary } from "../dictionaries";

const de: Dictionary = {
  meta: {
    title: "3D-Speisekarten für Restaurants",
    description:
      "Gäste scannen einen QR-Code und sehen Ihre Gerichte in 3D, in Originalgröße auf ihrem Tisch. Ohne App. Dazu ein System für Bestellungen, Tische, Rechnungen, Personal und Auswertungen.",
  },
  nav: {
    howItWorks: "So funktioniert's",
    owners: "Für Gastronomen",
    plans: "Pakete",
    faq: "FAQ",
    bookDemo: "Demo vereinbaren",
    menu: "Menü",
    language: "Sprache",
  },
  hero: {
    eyebrow: "3D-Speisekarten · Ohne App",
    title: "Gäste sehen das Gericht, bevor sie bestellen",
    subtitle:
      "Ein QR-Code auf dem Tisch öffnet Ihre Speisekarte. Jedes Gericht in 3D, in Originalgröße, direkt auf dem Tisch des Gastes.",
    ctaPrimary: "Demo vereinbaren",
    ctaSecondary: "So funktioniert's",
    scrollHint: "Scrollen, um die Pizza zu belegen",
  },
  story: {
    stages: ["Teig", "Sauce", "Mozzarella", "Tomaten", "Ofen", "Basilikum", "Auf dem Tisch"],
    captions: [
      {
        title: "Gäste bestellen mit den Augen.",
        text: "Ein flaches Foto zeigt nicht, wie groß, frisch und lecker ein Gericht wirklich ist.",
      },
      {
        title: "Wir machen Ihre Gerichte dreidimensional.",
        text: "Schicken Sie uns 20–30 Fotos eines Gerichts. Unser Team erstellt daraus ein realistisches 3D-Modell.",
      },
      {
        title: "Originalgetreu bis ins Detail.",
        text: "Echte Proportionen und echte Texturen, damit auf dem Teller landet, was der Gast erwartet.",
      },
      {
        title: "Drehen, heranzoomen, entscheiden.",
        text: "Direkt in der Speisekarte im Browser. Ohne Download.",
      },
      {
        title: "Und dann steht es auf dem Tisch.",
        text: "Kamera auf den Tisch richten, und das Gericht erscheint in Originalgröße, noch bevor es bestellt ist.",
      },
    ],
    arDish: "Margherita",
    arSize: "Ø 30 cm",
    arBadge: "AR in Originalgröße",
    reducedTitle: "Vom Foto zum 3D-Gericht",
  },
  journey: {
    eyebrow: "Das Erlebnis für Gäste",
    title: "Vom Scan zur Bestellung in unter einer Minute",
    subtitle: "Gäste nutzen die Kamera, die sie schon haben. Nichts installieren, nichts registrieren.",
    steps: [
      { title: "QR-Code scannen", text: "Auf dem Tisch, in der gedruckten Karte oder als Aufkleber. Die Handykamera erledigt den Rest." },
      { title: "Speisekarte ansehen", text: "Die komplette Karte öffnet sich im Browser, mit Fotos, Preisen und 3D-Gerichten." },
      { title: "Gericht in 3D ansehen", text: "Gäste drehen es und zoomen heran, um jedes Detail zu sehen." },
      { title: "Auf den Tisch stellen", text: "Augmented Reality zeigt das Gericht in echter Größe direkt vor ihnen." },
      { title: "Bestellen und bezahlen", text: "Per Handy oder beim Kellner. Sie entscheiden, wie Ihr Restaurant arbeitet." },
    ],
    screen: {
      detected: "QR-Code erkannt",
      openMenu: "Karte öffnen",
      restaurant: "Demo-Restaurant",
      table: "Tisch 7",
      categories: ["Pizza", "Pasta", "Salate", "Getränke"],
      view3d: "3D",
      dragHint: "Zum Drehen ziehen",
      seeOnTable: "Auf dem Tisch ansehen",
      tapToPlace: "Originalgröße · Ø 30 cm",
      yourOrder: "Ihre Bestellung",
      total: "Gesamt",
      payByPhone: "Per Handy bezahlen",
      callWaiter: "Kellner rufen",
    },
  },
  owners: {
    eyebrow: "Für Gastronomen",
    title: "Ihr ganzes Restaurant an einem Ort",
    subtitle:
      "Dasselbe System, das die Speisekarte ausliefert, zeigt Ihnen jeden Tisch, jede Bestellung, jede Rechnung und Ihr Personal, live.",
    sampleData: "Beispieldaten",
    live: "Live",
    kpis: { revenue: "Umsatz heute", orders: "Bestellungen heute", avgWait: "Ø Wartezeit (Min.)", views3d: "3D-Aufrufe" },
    floor: {
      title: "Tischplan",
      table: "Tisch",
      seats: "Plätze",
      statuses: { free: "Frei", ordered: "Bestellt", waiting: "Wartet lange", bill: "Rechnung gewünscht" },
    },
    panel: {
      selectHint: "Tisch auswählen, um die Bestellung zu sehen",
      order: "Bestellung",
      waiting: "Wartet seit",
      waiter: "Kellner",
      bill: "Rechnung",
      empty: "Noch keine Bestellung",
    },
    charts: {
      topDishes: "Meistgesehene Gerichte in 3D",
      topDishesSub: "Aufrufe diese Woche",
      peakHours: "Stoßzeiten",
      peakHoursSub: "Bestellungen pro Stunde heute",
      peak: "Spitze",
      orders: "Bestellungen",
    },
    features: [
      { title: "Bestellungen pro Tisch", text: "Sehen Sie sofort, was jeder Tisch wann bestellt hat." },
      { title: "Rechnungen und Zahlungen", text: "Gäste zahlen per Handy oder beim Kellner. Alle Rechnungen in einer Liste." },
      { title: "Wartezeiten", text: "Erkennen Sie Tische, die zu lange warten, bevor Gäste nachfragen müssen." },
      { title: "Personal", text: "Weisen Sie Kellnern Tische zu und sehen Sie, wer was betreut." },
      { title: "Speisekarte im Griff", text: "Gerichte, Preise und Verfügbarkeit ändern, ohne neu zu drucken." },
      { title: "Auswertungen", text: "Beliebte Gerichte, Stoßzeiten und Umsatz: planen mit Zahlen statt Bauchgefühl." },
    ],
  },
  how: {
    eyebrow: "So funktioniert's",
    title: "Sie machen die Fotos. Wir den Rest.",
    subtitle: "Für 3D brauchen Sie kein Studio und keine neue Technik. Nur ein Handy.",
    steps: [
      { title: "20–30 Fotos machen", text: "Fotografieren Sie jedes Gericht von allen Seiten mit dem Handy und schicken Sie uns die Bilder." },
      { title: "Wir erstellen die 3D-Modelle", text: "Unser Team macht aus Ihren Fotos realistische 3D-Gerichte." },
      { title: "QR-Codes erhalten", text: "Fügen Sie sie Ihrer gedruckten Karte hinzu oder starten Sie eine komplette digitale Speisekarte." },
      { title: "Gäste sehen es auf dem Tisch", text: "Scannen, ansehen, bestellen. Ganz ohne App." },
    ],
  },
  plans: {
    eyebrow: "Pakete",
    title: "Klein anfangen oder komplett digital",
    subtitle: "Sie entscheiden, wie weit Sie gehen. Erweitern können Sie jederzeit.",
    cta: "Angebot anfragen",
    highlight: "Am umfassendsten",
    items: [
      {
        name: "3D-Gerichte",
        text: "Behalten Sie Ihre gedruckte Karte und ergänzen Sie einen QR-Code pro Gericht.",
        features: [
          "3D-Modelle aus Ihren Fotos",
          "Ein QR-Code für jedes Gericht",
          "Originalgröße auf dem Tisch des Gastes",
          "Läuft auf den Handys der Gäste, ohne App",
        ],
      },
      {
        name: "Digitale Speisekarte",
        text: "Ihre komplette Karte auf den Handys der Gäste, mit Gerichten in 3D.",
        features: [
          "Alles aus 3D-Gerichte",
          "Komplette digitale Karte per QR-Code",
          "Bestellen per Handy",
          "Gerichte und Preise jederzeit ändern",
        ],
      },
      {
        name: "Komplettsystem",
        text: "Das ganze Restaurant von einem Ort aus führen.",
        features: [
          "Alles aus Digitale Speisekarte",
          "Bestellungen und Rechnungen pro Tisch",
          "Wartezeiten live",
          "Personalverwaltung",
          "Bezahlen per Handy oder beim Kellner",
          "Auswertungs-Dashboard",
        ],
      },
    ],
    note: "Jedes Restaurant ist anders. Wir stellen ein Paket und einen Preis für Ihres zusammen.",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Was Gastronomen uns fragen",
    items: [
      {
        q: "Müssen Gäste eine App herunterladen?",
        a: "Nein. Gäste scannen den QR-Code mit der Handykamera, und alles öffnet sich im Browser.",
      },
      {
        q: "Auf welchen Handys funktioniert das?",
        a: "Die 3D-Ansicht läuft im Browser moderner Smartphones. Für das Platzieren auf dem Tisch wird die eingebaute Augmented Reality des Handys genutzt, die die meisten aktuellen iPhones und Android-Geräte unterstützen.",
      },
      {
        q: "Wie entstehen die 3D-Modelle?",
        a: "Sie machen 20–30 Fotos von jedem Gericht aus verschiedenen Winkeln und schicken sie uns. Unser Team erstellt das 3D-Modell und den QR-Code.",
      },
      {
        q: "Können wir unsere gedruckten Speisekarten behalten?",
        a: "Ja. Setzen Sie neben jedes Gericht einen QR-Code, und Gäste sehen es in 3D. Oder wechseln Sie zur kompletten digitalen Karte, wann immer Sie möchten.",
      },
      {
        q: "Können Gäste per Handy bezahlen?",
        a: "Ja, wenn Sie einen komplett digitalen Service möchten. Sie können auch weiterhin Bestellungen und Zahlungen über Kellner abwickeln oder beides kombinieren.",
      },
      {
        q: "Brauchen wir das komplette Verwaltungssystem?",
        a: "Nein. Starten Sie mit 3D-Gerichten oder einer digitalen Karte und ergänzen Sie Bestellungen, Tische, Personal und Auswertungen, wenn es passt.",
      },
    ],
  },
  cta: {
    title: "Möchten Sie Ihre Gerichte in 3D sehen?",
    text: "Erzählen Sie uns von Ihrem Restaurant, und wir zeigen Ihnen, wie es mit Ihrer Speisekarte aussehen würde.",
    button: "Demo vereinbaren",
    emailSubject: "Demo-Anfrage",
  },
  footer: {
    tagline: "3D-Speisekarten und Restaurantverwaltung.",
    rights: "Alle Rechte vorbehalten.",
  },
};

export default de;
