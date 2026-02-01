// App State
let staffList = [];
let attendanceList = [];
let selectedStatus = null;
let capturedPhotoData = null;
let currentLocation = null;
let map = null;
let cameraStream = null;
let deleteTarget = null;
let deferredPrompt = null;
let isSubmitting = false;
let isAddingStaff = false;
let isLoading = false;

// Quote of the Day Data - 100+ Quotes!
const quotes = [
  { text: "Pendidikan adalah senjata paling ampuh yang bisa kamu gunakan untuk mengubah dunia.", author: "Nelson Mandela" },
  { text: "Guru yang baik seperti lilin, ia membakar dirinya sendiri untuk menerangi jalan bagi orang lain.", author: "Mustafa Kemal Atatürk" },
  { text: "Kesuksesan adalah jumlah dari usaha-usaha kecil yang diulang hari demi hari.", author: "Robert Collier" },
  { text: "Pendidikan bukan persiapan untuk hidup, pendidikan adalah kehidupan itu sendiri.", author: "John Dewey" },
  { text: "Tidak ada rahasia untuk sukses. Sukses itu hasil dari persiapan, kerja keras, dan belajar dari kegagalan.", author: "Colin Powell" },
  { text: "Masa depan milik mereka yang percaya pada keindahan mimpi-mimpi mereka.", author: "Eleanor Roosevelt" },
  { text: "Satu-satunya cara untuk melakukan pekerjaan besar adalah mencintai apa yang kamu kerjakan.", author: "Steve Jobs" },
  { text: "Kualitas bukan sebuah tindakan, tetapi sebuah kebiasaan.", author: "Aristoteles" },
  { text: "Berani bermimpi, berani berusaha, maka kamu akan sampai pada tujuan.", author: "Bob Sadino" },
  { text: "Pendidikan adalah tiket emas menuju masa depan. Hari esok milik orang-orang yang mempersiapkan dirinya sejak hari ini.", author: "Malcolm X" },
  { text: "Guru sejati mengajarkan muridnya cara berpikir, bukan apa yang harus dipikirkan.", author: "Sidney J. Harris" },
  { text: "Kedisiplinan adalah jembatan antara tujuan dan pencapaian.", author: "Jim Rohn" },
  { text: "Kehadiran adalah bentuk apresiasi tertinggi terhadap tanggung jawab.", author: "Anonim" },
  { text: "Mulailah dengan melakukan apa yang diperlukan, lalu lakukan apa yang mungkin, dan tiba-tiba kamu akan melakukan yang mustahil.", author: "Francis of Assisi" },
  { text: "Kesempatan tidak datang dua kali. Manfaatkan setiap momen untuk menjadi lebih baik.", author: "Anonim" },
  { text: "Investasi dalam pengetahuan memberikan keuntungan terbaik.", author: "Benjamin Franklin" },
  { text: "Pembelajaran adalah harta yang akan mengikuti pemiliknya ke mana pun ia pergi.", author: "Pepatah Tiongkok" },
  { text: "Tujuan pendidikan adalah untuk mengganti pikiran yang kosong dengan pikiran yang terbuka.", author: "Malcolm Forbes" },
  { text: "Orang yang berhenti belajar akan menjadi pemilik masa lalu. Orang yang masih terus belajar, akan menjadi pemilik masa depan.", author: "Mario Teguh" },
  { text: "Kegagalan adalah kesuksesan yang tertunda.", author: "Anonim" },
  { text: "Belajar tanpa berpikir itu tidaklah berguna, tapi berpikir tanpa belajar itu sangatlah berbahaya.", author: "Soekarno" },
  { text: "Jangan pernah berhenti belajar karena hidup tak pernah berhenti mengajarkan.", author: "Anonim" },
  { text: "Guru membuka pintu, tetapi Anda harus memasukinya sendiri.", author: "Pepatah Tiongkok" },
  { text: "Seorang guru berpengaruh pada keabadian; ia tidak pernah tahu di mana pengaruhnya berhenti.", author: "Henry Adams" },
  { text: "Yang terpenting dalam hidup bukanlah kemenangan namun bagaimana bertanding dengan baik.", author: "Baron de Coubertin" },
  { text: "Kesuksesan biasanya datang kepada mereka yang terlalu sibuk mencarinya.", author: "Henry David Thoreau" },
  { text: "Jangan takut gagal. Takutlah untuk tidak mencoba.", author: "Anonim" },
  { text: "Perubahan adalah hasil akhir dari semua pembelajaran sejati.", author: "Leo Buscaglia" },
  { text: "Seseorang yang bertanya bodoh selama 5 menit, tetapi seseorang yang tidak pernah bertanya tetap bodoh selamanya.", author: "Pepatah Tiongkok" },
  { text: "Bukan yang terkuat yang bertahan, bukan juga yang tercerdas, tetapi yang paling mudah beradaptasi dengan perubahan.", author: "Charles Darwin" },
  { text: "Motivasi adalah apa yang membuatmu memulai. Kebiasaan adalah apa yang membuatmu tetap berjalan.", author: "Jim Ryun" },
  { text: "Orang sukses adalah orang yang dapat membangun fondasi yang kuat dengan batu-batu yang dilemparkan kepadanya.", author: "David Brinkley" },
  { text: "Cara terbaik untuk memprediksi masa depan adalah menciptakannya.", author: "Peter Drucker" },
  { text: "Kesempurnaan bukanlah tujuan yang dapat dicapai, tetapi perjalanan yang harus dilalui.", author: "Anonim" },
  { text: "Jadilah perubahan yang ingin kamu lihat di dunia.", author: "Mahatma Gandhi" },
  { text: "Waktu adalah guru terbaik, sayangnya ia membunuh semua muridnya.", author: "Hector Berlioz" },
  { text: "Hiduplah seakan kamu akan mati besok. Belajarlah seakan kamu akan hidup selamanya.", author: "Mahatma Gandhi" },
  { text: "Tidak ada yang mustahil bagi mereka yang mau mencoba.", author: "Alexander the Great" },
  { text: "Bakat memenangkan permainan, tapi kerja tim dan kecerdasan memenangkan kejuaraan.", author: "Michael Jordan" },
  { text: "Jangan menunggu. Tidak akan pernah ada waktu yang tepat.", author: "Napoleon Hill" },
  { text: "Kegagalan hanyalah kesempatan untuk memulai lagi dengan lebih cerdas.", author: "Henry Ford" },
  { text: "Sukses bukan kunci kebahagiaan. Kebahagiaan adalah kunci sukses.", author: "Albert Schweitzer" },
  { text: "Yang penting bukanlah apa yang terjadi padamu, tetapi bagaimana kamu bereaksi terhadapnya.", author: "Epictetus" },
  { text: "Keberanian bukan berarti tidak takut, tapi mampu menaklukkan rasa takut.", author: "Nelson Mandela" },
  { text: "Jangan tanya apa yang bisa negara berikan padamu, tapi tanyakan apa yang bisa kamu berikan untuk negara.", author: "John F. Kennedy" },
  { text: "Mimpi tanpa tindakan hanyalah angan-angan. Tindakan tanpa mimpi adalah membuang waktu. Mimpi dengan tindakan bisa mengubah dunia.", author: "Joel Barker" },
  { text: "Kesabaran, ketekunan, dan keringat adalah kombinasi yang tak terkalahkan untuk sukses.", author: "Napoleon Hill" },
  { text: "Pendidikan adalah paspor menuju masa depan, karena hari esok adalah milik mereka yang mempersiapkannya hari ini.", author: "Malcolm X" },
  { text: "Apa yang kita pikirkan, kita menjadi apa yang kita pikirkan.", author: "Buddha" },
  { text: "Tidak ada elevator menuju sukses. Kamu harus naik tangga.", author: "Zig Ziglar" },
  { text: "Pendidikan adalah kunci untuk membuka pintu emas kebebasan.", author: "George Washington Carver" },
  { text: "Guru biasa memberitahu. Guru baik menjelaskan. Guru ulung mendemonstrasikan. Guru hebat menginspirasi.", author: "William Arthur Ward" },
  { text: "Pengajaran yang baik adalah seperempat persiapan dan tiga perempat teater.", author: "Gail Godwin" },
  { text: "Satu buku, satu pena, satu anak, dan satu guru dapat mengubah dunia.", author: "Malala Yousafzai" },
  { text: "Jika kamu tidak dapat mengajar orang lain apa yang kamu ketahui, maka kamu tidak benar-benar mengetahuinya.", author: "Pepatah" },
  { text: "Sukses adalah kemampuan untuk melangkah dari satu kegagalan ke kegagalan lain tanpa kehilangan antusiasme.", author: "Winston Churchill" },
  { text: "Orang yang paling berpengaruh dalam hidupmu adalah dirimu sendiri. Percakapan yang paling penting adalah percakapan dengan dirimu sendiri.", author: "David J. Schwartz" },
  { text: "Kesempatan besar untuk membantu orang lain jarang datang, tapi kesempatan kecil mengelilingi kita setiap hari.", author: "Sally Koch" },
  { text: "Hal tersulit adalah keputusan untuk bertindak, sisanya hanya ketekunan.", author: "Amelia Earhart" },
  { text: "Kepercayaan adalah hal yang paling sulit untuk diperoleh dan paling mudah untuk hilang.", author: "Anonim" },
  { text: "Keunggulan bukanlah keterampilan, tetapi sikap.", author: "Ralph Marston" },
  { text: "Kemarin adalah sejarah. Besok adalah misteri. Hari ini adalah anugerah. Itulah mengapa disebut present (hadiah).", author: "Eleanor Roosevelt" },
  { text: "Hidup adalah 10% apa yang terjadi padamu dan 90% bagaimana kamu menanggapinya.", author: "Charles R. Swindoll" },
  { text: "Jangan pernah meremehkan perbedaan yang bisa kamu buat.", author: "Anonim" },
  { text: "Seorang pemimpin adalah seseorang yang mengetahui jalan, berjalan di jalan itu, dan menunjukkan jalan itu.", author: "John C. Maxwell" },
  { text: "Ilmu pengetahuan tanpa agama adalah lumpuh, agama tanpa ilmu pengetahuan adalah buta.", author: "Albert Einstein" },
  { text: "Karakter tidak dibangun dalam kemudahan dan ketenangan. Hanya melalui pengalaman cobaan dan penderitaan jiwa dapat diperkuat.", author: "Helen Keller" },
  { text: "Jangan biarkan apa yang tidak bisa kamu lakukan menghalangi apa yang bisa kamu lakukan.", author: "John Wooden" },
  { text: "Kehebatan tidak pernah terjadi secara kebetulan, selalu merupakan hasil dari niat yang tinggi, usaha yang tulus, dan pelaksanaan yang terampil.", author: "Aristoteles" },
  { text: "Kreativitas adalah kecerdasan yang bersenang-senang.", author: "Albert Einstein" },
  { text: "Perbedaan antara menang dan kalah seringkali adalah tidak menyerah.", author: "Walt Disney" },
  { text: "Kamu tidak akan pernah terlalu tua untuk menetapkan tujuan lain atau untuk bermimpi impian baru.", author: "C.S. Lewis" },
  { text: "Kesuksesan sejati diukur dari seberapa banyak kali kamu bisa bangkit kembali.", author: "Stephen Richards" },
  { text: "Jangan menghitung hari, buatlah hari-hari itu berarti.", author: "Muhammad Ali" },
  { text: "Pendidikan adalah pembelajaran apa yang bahkan tidak kamu tahu bahwa kamu tidak tahu.", author: "Daniel J. Boorstin" },
  { text: "Guru yang hebat tidak mengajar dari buku, tetapi dari hati.", author: "Anonim" },
  { text: "Kepemimpinan dan pembelajaran sangat diperlukan satu sama lain.", author: "John F. Kennedy" },
  { text: "Masa depan tergantung pada apa yang kamu lakukan hari ini.", author: "Mahatma Gandhi" },
  { text: "Kejujuran adalah bab pertama dalam buku kebijaksanaan.", author: "Thomas Jefferson" },
  { text: "Dalam pembelajaran, kamu akan mengajar. Dalam mengajar, kamu akan belajar.", author: "Phil Collins" },
  { text: "Belajarlah dari kemarin, hiduplah untuk hari ini, berharaplah untuk besok.", author: "Albert Einstein" },
  { text: "Tidak ada yang dapat mengganggu orang yang telah menemukan kedamaian dalam dirinya sendiri.", author: "Buddha" },
  { text: "Kemenangan terbesar adalah kemenangan atas diri sendiri.", author: "Plato" },
  { text: "Perjalanan seribu mil dimulai dengan satu langkah.", author: "Lao Tzu" },
  { text: "Kesuksesan adalah mendapatkan apa yang kamu inginkan. Kebahagiaan adalah menginginkan apa yang kamu dapatkan.", author: "Dale Carnegie" },
  { text: "Orang bijak belajar dari kesalahan orang lain. Orang bodoh belajar dari kesalahannya sendiri.", author: "Pepatah Latin" },
  { text: "Pekerjaan yang baik dan kerja keras tidak ada gantinya.", author: "Sidney Sheldon" },
  { text: "Sikap positif mengubah mimpi menjadi kenyataan.", author: "Anonim" },
  { text: "Kegigihan adalah rahasia dari semua kemenangan.", author: "Victor Hugo" },
  { text: "Jangan pernah kehilangan kesempatan untuk membuat seseorang tersenyum.", author: "Roy T. Bennett" },
  { text: "Keberhasilan bukanlah milik orang pintar, tetapi milik orang yang pantang menyerah.", author: "B.J. Habibie" },
  { text: "Ilmu itu lebih baik daripada harta. Ilmu menjaga engkau dan engkau menjaga harta.", author: "Ali bin Abi Thalib" },
  { text: "Orang hebat bukan yang tidak pernah jatuh, tetapi orang yang selalu bangkit setiap kali jatuh.", author: "Confucius" },
  { text: "Kesempatan itu seperti matahari terbit. Jika kamu menunggu terlalu lama, kamu akan melewatkannya.", author: "William Arthur Ward" },
  { text: "Jangan takut tumbuh lambat, takutlah hanya berdiri diam.", author: "Pepatah Tiongkok" },
  { text: "Kebaikan adalah bahasa yang dapat didengar oleh orang tuli dan dilihat oleh orang buta.", author: "Mark Twain" },
  { text: "Bukan masalahnya yang penting, tetapi bagaimana kita menyikapi masalah itu.", author: "Epictetus" },
  { text: "Kesuksesan adalah hasil dari persiapan, kerja keras, dan belajar dari kegagalan.", author: "Colin Powell" },
  { text: "Pendidikan adalah senjata paling kuat untuk mengubah dunia menjadi lebih baik.", author: "Nelson Mandela" },
  { text: "Hidup ini seperti mengendarai sepeda. Untuk menjaga keseimbangan, kamu harus terus bergerak.", author: "Albert Einstein" },
  { text: "Berpikirlah besar dan jangan dengarkan orang-orang yang mengatakan itu tidak mungkin.", author: "Tim Ferriss" },
  { text: "Setiap ahli pernah menjadi pemula. Jangan takut untuk memulai.", author: "Robin Sharma" },
  { text: "Kesabaran adalah kunci kesuksesan. Orang yang sabar akan mencapai tujuannya.", author: "Anonim" },
  { text: "Jangan menunda sampai besok apa yang bisa kamu lakukan hari ini.", author: "Benjamin Franklin" },
  { text: "Keberhasilan adalah perjalanan, bukan tujuan.", author: "Ben Sweetland" },
  { text: "Percayalah pada dirimu sendiri dan semua yang kamu miliki.", author: "Christian D. Larson" },
  { text: "Waktu tidak menunggu siapa pun. Manfaatkan setiap detiknya dengan bijak.", author: "Anonim" },
];

