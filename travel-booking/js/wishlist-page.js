/* ================================================================
   TravelEase — wishlist-page.js
   Powers wishlist.html only.

   WHAT THIS FILE DOES:
   1.  Reads saved hotel IDs from WishlistManager (wishlist.js)
   2.  Looks up each hotel object from hotels[] in data.js
   3.  Renders a responsive grid of wishlist cards
   4.  Each card: View Hotel modal | Book Now link | Remove button
   5.  Remove updates LocalStorage and re-renders immediately
   6.  Clear Wishlist button with confirmation
   7.  Updates the count label in the toolbar

   DEPENDENCIES (loaded before this file):
   • data.js       → hotels[], formatPrice(), generateStarHTML()
   • wishlist.js   → WishlistManager.getAll(), .toggle(), .syncHearts()
================================================================ */


/* ================================================================
   PART 1 — INITIALISE
================================================================ */
document.addEventListener("DOMContentLoaded", function () {
  var yearSpan = document.getElementById("currentYear");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  renderWishlistPage();        /* draw all cards                   */
  attachToolbarButtons();      /* wire clear button                */
  attachModalClose();          /* wire modal close button          */
  initNavbar();
  initScrollTop();
});


/* ================================================================
   PART 2 — RENDER THE FULL WISHLIST PAGE
   ─────────────────────────────────────────────────────────────
   Steps:
   1. Get the array of saved hotel IDs from LocalStorage
   2. Map each ID → full hotel object using getHotelById() (data.js)
   3. Filter out any IDs that no longer match a hotel
   4. Render cards or the empty state
================================================================ */
function renderWishlistPage() {
  var grid = document.getElementById("wishlistGrid");
  if (!grid) return;

  /* Step 1: get saved IDs e.g. ["taj-exotica-goa", "leela-palace-bengaluru"] */
  var savedIds = WishlistManager.getAll();

  /* Step 2: convert each ID → full hotel object
     CONCEPT: Array.map()
     ────────────────────────────────────────────
     .map() transforms every item in an array and returns a NEW array.
     ["taj-exotica-goa", ...]
       → [{ id:"taj-exotica-goa", name:"Taj Exotica...", ... }, ...]

     getHotelById() is defined in data.js — it scans hotels[]
     and returns the matching object, or undefined if not found.
  */
  var wishlistHotels = savedIds.map(function (id) {
    return getHotelById(id);   /* from data.js */
  });

  /* Step 3: filter out any undefined results (stale IDs)
     CONCEPT: Array.filter()
     ────────────────────────────────────────────
     .filter() keeps only items where the callback returns true.
     Boolean(hotel) is true for real objects, false for undefined.
  */
  wishlistHotels = wishlistHotels.filter(function (hotel) {
    return Boolean(hotel);
  });

  /* Update the toolbar count */
  updateCount(wishlistHotels.length);

  /* Sync the navbar badge */
  WishlistManager.updateNavBadge(savedIds.length);

  /* Step 4: render */
  if (wishlistHotels.length === 0) {
    grid.innerHTML = buildEmptyState();
    return;
  }

  grid.innerHTML = wishlistHotels.map(function (hotel, index) {
    return buildWishlistCard(hotel, index);
  }).join("");

  /* Wire up per-card buttons after injecting HTML */
  attachCardButtons();

  /* Sync hearts — all are filled since every card is in the wishlist */
  WishlistManager.syncHearts();
}


