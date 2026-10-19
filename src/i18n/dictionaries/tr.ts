import type { Dictionary } from "../dictionaries";

const tr: Dictionary = {
  meta: {
    title: "Restoranlar için 3D dijital menüler",
    description:
      "Misafirler QR kodu okutur ve yemeklerinizi masalarında gerçek boyutta 3D olarak görür. Uygulama gerekmez. Ayrıca siparişler, masalar, hesaplar, personel ve analizler için tek bir sistem.",
  },
  nav: {
    howItWorks: "Nasıl çalışır",
    owners: "İşletmeler için",
    plans: "Paketler",
    faq: "SSS",
    bookDemo: "Demo talep edin",
    menu: "Menü",
    language: "Dil",
  },
  hero: {
    eyebrow: "3D menüler · Uygulama gerekmez",
    title: "Misafirleriniz yemeği sipariş vermeden önce görsün",
    subtitle: "Masadaki QR kod menünüzü açar: her yemek 3D olarak, gerçek boyutta, doğrudan misafirin masasında.",
    ctaPrimary: "Demo talep edin",
    ctaSecondary: "Nasıl çalıştığını görün",
    scrollHint: "Burgeri kurmak için kaydırın",
  },
  story: {
    stages: ["Ekmek", "Köfte", "Peynir", "Turşu", "Soğan", "Sos", "Üst ekmek"],
    captions: [
      {
        title: "Misafirler gözleriyle sipariş verir.",
        text: "Düz bir fotoğraf, bir yemeğin gerçekte ne kadar büyük, taze ve lezzetli olduğunu gösteremez.",
      },
      {
        title: "Yemeklerinizi 3D'ye dönüştürüyoruz.",
        text: "Bir yemeğin 20–30 fotoğrafını bize gönderin. Ekibimiz onun gerçekçi bir 3D modelini oluşturur.",
      },
      {
        title: "Gerçek boyut, gerçek ayrıntı.",
        text: "Gerçek oranlar ve gerçek dokular; böylece gelen yemek misafirin beklediğiyle aynı olur.",
      },
      {
        title: "Misafirler çevirir, yakınlaştırır ve karar verir.",
        text: "Doğrudan tarayıcıdaki menünün içinde. İndirilecek hiçbir şey yok.",
      },
      {
        title: "Sonra yemeği masalarına koyarlar.",
        text: "Kamerayı masaya doğrultun; yemek daha sipariş edilmeden gerçek boyutunda belirir.",
      },
    ],
    arDish: "Cheeseburger",
    arSize: "Ø 11 cm",
    arBadge: "Gerçek boyutta AR",
    reducedTitle: "Fotoğraftan 3D yemeğe",
  },
  menu: { margherita: "Margherita", diavola: "Diavola", quattro: "Quattro Formaggi", funghi: "Funghi", lemonade: "Limonata", water: "Maden suyu", espresso: "Espresso", tiramisu: "Tiramisu" },
  journey: {
    eyebrow: "Misafir deneyimi",
    title: "Okutmadan siparişe bir dakikadan kısa sürede",
    subtitle: "Misafirler zaten sahip oldukları kamerayı kullanır. Kurulacak ya da üye olunacak hiçbir şey yok.",
    steps: [
      { title: "QR kodu okutun", text: "Masada, basılı menüde ya da bir etikette. Gerisini telefon kamerası halleder." },
      { title: "Menüye göz atın", text: "Tüm menünüz fotoğraflar, fiyatlar ve 3D yemeklerle tarayıcıda açılır." },
      { title: "Yemeği 3D görün", text: "Misafirler yemeği çevirir ve her ayrıntıyı görmek için yakınlaştırır." },
      { title: "Masaya koyun", text: "Artırılmış gerçeklik, yemeği gerçek boyutunda tam önlerinde gösterir." },
      { title: "Sipariş verin ve ödeyin", text: "Telefondan ya da garsonla. Restoranınızın nasıl çalışacağına siz karar verirsiniz." },
    ],
    demo: {
      label: "Kendiniz deneyin",
      title: "Okutun. Burger masanıza gelsin.",
      text: "Telefon kameranızı koda doğrultun. Bu sayfanın başındaki burger doğrudan tarayıcıda 3D olarak açılır.",
      scan: "Telefon kameranızla okutun",
      open: "3D demoyu açın",
      noApp: "Uygulama gerekmez",
    },
  },
  demo: {
    metaTitle: "3D demo",
    eyebrow: "Canlı demo",
    title: "Misafirleriniz bunu görür",
    text: "Burgeri çevirmek için sürükleyin, yakınlaştırmak için iki parmağınızla sıkıştırın. Destekleyen telefonlarda masanıza gerçek boyutunda koyun.",
    ar: "Masanızda görün",
    note: "Örnek yemek. Sizin yemekleriniz kendi fotoğraflarınızdan modellenir.",
    back: "Web sitesine dön",
  },
  owners: {
    eyebrow: "Restoran sahipleri için",
    title: "Tüm restoranınız tek bir yerde",
    subtitle: "Menüyü sunan aynı sistem size her masayı, siparişi, hesabı ve personeli canlı olarak gösterir.",
    sampleData: "Örnek veriler",
    live: "Canlı",
    kpis: { revenue: "Bugünkü ciro", orders: "Bugünkü siparişler", avgWait: "Ort. bekleme (dk)", views3d: "3D yemek görüntülemesi" },
    floor: {
      title: "Salon planı",
      table: "Masa",
      seats: "kişilik",
      statuses: { free: "Boş", ordered: "Sipariş verildi", waiting: "Uzun bekliyor", bill: "Hesap istendi" },
    },
    panel: {
      selectHint: "Siparişini görmek için bir masa seçin",
      order: "Sipariş",
      waiting: "Bekleme süresi",
      waiter: "Garson",
      bill: "Hesap",
      empty: "Henüz sipariş yok",
    },
    charts: {
      topDishes: "3D'de en çok görüntülenen yemekler",
      topDishesSub: "Bu haftaki görüntülemeler",
      peakHours: "En yoğun saatler",
      peakHoursSub: "Bugün saat başına siparişler",
      peak: "Zirve",
      orders: "sipariş",
    },
    features: [
      { title: "Masaya göre siparişler", text: "Her masanın ne zaman ne sipariş ettiğini anında görün." },
      { title: "Hesaplar ve ödemeler", text: "Misafirler telefondan ya da garson aracılığıyla öder. Tüm hesaplar tek listede." },
      { title: "Bekleme süreleri", text: "Misafirler sormak zorunda kalmadan hangi masaların çok beklediğini bilin." },
      { title: "Personel", text: "Garsonları masalara atayın ve kimin neyle ilgilendiğini görün." },
      { title: "Menü kontrolü", text: "Hiçbir şeyi yeniden bastırmadan yemekleri, fiyatları ve stok durumunu değiştirin." },
      { title: "Analizler", text: "Popüler yemekler, yoğun saatler ve ciro: tahminle değil, rakamlarla planlayın." },
    ],
  },
  how: {
    eyebrow: "Nasıl çalışır",
    title: "Fotoğrafları siz çekin. Gerisini biz yaparız.",
    subtitle: "3D'ye geçmek için stüdyo ya da yeni ekipman gerekmez. Sadece bir telefon.",
    steps: [
      { title: "20–30 fotoğraf çekin", text: "Her yemeği telefonunuzla her açıdan fotoğraflayın ve bize gönderin." },
      { title: "3D modelleri biz oluştururuz", text: "Ekibimiz fotoğraflarınızı gerçekçi 3D yemeklere dönüştürür." },
      { title: "QR kodlarınızı alın", text: "Basılı menünüze ekleyin ya da eksiksiz bir dijital menüye geçin." },
      { title: "Misafirler masada görür", text: "Okuturlar, bakarlar ve sipariş verirler. Uygulama gerekmez." },
    ],
    figure: {
      fig: "Şekil 1",
      title: "Fotoğraftan masaya",
      hint: "Bir istasyonun üzerine gelin ya da ← → tuşlarını kullanın",
      readout: { photos: "fotoğraf", model: "3D model", printing: "QR kod basılıyor", ready: "QR kod hazır", table: "masada" },
      slider: "Nasıl çalışır: ok tuşlarıyla dört istasyon arasında gezinin",
      label:
        "Bir tezgâh üzerinde dört istasyonlu küçük bir stüdyo. Bir kamera, döner tabladaki bir burgerin her 15 derecede bir olmak üzere 24 fotoğrafını çeker. Bir monitör bu fotoğraflardan burgerin 3D modelini oluşturur. Bir yazıcı QR kodlu bir kart basar. Bir yuvadaki telefon burgeri masanın üzerinde gösterir.",
      keys: ["Şu anda çalışan istasyon", "Yemek: fotoğraflardan misafirin masasına tek bir burger"],
    },
  },
  plans: {
    eyebrow: "Paketler",
    title: "Küçük başlayın ya da tamamen dijitale geçin",
    subtitle: "Ne kadar ileri gitmek istediğinizi seçin. İstediğiniz zaman daha fazlasını ekleyebilirsiniz.",
    cta: "Teklif alın",
    highlight: "En kapsamlı",
    items: [
      {
        name: "3D Yemekler",
        text: "Basılı menünüzü koruyun ve her yemek için bir QR kod ekleyin.",
        features: [
          "Fotoğraflarınızdan yapılan 3D modeller",
          "Her yemek için bir QR kod",
          "Misafirin masasında gerçek boyutlu görünüm",
          "Misafirlerin telefonlarında çalışır, uygulama gerekmez",
        ],
      },
      {
        name: "Dijital Menü",
        text: "Tüm menünüz misafirlerin telefonlarında, yemekler 3D.",
        features: [
          "3D Yemekler paketindeki her şey",
          "QR kodla eksiksiz dijital menü",
          "Telefondan sipariş",
          "Yemekleri ve fiyatları istediğiniz zaman güncelleyin",
        ],
      },
      {
        name: "Tam Sistem",
        text: "Tüm restoranı tek bir yerden yönetin.",
        features: [
          "Dijital Menü paketindeki her şey",
          "Masaya göre siparişler ve hesaplar",
          "Canlı bekleme süreleri",
          "Personel yönetimi",
          "Telefonla ya da garson aracılığıyla ödeme",
          "Analiz paneli",
        ],
      },
    ],
    note: "Her restoran farklıdır; bu yüzden sizinki için bir paket ve fiyat hazırlarız.",
  },
  faq: {
    eyebrow: "SSS",
    title: "İşletme sahiplerinin bize sorduğu sorular",
    items: [
      {
        q: "Misafirlerin bir uygulama indirmesi gerekiyor mu?",
        a: "Hayır. Misafirler QR kodu telefon kameralarıyla okutur ve her şey tarayıcıda açılır.",
      },
      {
        q: "Hangi telefonlarda çalışır?",
        a: "3D görünüm, modern akıllı telefonlarda tarayıcıda çalışır. Yemeği masaya koymak için telefonun yerleşik artırılmış gerçeklik özelliği kullanılır; yeni iPhone ve Android telefonların çoğu bunu destekler.",
      },
      {
        q: "3D modeller nasıl yapılıyor?",
        a: "Her yemeğin farklı açılardan 20–30 fotoğrafını çekip bize gönderirsiniz. Ekibimiz 3D modeli ve QR kodu oluşturur.",
      },
      {
        q: "Basılı menülerimizi koruyabilir miyiz?",
        a: "Evet. Her yemeğin yanına bir QR kod ekleyin, misafirler yemeği 3D görsün. Ya da hazır olduğunuzda eksiksiz bir dijital menüye geçin.",
      },
      {
        q: "Misafirler telefondan ödeme yapabilir mi?",
        a: "Evet, tamamen dijital bir hizmet istiyorsanız. Sipariş ve ödemeleri garsonların almaya devam etmesini de seçebilir ya da ikisini birleştirebilirsiniz.",
      },
      {
        q: "Tam yönetim sistemine ihtiyacımız var mı?",
        a: "Hayır. 3D yemeklerle ya da dijital menüyle başlayın; siparişleri, masaları, personeli ve analizleri size uygun olduğunda ekleyin.",
      },
    ],
  },
  cta: {
    title: "Yemeklerinizi 3D görmek ister misiniz?",
    text: "Bize restoranınızdan bahsedin, menünüzün nasıl görüneceğini size gösterelim.",
    button: "Demo talep edin",
    emailSubject: "Demo talebi",
  },
  footer: {
    tagline: "3D dijital menüler ve restoran yönetimi.",
    rights: "Tüm hakları saklıdır.",
  },
  floor: {
    "hero": {
      "eyebrow": "Restoranlar için QR menüler",
      "title": "Restoranınız tek bir QR kodda",
      "text": "Misafirinizin masasındaki 3D yemekten ekranınızdaki tüm salona kadar.",
      "scroll": "Kaydırın ↓"
    },
    "chapters": [
      {
        "eyebrow": "01 · Salon",
        "title": "Her kare bir masa",
        "text": "Kodunuz kapıda ve her masada. Misafirler okutur, restoran telefonlarında açılır."
      },
      {
        "eyebrow": "02 · Menü",
        "title": "Menünüzü koruyun",
        "text": "Basılı ya da dijital: her yemeğin yanında kendi QR kodu olur."
      },
      {
        "eyebrow": "03 · Her yemeğe bir kod",
        "title": "Kamerayı doğrultun",
        "text": "Misafirler yemeğin yanındaki kodu telefon kamerasıyla okutur. Uygulama yüklemeye gerek yok."
      },
      {
        "eyebrow": "04 · 3D yemek",
        "title": "Masanızda görün",
        "text": "Yemek tam orada, gerçek boyutta ve 3D olarak belirir, daha kimse sipariş vermeden."
      },
      {
        "eyebrow": "05 · Sipariş",
        "title": "Masadan sipariş",
        "text": "Sipariş, masa numarasıyla doğrudan mutfağa gider."
      },
      {
        "eyebrow": "06 · Mutfak",
        "title": "Mutfak her şeyi bilir",
        "text": "Kim ne sipariş etti ve her masa ne zamandır bekliyor."
      },
      {
        "eyebrow": "07 · Hesap",
        "title": "Beklemeden hesap",
        "text": "Her hesap kendi masasına bağlıdır, böylece ödeme bir dakika sürer."
      },
      {
        "eyebrow": "08 · Salonunuz canlı",
        "title": "Tüm salon tek ekranda",
        "text": "Hangi masalar boş, yemek yiyor, bekliyor ya da ödüyor, bir bakışta."
      },
      {
        "eyebrow": "09 · Analizler",
        "title": "Neyin sattığını bilin",
        "text": "Her masanın siparişleri toplanır: satışlar, en çok tercih edilen yemekler, yoğun saatler ve 3D görüntülemeler, aynı sistemden."
      }
    ],
    "tryIt": "Kendiniz deneyin",
    "legend": [
      "Boş",
      "Yemek yiyor",
      "Uzun bekliyor",
      "Ödüyor"
    ],
    "frame": {
      "dashboard": "Panel",
      "tabs": [
        "Salon",
        "Siparişler",
        "Menü",
        "Analizler"
      ],
      "floorKpis": [
        [
          "Dolu",
          "14 / 22"
        ],
        [
          "Bekleme > 10 dk",
          "3 masa"
        ],
        [
          "Açık hesaplar",
          "6"
        ]
      ],
      "analyticsKpis": [
        "Bugünkü satış",
        "Bugünkü siparişler",
        "En yoğun saat"
      ],
      "sample": "Örnek veriler",
      "byStatus": "duruma göre masalar",
      "byHour": "masaya, sonra saate göre siparişler"
    },
    "book": {
      "menu": "Menü",
      "place": "Trattoria",
      "scan3d": "3D görmek için okutun",
      "items": [
        "Burrata",
        "Margherita",
        "Sezar salata",
        "Tagliatelle",
        "Tiramisu"
      ],
      "pick": "Şefin önerisi",
      "dish": "Cheeseburger",
      "desc": "Brioş, olgun çedar, turşu",
      "scan": [
        "Okutun, yemeği",
        "masanızda görün"
      ]
    }
  },
};

export default tr;
