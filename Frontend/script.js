
"use strict";
const API_BASE_URL = "http://localhost:3000";
const STORAGE_KEYS = {
  products: "uniSparkProducts",
  favorites: "uniSparkFavorites"
};

const demoProducts = [
  {
    id: "demo-1",
    title: "Handmade Crochet Keychains",
    category: "Fashion",
    price: 149,
    seller: "Aanya Creates",
    description: "Cute handmade accessories crafted with care.",
    contact: "Demo contact — replace with seller details",
    art: "art-crochet",
    artwork: "MADE WITH LOVE",
    badge: "HANDMADE"
  },
  {
    id: "demo-2",
    title: "Custom Digital Posters",
    category: "Art & Design",
    price: 199,
    seller: "Pixel by Priya",
    description: "Personalized posters for rooms, gifts and events.",
    contact: "Demo contact — replace with seller details",
    art: "art-poster",
    artwork: "YOUR IDEAS, VISUALIZED",
    badge: "CREATIVE PICK"
  },
  {
    id: "demo-3",
    title: "Student Web Design",
    category: "Tech & Digital",
    price: 499,
    seller: "CodeCraft Studio",
    description: "Simple websites and landing pages for small projects.",
    contact: "Demo contact — replace with seller details",
    art: "art-web",
    artwork: "BUILD SOMETHING",
    badge: "DIGITAL SERVICE"
  },
  {
    id: "demo-4",
    title: "Personalized Gift Hampers",
    category: "Food & Gifts",
    price: 349,
    seller: "Little Joy Studio",
    description: "Thoughtful gift boxes for birthdays and special days.",
    contact: "Demo contact — replace with seller details",
    art: "art-gifts",
    artwork: "A LITTLE JOY",
    badge: "GIFT IDEA"
  },
  {
    id: "demo-5",
    title: "Peer Tutoring Sessions",
    category: "Learning",
    price: 99,
    seller: "Campus Study Club",
    description: "Student-led learning sessions for selected subjects.",
    contact: "Demo contact — replace with seller details",
    art: "art-learning",
    artwork: "LEARN TOGETHER",
    badge: "STUDENT SKILL"
  },
  {
    id: "demo-6",
    title: "Handmade Beaded Jewelry",
    category: "Fashion",
    price: 179,
    seller: "Bead Bloom",
    description: "Colourful handmade bracelets and jewelry pieces.",
    contact: "Demo contact — replace with seller details",
    art: "art-jewelry",
    artwork: "YOUR KIND OF CUTE",
    badge: "HANDMADE"
  },
  {
    id: "demo-7",
    title: "Resume & Portfolio Design",
    category: "Services",
    price: 249,
    seller: "NextStep Designs",
    description: "Clean resume and portfolio layouts for students.",
    contact: "Demo contact — replace with seller details",
    art: "art-resume",
    artwork: "YOUR NEXT CHAPTER",
    badge: "CAREER READY"
  },
  {
    id: "demo-8",
    title: "Digital Study Planner",
    category: "Art & Design",
    price: 79,
    seller: "Study Nest",
    description: "Simple digital planning templates for busy students.",
    contact: "Demo contact — replace with seller details",
    art: "art-planner",
    artwork: "PLAN YOUR DAY",
    badge: "DIGITAL DOWNLOAD"
  },
  {
    id: "demo-9",
    title: "Custom Illustrations",
    category: "Art & Design",
    price: 299,
    seller: "Doodle Days",
    description: "Original illustrations made for your special ideas.",
    contact: "Demo contact — replace with seller details",
    art: "art-illustration",
    artwork: "IMAGINE MORE",
    badge: "ORIGINAL ART"
  }
];

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.products);

    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    console.warn("Could not load products:", error);
  }

  return demoProducts.map(product => ({ ...product }));
}

function loadFavorites() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.favorites) || "[]"
    );

    return new Set(
      Array.isArray(saved)
        ? saved.filter(item => typeof item === "string")
        : []
    );
  } catch (error) {
    console.warn("Could not load favorites:", error);
    return new Set();
  }
}

let products = loadProducts();
let favorites = loadFavorites();
let activeCategory = "All";
let searchQuery = "";
let activeSort = "featured";
let toastTimeout = null;
let lastFocusedElement = null;
async function loadListingsFromAPI() {
  try {
    const response = await fetch("http://localhost:3000/api/listings");

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const result = await response.json();

    if (!Array.isArray(result.listings)) {
      throw new Error("Invalid listings response");
    }

    if (result.listings.length === 0) {
      console.log("Database connected; no listings found yet.");
      return;
    }

    const artByCategory = {
      "Art & Design": "art-poster",
      "Fashion": "art-jewelry",
      "Tech & Digital": "art-web",
      "Food & Gifts": "art-gifts",
      "Learning": "art-learning",
      "Services": "art-resume"
    };

    products = result.listings.map(listing => ({
      id: String(listing.id),
      title: listing.title,
      category: listing.category,
      price: Number(listing.price),
      seller: "UNI SPARK Student",
      description: listing.description,
      contact: "",
      art: artByCategory[listing.category] || "art-poster",
      artwork: listing.title,
      badge: "STUDENT LISTING"
    }));

    renderProducts();
    console.log("Listings loaded from Supabase:", products.length);
  } catch (error) {
    console.error("Could not load listings from backend:", error);
    showToast("Could not refresh listings.");
  }
}
function saveProducts() {
  try {
    localStorage.setItem(
      STORAGE_KEYS.products,
      JSON.stringify(products)
    );
    return true;
  } catch (error) {
    console.error("Could not save products:", error);
    showToast("Your browser could not save this listing.");
    return false;
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(
      STORAGE_KEYS.favorites,
      JSON.stringify([...favorites])
    );
  } catch (error) {
    console.warn("Could not save favorites:", error);
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };

    return replacements[character];
  });
}

