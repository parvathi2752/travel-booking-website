/* ================================================================
   TravelEase — main.js
   Powers the index.html homepage.

   RESPONSIBILITIES:
   1. Render destination cards from data.js
   2. Render featured hotel cards from data.js
   3. Handle the hero search form → redirect to hotels.html
   4. Navbar hamburger toggle
   5. Scroll-to-top button
   6. Newsletter form
   7. Scroll reveal (fade-up) animation
   8. Auto-fill current year in footer
================================================================ */


/* ================================================================
   PART 1 — WAIT FOR THE DOM TO LOAD
   ----------------------------------------------------------------
   CONCEPT: DOMContentLoaded
   -----------------------------------------------
   The browser reads HTML top-to-bottom. If our script runs before
   an element exists, document.getElementById() returns null
   and everything crashes.

   DOMContentLoaded fires only AFTER the browser has finished
   reading all the HTML and built the full DOM tree.
   Putting our code here guarantees every element exists.
================================================================ */
document.addEventListener("DOMContentLoaded", function () {

  /* ─── auto-fill current year in footer ─── */
  const yearSpan = document.getElementById("currentYear");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  /* ─── run all initialisers ─── */
  renderDestinations();
  renderFeaturedHotels();
  initSearchForm();
  initNavbar();
  initScrollTop();
  initNewsletter();
  initScrollReveal();
});


/* ================================================================
   PART 2 — RENDER DESTINATION CARDS
   ----------------------------------------------------------------
   Reads destinations[] from data.js and injects cards into
   the empty <div id="destinationsGrid"> on the homepage.

   CONCEPT: innerHTML vs createElement
   -----------------------------------------------
   We build an array of HTML strings using .map(), join them
   into one big string, and assign to innerHTML in a SINGLE
   operation. This is faster than creating elements one-by-one
   because it causes only ONE browser repaint.
================================================================ */
function renderDestinations() {
  const grid = document.getElementById("destinationsGrid");
  if (!grid) return;

  /* destinations[] comes from data.js loaded before this script */
  const html = destinations.map(function (dest) {
    return `
      <a
        href="hotels.html?destination=${dest.id}"
        class="destination-card fade-up"
        role="listitem"
        aria-label="Explore hotels in ${dest.name}"
      >
        <!-- Background image set as inline style (JS-driven) -->
        <div
          class="destination-card__bg"
          style="background-image: url('${dest.image}'); background-color: ${dest.gradient.split(",")[1] || "#1a4fa8"};"
          role="img"
          aria-label="${dest.name}"
        ></div>

        <!-- Dark overlay handled by CSS -->
        <div class="destination-card__overlay" aria-hidden="true"></div>

        <!-- Card text content -->
        <div class="destination-card__content">
          <span class="destination-card__count">
            <i class="fa-solid fa-hotel" aria-hidden="true"></i>
            ${dest.hotelCount}+ hotels
          </span>
          <h3 class="destination-card__city">${dest.name}</h3>
          <p class="destination-card__tagline">${dest.tagline}</p>
          <span class="destination-card__link" aria-hidden="true">
            Explore <i class="fa-solid fa-arrow-right"></i>
          </span>
        </div>
      </a>
    `;
  }).join("");   /* join turns array of strings → one big string */

  grid.innerHTML = html;

  /* trigger scroll reveal on the new cards */
  observeElements(grid.querySelectorAll(".fade-up"));
}


