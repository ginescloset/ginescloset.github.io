import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, updateProfile, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDBMMKFmaszQIr1ew1bYKmZh43wRREiBtU",
  authDomain: "ginescloset-12beb.firebaseapp.com",
  projectId: "ginescloset-12beb",
  storageBucket: "ginescloset-12beb.firebasestorage.app",
  messagingSenderId: "573851675742",
  appId: "1:573851675742:web:3a02ad99df18697cf1d8cf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const page = document.body.dataset.page;

const BRANDS = ["Acne Studios","Adidas","Aimé Leon Dore","Alain Mikli","Alberta Ferretti","Alberto Biani","Alexander McQueen","Alice + Olivia","Ami","Ami Paris","Amiri","Andrea Pfister","Ann Demeulemeester","Anna Sui","Anthropologie","A.P.C.","Arc'teryx","ASICS","Balenciaga","Balmain","Barbour","Bape","Base London","Beams Plus","Beats","Bershka","Billionaire Boys Club","Billabong","Birkenstock","Blend","Blumarine","Boiler Room","Bogner","Bompard","Bottega Veneta","Boucheron","Breguet","Brioni","Bstroy","Brunello Cucinelli","Bulgari","Burberry","Cactus Plant Flea Market","Calvin Klein","Canada Goose","Carhartt WIP","Casa Blanca","Cartier","Celine","Chanel","Chloé","Chrome Hearts","Corteiz","Costume National","Courrèges","Cortez","Cotton Citizen","Cruz","Daily Paper","Denim Tears","Dsquared2","DUAA","Dior","Dior Homme","DKNY","Dolce & Gabbana","Dolce & Gabbana","Double Rainbow","Dries Van Noten","Eddie Bauer","Egon Schiele","Elie Saab","Emporio Armani","Enfants Riches Déprimés","ERD","Eric Emanuel","Escada","Essentials","Etro","Fendi","Fila","Filling Pieces","Fiorucci","Foamposite","Fred Perry","Furla","Futur","GCDS","GmbH","Godspeed","Golden Goose","Goldbergh","Golf Wang","Goodhood","Gosha Rubchinskiy","Goyard","Gucci","Guess","H&M","Harris Wharf London","Hellstar","Helmut Lang","Hermès","Hoka","Hugo Boss","Hummel","Iceberg","Isabel Marent","Isabel Marant","Ivy Park","J.Crew","Jacquemus","Jil Sander","Jimmy Choo","Jordan","Juicy Couture","JW Anderson","Kangol","Karl Lagerfeld","Kenzo","Kith","Karl Kani","Kiton","Ksubi","Kway","Lacoste","Lanvin","Lardini","Le Coq Sportif","Levi's","Lemaire","Loewe","Longchamp","Louis Vuitton","Loro Piana","Luciano Barbera","Luisa Beccaria","Lululemon","Mackage","Maison Kitsuné","Maison Margiela","Majestic Filatures","Mango","Manolo Blahnik","Marc Jacobs","Margaret Howell","Marine Serre","Markus Lupfer","Marni","Mastermind Japan","McQ Alexander McQueen","Miu Miu","Moncler","Moncler Grenoble","Moose Knuckles","Moschino","Mountain Hardwear","MSGM","Napapijri","Neil Barrett","New Balance","New Era","New Look","Nike","Noah","Norse Projects","North Face","Nudie Jeans","Number (N)ine","Numeris","Oakley","Off-White","Olive Clothing","On Running","Opening Ceremony","Orlebar Brown","Oversize","Palm Angels","Patagonia","Paul Smith","Peak Performance","Polo Ralph Lauren","Prada","Pronounce","Puma","Purple","Raf Simons","Rag & Bone","Rains","Ralph Lauren","Ray-Ban","Reebok","Rejina Pyo","Rellik","Rhude","Rick Owens","Roberto Cavalli","Rodarte","Rolex","Rouje","RTA","Sacai","Saint Laurent","Salomon","Samsonite","Sandro","Satisfyer","Schott NYC","Scotch & Soda","Sean John","Sergio Rossi","Sessun","Stone Island","Sp5der","Stussy","Suicoke","Supreme","Sweaty Betty","Syna World","Takumi","Tasaki","Ted Baker","The Fader","The Kooples","The North Face","Thom Browne","Thom Krom","Tiffany & Co.","Timberland","Tod's","Tom Ford","Tommy Hilfiger","Tory Burch","True Religion","Twinset","Ugg","Under Armour","Uniqlo","Valentino","Valley Dreams","Van Cleef & Arpels","Vans","Versace","Victorinox","Vivienne Westwood","Vlone","Wandler","We11done","Woolrich","Wrangler","Y-3","Yeezy","Yohji Yamamoto","Zadig & Voltaire","Zara","Zegna"];
const CATEGORIES = [
  ["camisetas","Camisetas"],["sudaderas","Sudaderas"],["polos","Polos"],["camisetas-futbol","Camisetas de fútbol"],
  ["abrigos","Abrigos"],["zapatos","Zapatos"],["vaqueros","Vaqueros"],["chanclas","Chanclas"],
  ["pantalones-cortos","Pantalones cortos"],["pantalones-largos","Pantalones largos"],
  ["bolsos","Bolsos"],["mochilas","Mochilas"],["gorros","Gorros"],["carteras","Carteras"],["rinoneras","Riñoneras"]
];
const CATEGORY_LABELS = Object.fromEntries(CATEGORIES);
const LEGACY_CATEGORIES = {vestidos:"camisetas",tops:"camisetas",conjuntos:"sudaderas",chaquetas:"abrigos",calzado:"zapatos",pantalones:"pantalones-largos",rinonera:"rinoneras",cartera:"carteras",bolso:"bolsos",mochila:"mochilas",gorro:"gorros",gorra:"gorros"};
const PRODUCT_CACHE_KEY = "gc_catalog_cache_v2";
const AUTH_HINT_KEY = "gc_auth_hint_v1";
const cachedProducts = readProductCache();

const state = {
  products: cachedProducts || [], productSignature: cachedProducts ? productSignature(cachedProducts) : "", user: null, profile: {}, role: "customer", favorites: new Set(), cart: new Map(), authHint: readAuthHint(),
  authReady: false, productsReady: cachedProducts !== null, favoritesReady: false, cartReady: false, selectedBrands: new Set(), selectedCategory: "all", newCategory: "all",
  priceMin: null, priceMax: null,
  pendingFavorite: sessionStorage.getItem("gc_pending_favorite") || "", pendingCart: readPendingCart(), stopFavorites: null, stopCart: null, lastRequestNumber: "", cartBusy: new Set(), infrastructureErrorShown: false
};

const esc = (value="") => String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const icon = (name, className="") => `<svg class="gc-icon ${className}" aria-hidden="true"><use href="icons.svg#${esc(name)}"></use></svg>`;
const norm = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function publicAsset(value) { return String(value || "").replace(/^media\//, ""); }
function productImages(product) {
  const images = Array.isArray(product.images) ? product.images.map(item => publicAsset(typeof item === "string" ? item : item?.url)).filter(Boolean) : [];
  return images.length ? images : [publicAsset(product.image) || "producto-1.jpg"];
}
function normalizeProduct(product) {
  const normalized = {...product};
  normalized.id = String(product.id || "");
  normalized.category = LEGACY_CATEGORIES[product.category] || product.category || "camisetas";
  normalized.sizes = Array.isArray(product.sizes) ? product.sizes : [];
  normalized.images = productImages(product);
  normalized.image = normalized.images[0];
  normalized.active = product.active !== false;
  normalized.condition = String(product.condition || "Muy buen estado");
  normalized.color = String(product.color || "");
  normalized.material = String(product.material || "");
  normalized.measurements = String(product.measurements || "");
  normalized.authenticity = String(product.authenticity || "");
  normalized.unique = product.unique !== false;
  return normalized;
}
function productSignature(products) {
  return JSON.stringify(products.map(product => [product.id,product.name,product.brand,product.category,product.price,product.image,product.badge,product.sizes,product.active,product.createdOrder,product.condition,product.color,product.material,product.measurements,product.authenticity,product.unique]));
}
function readProductCache() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(PRODUCT_CACHE_KEY) || "null");
    return Array.isArray(parsed) ? parsed.map(normalizeProduct) : null;
  } catch { return null; }
}
function writeProductCache(products) {
  try { sessionStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(products)); } catch { /* La web sigue funcionando sin caché. */ }
}
function readAuthHint() {
  try { return JSON.parse(sessionStorage.getItem(AUTH_HINT_KEY) || "null"); } catch { return null; }
}
function writeAuthHint(hint) {
  state.authHint = hint;
  try { sessionStorage.setItem(AUTH_HINT_KEY, JSON.stringify(hint)); } catch { /* La sesión real siempre manda. */ }
}
function numericPrice(value) {
  const raw = String(value ?? "").trim();
  if (!raw || norm(raw) === "consultar") return null;
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") ? cleaned.replace(/\./g, "").replace(",", ".") : /^-?\d{1,3}(\.\d{3})+$/.test(cleaned) ? cleaned.replace(/\./g, "") : cleaned;
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}
function priceBoundary(value) {
  if (String(value ?? "").trim() === "") return null;
  const numeric = numericPrice(value);
  return numeric !== null && numeric >= 0 ? numeric : null;
}
function formatPrice(value) {
  const raw = String(value ?? "").trim();
  const numeric = numericPrice(value);
  if (numeric === null) return raw && norm(raw) !== "consultar" ? raw : "Consultar";
  return new Intl.NumberFormat("es-ES", {style:"currency",currency:"EUR"}).format(numeric);
}
function activeProducts() { return state.products.filter(product => product.active !== false); }
const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
function productTimestamp(product) {
  const value = product?.createdAt;
  if (value) {
    if (typeof value.toDate === "function") { const date = value.toDate(); if (date && !Number.isNaN(date.getTime())) return date.getTime(); }
    if (typeof value.seconds === "number") return value.seconds * 1000;
    if (typeof value._seconds === "number") return value._seconds * 1000;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") { const date = new Date(value); if (!Number.isNaN(date.getTime())) return date.getTime(); }
  }
  const order = Number(product?.createdOrder);
  return Number.isFinite(order) && order > 1e12 ? order : 0;
}
function isRecentProduct(product) {
  const timestamp = productTimestamp(product);
  return timestamp > 0 && Date.now() - timestamp < NEW_WINDOW_MS;
}
function productSearchText(product) { return norm([product.name, product.brand, CATEGORY_LABELS[product.category], product.description, product.sizes.join(" ")].join(" ")); }
function productMatchesPrice(product) {
  if (state.priceMin === null && state.priceMax === null) return true;
  const value = numericPrice(product.price);
  return value !== null && (state.priceMin === null || value >= state.priceMin) && (state.priceMax === null || value <= state.priceMax);
}
function currentFile() { return location.pathname.split("/").pop() || "index.html"; }
function readPendingCart() { try { return JSON.parse(sessionStorage.getItem("gc_pending_cart") || "null"); } catch { return null; } }
function clientNumberFor(user) { return `GC-${String(user?.uid || "CLIENTE").replace(/[^a-z0-9]/gi, "").slice(0,10).toUpperCase()}`; }
function firestoreActionMessage(error, fallback="No se ha podido completar la operación.") {
  const code=String(error?.code||"").toLowerCase(),message=String(error?.message||"").toLowerCase();
  if(code.includes("permission-denied")||message.includes("permission"))return"Firebase ha bloqueado la operación. El administrador debe publicar el archivo firestore.rules incluido con la web.";
  if(code.includes("unavailable")||message.includes("offline")||message.includes("network"))return"No hay conexión con la base de datos. Comprueba Internet e inténtalo de nuevo.";
  return fallback;
}
function showInfrastructureErrorOnce(error,fallback){if(state.infrastructureErrorShown)return;state.infrastructureErrorShown=true;showToast(firestoreActionMessage(error,fallback),"error");}