function formatPrice(price) {
  const amount = Number(price);

  if (!Number.isFinite(amount) || amount < 0) {
    return "Price on request";
  }

  if (amount === 0) return "Free";

  return "₹" + amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function getArtClass(art) {
  const allowedClasses = [
    "art-crochet",
    "art-poster",
    "art-web",
    "art-gifts",
    "art-learning",
    "art-jewelry",
    "art-resume",
    "art-planner",
    "art-illustration"
  ];

  return allowedClasses.includes(art) ? art : "art-poster";
}

function renderProducts() {
  const grid = document.getElementById("productGrid");
  const emptyState = document.getElementById("emptyState");
  const resultsCount = document.getElementById("resultsCount");
  const allCount = document.getElementById("allCount");

  if (!grid || !emptyState || !resultsCount) return;

  const query = searchQuery.trim().toLowerCase();

  let filteredProducts = products.filter(product => {
    const matchesCategory =
      activeCategory === "All" ||
      product.category === activeCategory;

    const searchableText = [
      product.title,
      product.category,
      product.seller,
      product.description
    ].join(" ").toLowerCase();

    return matchesCategory && searchableText.includes(query);
  });

  if (activeSort === "name") {
    filteredProducts.sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  } else if (activeSort === "price-low") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (activeSort === "price-high") {
    filteredProducts.sort((a, b) => b.price - a.price);
  }

  if (allCount) allCount.textContent = products.length;

  resultsCount.innerHTML =
    `Showing <strong>${filteredProducts.length}</strong> of ` +
    `<strong>${products.length}</strong> listings`;

  document.querySelectorAll(".category-button").forEach(button => {
    const isActive = button.dataset.category === activeCategory;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  grid.innerHTML = filteredProducts.map(product => {
    const id = escapeHTML(product.id);
    const title = escapeHTML(product.title);
    const category = escapeHTML(product.category);
    const seller = escapeHTML(product.seller);
    const description = escapeHTML(product.description);
    const artwork = escapeHTML(product.artwork || product.title);
    const artClass = getArtClass(product.art);
    const price = escapeHTML(formatPrice(product.price));
    const initial = escapeHTML(
      (product.seller || "S").trim().charAt(0).toUpperCase()
    );

    const isFavorite = favorites.has(product.id);

    return `
      <article class="product-card">
        <div class="product-art ${artClass}">
          <span>${artwork}</span>
          <span class="art-symbol" aria-hidden="true">✳</span>

          <span class="product-badge">
            ${escapeHTML(product.badge || "STUDENT MADE")}
          </span>

          <button
            class="product-heart ${isFavorite ? "is-favorite" : ""}"
            type="button"
            data-favorite="${id}"
            aria-label="${isFavorite ? "Remove from" : "Add to"} favorites"
            aria-pressed="${isFavorite}"
          >${isFavorite ? "♥" : "♡"}</button>
        </div>

        <div class="product-info">
          <span class="product-category">${category}</span>
          <h3>${title}</h3>
          <p class="product-description">${description}</p>

          <div class="product-seller">
            <span class="seller-avatar">${initial}</span>
            <span>${seller}</span>
          </div>

          <div class="product-bottom">
            <span class="product-price">${price}</span>
            <button
              class="product-contact"
              type="button"
              data-contact="${id}"
            >I'm interested ↗</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  emptyState.hidden = filteredProducts.length !== 0;
  grid.hidden = filteredProducts.length === 0;
}

/* Search */

const searchInput = document.getElementById("searchInput");

if (searchInput) {
  searchInput.addEventListener("input", event => {
    searchQuery = event.target.value;
    renderProducts();
  });
}

/* Sorting */

const sortSelect = document.getElementById("sortSelect");

if (sortSelect) {
  sortSelect.addEventListener("change", event => {
    activeSort = event.target.value;
    renderProducts();
  });
}

/* Categories */

document.querySelectorAll(".category-button").forEach(button => {
  button.addEventListener("click", () => {
    activeCategory = button.dataset.category || "All";
    renderProducts();
  });
});

/* Clear search and filters */

const clearFiltersButton = document.getElementById("clearFilters");

if (clearFiltersButton) {
  clearFiltersButton.addEventListener("click", () => {
    activeCategory = "All";
    searchQuery = "";
    activeSort = "featured";

    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "featured";

    renderProducts();
  });
}

/* Favorite and contact buttons */

const productGrid = document.getElementById("productGrid");

if (productGrid) {
  productGrid.addEventListener("click", event => {
    const favoriteButton = event.target.closest("[data-favorite]");

    if (favoriteButton) {
      const id = favoriteButton.dataset.favorite;

      if (favorites.has(id)) {
        favorites.delete(id);
        showToast("Removed from your favorites.");
      } else {
        favorites.add(id);
        showToast("Added to your favorites!");
      }

      saveFavorites();
      renderProducts();
      return;
    }

    const contactButton = event.target.closest("[data-contact]");

    if (contactButton) {
      const product = products.find(
        item => item.id === contactButton.dataset.contact
      );

      if (!product) {
        showToast("This listing could not be found.");
      } else if (
        product.contact &&
        product.contact.startsWith("Demo contact")
      ) {
        showToast(
          "Sample listing: real seller contact details have not been added."
        );
      } else {
        showToast("Seller contact: " + product.contact);
      }
    }
  });
}

/* Seller listing modal */

const modalBackdrop = document.getElementById("modalBackdrop");
const modalClose = document.getElementById("modalClose");
const listingForm = document.getElementById("listingForm");

function openModal() {
  if (!modalBackdrop) return;

  lastFocusedElement = document.activeElement;
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");

  setTimeout(() => {
    document.getElementById("listingName")?.focus();
  }, 50);
}

function closeModal() {
  if (!modalBackdrop || modalBackdrop.hidden) return;

  modalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");

  if (lastFocusedElement) {
    lastFocusedElement.focus();
  }
}

document.querySelectorAll("[data-open-sell]").forEach(button => {
  button.addEventListener("click", event => {
    event.preventDefault();
    closeMobileMenu();
    openModal();
  });
});

if (modalClose) {
  modalClose.addEventListener("click", closeModal);
}

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", event => {
    if (event.target === modalBackdrop) closeModal();
  });
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
    closeMobileMenu();
  }
});

/* Save a new student listing */

if (listingForm) {
  listingForm.addEventListener("submit", event => {
    event.preventDefault();

    if (!listingForm.reportValidity()) return;

    const formData = new FormData(listingForm);

    const sellerName = String(
      formData.get("sellerName") || ""
    ).trim();

    const title = String(
      formData.get("title") || ""
    ).trim();

    const category = String(
      formData.get("category") || ""
    );

    const price = Number(formData.get("price"));

    const description = String(
      formData.get("description") || ""
    ).trim();

    const contact = String(
      formData.get("contact") || ""
    ).trim();

    const allowedCategories = [
      "Art & Design",
      "Fashion",
      "Tech & Digital",
      "Food & Gifts",
      "Learning",
      "Services"
    ];

    if (
      !sellerName ||
      !title ||
      !description ||
      !contact ||
      !allowedCategories.includes(category) ||
      !Number.isFinite(price) ||
      price < 0 ||
      price > 1000000
    ) {
      showToast("Please check all fields and try again.");
      return;
    }

    const artByCategory = {
      "Art & Design": "art-poster",
      "Fashion": "art-jewelry",
      "Tech & Digital": "art-web",
      "Food & Gifts": "art-gifts",
      "Learning": "art-learning",
      "Services": "art-resume"
    };

    const newProduct = {
      id: "student-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 7),
      title,
      category,
      price,
      seller: sellerName,
      description,
      contact,
      art: artByCategory[category] || "art-poster",
      artwork: title.length > 26
        ? title.slice(0, 23) + "..."
        : title,
      badge: "STUDENT LISTING"
    };

    products.unshift(newProduct);

    if (!saveProducts()) {
      products.shift();
      return;
    }

    listingForm.reset();
    closeModal();

    activeCategory = "All";
    searchQuery = "";
    activeSort = "featured";

    if (searchInput) searchInput.value = "";
    if (sortSelect) sortSelect.value = "featured";

    renderProducts();
    showToast("Your listing was added to this browser's demo!");

    document.getElementById("marketplace")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}

/* Mobile navigation */

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

function closeMobileMenu() {
  if (!menuToggle || !mainNav) return;

  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
  mainNav.classList.remove("open");
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Close navigation" : "Open navigation"
    );
  });

  mainNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMobileMenu);
  });
}

/* Press "/" to focus search */

document.addEventListener("keydown", event => {
  const target = event.target;

  const isTyping =
    target instanceof HTMLElement &&
    (
      target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
    );

  if (
    event.key === "/" &&
    !isTyping &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    event.preventDefault();
    searchInput?.focus();
  }
});

/* Footer year */

const currentYear = document.getElementById("currentYear");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

/* Initialize the marketplace */

renderProducts();
loadListingsFromAPI();

console.log("UNI SPARK marketplace loaded successfully.");