/* ================================================================
   PART 3 — RENDER FEATURED HOTEL CARDS
   ----------------------------------------------------------------
   getFeaturedHotels() is defined in data.js — it filters
   hotels where isFeatured === true and returns up to 3.
================================================================ */
function renderFeaturedHotels() {
  const grid = document.getElementById("featuredHotelsGrid");
  if (!grid) return;

  /* Get only featured hotels, show max 3 on homepage */
  const featured = getFeaturedHotels().slice(0, 3);

  if (featured.length === 0) {
    grid.innerHTML = "<p style='text-align:center;color:var(--clr-text-muted)'>No featured hotels yet.</p>";
    return;
  }

  const html = featured.map(function (hotel) {
    const discount = hotel.originalPrice
      ? Math.round((1 - hotel.pricePerNight / hotel.originalPrice) * 100)
      : 0;

    return `
      <article class="hotel-card fade-up" role="listitem">

        <!-- Image -->
        <div class="hotel-card__image-wrap">
          <img
            src="${hotel.image}"
            alt="${hotel.name} in ${hotel.location}"
            loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'"
          />
          <span class="badge hotel-card__badge">${hotel.category}</span>

          <!--
            WISHLIST HEART BUTTON
            data-wishlist-id is read by WishlistManager (wishlist.js).
            The module handles toggle, localStorage, and icon update.
          -->
          <button
            class="hotel-card__wishlist"
            data-wishlist-id="${hotel.id}"
            aria-label="Add ${hotel.name} to wishlist"
            aria-pressed="false"
          >
            <i class="fa-regular fa-heart" aria-hidden="true"></i>
          </button>

          ${discount > 0
            ? `<span style="position:absolute;bottom:var(--sp-3);left:var(--sp-3);
                            background:var(--clr-danger);color:white;
                            font-size:var(--fs-xs);font-weight:700;
                            padding:2px 8px;border-radius:var(--radius-full);">
                 ${discount}% OFF
               </span>`
            : ""}
        </div>

        <!-- Body -->
        <div class="hotel-card__body">
          <span class="hotel-card__location">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            ${hotel.location}
          </span>

          <h3 class="hotel-card__name">${hotel.name}</h3>

          <!-- Stars -->
          <div class="hotel-card__meta">
            <span class="stars" aria-label="Rating ${hotel.rating} out of 5">
              ${generateStarHTML(hotel.rating)}
            </span>
            <span class="hotel-card__rating-score">${hotel.rating}</span>
            <span class="hotel-card__rating-label">
              (${hotel.reviewCount.toLocaleString("en-IN")})
            </span>
          </div>
        </div>

        <!-- Footer: price + button -->
        <div class="hotel-card__footer">
          <div class="hotel-card__price-wrap">
            ${hotel.originalPrice
              ? `<span style="font-size:var(--fs-xs);color:var(--clr-text-muted);
                              text-decoration:line-through;">
                   ${formatPrice(hotel.originalPrice)}
                 </span>`
              : ""}
            <span class="hotel-card__price">${formatPrice(hotel.pricePerNight)}</span>
            <span class="hotel-card__price-sub">per night</span>
          </div>
          <a
            href="booking.html?hotel=${hotel.id}&destination=${hotel.destination}"
            class="hotel-card__btn"
            aria-label="Book ${hotel.name}"
          >
            Book Now
          </a>
        </div>

      </article>
    `;
  }).join("");

  grid.innerHTML = html;
  observeElements(grid.querySelectorAll(".fade-up"));

  /* Sync heart state with LocalStorage so previously-liked hotels
     show filled hearts immediately on page load */
  if (typeof WishlistManager !== "undefined") {
    WishlistManager.syncHearts();
  }
}