function initThemeToggle(){
  const saved=localStorage.getItem("gc_theme");
  if(saved==="dark")document.documentElement.setAttribute("data-theme","dark");
  const header=document.querySelector("[data-header]");
  const tools=header?.querySelector(".header-tools");
  if(!tools)return;
  const isDark=document.documentElement.getAttribute("data-theme")==="dark";
  tools.insertAdjacentHTML("afterbegin",`<button class="header-icon theme-toggle" type="button" aria-label="Cambiar tema" title="Modo oscuro">${isDark?"☀️":"🌙"}</button>`);
  tools.querySelector(".theme-toggle")?.addEventListener("click",()=>{
    const dark=document.documentElement.getAttribute("data-theme")==="dark";
    if(dark){document.documentElement.removeAttribute("data-theme");localStorage.setItem("gc_theme","light");}
    else{document.documentElement.setAttribute("data-theme","dark");localStorage.setItem("gc_theme","dark");}
    const btn=tools.querySelector(".theme-toggle");if(btn)btn.textContent=dark?"🌙":"☀️";
  });
}
const RV_KEY="gc_recently_viewed";const RV_MAX=5;
function trackRecentlyViewed(id){if(!id)return;let ids=JSON.parse(sessionStorage.getItem(RV_KEY)||"[]");ids=ids.filter(i=>i!==id);ids.unshift(id);if(ids.length>RV_MAX)ids=ids.slice(0,RV_MAX);sessionStorage.setItem(RV_KEY,JSON.stringify(ids));}
function renderRecentlyViewed(currentId){
  const ids=JSON.parse(sessionStorage.getItem(RV_KEY)||"[]").filter(i=>i!==currentId).slice(0,4);
  if(!ids.length)return"";
  const products=ids.map(id=>state.products.find(p=>p.id===id)).filter(Boolean);
  if(!products.length)return"";
  return products.map(productCard).join("");
}

function initChrome() {
  document.querySelectorAll("[data-year]").forEach(node => node.textContent = new Date().getFullYear());
  const header = document.querySelector("[data-header]");
  const tools = header?.querySelector(".header-tools");
  const favoriteShortcut = tools?.querySelector(".favorite-shortcut");
  const cartShortcut = tools?.querySelector(".cart-shortcut");
  if (favoriteShortcut) favoriteShortcut.innerHTML = `${icon("heart")}<b data-favorite-count>0</b>`;
  if (cartShortcut) cartShortcut.innerHTML = `${icon("bag","cart-icon")}<b data-cart-count>0</b>`;
  if (tools && !tools.querySelector(".search-shortcut")) tools.insertAdjacentHTML("afterbegin", `<a class="header-icon search-shortcut" href="catalogo.html?buscar=1" aria-label="Buscar artículos">${icon("search")}</a>`);
  document.querySelectorAll('.main-nav a[href="carrito.html"]').forEach(link => link.remove());
  const mainNav = document.querySelector("#mainNav");
  mainNav?.querySelectorAll('a[href^="favoritos.html"]').forEach(link => link.remove());
  if (mainNav) {
    const accountNavLink = mainNav.querySelector(".mobile-account-nav");
    const requestedCategory = page === "catalog" ? new URLSearchParams(location.search).get("categoria") : "";
    if (!mainNav.querySelector('a[href="stock.html"]')) {
      const stockLink = document.createElement("a");
      stockLink.href = "stock.html"; stockLink.textContent = "En stock";
      if (page === "stock") stockLink.classList.add("active");
      const afterNovedades = mainNav.querySelector('a[href="novedades.html"]');
      if (afterNovedades) afterNovedades.after(stockLink);
      else mainNav.insertBefore(stockLink, accountNavLink);
    }
    if (page !== "catalog" && !document.querySelector('link[data-prefetch-catalog]')) {
      const prefetch = document.createElement("link");
      prefetch.rel = "prefetch"; prefetch.href = "catalogo.html"; prefetch.setAttribute("data-prefetch-catalog", "");
      document.head.appendChild(prefetch);
    }
    [["camisetas","Camisetas"],["sudaderas","Sudaderas"],["zapatos","Zapatos"],["pantalones","Pantalones"]].forEach(([slug,label]) => {
      const href = `catalogo.html?categoria=${slug}`;
      if (mainNav.querySelector(`a[href="${href}"]`)) return;
      const link = document.createElement("a");
      link.href = href; link.textContent = label; link.className = "nav-shortcut";
      const resolved = CATEGORY_LABELS[slug] ? slug : (LEGACY_CATEGORIES[slug] || slug);
      if (requestedCategory === slug || (page === "catalog" && requestedCategory === resolved)) link.classList.add("active");
      if (page === "catalog") link.addEventListener("click", event => {
        event.preventDefault();
        state.selectedCategory = resolved;
        state.selectedBrands.clear(); state.priceMin = null; state.priceMax = null;
        const search = document.querySelector("#catalogSearch"); if (search) search.value = "";
        mainNav.querySelectorAll(".nav-shortcut").forEach(other => other.classList.toggle("active", other === link));
        renderBrandOptions(); renderCatalog();
        document.querySelector("#mainContent")?.scrollIntoView({ behavior: "smooth", block: "start" });
        mainNav.classList.remove("open");
        document.body.classList.remove("nav-open");
        document.querySelector(".nav-toggle")?.setAttribute("aria-expanded", "false");
      });
      mainNav.insertBefore(link, accountNavLink);
    });
  }
  if (mainNav && !mainNav.querySelector(".mobile-account-nav")) mainNav.insertAdjacentHTML("beforeend", '<a class="mobile-account-nav" data-account-link href="cuenta.html"><span data-account-label>Iniciar sesión</span></a>');
  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 28);
  updateHeader();
  window.addEventListener("scroll", updateHeader, {passive:true});
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#mainNav");
  const setNav = open => {
    nav?.classList.toggle("open", open);
    toggle?.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
  };
  toggle?.addEventListener("click", () => setNav(!nav.classList.contains("open")));
  nav?.addEventListener("click", event => { if (event.target.closest("a")) setNav(false); });
  document.addEventListener("click", event => {
    if (nav?.classList.contains("open") && !event.target.closest("#mainNav") && !event.target.closest(".nav-toggle")) setNav(false);
  });
  window.addEventListener("keydown", event => { if (event.key === "Escape" && nav?.classList.contains("open")) setNav(false); });
  document.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) { event.preventDefault(); event.stopPropagation(); toggleFavorite(favoriteButton.dataset.favorite); return; }
    const authButton = event.target.closest("[data-open-auth]");
    if (authButton) { event.preventDefault(); openAuthModal(authButton.dataset.openAuth || "login"); return; }
    const cartButton = event.target.closest("[data-cart]");
    if (cartButton) { event.preventDefault(); event.stopPropagation(); const size=cartButton.hasAttribute("data-cart-detail") ? document.querySelector("#detailSize")?.value || "" : ""; addToCart(cartButton.dataset.cart,size,cartButton.hasAttribute("data-cart-detail")); return; }
    const quickViewButton = event.target.closest("[data-quick-view]");
    if (quickViewButton) { event.preventDefault(); event.stopPropagation(); openQuickView(quickViewButton.dataset.quickView); return; }
    const logoutButton = event.target.closest("[data-logout]");
    if (logoutButton) { event.preventDefault(); logoutToStore(); }
  });
  injectAuthModal();
  enhanceFooter();
  initRevealMotion();
  initThemeToggle();
  initHowCarousel();
  initInstallPrompt();
  if (page === "catalog" && (new URLSearchParams(location.search).has("buscar") || location.hash === "#catalogSearch")) setTimeout(() => document.querySelector("#catalogSearch")?.focus(), 250);
}

function initHowCarousel() {
  const carousel = document.querySelector("#howCarousel");
  const track = carousel?.querySelector(".how-track");
  if (!carousel || !track || track.dataset.ready) return;
  track.dataset.ready = "1";
  [...track.children].forEach(node => {
    const clone = node.cloneNode(true);
    clone.setAttribute("aria-hidden", "true");
    clone.tabIndex = -1;
    track.appendChild(clone);
  });

  let lit = "";
  track.addEventListener("click", event => {
    const step = event.target.closest(".how-step");
    if (!step) return;
    lit = lit === step.dataset.step ? "" : step.dataset.step;
    track.querySelectorAll(".how-step").forEach(node => {
      const on = lit && node.dataset.step === lit;
      node.classList.toggle("lit", Boolean(on));
      if (!node.hasAttribute("aria-hidden")) node.setAttribute("aria-pressed", String(Boolean(on)));
    });
  });

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let pauseUntil = 0;
  ["pointerdown", "touchstart", "wheel", "keydown"].forEach(type =>
    carousel.addEventListener(type, () => { pauseUntil = performance.now() + 2600; }, { passive: true }));

  const half = () => track.scrollWidth / 2;
  const frame = now => {
    const span = half();
    if (span > 0) {
      const moving = !reduce && !document.hidden && !lit && now > pauseUntil && !(carousel.matches && carousel.matches(":hover"));
      if (moving) carousel.scrollLeft += 0.6;
      if (carousel.scrollLeft >= span) carousel.scrollLeft -= span;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function enhanceFooter() {
  const footer = document.querySelector(".site-footer");
  if (!footer || footer.querySelector(".footer-process")) return;
  const copy = footer.querySelector(".footer-copy");
  copy?.insertAdjacentHTML("beforebegin", `<div class="footer-process"><h3>Cómo funciona</h3><p>Añade tus piezas al carrito y envía una solicitud. Revisaremos la selección y recibirás una oferta personalizada por WhatsApp.</p><span>${icon("whatsapp")} Sin pagos en la web</span></div>`);
}

function initRevealMotion() {
  const elements = [...document.querySelectorAll("[data-reveal], .selection, .manifesto, .listing-heading")];
  if (!elements.length) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { elements.forEach(node => node.classList.add("is-visible")); return; }
  elements.forEach(node => node.classList.add("reveal-section"));
  const reveal = node => { node.classList.add("is-visible"); observer.unobserve(node); };
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); }), {threshold:.08});
  elements.forEach(node => observer.observe(node));
  const sweep = () => elements.forEach(node => { if (!node.classList.contains("is-visible") && node.getBoundingClientRect().top < (window.innerHeight || 0) * 0.92) reveal(node); });
  requestAnimationFrame(sweep);
  window.addEventListener("scroll", sweep, { passive: true });
  setTimeout(() => elements.forEach(node => node.classList.add("is-visible")), 2500);
}

