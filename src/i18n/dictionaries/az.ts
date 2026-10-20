import type { Dictionary } from "../dictionaries";

const az: Dictionary = {
  meta: {
    title: "Restoranlar üçün 3D rəqəmsal menyular",
    description:
      "Qonaqlar QR kodu skan edir və yeməklərinizi masalarında real ölçüdə 3D görür. Tətbiq lazım deyil. Üstəlik sifarişlər, masalar, hesablar, işçilər və analitika üçün vahid sistem.",
  },
  nav: {
    howItWorks: "Necə işləyir",
    owners: "Sahibkarlar üçün",
    plans: "Paketlər",
    faq: "Suallar",
    bookDemo: "Demo sifariş edin",
    menu: "Menyu",
    language: "Dil",
  },
  hero: {
    eyebrow: "3D menyular · Tətbiq lazım deyil",
    title: "Qonaqlar yeməyi sifariş etməzdən əvvəl görsün",
    subtitle: "Masadakı QR kod menyunuzu açır: hər yemək 3D, real ölçüdə, düz qonağın masasında.",
    ctaPrimary: "Demo sifariş edin",
    ctaSecondary: "Necə işlədiyinə baxın",
    scrollHint: "Burgeri yığmaq üçün sürüşdürün",
  },
  story: {
    stages: ["Çörək", "Kotlet", "Pendir", "Turşu", "Soğan", "Sous", "Üst çörək"],
    captions: [
      {
        title: "Qonaqlar gözləri ilə sifariş verir.",
        text: "Adi foto yeməyin əslində nə qədər böyük, təzə və ləzzətli olduğunu göstərə bilmir.",
      },
      {
        title: "Yeməklərinizi 3D-yə çeviririk.",
        text: "Bir yeməyin 20–30 fotosunu bizə göndərin. Komandamız onun real görünüşlü 3D modelini hazırlayır.",
      },
      {
        title: "Real ölçü, real detallar.",
        text: "Real nisbətlər və real teksturalar: masaya gələn yemək qonağın gözlədiyi kimi olur.",
      },
      {
        title: "Qonaqlar fırladır, yaxınlaşdırır və qərar verir.",
        text: "Birbaşa brauzerdəki menyunun içində. Heç nə yükləmək lazım deyil.",
      },
      {
        title: "Sonra onu masalarına qoyurlar.",
        text: "Kameranı masaya tutun və yemək hələ sifariş edilmədən real ölçüdə görünür.",
      },
    ],
    arDish: "Çizburger",
    arSize: "Ø 11 sm",
    arBadge: "Real ölçüdə AR",
    reducedTitle: "Fotodan 3D yeməyə",
  },
  menu: { margherita: "Margherita", diavola: "Diavola", quattro: "Quattro Formaggi", funghi: "Funghi", lemonade: "Limonad", water: "Qazlı su", espresso: "Espresso", tiramisu: "Tiramisu" },
  journey: {
    eyebrow: "Qonaq təcrübəsi",
    title: "Skandan sifarişə bir dəqiqədən az",
    subtitle: "Qonaqlar artıq əllərində olan kameradan istifadə edir. Heç nə quraşdırmaq və ya qeydiyyatdan keçmək lazım deyil.",
    steps: [
      { title: "QR kodu skan edin", text: "Masada, çap olunmuş menyuda və ya stikerdə. Qalanını telefonun kamerası edir." },
      { title: "Menyuya baxın", text: "Bütün menyunuz fotolar, qiymətlər və 3D yeməklərlə brauzerdə açılır." },
      { title: "Yeməyi 3D görün", text: "Qonaqlar yeməyi fırladır və hər detalı görmək üçün yaxınlaşdırır." },
      { title: "Masaya qoyun", text: "Artırılmış reallıq yeməyi real ölçüdə, düz onların qarşısında göstərir." },
      { title: "Sifariş edin və ödəyin", text: "Telefondan və ya ofisiant vasitəsilə. Restoranınızın necə işləyəcəyinə siz qərar verirsiniz." },
    ],
    demo: {
      label: "Özünüz yoxlayın",
      title: "Skan edin. Burger masanıza gəlsin.",
      text: "Telefonunuzun kamerasını koda tutun. Bu səhifənin yuxarısındakı burger birbaşa brauzerdə 3D açılır.",
      scan: "Telefon kamerası ilə skan edin",
      open: "3D demonu açın",
      noApp: "Tətbiq lazım deyil",
    },
  },
  demo: {
    metaTitle: "3D demo",
    eyebrow: "Canlı demo",
    title: "Qonaqlarınız bunu görür",
    text: "Yeməyi çevirmək üçün sürüşdürün, yaxınlaşdırmaq üçün iki barmaqla sıxın. Dəstəkləyən telefonlarda onu masanıza real ölçüdə qoyun.",
    hint: "Telefonda: onu yaxşı işıqda masaya tutun və yemək görünənə qədər yavaş-yavaş hərəkət etdirin.",
    ar: "Masanızda baxın",
    note: "Nümunə yemək. Sizin yeməkləriniz öz fotolarınızdan modelləşdirilir.",
    back: "Sayta qayıt",
    dishes: {
      burger: "Çizburger, Ø 11 sm",
      pizza: "Mal əti qiyməli acılı pizza boşqabda, Ø 26 sm",
    },
  },
  owners: {
    eyebrow: "Restoran sahibləri üçün",
    title: "Bütün restoranınız bir yerdə",
    subtitle: "Menyunu təqdim edən eyni sistem sizə hər masanı, sifarişi, hesabı və işçini canlı göstərir.",
    sampleData: "Nümunə məlumat",
    live: "Canlı",
    kpis: { revenue: "Bugünkü gəlir", orders: "Bugünkü sifarişlər", avgWait: "Orta gözləmə (dəq)", views3d: "3D yemək baxışları" },
    floor: {
      title: "Zal planı",
      table: "Masa",
      seats: "nəfərlik",
      statuses: { free: "Boş", ordered: "Sifariş verilib", waiting: "Çox gözləyir", bill: "Hesab istənilib" },
    },
    panel: {
      selectHint: "Sifarişini görmək üçün masa seçin",
      order: "Sifariş",
      waiting: "Gözləmə müddəti",
      waiter: "Ofisiant",
      bill: "Hesab",
      empty: "Hələ sifariş yoxdur",
    },
    charts: {
      topDishes: "3D-də ən çox baxılan yeməklər",
      topDishesSub: "Bu həftəki baxışlar",
      peakHours: "Ən sıx saatlar",
      peakHoursSub: "Bu gün saatlıq sifarişlər",
      peak: "Pik",
      orders: "sifariş",
    },
    features: [
      { title: "Masalar üzrə sifarişlər", text: "Hər masanın nə vaxt nə sifariş etdiyini dərhal görün." },
      { title: "Hesablar və ödənişlər", text: "Qonaqlar telefondan və ya ofisiant vasitəsilə ödəyir. Bütün hesablar bir siyahıda." },
      { title: "Gözləmə vaxtı", text: "Qonaqlar soruşmazdan əvvəl hansı masaların çox gözlədiyini bilin." },
      { title: "İşçilər", text: "Ofisiantları masalara təyin edin və kimin nə ilə məşğul olduğunu görün." },
      { title: "Menyu idarəsi", text: "Heç nəyi yenidən çap etmədən yeməkləri, qiymətləri və mövcudluğu dəyişin." },
      { title: "Analitika", text: "Populyar yeməklər, sıx saatlar və gəlir: təxminlə yox, rəqəmlərlə planlayın." },
    ],
  },
  how: {
    eyebrow: "Necə işləyir",
    title: "Fotoları siz çəkin. Qalanını biz edək.",
    subtitle: "3D-yə keçmək üçün studiya və ya yeni avadanlıq lazım deyil. Sadəcə telefon.",
    steps: [
      { title: "20–30 foto çəkin", text: "Hər yeməyi telefonunuzla hər tərəfdən çəkin və bizə göndərin." },
      { title: "3D modelləri biz hazırlayırıq", text: "Komandamız fotolarınızı real görünüşlü 3D yeməklərə çevirir." },
      { title: "QR kodlarınızı alın", text: "Onları çap olunmuş menyunuza əlavə edin və ya tam rəqəmsal menyuya keçin." },
      { title: "Qonaqlar masada görür", text: "Skan edir, baxır və sifariş verirlər. Tətbiq lazım deyil." },
    ],
    figure: {
      fig: "Şəkil 1",
      title: "Fotodan masaya",
      hint: "Stansiyanın üzərinə gəlin və ya ← → düymələrindən istifadə edin",
      readout: { photos: "foto", model: "3D model", printing: "QR kod çap olunur", ready: "QR kod hazırdır", table: "masada" },
      slider: "Necə işləyir: ox düymələri ilə dörd stansiya arasında keçin",
      label:
        "Dəzgah üzərində dörd stansiyalı kiçik studiya. Kamera fırlanan altlıqdakı burgerin hər 15 dərəcədən bir olmaqla 24 fotosunu çəkir. Monitor bu fotolardan burgerin 3D modelini qurur. Printer QR kodlu kart çap edir. Dayaqdakı telefon burgeri masanın üstündə göstərir.",
      keys: ["İndi işləyən stansiya", "Yemək: fotolardan qonağın masasına qədər bir burger"],
    },
  },
  plans: {
    eyebrow: "Paketlər",
    title: "Kiçikdən başlayın və ya tam rəqəmsala keçin",
    subtitle: "Nə qədər irəli getmək istədiyinizi seçin. İstənilən vaxt daha çoxunu əlavə edə bilərsiniz.",
    cta: "Təklif alın",
    highlight: "Ən geniş",
    items: [
      {
        name: "3D Yeməklər",
        text: "Çap olunmuş menyunuzu saxlayın və hər yemək üçün QR kod əlavə edin.",
        features: [
          "Fotolarınızdan hazırlanan 3D modellər",
          "Hər yemək üçün QR kod",
          "Qonağın masasında real ölçüdə görünüş",
          "Qonaqların telefonlarında işləyir, tətbiq lazım deyil",
        ],
      },
      {
        name: "Rəqəmsal Menyu",
        text: "Bütün menyunuz qonaqların telefonlarında, yeməklər 3D.",
        features: [
          "3D Yeməklər paketindəki hər şey",
          "QR kodla tam rəqəmsal menyu",
          "Telefondan sifariş",
          "Yeməkləri və qiymətləri istənilən vaxt yeniləyin",
        ],
      },
      {
        name: "Tam Sistem",
        text: "Bütün restoranı bir yerdən idarə edin.",
        features: [
          "Rəqəmsal Menyu paketindəki hər şey",
          "Masalar üzrə sifarişlər və hesablar",
          "Canlı gözləmə vaxtı",
          "İşçilərin idarə edilməsi",
          "Telefonla və ya ofisiant vasitəsilə ödəniş",
          "Analitika paneli",
        ],
      },
    ],
    note: "Hər restoran fərqlidir, ona görə də sizin üçün ayrıca paket və qiymət hazırlayırıq.",
  },
  faq: {
    eyebrow: "Suallar",
    title: "Sahibkarların bizə verdiyi suallar",
    items: [
      {
        q: "Qonaqlar tətbiq yükləməlidirmi?",
        a: "Xeyr. Qonaqlar QR kodu telefon kamerası ilə skan edir və hər şey brauzerdə açılır.",
      },
      {
        q: "Hansı telefonlarda işləyir?",
        a: "3D görünüş müasir smartfonlarda brauzerdə işləyir. Yeməyi masaya qoymaq üçün telefonun daxili artırılmış reallıq funksiyasından istifadə olunur; son iPhone və Android telefonlarının əksəriyyəti bunu dəstəkləyir.",
      },
      {
        q: "3D modellər necə hazırlanır?",
        a: "Hər yeməyin müxtəlif bucaqlardan 20–30 fotosunu çəkib bizə göndərirsiniz. Komandamız 3D modeli və QR kodu hazırlayır.",
      },
      {
        q: "Çap olunmuş menyularımızı saxlaya bilərikmi?",
        a: "Bəli. Hər yeməyin yanına QR kod əlavə edin, qonaqlar onu 3D görə bilsin. Və ya hazır olduğunuz zaman tam rəqəmsal menyuya keçin.",
      },
      {
        q: "Qonaqlar telefondan ödəyə bilərmi?",
        a: "Bəli, tam rəqəmsal xidmət istəyirsinizsə. Sifarişləri və ödənişləri ofisiantların qəbul etməsini də saxlaya və ya hər ikisini birləşdirə bilərsiniz.",
      },
      {
        q: "Bizə tam idarəetmə sistemi lazımdırmı?",
        a: "Xeyr. 3D yeməklər və ya rəqəmsal menyu ilə başlayın; sifarişləri, masaları, işçiləri və analitikanı sizə uyğun olanda əlavə edin.",
      },
    ],
  },
  cta: {
    title: "Yeməklərinizi 3D görmək istəyirsiniz?",
    text: "Restoranınız haqqında danışın, menyunuzun necə görünəcəyini sizə göstərək.",
    button: "Demo sifariş edin",
    emailSubject: "Demo sorğusu",
  },
  footer: {
    tagline: "3D rəqəmsal menyular və restoran idarəetməsi.",
    rights: "Bütün hüquqlar qorunur.",
  },
  floor: {
    "hero": {
      "eyebrow": "Restoranlar üçün QR menyular",
      "title": "Restoranınız bir QR kodda",
      "text": "Qonağın masasındakı 3D yeməkdən ekranınızdakı bütün zala qədər.",
      "scroll": "Sürüşdürün ↓"
    },
    "chapters": [
      {
        "eyebrow": "01 · Zal",
        "title": "Hər xana bir masadır",
        "text": "Kodunuz girişdə və hər masada. Qonaqlar onu skan edir və restoran telefonlarında açılır."
      },
      {
        "eyebrow": "02 · Menyu",
        "title": "Menyunuzu saxlayın",
        "text": "Çap olunmuş və ya rəqəmsal: hər yeməyin yanında öz QR kodu olur."
      },
      {
        "eyebrow": "03 · Hər yeməyə bir kod",
        "title": "Kameranı tutun",
        "text": "Qonaqlar yeməyin yanındakı kodu telefon kamerası ilə skan edir. Tətbiq quraşdırmaq lazım deyil."
      },
      {
        "eyebrow": "04 · Yemək 3D-də",
        "title": "Masanızda görün",
        "text": "Yemək elə oradaca, real ölçüdə və 3D görünür, hələ heç kim sifariş etmədən."
      },
      {
        "eyebrow": "05 · Sifariş",
        "title": "Masadan sifariş",
        "text": "Sifariş masa nömrəsi ilə birbaşa mətbəxə gedir."
      },
      {
        "eyebrow": "06 · Mətbəx",
        "title": "Mətbəx hər şeyi bilir",
        "text": "Kim nə sifariş edib və hər masa nə qədərdir gözləyir."
      },
      {
        "eyebrow": "07 · Hesab",
        "title": "Gözləmədən hesab",
        "text": "Hər hesab öz masasına bağlıdır, ona görə ödəniş bir dəqiqə çəkir."
      },
      {
        "eyebrow": "08 · Zalınız canlı",
        "title": "Bütün zal bir ekranda",
        "text": "Hansı masalar boşdur, yemək yeyir, gözləyir və ya ödəyir, bir baxışda."
      },
      {
        "eyebrow": "09 · Analitika",
        "title": "Nəyin satıldığını bilin",
        "text": "Hər masanın sifarişləri toplanır: satışlar, ən populyar yeməklər, sıx saatlar və 3D baxışlar, eyni sistemdən."
      }
    ],
    "tryIt": "Özünüz yoxlayın",
    "legend": [
      "Boş",
      "Yemək yeyir",
      "Çox gözləyir",
      "Ödəyir"
    ],
    "frame": {
      "dashboard": "İdarə paneli",
      "tabs": [
        "Zal",
        "Sifarişlər",
        "Menyu",
        "Analitika"
      ],
      "floorKpis": [
        [
          "Dolu",
          "14 / 22"
        ],
        [
          "Gözləmə > 10 dəq",
          "3 masa"
        ],
        [
          "Açıq hesablar",
          "6"
        ]
      ],
      "analyticsKpis": [
        "Bugünkü satış",
        "Bugünkü sifarişlər",
        "Ən sıx saat"
      ],
      "sample": "Nümunə məlumat",
      "byStatus": "statusa görə masalar",
      "byHour": "masalar, sonra saatlar üzrə sifarişlər"
    },
    "book": {
      "menu": "Menyu",
      "place": "Trattoria",
      "scan3d": "3D görmək üçün skan edin",
      "items": [
        "Burrata",
        "Margherita",
        "Sezar salatı",
        "Talyatelle",
        "Tiramisu"
      ],
      "pick": "Aşpazın seçimi",
      "dish": "Çizburger",
      "desc": "Brioş, yetişmiş çedder, turşu",
      "scan": [
        "Skan edin və yeməyi",
        "masanızda görün"
      ]
    }
  },
};

export default az;
