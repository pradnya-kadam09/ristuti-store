/* ==========================================================================
   RISTUTI HAUTE COUTURE - CLIENT APPLICATION SCRIPT
   ========================================================================== */

const PAGE_SIZE = 24;
let visibleCount = PAGE_SIZE;

// Standard size options across all clothing categories
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

// Active size choices per product card
const selectedCardSizes = {};

const state = {
  products: [],
  allProducts: [],
  cart: JSON.parse(localStorage.getItem("ristuti-cart") || "[]"),
  wishlist: JSON.parse(localStorage.getItem("ristuti-wishlist") || "[]"),
  activeTag: "",
  activeCategory: "All",
  activePriceRange: "",
  activeSort: "",
  activeCoupon: JSON.parse(localStorage.getItem("ristuti-coupon") || "null")
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Currency Formatter (INR)
const money = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount || 0);

// Toast Notification
function toast(message, duration = 3200) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), duration);
}

// Persist Cart & Wishlist
function persistCart() {
  localStorage.setItem("ristuti-cart", JSON.stringify(state.cart));
  renderCart();
}

function persistWishlist() {
  localStorage.setItem("ristuti-wishlist", JSON.stringify(state.wishlist));
  renderWishlist();
  updateWishlistButtons();
}

/* --------------------------------------------------------------------------
   DATA FETCHING & FILTERING
   -------------------------------------------------------------------------- */
async function fetchAllProducts() {
  try {
    const res = await fetch("/api/products");
    state.allProducts = await res.json();
  } catch (err) {
    console.error("Could not fetch products:", err);
  }
}

async function loadProducts() {
  const grid = $("#productGrid");
  if (!state.products.length) {
    grid.innerHTML = `
      <div class="loading-state">
        <div class="luxury-spinner"></div>
        <p>Curating your boutique collection...</p>
      </div>`;
  }

  const search = $("#searchInput").value.trim();
  const category = state.activeCategory;
  const tag = state.activeTag;
  const sort = $("#sortFilter").value;
  const priceRange = $("#priceFilter").value;

  const params = new URLSearchParams();
  if (category && category !== "All") params.set("category", category);
  if (tag) params.set("tag", tag);
  if (search) params.set("search", search);
  if (sort) params.set("sort", sort);

  if (priceRange === "under500") {
    params.set("maxPrice", "500");
  } else if (priceRange === "500to1000") {
    params.set("minPrice", "500");
    params.set("maxPrice", "1000");
  } else if (priceRange === "1000to2000") {
    params.set("minPrice", "1000");
    params.set("maxPrice", "2000");
  } else if (priceRange === "above2000") {
    params.set("minPrice", "2000");
  }

  try {
    const response = await fetch(`/api/products?${params}`);
    state.products = await response.json();
    visibleCount = PAGE_SIZE;
    renderProducts();
    updateFilterBadges();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">Unable to load pieces right now. Please try again.</div>`;
  }
}

/* --------------------------------------------------------------------------
   PRODUCT RENDERING (WITH SIZE SELECTION)
   -------------------------------------------------------------------------- */
function cardHtml(p) {
  const isWishlisted = state.wishlist.includes(p.id);
  const discountPct = p.oldPrice && p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
  
  let badgeHtml = "";
  if (p.tag) {
    const isBestseller = p.tag.includes("BESTSELLER");
    const isSale = p.tag.includes("OFF");
    badgeHtml = `<span class="product-badge ${isBestseller ? 'badge-bestseller' : isSale ? 'badge-sale' : ''}">${p.tag}</span>`;
  }

  const selectedSize = selectedCardSizes[p.id];
  const sizePillsHtml = CLOTHING_SIZES.map((s) => `
    <button type="button" class="card-size-btn ${selectedSize === s ? 'active' : ''}" data-size-val="${s}" data-prod-id="${p.id}" aria-label="Select size ${s}">${s}</button>
  `).join("");

  return `
    <article class="product-card" data-product-id="${p.id}">
      <div class="product-image-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='/images/products/1.jpg'" />
        ${badgeHtml}
        <button class="wishlist-btn ${isWishlisted ? 'active' : ''}" data-wishlist="${p.id}" aria-label="Toggle Wishlist">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <button class="quick-view-btn" data-quickview="${p.id}" aria-label="Quick preview">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/></svg>
        </button>
        <button class="quick-add-bar" data-add="${p.id}">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
          <span>Add to Bag</span>
        </button>
      </div>

      <div class="product-details">
        <span class="product-cat">${p.category}</span>
        <h3 class="product-title" data-quickview="${p.id}" style="cursor:pointer">${p.name}</h3>
        <div class="product-rating">
          <span class="stars-gold">★★★★★</span>
          <span>${p.rating || "4.8"} (${p.reviewCount || 24})</span>
        </div>

        <!-- Size Selection on Card -->
        <div class="card-size-selector" data-size-selector-id="${p.id}">
          <div class="card-size-header">
            <span>Size:</span>
            <span class="selected-size-label" id="cardSizeLabel-${p.id}">${selectedSize ? `Size: ${selectedSize}` : 'Choose size'}</span>
          </div>
          <div class="card-size-pills" id="cardSizePills-${p.id}">
            ${sizePillsHtml}
          </div>
        </div>

        <div class="product-pricing">
          <span class="current-price">${money(p.price)}</span>
          ${p.oldPrice ? `<span class="original-price">${money(p.oldPrice)}</span>` : ""}
          ${discountPct > 0 ? `<span class="discount-pill">${discountPct}% OFF</span>` : ""}
        </div>
      </div>
    </article>
  `;
}