function productCard(product) {
  const liked = state.favorites.has(product.id);
  const href = `articulo.html?id=${encodeURIComponent(product.id)}`;
  return `<article class="product-card" data-product-id="${esc(product.id)}">
    <a class="product-card-link" href="${href}" aria-label="Ver ${esc(product.name)}"></a>
    <div class="product-media"><img src="${esc(product.image)}" alt="${esc(product.name)}" loading="lazy" decoding="async" onload="this.classList.add('loaded')" onerror="this.classList.add('loaded');this.src='producto-1.jpg'">
      ${Number(product.stock) > 0 ? `<span class="product-badge in-stock">EN STOCK</span>` : product.badge ? `<span class="product-badge">${esc(product.badge)}</span>` : ""}
      <button class="quick-view-button" data-quick-view="${esc(product.id)}" type="button" aria-label="Vista rápida de ${esc(product.name)}">${icon("eye")}<span>Vista rápida</span></button>
      <button class="heart-button ${liked ? "liked" : ""}" data-favorite="${esc(product.id)}" type="button" aria-label="${liked ? "Quitar de favoritos" : "Guardar en favoritos"}">${icon(liked ? "heart-filled" : "heart")}</button>
    </div>
    <div class="product-card-info"><h3>${esc(product.name)}</h3><strong class="card-price">${esc(formatPrice(product.price))}</strong>
      <div class="product-meta"><span>${esc(product.brand || "GinesCloset")}</span><small>${esc(product.condition || "Muy buen estado")}</small></div>
    </div></article>`;
}

function productLoadingMarkup(count=6) {
  return Array.from({length:count},(_,index)=>`<article class="product-card product-skeleton" aria-hidden="true"><div class="product-media"></div><div class="product-card-info"><i></i><b></b><span></span></div></article>`).join("");
}

function renderHeader() {
  document.querySelectorAll("[data-favorite-count]").forEach(node => { node.textContent = state.favorites.size; node.classList.toggle("count-pending", !state.favoritesReady); });
  document.querySelectorAll("[data-cart-count]").forEach(node => { node.textContent = state.cart.size; node.classList.toggle("count-pending", !state.cartReady); });
  document.querySelectorAll("[data-account-link]").forEach(link => {
    const label = link.querySelector("[data-account-label]");
    if (!state.authReady && state.authHint) { link.href = state.authHint.role === "admin" ? "admin.html" : "cuenta.html"; if (label) label.textContent = state.authHint.label || (state.authHint.signedIn ? "Mi cuenta" : "Iniciar sesión"); }
    else if (state.user && state.role === "admin") { link.href = "admin.html"; if (label) label.textContent = "Gestionar catálogo"; }
    else if (state.user) { link.href = "cuenta.html"; if (label) label.textContent = state.profile.name || state.user.displayName || "Mi cuenta"; }
    else { link.href = "cuenta.html"; if (label) label.textContent = "Iniciar sesión"; }
  });
  document.documentElement.classList.toggle("gc-auth-pending", !state.authReady && !state.authHint);
}

function syncProductActions() {
  document.querySelectorAll("[data-favorite]").forEach(button => {
    const liked = state.favorites.has(button.dataset.favorite);
    button.classList.toggle("liked", liked);
    button.setAttribute("aria-label", liked ? "Quitar de favoritos" : "Guardar en favoritos");
    button.innerHTML = button.classList.contains("detail-heart") ? `${icon(liked ? "heart-filled" : "heart")} ${liked ? "Guardado en favoritos" : "Guardar en favoritos"}` : icon(liked ? "heart-filled" : "heart");
  });
  document.querySelectorAll("[data-cart]").forEach(button => {
    const added = state.cart.has(button.dataset.cart);
    button.classList.toggle("added", added);
    button.textContent = button.closest(".mobile-add-bar") ? (added ? "EN EL CARRITO" : "AÑADIR") : button.hasAttribute("data-cart-detail") ? (added ? "✓ Artículo en el carrito" : "＋ Añadir al carrito") : (added ? "✓ Añadido" : "＋ Carrito");
  });
}

function renderUserState() {
  renderHeader();
  syncProductActions();
  if (page === "favorites") renderFavorites();
  if (page === "cart") renderCart();
  if (page === "account") renderAccount();
}

function renderPage() {
  renderHeader();
  const featured = document.querySelector("#homeFeatured");
  if (featured) {
    const products = activeProducts().slice(0,3);
    featured.innerHTML = !state.productsReady ? productLoadingMarkup(3) : products.length ? products.map(productCard).join("") : '<div class="collection-empty"><p class="kicker blue">PRÓXIMAMENTE</p><h3>Estamos preparando la nueva selección.</h3><a href="novedades.html">Ver novedades →</a></div>';
  }
  if (document.querySelector("#homeStats")) renderHomeExtras();
  if (page === "catalog") renderCatalog();
  if (page === "new") renderNewProducts();
  if (page === "stock") renderStockPage();
  if (page === "favorites") renderFavorites();
  if (page === "cart") renderCart();
  if (page === "product") renderProductDetail();
  if (page === "account") renderAccount();
}