// Get random quote
function getTodayQuote() {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

// Display quote
function displayQuote() {
  const quote = getTodayQuote();
  document.getElementById("quote-text").textContent = '"' + quote.text + '"';
  document.getElementById("quote-author").textContent = "— " + quote.author;
}

// Parallax Scrolling Effect
function setupParallax() {
  const app = document.getElementById("app");
  const parallaxBg = document.querySelector(".parallax-bg");

  if (!parallaxBg) return;

  app.addEventListener("scroll", () => {
    const scrolled = app.scrollTop;
    const parallaxSpeed = 0.5;

    if (parallaxBg) {
      parallaxBg.style.transform = "translateY(" + scrolled * parallaxSpeed + "px)";
    }
  });
}

// Initialize Particles.js
function initParticles() {
  if (window.particlesJS) {
    particlesJS("particles-js", {
      particles: {
        number: {
          value: 80,
          density: {
            enable: true,
            value_area: 800,
          },
        },
        color: {
          value: "#f97316",
        },
        shape: {
          type: "circle",
          stroke: {
            width: 0,
            color: "#000000",
          },
        },
        opacity: {
          value: 0.3,
          random: true,
          anim: {
            enable: true,
            speed: 1,
            opacity_min: 0.1,
            sync: false,
          },
        },
        size: {
          value: 3,
          random: true,
          anim: {
            enable: true,
            speed: 2,
            size_min: 0.1,
            sync: false,
          },
        },
        line_linked: {
          enable: true,
          distance: 150,
          color: "#cbd5e1",
          opacity: 0.2,
          width: 1,
        },
        move: {
          enable: true,
          speed: 1,
          direction: "none",
          random: true,
          straight: false,
          out_mode: "out",
          bounce: false,
          attract: {
            enable: false,
            rotateX: 600,
            rotateY: 1200,
          },
        },
      },
      interactivity: {
        detect_on: "canvas",
        events: {
          onhover: {
            enable: true,
            mode: "grab",
          },
          onclick: {
            enable: true,
            mode: "push",
          },
          resize: true,
        },
        modes: {
          grab: {
            distance: 140,
            line_linked: {
              opacity: 0.5,
            },
          },
          push: {
            particles_nb: 4,
          },
        },
      },
      retina_detect: true,
    });
  }
}

// Pull to Refresh State
let startY = 0;
let currentY = 0;
let isPulling = false;
let isRefreshing = false;

// Pull to Refresh Setup
function setupPullToRefresh() {
  const app = document.getElementById("app");
  const indicator = document.getElementById("pull-to-refresh-indicator");
  const pullIcon = document.getElementById("pull-icon");
  const pullSpinner = document.getElementById("pull-spinner");

  app.addEventListener(
    "touchstart",
    (e) => {
      if (app.scrollTop === 0 && !isRefreshing) {
        startY = e.touches[0].pageY;
        isPulling = true;
      }
    },
    { passive: true },
  );

  app.addEventListener(
    "touchmove",
    (e) => {
      if (!isPulling || isRefreshing) return;

      currentY = e.touches[0].pageY;
      const pullDistance = currentY - startY;

      if (pullDistance > 0 && pullDistance < 100) {
        indicator.style.top = pullDistance - 80 + "px";
        const rotation = (pullDistance / 100) * 180;
        pullIcon.style.transform = "rotate(" + rotation + "deg)";
      } else if (pullDistance >= 100) {
        indicator.classList.add("pulling");
        pullIcon.classList.add("rotate");
      }
    },
    { passive: true },
  );

  app.addEventListener("touchend", async (e) => {
    if (!isPulling || isRefreshing) return;

    const pullDistance = currentY - startY;

    if (pullDistance >= 100) {
      isRefreshing = true;
      indicator.classList.add("refreshing");
      pullIcon.classList.add("hidden");
      pullSpinner.classList.remove("hidden");

      // Refresh data
      await loadAllData();

      // Show success message
      showToast("Data berhasil diperbarui!", "success");

      // Reset after delay
      setTimeout(() => {
        indicator.classList.remove("pulling", "refreshing");
        indicator.style.top = "-80px";
        pullIcon.style.transform = "rotate(0deg)";
        pullIcon.classList.remove("rotate", "hidden");
        pullSpinner.classList.add("hidden");
        isRefreshing = false;
      }, 500);
    } else {
      indicator.style.top = "-80px";
      indicator.classList.remove("pulling");
      pullIcon.style.transform = "rotate(0deg)";
      pullIcon.classList.remove("rotate");
    }

    isPulling = false;
    startY = 0;
    currentY = 0;
  });
}

// Dark Mode Functions
const DARK_MODE_KEY = "dark_mode_enabled";

function isDarkMode() {
  return localStorage.getItem(DARK_MODE_KEY) === "true";
}

function toggleDarkMode() {
  const isDark = isDarkMode();

  if (isDark) {
    document.body.classList.remove("dark-mode");
    localStorage.setItem(DARK_MODE_KEY, "false");
    document.getElementById("dark-mode-icon-sun").classList.add("hidden");
    document.getElementById("dark-mode-icon-moon").classList.remove("hidden");
  } else {
    document.body.classList.add("dark-mode");
    localStorage.setItem(DARK_MODE_KEY, "true");
    document.getElementById("dark-mode-icon-sun").classList.remove("hidden");
    document.getElementById("dark-mode-icon-moon").classList.add("hidden");
  }
}

function initDarkMode() {
  if (isDarkMode()) {
    document.body.classList.add("dark-mode");
    document.getElementById("dark-mode-icon-sun").classList.remove("hidden");
    document.getElementById("dark-mode-icon-moon").classList.add("hidden");
  } else {
    document.body.classList.remove("dark-mode");
    document.getElementById("dark-mode-icon-sun").classList.add("hidden");
    document.getElementById("dark-mode-icon-moon").classList.remove("hidden");
  }
}

// Loading Overlay Functions
function showLoading() {
  document.getElementById("loading-overlay").classList.remove("hidden");
  document.getElementById("loading-overlay").classList.add("flex");
}

function hideLoading() {
  document.getElementById("loading-overlay").classList.add("hidden");
  document.getElementById("loading-overlay").classList.remove("flex");
}

// Empty State Functions
function showEmptyStaff() {
  const container = document.getElementById("staff-list");
  container.innerHTML =
    '<div class="empty-state"><svg class="empty-state-icon mx-auto" viewBox="0 0 200 200" fill="none"><circle cx="100" cy="80" r="30" fill="#cbd5e1"/><path d="M60 140c0-22 18-40 40-40s40 18 40 40" stroke="#cbd5e1" stroke-width="8" stroke-linecap="round"/><circle cx="85" cy="75" r="5" fill="#64748b"/><circle cx="115" cy="75" r="5" fill="#64748b"/><path d="M90 90c5 5 15 5 20 0" stroke="#64748b" stroke-width="3" stroke-linecap="round"/></svg><h3 class="text-lg font-bold text-slate-700 mb-2">Belum Ada Guru/Staff</h3><p class="text-slate-500 text-sm">Tambahkan guru atau staff menggunakan form di atas</p></div>';
}

function showEmptyAttendance() {
  const container = document.getElementById("attendance-records");
  container.innerHTML =
    '<div class="empty-state"><svg class="empty-state-icon mx-auto" viewBox="0 0 200 200" fill="none"><rect x="50" y="40" width="100" height="120" rx="10" fill="#e2e8f0" stroke="#cbd5e1" stroke-width="4"/><line x1="70" y1="70" x2="130" y2="70" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/><line x1="70" y1="90" x2="130" y2="90" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/><line x1="70" y1="110" x2="110" y2="110" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/><circle cx="70" cy="70" r="4" fill="#64748b"/><circle cx="70" cy="90" r="4" fill="#64748b"/><circle cx="70" cy="110" r="4" fill="#64748b"/></svg><h3 class="text-lg font-bold text-slate-700 mb-2">Belum Ada Data Absensi</h3><p class="text-slate-500 text-sm">Data absensi akan muncul di sini setelah guru/staff melakukan absensi</p></div>';
}

function showEmptyFilteredAttendance() {
  const container = document.getElementById("attendance-records");
  container.innerHTML =
    '<div class="empty-state"><svg class="empty-state-icon mx-auto" viewBox="0 0 200 200" fill="none"><circle cx="80" cy="80" r="40" fill="none" stroke="#cbd5e1" stroke-width="6"/><line x1="110" y1="110" x2="140" y2="140" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round"/><line x1="60" y1="70" x2="100" y2="70" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/><line x1="60" y1="85" x2="90" y2="85" stroke="#94a3b8" stroke-width="4" stroke-linecap="round"/></svg><h3 class="text-lg font-bold text-slate-700 mb-2">Tidak Ada Data</h3><p class="text-slate-500 text-sm">Tidak ada data absensi yang sesuai dengan filter</p></div>';
}

// Default Config
const defaultConfig = {
  app_title: "Absensi",
  school_name: "SMK YPPM TOMO",
  apps_script_url: "https://script.google.com/macros/s/AKfycbxCDspWWAsHs1labW5J5yzqVIwftC0DWOT-4q8NXhB028D2GCUO4UKu3Nd_8DWUyWe2KQ/exec",
};

// Initialize Element SDK
if (window.elementSdk) {
  window.elementSdk.init({
    defaultConfig,
    onConfigChange: async (config) => {
      const title = config.app_title || defaultConfig.app_title;
      const school = config.school_name || defaultConfig.school_name;

      document.getElementById("header-title").textContent = title;
      document.getElementById("header-school").textContent = school;
      document.title = title + " - " + school;
    },
    mapToCapabilities: (config) => ({
      recolorables: [],
      borderables: [],
      fontEditable: undefined,
      fontSizeable: undefined,
    }),
    mapToEditPanelValues: (config) =>
      new Map([
        ["app_title", config.app_title || defaultConfig.app_title],
        ["school_name", config.school_name || defaultConfig.school_name],
        ["apps_script_url", config.apps_script_url || defaultConfig.apps_script_url],
      ]),
  });
}

// Get Apps Script URL
function getAppsScriptUrl() {
  if (window.elementSdk && window.elementSdk.config) {
    return window.elementSdk.config.apps_script_url || defaultConfig.apps_script_url;
  }
  return defaultConfig.apps_script_url;
}

// Hide Initial Loading Screen
function hideInitialLoading() {
  const loadingScreen = document.getElementById("initial-loading");
  if (loadingScreen) {
    loadingScreen.style.animation = "fadeOut 0.5s ease-out forwards";
    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }
}

// Initialize App
async function initApp() {
  initDarkMode();
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // Initialize new features
  displayQuote();
  initParticles();
  setupParallax();

  // PWA Install handling
  setupPWA();

  // Setup Pull to Refresh
  setupPullToRefresh();

  // Get location automatically
  getLocation();

  // Load data from Apps Script
  await loadAllData();

  // Hide loading screen after everything is loaded
  hideInitialLoading();
}

// Load all data from Google Sheets
async function loadAllData() {
  const url = getAppsScriptUrl();

  if (!url) {
    console.error("Apps Script URL tidak dikonfigurasi");
    return;
  }

  if (isLoading) return;
  isLoading = true;

  showLoading();

  try {
    const response = await fetch(url + "?action=getAll");
    const data = await response.json();

    if (data.success) {
      staffList = data.staff || [];
      attendanceList = data.attendance || [];

      updateStaffSelect();
      updateStaffList();
      updateAttendanceRecords();
    }
  } catch (error) {
    console.error("Error loading data:", error);
    showToast("Gagal memuat data", "error");
  } finally {
    hideLoading();
    isLoading = false;
  }
}

// PWA Setup
function setupPWA() {
  // Check if app is already installed
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
    // App is installed, hide install button
    document.getElementById("header-install-btn").style.display = "none";
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    // Show install button when prompt is available
    document.getElementById("header-install-btn").style.display = "flex";
  });

  window.addEventListener("appinstalled", () => {
    showToast("Aplikasi berhasil diinstall!", "success");
    // Hide install button after installation
    document.getElementById("header-install-btn").style.display = "none";
    deferredPrompt = null;
  });
}