function updateMoreButton() {
  const total = state.products.length;
  $("#resultCount").textContent = total
    ? `Showing ${Math.min(visibleCount, total)} of ${total} curated pieces`
    : "No pieces match your selection";
  $("#loadMore").style.display = total > visibleCount ? "inline-flex" : "none";
}

function renderProducts() {
  const grid = $("#productGrid");
  if (!state.products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No pieces found</h3>
        <p>Try clearing your filters or searching for something else like "Saree", "Shorts", or "Kurti".</p>
        <button class="btn btn-luxury" id="resetFiltersBtn" style="margin-top:16px">Reset All Filters</button>
      </div>`;
    updateMoreButton();
    return;
  }

  grid.innerHTML = state.products.slice(0, visibleCount).map(cardHtml).join("");
  updateMoreButton();
}

function showMoreProducts() {
  const from = visibleCount;
  visibleCount += PAGE_SIZE;
  const nextSlice = state.products.slice(from, visibleCount);
  $("#productGrid").insertAdjacentHTML("beforeend", nextSlice.map(cardHtml).join(""));
  updateMoreButton();
}

/* --------------------------------------------------------------------------
   FILTER CHIPS & BADGES
   -------------------------------------------------------------------------- */
function buildChips() {
  const categories = [...new Set(state.allProducts.map((p) => p.category))];
  const chipsContainer = $("#chips");
  chipsContainer.innerHTML = [
    `<button class="chip active" data-chip="All">All Categories (${state.allProducts.length})</button>`,
    ...categories.map((c) => {
      const count = state.allProducts.filter((p) => p.category === c).length;
      return `<button class="chip" data-chip="${c}">${c} (${count})</button>`;
    })
  ].join("");
}

function syncChips() {
  $$(".chip").forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.chip === state.activeCategory);
  });
}

function updateFilterBadges() {
  const container = $("#activeFilterTags");
  const badges = [];

  if (state.activeCategory !== "All") {
    badges.push(`<span class="filter-badge">Category: ${state.activeCategory} <button data-clear="category">×</button></span>`);
  }
  if (state.activeTag) {
    badges.push(`<span class="filter-badge">Filter: ${state.activeTag} <button data-clear="tag">×</button></span>`);
  }
  const searchVal = $("#searchInput").value.trim();
  if (searchVal) {
    badges.push(`<span class="filter-badge">Search: "${searchVal}" <button data-clear="search">×</button></span>`);
  }
  const priceVal = $("#priceFilter").value;
  if (priceVal) {
    const label = $("#priceFilter").options[$("#priceFilter").selectedIndex].text;
    badges.push(`<span class="filter-badge">Price: ${label} <button data-clear="price">×</button></span>`);
  }

  container.innerHTML = badges.join("");
}

/* --------------------------------------------------------------------------
   CART & SHOPPING BAG
   -------------------------------------------------------------------------- */
function getProductById(id) {
  return state.allProducts.find((p) => p.id === Number(id)) || state.products.find((p) => p.id === Number(id));
}

// Add to cart requires a valid size; different sizes of the same product are distinct items
function addToCart(id, size, quantity = 1) {
  if (!size) {
    toast("Please select a size before adding to cart.");
    const pills = $(`#cardSizePills-${id}`);
    if (pills) {
      pills.classList.remove("size-alert");
      void pills.offsetWidth;
      pills.classList.add("size-alert");
      setTimeout(() => pills.classList.remove("size-alert"), 600);
    }
    return false;
  }

  const product = getProductById(id);
  if (!product) return false;

  const existing = state.cart.find((item) => item.id === product.id && item.size === size);
  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + quantity);
  } else {
    state.cart.push({ id: product.id, size, quantity });
  }

  persistCart();
  toast(`✓ "${product.name}" (Size: ${size}) added to your bag.`);
  return true;
}

