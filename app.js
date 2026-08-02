import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, updateProfile, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, setDoc, deleteDoc, collection, onSnapshot, serverTimestamp, getDoc } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

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

const BRANDS = ["Louis Vuitton","Dior","Gucci","Prada","Balenciaga","Versace","Dolce & Gabbana","Fendi","Burberry","Givenchy","Saint Laurent (YSL)","Loewe","Celine","Valentino","Hermès","Chanel","Miu Miu","Maison Margiela","Alexander McQueen","Moncler","Stone Island","Palm Angels","Amiri","Off-White","Fear of God","Supreme","Chrome Hearts","Gallery Dept.","Rhude","Denim Tears","Essentials","Corteiz","Trapstar","Nike","Jordan","Adidas","New Balance","Cartier","Kenzo","Alo","Bottega Desires","Nude Project","Purple"];
const CATEGORIES = [
  ["camisetas","Camisetas"],["sudaderas","Sudaderas"],["polos","Polos"],["camisetas-futbol","Camisetas de fútbol"],
  ["abrigos","Abrigos"],["zapatos","Zapatos"],["pantalones-cortos","Pantalones cortos"],["pantalones-largos","Pantalones largos"],
  ["bolsos","Bolsos"],["carteras","Carteras"],["rinoneras","Riñoneras"]
];
const CATEGORY_LABELS = Object.fromEntries(CATEGORIES);
const LEGACY_CATEGORIES = {vestidos:"camisetas",tops:"camisetas",conjuntos:"sudaderas",chaquetas:"abrigos",calzado:"zapatos",pantalones:"pantalones-largos",rinonera:"rinoneras",cartera:"carteras",bolso:"bolsos"};
const DEFAULT_PRODUCTS = [
  {id:"1",name:"Camiseta azul GC",brand:"Dior",category:"camisetas",price:"Consultar",image:"producto-1.jpg",badge:"NUEVO",sizes:["S","M","L"],active:true,description:"Una pieza especial seleccionada por GinesCloset.",createdOrder:5},
  {id:"2",name:"Sudadera cielo",brand:"Prada",category:"sudaderas",price:"Consultar",image:"producto-2.jpg",badge:"DESTACADO",sizes:["S","M","L"],active:true,description:"Una prenda versátil con personalidad propia.",createdOrder:4},
  {id:"3",name:"Pantalón eléctrico",brand:"Balenciaga",category:"pantalones-largos",price:"Consultar",image:"producto-3.jpg",badge:"GC EDIT",sizes:["S","M"],active:true,description:"Color, actitud y comodidad para destacar.",createdOrder:3},
  {id:"4",name:"Polo efecto satén",brand:"Loewe",category:"polos",price:"Consultar",image:"producto-4.jpg",badge:"NUEVO",sizes:["S","M","L"],active:true,description:"Un acabado luminoso para elevar cualquier look.",createdOrder:2},
  {id:"5",name:"Abrigo noche azul",brand:"Saint Laurent (YSL)",category:"abrigos",price:"Consultar",image:"producto-5.jpg",badge:"ÚLTIMAS",sizes:["S","M","L"],active:true,description:"Elegancia relajada para tus planes especiales.",createdOrder:1}
];

const state = {
  products: DEFAULT_PRODUCTS.map(normalizeProduct), user: null, profile: {}, role: "customer", favorites: new Set(),
  authReady: false, productsReady: true, selectedBrands: new Set(), selectedCategory: "all", newCategory: "all",
  priceMin: null, priceMax: null,
  pendingFavorite: sessionStorage.getItem("gc_pending_favorite") || "", stopFavorites: null
};

const esc = (value="") => String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
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
  return normalized;
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
function productSearchText(product) { return norm([product.name, product.brand, CATEGORY_LABELS[product.category], product.description, product.sizes.join(" ")].join(" ")); }
function productMatchesPrice(product) {
  if (state.priceMin === null && state.priceMax === null) return true;
  const value = numericPrice(product.price);
  return value !== null && (state.priceMin === null || value >= state.priceMin) && (state.priceMax === null || value <= state.priceMax);
}
function currentFile() { return location.pathname.split("/").pop() || "index.html"; }