/* ================================================================
   PART 3 — BUILD ONE WISHLIST CARD
   ─────────────────────────────────────────────────────────────
   Returns an HTML string for a single hotel card.
   Three action buttons:
     • Book Now   → links to booking.html with pre-filled params
     • View Hotel → opens a modal with full hotel details
     • Remove     → calls removeFromWishlist(hotelId) then re-renders
================================================================ */
function buildWishlistCard(hotel, index) {
  var delay    = (index * 0.07) + "s";
  var discount = hotel.originalPrice
    ? Math.round((1 - hotel.pricePerNight / hotel.originalPrice) * 100)
    : 0;

  return `
    <article
      class="wishlist-card"
      role="listitem"
      data-hotel-id="${hotel.id}"
      style="animation-delay:${delay};"
    >

      <!-- ── Image section ── -->
      <div class="wishlist-card__img-wrap">
        <img
          src="${hotel.image}"
          alt="${hotel.name} in ${hotel.location}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'"
        />

        <!-- Category badge -->
        <span class="badge wishlist-card__badge">${hotel.category}</span>

        <!--
          Heart button — pre-filled (solid) since this hotel IS in wishlist.
          data-wishlist-id allows WishlistManager to toggle it.
          When clicked, WishlistManager removes it from LocalStorage,
          and our custom listener below re-renders the page.
        -->
        <button
          class="wishlist-card__heart is-liked"
          data-wishlist-id="${hotel.id}"
          aria-label="Remove ${hotel.name} from wishlist"
          aria-pressed="true"
        >
          <i class="fa-solid fa-heart" aria-hidden="true"></i>
        </button>

        <!-- Price tag -->
        <span class="wishlist-card__price-tag">
          ${formatPrice(hotel.pricePerNight)}/night
        </span>

        <!-- Discount pill -->
        ${discount > 0 ? `
          <span style="
            position:absolute; bottom:var(--sp-3); left:var(--sp-3);
            background:var(--clr-danger); color:white;
            font-size:var(--fs-xs); font-weight:700;
            padding:2px 8px; border-radius:var(--radius-full);">
            ${discount}% OFF
          </span>` : ""}
      </div>

      <!-- ── Card body ── -->
      <div class="wishlist-card__body">

        <span class="wishlist-card__location">
          <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
          ${hotel.location}
        </span>

        <h2 class="wishlist-card__name">${hotel.name}</h2>

        <p class="wishlist-card__desc">${hotel.description}</p>

        <!-- Rating + reviews -->
        <div class="wishlist-card__meta">
          <span class="stars" aria-label="Rating ${hotel.rating} out of 5">
            ${generateStarHTML(hotel.rating)}
          </span>
          <span style="font-weight:700;color:var(--clr-text-heading);">
            ${hotel.rating}
          </span>
          <span style="color:var(--clr-text-muted);font-size:var(--fs-xs);">
            (${hotel.reviewCount.toLocaleString("en-IN")} reviews)
          </span>
          ${hotel.availableRooms <= 5 ? `
            <span style="font-size:var(--fs-xs);font-weight:700;color:var(--clr-danger);">
              <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
              Only ${hotel.availableRooms} left!
            </span>` : ""}
        </div>

      </div>

      <!-- ── Card footer: action buttons ── -->
      <div class="wishlist-card__footer">

        <!-- Book Now — spans full width -->
        <a
          href="booking.html?hotel=${hotel.id}&destination=${hotel.destination}"
          class="wishlist-card__btn wishlist-card__btn--book wishlist-card__btn-book"
          aria-label="Book ${hotel.name} — ${formatPrice(hotel.pricePerNight)} per night"
        >
          <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
          Book Now – ${formatPrice(hotel.pricePerNight)}/night
        </a>

        <!-- View Hotel -->
        <button
          class="wishlist-card__btn wishlist-card__btn--view"
          data-action="view"
          data-hotel-id="${hotel.id}"
          aria-label="View details for ${hotel.name}"
        >
          <i class="fa-solid fa-eye" aria-hidden="true"></i>
          View Hotel
        </button>

        <!-- Remove from Wishlist -->
        <button
          class="wishlist-card__btn wishlist-card__btn--remove"
          data-action="remove"
          data-hotel-id="${hotel.id}"
          aria-label="Remove ${hotel.name} from wishlist"
        >
          <i class="fa-solid fa-heart-crack" aria-hidden="true"></i>
          Remove
        </button>

      </div>

    </article>
  `;
}


/* ================================================================
   PART 4 — EMPTY STATE
================================================================ */
function buildEmptyState() {
  return `
    <div class="wishlist-empty" role="status" style="grid-column:1/-1;">
      <div class="wishlist-empty__heart" aria-hidden="true">
        <i class="fa-regular fa-heart"></i>
      </div>
      <h2>Your wishlist is empty</h2>
      <p>
        Browse hotels and click the
        <i class="fa-regular fa-heart" style="color:var(--clr-danger);"></i>
        heart button on any hotel card to save it here.
      </p>
      <div style="display:flex;gap:var(--sp-4);justify-content:center;flex-wrap:wrap;">
        <a href="hotels.html" class="btn btn--primary btn--lg">
          <i class="fa-solid fa-hotel" aria-hidden="true"></i>
          Browse Hotels
        </a>
        <a href="index.html" class="btn btn--outline btn--lg">
          <i class="fa-solid fa-house" aria-hidden="true"></i>
          Go to Home
        </a>
      </div>
    </div>
  `;
}


/* ================================================================
   PART 5 — ATTACH CARD BUTTON HANDLERS
   ─────────────────────────────────────────────────────────────
   CONCEPT: Event Delegation on the grid
   ─────────────────────────────────────────────────────────────
   One click listener on the grid container handles ALL buttons
   on ALL cards. We check e.target.closest("[data-action]") to
   find which button was clicked and what action to take.

   We also listen for heart toggle events from WishlistManager.
   Since WishlistManager fires on ANY [data-wishlist-id] click,
   we re-render after a short delay so removed cards disappear.
================================================================ */
function attachCardButtons() {
  var grid = document.getElementById("wishlistGrid");
  if (!grid) return;

  /* Remove previous listener before re-attaching (avoid duplicates) */
  grid.removeEventListener("click", handleCardClick);
  grid.addEventListener("click",    handleCardClick);
}

