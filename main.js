// ------------------- GLOBALS -------------------
let allProducts = [];
let activeCategory = "all";
let currentSort = "default";
let searchTerm = "";
let cart = [];

// ------------------- CART HELPERS -------------------
function loadCart() {
  const stored = localStorage.getItem("cart");
  if (stored) {
    try {
      let parsed = JSON.parse(stored);
      if (parsed.length && !parsed[0].quantity) {
        const map = new Map();
        parsed.forEach(p => {
          if (map.has(p.id)) map.get(p.id).quantity++;
          else map.set(p.id, { ...p, quantity: 1 });
        });
        cart = Array.from(map.values());
      } else {
        cart = parsed;
      }
      saveCart();
    } catch(e) { cart = []; }
  } else {
    cart = [];
  }
  updateCartCount();
}

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  if (window.location.pathname.includes("cart.html")) displayCart();
}

function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cart-count").forEach(el => el.textContent = totalItems);
}

function addToCart(product) {
  const existing = cart.find(item => item.id === product.id);
  if (existing) existing.quantity++;
  else cart.push({ ...product, quantity: 1 });
  saveCart();
  showToast(`${product.title.slice(0, 30)} added to cart`);
}

function removeFromCart(productId) {
  const index = cart.findIndex(item => item.id === productId);
  if (index !== -1) {
    if (cart[index].quantity > 1) cart[index].quantity--;
    else cart.splice(index, 1);
    saveCart();
    if (window.location.pathname.includes("cart.html")) displayCart();
  }
}

function deleteItemCompletely(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  if (window.location.pathname.includes("cart.html")) displayCart();
}

function clearCart() {
  if (confirm("Empty your entire cart?")) {
    cart = [];
    saveCart();
    if (window.location.pathname.includes("cart.html")) displayCart();
  }
}

function displayCart() {
  const container = document.getElementById("cart-items");
  const totalSpan = document.getElementById("cart-total");
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = "<p>Your cart is empty. <a href='index.html'>Start shopping →</a></p>";
    if (totalSpan) totalSpan.textContent = "0.00";
    return;
  }

  let total = 0;
  container.innerHTML = "";
  cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <img src="${item.image}" alt="${item.title}" onerror="this.src='https://picsum.photos/id/20/100/100'">
      <div class="cart-item-info">
        <h3>${item.title.slice(0, 60)}</h3>
        <p>$${item.price} each</p>
      </div>
      <div class="cart-item-controls">
        <button class="quantity-btn" data-id="${item.id}" data-dir="decr">-</button>
        <span>${item.quantity}</span>
        <button class="quantity-btn" data-id="${item.id}" data-dir="incr">+</button>
        <button class="remove-btn" data-id="${item.id}">Remove</button>
      </div>
      <div><strong>$${subtotal.toFixed(2)}</strong></div>
    `;
    container.appendChild(div);
  });
  if (totalSpan) totalSpan.textContent = total.toFixed(2);

  document.querySelectorAll(".quantity-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = parseInt(btn.dataset.id);
      const dir = btn.dataset.dir;
      if (dir === "incr") {
        const item = cart.find(i => i.id === id);
        if (item) item.quantity++;
      } else {
        const item = cart.find(i => i.id === id);
        if (item && item.quantity > 1) item.quantity--;
        else deleteItemCompletely(id);
      }
      saveCart();
    });
  });
  document.querySelectorAll(".remove-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteItemCompletely(parseInt(btn.dataset.id)));
  });
}

// ------------------- FETCH FROM DUMMYJSON -------------------
async function loadProducts() {
  const grid = document.getElementById("products-grid");
  const loader = document.getElementById("loader");
  if (!grid) return;
  loader.style.display = "flex";
  grid.innerHTML = "";
  try {
    const res = await fetch("https://dummyjson.com/products");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allProducts = data.products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      description: p.description,
      category: p.category,
      image: p.thumbnail,
      images: p.images,
      rating: p.rating
    }));
    console.log(`Loaded ${allProducts.length} products`);
  } catch (err) {
    grid.innerHTML = "<p style='text-align:center'>Failed to load products. Please refresh.</p>";
    loader.style.display = "none";
    return;
  }
  populateFilterChips(); // Only create filter chips, no category strip
  loader.style.display = "none";
  applyFiltersAndRender();
}

function getUniqueCategories() {
  const cats = allProducts.map(p => p.category);
  return [...new Set(cats)].sort();
}

function populateFilterChips() {
  const categories = getUniqueCategories();
  const filterContainer = document.getElementById("filter-chips");
  if (!filterContainer) return;
  
  filterContainer.innerHTML = `<button class="filter-chip active" data-category="all">All</button>`;
  categories.forEach(cat => {
    const chip = document.createElement("button");
    chip.className = "filter-chip";
    chip.dataset.category = cat;
    chip.textContent = cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ');
    filterContainer.appendChild(chip);
  });
  attachFilterEvents();
}

function attachFilterEvents() {
  const chips = document.querySelectorAll(".filter-chip");
  chips.forEach(chip => {
    chip.removeEventListener("click", filterHandler);
    chip.addEventListener("click", filterHandler);
  });
}

function filterHandler(e) {
  document.querySelectorAll(".filter-chip").forEach(ch => ch.classList.remove("active"));
  e.target.classList.add("active");
  activeCategory = e.target.dataset.category;
  applyFiltersAndRender();
}

function applyFiltersAndRender() {
  let filtered = [...allProducts];
  if (activeCategory !== "all") {
    filtered = filtered.filter(p => p.category === activeCategory);
  }
  if (searchTerm) {
    filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm));
  }
  if (currentSort === "price-low") filtered.sort((a,b) => a.price - b.price);
  else if (currentSort === "price-high") filtered.sort((a,b) => b.price - a.price);
  else if (currentSort === "rating") filtered.sort((a,b) => b.rating - a.rating);
  else if (currentSort === "name") filtered.sort((a,b) => a.title.localeCompare(b.title));
  displayProducts(filtered);
}

function displayProducts(products) {
  const container = document.getElementById("products-grid");
  if (!container) return;
  if (products.length === 0) {
    container.innerHTML = "<p style='text-align:center'>No products match.</p>";
    return;
  }
  container.innerHTML = "";
  products.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="card-img">
        <img src="${prod.image}" alt="${prod.title}" onerror="this.src='https://picsum.photos/id/20/300/300'">
      </div>
      <div class="card-info">
        <span class="product-category">${prod.category}</span>
        <h3 class="product-title">${prod.title.slice(0, 45)}</h3>
        <div class="product-rating">${'★'.repeat(Math.round(prod.rating))}${'☆'.repeat(5 - Math.round(prod.rating))}</div>
        <div class="product-price">$${prod.price}</div>
        <div class="card-actions">
          <button class="add-to-cart">Add to Cart</button>
          <button class="view-details">Quick View</button>
        </div>
      </div>
    `;
    card.querySelector(".add-to-cart").addEventListener("click", () => addToCart(prod));
    card.querySelector(".view-details").addEventListener("click", () => openModal(prod));
    container.appendChild(card);
  });
}

