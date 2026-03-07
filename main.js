let allProducts = [];
let cart = JSON.parse(localStorage.getItem("cart")) || [];

//CART JS CODE

function addToCart(product) {
    cart.push(product);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const counter = document.getElementById("cart-count");
    if (counter) {
        counter.textContent = cart.length;
    }
}

//PRODUCTS JS CODE

async function loadProducts() {
    try {
        const main = document.getElementById("products");
        if (!main) return;
        main.innerHTML = "<p>Loading products...</p>";
        const response = await fetch("https://fakestoreapi.com/products");
        allProducts = await response.json();
        displayProducts(allProducts);
    } catch (error) {
        const main = document.getElementById("products");
        if (main) {
            main.innerHTML = "<p>Failed to load products.</p>";
        }
        console.error(error);
    }
}

function displayProducts(products) {
    const main = document.getElementById("products");
    if (!main) return;
    main.innerHTML = "";
    products.forEach(product => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
        <div class="product-img">
            <img src="${product.image}" alt="${product.title}">
        </div>
        <div class="product-info">
            <span class="category">${product.category}</span>
            <h3 class="title">${product.title.slice(0, 20)}</h3>
            <div class="rating">
            ${'★'.repeat(Math.round(product.rating.rate))}${'☆'.repeat(5 - Math.round(product.rating.rate))}
            </div>
            <span class="price">$${product.price}</span>
            <div class="actions">
                <button class="btn add">Add to Cart</button>
                <button class="btn view">View Details</button>
            </div>
        </div>
        `;

        main.appendChild(card);
        const viewBtn = card.querySelector(".view");
        viewBtn.addEventListener("click", () => openModal(product));
        const addBtn = card.querySelector(".add");
        addBtn.addEventListener("click", () => addToCart(product));
    });
}


//MODAL JS CODE

const modal = document.getElementById("modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-description");
const modalPrice = document.getElementById("modal-price");
const modalRating = document.getElementById("modal-rating");
const closeBtn = document.getElementById("close");


function openModal(product) {
    if (!modal) return;

    modalImg.src = product.image;
    modalTitle.textContent = product.title;
    modalDesc.textContent = product.description.slice(0, 250);
    modalPrice.textContent = "$" + product.price;

    modalRating.textContent =
        "Rating: " +
        "★".repeat(Math.round(product.rating.rate)) +
        "☆".repeat(5 - Math.round(product.rating.rate));
    modal.classList.remove("hidden");
}

if (closeBtn) {
    closeBtn.onclick = () => modal.classList.add("hidden");
}

window.onclick = e => {
    if (e.target === modal) {
        modal.classList.add("hidden");
    }
};


//SEARCH JS CODE


const searchInput = document.getElementById("search-input");

if (searchInput) {
    searchInput.addEventListener("input", () => {
        const term = searchInput.value.toLowerCase();
        const filtered = allProducts.filter(p =>
            p.title.toLowerCase().includes(term)
        );
        displayProducts(filtered);
    });
}


//FILTER JS CODE

const filterButtons = document.querySelectorAll(".filter-btn");

filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const category = btn.dataset.category;
        if (category === "all") {
            displayProducts(allProducts);
        } else {
            const filtered = allProducts.filter(p =>
                p.category === category
            );
            displayProducts(filtered);
        }
    });
});


//SORT JS CODE


const sortSelect = document.getElementById("sort-select");

if (sortSelect) {
    sortSelect.addEventListener("change", () => {
        const value = sortSelect.value;
        let sorted = [...allProducts];

        if (value === "price-low") {
            sorted.sort((a, b) => a.price - b.price);
        }

        else if (value === "price-high") {
            sorted.sort((a, b) => b.price - a.price);
        }

        else if (value === "rating") {
            sorted.sort((a, b) => b.rating.rate - a.rating.rate);
        }

        else if (value === "name") {
            sorted.sort((a, b) => a.title.localeCompare(b.title));
        }

        displayProducts(sorted);
    });
}

//CART JS CODE

function displayCart() {

    const cartItems = document.getElementById("cart-items");
    const totalEl = document.getElementById("cart-total");

    if (!cartItems) return;
    cartItems.innerHTML = "";

    let total = 0;
    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
        if (totalEl) totalEl.textContent = "0";
        return;
    }

    cart.forEach((item, index) => {
        total += item.price;

        const div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
        <img src="${item.image}">
        <div>
            <h3>${item.title.slice(0, 40)}</h3>
            <p>$${item.price}</p>
        </div>
        <button class="remove-btn">Remove</button>
        `;

        div.querySelector(".remove-btn")
            .addEventListener("click", () => removeFromCart(index));
        cartItems.appendChild(div);
    });

    if (totalEl) {
        totalEl.textContent = total.toFixed(2);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    displayCart();
}


//INIT JS CODE

updateCartCount();
displayCart();

if (document.getElementById("products")) {
    loadProducts();
}