function initChrome() {
  document.querySelectorAll("[data-year]").forEach(node => node.textContent = new Date().getFullYear());
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#mainNav");
  toggle?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
  });
  document.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) { event.preventDefault(); event.stopPropagation(); toggleFavorite(favoriteButton.dataset.favorite); return; }
    const authButton = event.target.closest("[data-open-auth]");
    if (authButton) { event.preventDefault(); openAuthModal(authButton.dataset.openAuth || "login"); return; }
    const logoutButton = event.target.closest("[data-logout]");
    if (logoutButton) { event.preventDefault(); logoutToStore(); }
  });
  injectAuthModal();
}

function productCard(product) {
  const liked = state.favorites.has(product.id);
  const category = CATEGORY_LABELS[product.category] || "Selección";
  const href = `articulo.html?id=${encodeURIComponent(product.id)}`;
  return `<article class="product-card" data-product-id="${esc(product.id)}">
    <div class="product-media"><a href="${href}"><img src="${esc(product.image)}" alt="${esc(product.name)}" loading="lazy" onerror="this.src='producto-1.jpg'"></a>
      ${product.badge ? `<span class="product-badge">${esc(product.badge)}</span>` : ""}
      <button class="heart-button ${liked ? "liked" : ""}" data-favorite="${esc(product.id)}" type="button" aria-label="${liked ? "Quitar de favoritos" : "Guardar en favoritos"}">${liked ? "♥" : "♡"}</button>
    </div>
    <div class="product-card-info"><div class="product-meta"><span>${esc(product.brand || "GinesCloset")} · ${esc(category)}</span><strong>${esc(formatPrice(product.price))}</strong></div>
      <h3><a href="${href}">${esc(product.name)}</a></h3><div class="product-bottom"><div class="product-sizes">${product.sizes.length ? product.sizes.map(size => `<i>${esc(size)}</i>`).join("") : "<span>Talla única</span>"}</div><a class="product-price" href="${href}">Ver artículo →</a></div>
    </div></article>`;
}

function renderHeader() {
  document.querySelectorAll("[data-favorite-count]").forEach(node => node.textContent = state.favorites.size);
  document.querySelectorAll("[data-account-link]").forEach(link => {
    const label = link.querySelector("[data-account-label]");
    if (state.user && state.role === "admin") { link.href = "admin.html"; if (label) label.textContent = "Gestionar catálogo"; }
    else if (state.user) { link.href = "cuenta.html"; if (label) label.textContent = state.profile.name || state.user.displayName || "Mi cuenta"; }
    else { link.href = "cuenta.html"; if (label) label.textContent = "Iniciar sesión"; }
  });
}

function renderPage() {
  renderHeader();
  const featured = document.querySelector("#homeFeatured");
  if (featured) featured.innerHTML = activeProducts().slice(0,3).map(productCard).join("");
  if (page === "catalog") renderCatalog();
  if (page === "new") renderNewProducts();
  if (page === "favorites") renderFavorites();
  if (page === "product") renderProductDetail();
  if (page === "account") renderAccount();
}