async function installPWA() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      showToast("Terima kasih telah menginstall aplikasi!", "success");
    }
    deferredPrompt = null;
  } else {
    showToast('Untuk menginstall, gunakan menu browser dan pilih "Add to Home Screen" atau "Install App"', "info");
  }
}

// Toast Notification
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");

  const colors = {
    success: "bg-gradient-to-r from-slate-600 to-slate-700",
    error: "bg-gradient-to-r from-red-500 to-rose-600",
    info: "bg-gradient-to-r from-slate-500 to-slate-600",
    warning: "bg-gradient-to-r from-amber-500 to-orange-600",
  };

  toast.className = "toast " + colors[type] + " text-white px-6 py-4 rounded-2xl shadow-2xl font-bold text-sm max-w-xs text-center";
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Date Time Update
function updateDateTime() {
  const now = new Date();
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  document.getElementById("current-date").textContent = now.toLocaleDateString("id-ID", options);
  document.getElementById("current-time").textContent = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  // Update analog clock
  updateAnalogClock(now);
}

// Update Analog Clock
function updateAnalogClock(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  // Calculate angles (12 o'clock is 0 degrees)
  const secondAngle = seconds * 6 - 90; // 6 degrees per second
  const minuteAngle = minutes * 6 + seconds * 0.1 - 90; // 6 degrees per minute + smooth transition
  const hourAngle = (hours % 12) * 30 + minutes * 0.5 - 90; // 30 degrees per hour + smooth transition

  // Get hand elements
  const hourHand = document.getElementById("hour-hand");
  const minuteHand = document.getElementById("minute-hand");
  const secondHand = document.getElementById("second-hand");

  if (hourHand && minuteHand && secondHand) {
    // Update hour hand (length: 20 units from center)
    const hourX = 50 + 20 * Math.cos((hourAngle * Math.PI) / 180);
    const hourY = 50 + 20 * Math.sin((hourAngle * Math.PI) / 180);
    hourHand.setAttribute("x2", hourX);
    hourHand.setAttribute("y2", hourY);

    // Update minute hand (length: 30 units from center)
    const minuteX = 50 + 30 * Math.cos((minuteAngle * Math.PI) / 180);
    const minuteY = 50 + 30 * Math.sin((minuteAngle * Math.PI) / 180);
    minuteHand.setAttribute("x2", minuteX);
    minuteHand.setAttribute("y2", minuteY);

    // Update second hand (length: 35 units from center)
    const secondX = 50 + 35 * Math.cos((secondAngle * Math.PI) / 180);
    const secondY = 50 + 35 * Math.sin((secondAngle * Math.PI) / 180);
    secondHand.setAttribute("x2", secondX);
    secondHand.setAttribute("y2", secondY);
  }
}