function animateCount(node, target) {
  const final = Number(target) || 0;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) { node.textContent = final.toLocaleString("es-ES"); return; }
  const duration = 1100, start = performance.now();
  const tick = now => {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    node.textContent = Math.round(final * eased).toLocaleString("es-ES");
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function renderHomeExtras() {
  if (!state.productsReady) return;
  const items = activeProducts();
  document.querySelectorAll("#homeCategories [data-cat-count]").forEach(node => {
    node.textContent = items.filter(product => product.category === node.dataset.catCount).length;
  });
  const stats = document.querySelector("#homeStats");
  if (!stats || state.homeStatsStarted) return;
  const run = () => {
    if (state.homeStatsStarted) return;
    state.homeStatsStarted = true;
    const current = activeProducts();
    const values = {
      products: current.length,
      brands: new Set(current.map(product => product.brand).filter(Boolean)).size,
      fresh: current.filter(isRecentProduct).length
    };
    stats.querySelectorAll("[data-count-key]").forEach(node => animateCount(node, values[node.dataset.countKey]));
  };
  const inView = () => {
    const rect = stats.getBoundingClientRect();
    return rect.top < (window.innerHeight || 0) * 0.9 && rect.bottom > 0;
  };
  if (inView() || !("IntersectionObserver" in window)) { run(); return; }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); run(); }
  }, { threshold: 0, rootMargin: "0px 0px -10% 0px" });
  observer.observe(stats);
  const onScroll = () => { if (inView()) { window.removeEventListener("scroll", onScroll); observer.disconnect(); run(); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  setTimeout(run, 4000);
}

function initCatalog() {
  const search = document.querySelector("#catalogSearch");
  if (!search) return;
  const params = new URLSearchParams(location.search);
  const categorySlugs = ["all", ...CATEGORIES.map(item => item[0])];
  let requestedCategory = params.get("categoria") || "all";
  if (!categorySlugs.includes(requestedCategory)) requestedCategory = LEGACY_CATEGORIES[requestedCategory] || "all";
  state.selectedCategory = categorySlugs.includes(requestedCategory) ? requestedCategory : "all";
  (params.get("marcas") || "").split("|").filter(brand => BRANDS.includes(brand)).forEach(brand => state.selectedBrands.add(brand));
  state.priceMin = priceBoundary(params.get("precioMin"));
  state.priceMax = priceBoundary(params.get("precioMax"));
  search.value = params.get("q") || "";
  const priceMinInput = document.querySelector("#priceMin"), priceMaxInput = document.querySelector("#priceMax");
  if (priceMinInput) priceMinInput.value = state.priceMin ?? "";
  if (priceMaxInput) priceMaxInput.value = state.priceMax ?? "";
  document.querySelectorAll("[data-category]").forEach(button => {
    button.classList.toggle("active", button.dataset.category === state.selectedCategory);
    button.addEventListener("click", () => { state.selectedCategory = button.dataset.category; renderCatalog(); renderBrandOptions(); });
  });
  search.addEventListener("input", renderCatalog);
  search.addEventListener("keydown", event => { if (event.key === "Escape") { search.value = ""; renderCatalog(); } });
  document.querySelector("#catalogSort")?.addEventListener("change", renderCatalog);
  document.querySelector("#brandSearch")?.addEventListener("input", renderBrandOptions);
  priceMinInput?.addEventListener("input", () => { state.priceMin = priceBoundary(priceMinInput.value); renderCatalog(); });
  priceMaxInput?.addEventListener("input", () => { state.priceMax = priceBoundary(priceMaxInput.value); renderCatalog(); });
  document.querySelectorAll("[data-price-min]").forEach(button => button.addEventListener("click", () => {
    const nextMin = priceBoundary(button.dataset.priceMin), nextMax = priceBoundary(button.dataset.priceMax);
    const alreadySelected = state.priceMin === nextMin && state.priceMax === nextMax;
    state.priceMin = alreadySelected ? null : nextMin;
    state.priceMax = alreadySelected ? null : nextMax;
    renderCatalog();
  }));
  document.querySelector("#clearFilters")?.addEventListener("click", clearFilters);
  document.querySelector("#emptyClear")?.addEventListener("click", clearFilters);
  document.querySelector("#mobileFilterToggle")?.addEventListener("click", event => {
    const panel = document.querySelector("#catalogFilters");
    const open = panel.classList.toggle("open");
    event.currentTarget.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("catalog-filter-open", open);
  });
  document.querySelector("#closeFilters")?.addEventListener("click", () => {
    document.querySelector("#catalogFilters")?.classList.remove("open");
    document.querySelector("#mobileFilterToggle")?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("catalog-filter-open");
  });
  renderBrandOptions();
}

function renderBrandOptions() {
  const root = document.querySelector("#brandOptions"); if (!root) return;
  const term = norm(document.querySelector("#brandSearch")?.value);
  const brands = BRANDS.filter(brand => norm(brand).includes(term));
  root.innerHTML = brands.length ? brands.map(brand => {
    const selected = state.selectedBrands.has(brand);
    const initials = brand.split(/[\s&()-]+/).filter(Boolean).slice(0,2).map(part => part[0]).join("").toUpperCase();
    return `<label class="brand-option ${selected ? "selected" : ""}" data-brand-name="${esc(brand)}"><input type="checkbox" value="${esc(brand)}" ${selected ? "checked" : ""}><span class="initials">${esc(initials)}</span><span class="name">${esc(brand)}</span><em class="brand-count">0</em><i class="check">✓</i></label>`;
  }).join("") : '<p class="brand-no-results">No hay marcas con ese nombre.</p>';
  root.querySelectorAll("input").forEach(input => input.addEventListener("change", () => {
    input.checked ? state.selectedBrands.add(input.value) : state.selectedBrands.delete(input.value);
    renderBrandOptions(); renderCatalog();
  }));
  const count = document.querySelector("#brandSelectedCount");
  if (count) count.textContent = `${state.selectedBrands.size} seleccionada${state.selectedBrands.size === 1 ? "" : "s"}`;
  renderFilterMetadata(norm(document.querySelector("#catalogSearch")?.value));
}

function detectCategoryInSearch(rawTerm) {
  const term = norm(rawTerm).trim().replace(/\s+/g, " ");
  if (term.length < 3) return null;
  const candidates = [];
  CATEGORIES.forEach(([slug, label]) => {
    const base = norm(label);
    const forms = new Set([base, base.replace(/-/g, " ")]);
    if (base.endsWith("s")) forms.add(base.slice(0, -1));
    forms.forEach(form => { if (form) candidates.push([slug, form]); });
  });
  Object.entries(LEGACY_CATEGORIES).forEach(([alias, slug]) => candidates.push([slug, norm(alias)]));
  for (const [slug, form] of candidates) if (term === form) return { slug, rest: "" };
  for (const [slug, form] of candidates) if (term.startsWith(form + " ")) return { slug, rest: term.slice(form.length).trim() };
  for (const [slug, form] of candidates) if (form.startsWith(term) && term.length >= 4) return { slug, rest: "" };
  return null;
}

function renderCatalog() {
  const grid = document.querySelector("#catalogGrid"); if (!grid) return;
  if (!state.productsReady) {
    grid.innerHTML = productLoadingMarkup(6); grid.classList.remove("hidden"); grid.classList.add("is-loading");
    document.querySelector("#catalogEmpty")?.classList.add("hidden");
    document.querySelectorAll("[data-category-count],.brand-count").forEach(node=>node.classList.add("count-pending"));
    ["#resultCount","#filterLiveResult","#filterApplyCount"].forEach(selector => { const node=document.querySelector(selector); if(node)node.textContent="—"; });
    return;
  }
  grid.classList.remove("is-loading");
  const search = document.querySelector("#catalogSearch");
  const rawTerm = search?.value || "";
  let term = norm(rawTerm);
  let effectiveCategory = state.selectedCategory;
  let searchCategory = "";
  if (state.selectedCategory === "all") {
    const hit = detectCategoryInSearch(rawTerm);
    if (hit) { effectiveCategory = hit.slug; searchCategory = hit.slug; term = norm(hit.rest); }
  }
  document.querySelectorAll("[data-category]").forEach(button => button.classList.toggle("active", button.dataset.category === effectiveCategory));
  const sort = document.querySelector("#catalogSort")?.value || "newest";
  let products = activeProducts().filter(product => {
    return (!term || productSearchText(product).includes(term)) && (effectiveCategory === "all" || product.category === effectiveCategory) && (!state.selectedBrands.size || state.selectedBrands.has(product.brand)) && productMatchesPrice(product);
  });
  if (sort === "name") products.sort((a,b) => a.name.localeCompare(b.name,"es"));
  else if (sort.startsWith("price")) products.sort((a,b) => {
    const one = numericPrice(a.price), two = numericPrice(b.price);
    if (one === null && two === null) return 0;
    if (one === null) return 1;
    if (two === null) return -1;
    return sort === "price-low" ? one-two : two-one;
  }); else products.sort((a,b) => Number(b.createdOrder || 0) - Number(a.createdOrder || 0));
  grid.innerHTML = products.map(productCard).join("");
  grid.classList.toggle("hidden", !products.length);
  document.querySelector("#catalogEmpty")?.classList.toggle("hidden", Boolean(products.length));
  const result = document.querySelector("#resultCount"); if (result) result.textContent = products.length;
  const liveResult = document.querySelector("#filterLiveResult"); if (liveResult) liveResult.textContent = products.length;
  const applyResult = document.querySelector("#filterApplyCount"); if (applyResult) applyResult.textContent = products.length;
  renderFilterMetadata(term);
  const resultNote = document.querySelector(".catalog-result-line span");
  if (resultNote) resultNote.textContent = searchCategory ? `Categoría «${CATEGORY_LABELS[searchCategory]}» detectada en tu búsqueda` : "Selección actualizada al instante";
  const categoryStatus = document.querySelector("#categoryFilterStatus");
  if (categoryStatus && searchCategory) categoryStatus.textContent = CATEGORY_LABELS[searchCategory];
  renderPriceControls();
  renderActiveChips(term);
}

function renderFilterMetadata(term) {
  const categoryBase = activeProducts().filter(product => (!term || productSearchText(product).includes(term)) && (!state.selectedBrands.size || state.selectedBrands.has(product.brand)) && productMatchesPrice(product));
  document.querySelectorAll("[data-category]").forEach(button => {
    const category = button.dataset.category;
    const count = category === "all" ? categoryBase.length : categoryBase.filter(product => product.category === category).length;
    const badge = button.querySelector("[data-category-count]");
    if (badge) { badge.textContent = count; badge.classList.remove("count-pending"); }
  });
  const categoryStatus = document.querySelector("#categoryFilterStatus");
  if (categoryStatus) categoryStatus.textContent = state.selectedCategory === "all" ? "Todas" : CATEGORY_LABELS[state.selectedCategory] || "Categoría";

  const brandBase = activeProducts().filter(product => (!term || productSearchText(product).includes(term)) && (state.selectedCategory === "all" || product.category === state.selectedCategory) && productMatchesPrice(product));
  document.querySelectorAll(".brand-option[data-brand-name]").forEach(option => {
    const brand = option.dataset.brandName;
    const count = brandBase.filter(product => product.brand === brand).length;
    const badge = option.querySelector(".brand-count");
    if (badge) { badge.textContent = count; badge.classList.remove("count-pending"); }
    option.classList.toggle("unavailable", count === 0 && !state.selectedBrands.has(brand));
  });
}

function renderPriceControls() {
  const minInput = document.querySelector("#priceMin"), maxInput = document.querySelector("#priceMax");
  if (minInput && document.activeElement !== minInput) minInput.value = state.priceMin ?? "";
  if (maxInput && document.activeElement !== maxInput) maxInput.value = state.priceMax ?? "";
  document.querySelectorAll("[data-price-min]").forEach(button => {
    const active = state.priceMin === priceBoundary(button.dataset.priceMin) && state.priceMax === priceBoundary(button.dataset.priceMax);
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  const status = document.querySelector("#priceFilterStatus");
  if (status) status.textContent = state.priceMin !== null && state.priceMax !== null ? `${state.priceMin}–${state.priceMax} €` : state.priceMin !== null ? `Desde ${state.priceMin} €` : state.priceMax !== null ? `Hasta ${state.priceMax} €` : "Cualquier precio";
}

function renderActiveChips(term) {
  const chips = [];
  if (state.selectedCategory !== "all") chips.push({type:"category",value:state.selectedCategory,label:CATEGORY_LABELS[state.selectedCategory]});
  state.selectedBrands.forEach(brand => chips.push({type:"brand",value:brand,label:brand}));
  if (state.priceMin !== null || state.priceMax !== null) chips.push({type:"price",value:"",label:state.priceMin !== null && state.priceMax !== null ? `${state.priceMin}–${state.priceMax} €` : state.priceMin !== null ? `Desde ${state.priceMin} €` : `Hasta ${state.priceMax} €`});
  if (term) chips.push({type:"search",value:"",label:`“${document.querySelector("#catalogSearch")?.value}”`});
  const root = document.querySelector("#activeChips");
  if (root) {
    root.innerHTML = chips.map(chip => `<button type="button" data-remove-filter="${chip.type}" data-value="${esc(chip.value)}">${esc(chip.label)} ×</button>`).join("");
    root.querySelectorAll("button").forEach(button => button.addEventListener("click", () => {
      const type = button.dataset.removeFilter;
      if (type === "brand") state.selectedBrands.delete(button.dataset.value);
      if (type === "category") state.selectedCategory = "all";
      if (type === "price") { state.priceMin = null; state.priceMax = null; }
      if (type === "search") document.querySelector("#catalogSearch").value = "";
      renderBrandOptions(); renderCatalog();
    }));
  }
  const activeCount = document.querySelector("#activeFilterCount"); if (activeCount) activeCount.textContent = `${chips.length} activo${chips.length === 1 ? "" : "s"}`;
  const mobileCount = document.querySelector("#mobileFilterCount"); if (mobileCount) mobileCount.textContent = chips.length;
  const params = new URLSearchParams();
  if (document.querySelector("#catalogSearch")?.value) params.set("q", document.querySelector("#catalogSearch").value);
  if (state.selectedCategory !== "all") params.set("categoria", state.selectedCategory);
  if (state.selectedBrands.size) params.set("marcas", [...state.selectedBrands].join("|"));
  if (state.priceMin !== null) params.set("precioMin", String(state.priceMin));
  if (state.priceMax !== null) params.set("precioMax", String(state.priceMax));
  history.replaceState(null, "", `${location.pathname}${params.size ? `?${params}` : ""}`);
}

function clearFilters() {
  state.selectedBrands.clear(); state.selectedCategory = "all"; state.priceMin = null; state.priceMax = null;
  const search = document.querySelector("#catalogSearch"); if (search) search.value = "";
  const brandSearch = document.querySelector("#brandSearch"); if (brandSearch) brandSearch.value = "";
  renderBrandOptions(); renderCatalog();
}

function initNew() {
  document.querySelector("#newSearch")?.addEventListener("input", renderNewProducts);
  document.querySelectorAll("[data-new-category]").forEach(button => button.addEventListener("click", () => { state.newCategory = button.dataset.newCategory; renderNewProducts(); }));
  document.querySelector("#newClear")?.addEventListener("click", () => { state.newCategory = "all"; document.querySelector("#newSearch").value = ""; renderNewProducts(); });
}
function renderNewProducts() {
  const grid = document.querySelector("#newProductGrid"); if (!grid) return;
  if (!state.productsReady) {
    grid.innerHTML=productLoadingMarkup(8);grid.classList.remove("hidden");grid.classList.add("is-loading");
    document.querySelector("#newEmpty")?.classList.add("hidden");const count=document.querySelector("#newResultCount");if(count)count.textContent="—";return;
  }
  grid.classList.remove("is-loading");
  const term = norm(document.querySelector("#newSearch")?.value);
  const recent = activeProducts().filter(isRecentProduct).sort((a,b) => productTimestamp(b) - productTimestamp(a));
  const products = recent.filter(product => (!term || norm([product.name,product.brand,product.description].join(" ")).includes(term)) && (state.newCategory === "all" || product.category === state.newCategory));
  document.querySelectorAll("[data-new-category]").forEach(button => button.classList.toggle("active", button.dataset.newCategory === state.newCategory));
  grid.innerHTML = products.map(productCard).join(""); grid.classList.toggle("hidden", !products.length);
  const empty = document.querySelector("#newEmpty");
  if (empty) {
    empty.classList.toggle("hidden", Boolean(products.length));
    const nothingThisWeek = !recent.length;
    const heading = empty.querySelector("h2"), copy = empty.querySelector("p");
    if (heading) heading.textContent = nothingThisWeek ? "Esta semana no hay novedades" : "No hay novedades con ese filtro";
    if (copy) copy.textContent = nothingThisWeek ? "Aquí solo aparecen las piezas subidas en los últimos 7 días. Vuelve pronto." : "Prueba con otra búsqueda o vuelve a mostrarlo todo.";
  }
  const count = document.querySelector("#newResultCount"); if (count) count.textContent = products.length;
}

function inStockProducts() { return activeProducts().filter(product => Number(product.stock) > 0); }
function initStockPage() { document.querySelector("#stockSearch")?.addEventListener("input", renderStockPage); }
function renderStockPage() {
  const grid = document.querySelector("#stockGrid"); if (!grid) return;
  if (!state.productsReady) {
    grid.innerHTML = productLoadingMarkup(8); grid.classList.remove("hidden"); grid.classList.add("is-loading");
    document.querySelector("#stockEmpty")?.classList.add("hidden");
    const count = document.querySelector("#stockResultCount"); if (count) count.textContent = "—";
    return;
  }
  grid.classList.remove("is-loading");
  const term = norm(document.querySelector("#stockSearch")?.value);
  const available = inStockProducts().sort((a,b) => productTimestamp(b) - productTimestamp(a));
  const products = available.filter(product => !term || productSearchText(product).includes(term));
  grid.innerHTML = products.map(productCard).join(""); grid.classList.toggle("hidden", !products.length);
  const empty = document.querySelector("#stockEmpty");
  if (empty) {
    empty.classList.toggle("hidden", Boolean(products.length));
    const noStock = !available.length;
    const heading = empty.querySelector("h2"), copy = empty.querySelector("p");
    if (heading) heading.textContent = noStock ? "Ahora mismo no hay piezas en stock" : "No hay resultados con esa búsqueda";
    if (copy) copy.textContent = noStock ? "Todo el catálogo funciona por encargo. Prepara tu carrito y te pasamos una oferta." : "Prueba con otro nombre o marca.";
  }
  const count = document.querySelector("#stockResultCount"); if (count) count.textContent = products.length;
}

function initInstallPrompt() {
  const section = document.querySelector("#homeInstall");
  if (!section) return;
  const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  if (installed) { section.classList.add("hidden"); return; }
  const button = document.querySelector("#installAppBtn");
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    button?.classList.remove("hidden");
  });
  button?.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    deferredPrompt = null;
    button.classList.add("hidden");
  });
  window.addEventListener("appinstalled", () => section.classList.add("hidden"));
}