function renderCart() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  $("#cartCount").textContent = totalCount;
  $("#drawerCount").textContent = `(${totalCount})`;

  const itemsContainer = $("#cartItems");
  if (!state.cart.length) {
    itemsContainer.innerHTML = `
      <div class="empty-state" style="padding: 40px 10px; border:none;">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" style="margin: 0 auto 12px; color: var(--muted);"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/></svg>
        <h4>Your Bag is Empty</h4>
        <p style="font-size:12px; color:var(--muted); margin: 6px 0 18px;">Discover our newest 300+ styles and select your favorite size.</p>
        <button class="btn btn-luxury" id="emptyCartShopBtn">Explore Collections</button>
      </div>`;
    $("#shippingProgress").style.width = "0%";
    $("#shippingTrackerText").innerHTML = "Add ₹1,499 for <strong>Free Express Shipping</strong>";
    $("#cartSubtotal").textContent = "₹0";
    $("#cartDiscount").textContent = "-₹0";
    $("#discountRow").style.display = "none";
    $("#cartShipping").textContent = "₹0";
    $("#cartTotal").textContent = "₹0";
    return;
  }

  let subtotal = 0;
  itemsContainer.innerHTML = state.cart.map((item) => {
    const p = getProductById(item.id);
    if (!p) return "";
    const itemTotal = p.price * item.quantity;
    subtotal += itemTotal;

    const sizeOptionsHtml = CLOTHING_SIZES.map((s) => `
      <option value="${s}" ${s === item.size ? "selected" : ""}>${s}</option>
    `).join("");

    return `
      <div class="cart-item">
        <img src="${p.image}" alt="${p.name}" />
        <div class="cart-item-info">
          <h4>${p.name}</h4>
          <div class="cart-size-changer">
            <label>Size:</label>
            <select class="cart-size-select" data-change-size-id="${p.id}" data-current-size="${item.size}">
              ${sizeOptionsHtml}
            </select>
          </div>
          <div class="cart-item-meta">${p.category}</div>
          <div class="cart-item-price">${money(p.price)}</div>
          <div class="quantity-controls">
            <button data-qty-id="${p.id}" data-size="${item.size}" data-delta="-1">−</button>
            <span>${item.quantity}</span>
            <button data-qty-id="${p.id}" data-size="${item.size}" data-delta="1">+</button>
          </div>
        </div>
        <button class="remove-btn" data-remove-id="${p.id}" data-size="${item.size}" aria-label="Remove item">×</button>
      </div>`;
  }).join("");

  // Free shipping progress (Goal: ₹1499)
  const freeShippingThreshold = 1499;
  const progressPct = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  $("#shippingProgress").style.width = `${progressPct}%`;

  if (subtotal >= freeShippingThreshold) {
    $("#shippingTrackerText").innerHTML = "🎉 <strong>Congratulations!</strong> You unlocked Free Express Shipping.";
    $("#cartShipping").textContent = "FREE";
  } else {
    const diff = freeShippingThreshold - subtotal;
    $("#shippingTrackerText").innerHTML = `Add <strong>${money(diff)}</strong> more to unlock <strong>Free Express Shipping</strong>`;
    $("#cartShipping").textContent = "₹99";
  }

  // Coupon calculation
  let discount = 0;
  if (state.activeCoupon) {
    discount = Math.round(subtotal * (state.activeCoupon.discountPercent / 100));
    $("#discountRow").style.display = "flex";
    $("#cartDiscount").textContent = `-${money(discount)} (${state.activeCoupon.code})`;
  } else {
    $("#discountRow").style.display = "none";
  }

  const shippingCost = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - discount + shippingCost);

  $("#cartSubtotal").textContent = money(subtotal);
  $("#cartTotal").textContent = money(finalTotal);
}

function openCart() {
  $("#cartDrawer").classList.add("open");
  $("#overlay").classList.add("open");
  closeWishlist();
}

function closeCart() {
  $("#cartDrawer").classList.remove("open");
  $("#overlay").classList.remove("open");
}

/* --------------------------------------------------------------------------
   WISHLIST SYSTEM
   -------------------------------------------------------------------------- */
function toggleWishlist(id) {
  const numId = Number(id);
  const idx = state.wishlist.indexOf(numId);
  const p = getProductById(numId);

  if (idx > -1) {
    state.wishlist.splice(idx, 1);
    toast(`Removed "${p ? p.name : 'Item'}" from your wishlist.`);
  } else {
    state.wishlist.push(numId);
    toast(`♥ Saved "${p ? p.name : 'Item'}" to your wishlist!`);
  }
  persistWishlist();
}

function renderWishlist() {
  const count = state.wishlist.length;
  $("#wishlistCount").textContent = count;
  $("#wishlistDrawerCount").textContent = `(${count})`;

  const container = $("#wishlistItems");
  if (!count) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 10px; border:none;">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.2" style="margin: 0 auto 12px; color: var(--muted);"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <h4>Your Wishlist is Empty</h4>
        <p style="font-size:12px; color:var(--muted); margin: 6px 0 18px;">Click the heart on any piece you love to save it here.</p>
      </div>`;
    return;
  }

  container.innerHTML = state.wishlist.map((id) => {
    const p = getProductById(id);
    if (!p) return "";
    return `
      <div class="cart-item">
        <img src="${p.image}" alt="${p.name}" />
        <div class="cart-item-info">
          <h4>${p.name}</h4>
          <div class="cart-item-meta">${p.category}</div>
          <div class="cart-item-price">${money(p.price)}</div>
          <button class="btn btn-luxury" data-quickview="${p.id}" style="padding: 6px 12px; font-size: 10px; margin-top: 8px;">Select Size & Add</button>
        </div>
        <button class="remove-btn" data-wishlist-remove="${p.id}">×</button>
      </div>`;
  }).join("");
}

function updateWishlistButtons() {
  $$(".wishlist-btn").forEach((btn) => {
    const id = Number(btn.dataset.wishlist);
    const active = state.wishlist.includes(id);
    btn.classList.toggle("active", active);
  });
}

function openWishlist() {
  $("#wishlistDrawer").classList.add("open");
  $("#overlay").classList.add("open");
  closeCart();
}

function closeWishlist() {
  $("#wishlistDrawer").classList.remove("open");
  $("#overlay").classList.remove("open");
}

/* --------------------------------------------------------------------------
   FLYING PARTICLE ANIMATION (ADD TO BAG)
   -------------------------------------------------------------------------- */
function flyToBag(triggerEl) {
  const card = triggerEl.closest(".product-card") || triggerEl.closest(".quickview-grid");
  const img = card ? card.querySelector("img") : null;
  const bagBtn = $("#cartToggle");
  if (!img || !bagBtn || !img.animate) return;

  const a = img.getBoundingClientRect();
  const b = bagBtn.getBoundingClientRect();

  const ghost = img.cloneNode();
  ghost.className = "fly-ghost";
  ghost.style.cssText = `left:${a.left}px;top:${a.top}px;width:${a.width}px;height:${a.height}px;`;
  document.body.appendChild(ghost);

  ghost.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 0.9 },
      { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(0.1)`, opacity: 0.2 }
    ],
    { duration: 650, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
  ).onfinish = () => {
    ghost.remove();
    const count = $("#cartCount");
    count.classList.remove("bump");
    void count.offsetWidth;
    count.classList.add("bump");
  };
}