// Page Navigation
function showPage(page) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  window.scrollTo(0, 0);
}

// Status Selection
function selectStatus(status) {
  selectedStatus = status;
  document.querySelectorAll(".status-option").forEach((card) => {
    card.classList.remove("selected");
  });

  const selectedCard = document.querySelector('[data-status="' + status + '"]');
  selectedCard.classList.add("selected");

  // Re-check for duplicate when status changes
  checkDuplicateAttendance();

  // Update progress
  updateProgressIndicator();
}

// Camera Functions
async function startCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
    });

    const video = document.getElementById("camera-video");
    video.srcObject = cameraStream;
    video.play();

    document.getElementById("camera-placeholder").classList.add("hidden");
    document.getElementById("open-camera-btn").classList.add("hidden");
    video.classList.remove("hidden");
    document.getElementById("camera-controls").classList.remove("hidden");
  } catch (err) {
    showToast("Tidak dapat mengakses kamera. Pastikan izin kamera diberikan.", "error");
  }
}

function capturePhoto() {
  const video = document.getElementById("camera-video");
  const canvas = document.getElementById("camera-canvas");
  const photo = document.getElementById("captured-photo");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  capturedPhotoData = canvas.toDataURL("image/jpeg", 0.7);
  photo.src = capturedPhotoData;

  stopCamera();
  document.getElementById("camera-placeholder").classList.add("hidden");
  document.getElementById("open-camera-btn").classList.add("hidden");
  video.classList.add("hidden");
  document.getElementById("camera-controls").classList.add("hidden");
  photo.classList.remove("hidden");
  document.getElementById("photo-controls").classList.remove("hidden");

  checkFormValidity();
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
  }

  // Hide video and controls, show placeholder
  document.getElementById("camera-video").classList.add("hidden");
  document.getElementById("camera-controls").classList.add("hidden");
  document.getElementById("camera-placeholder").classList.remove("hidden");
}