// ------------------- MODAL -------------------
const modal = document.getElementById("product-modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-description");
const modalPrice = document.getElementById("modal-price");
const modalRating = document.getElementById("modal-rating");
let currentModalProduct = null;

function openModal(product) {
  currentModalProduct = product;
  let imgSrc = product.image;
  if (product.images && product.images.length) imgSrc = product.images[0];
  modalImg.src = imgSrc;
  modalImg.onerror = () => modalImg.src = product.image || "https://picsum.photos/id/20/300/300";
  modalTitle.textContent = product.title;
  modalDesc.textContent = product.description.slice(0, 220) + "...";
  modalPrice.textContent = `$${product.price}`;
  modalRating.innerHTML = `Rating: ${'★'.repeat(Math.round(product.rating))}${'☆'.repeat(5 - Math.round(product.rating))}`;
  modal.classList.remove("hidden");
}

document.getElementById("closeModal")?.addEventListener("click", () => modal.classList.add("hidden"));
window.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });
document.getElementById("modal-add-cart")?.addEventListener("click", () => {
  if (currentModalProduct) addToCart(currentModalProduct);
  modal.classList.add("hidden");
});

// ------------------- SEARCH & SORT -------------------
function initSearchAndSort() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchTerm = e.target.value.toLowerCase();
      applyFiltersAndRender();
    });
  }
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      currentSort = e.target.value;
      applyFiltersAndRender();
    });
  }
}

// ------------------- TOAST & UTILS -------------------
function showToast(msg) {
  let toast = document.querySelector(".toast-message");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-message";
    toast.style.position = "fixed";
    toast.style.bottom = "80px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.backgroundColor = "#212121";
    toast.style.color = "white";
    toast.style.padding = "10px 20px";
    toast.style.borderRadius = "4px";
    toast.style.zIndex = "9999";
    toast.style.fontSize = "0.9rem";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => toast.style.opacity = "0", 2000);
}

function initBackToTop() {
  const btn = document.getElementById("backToTop");
  window.addEventListener("scroll", () => {
    if (window.scrollY > 500) btn?.classList.add("show");
    else btn?.classList.remove("show");
  });
  btn?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

function initNewsletter() {
  const form = document.getElementById("newsletter-form");
  const msg = document.getElementById("newsletter-message");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.querySelector("input").value;
      if (email) {
        msg.textContent = "Thanks for subscribing! 🎉";
        msg.style.color = "#2874f0";
        form.reset();
        setTimeout(() => msg.textContent = "", 3000);
      }
    });
  }
}

function initAuthModals() {
  const loginBtns = document.querySelectorAll("#loginBtn, #mobileLoginBtn");
  const signupBtns = document.querySelectorAll("#signupBtn, #mobileSignupBtn");
  loginBtns.forEach(btn => btn.addEventListener("click", () => alert("Demo: Login form would appear here.")));
  signupBtns.forEach(btn => btn.addEventListener("click", () => alert("Demo: Sign up form would appear here.")));
}

function initMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("mobileMenu");
  toggle?.addEventListener("click", () => menu?.classList.toggle("open"));
}

// ------------------- INIT -------------------
document.addEventListener("DOMContentLoaded", () => {
  loadCart();
  if (document.getElementById("products-grid")) {
    loadProducts();
    initSearchAndSort();
  }
  if (document.getElementById("cart-items")) displayCart();
  initBackToTop();
  initNewsletter();
  initAuthModals();
  initMobileMenu();
});

// Cart page specific buttons
document.getElementById("checkout-btn")?.addEventListener("click", () => {
  if (cart.length === 0) alert("Your cart is empty.");
  else alert("Thank you for shopping! (Demo checkout)");
});
document.getElementById("clear-cart-btn")?.addEventListener("click", clearCart);