/* --------------------------------------------------------------------------
   QUICK VIEW MODAL (WITH COMPLETE SIZE SELECTION)
   -------------------------------------------------------------------------- */
function openQuickView(id) {
  const p = getProductById(id);
  if (!p) return;

  const discountPct = p.oldPrice && p.oldPrice > p.price ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) : 0;
  const sizes = CLOTHING_SIZES;
  let modalSelectedSize = selectedCardSizes[p.id] || null;

  $("#quickViewContent").innerHTML = `
    <div class="quickview-image-wrap">
      <img src="${p.image}" alt="${p.name}" />
    </div>
    <div class="quickview-info">
      <span class="product-cat">${p.category}</span>
      <h2>${p.name}</h2>
      <div class="product-rating" style="margin-bottom:14px">
        <span class="stars-gold">★★★★★</span>
        <span>${p.rating || "4.8"} (${p.reviewCount || 24} customer reviews)</span>
      </div>
      <div class="product-pricing" style="margin-bottom:18px">
        <span class="current-price" style="font-size:22px">${money(p.price)}</span>
        ${p.oldPrice ? `<span class="original-price" style="font-size:15px">${money(p.oldPrice)}</span>` : ""}
        ${discountPct > 0 ? `<span class="discount-pill">${discountPct}% OFF</span>` : ""}
      </div>
      <p style="font-size:13px; color:var(--muted); line-height:1.7; margin-bottom:18px">
        ${p.description || "Expertly crafted with premium weaves, tailored for supreme comfort and lasting elegance."}
      </p>

      <div class="size-selector">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="field-label" style="margin-bottom:0">Select Size: *</span>
          <span id="modalSizeNotice" style="font-size:11px; font-weight:700; color:var(--wine)">
            ${modalSelectedSize ? `Selected: ${modalSelectedSize}` : 'Please choose a size'}
          </span>
        </div>
        <div class="size-pills" id="modalSizePills">
          ${sizes.map((s) => `<button type="button" class="size-pill ${modalSelectedSize === s ? 'active' : ''}" data-size-choice="${s}">${s}</button>`).join("")}
        </div>
      </div>

      <div style="display:flex; gap:12px; margin-top:24px">
        <button class="btn btn-luxury full-width" id="quickAddBtn" data-add="${p.id}">
          <span>Add to Bag</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>

      <div style="margin-top:20px; font-size:11px; color:var(--muted); border-top:1px solid var(--border); padding-top:14px;">
        ✦ In stock · Available across sizes XS through XXXL. Ships within 24 hours in luxury boutique packaging.
      </div>
    </div>
  `;

  // Size pill click in modal
  $$("[data-size-choice]").forEach((b) => {
    b.addEventListener("click", () => {
      $$("[data-size-choice]").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      modalSelectedSize = b.dataset.sizeChoice;
      selectedCardSizes[p.id] = modalSelectedSize;

      // Sync with card size selector
      const label = $(`#cardSizeLabel-${p.id}`);
      if (label) label.textContent = `Size: ${modalSelectedSize}`;
      const cardPills = $$(`#cardSizePills-${p.id} .card-size-btn`);
      cardPills.forEach((btn) => btn.classList.toggle("active", btn.dataset.sizeVal === modalSelectedSize));

      const notice = $("#modalSizeNotice");
      if (notice) notice.textContent = `Selected: ${modalSelectedSize}`;
    });
  });

  // Modal Add to Bag
  $("#quickAddBtn").addEventListener("click", (e) => {
    if (!modalSelectedSize) {
      toast("Please select a size before adding to cart.");
      const pills = $("#modalSizePills");
      if (pills) {
        pills.classList.remove("size-alert");
        void pills.offsetWidth;
        pills.classList.add("size-alert");
        setTimeout(() => pills.classList.remove("size-alert"), 600);
      }
      return;
    }

    flyToBag(e.currentTarget);
    addToCart(p.id, modalSelectedSize, 1);
    closeQuickView();
  });

  $("#quickViewModal").classList.add("open");
}