function retakePhoto() {
  capturedPhotoData = null;
  document.getElementById("captured-photo").classList.add("hidden");
  document.getElementById("photo-controls").classList.add("hidden");
  document.getElementById("camera-placeholder").classList.remove("hidden");
  document.getElementById("open-camera-btn").classList.remove("hidden");
  checkFormValidity();
}

// Location Functions
async function getLocation() {
  if (!navigator.geolocation) {
    showToast("Geolokasi tidak didukung di browser ini", "error");
    document.getElementById("location-loading").innerHTML =
      '<svg class="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p class="text-slate-700 font-semibold">Geolokasi tidak didukung</p>';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Get address using reverse geocoding
      try {
        const response = await fetch("https://nominatim.openstreetmap.org/reverse?format=json&lat=" + currentLocation.lat + "&lon=" + currentLocation.lng);
        const data = await response.json();
        currentLocation.address = data.display_name || "Alamat tidak ditemukan";
      } catch (err) {
        currentLocation.address = "Alamat tidak dapat diambil";
      }

      document.getElementById("location-loading").classList.add("hidden");
      document.getElementById("location-result").classList.remove("hidden");
      document.getElementById("location-address").textContent = currentLocation.address;
      document.getElementById("location-coords").textContent = "Koordinat: " + currentLocation.lat.toFixed(6) + ", " + currentLocation.lng.toFixed(6);

      // Initialize map
      if (map) {
        map.remove();
      }

      map = L.map("map").setView([currentLocation.lat, currentLocation.lng], 17);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      L.marker([currentLocation.lat, currentLocation.lng]).addTo(map).bindPopup("Lokasi Anda").openPopup();

      checkFormValidity();
    },
    (error) => {
      let message = "Gagal mendapatkan lokasi";

      if (error.code === 1) {
        message = "Izin lokasi ditolak. Aktifkan izin lokasi untuk melanjutkan.";
      }
      if (error.code === 2) {
        message = "Lokasi tidak tersedia";
      }
      if (error.code === 3) {
        message = "Waktu habis mendapatkan lokasi";
      }

      document.getElementById("location-loading").innerHTML =
        '<svg class="w-16 h-16 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><p class="text-slate-700 font-semibold text-center px-4">' +
        message +
        "</p>";

      showToast(message, "error");
    },
    { enableHighAccuracy: true, timeout: 15000 },
  );
}

// Check Duplicate Attendance
function checkDuplicateAttendance() {
  const staffSelect = document.getElementById("staff-select");
  const selectedName = staffSelect.value;
  const warningDiv = document.getElementById("duplicate-warning");
  const detailsP = document.getElementById("duplicate-details");

  if (!selectedName) {
    warningDiv.classList.add("hidden");
    checkFormValidity();
    return;
  }

  // Get today's date
  const today = new Date().toISOString().split("T")[0];

  // Find all attendance records for this person today
  const todayRecords = attendanceList.filter((record) => {
    let recordDate = record.date;

    // Extract date from ISO timestamp if needed
    if (recordDate && recordDate.includes("T")) {
      recordDate = recordDate.split("T")[0];
    }

    return record.name === selectedName && recordDate === today;
  });

  if (todayRecords.length > 0) {
    // Show warning with details
    const statusLabels = {
      masuk: "Masuk",
      pulang: "Pulang",
      dinas: "Dinas Luar",
    };

    const recordsText = todayRecords
      .map((r) => {
        const status = statusLabels[r.status] || r.status;
        const time = r.time || "00:00";
        return "<strong>" + status + "</strong> pukul " + time;
      })
      .join(", ");

    detailsP.innerHTML = selectedName + " sudah melakukan absensi hari ini: " + recordsText + ". Silakan pilih status yang berbeda atau pastikan tidak ada duplikasi.";
    warningDiv.classList.remove("hidden");
  } else {
    // No duplicate found
    warningDiv.classList.add("hidden");
  }

  checkFormValidity();
}

// Form Validation
function checkFormValidity() {
  const staffSelect = document.getElementById("staff-select");
  const isValid = staffSelect.value && selectedStatus && capturedPhotoData && currentLocation;
  document.getElementById("submit-btn").disabled = !isValid;

  // Update progress indicator
  updateProgressIndicator();
}

// Update Progress Indicator
function updateProgressIndicator() {
  const staffSelect = document.getElementById("staff-select");
  const hasName = staffSelect.value !== "";
  const hasStatus = selectedStatus !== null;
  const hasPhoto = capturedPhotoData !== null;
  const hasLocation = currentLocation !== null;

  // Step 1: Name
  const step1 = document.getElementById("progress-step-1");
  const bar1 = document.getElementById("progress-bar-1");
  if (hasName) {
    step1.classList.add("completed");
    step1.classList.remove("active");
    bar1.style.width = "100%";
  } else {
    step1.classList.add("active");
    step1.classList.remove("completed");
    bar1.style.width = "0%";
  }

  // Step 2: Status
  const step2 = document.getElementById("progress-step-2");
  const bar2 = document.getElementById("progress-bar-2");
  if (hasStatus) {
    step2.classList.add("completed");
    step2.classList.remove("active");
    bar2.style.width = "100%";
  } else if (hasName) {
    step2.classList.add("active");
    step2.classList.remove("completed");
    bar2.style.width = "0%";
  } else {
    step2.classList.remove("active", "completed");
    bar2.style.width = "0%";
  }

  // Step 3: Photo
  const step3 = document.getElementById("progress-step-3");
  const bar3 = document.getElementById("progress-bar-3");
  if (hasPhoto) {
    step3.classList.add("completed");
    step3.classList.remove("active");
    bar3.style.width = "100%";
  } else if (hasStatus) {
    step3.classList.add("active");
    step3.classList.remove("completed");
    bar3.style.width = "0%";
  } else {
    step3.classList.remove("active", "completed");
    bar3.style.width = "0%";
  }

  // Step 4: Complete
  const step4 = document.getElementById("progress-step-4");
  if (hasName && hasStatus && hasPhoto && hasLocation) {
    step4.classList.add("completed");
    step4.classList.remove("active");
  } else if (hasPhoto) {
    step4.classList.add("active");
    step4.classList.remove("completed");
  } else {
    step4.classList.remove("active", "completed");
  }
}