function initJerseyExamples() {
  const grid = document.querySelector("#jerseyExamplesGrid");
  const section = document.querySelector("#jerseyExamplesSection");
  if (!grid || !section) return;
  onSnapshot(collection(db, "jerseyExamples"), snapshot => {
    const examples = snapshot.docs.map(item => ({ id: item.id, ...item.data() }))
      .sort((a, b) => Number(b.createdAt?.seconds || 0) - Number(a.createdAt?.seconds || 0));
    if (!examples.length) { section.classList.add("hidden"); return; }
    section.classList.remove("hidden");
    grid.innerHTML = examples.map(example => `<figure class="jersey-example"><img src="${esc(example.image || "producto-1.jpg")}" alt="${esc(example.name || "Ejemplo de camiseta de fútbol")}" loading="lazy" decoding="async" onerror="this.src='producto-1.jpg'">${example.name ? `<figcaption>${esc(example.name)}</figcaption>` : ""}</figure>`).join("");
  }, error => { console.error(error); section.classList.add("hidden"); });
}

function initFavorites() { document.querySelector("#favoritesSearch")?.addEventListener("input", renderFavorites); }
function renderFavorites() {
  const gate = document.querySelector("#favoritesGate"), tools = document.querySelector("#favoritesTools"), grid = document.querySelector("#favoritesGrid"), empty = document.querySelector("#favoritesEmpty");
  if (!grid) return;
  if (!state.authReady || (state.user && !state.favoritesReady) || !state.productsReady) { gate.classList.add("hidden");tools.classList.add("hidden");empty.classList.add("hidden");grid.innerHTML=productLoadingMarkup(6);grid.classList.remove("hidden");grid.classList.add("is-loading");return; }
  grid.classList.remove("is-loading");
  if (!state.user) { gate.classList.remove("hidden"); tools.classList.add("hidden"); grid.classList.add("hidden"); empty.classList.add("hidden"); return; }
  gate.classList.add("hidden"); tools.classList.remove("hidden");
  const term = norm(document.querySelector("#favoritesSearch")?.value);
  const products = activeProducts().filter(product => state.favorites.has(product.id) && (!term || norm([product.name,product.brand,CATEGORY_LABELS[product.category]].join(" ")).includes(term)));
  grid.innerHTML = products.map(productCard).join(""); grid.classList.toggle("hidden", !products.length);
  empty.classList.toggle("hidden", Boolean(products.length) || Boolean(term));
  const count = document.querySelector("#favoritesResultCount"); if (count) count.textContent = products.length;
}

function renderProductDetail() {
  const root = document.querySelector("#productDetail"); if (!root || !state.productsReady) return;
  const id = new URLSearchParams(location.search).get("id");
  const product = activeProducts().find(item => item.id === id);
  if (!product) { root.innerHTML = '<div class="empty-state"><span>◇</span><h2>Este artículo no está disponible</h2><p>Puede haber sido retirado o el enlace no es correcto.</p><a class="button button-primary" href="catalogo.html">Volver al catálogo</a></div>'; return; }
  trackRecentlyViewed(product.id);
  document.title = `${product.name} | GinesCloset`;
  const images = productImages(product), liked = state.favorites.has(product.id);
  root.innerHTML = `<article class="product-detail"><div class="product-gallery"><div class="product-thumbs">${images.map((image,index) => `<button class="product-thumb ${index===0?"active":""}" type="button" data-detail-index="${index}" aria-label="Mostrar imagen ${index+1}"><img src="${esc(image)}" alt="Vista ${index+1} de ${esc(product.name)}" onerror="this.src='producto-1.jpg'"></button>`).join("")}</div><div class="product-main-image" id="detailImageStage"><img id="detailMainImage" src="${esc(images[0])}" alt="${esc(product.name)}" onerror="this.src='producto-1.jpg'"><button class="gallery-zoom" data-product-zoom type="button" aria-label="Ampliar fotografía">${icon("zoom")}</button>${images.length>1?`<button class="gallery-arrow previous" data-gallery-previous type="button" aria-label="Fotografía anterior">←</button><button class="gallery-arrow next" data-gallery-next type="button" aria-label="Fotografía siguiente">→</button>`:""}<span class="gallery-count" id="galleryCount">1 / ${images.length}</span></div></div>
    <div class="product-detail-info"><p class="product-breadcrumb"><a href="catalogo.html">Catálogo</a> · ${esc(CATEGORY_LABELS[product.category] || "Selección")}</p><p class="kicker blue">${esc(product.brand || "GINESCLOSET")}</p><h1>${esc(product.name)}</h1><div class="detail-price-row"><strong class="detail-price">${esc(formatPrice(product.price))}</strong>${Number(product.stock) > 0 ? '<span class="detail-stock-chip">EN STOCK</span>' : ""}${product.unique?'<span>PIEZA ÚNICA</span>':""}</div><p class="detail-condition">${esc(product.condition || "Muy buen estado")}</p><p class="detail-description">${esc(product.description || "Una pieza seleccionada por GinesCloset.")}</p>
      <label class="size-select-field"><span>Seleccionar talla</span><select id="detailSize"><option value="">Elige una talla</option>${product.sizes.map(size => `<option>${esc(size)}</option>`).join("")}</select></label>
      ${productDetailsMarkup(product)}
      <div class="offer-explainer${Number(product.stock) > 0 ? " in-stock" : ""}">${icon("whatsapp")}<div><b>${Number(product.stock) > 0 ? "Disponible ahora · entrega inmediata" : "Recibe una oferta por WhatsApp"}</b><span>${Number(product.stock) > 0 ? "Esta pieza ya está en stock. Añádela al carrito y envía tu solicitud: no va por encargo." : "Añade la pieza al carrito y envía tu solicitud. No se realiza ningún pago en la web."}</span></div></div>
      <div class="detail-actions"><button class="button button-primary" data-cart="${esc(product.id)}" data-cart-detail type="button">${state.cart.has(product.id)?"✓ Artículo en el carrito":"＋ Añadir al carrito"}</button><button class="detail-heart ${liked?"liked":""}" data-favorite="${esc(product.id)}" type="button">${icon(liked?"heart-filled":"heart")} ${liked?"Guardado en favoritos":"Guardar en favoritos"}</button></div></div></article>
      <div class="mobile-add-bar"><div><small>${esc(product.brand || "GINESCLOSET")}</small><strong>${esc(formatPrice(product.price))}</strong></div><button class="button button-primary" data-cart="${esc(product.id)}" data-cart-detail type="button">${state.cart.has(product.id)?"EN EL CARRITO":"AÑADIR"}</button></div>`;
  let currentImage = 0;
  const showImage = nextIndex => { currentImage = (nextIndex + images.length) % images.length; const main = root.querySelector("#detailMainImage"); main.src = images[currentImage]; main.alt = `Vista ${currentImage+1} de ${product.name}`; root.querySelectorAll("[data-detail-index]").forEach(button => button.classList.toggle("active", Number(button.dataset.detailIndex) === currentImage)); root.querySelector("#galleryCount").textContent = `${currentImage+1} / ${images.length}`; };
  root.querySelectorAll("[data-detail-index]").forEach(button => button.addEventListener("click", () => showImage(Number(button.dataset.detailIndex))));
  root.querySelector("[data-gallery-previous]")?.addEventListener("click", () => showImage(currentImage-1));
  root.querySelector("[data-gallery-next]")?.addEventListener("click", () => showImage(currentImage+1));
  root.querySelector("[data-product-zoom]")?.addEventListener("click", () => openProductZoom(images[currentImage], product.name));
  const stage = root.querySelector("#detailImageStage"); let touchStart = 0;
  stage?.addEventListener("touchstart", event => { touchStart = event.changedTouches[0].clientX; }, {passive:true});
  stage?.addEventListener("touchend", event => { const distance = event.changedTouches[0].clientX-touchStart; if (Math.abs(distance)>45) showImage(currentImage+(distance<0?1:-1)); }, {passive:true});
  const related = activeProducts().filter(item => item.id !== product.id && (item.category === product.category || item.brand === product.brand)).slice(0,3);
  const relatedRoot = document.querySelector("#relatedProducts"), section = document.querySelector("#relatedSection");
  if (related.length) { relatedRoot.innerHTML = related.map(productCard).join(""); section.classList.remove("hidden"); } else section.classList.add("hidden");
  const rvSection = document.querySelector("#recentlyViewedSection");
  if (rvSection) { const rvHtml = renderRecentlyViewed(product.id); if (rvHtml) { rvSection.innerHTML = `<section class="recently-viewed section-shell"><div class="section-heading"><div><p class="kicker blue">VISTO RECIENTEMENTE</p><h2>También te puede gustar.</h2></div></div><div class="product-grid">${rvHtml}</div></section>`; rvSection.classList.remove("hidden"); } else rvSection.classList.add("hidden"); }
}