function closeQuickView() {
  $("#quickViewModal").classList.remove("open");
}

/* --------------------------------------------------------------------------
   CHECKOUT SYSTEM (WITH DETAILED SIZE DISPLAY)
   -------------------------------------------------------------------------- */
function openCheckout() {
  if (!state.cart.length) {
    return toast("Please add a piece to your bag before proceeding.");
  }
  closeCart();

  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  let subtotal = 0;
  state.cart.forEach((item) => {
    const p = getProductById(item.id);
    if (p) subtotal += p.price * item.quantity;
  });

  let discount = 0;
  if (state.activeCoupon) {
    discount = Math.round(subtotal * (state.activeCoupon.discountPercent / 100));
    $("#chkDiscountRow").style.display = "flex";
    $("#chkDiscount").textContent = `-${money(discount)} (${state.activeCoupon.code})`;
  } else {
    $("#chkDiscountRow").style.display = "none";
  }

  const freeShipping = subtotal >= 1499;
  const shipping = freeShipping ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - discount + shipping);

  // Render Itemized Checkout lines with Sizes
  const itemsHtml = state.cart.map((item) => {
    const p = getProductById(item.id);
    if (!p) return "";
    return `
      <div class="checkout-item-line">
        <span>${item.quantity}× ${p.name} <strong class="checkout-size-tag">Size: ${item.size}</strong></span>
        <strong>${money(p.price * item.quantity)}</strong>
      </div>
    `;
  }).join("");

  const summaryBox = $(".checkout-summary-box");
  summaryBox.innerHTML = `
    <div class="checkout-items-list">
      ${itemsHtml}
    </div>
    <div class="checkout-summary-row"><span>Items Count:</span><strong id="chkItemCount">${totalCount} piece${totalCount > 1 ? "s" : ""}</strong></div>
    <div class="checkout-summary-row"><span>Subtotal:</span><span id="chkSubtotal">${money(subtotal)}</span></div>
    <div class="checkout-summary-row" id="chkDiscountRow" style="display:${discount > 0 ? "flex" : "none"}"><span>Promo Discount:</span><span id="chkDiscount">-${money(discount)} (${state.activeCoupon?.code})</span></div>
    <div class="checkout-summary-row"><span>Delivery Fee:</span><span id="chkShipping">${freeShipping ? "FREE (Express Delivery)" : "₹99"}</span></div>
    <div class="checkout-summary-row checkout-grand-total"><span>Grand Total:</span><strong id="checkoutTotal">${money(finalTotal)}</strong></div>
  `;

  $("#orderMessage").classList.remove("visible");
  $("#checkoutForm").style.display = "block";
  $("#checkoutModal").classList.add("open");
}

function closeCheckout() {
  $("#checkoutModal").classList.remove("open");
}

/* --------------------------------------------------------------------------
   COUPON PROMO CODE
   -------------------------------------------------------------------------- */
async function applyCoupon() {
  const code = $("#couponInput").value.trim().toUpperCase();
  const msgEl = $("#couponMessage");
  if (!code) {
    msgEl.className = "coupon-msg error";
    msgEl.textContent = "Please enter a coupon code.";
    return;
  }

  try {
    const res = await fetch(`/api/coupon/${encodeURIComponent(code)}`);
    const data = await res.json();
    if (res.ok && data.valid) {
      state.activeCoupon = data;
      localStorage.setItem("ristuti-coupon", JSON.stringify(data));
      msgEl.className = "coupon-msg success";
      msgEl.textContent = `✓ ${data.message}`;
      renderCart();
      toast(`✓ ${data.discountPercent}% Discount applied!`);
    } else {
      throw new Error(data.message || "Invalid coupon code.");
    }
  } catch (err) {
    state.activeCoupon = null;
    localStorage.removeItem("ristuti-coupon");
    msgEl.className = "coupon-msg error";
    msgEl.textContent = err.message || "Invalid coupon code. Try NOIR10 or FESTIVE20";
    renderCart();
  }
}

/* --------------------------------------------------------------------------
   REVIEWS FEED & SUBMISSION
   -------------------------------------------------------------------------- */
let reviewsList = [];
let reviewsShown = 5;

async function loadReviews() {
  try {
    const res = await fetch("/api/reviews");
    const data = await res.json();
    reviewsList = data.reviews || [];

    $("#avgScore").textContent = data.count ? data.average.toFixed(1) : "5.0";
    $("#reviewCount").textContent = `${data.count || 0} Verified Reviews`;

    // Star Distribution Bars
    $("#ratingBars").innerHTML = [5, 4, 3, 2, 1]
      .map((star) => {
        const count = data.breakdown[star] || 0;
        const pct = data.count ? Math.round((count / data.count) * 100) : 0;
        return `
          <div class="score-bar-row">
            <span>${star}★</span>
            <div class="bar-track"><div class="bar-fill" style="width: ${pct}%"></div></div>
            <span>${count}</span>
          </div>`;
      })
      .join("");

    renderReviews();
  } catch (err) {
    console.error("Could not load reviews:", err);
  }
}