// Show Success Modal
function showSuccessModal(name, status, time) {
  const statusLabels = {
    masuk: "Masuk",
    pulang: "Pulang",
    dinas: "Dinas Luar",
  };

  const details = name + " - " + statusLabels[status] + " pada " + time;
  document.getElementById("success-details").textContent = details;
  document.getElementById("success-modal").classList.remove("hidden");
}

// Confetti Animation
function createConfetti() {
  const colors = ["#f97316", "#fb923c", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6"];
  const confettiCount = 150;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement("div");
    confetti.className = "confetti confetti-particle";

    // Random properties
    const left = Math.random() * 100;
    const animationDuration = Math.random() * 3 + 2; // 2-5 seconds
    const animationDelay = Math.random() * 0.5; // 0-0.5s delay
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 6; // 6-14px

    confetti.style.left = left + "%";
    confetti.style.backgroundColor = color;
    confetti.style.width = size + "px";
    confetti.style.height = size + "px";
    confetti.style.animationDuration = animationDuration + "s";
    confetti.style.animationDelay = animationDelay + "s";
    confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

    document.body.appendChild(confetti);

    // Remove confetti after animation
    setTimeout(
      () => {
        confetti.remove();
      },
      (animationDuration + animationDelay) * 1000,
    );
  }
}

// Close Success Modal
async function closeSuccessModal() {
  document.getElementById("success-modal").classList.add("hidden");

  // Reset form after closing success modal
  resetForm();

  // Reload data from server to update dashboard
  await loadAllData();
}

// Show Submit Confirmation
function submitAttendance() {
  const staffSelect = document.getElementById("staff-select");
  const selectedName = staffSelect.value;

  if (!selectedName || !selectedStatus || !capturedPhotoData || !currentLocation) {
    showToast("Lengkapi semua data terlebih dahulu", "error");
    return;
  }

  const url = getAppsScriptUrl();
  if (!url) {
    showToast("URL Apps Script belum dikonfigurasi. Klik tombol pengaturan untuk menambahkan URL.", "error");
    return;
  }

  // Check for duplicate attendance
  const today = new Date().toISOString().split("T")[0];
  const duplicate = attendanceList.find((record) => {
    let recordDate = record.date;

    // Extract date from ISO timestamp if needed
    if (recordDate && recordDate.includes("T")) {
      recordDate = recordDate.split("T")[0];
    }

    return record.name === selectedName && record.status === selectedStatus && recordDate === today;
  });

  if (duplicate) {
    const statusLabels = {
      masuk: "Masuk",
      pulang: "Pulang",
      dinas: "Dinas Luar",
    };

    showToast(selectedName + " sudah absen " + statusLabels[selectedStatus] + " hari ini!", "warning");
    return;
  }

  // Show confirmation modal
  const statusLabels = {
    masuk: "Masuk",
    pulang: "Pulang",
    dinas: "Dinas Luar",
  };

  const now = new Date();
  document.getElementById("confirm-name").textContent = selectedName;
  document.getElementById("confirm-status").textContent = statusLabels[selectedStatus];
  document.getElementById("confirm-time").textContent =
    now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) +
    " - " +
    now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  document.getElementById("submit-confirmation-modal").classList.remove("hidden");
}

function closeSubmitConfirmation() {
  document.getElementById("submit-confirmation-modal").classList.add("hidden");
}

// Confirm Submit Attendance
async function confirmSubmitAttendance() {
  if (isSubmitting) return;

  const staffSelect = document.getElementById("staff-select");
  const selectedName = staffSelect.value;

  if (!selectedName || !selectedStatus || !capturedPhotoData || !currentLocation) {
    showToast("Lengkapi semua data terlebih dahulu", "error");
    closeSubmitConfirmation();
    return;
  }

  const url = getAppsScriptUrl();
  if (!url) {
    showToast("URL Apps Script belum dikonfigurasi. Klik tombol pengaturan untuk menambahkan URL.", "error");
    closeSubmitConfirmation();
    return;
  }

  // DOUBLE CHECK untuk mencegah absen ganda sebelum kirim
  const today = new Date().toISOString().split("T")[0];
  const existingRecord = attendanceList.find((record) => {
    let recordDate = record.date;

    // Extract date from ISO timestamp if needed
    if (recordDate && recordDate.includes("T")) {
      recordDate = recordDate.split("T")[0];
    }

    return record.name === selectedName && record.status === selectedStatus && recordDate === today;
  });

  if (existingRecord) {
    const statusLabels = {
      masuk: "Masuk",
      pulang: "Pulang",
      dinas: "Dinas Luar",
    };

    showToast("⚠️ " + selectedName + " sudah absen " + statusLabels[selectedStatus] + " hari ini pukul " + existingRecord.time + "!", "warning");
    closeSubmitConfirmation();

    // Shake the form
    const container = document.querySelector("#page-attendance > div");
    container.style.animation = "shake 0.5s";
    setTimeout(() => {
      container.style.animation = "";
    }, 500);

    return;
  }

  isSubmitting = true;
  const confirmBtn = document.getElementById("confirm-submit-btn");
  confirmBtn.innerHTML = '<div class="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';
  confirmBtn.disabled = true;

  const now = new Date();
  const attendanceData = {
    action: "addAttendance",
    name: selectedName,
    date: now.toISOString().split("T")[0],
    time: now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    status: selectedStatus,
    photo: capturedPhotoData,
    latitude: currentLocation.lat,
    longitude: currentLocation.lng,
    address: currentLocation.address,
    timestamp: now.toISOString(),
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(attendanceData),
    });

    const result = await response.json();

    if (result.success) {
      closeSubmitConfirmation();

      // 🎊 Trigger confetti animation!
      createConfetti();

      // Show success modal with animation
      const statusLabels = {
        masuk: "Masuk",
        pulang: "Pulang",
        dinas: "Dinas Luar",
      };

      const timeStr = now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      showSuccessModal(selectedName, selectedStatus, timeStr);

      // DON'T reset or reload here - let the success modal button handle it
    } else {
      showToast(result.message || "Gagal menyimpan absensi", "error");
      confirmBtn.innerHTML = "Kirim";
      confirmBtn.disabled = false;
    }
  } catch (error) {
    showToast("Error mengirim data: " + error.message, "error");
    confirmBtn.innerHTML = "Kirim";
    confirmBtn.disabled = false;
  } finally {
    isSubmitting = false;
  }
}

// Reset Form
function resetForm() {
  document.getElementById("staff-select").value = "";
  selectedStatus = null;
  capturedPhotoData = null;
  currentLocation = null;

  // Hide duplicate warning
  document.getElementById("duplicate-warning").classList.add("hidden");

  document.querySelectorAll(".status-option").forEach((card) => {
    card.classList.remove("selected");
  });

  document.getElementById("captured-photo").classList.add("hidden");
  document.getElementById("photo-controls").classList.add("hidden");
  document.getElementById("camera-placeholder").classList.remove("hidden");
  document.getElementById("open-camera-btn").classList.remove("hidden");

  document.getElementById("location-result").classList.add("hidden");
  document.getElementById("location-loading").classList.remove("hidden");
  document.getElementById("location-loading").innerHTML =
    '<div class="w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div><p class="text-slate-700 font-semibold">Mendapatkan lokasi otomatis...</p>';

  if (map) {
    map.remove();
    map = null;
  }

  document.getElementById("submit-btn").disabled = true;

  // Reset progress indicator
  updateProgressIndicator();

  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Get location again
  getLocation();
}