/* ================================================================
   PART 4 — HERO SEARCH FORM
   ----------------------------------------------------------------
   This is the central feature: when the user fills in the
   destination and clicks Search, we redirect to hotels.html
   with URL parameters so hotels.js can pre-apply the filters.

   URL produced:
     hotels.html?destination=goa&checkin=2026-11-01&checkout=2026-11-05&guests=2

   -----------------------------------------------
   CONCEPT: URL Parameters (Query String)
   -----------------------------------------------
   A URL can carry data after the "?" symbol:
     page.html?key1=value1&key2=value2

   hotels.js reads these with:
     new URLSearchParams(window.location.search).get("destination")

   This is how pages communicate with each other in pure HTML/JS —
   no backend, no cookies, no localStorage needed.
================================================================ */
function initSearchForm() {
  const form        = document.getElementById("searchForm");
  const destInput   = document.getElementById("destination");
  const checkinInput  = document.getElementById("checkin");
  const checkoutInput = document.getElementById("checkout");
  const guestsInput   = document.getElementById("guests");

  if (!form) return;

  /* ── Set minimum dates to today (can't check in the past) ── */
  const today = new Date().toISOString().split("T")[0];   // "2026-10-03"
  if (checkinInput)  checkinInput.min  = today;
  if (checkoutInput) checkoutInput.min = today;

  /* ── When check-in changes, check-out must be at least the next day ── */
  if (checkinInput && checkoutInput) {
    checkinInput.addEventListener("change", function () {
      const nextDay = new Date(this.value);
      nextDay.setDate(nextDay.getDate() + 1);
      checkoutInput.min   = nextDay.toISOString().split("T")[0];
      checkoutInput.value = nextDay.toISOString().split("T")[0];
    });
  }

  /* ── Form submit: validate then redirect ── */
  form.addEventListener("submit", function (e) {
    e.preventDefault();   /* stop default page reload */

    const destination = destInput   ? destInput.value.trim()   : "";
    const checkin     = checkinInput  ? checkinInput.value     : "";
    const checkout    = checkoutInput ? checkoutInput.value    : "";
    const guests      = guestsInput   ? guestsInput.value      : "2";

    /* ──────────────────────────────────────────────────────────
       SEARCH LOGIC: map what the user typed to a destination ID
       ──────────────────────────────────────────────────────────
       The user might type "Goa", "goa", "GOA", or even "south goa".
       We need to match that to the destination id ("goa") that
       hotels.js uses for filtering.

       STEP 1: lowercase the input — "GOA" → "goa"
       STEP 2: loop through destinations[] from data.js
       STEP 3: for each destination, check if the user's text
               contains the destination name (or vice versa)
       STEP 4: if found, use that destination's id as the URL param
    ────────────────────────────────────────────────────────── */
    const query    = destination.toLowerCase();   // e.g. "goa", "bengaluru"
    let   destId   = "";                          // will hold "goa", "delhi", etc.

    if (query) {
      /*
        destinations[] is from data.js.
        .find() returns the FIRST item that passes the test,
        or undefined if nothing matches.

        We check two directions:
          a) does the user's text include the dest name?
             "south goa" includes "goa" → match
          b) does the dest name include the user's text?
             dest.name.toLowerCase() = "goa", query = "goa" → match

        We also check the dest.id directly:
             dest.id = "bengaluru", query = "bengaluru" → match
      */
      const matched = destinations.find(function (dest) {
        const dName = dest.name.toLowerCase();   // "goa", "hyderabad", etc.
        const dId   = dest.id.toLowerCase();     // same as name but slugified

        return (
          dName === query          ||   /* exact match: "goa" === "goa" */
          dId   === query          ||   /* id match: "bengaluru" === "bengaluru" */
          query.includes(dName)    ||   /* user typed "south goa" — contains "goa" */
          dName.includes(query)         /* dest name contains user text "beng…" */
        );
      });

      if (matched) {
        destId = matched.id;   /* e.g. "goa" */
      }
    }

    /* ── Build the URL ── */
    /*
      URLSearchParams is a built-in browser API that safely
      encodes values for use in URLs.
      e.g. "Taj Mahal Hotel" → "Taj%20Mahal%20Hotel"
      We don't need to handle encoding manually.
    */
    const params = new URLSearchParams();

    if (destId)   params.set("destination", destId);
    if (!destId && destination) params.set("q", destination); /* free-text search */
    if (checkin)  params.set("checkin",  checkin);
    if (checkout) params.set("checkout", checkout);
    if (guests)   params.set("guests",   guests);

    /* Save to sessionStorage so booking.html can read it later */
    sessionStorage.setItem("searchParams", JSON.stringify({
      destination: destId || destination,
      checkin, checkout, guests
    }));

    /* ── Redirect to hotels.html ── */
    window.location.href = "hotels.html?" + params.toString();
    /*
      This line navigates the browser to:
      hotels.html?destination=goa&checkin=2026-11-01&checkout=2026-11-03&guests=2

      hotels.js reads these params in its handleUrlParams() function
      and pre-applies the filters automatically.
    */
  });
}