function renderReviews() {
  const container = $("#reviewList");
  if (!reviewsList.length) {
    container.innerHTML = `<div class="empty-state">No reviews yet. Be the first to share your experience!</div>`;
    $("#moreReviews").style.display = "none";
    return;
  }

  container.innerHTML = reviewsList
    .slice(0, reviewsShown)
    .map((r) => {
      const initial = (r.name || "C").trim().charAt(0).toUpperCase();
      const date = new Date(r.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      return `
        <article class="review-card">
          <div class="review-card-top">
            <span class="stars-gold">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
            <span class="review-date">${date}</span>
          </div>
          ${r.title ? `<h4>${escapeHtml(r.title)}</h4>` : ""}
          <p>${escapeHtml(r.comment)}</p>
          <div class="review-author">
            <span class="author-avatar">${initial}</span>
            <div class="author-info">
              <strong>${escapeHtml(r.name)}</strong>
              <span class="verified-buyer">✓ Verified Customer</span>
            </div>
          </div>
        </article>`;
    })
    .join("");

  $("#moreReviews").style.display = reviewsList.length > reviewsShown ? "block" : "none";
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[s]));
}

/* --------------------------------------------------------------------------
   EVENT LISTENERS & BINDINGS
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  await fetchAllProducts();
  buildChips();
  await loadProducts();
  renderCart();
  renderWishlist();
  loadReviews();

  // Header Search Trigger
  $("#searchToggle").addEventListener("click", () => {
    $("#searchBarWrap").classList.toggle("visible");
    if ($("#searchBarWrap").classList.contains("visible")) {
      $("#searchInput").focus();
    }
  });

  // Search Input (Real-time debounced)
  let searchTimer;
  $("#searchInput").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadProducts, 220);
  });

  $("#clearSearch").addEventListener("click", () => {
    $("#searchInput").value = "";
    loadProducts();
  });

  // Popular Search Tags
  $$(".quick-tag").forEach((qt) => {
    qt.addEventListener("click", () => {
      $("#searchInput").value = qt.dataset.search;
      loadProducts();
    });
  });

  // Category Pills
  $("#chips").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-chip]");
    if (!chip) return;
    state.activeCategory = chip.dataset.chip;
    syncChips();
    loadProducts();
  });

  // Category Grid Cards (Hero Lookbook)
  $$(".cat-card").forEach((card) => {
    card.addEventListener("click", () => {
      state.activeCategory = card.dataset.filter;
      syncChips();
      loadProducts();
      $("#shop").scrollIntoView({ behavior: "smooth" });
    });
  });

  // Navigation Links with Data-Category
  $$("[data-category]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      state.activeCategory = link.dataset.category;
      syncChips();
      loadProducts();
      $("#shop").scrollIntoView({ behavior: "smooth" });
      $("#mainNav").classList.remove("open");
    });
  });

  // Featured Tabs (All, Bestsellers, New, Trending, Sale)
  $("#featuredTabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".feat-tab");
    if (!tab) return;
    $$(".feat-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    state.activeTag = tab.dataset.tag;
    loadProducts();
  });

  // Sort & Price Filters
  $("#sortFilter").addEventListener("change", loadProducts);
  $("#priceFilter").addEventListener("change", loadProducts);

  // Load More Button
  $("#loadMore").addEventListener("click", showMoreProducts);

  // Active Filter Tag Clear
  $("#activeFilterTags").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-clear]");
    if (!btn) return;
    const type = btn.dataset.clear;
    if (type === "category") state.activeCategory = "All";
    else if (type === "tag") {
      state.activeTag = "";
      $$(".feat-tab").forEach((t) => t.classList.remove("active"));
      $(".feat-tab").classList.add("active");
    } else if (type === "search") $("#searchInput").value = "";
    else if (type === "price") $("#priceFilter").value = "";

    syncChips();
    loadProducts();
  });

  // Reset Filters Button
  document.addEventListener("click", (e) => {
    if (e.target.id === "resetFiltersBtn") {
      state.activeCategory = "All";
      state.activeTag = "";
      $("#searchInput").value = "";
      $("#priceFilter").value = "";
      $("#sortFilter").value = "";
      $$(".feat-tab").forEach((t) => t.classList.remove("active"));
      $(".feat-tab").classList.add("active");
      syncChips();
      loadProducts();
    }
  });

  // Product Grid Action Delegation (Size pill click, Quick Add, Wishlist, Quickview)
  $("#productGrid").addEventListener("click", (e) => {
    // 1. Size pill clicked on card
    const sizeBtn = e.target.closest("[data-size-val]");
    if (sizeBtn) {
      const prodId = Number(sizeBtn.dataset.prodId);
      const chosenSize = sizeBtn.dataset.sizeVal;
      selectedCardSizes[prodId] = chosenSize;

      const container = $(`#cardSizePills-${prodId}`);
      if (container) {
        container.querySelectorAll(".card-size-btn").forEach((b) => {
          b.classList.toggle("active", b.dataset.sizeVal === chosenSize);
        });
      }
      const label = $(`#cardSizeLabel-${prodId}`);
      if (label) {
        label.textContent = `Size: ${chosenSize}`;
      }
      return;
    }

    // 2. Quick Add to Bag clicked
    const addBtn = e.target.closest("[data-add]");
    if (addBtn) {
      const prodId = Number(addBtn.dataset.add);
      const chosenSize = selectedCardSizes[prodId];
      if (!chosenSize) {
        toast("Please select a size before adding to cart.");
        const pills = $(`#cardSizePills-${prodId}`);
        if (pills) {
          pills.classList.remove("size-alert");
          void pills.offsetWidth;
          pills.classList.add("size-alert");
          setTimeout(() => pills.classList.remove("size-alert"), 600);
        }
        return;
      }
      flyToBag(addBtn);
      addToCart(prodId, chosenSize, 1);
      return;
    }

    // 3. Toggle Wishlist
    const wishBtn = e.target.closest("[data-wishlist]");
    if (wishBtn) {
      toggleWishlist(wishBtn.dataset.wishlist);
      return;
    }

    // 4. Quick View Modal
    const qvBtn = e.target.closest("[data-quickview]");
    if (qvBtn) {
      openQuickView(qvBtn.dataset.quickview);
      return;
    }
  });

  // Cart & Wishlist Drawer Toggles
  $("#cartToggle").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#wishlistToggle").addEventListener("click", openWishlist);
  $("#closeWishlist").addEventListener("click", closeWishlist);
  $("#overlay").addEventListener("click", () => {
    closeCart();
    closeWishlist();
  });

  // Empty cart shop button
  document.addEventListener("click", (e) => {
    if (e.target.id === "emptyCartShopBtn") {
      closeCart();
      $("#shop").scrollIntoView({ behavior: "smooth" });
    }
  });

  // Cart Drawer: Size Changer, Quantity Stepper & Remove
  $("#cartItems").addEventListener("change", (e) => {
    const sizeSelect = e.target.closest(".cart-size-select");
    if (!sizeSelect) return;
    const id = Number(sizeSelect.dataset.changeSizeId);
    const oldSize = sizeSelect.dataset.currentSize;
    const newSize = sizeSelect.value;
    if (oldSize === newSize) return;

    const item = state.cart.find((i) => i.id === id && i.size === oldSize);
    if (!item) return;

    // Check if target size already exists; if so, merge quantities
    const existingTarget = state.cart.find((i) => i.id === id && i.size === newSize);
    if (existingTarget) {
      existingTarget.quantity = Math.min(10, existingTarget.quantity + item.quantity);
      state.cart = state.cart.filter((i) => !(i.id === id && i.size === oldSize));
    } else {
      item.size = newSize;
    }

    persistCart();
    const p = getProductById(id);
    toast(`✓ Size updated to ${newSize} for "${p ? p.name : 'item'}".`);
  });

  $("#cartItems").addEventListener("click", (e) => {
    const qtyBtn = e.target.closest("[data-qty-id]");
    if (qtyBtn) {
      const id = Number(qtyBtn.dataset.qtyId);
      const size = qtyBtn.dataset.size;
      const delta = Number(qtyBtn.dataset.delta);
      const item = state.cart.find((i) => i.id === id && i.size === size);
      if (item) {
        item.quantity += delta;
        if (item.quantity < 1) {
          state.cart = state.cart.filter((i) => !(i.id === id && i.size === size));
        }
        persistCart();
      }
      return;
    }

    const removeBtn = e.target.closest("[data-remove-id]");
    if (removeBtn) {
      const id = Number(removeBtn.dataset.removeId);
      const size = removeBtn.dataset.size;
      state.cart = state.cart.filter((i) => !(i.id === id && i.size === size));
      persistCart();
      return;
    }
  });

  // Wishlist Drawer Delegation
  $("#wishlistItems").addEventListener("click", (e) => {
    const qvBtn = e.target.closest("[data-quickview]");
    if (qvBtn) {
      closeWishlist();
      openQuickView(qvBtn.dataset.quickview);
      return;
    }
    const removeBtn = e.target.closest("[data-wishlist-remove]");
    if (removeBtn) {
      toggleWishlist(removeBtn.dataset.wishlistRemove);
      return;
    }
  });

  $("#moveAllWishlistToBag").addEventListener("click", () => {
    if (!state.wishlist.length) return toast("Wishlist is already empty.");
    // For items in wishlist, if user hasn't selected a size, open quickview for the first item
    const firstId = state.wishlist[0];
    closeWishlist();
    openQuickView(firstId);
    toast("Please choose your preferred size for this piece.");
  });

  // Coupon Apply
  $("#applyCouponBtn").addEventListener("click", applyCoupon);

  // Quick View Close
  $("#closeQuickView").addEventListener("click", closeQuickView);
  $("#quickViewModal").addEventListener("click", (e) => {
    if (e.target.id === "quickViewModal") closeQuickView();
  });

  // Mobile Menu Toggle
  $("#menuToggle").addEventListener("click", () => {
    $("#mainNav").classList.toggle("open");
  });

  // Checkout Open & Close
  $("#checkoutButton").addEventListener("click", openCheckout);
  $("#closeCheckout").addEventListener("click", closeCheckout);
  $("#checkoutModal").addEventListener("click", (e) => {
    if (e.target.id === "checkoutModal") closeCheckout();
  });

  // Checkout Form Submission
  $("#checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!state.cart.length) return toast("Your bag is empty.");

    const form = new FormData(e.currentTarget);
    const button = $("#placeOrderButton");
    button.disabled = true;
    button.innerHTML = `<span>Placing your order...</span>`;

    const payload = {
      customer: {
        name: form.get("name"),
        phone: form.get("phone"),
        email: form.get("email")
      },
      address: form.get("address"),
      note: form.get("note"),
      paymentMethod: form.get("paymentMethod"),
      promoCode: state.activeCoupon ? state.activeCoupon.code : null,
      items: state.cart.map((item) => ({ id: item.id, size: item.size || "M", quantity: item.quantity }))
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not place order.");

      const order = result.order;
      state.cart = [];
      persistCart();
      $("#checkoutForm").style.display = "none";

      const orderItemsHtml = order.items.map((item) => `
        <li style="margin-bottom:6px; display:flex; justify-content:space-between;">
          <span>${item.quantity}× <strong>${escapeHtml(item.name)}</strong> (Size: <strong style="color:var(--wine)">${escapeHtml(item.size)}</strong>)</span>
          <span>${money(item.price * item.quantity)}</span>
        </li>
      `).join("");

      $("#orderMessage").innerHTML = `
        <div style="text-align:center; padding: 10px 0;">
          <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#2e7d32" stroke-width="2" style="margin:0 auto 14px"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          <h3 style="font-family:var(--serif); font-size:26px; color:var(--wine); margin:0 0 8px;">Order Confirmed, ${escapeHtml(order.customer.name)}!</h3>
          <p style="font-size:13px; color:var(--muted); margin:0 0 20px;">Thank you for shopping with RISTUTI. Your pieces are being handpicked and prepared for dispatch.</p>
          
          <div style="background:#fff; border:1px solid var(--border); border-radius:8px; padding:18px; text-align:left; font-size:13px; line-height:1.8;">
            <div>Order ID: <strong>${escapeHtml(order.id)}</strong></div>
            <div>Delivery To: <strong>${escapeHtml(order.customer.name)} (${escapeHtml(order.customer.phone)})</strong></div>
            <div>Address: <strong>${escapeHtml(order.address)}</strong></div>
            <div>Payment Method: <strong>${escapeHtml(order.paymentMethod)}</strong></div>
            <div style="margin:10px 0 6px; font-weight:700; color:var(--noir);">Ordered Items:</div>
            <ul style="padding-left:18px; margin:0 0 10px;">${orderItemsHtml}</ul>
            <div style="border-top:1px solid var(--border); padding-top:8px;">Total Payable: <strong style="font-size:16px; color:var(--wine)">${money(order.total)}</strong></div>
          </div>

          <div style="margin-top:20px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
            <button class="btn btn-luxury" onclick="window.print()">Print Order Receipt</button>
            <button class="btn btn-outline" onclick="document.getElementById('checkoutModal').classList.remove('open')">Continue Browsing</button>
          </div>
        </div>
      `;
      $("#orderMessage").classList.add("visible");
    } catch (err) {
      toast(err.message || "Failed to place order.");
    } finally {
      button.disabled = false;
      button.innerHTML = `<span>Confirm & Place Order</span>`;
    }
  });

  // Star Picker on Review Form
  $("#starPicker").addEventListener("click", (e) => {
    const btn = e.target.closest(".star-btn");
    if (!btn) return;
    const rating = Number(btn.dataset.star);
    $("#ratingInput").value = rating;
    $$("#starPicker .star-btn").forEach((b) => {
      b.classList.toggle("active", Number(b.dataset.star) <= rating);
    });
  });

  // Review Form Submission
  $("#reviewForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!$("#ratingInput").value) return toast("Please select a star rating first.");

    const form = e.currentTarget;
    const button = $("#reviewSubmit");
    button.disabled = true;
    button.innerHTML = `<span>Submitting...</span>`;

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit review.");

      form.reset();
      $("#ratingInput").value = "";
      $$("#starPicker .star-btn").forEach((b) => b.classList.remove("active"));
      toast("✓ Thank you! Your review has been published.");
      await loadReviews();
    } catch (err) {
      toast(err.message || "Error submitting review.");
    } finally {
      button.disabled = false;
      button.innerHTML = `<span>Submit Verified Review</span>`;
    }
  });

  // More Reviews Button
  $("#moreReviews").addEventListener("click", () => {
    reviewsShown += 5;
    renderReviews();
  });

  // VIP Newsletter Form
  $("#newsletterForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#newsletterEmail").value.trim();
    if (!email) return;

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      toast(data.message || "Welcome to the VIP Club!", 4000);
      $("#newsletterEmail").value = "";
      // Pre-fill coupon in cart
      $("#couponInput").value = "NOIR10";
      applyCoupon();
    } catch {
      toast("Welcome! Use code NOIR10 at checkout for 10% off.");
    }
  });
});