function productDetailsMarkup(product) {
  const rows = [["Color",product.color],["Material",product.material],["Medidas",product.measurements],["Autenticidad",product.authenticity]].filter(([,value]) => value);
  if (!rows.length) return "";
  return `<details class="product-facts" open><summary>Detalles de la pieza <span>＋</span></summary><dl>${rows.map(([label,value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join("")}</dl></details>`;
}

function openProductZoom(imageUrl, name) {
  document.querySelector("#productZoom")?.remove();
  document.body.insertAdjacentHTML("beforeend", `<div class="image-zoom-backdrop" id="productZoom" role="dialog" aria-modal="true" aria-label="Fotografía ampliada"><button type="button" aria-label="Cerrar">×</button><img src="${esc(imageUrl)}" alt="${esc(name)}"></div>`);
  const modal = document.querySelector("#productZoom");
  const close = () => { modal.remove(); document.body.style.overflow=""; };
  document.body.style.overflow="hidden";
  modal.querySelector("button").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
}

function openQuickView(id) {
  const product = activeProducts().find(item => item.id === id); if (!product) return;
  document.querySelector("#quickViewModal")?.remove();
  document.body.insertAdjacentHTML("beforeend", `<div class="quick-view-backdrop" id="quickViewModal" role="dialog" aria-modal="true" aria-labelledby="quickViewTitle"><section class="quick-view-dialog"><button class="quick-view-close" type="button" aria-label="Cerrar">×</button><div class="quick-view-image"><img src="${esc(product.image)}" alt="${esc(product.name)}"></div><div class="quick-view-content"><p class="kicker blue">${esc(product.brand || "GINESCLOSET")}</p><h2 id="quickViewTitle">${esc(product.name)}</h2><strong>${esc(formatPrice(product.price))}</strong><span class="quick-condition">${esc(product.condition || "Muy buen estado")}</span>${product.sizes.length?`<label><span>Seleccionar talla</span><select id="quickViewSize"><option value="">Elige una talla</option>${product.sizes.map(size=>`<option>${esc(size)}</option>`).join("")}</select></label>`:""}<p>Guárdalo en tu carrito para solicitar una oferta personalizada por WhatsApp.</p><button class="button button-primary" id="quickViewAdd" type="button">AÑADIR AL CARRITO</button><a href="articulo.html?id=${encodeURIComponent(product.id)}">Ver ficha completa →</a></div></section></div>`);
  const modal = document.querySelector("#quickViewModal");
  const close = () => { modal.remove(); document.body.style.overflow=""; };
  document.body.style.overflow="hidden";
  modal.querySelector(".quick-view-close").addEventListener("click", close);
  modal.addEventListener("click", event => { if (event.target === modal) close(); });
  modal.querySelector("#quickViewAdd").addEventListener("click", async () => { const selected = modal.querySelector("#quickViewSize")?.value || ""; if (product.sizes.length && !selected) { showToast("Selecciona una talla antes de añadir el artículo.","error"); modal.querySelector("#quickViewSize")?.focus(); return; } await addToCart(product.id, selected, Boolean(product.sizes.length)); if (state.user) close(); });
}

async function toggleFavorite(id) {
  const product = state.products.find(item => item.id === id); if (!product) return;
  if (!state.user) {
    state.pendingFavorite = id; sessionStorage.setItem("gc_pending_favorite", id); openAuthModal("register", product); return;
  }
  if (state.role === "admin") { showToast("La cuenta administradora gestiona artículos desde su panel.", "error"); return; }
  const reference = doc(db,"users",state.user.uid,"favorites",id);
  try {
    if (state.favorites.has(id)) { await deleteDoc(reference); showToast("Eliminado de favoritos", "success"); }
    else { await setDoc(reference,{productId:id,productName:product.name,productImage:product.image,createdAt:serverTimestamp()}); showToast("Guardado en favoritos", "success"); }
  } catch (error) { console.error(error); showToast(firestoreActionMessage(error,"No se ha podido actualizar el favorito."), "error"); }
}

async function addToCart(id, requestedSize="", requireSize=false) {
  const product = state.products.find(item => item.id === id); if (!product) return;
  const size = requestedSize || (product.sizes.length === 1 ? product.sizes[0] : "");
  if (requireSize && product.sizes.length && !size) { showToast("Selecciona una talla antes de añadir el artículo.", "error"); document.querySelector("#detailSize")?.focus(); return; }
  if (!state.user) {
    state.pendingCart = {id,size}; sessionStorage.setItem("gc_pending_cart",JSON.stringify(state.pendingCart)); openAuthModal("register",product,"cart"); return;
  }
  if (state.role === "admin") { showToast("La cuenta administradora no utiliza carrito.","error"); return; }
  if (!state.cart.has(id) && state.cart.size >= 50) { showToast("El carrito admite un máximo de 50 artículos.","error"); return; }
  if(state.cartBusy.has(id))return;
  state.cartBusy.add(id);
  try {
    await setDoc(doc(db,"users",state.user.uid,"cart",id),{productId:id,productName:product.name,productImage:product.image,brand:product.brand||"",category:product.category||"",price:String(product.price||"Consultar"),size,addedAt:serverTimestamp()},{merge:true});
    showToast(state.cart.has(id)?"El artículo ya estaba en tu carrito":"Artículo añadido al carrito","success");
  } catch(error) { console.error(error); showToast(firestoreActionMessage(error,"No se ha podido añadir el artículo al carrito."),"error"); }
  finally{state.cartBusy.delete(id);}
}

function renderCart() {
  const root=document.querySelector("#cartRoot"); if(!root||!state.authReady)return;
  if(!state.user){root.innerHTML=`<section class="cart-gate"><span>▢</span><h1>Tu carrito te espera</h1><p>Inicia sesión o crea una cuenta para guardar artículos y enviarnos una solicitud.</p><button class="button button-primary" data-open-auth="login" type="button">Iniciar sesión</button><button class="text-button" data-open-auth="register" type="button">Crear una cuenta</button></section>`;return;}
  if(state.role==="admin"){location.replace("admin.html");return;}
  const clientNumber=state.profile.clientNumber||clientNumberFor(state.user),items=[...state.cart.entries()].map(([id,item])=>({id,...item,product:state.products.find(product=>product.id===id)}));
  if(state.lastRequestNumber&&!items.length){root.innerHTML=`<section class="cart-success"><span>✓</span><p class="kicker blue">SOLICITUD ENVIADA</p><h1>Ya la tiene GinesCloset.</h1><p>Tu solicitud <b>${esc(state.lastRequestNumber)}</b> ha llegado al administrador. Preparará una oferta con tus artículos y te escribirá por WhatsApp.</p><div><a class="button button-primary" href="catalogo.html">Seguir viendo el catálogo</a><a class="text-button" href="cuenta.html">Ver mis datos</a></div></section>`;return;}
  if(!items.length){root.innerHTML=`<section class="cart-empty"><span>▢</span><p class="kicker blue">TU CARRITO</p><h1>Aún no has añadido artículos.</h1><p>Explora el catálogo y guarda aquí las piezas que quieras consultar.</p><a class="button button-primary" href="catalogo.html">Explorar catálogo</a></section>`;return;}
  const phone=state.profile.phone||"";
  root.innerHTML=`<section class="cart-heading"><div><p class="kicker blue">SOLICITUD PERSONAL · ${esc(clientNumber)}</p><h1>Tu carrito.</h1><p>Revisa las tallas y envía la selección. El administrador recibirá los artículos y te preparará una oferta por WhatsApp.</p></div><span><b>${items.length}</b> artículo${items.length===1?"":"s"}</span></section><div class="cart-layout"><section class="cart-items">${items.map(cartItemMarkup).join("")}</section><aside class="cart-summary"><p class="kicker blue">RESUMEN</p><h2>Solicitud de oferta</h2><dl><div><dt>Número de cliente</dt><dd>${esc(clientNumber)}</dd></div><div><dt>Artículos</dt><dd>${items.length}</dd></div><div><dt>WhatsApp</dt><dd>${esc(phone||"Sin número")}</dd></div></dl>${phone?'<p class="cart-summary-note">No se realizará ningún pago. Recibirás una oferta personalizada por WhatsApp.</p>':'<p class="cart-phone-warning">Añade tu teléfono en “Mi cuenta” antes de enviar la solicitud.</p>'}<button class="button button-primary" id="submitCartRequest" type="button" ${phone?"":"disabled"}>Enviar solicitud</button>${phone?"":'<a class="button button-secondary" href="cuenta.html">Completar mis datos</a>'}<p class="cart-error hidden" id="cartError" role="alert"></p></aside></div>`;
  root.querySelectorAll("[data-cart-remove]").forEach(button=>button.addEventListener("click",()=>removeCartItem(button.dataset.cartRemove)));
  root.querySelectorAll("[data-cart-size]").forEach(select=>select.addEventListener("change",()=>updateCartSize(select.dataset.cartSize,select.value)));
  root.querySelector("#submitCartRequest")?.addEventListener("click",submitCartRequest);
}