// Update Staff Select
function updateStaffSelect() {
  const select = document.getElementById("staff-select");
  const currentValue = select.value;

  select.innerHTML = '<option value="">-- Pilih Nama Guru/Staff --</option>';

  staffList
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach((staff) => {
      const option = document.createElement("option");
      option.value = staff.name;
      option.textContent = staff.name;
      select.appendChild(option);
    });

  if (currentValue && staffList.some((s) => s.name === currentValue)) {
    select.value = currentValue;
  }

  select.onchange = checkFormValidity;
}

// Update Staff List (Admin)
function updateStaffList() {
  const container = document.getElementById("staff-list");
  document.getElementById("staff-count").textContent = staffList.length;

  if (staffList.length === 0) {
    showEmptyStaff();
    return;
  }

  const staffHTML = staffList
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((staff) => {
      const safeId = String(staff.id || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
      const safeName = String(staff.name || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      return (
        '<div class="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl hover:shadow-md transition border-2 border-slate-200"><span class="font-bold text-slate-800">' +
        staff.name +
        '</span><div class="flex gap-2"><button onclick="showEditModal(\'' +
        safeId +
        "', '" +
        safeName +
        '\')" class="text-slate-600 hover:text-white hover:bg-slate-600 p-2.5 rounded-xl transition shadow-sm" title="Edit"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button><button onclick="showDeleteModal(\'staff\', \'' +
        safeId +
        "', '" +
        safeName +
        '\')" class="text-red-500 hover:text-white hover:bg-red-500 p-2.5 rounded-xl transition shadow-sm" title="Hapus"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button></div></div>'
      );
    })
    .join("");

  container.innerHTML = staffHTML;

  // Update filter name dropdown
  updateFilterNameDropdown();
}

// Update Filter Name Dropdown
function updateFilterNameDropdown() {
  const filterName = document.getElementById("filter-name");
  const currentValue = filterName.value;

  // Get unique names from staff list
  const uniqueNames = [...new Set(staffList.map((s) => s.name))].sort();

  filterName.innerHTML = '<option value="">🧑‍🏫 Semua Guru/Staff</option>';
  uniqueNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    filterName.appendChild(option);
  });

  // Restore previous selection if still valid
  if (currentValue && uniqueNames.includes(currentValue)) {
    filterName.value = currentValue;
  }
}

// Update Attendance Records (Admin)
function updateAttendanceRecords() {
  filterAttendance();
}

function clearFilter() {
  document.getElementById("filter-date").value = "";
  document.getElementById("filter-name").value = "";
  filterAttendance();
}

function filterAttendance() {
  const filterDate = document.getElementById("filter-date").value;
  const filterName = document.getElementById("filter-name").value;
  const container = document.getElementById("attendance-records");
  const filterInfo = document.getElementById("filter-info");

  let filtered = [...attendanceList];
  let filterDescriptions = [];

  // Filter by name
  if (filterName) {
    filtered = filtered.filter((a) => a.name === filterName);
    filterDescriptions.push(filterName);
  }

  // Filter by date
  if (filterDate) {
    filtered = filtered.filter((a) => {
      // Extract date from ISO timestamp or use date field directly
      let recordDate = a.date;

      // If date is ISO timestamp, extract YYYY-MM-DD part
      if (recordDate && recordDate.includes("T")) {
        recordDate = recordDate.split("T")[0];
      }

      return recordDate === filterDate;
    });
    filterDescriptions.push(formatDate(filterDate));
  }

  // Update filter info text
  if (filterDescriptions.length > 0) {
    filterInfo.textContent = "Menampilkan " + filtered.length + " dari " + attendanceList.length + " total absensi untuk " + filterDescriptions.join(" �� ");
  } else {
    filterInfo.textContent = "Menampilkan semua " + attendanceList.length + " data absensi";
  }

  document.getElementById("attendance-count").textContent = filtered.length;

  if (filtered.length === 0) {
    if (filterDate || filterName) {
      showEmptyFilteredAttendance();
    } else {
      showEmptyAttendance();
    }
    return;
  }

  // Sort by timestamp (newest first)
  filtered.sort((a, b) => {
    const timeA = a.timestamp || a.createdAt || new Date(a.date + " " + a.time).toISOString();
    const timeB = b.timestamp || b.createdAt || new Date(b.date + " " + b.time).toISOString();
    return new Date(timeB) - new Date(timeA);
  });

  const recordsHTML = filtered
    .map((record) => {
      const statusColors = {
        masuk: "bg-gradient-to-r from-slate-600 to-slate-700 text-white",
        pulang: "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
        dinas: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
      };

      const statusLabels = {
        masuk: "Masuk",
        pulang: "Pulang",
        dinas: "Dinas",
      };

      const safeName = String(record.name || "Tidak diketahui")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
      const safeId = String(record.id || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

      // Format date and time properly from timestamp
      let formattedDate, displayTime;

      if (record.timestamp) {
        // Extract from ISO timestamp
        const timestamp = new Date(record.timestamp);
        formattedDate = timestamp.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
        displayTime = timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      } else {
        // Fallback to date and time fields
        formattedDate = formatDate(record.date);
        displayTime = record.time || "00:00:00";
      }

      const photoSrc = record.photo || "";
      const address = record.address || "Lokasi tidak tersedia";
      const statusClass = statusColors[record.status] || "bg-slate-500";
      const statusLabel = statusLabels[record.status] || record.status;

      return (
        '<div class="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-5 hover:shadow-md transition border-2 border-slate-200"><div class="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-4"><img src="' +
        photoSrc +
        '" alt="Foto" class="w-24 h-24 sm:w-24 sm:h-24 object-cover rounded-xl flex-shrink-0 shadow-md border-2 border-white" loading="lazy" onerror="this.style.background=\'#e5e7eb\'; this.alt=\'Foto gagal dimuat\';"><div class="flex-1 min-w-0 w-full"><div class="flex flex-col items-center sm:flex-row sm:items-start sm:justify-between gap-3 mb-3"><p class="font-bold text-slate-800 text-base sm:text-lg leading-snug break-words">' +
        (record.name || "Tidak diketahui") +
        '</p><span class="px-3 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-black ' +
        statusClass +
        ' shadow-md whitespace-nowrap flex-shrink-0">' +
        statusLabel +
        '</span></div><div class="space-y-1.5 mb-3"><p class="text-sm sm:text-base text-slate-600 font-semibold">📅 ' +
        formattedDate +
        '</p><p class="text-sm sm:text-base text-slate-600 font-semibold">🕐 ' +
        displayTime +
        '</p></div><p class="text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed mb-3" title="' +
        address +
        '">' +
        address +
        "</p><button onclick=\"showDeleteModal('attendance', '" +
        safeId +
        "', '" +
        safeName +
        '\')" class="text-red-500 hover:text-white hover:bg-red-500 px-4 py-2 rounded-xl transition shadow-sm font-bold text-sm flex items-center gap-2 mt-2 mx-auto sm:mx-0" title="Hapus absensi"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>Hapus</button></div></div></div>'
      );
    })
    .join("");

  container.innerHTML = recordsHTML;
}

// Add Staff
async function addStaff(e) {
  e.preventDefault();

  if (isAddingStaff) return;

  const nameInput = document.getElementById("new-staff-name");
  const name = nameInput.value.trim();

  if (!name) {
    showToast("Nama tidak boleh kosong", "error");
    return;
  }

  // Check duplicate
  if (staffList.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
    showToast("Nama guru/staff sudah ada", "error");
    return;
  }

  const url = getAppsScriptUrl();
  if (!url) {
    showToast("URL Apps Script belum dikonfigurasi", "error");
    return;
  }

  isAddingStaff = true;
  const addBtn = document.getElementById("add-staff-btn");
  addBtn.innerHTML = '<div class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div> Menambahkan...';
  addBtn.disabled = true;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        action: "addStaff",
        name: name,
      }),
    });

    const result = await response.json();

    if (result.success) {
      showToast("Guru/Staff berhasil ditambahkan!", "success");
      nameInput.value = "";
      await loadAllData();
    } else {
      showToast(result.message || "Gagal menambahkan guru/staff", "error");
    }
  } catch (error) {
    showToast("Error menambahkan staff: " + error.message, "error");
  } finally {
    isAddingStaff = false;
    addBtn.innerHTML = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg> Tambah Guru/Staff';
    addBtn.disabled = false;
  }
}

