import type { Dictionary } from "../dictionaries";

const es: Dictionary = {
  meta: {
    title: "Cartas en 3D para restaurantes",
    description:
      "Tus clientes escanean un código QR y ven tus platos en 3D, a tamaño real sobre su mesa. Sin app. Y un único sistema para pedidos, mesas, cuentas, personal y estadísticas.",
  },
  nav: {
    howItWorks: "Cómo funciona",
    owners: "Para restaurantes",
    plans: "Planes",
    faq: "Preguntas",
    bookDemo: "Pedir una demo",
    menu: "Menú",
    language: "Idioma",
  },
  hero: {
    eyebrow: "Cartas en 3D · Sin app",
    title: "Que tus clientes vean el plato antes de pedirlo",
    subtitle:
      "Un código QR en la mesa abre tu carta con cada plato en 3D, a tamaño real, directamente sobre la mesa del cliente.",
    ctaPrimary: "Pedir una demo",
    ctaSecondary: "Ver cómo funciona",
    scrollHint: "Desliza para armar la hamburguesa",
  },
  story: {
    stages: ["Pan", "Carne", "Queso", "Pepinillos", "Cebolla", "Salsa", "Tapa"],
    captions: [
      {
        title: "Los clientes piden con los ojos.",
        text: "Una foto plana no muestra lo grande, lo fresco ni lo apetecible que es un plato de verdad.",
      },
      {
        title: "Convertimos tus platos en 3D.",
        text: "Envíanos entre 20 y 30 fotos de un plato. Nuestro equipo crea un modelo 3D realista.",
      },
      {
        title: "Fiel al tamaño y a cada detalle.",
        text: "Proporciones y texturas reales, para que lo que llega a la mesa sea lo que el cliente esperaba.",
      },
      {
        title: "Lo giran, se acercan y deciden.",
        text: "Dentro de la carta, en su navegador. Sin descargar nada.",
      },
      {
        title: "Y luego lo ponen sobre su mesa.",
        text: "Apuntan la cámara a la mesa y el plato aparece a tamaño real, antes incluso de pedirlo.",
      },
    ],
    arDish: "Hamburguesa con queso",
    arSize: "Ø 11 cm",
    arBadge: "RA a tamaño real",
    reducedTitle: "De la foto al plato en 3D",
  },
  menu: { margherita: "Margarita", diavola: "Diávola", quattro: "Cuatro quesos", funghi: "Champiñones", lemonade: "Limonada", water: "Agua con gas", espresso: "Café solo", tiramisu: "Tiramisú" },
  journey: {
    eyebrow: "La experiencia del cliente",
    title: "Del escaneo al pedido en menos de un minuto",
    subtitle: "Tus clientes usan la cámara que ya tienen. Nada que instalar, ningún registro.",
    steps: [
      { title: "Escanear el código QR", text: "En la mesa, en la carta impresa o en una pegatina. La cámara del móvil hace el resto." },
      { title: "Ver la carta", text: "Toda tu carta se abre en el navegador, con fotos, precios y platos en 3D." },
      { title: "Ver el plato en 3D", text: "El cliente lo gira y se acerca para ver cada detalle." },
      { title: "Ponerlo sobre la mesa", text: "La realidad aumentada muestra el plato a su tamaño real, justo delante." },
      { title: "Pedir y pagar", text: "Desde el móvil o con un camarero. Tú decides cómo funciona tu restaurante." },
    ],
    demo: {
      label: "Pruébalo tú mismo",
      title: "Escanéalo. La hamburguesa llega a tu mesa.",
      text: "Apunta la cámara del móvil al código. La hamburguesa del principio de esta página se abre en 3D, directamente en el navegador.",
      scan: "Escanea con la cámara del móvil",
      open: "Abrir la demo 3D",
      noApp: "Sin descargar apps",
    },
  },
  demo: {
    metaTitle: "Demo 3D",
    eyebrow: "Demo en vivo",
    title: "Esto es lo que ven tus clientes",
    text: "Arrastra para girar la hamburguesa y pellizca para hacer zoom. En los móviles compatibles, colócala en tu mesa a tamaño real.",
    ar: "Ver en mi mesa",
    note: "Plato de ejemplo. Tus platos se modelan a partir de tus propias fotos.",
    back: "Volver a la web",
  },
  owners: {
    eyebrow: "Para dueños de restaurantes",
    title: "Todo tu restaurante en un solo lugar",
    subtitle:
      "El mismo sistema que muestra la carta te enseña cada mesa, cada pedido, cada cuenta y a tu personal, en tiempo real.",
    sampleData: "Datos de ejemplo",
    live: "En vivo",
    kpis: { revenue: "Ventas de hoy", orders: "Pedidos de hoy", avgWait: "Espera media (min)", views3d: "Vistas de platos 3D" },
    floor: {
      title: "Plano de sala",
      table: "Mesa",
      seats: "plazas",
      statuses: { free: "Libre", ordered: "Pedido hecho", waiting: "Espera larga", bill: "Pide la cuenta" },
    },
    panel: {
      selectHint: "Selecciona una mesa para ver su pedido",
      order: "Pedido",
      waiting: "Esperando desde hace",
      waiter: "Camarero",
      bill: "Cuenta",
      empty: "Aún sin pedido",
    },
    charts: {
      topDishes: "Platos más vistos en 3D",
      topDishesSub: "Vistas esta semana",
      peakHours: "Horas punta",
      peakHoursSub: "Pedidos por hora hoy",
      peak: "Pico",
      orders: "pedidos",
    },
    features: [
      { title: "Pedidos por mesa", text: "Mira qué ha pedido cada mesa y cuándo, en el momento en que ocurre." },
      { title: "Cuentas y pagos", text: "Los clientes pagan desde el móvil o con el camarero. Todas las cuentas en una lista." },
      { title: "Tiempos de espera", text: "Detecta las mesas que llevan demasiado esperando antes de que tengan que pedir." },
      { title: "Personal", text: "Asigna camareros a las mesas y mira quién lleva qué." },
      { title: "Control de la carta", text: "Cambia platos, precios y disponibilidad sin reimprimir nada." },
      { title: "Estadísticas", text: "Platos populares, horas punta y ventas, para decidir con datos y no a ojo." },
    ],
  },
  how: {
    eyebrow: "Cómo funciona",
    title: "Tú haces las fotos. Nosotros, el resto.",
    subtitle: "Pasarte al 3D no requiere estudio ni equipo nuevo. Solo un móvil.",
    steps: [
      { title: "Haz entre 20 y 30 fotos", text: "Fotografía cada plato desde todos los lados con el móvil y envíanoslas." },
      { title: "Creamos los modelos 3D", text: "Nuestro equipo convierte tus fotos en platos 3D realistas." },
      { title: "Recibe tus códigos QR", text: "Añádelos a tu carta impresa o lanza una carta digital completa." },
      { title: "El cliente lo ve en su mesa", text: "Escanea, mira y pide. Sin app." },
    ],
  },
  plans: {
    eyebrow: "Planes",
    title: "Empieza poco a poco o hazlo todo digital",
    subtitle: "Elige hasta dónde quieres llegar. Puedes ampliarlo cuando quieras.",
    cta: "Pedir presupuesto",
    highlight: "El más completo",
    items: [
      {
        name: "Platos 3D",
        text: "Mantén tu carta impresa y añade un código QR por plato.",
        features: [
          "Modelos 3D creados a partir de tus fotos",
          "Un código QR para cada plato",
          "Vista a tamaño real sobre la mesa del cliente",
          "Funciona en el móvil del cliente, sin app",
        ],
      },
      {
        name: "Carta digital",
        text: "Toda tu carta en el móvil de tus clientes, con platos en 3D.",
        features: [
          "Todo lo de Platos 3D",
          "Carta digital completa por código QR",
          "Pedidos desde el móvil",
          "Cambia platos y precios cuando quieras",
        ],
      },
      {
        name: "Sistema completo",
        text: "Gestiona todo el restaurante desde un solo lugar.",
        features: [
          "Todo lo de Carta digital",
          "Pedidos y cuentas por mesa",
          "Tiempos de espera en vivo",
          "Gestión del personal",
          "Pago con el móvil o a través del camarero",
          "Panel de estadísticas",
        ],
      },
    ],
    note: "Cada restaurante es distinto, así que preparamos un plan y un precio para el tuyo.",
  },
  faq: {
    eyebrow: "Preguntas",
    title: "Lo que nos preguntan los restaurantes",
    items: [
      {
        q: "¿Los clientes tienen que descargar una app?",
        a: "No. Escanean el código QR con la cámara del móvil y todo se abre en el navegador.",
      },
      {
        q: "¿En qué móviles funciona?",
        a: "La vista 3D funciona en el navegador de los smartphones actuales. Para colocar el plato sobre la mesa se usa la realidad aumentada integrada del móvil, compatible con la mayoría de iPhone y Android recientes.",
      },
      {
        q: "¿Cómo se crean los modelos 3D?",
        a: "Haces entre 20 y 30 fotos de cada plato desde distintos ángulos y nos las envías. Nuestro equipo crea el modelo 3D y el código QR.",
      },
      {
        q: "¿Podemos mantener nuestras cartas impresas?",
        a: "Sí. Añade un código QR junto a cada plato y tus clientes lo verán en 3D. O pásate a una carta digital completa cuando quieras.",
      },
      {
        q: "¿Pueden los clientes pagar con el móvil?",
        a: "Sí, si quieres un servicio totalmente digital. También puedes seguir con camareros para pedidos y pagos, o combinar ambos.",
      },
      {
        q: "¿Necesitamos el sistema de gestión completo?",
        a: "No. Empieza con platos 3D o una carta digital y añade pedidos, mesas, personal y estadísticas cuando te convenga.",
      },
    ],
  },
  cta: {
    title: "¿Quieres ver tus platos en 3D?",
    text: "Cuéntanos sobre tu restaurante y te enseñaremos cómo quedaría con tu carta.",
    button: "Pedir una demo",
    emailSubject: "Solicitud de demo",
  },
  footer: {
    tagline: "Cartas en 3D y gestión de restaurantes.",
    rights: "Todos los derechos reservados.",
  },
};

export default es;