/* ================================================================
   PART 5 — NAVBAR HAMBURGER
================================================================ */
function initNavbar() {
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const navLinks     = document.getElementById("navLinks");
  const navbar       = document.querySelector(".navbar");

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener("click", function () {
      const isOpen = navLinks.classList.toggle("is-open");
      this.classList.toggle("is-open", isOpen);
      this.setAttribute("aria-expanded", String(isOpen));
    });

    /* Close mobile nav when any link is clicked */
    navLinks.addEventListener("click", function (e) {
      if (e.target.classList.contains("navbar__link")) {
        navLinks.classList.remove("is-open");
        hamburgerBtn.classList.remove("is-open");
        hamburgerBtn.setAttribute("aria-expanded", "false");
      }
    });

    /* Close mobile nav when clicking outside */
    document.addEventListener("click", function (e) {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove("is-open");
        hamburgerBtn.classList.remove("is-open");
        hamburgerBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Add shadow to navbar when page is scrolled */
  if (navbar) {
    window.addEventListener("scroll", function () {
      navbar.classList.toggle("navbar--scrolled", window.scrollY > 10);
    }, { passive: true });
  }
}


/* ================================================================
   PART 6 — SCROLL-TO-TOP BUTTON
================================================================ */
function initScrollTop() {
  const btn = document.getElementById("scrollTopBtn");
  if (!btn) return;

  window.addEventListener("scroll", function () {
    btn.classList.toggle("is-visible", window.scrollY > 400);
  }, { passive: true });

  btn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}


/* ================================================================
   PART 7 — NEWSLETTER FORM
================================================================ */
function initNewsletter() {
  const form    = document.getElementById("newsletterForm");
  const input   = document.getElementById("newsletterEmail");
  const message = document.getElementById("newsletterMessage");

  if (!form) return;

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const email = input ? input.value.trim() : "";

    /* Simple email validation */
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      if (message) {
        message.textContent = "Please enter a valid email address.";
        message.className = "newsletter__message newsletter__message--error";
      }
      return;
    }

    /* Simulate success (no backend) */
    if (message) {
      message.textContent = "🎉 You're subscribed! Watch your inbox for exclusive deals.";
      message.className = "newsletter__message newsletter__message--success";
    }
    if (input) input.value = "";

    /* Clear message after 5 seconds */
    setTimeout(function () {
      if (message) message.textContent = "";
    }, 5000);
  });
}


/* ================================================================
   PART 8 — SCROLL REVEAL (INTERSECTION OBSERVER)
   ----------------------------------------------------------------
   CONCEPT: IntersectionObserver
   -----------------------------------------------
   We want sections to "fade up" as the user scrolls down.

   The old way: listen to the "scroll" event and check element
   positions on every pixel of scroll → very slow (jank).

   The modern way: IntersectionObserver. You register elements
   you want to watch, and the browser tells you when each one
   enters or leaves the viewport. It runs off the main thread
   so it never blocks scrolling.

   When an element enters the viewport:
   → add .is-visible class
   → CSS transition: opacity 0 → 1, translateY 30px → 0
================================================================ */

/* One shared observer instance for the whole page */
const scrollObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        scrollObserver.unobserve(entry.target);  /* stop watching once visible */
      }
    });
  },
  {
    threshold: 0.1,    /* trigger when 10% of the element is in view */
    rootMargin: "0px 0px -40px 0px"  /* offset: trigger slightly before fully in view */
  }
);

function initScrollReveal() {
  /* Observe all elements with class "fade-up" */
  document.querySelectorAll(".fade-up").forEach(function (el, i) {
    el.style.transitionDelay = (i * 0.07) + "s";  /* stagger: 0s, 0.07s, 0.14s… */
    scrollObserver.observe(el);
  });

  /* Also observe section headers */
  document.querySelectorAll(".section-header").forEach(function (el) {
    el.classList.add("fade-up");
    scrollObserver.observe(el);
  });
}

/* Called by renderDestinations() and renderFeaturedHotels()
   to observe newly injected elements */
function observeElements(elements) {
  elements.forEach(function (el, i) {
    el.style.transitionDelay = (i * 0.08) + "s";
    scrollObserver.observe(el);
  });
}