function cartItemMarkup(item){const product=item.product||{},sizes=Array.isArray(product.sizes)?product.sizes:[],selected=item.size||"";return `<article class="cart-item"><a href="articulo.html?id=${encodeURIComponent(item.id)}"><img src="${esc(item.productImage||product.image||"producto-1.jpg")}" alt="${esc(item.productName||product.name||"Artículo")}" onerror="this.src='producto-1.jpg'"></a><div class="cart-item-info"><p>${esc(item.brand||product.brand||"GINESCLOSET")}</p><h2><a href="articulo.html?id=${encodeURIComponent(item.id)}">${esc(item.productName||product.name||"Artículo")}</a></h2><strong>${esc(formatPrice(item.price||product.price))}</strong>${sizes.length?`<label>Talla<select data-cart-size="${esc(item.id)}"><option value="">Seleccionar</option>${sizes.map(size=>`<option value="${esc(size)}" ${selected===size?"selected":""}>${esc(size)}</option>`).join("")}</select></label>`:'<span class="cart-unique-size">Talla única</span>'}</div><button class="cart-remove" data-cart-remove="${esc(item.id)}" type="button" aria-label="Quitar ${esc(item.productName||product.name||"artículo")}">×</button></article>`;}
async function updateCartSize(id,size){try{await setDoc(doc(db,"users",state.user.uid,"cart",id),{size},{merge:true});}catch(error){console.error(error);showToast(firestoreActionMessage(error,"No se ha podido guardar la talla."),"error");}}
async function removeCartItem(id){try{await deleteDoc(doc(db,"users",state.user.uid,"cart",id));showToast("Artículo eliminado del carrito","success");}catch(error){console.error(error);showToast(firestoreActionMessage(error,"No se ha podido eliminar el artículo."),"error");}}
async function submitCartRequest(){
  const button=document.querySelector("#submitCartRequest"),errorBox=document.querySelector("#cartError"),items=[...state.cart.entries()].map(([id,item])=>{const product=state.products.find(entry=>entry.id===id)||{};return{productId:id,name:String(item.productName||product.name||"Artículo"),image:String(item.productImage||product.image||""),brand:String(item.brand||product.brand||""),category:String(item.category||product.category||""),price:String(item.price||product.price||"Consultar"),size:String(item.size||"")};});
  if(!button||!errorBox||!items.length)return;
  const missingSize=items.find(item=>{const product=state.products.find(entry=>entry.id===item.productId);return product?.sizes?.length&&!item.size;});
  if(missingSize){errorBox.textContent=`Selecciona la talla de ${missingSize.name}.`;errorBox.classList.remove("hidden");return;}
  if(!state.profile.phone){errorBox.textContent="Añade un teléfono en tu perfil antes de enviar la solicitud.";errorBox.classList.remove("hidden");return;}
  button.disabled=true;button.textContent="Enviando…";errorBox.classList.add("hidden");
  try{
    const reference=doc(collection(db,"requests")),requestNumber=`SOL-${reference.id.slice(0,8).toUpperCase()}`,clientNumber=state.profile.clientNumber||clientNumberFor(state.user),batch=writeBatch(db);
    batch.set(reference,{requestNumber,userId:state.user.uid,clientNumber,customerName:state.profile.name||state.user.displayName||"Cliente",customerEmail:(state.user.email||"").toLowerCase(),customerPhone:state.profile.phone,items,itemCount:items.length,status:"pending",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    state.cart.forEach((_,id)=>batch.delete(doc(db,"users",state.user.uid,"cart",id)));
    await batch.commit();state.lastRequestNumber=requestNumber;renderCart();
  }catch(error){console.error(error);state.lastRequestNumber="";errorBox.textContent=firestoreActionMessage(error,"No se ha podido enviar la solicitud. Inténtalo de nuevo.");errorBox.classList.remove("hidden");button.disabled=false;button.textContent="Enviar solicitud";}
}

function injectAuthModal() {
  if (document.querySelector("#authModalBackdrop")) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" id="authModalBackdrop" aria-hidden="true"><section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="authModalTitle"><aside class="auth-modal-side"><a href="index.html">GINESCLOSET</a><div><p class="kicker">TU SELECCIÓN, SIEMPRE CONTIGO</p><h2 id="authSideTitle">Guarda lo que te inspira.</h2><p id="authSideCopy">Crea tu cuenta y conserva tu selección.</p></div><div id="pendingProduct"></div></aside><div class="auth-modal-main"><button class="modal-close" id="authModalClose" type="button" aria-label="Cerrar">×</button><div id="authModalContent"></div><button class="modal-cancel" id="authModalCancel" type="button">Cerrar y seguir mirando</button></div></section></div>`);
  const backdrop = document.querySelector("#authModalBackdrop");
  document.querySelector("#authModalClose").addEventListener("click", closeAuthModal);
  document.querySelector("#authModalCancel").addEventListener("click", closeAuthModal);
  backdrop.addEventListener("click", event => { if (event.target === backdrop) closeAuthModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && backdrop.classList.contains("open")) closeAuthModal(); });
}

function authPanelMarkup(mode="login", context="modal") {
  const register = mode === "register";
  return `<div class="auth-panel"><div class="auth-tabs"><button class="${!register?"active":""}" data-auth-mode="login" type="button">Iniciar sesión</button><button class="${register?"active":""}" data-auth-mode="register" type="button">Crear cuenta</button></div><h1 id="authModalTitle">${register?"Crea tu cuenta":"Bienvenido de nuevo"}</h1><p>${register?"Guarda favoritos, prepara carritos y recibe ofertas personalizadas.":"Accede a tu selección personal."}</p>
    <form class="auth-form" data-auth-form data-mode="${mode}" data-context="${context}">${register?'<div class="field"><label>Nombre</label><input name="name" required maxlength="60" autocomplete="name" placeholder="Tu nombre"></div><div class="field"><label>Teléfono</label><input name="phone" type="tel" required maxlength="25" autocomplete="tel" placeholder="+34 600 000 000"></div>':""}<div class="field"><label>Correo electrónico</label><input name="email" type="email" required autocomplete="email" placeholder="tu@email.com"></div><div class="field"><label>Contraseña</label><input name="password" type="password" required minlength="6" autocomplete="${register?"new-password":"current-password"}" placeholder="Mínimo 6 caracteres"></div><p class="auth-error hidden" data-auth-error role="alert"></p><button class="button button-primary" type="submit">${register?"Crear mi cuenta":"Entrar"}</button></form>
    ${!register?'<button class="text-button" data-reset-password type="button">¿Has olvidado la contraseña?</button>':""}<div class="auth-divider"><span>o continúa con</span></div><button class="google-button" data-google-login type="button"><b>G</b> Continuar con Google</button><p class="auth-note">Acceso protegido con Firebase. Las cuentas nuevas siempre son de cliente.</p></div>`;
}

function bindAuthPanel(root, mode, context) {
  root.querySelectorAll("[data-auth-mode]").forEach(button => button.addEventListener("click", () => renderAuthPanel(root, button.dataset.authMode, context)));
  root.querySelector("[data-auth-form]")?.addEventListener("submit", submitAuth);
  root.querySelector("[data-google-login]")?.addEventListener("click", googleLogin);
  root.querySelector("[data-reset-password]")?.addEventListener("click", resetPassword);
}
function renderAuthPanel(root, mode, context) { root.innerHTML = authPanelMarkup(mode, context); bindAuthPanel(root, mode, context); }
function openAuthModal(mode="login", product=null, action="favorite") {
  const backdrop = document.querySelector("#authModalBackdrop"); if (!backdrop) return;
  const selected = product || state.products.find(item => item.id === (action==="cart"?state.pendingCart?.id:state.pendingFavorite));
  const preview = document.querySelector("#pendingProduct");
  document.querySelector("#authSideTitle").textContent=!selected?"Tu espacio GinesCloset.":action==="cart"?"Prepara tu selección.":"Guarda lo que te inspira.";
  document.querySelector("#authSideCopy").textContent=!selected?"Accede a tus favoritos, tu carrito y tus solicitudes desde cualquier dispositivo.":action==="cart"?"Crea tu cuenta y este artículo se añadirá automáticamente a tu carrito.":"Crea tu cuenta y este artículo aparecerá automáticamente en tus favoritos.";
  preview.innerHTML = selected ? `<div class="pending-product"><img src="${esc(selected.image)}" alt=""><div><small>${action==="cart"?"SE AÑADIRÁ AL CARRITO":"SE GUARDARÁ DESPUÉS"}</small><b>${esc(selected.name)}</b></div></div>` : "";
  renderAuthPanel(document.querySelector("#authModalContent"), mode, "modal");
  backdrop.classList.add("open"); backdrop.setAttribute("aria-hidden","false"); document.body.style.overflow = "hidden";
  setTimeout(() => backdrop.querySelector("input")?.focus(), 100);
}
function closeAuthModal() { const backdrop=document.querySelector("#authModalBackdrop"); backdrop?.classList.remove("open"); backdrop?.setAttribute("aria-hidden","true"); document.body.style.overflow=""; state.pendingFavorite="";state.pendingCart=null;sessionStorage.removeItem("gc_pending_favorite");sessionStorage.removeItem("gc_pending_cart"); }

function renderAccount(mode) {
  const root = document.querySelector("#accountRoot"); if (!root || !state.authReady) return;
  if (state.user && state.role === "admin") { location.replace("admin.html"); return; }
  if (state.user) {
    const name = state.profile.name || state.user.displayName || "Cliente";
    root.innerHTML = `<section class="profile-card"><div class="profile-card-header"><span class="profile-avatar">${esc(name.charAt(0).toUpperCase())}</span><div><p class="kicker blue">MI PERFIL</p><h1>Mis datos</h1><p>Consulta y actualiza tu información personal.</p></div></div><div class="client-number-card"><span>NÚMERO DE CLIENTE</span><b>${esc(state.profile.clientNumber||clientNumberFor(state.user))}</b><small>Identifica tus solicitudes y ofertas de GinesCloset.</small></div><form class="profile-form" id="profileForm"><div class="field"><label>Nombre</label><input name="name" required maxlength="60" value="${esc(name)}"></div><div class="field"><label>Teléfono de WhatsApp</label><input name="phone" type="tel" maxlength="25" value="${esc(state.profile.phone || "")}" placeholder="+34 600 000 000"></div><div class="field"><label>Correo electrónico</label><input value="${esc(state.user.email || "")}" disabled><span class="profile-help">El correo electrónico está protegido y no se puede modificar aquí.</span></div><p class="auth-error hidden" data-profile-message></p><div class="profile-actions"><button class="button button-primary" type="submit">Guardar cambios</button><button class="logout-button" data-logout type="button">Cerrar sesión</button></div></form></section>`;
    root.querySelector("#profileForm").addEventListener("submit", saveProfile);
    return;
  }
  const requested = mode || new URLSearchParams(location.search).get("modo") || "login";
  root.innerHTML = `<section class="auth-card"><aside class="auth-visual"><a href="index.html">GINESCLOSET</a><div><p class="kicker">TU ESPACIO PERSONAL</p><h2>Tu selección,<br>siempre contigo.</h2><p>Guarda favoritos, prepara un carrito y recibe ofertas personalizadas por WhatsApp.</p></div><small>ACCESO SEGURO · FIREBASE</small></aside><div id="accountAuthPanel"></div></section>`;
  renderAuthPanel(root.querySelector("#accountAuthPanel"), requested === "register" ? "register" : "login", "page");
}

async function submitAuth(event) {
  event.preventDefault();
  const form = event.currentTarget, data = new FormData(form), mode = form.dataset.mode, context = form.dataset.context;
  const button = form.querySelector("button[type=submit]"), errorBox = form.querySelector("[data-auth-error]");
  button.disabled = true; button.textContent = "Un momento…"; errorBox.classList.add("hidden");
  try {
    let credential;
    if (mode === "register") {
      credential = await createUserWithEmailAndPassword(auth, String(data.get("email")).trim(), String(data.get("password")));
      const name = String(data.get("name")).trim(); await updateProfile(credential.user,{displayName:name});
      await ensureProfile(credential.user,{name,phone:String(data.get("phone")).trim()});
    } else {
      credential = await signInWithEmailAndPassword(auth, String(data.get("email")).trim(), String(data.get("password")));
      await ensureProfile(credential.user);
    }
    await finishAuthentication(credential.user, context);
  } catch (error) { console.error(error); errorBox.textContent = friendlyError(error); errorBox.classList.remove("hidden"); button.disabled=false; button.textContent=mode==="register"?"Crear mi cuenta":"Entrar"; }
}

async function googleLogin(event) {
  const button = event.currentTarget; button.disabled=true; button.textContent="Abriendo Google…";
  try { const provider=new GoogleAuthProvider(); provider.setCustomParameters({prompt:"select_account"}); const credential=await signInWithPopup(auth,provider); await ensureProfile(credential.user); await finishAuthentication(credential.user, button.closest("#accountRoot")?"page":"modal"); }
  catch(error) { console.error(error); const panel=button.closest(".auth-panel"), errorBox=panel?.querySelector("[data-auth-error]"); if(errorBox){errorBox.textContent=friendlyError(error);errorBox.classList.remove("hidden");} button.disabled=false;button.innerHTML="<b>G</b> Continuar con Google"; }
}

async function finishAuthentication(user, context) {
  const snapshot = await getDoc(doc(db,"users",user.uid));
  const profile = snapshot.exists() ? snapshot.data() : {};
  const role = profile.role || "customer";
  writeAuthHint({signedIn:true,role,label:role === "admin" ? "Gestionar catálogo" : profile.name || user.displayName || "Mi cuenta"});
  if (role === "admin") { sessionStorage.removeItem("gc_pending_favorite");sessionStorage.removeItem("gc_pending_cart");location.replace("admin.html"); return; }
  const pending = state.pendingFavorite || sessionStorage.getItem("gc_pending_favorite");
  const pendingCart=state.pendingCart||readPendingCart();
  let pendingFailure="";
  if (pending) {
    const product = state.products.find(item => item.id === pending);
    try{if (product) await setDoc(doc(db,"users",user.uid,"favorites",pending),{productId:pending,productName:product.name,productImage:product.image,createdAt:serverTimestamp()});}
    catch(error){console.error(error);pendingFailure=firestoreActionMessage(error,"La sesión se ha iniciado, pero no se pudo guardar el favorito.");}
    state.pendingFavorite=""; sessionStorage.removeItem("gc_pending_favorite");
  }
  if(pendingCart?.id){const product=state.products.find(item=>item.id===pendingCart.id);try{if(product)await setDoc(doc(db,"users",user.uid,"cart",product.id),{productId:product.id,productName:product.name,productImage:product.image,brand:product.brand||"",category:product.category||"",price:String(product.price||"Consultar"),size:pendingCart.size||(product.sizes.length===1?product.sizes[0]:""),addedAt:serverTimestamp()},{merge:true});}catch(error){console.error(error);pendingFailure=firestoreActionMessage(error,"La sesión se ha iniciado, pero no se pudo añadir el artículo al carrito.");}state.pendingCart=null;sessionStorage.removeItem("gc_pending_cart");}
  if (context === "modal") { closeAuthModal(); showToast(pendingFailure||(pendingCart?.id ? "Cuenta lista y artículo añadido al carrito" : pending ? "Cuenta lista y artículo guardado en favoritos" : "Sesión iniciada"),pendingFailure?"error":"success"); return; }
  if(pendingFailure)showToast(pendingFailure,"error");
  const returnTo = safeReturnPage(); location.replace(returnTo || "catalogo.html");
}

async function ensureProfile(user, extra={}) {
  const reference = doc(db,"users",user.uid), snapshot = await getDoc(reference);
  if (!snapshot.exists()) await setDoc(reference,{name:extra.name || user.displayName || "Cliente",phone:extra.phone || "",email:(user.email || "").toLowerCase(),role:"customer",clientNumber:clientNumberFor(user),createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  else if((snapshot.data().role||"customer")!=="admin"&&(!snapshot.data().clientNumber||!snapshot.data().role))await setDoc(reference,{role:"customer",clientNumber:snapshot.data().clientNumber||clientNumberFor(user),email:snapshot.data().email||(user.email||"").toLowerCase(),updatedAt:serverTimestamp()},{merge:true});
}
async function saveProfile(event) {
  event.preventDefault(); const form=event.currentTarget, data=new FormData(form), button=form.querySelector("button[type=submit]"), message=form.querySelector("[data-profile-message]");
  button.disabled=true;button.textContent="Guardando…";
  try { const name=String(data.get("name")).trim(),phone=String(data.get("phone")).trim(); await updateProfile(state.user,{displayName:name}); await setDoc(doc(db,"users",state.user.uid),{name,phone,email:(state.user.email||"").toLowerCase(),updatedAt:serverTimestamp()},{merge:true}); state.profile={...state.profile,name,phone}; showToast("Datos actualizados", "success"); button.textContent="Guardar cambios";button.disabled=false;renderHeader(); }
  catch(error){console.error(error);message.textContent="No se han podido guardar los cambios.";message.classList.remove("hidden");button.disabled=false;button.textContent="Guardar cambios";}
}
async function resetPassword(event) {
  const panel=event.currentTarget.closest(".auth-panel"), email=panel.querySelector('input[name="email"]').value.trim(), error=panel.querySelector("[data-auth-error]");
  if(!email){error.textContent="Escribe primero tu correo electrónico.";error.classList.remove("hidden");return;}
  try{await sendPasswordResetEmail(auth,email);showToast("Te hemos enviado el correo para recuperar tu contraseña.","success");}catch(problem){error.textContent=friendlyError(problem);error.classList.remove("hidden");}
}
async function logoutToStore(){try{await signOut(auth);sessionStorage.removeItem("gc_pending_favorite");sessionStorage.removeItem("gc_pending_cart");writeAuthHint({signedIn:false,role:"customer",label:"Iniciar sesión"});location.replace("index.html?sesion=cerrada");}catch{showToast("No se ha podido cerrar la sesión.","error");}}
function safeReturnPage(){const value=new URLSearchParams(location.search).get("return")||"";return /^(?:index|catalogo|novedades|stock|favoritos|carrito|cuenta|articulo)\.html(?:[?#].*)?$/i.test(value)?value:"";}
function friendlyError(error){const messages={"auth/email-already-in-use":"Ya existe una cuenta con este correo.","auth/invalid-credential":"El correo o la contraseña no son correctos.","auth/weak-password":"La contraseña debe tener al menos 6 caracteres.","auth/invalid-email":"Introduce un correo válido.","auth/popup-closed-by-user":"Se ha cerrado la ventana de Google.","auth/popup-blocked":"El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes.","auth/network-request-failed":"No hay conexión. Comprueba Internet e inténtalo de nuevo.","auth/too-many-requests":"Demasiados intentos. Espera unos minutos.","auth/unauthorized-domain":"Falta autorizar este dominio en Firebase Authentication.","auth/operation-not-allowed":"Este método de acceso no está habilitado en Firebase."};return messages[error?.code] || "No se ha podido completar la operación. Inténtalo de nuevo.";}
function showToast(message,type="success"){let toast=document.querySelector(".site-toast");if(!toast){toast=document.createElement("div");toast.className="site-toast";document.body.append(toast);}toast.textContent=message;toast.dataset.type=type;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),3200);}

onSnapshot(collection(db,"products"), snapshot => {
  const products = snapshot.docs.map(item => normalizeProduct({id:item.id,...item.data()})).sort((a,b)=>Number(b.createdOrder||0)-Number(a.createdOrder||0));
  const signature = productSignature(products), changed = !state.productsReady || signature !== state.productSignature;
  state.products = products; state.productSignature = signature; state.productsReady = true; writeProductCache(products);
  if (changed) renderPage();
}, error => { console.error(error);if(!state.productsReady)state.products=[];state.productsReady=true;renderPage();showInfrastructureErrorOnce(error,"No se ha podido cargar el catálogo."); });

onAuthStateChanged(auth, async user => {
  state.user=user;state.profile={};state.role="customer";state.favorites.clear();state.cart.clear();state.favoritesReady=false;state.cartReady=false;state.lastRequestNumber="";state.stopFavorites?.();state.stopFavorites=null;state.stopCart?.();state.stopCart=null;
  if(user){
    try{await ensureProfile(user);const snapshot=await getDoc(doc(db,"users",user.uid));if(snapshot.exists()){state.profile=snapshot.data();state.role=state.profile.role||"customer";}}catch(error){console.error(error);}
    writeAuthHint({signedIn:true,role:state.role,label:state.role==="admin"?"Gestionar catálogo":state.profile.name||user.displayName||"Mi cuenta"});
    if(state.role!=="admin"){
      state.stopFavorites=onSnapshot(collection(db,"users",user.uid,"favorites"), snapshot=>{state.favorites=new Set(snapshot.docs.map(item=>item.id));state.favoritesReady=true;renderUserState();}, error=>{console.error(error);state.favoritesReady=true;renderUserState();showInfrastructureErrorOnce(error,"No se han podido cargar tus favoritos.");});
      state.stopCart=onSnapshot(collection(db,"users",user.uid,"cart"),snapshot=>{state.cart=new Map(snapshot.docs.map(item=>[item.id,{id:item.id,...item.data()}]));state.cartReady=true;renderUserState();},error=>{console.error(error);state.cartReady=true;renderUserState();showInfrastructureErrorOnce(error,"No se ha podido cargar tu carrito.");});
    } else {
      state.favoritesReady=true;state.cartReady=true;
    }
  } else {
    state.favoritesReady=true;state.cartReady=true;writeAuthHint({signedIn:false,role:"customer",label:"Iniciar sesión"});
  }
  state.authReady=true;renderUserState();
});

initChrome();
if(page==="catalog")initCatalog();
if(page==="new")initNew();
if(page==="stock")initStockPage();
if(page==="favorites")initFavorites();
if(page==="futbol")initJerseyExamples();
renderPage();

if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}