function handleCardClick(e) {
  /* Did user click a [data-action] button? */
  var btn = e.target.closest("[data-action]");
  if (btn) {
    var action  = btn.dataset.action;
    var hotelId = btn.dataset.hotelId;

    if (action === "view")   openHotelModal(hotelId);
    if (action === "remove") removeFromWishlist(hotelId);
    return;
  }

  /*
    Did user click the heart button [data-wishlist-id]?
    WishlistManager handles the toggle itself (removes from storage).
    We just need to re-render the page to remove the card.
  */
  var heartBtn = e.target.closest("[data-wishlist-id]");
  if (heartBtn) {
    /* Small delay so WishlistManager finishes its toggle first */
    setTimeout(function () {
      renderWishlistPage();
    }, 80);
  }
}


/* ================================================================
   PART 6 — REMOVE FROM WISHLIST
   ─────────────────────────────────────────────────────────────
   Calls WishlistManager.toggle() which:
   1. Reads the ID array from LocalStorage
   2. Removes this hotelId using .filter()
   3. Writes the updated array back with JSON.stringify

   Then we animate the card out before re-rendering.
================================================================ */
function removeFromWishlist(hotelId) {
  /* Find the card element so we can animate it out */
  var card = document.querySelector(".wishlist-card[data-hotel-id='" + hotelId + "']");

  /* Animate: fade + slide up */
  if (card) {
    card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
    card.style.opacity    = "0";
    card.style.transform  = "translateY(-12px) scale(0.97)";
  }

  /* After animation, toggle in storage and re-render */
  setTimeout(function () {
    /*
      WishlistManager.toggle(hotelId):
      ─ reads  localStorage → JSON.parse → array
      ─ removes hotelId via .filter(id => id !== hotelId)
      ─ writes array back → JSON.stringify → localStorage
    */
    WishlistManager.toggle(hotelId);

    /* Re-render the whole grid with updated data */
    renderWishlistPage();

    showToast("Removed from wishlist", "");
  }, 300);
}


/* ================================================================
   PART 7 — TOOLBAR BUTTONS
================================================================ */
function attachToolbarButtons() {
  var clearBtn = document.getElementById("clearWishlistBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      clearWishlist();
    });
  }
}

function clearWishlist() {
  var n = WishlistManager.count();

  if (n === 0) {
    showToast("Your wishlist is already empty.", "");
    return;
  }

  /*
    window.confirm() → native browser dialog.
    Returns true (OK) or false (Cancel).
  */
  var ok = window.confirm(
    "Remove all " + n + " hotel" + (n !== 1 ? "s" : "") + " from your wishlist?\n\n" +
    "This cannot be undone."
  );
  if (!ok) return;

  /* WishlistManager.clear() → localStorage.removeItem(WISHLIST_KEY) */
  WishlistManager.clear();

  renderWishlistPage();   /* re-render → shows empty state */
  showToast("Wishlist cleared.", "");
}


/* ================================================================
   PART 8 — UPDATE COUNT LABEL
================================================================ */
function updateCount(n) {
  var el = document.getElementById("wishlistCount");
  if (!el) return;
  el.innerHTML = "<strong>" + n + "</strong> saved hotel" + (n !== 1 ? "s" : "");
}