// Edit Staff Functions
let editTarget = null;

function showEditModal(id, name) {
  editTarget = id;
  // Decode HTML entities back to normal text
  const textarea = document.createElement("textarea");
  textarea.innerHTML = name;
  const decodedName = textarea.value;

  document.getElementById("edit-staff-name").value = decodedName;
  document.getElementById("edit-modal").classList.remove("hidden");
}

function closeEditModal() {
  editTarget = null;
  document.getElementById("edit-staff-name").value = "";
  document.getElementById("edit-modal").classList.add("hidden");
}

async function saveEditStaff(e) {
  e.preventDefault();

  if (!editTarget) return;

  const newName = document.getElementById("edit-staff-name").value.trim();

  if (!newName) {
    showToast("Nama tidak boleh kosong", "error");
    return;
  }

  // Check duplicate (exclude current staff)
  const existingStaff = staffList.find((s) => s.id !== editTarget && s.name.toLowerCase() === newName.toLowerCase());
  if (existingStaff) {
    showToast("Nama guru/staff sudah ada", "error");
    return;
  }

  const url = getAppsScriptUrl();
  if (!url) {
    showToast("URL Apps Script belum dikonfigurasi", "error");
    return;
  }

  const saveBtn = document.getElementById("save-edit-btn");
  saveBtn.innerHTML = '<div class="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>';
  saveBtn.disabled = true;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        action: "editStaff",
        id: editTarget,
        name: newName,
      }),
    });

    const result = await response.json();

    if (result.success) {
      showToast("Nama berhasil diubah!", "success");
      closeEditModal();
      await loadAllData();
    } else {
      showToast(result.message || "Gagal mengubah nama", "error");
    }
  } catch (error) {
    showToast("Error mengubah staff: " + error.message, "error");
  } finally {
    saveBtn.innerHTML = "Simpan";
    saveBtn.disabled = false;
  }
}

// Delete Functions
function showDeleteModal(type, id, name) {
  // Decode HTML entities back to normal text
  const textarea = document.createElement("textarea");
  textarea.innerHTML = name;
  const decodedName = textarea.value;

  deleteTarget = { type: type, id: id, name: decodedName };
  document.getElementById("delete-modal-text").textContent = 'Apakah Anda yakin ingin menghapus "' + decodedName + '"?';
  document.getElementById("delete-modal").classList.remove("hidden");
}

function closeDeleteModal() {
  deleteTarget = null;
  document.getElementById("delete-modal").classList.add("hidden");
}

async function confirmDelete() {
  if (!deleteTarget) return;

  const url = getAppsScriptUrl();
  if (!url) {
    showToast("URL Apps Script belum dikonfigurasi", "error");
    closeDeleteModal();
    return;
  }

  const btn = document.getElementById("confirm-delete-btn");
  btn.innerHTML = '<div class="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>';
  btn.disabled = true;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        action: deleteTarget.type === "staff" ? "deleteStaff" : "deleteAttendance",
        id: deleteTarget.id,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Close modal first
      btn.innerHTML = "Hapus";
      btn.disabled = false;
      closeDeleteModal();

      // Show success message
      showToast("Data berhasil dihapus!", "success");

      // Reload data WITHOUT showing loading overlay
      const savedIsLoading = isLoading;
      isLoading = true; // Prevent loadAllData from showing overlay

      const response2 = await fetch(url + "?action=getAll");
      const data = await response2.json();

      if (data.success) {
        staffList = data.staff || [];
        attendanceList = data.attendance || [];

        updateStaffSelect();
        updateStaffList();
        updateAttendanceRecords();
      }

      isLoading = savedIsLoading;
    } else {
      showToast(result.message || "Gagal menghapus data", "error");
      btn.innerHTML = "Hapus";
      btn.disabled = false;
    }
  } catch (error) {
    showToast("Error menghapus data: " + error.message, "error");
    btn.innerHTML = "Hapus";
    btn.disabled = false;
    closeDeleteModal();
  }
}

// Password Protection
const ADMIN_PASSWORD = "EBUVyML5h!g5Uek";
const ADMIN_AUTH_KEY = "admin_authenticated";

// Toggle Password Visibility
function togglePasswordVisibility() {
  const passwordInput = document.getElementById("admin-password-input");
  const eyeOpen = document.getElementById("password-eye-open");
  const eyeClosed = document.getElementById("password-eye-closed");

  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    eyeOpen.classList.remove("hidden");
    eyeClosed.classList.add("hidden");
  } else {
    passwordInput.type = "password";
    eyeOpen.classList.add("hidden");
    eyeClosed.classList.remove("hidden");
  }
}

// Check if already logged in
function isAdminAuthenticated() {
  return localStorage.getItem(ADMIN_AUTH_KEY) === "true";
}

// Set admin authenticated
function setAdminAuthenticated() {
  localStorage.setItem(ADMIN_AUTH_KEY, "true");
}

// Clear admin authentication (optional logout)
function clearAdminAuthentication() {
  localStorage.removeItem(ADMIN_AUTH_KEY);
}

function promptAdminPassword() {
  // Check if already authenticated
  if (isAdminAuthenticated()) {
    showPage("admin");
    showToast("Selamat datang kembali di Admin Panel", "success");
    return;
  }

  document.getElementById("password-modal").classList.remove("hidden");
  document.getElementById("admin-password-input").value = "";
  document.getElementById("password-error").classList.add("hidden");

  // Focus on password input
  setTimeout(() => {
    document.getElementById("admin-password-input").focus();
  }, 100);
}

function closePasswordModal() {
  document.getElementById("password-modal").classList.add("hidden");
  document.getElementById("admin-password-input").value = "";
  document.getElementById("password-error").classList.add("hidden");
}

function checkAdminPassword(e) {
  e.preventDefault();

  const inputPassword = document.getElementById("admin-password-input").value;
  const errorMsg = document.getElementById("password-error");

  if (inputPassword === ADMIN_PASSWORD) {
    setAdminAuthenticated();
    closePasswordModal();
    showPage("admin");
    showToast("Berhasil masuk ke Admin Panel", "success");
  } else {
    errorMsg.classList.remove("hidden");
    document.getElementById("admin-password-input").value = "";
    document.getElementById("admin-password-input").focus();

    // Shake animation
    const modal = document.querySelector("#password-modal > div");
    modal.style.animation = "none";
    setTimeout(() => {
      modal.style.animation = "shake 0.5s";
    }, 10);
  }
}

// Helper Functions
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// Initialize
initApp();
(function () {
  function c() {
    var b = a.contentDocument || a.contentWindow.document;
    if (b) {
      var d = b.createElement("script");
      d.innerHTML =
        "window.__CF$cv$params={r:'9c739fcb631576b5',t:'MTc2OTk3MTcxOS4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";
      b.getElementsByTagName("head")[0].appendChild(d);
    }
  }
  if (document.body) {
    var a = document.createElement("iframe");
    a.height = 1;
    a.width = 1;
    a.style.position = "absolute";
    a.style.top = 0;
    a.style.left = 0;
    a.style.border = "none";
    a.style.visibility = "hidden";
    document.body.appendChild(a);
    if ("loading" !== document.readyState) c();
    else if (window.addEventListener) document.addEventListener("DOMContentLoaded", c);
    else {
      var e = document.onreadystatechange || function () {};
      document.onreadystatechange = function (b) {
        e(b);
        "loading" !== document.readyState && ((document.onreadystatechange = e), c());
      };
    }
  }
})();