function initCatalog() {
  const search = document.querySelector("#catalogSearch");
  if (!search) return;
  const params = new URLSearchParams(location.search);
  const requestedCategory = params.get("categoria") || "all";
  state.selectedCategory = ["all", ...CATEGORIES.map(item => item[0])].includes(requestedCategory) ? requestedCategory : "all";
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

function renderCatalog() {
  const grid = document.querySelector("#catalogGrid"); if (!grid) return;
  document.querySelectorAll("[data-category]").forEach(button => button.classList.toggle("active", button.dataset.category === state.selectedCategory));
  const search = document.querySelector("#catalogSearch");
  const term = norm(search?.value);
  const sort = document.querySelector("#catalogSort")?.value || "newest";
  let products = activeProducts().filter(product => {
    return (!term || productSearchText(product).includes(term)) && (state.selectedCategory === "all" || product.category === state.selectedCategory) && (!state.selectedBrands.size || state.selectedBrands.has(product.brand)) && productMatchesPrice(product);
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
  renderPriceControls();
  renderActiveChips(term);
}

function renderFilterMetadata(term) {
  const categoryBase = activeProducts().filter(product => (!term || productSearchText(product).includes(term)) && (!state.selectedBrands.size || state.selectedBrands.has(product.brand)) && productMatchesPrice(product));
  document.querySelectorAll("[data-category]").forEach(button => {
    const category = button.dataset.category;
    const count = category === "all" ? categoryBase.length : categoryBase.filter(product => product.category === category).length;
    const badge = button.querySelector("[data-category-count]");
    if (badge) badge.textContent = count;
  });
  const categoryStatus = document.querySelector("#categoryFilterStatus");
  if (categoryStatus) categoryStatus.textContent = state.selectedCategory === "all" ? "Todas" : CATEGORY_LABELS[state.selectedCategory] || "Categoría";

  const brandBase = activeProducts().filter(product => (!term || productSearchText(product).includes(term)) && (state.selectedCategory === "all" || product.category === state.selectedCategory) && productMatchesPrice(product));
  document.querySelectorAll(".brand-option[data-brand-name]").forEach(option => {
    const brand = option.dataset.brandName;
    const count = brandBase.filter(product => product.brand === brand).length;
    const badge = option.querySelector(".brand-count");
    if (badge) badge.textContent = count;
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
  const term = norm(document.querySelector("#newSearch")?.value);
  const products = activeProducts().filter(product => (!term || norm([product.name,product.brand,product.description].join(" ")).includes(term)) && (state.newCategory === "all" || product.category === state.newCategory)).sort((a,b) => Number(b.createdOrder || 0)-Number(a.createdOrder || 0));
  document.querySelectorAll("[data-new-category]").forEach(button => button.classList.toggle("active", button.dataset.newCategory === state.newCategory));
  grid.innerHTML = products.map(productCard).join(""); grid.classList.toggle("hidden", !products.length);
  document.querySelector("#newEmpty")?.classList.toggle("hidden", Boolean(products.length));
  const count = document.querySelector("#newResultCount"); if (count) count.textContent = products.length;
}

function initFavorites() { document.querySelector("#favoritesSearch")?.addEventListener("input", renderFavorites); }
function renderFavorites() {
  const gate = document.querySelector("#favoritesGate"), tools = document.querySelector("#favoritesTools"), grid = document.querySelector("#favoritesGrid"), empty = document.querySelector("#favoritesEmpty");
  if (!grid) return;
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
  document.title = `${product.name} | GinesCloset`;
  const images = productImages(product), liked = state.favorites.has(product.id);
  root.innerHTML = `<article class="product-detail"><div class="product-gallery"><div class="product-thumbs">${images.map((image,index) => `<button class="product-thumb ${index===0?"active":""}" type="button" data-detail-image="${esc(image)}"><img src="${esc(image)}" alt="Vista ${index+1} de ${esc(product.name)}"></button>`).join("")}</div><div class="product-main-image"><img id="detailMainImage" src="${esc(images[0])}" alt="${esc(product.name)}"></div></div>
    <div class="product-detail-info"><p class="product-breadcrumb"><a href="catalogo.html">Catálogo</a> · ${esc(CATEGORY_LABELS[product.category] || "Selección")}</p><p class="kicker blue">${esc(product.brand || "GINESCLOSET")}</p><h1>${esc(product.name)}</h1><strong class="detail-price">${esc(formatPrice(product.price))}</strong><p class="detail-description">${esc(product.description || "Una pieza seleccionada por GinesCloset.")}</p>
      <label class="size-select-field"><span>Seleccionar talla</span><select id="detailSize"><option value="">Elige una talla</option>${product.sizes.map(size => `<option>${esc(size)}</option>`).join("")}</select></label>
      <div class="detail-actions"><a class="button button-primary" id="availabilityLink" href="https://www.instagram.com/ginescloset/" target="_blank" rel="noopener">Consultar disponibilidad</a><button class="detail-heart ${liked?"liked":""}" data-favorite="${esc(product.id)}" type="button">${liked?"♥ Guardado en favoritos":"♡ Guardar en favoritos"}</button></div></div></article>`;
  root.querySelectorAll("[data-detail-image]").forEach(button => button.addEventListener("click", () => { root.querySelectorAll(".product-thumb").forEach(item => item.classList.remove("active")); button.classList.add("active"); document.querySelector("#detailMainImage").src = button.dataset.detailImage; }));
  const related = activeProducts().filter(item => item.id !== product.id && (item.category === product.category || item.brand === product.brand)).slice(0,3);
  const relatedRoot = document.querySelector("#relatedProducts"), section = document.querySelector("#relatedSection");
  if (related.length) { relatedRoot.innerHTML = related.map(productCard).join(""); section.classList.remove("hidden"); } else section.classList.add("hidden");
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
  } catch (error) { console.error(error); showToast("No se ha podido actualizar el favorito.", "error"); }
}

function injectAuthModal() {
  if (document.querySelector("#authModalBackdrop")) return;
  document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" id="authModalBackdrop" aria-hidden="true"><section class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="authModalTitle"><aside class="auth-modal-side"><a href="index.html">GINESCLOSET</a><div><p class="kicker">TU SELECCIÓN, SIEMPRE CONTIGO</p><h2>Guarda lo que te inspira.</h2><p>Crea tu cuenta y este artículo aparecerá automáticamente en tus favoritos.</p></div><div id="pendingProduct"></div></aside><div class="auth-modal-main"><button class="modal-close" id="authModalClose" type="button" aria-label="Cerrar">×</button><div id="authModalContent"></div><button class="modal-cancel" id="authModalCancel" type="button">Cerrar y seguir mirando</button></div></section></div>`);
  const backdrop = document.querySelector("#authModalBackdrop");
  document.querySelector("#authModalClose").addEventListener("click", closeAuthModal);
  document.querySelector("#authModalCancel").addEventListener("click", closeAuthModal);
  backdrop.addEventListener("click", event => { if (event.target === backdrop) closeAuthModal(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape" && backdrop.classList.contains("open")) closeAuthModal(); });
}

function authPanelMarkup(mode="login", context="modal") {
  const register = mode === "register";
  return `<div class="auth-panel"><div class="auth-tabs"><button class="${!register?"active":""}" data-auth-mode="login" type="button">Iniciar sesión</button><button class="${register?"active":""}" data-auth-mode="register" type="button">Crear cuenta</button></div><h1 id="authModalTitle">${register?"Crea tu cuenta":"Bienvenido de nuevo"}</h1><p>${register?"Guarda tus favoritos desde cualquier dispositivo.":"Accede a tu selección personal."}</p>
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
function openAuthModal(mode="login", product=null) {
  const backdrop = document.querySelector("#authModalBackdrop"); if (!backdrop) return;
  const selected = product || state.products.find(item => item.id === state.pendingFavorite);
  const preview = document.querySelector("#pendingProduct");
  preview.innerHTML = selected ? `<div class="pending-product"><img src="${esc(selected.image)}" alt=""><div><small>SE GUARDARÁ DESPUÉS</small><b>${esc(selected.name)}</b></div></div>` : "";
  renderAuthPanel(document.querySelector("#authModalContent"), mode, "modal");
  backdrop.classList.add("open"); backdrop.setAttribute("aria-hidden","false"); document.body.style.overflow = "hidden";
  setTimeout(() => backdrop.querySelector("input")?.focus(), 100);
}
function closeAuthModal() { const backdrop=document.querySelector("#authModalBackdrop"); backdrop?.classList.remove("open"); backdrop?.setAttribute("aria-hidden","true"); document.body.style.overflow=""; state.pendingFavorite=""; sessionStorage.removeItem("gc_pending_favorite"); }

function renderAccount(mode) {
  const root = document.querySelector("#accountRoot"); if (!root || !state.authReady) return;
  if (state.user && state.role === "admin") { location.replace("admin.html"); return; }
  if (state.user) {
    const name = state.profile.name || state.user.displayName || "Cliente";
    root.innerHTML = `<section class="profile-card"><div class="profile-card-header"><span class="profile-avatar">${esc(name.charAt(0).toUpperCase())}</span><div><p class="kicker blue">MI PERFIL</p><h1>Mis datos</h1><p>Consulta y actualiza tu información personal.</p></div></div><form class="profile-form" id="profileForm"><div class="field"><label>Nombre</label><input name="name" required maxlength="60" value="${esc(name)}"></div><div class="field"><label>Teléfono</label><input name="phone" type="tel" maxlength="25" value="${esc(state.profile.phone || "")}" placeholder="+34 600 000 000"></div><div class="field"><label>Correo electrónico</label><input value="${esc(state.user.email || "")}" disabled><span class="profile-help">El correo electrónico está protegido y no se puede modificar aquí.</span></div><p class="auth-error hidden" data-profile-message></p><div class="profile-actions"><button class="button button-primary" type="submit">Guardar cambios</button><button class="logout-button" data-logout type="button">Cerrar sesión</button></div></form></section>`;
    root.querySelector("#profileForm").addEventListener("submit", saveProfile);
    return;
  }
  const requested = mode || new URLSearchParams(location.search).get("modo") || "login";
  root.innerHTML = `<section class="auth-card"><aside class="auth-visual"><a href="index.html">GINESCLOSET</a><div><p class="kicker">TU ESPACIO PERSONAL</p><h2>Tu selección,<br>siempre contigo.</h2><p>Guarda las piezas que te gustan y vuelve a ellas desde cualquier dispositivo.</p></div><small>ACCESO SEGURO · FIREBASE</small></aside><div id="accountAuthPanel"></div></section>`;
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
  const role = snapshot.exists() ? snapshot.data().role || "customer" : "customer";
  if (role === "admin") { sessionStorage.removeItem("gc_pending_favorite"); location.replace("admin.html"); return; }
  const pending = state.pendingFavorite || sessionStorage.getItem("gc_pending_favorite");
  if (pending) {
    const product = state.products.find(item => item.id === pending);
    if (product) await setDoc(doc(db,"users",user.uid,"favorites",pending),{productId:pending,productName:product.name,productImage:product.image,createdAt:serverTimestamp()});
    state.pendingFavorite=""; sessionStorage.removeItem("gc_pending_favorite");
  }
  if (context === "modal") { closeAuthModal(); showToast(pending ? "Cuenta lista y artículo guardado en favoritos" : "Sesión iniciada", "success"); return; }
  const returnTo = safeReturnPage(); location.replace(returnTo || "catalogo.html");
}

async function ensureProfile(user, extra={}) {
  const reference = doc(db,"users",user.uid), snapshot = await getDoc(reference);
  if (!snapshot.exists()) await setDoc(reference,{name:extra.name || user.displayName || "Cliente",phone:extra.phone || "",email:(user.email || "").toLowerCase(),role:"customer",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
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
async function logoutToStore(){try{await signOut(auth);sessionStorage.removeItem("gc_pending_favorite");location.replace("index.html?sesion=cerrada");}catch{showToast("No se ha podido cerrar la sesión.","error");}}
function safeReturnPage(){const value=new URLSearchParams(location.search).get("return")||"";return /^(?:index|catalogo|novedades|favoritos|cuenta|articulo)\.html(?:[?#].*)?$/i.test(value)?value:"";}
function friendlyError(error){const messages={"auth/email-already-in-use":"Ya existe una cuenta con este correo.","auth/invalid-credential":"El correo o la contraseña no son correctos.","auth/weak-password":"La contraseña debe tener al menos 6 caracteres.","auth/invalid-email":"Introduce un correo válido.","auth/popup-closed-by-user":"Se ha cerrado la ventana de Google.","auth/popup-blocked":"El navegador ha bloqueado la ventana de Google. Permite las ventanas emergentes.","auth/network-request-failed":"No hay conexión. Comprueba Internet e inténtalo de nuevo.","auth/too-many-requests":"Demasiados intentos. Espera unos minutos.","auth/unauthorized-domain":"Falta autorizar este dominio en Firebase Authentication.","auth/operation-not-allowed":"Este método de acceso no está habilitado en Firebase."};return messages[error?.code] || "No se ha podido completar la operación. Inténtalo de nuevo.";}
function showToast(message,type="success"){let toast=document.querySelector(".site-toast");if(!toast){toast=document.createElement("div");toast.className="site-toast";document.body.append(toast);}toast.textContent=message;toast.dataset.type=type;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),3200);}

onSnapshot(collection(db,"products"), snapshot => {
  state.products = snapshot.empty ? DEFAULT_PRODUCTS.map(normalizeProduct) : snapshot.docs.map(item => normalizeProduct({id:item.id,...item.data()})).sort((a,b)=>Number(b.createdOrder||0)-Number(a.createdOrder||0));
  state.productsReady = true; renderPage();
}, error => { console.error(error); state.products=DEFAULT_PRODUCTS.map(normalizeProduct);state.productsReady=true;renderPage(); });

onAuthStateChanged(auth, async user => {
  state.user=user;state.profile={};state.role="customer";state.favorites.clear();state.stopFavorites?.();state.stopFavorites=null;
  if(user){
    try{const snapshot=await getDoc(doc(db,"users",user.uid));if(snapshot.exists()){state.profile=snapshot.data();state.role=state.profile.role||"customer";}else await ensureProfile(user);}catch(error){console.error(error);}
    state.stopFavorites=onSnapshot(collection(db,"users",user.uid,"favorites"), snapshot=>{state.favorites=new Set(snapshot.docs.map(item=>item.id));renderPage();}, error=>{console.error(error);renderPage();});
  }
  state.authReady=true;renderPage();
});

initChrome();
if(page==="catalog")initCatalog();
if(page==="new")initNew();
if(page==="favorites")initFavorites();
renderPage();