/* ================================================================
   PART 9 — VIEW HOTEL MODAL
================================================================ */
function openHotelModal(hotelId) {
  var hotel = getHotelById(hotelId);   /* from data.js */
  if (!hotel) return;

  var modal   = document.getElementById("hotelModal");
  var content = document.getElementById("modalContent");
  if (!modal || !content) return;

  var amenitiesHTML = hotel.amenities.map(function (a) {
    return `<li style="display:flex;align-items:center;gap:6px;
                        font-size:var(--fs-sm);color:var(--clr-text-body);">
              <i class="fa-solid fa-check"
                 style="color:var(--clr-primary);font-size:0.7rem;"
                 aria-hidden="true"></i>${a}
            </li>`;
  }).join("");

  content.innerHTML = `
    <!-- Image header -->
    <div style="position:relative;height:220px;overflow:hidden;
                border-radius:var(--radius-xl) var(--radius-xl) 0 0;">
      <img src="${hotel.image}" alt="${hotel.name}"
           style="width:100%;height:100%;object-fit:cover;"
           onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'" />
      <div style="position:absolute;inset:0;
                  background:linear-gradient(to top,rgba(0,0,0,0.55),transparent);"></div>
      <p style="position:absolute;bottom:var(--sp-4);left:var(--sp-5);
                color:white;font-family:var(--ff-heading);
                font-size:var(--fs-xl);font-weight:700;">${hotel.name}</p>
    </div>

    <!-- Body -->
    <div style="padding:var(--sp-6);">
      <!-- Location + rating -->
      <div style="display:flex;justify-content:space-between;
                  align-items:flex-start;margin-bottom:var(--sp-5);flex-wrap:wrap;gap:var(--sp-3);">
        <div>
          <p style="display:flex;align-items:center;gap:var(--sp-1);
                    font-size:var(--fs-sm);color:var(--clr-primary);
                    font-weight:700;margin-bottom:var(--sp-2);">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            ${hotel.location}
          </p>
          <div style="display:flex;align-items:center;gap:var(--sp-2);">
            <span class="stars">${generateStarHTML(hotel.rating)}</span>
            <strong>${hotel.rating}</strong>
            <span style="color:var(--clr-text-muted);font-size:var(--fs-sm);">
              (${hotel.reviewCount.toLocaleString("en-IN")} reviews)
            </span>
          </div>
        </div>
        <div style="text-align:right;">
          ${hotel.originalPrice ? `
            <p style="font-size:var(--fs-sm);color:var(--clr-text-muted);
                      text-decoration:line-through;">
              ${formatPrice(hotel.originalPrice)}
            </p>` : ""}
          <p style="font-size:var(--fs-2xl);font-weight:800;
                    color:var(--clr-text-heading);">${formatPrice(hotel.pricePerNight)}</p>
          <p style="font-size:var(--fs-xs);color:var(--clr-text-muted);">per night</p>
        </div>
      </div>

      <!-- Description -->
      <p style="color:var(--clr-text-body);line-height:1.75;
                margin-bottom:var(--sp-5);">${hotel.description}</p>

      <!-- Amenities -->
      <h3 style="font-size:var(--fs-base);font-weight:700;
                 color:var(--clr-text-heading);margin-bottom:var(--sp-3);">Amenities</h3>
      <ul style="display:grid;grid-template-columns:1fr 1fr;
                 gap:var(--sp-2);margin-bottom:var(--sp-6);">
        ${amenitiesHTML}
      </ul>

      <!-- Action buttons -->
      <div style="display:flex;gap:var(--sp-3);">
        <a href="booking.html?hotel=${hotel.id}&destination=${hotel.destination}"
           class="btn btn--primary btn--lg"
           style="flex:1;justify-content:center;">
          <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
          Book Now – ${formatPrice(hotel.pricePerNight)}/night
        </a>
        <button onclick="closeHotelModal()" class="btn btn--outline">
          Close
        </button>
      </div>
    </div>
  `;

  /* Show the modal */
  modal.style.display = "flex";
  requestAnimationFrame(function () {
    modal.classList.add("is-open");
  });
  document.body.style.overflow = "hidden";

  /* Close on backdrop click */
  modal.addEventListener("click", function onBackdrop(e) {
    if (e.target === modal) {
      closeHotelModal();
      modal.removeEventListener("click", onBackdrop);
    }
  });
}

function attachModalClose() {
  var btn = document.getElementById("modalClose");
  if (btn) btn.addEventListener("click", closeHotelModal);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeHotelModal();
  });
}

function closeHotelModal() {
  var modal = document.getElementById("hotelModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(function () { modal.style.display = "none"; }, 300);
}


/* ================================================================
   PART 10 — NAVBAR + SCROLL-TO-TOP + TOAST
================================================================ */
function initNavbar() {
  var hamburgerBtn = document.getElementById("hamburgerBtn");
  var navLinks     = document.getElementById("navLinks");
  var navbar       = document.querySelector(".navbar");

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener("click", function () {
      var isOpen = navLinks.classList.toggle("is-open");
      this.classList.toggle("is-open", isOpen);
      this.setAttribute("aria-expanded", String(isOpen));
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.classList.contains("navbar__link")) {
        navLinks.classList.remove("is-open");
        hamburgerBtn.classList.remove("is-open");
        hamburgerBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
  if (navbar) {
    window.addEventListener("scroll", function () {
      navbar.classList.toggle("navbar--scrolled", window.scrollY > 10);
    }, { passive: true });
  }
}

function initScrollTop() {
  var btn = document.getElementById("scrollTopBtn");
  if (!btn) return;
  window.addEventListener("scroll", function () {
    btn.classList.toggle("is-visible", window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

var _toastTimer = null;
function showToast(message, type) {
  var toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className   = "toast is-visible" + (type ? " toast--" + type : "");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 2500);
}
