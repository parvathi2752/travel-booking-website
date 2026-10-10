/* ================================================================
   TravelEase — features.js
   12 Advanced Frontend Features — pure Vanilla JS.

   Load order: add  <script src="js/features.js"></script>
   at the BOTTOM of <body> on every page, LAST of all scripts.

   TABLE OF CONTENTS
   ─────────────────
   01. Page Loading Animation
   02. Toast Notification System
   03. Smooth Scrolling
   04. Image Hover Effects
   05. Hotel Image Slider
   06. Search Suggestions
   07. Filter Count Badge
   08. Empty-State Messages
   09. Form Success Animation
   10. Back-to-Top Button (with scroll progress ring)
   11. Scroll Animations (IntersectionObserver)
   12. Responsive Mobile Menu (with overlay)
================================================================ */

/* Run everything after the DOM is fully parsed */
document.addEventListener("DOMContentLoaded", function () {
  Feature01_PageLoader();
  Feature02_Toast.init();
  Feature03_SmoothScroll();
  Feature04_ImageHover();
  Feature05_ImageSlider.initAll();
  Feature06_SearchSuggestions.init();
  Feature07_FilterCount.init();
  Feature10_BackToTop.init();
  Feature11_ScrollAnimations.init();
  /* Feature12_MobileMenu disabled — each page has its own initNavbar()
     which handles the hamburger. Running both caused double-toggle bug. */
});


/* ================================================================
   01. PAGE LOADING ANIMATION
   ─────────────────────────────────────────────────────────────
   Shows a full-screen spinner while the page loads.
   Hides itself once window "load" fires (images + fonts done).

   CONCEPT: window.onload vs DOMContentLoaded
   ─────────────────────────────────────────────────────────────
   DOMContentLoaded  → fires when HTML is parsed (fast)
   window load       → fires when ALL images/fonts are loaded (slow)
   We show the loader immediately, hide it on window load.
================================================================ */
function Feature01_PageLoader() {

  /* Build the loader element and inject it into <body> */
  var loader = document.createElement("div");
  loader.className  = "page-loader";
  loader.id         = "pageLoader";
  loader.setAttribute("role", "status");
  loader.setAttribute("aria-label", "Loading page");
  loader.innerHTML  = `
    <div class="page-loader__bar" aria-hidden="true"></div>
    <div class="page-loader__spinner" aria-hidden="true"></div>
    <p class="page-loader__text">TravelEase</p>
    <p class="page-loader__sub">Loading your next adventure…</p>
  `;
  document.body.insertBefore(loader, document.body.firstChild);

  /*
    Hide the loader when the page is fully ready.
    We use setTimeout as a fallback in case "load" already fired
    (e.g. from browser cache).
  */
  function hideLoader() {
    loader.classList.add("is-hidden");
    /* Remove from DOM after transition ends */
    loader.addEventListener("transitionend", function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, { once: true });
  }

  if (document.readyState === "complete") {
    /* Already loaded (from cache) */
    setTimeout(hideLoader, 300);
  } else {
    window.addEventListener("load", function () {
      setTimeout(hideLoader, 200);
    });
  }
}


/* ================================================================
   02. TOAST NOTIFICATION SYSTEM
   ─────────────────────────────────────────────────────────────
   A rich, stacking toast system with 4 types:
     success, error, warning, info
   Each toast auto-dismisses after a configurable duration.

   Usage from any other script:
     ToastManager.show("Hotel saved!", "success")
     ToastManager.show("Something went wrong", "error", 5000)

   CONCEPT: Creating DOM elements dynamically
   ─────────────────────────────────────────────────────────────
   document.createElement("div") creates a new div in memory.
   We set its properties, then append it to the container.
   This is more reliable than setting innerHTML for interactive
   elements because we can attach event listeners directly.
================================================================ */
var Feature02_Toast = {

  container: null,

  /* Icon map: type → Font Awesome class */
  icons: {
    success : "fa-circle-check",
    error   : "fa-circle-xmark",
    warning : "fa-triangle-exclamation",
    info    : "fa-circle-info"
  },

  /* Title map */
  titles: {
    success : "Success",
    error   : "Error",
    warning : "Warning",
    info    : "Info"
  },

  init: function () {
    /* Create the container that holds all toasts */
    this.container = document.createElement("div");
    this.container.className = "toast-container";
    this.container.setAttribute("aria-live", "polite");
    this.container.setAttribute("aria-atomic", "false");
    document.body.appendChild(this.container);

    /* Make globally available so other scripts can call it */
    window.ToastManager = this;
  },

  /* ── show(message, type, duration) ── */
  show: function (message, type, duration) {
    type     = type     || "info";
    duration = duration || 3500;

    var icon  = this.icons[type]  || this.icons.info;
    var title = this.titles[type] || "Notice";
    var self  = this;

    /* Create the toast element */
    var toast = document.createElement("div");
    toast.className = "toast-item toast-item--" + type;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
      <i class="fa-solid ${icon} toast-item__icon" aria-hidden="true"></i>
      <div class="toast-item__body">
        <p class="toast-item__title">${title}</p>
        <p class="toast-item__message">${message}</p>
      </div>
      <button class="toast-item__close" aria-label="Dismiss notification">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
      <span class="toast-item__progress"
            style="animation-duration: ${duration}ms;"
            aria-hidden="true"></span>
    `;

    /* Add close button handler */
    toast.querySelector(".toast-item__close").addEventListener("click", function () {
      self.dismiss(toast);
    });

    /* Add to DOM, then trigger show animation on next frame */
    this.container.appendChild(toast);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add("is-visible");
      });
    });
    /*
      CONCEPT: Double requestAnimationFrame
      We call rAF twice so the browser has time to register the
      element's initial state (opacity: 0) before we add is-visible.
      Without this, the transition wouldn't play.
    */

    /* Auto-dismiss after duration */
    var timer = setTimeout(function () {
      self.dismiss(toast);
    }, duration);

    /* Pause auto-dismiss on hover (user is reading it) */
    toast.addEventListener("mouseenter", function () {
      clearTimeout(timer);
      var progress = toast.querySelector(".toast-item__progress");
      if (progress) progress.style.animationPlayState = "paused";
    });

    toast.addEventListener("mouseleave", function () {
      var progress = toast.querySelector(".toast-item__progress");
      if (progress) progress.style.animationPlayState = "running";
      timer = setTimeout(function () { self.dismiss(toast); }, 1500);
    });

    return toast;
  },

  dismiss: function (toast) {
    toast.classList.remove("is-visible");
    toast.addEventListener("transitionend", function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, { once: true });
  }
};


/* ================================================================
   03. SMOOTH SCROLLING
   ─────────────────────────────────────────────────────────────
   Intercepts all anchor links (#section) and smoothly scrolls
   to the target instead of jumping instantly.

   CONCEPT: event.preventDefault()
   ─────────────────────────────────────────────────────────────
   By default, clicking <a href="#section"> jumps instantly.
   e.preventDefault() stops that default behaviour.
   We then manually call scrollIntoView with smooth behaviour.
================================================================ */
function Feature03_SmoothScroll() {

  document.addEventListener("click", function (e) {
    var link = e.target.closest("a[href^='#']");
    if (!link) return;

    var targetId = link.getAttribute("href").slice(1); /* remove the # */
    if (!targetId) return;

    var target = document.getElementById(targetId);
    if (!target) return;

    e.preventDefault();

    var navHeight = document.querySelector(".navbar")
      ? document.querySelector(".navbar").offsetHeight
      : 0;

    /* Calculate the position, accounting for sticky navbar */
    var targetTop = target.getBoundingClientRect().top
                  + window.pageYOffset
                  - navHeight
                  - 16;  /* 16px breathing room */

    window.scrollTo({ top: targetTop, behavior: "smooth" });
  });
}


/* ================================================================
   04. IMAGE HOVER EFFECTS
   ─────────────────────────────────────────────────────────────
   Wraps images that have [data-hover-caption] in a .img-hover-wrap
   and injects the caption overlay automatically.
   No HTML changes needed — add the data attribute and it works.
================================================================ */
function Feature04_ImageHover() {
  var images = document.querySelectorAll("img[data-hover-caption]");

  images.forEach(function (img) {
    /* Skip if already wrapped */
    if (img.parentElement.classList.contains("img-hover-wrap")) return;

    var caption = img.dataset.hoverCaption;

    /* Create wrapper */
    var wrap = document.createElement("div");
    wrap.className = "img-hover-wrap";

    /* Insert wrapper before the image in the DOM */
    img.parentNode.insertBefore(wrap, img);

    /* Move image inside wrapper */
    wrap.appendChild(img);

    /* Create caption overlay */
    var cap = document.createElement("div");
    cap.className   = "img-hover-caption";
    cap.textContent = caption;
    wrap.appendChild(cap);
  });
}


/* ================================================================
   05. HOTEL IMAGE SLIDER
   ─────────────────────────────────────────────────────────────
   Turns any [data-slider] container into a swipeable image
   carousel. Works with touch (swipe) and mouse click.

   CONCEPT: Touch events
   ─────────────────────────────────────────────────────────────
   touchstart  → finger touches screen  (record start position)
   touchend    → finger lifts           (check how far it moved)
   If moved > 50px → swipe detected → go prev/next

   CONCEPT: CSS transform for animation
   ─────────────────────────────────────────────────────────────
   We move the track by setting:
     transform: translateX(-N * 100%)
   where N is the current slide index.
   CSS handles the smooth transition.
================================================================ */
var Feature05_ImageSlider = {

  initAll: function () {
    var sliders = document.querySelectorAll("[data-slider]");
    sliders.forEach(function (el) {
      Feature05_ImageSlider.init(el);
    });
  },

  init: function (container) {
    var images = JSON.parse(container.dataset.slider || "[]");
    if (images.length === 0) return;

    /* Build the slider HTML */
    var slidesHTML = images.map(function (src, i) {
      return `<img class="img-slider__slide"
                   src="${src}"
                   alt="Hotel image ${i + 1}"
                   loading="${i === 0 ? 'eager' : 'lazy'}"
                   onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=70'">`;
    }).join("");

    var dotsHTML = images.map(function (_, i) {
      return `<button class="img-slider__dot ${i === 0 ? 'is-active' : ''}"
                      aria-label="Go to image ${i + 1}"></button>`;
    }).join("");

    container.innerHTML = `
      <div class="img-slider">
        <div class="img-slider__track">${slidesHTML}</div>
        ${images.length > 1 ? `
          <button class="img-slider__btn img-slider__btn--prev" aria-label="Previous image">
            <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
          </button>
          <button class="img-slider__btn img-slider__btn--next" aria-label="Next image">
            <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
          </button>
          <div class="img-slider__dots">${dotsHTML}</div>
        ` : ""}
      </div>
    `;

    var slider  = container.querySelector(".img-slider");
    var track   = container.querySelector(".img-slider__track");
    var dots    = container.querySelectorAll(".img-slider__dot");
    var current = 0;
    var total   = images.length;

    function goTo(n) {
      /* Wrap around: -1 → last, total → 0 */
      current = (n + total) % total;
      track.style.transform = "translateX(-" + current * 100 + "%)";
      dots.forEach(function (d, i) {
        d.classList.toggle("is-active", i === current);
      });
    }

    /* Prev / Next buttons */
    var prevBtn = container.querySelector(".img-slider__btn--prev");
    var nextBtn = container.querySelector(".img-slider__btn--next");
    if (prevBtn) prevBtn.addEventListener("click", function (e) { e.stopPropagation(); goTo(current - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function (e) { e.stopPropagation(); goTo(current + 1); });

    /* Dot buttons */
    dots.forEach(function (dot, i) {
      dot.addEventListener("click", function (e) { e.stopPropagation(); goTo(i); });
    });

    /* Touch / swipe support */
    var touchStartX = 0;
    slider.addEventListener("touchstart", function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });

    slider.addEventListener("touchend", function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        goTo(diff > 0 ? current + 1 : current - 1);
      }
    });

    /* Auto-advance every 4 seconds */
    if (total > 1) {
      setInterval(function () { goTo(current + 1); }, 4000);
    }
  }
};


/* ================================================================
   06. SEARCH SUGGESTIONS
   ─────────────────────────────────────────────────────────────
   Shows a dropdown of matching destinations as the user types
   in the hero search box or hotels search input.

   CONCEPT: Array.filter() + String.includes()
   ─────────────────────────────────────────────────────────────
   We filter the destinations[] array (from data.js) for entries
   whose name or tagline includes the typed query.
   .toLowerCase() makes the comparison case-insensitive.

   CONCEPT: Keyboard navigation (arrow keys)
   ─────────────────────────────────────────────────────────────
   We track a "highlighted" index and move it up/down with
   ArrowUp / ArrowDown keys. Enter selects the highlighted item.
================================================================ */
var Feature06_SearchSuggestions = {

  init: function () {
    var inputs = document.querySelectorAll(
      "#destination, #hotelSearchInput"
    );
    inputs.forEach(function (input) {
      Feature06_SearchSuggestions.attachTo(input);
    });
  },

  attachTo: function (input) {
    if (!input) return;

    /* Check destinations[] exists (from data.js) */
    if (typeof destinations === "undefined") return;

    /* Wrap input in a relative-positioned container for the dropdown */
    var wrapper = input.parentElement;
    if (wrapper) wrapper.style.position = "relative";

    /* Create the suggestions dropdown */
    var dropdown = document.createElement("div");
    dropdown.className = "search-suggestions";
    dropdown.setAttribute("role", "listbox");
    dropdown.setAttribute("aria-label", "Search suggestions");

    /* Insert after the input */
    if (input.parentNode) {
      input.parentNode.insertBefore(dropdown, input.nextSibling);
    }

    var highlightedIndex = -1;
    var currentItems     = [];

    function buildSuggestions(query) {
      if (!query || query.length < 1) {
        closeSuggestions();
        return;
      }

      var q = query.toLowerCase();

      /* Filter destinations */
      var destMatches = destinations.filter(function (d) {
        return d.name.toLowerCase().includes(q) ||
               d.tagline.toLowerCase().includes(q) ||
               d.id.includes(q);
      }).slice(0, 4);

      /* Filter hotel names if hotels[] is available */
      var hotelMatches = [];
      if (typeof hotels !== "undefined") {
        hotelMatches = hotels.filter(function (h) {
          return h.name.toLowerCase().includes(q) ||
                 h.location.toLowerCase().includes(q);
        }).slice(0, 3);
      }

      if (destMatches.length === 0 && hotelMatches.length === 0) {
        dropdown.innerHTML = `
          <div class="search-suggestion-item" style="cursor:default; color:var(--clr-text-muted);">
            <i class="fa-solid fa-magnifying-glass"></i>
            No results for "<strong>${query}</strong>"
          </div>`;
        openSuggestions();
        currentItems = [];
        return;
      }

      /* Highlight matched text */
      function highlight(text, q) {
        var regex = new RegExp("(" + q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "gi");
        return text.replace(regex, '<span class="suggestion-match">$1</span>');
      }

      currentItems = [];

      var html = "";

      if (destMatches.length > 0) {
        html += `<div style="padding:var(--sp-2) var(--sp-4);font-size:var(--fs-2xs);font-weight:700;
                              text-transform:uppercase;letter-spacing:0.08em;color:var(--clr-text-muted);
                              background:var(--clr-bg);">Destinations</div>`;
        destMatches.forEach(function (d, i) {
          currentItems.push({ type: "destination", id: d.id, name: d.name });
          html += `
            <div class="search-suggestion-item" data-index="${currentItems.length - 1}" role="option">
              <i class="fa-solid fa-location-dot"></i>
              <span>${highlight(d.name, q)}</span>
              <span class="suggestion-meta">${d.hotelCount}+ hotels</span>
            </div>`;
        });
      }

      if (hotelMatches.length > 0) {
        html += `<div style="padding:var(--sp-2) var(--sp-4);font-size:var(--fs-2xs);font-weight:700;
                              text-transform:uppercase;letter-spacing:0.08em;color:var(--clr-text-muted);
                              background:var(--clr-bg);">Hotels</div>`;
        hotelMatches.forEach(function (h) {
          currentItems.push({ type: "hotel", id: h.id, name: h.name, destination: h.destination });
          html += `
            <div class="search-suggestion-item" data-index="${currentItems.length - 1}" role="option">
              <i class="fa-solid fa-hotel"></i>
              <span>${highlight(h.name, q)}</span>
              <span class="suggestion-meta">${h.location.split(",")[0]}</span>
            </div>`;
        });
      }

      dropdown.innerHTML = html;
      highlightedIndex   = -1;
      openSuggestions();

      /* Click handler for each suggestion */
      dropdown.querySelectorAll("[data-index]").forEach(function (item) {
        item.addEventListener("mousedown", function (e) {
          e.preventDefault();  /* prevent blur before click */
          var idx = parseInt(this.dataset.index);
          selectItem(idx);
        });
      });
    }

    function selectItem(idx) {
      var item = currentItems[idx];
      if (!item) return;

      if (item.type === "destination") {
        window.location.href = "hotels.html?destination=" + item.id;
      } else {
        window.location.href = "hotels.html?q=" + encodeURIComponent(item.name);
      }
    }

    function openSuggestions() {
      dropdown.classList.add("is-open");
    }

    function closeSuggestions() {
      dropdown.classList.remove("is-open");
      highlightedIndex = -1;
    }

    function moveHighlight(direction) {
      var items = dropdown.querySelectorAll("[data-index]");
      if (items.length === 0) return;

      items[highlightedIndex < 0 ? 0 : highlightedIndex]
        ?.classList.remove("is-highlighted");

      highlightedIndex = (highlightedIndex + direction + items.length) % items.length;
      var active = items[highlightedIndex];
      if (active) {
        active.classList.add("is-highlighted");
        active.scrollIntoView({ block: "nearest" });
      }
    }

    /* Debounce: wait 200ms after the user stops typing before searching */
    var debounceTimer;
    input.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      var val = this.value.trim();
      debounceTimer = setTimeout(function () {
        buildSuggestions(val);
      }, 200);
    });

    /* Keyboard navigation */
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown")  { e.preventDefault(); moveHighlight(1);  }
      if (e.key === "ArrowUp")    { e.preventDefault(); moveHighlight(-1); }
      if (e.key === "Enter" && highlightedIndex >= 0) {
        e.preventDefault();
        selectItem(highlightedIndex);
      }
      if (e.key === "Escape") closeSuggestions();
    });

    /* Close when focus leaves the input area */
    input.addEventListener("blur", function () {
      setTimeout(closeSuggestions, 200);
    });

    /* Reopen if input already has text */
    input.addEventListener("focus", function () {
      if (this.value.trim()) buildSuggestions(this.value.trim());
    });
  }
};


/* ================================================================
   07. FILTER COUNT BADGE
   ─────────────────────────────────────────────────────────────
   Shows how many active filters are applied on the hotels page.
   Reads from the toolbar filter buttons and price slider.
================================================================ */
var Feature07_FilterCount = {

  badge: null,

  init: function () {
    /* Only runs on hotels.html */
    var toolbar = document.querySelector(".bookings-toolbar__actions, .wishlist-toolbar__actions");
    if (!toolbar && !document.getElementById("filterSidebar")) return;

    /* Listen for filter changes (custom event fired by hotels.js) */
    document.addEventListener("filtersChanged", function (e) {
      Feature07_FilterCount.update(e.detail ? e.detail.count : 0);
    });

    /* Also count on page load */
    this.update(0);
  },

  update: function (count) {
    var btn = document.getElementById("filterToggleBtn");
    if (!btn) return;

    var badge = btn.querySelector(".filter-count-badge");
    if (!badge) {
      badge = document.createElement("span");
      badge.className = "filter-count-badge";
      badge.setAttribute("aria-label", "active filters");
      btn.appendChild(badge);
    }

    badge.textContent = count;
    badge.classList.toggle("is-visible", count > 0);
  }
};


/* ================================================================
   08. EMPTY STATE MESSAGES (utility — called by other files)
   ─────────────────────────────────────────────────────────────
   Generates a polished empty state HTML string.
   Call EmptyState.build(options) from any other JS file.

   Usage:
     container.innerHTML = EmptyState.build({
       icon    : "fa-hotel",
       title   : "No hotels found",
       message : "Try adjusting your filters.",
       actions : [{ label: "Reset", href: "hotels.html", primary: true }]
     });
================================================================ */
window.EmptyState = {
  build: function (opts) {
    opts = opts || {};
    var icon    = opts.icon    || "fa-inbox";
    var title   = opts.title   || "Nothing here";
    var message = opts.message || "";
    var actions = opts.actions || [];

    var actionsHTML = actions.map(function (a) {
      var cls = "btn " + (a.primary ? "btn--primary" : "btn--outline");
      if (a.href) {
        return `<a href="${a.href}" class="${cls} btn--lg">${a.label}</a>`;
      }
      return `<button onclick="${a.onclick || ''}" class="${cls} btn--lg">${a.label}</button>`;
    }).join("");

    return `
      <div class="empty-state">
        <div class="empty-state__illustration" aria-hidden="true">
          <i class="fa-solid ${icon}"></i>
        </div>
        <h2 class="empty-state__title">${title}</h2>
        ${message ? `<p class="empty-state__text">${message}</p>` : ""}
        ${actionsHTML ? `<div class="empty-state__actions">${actionsHTML}</div>` : ""}
      </div>
    `;
  }
};


/* ================================================================
   09. FORM SUCCESS ANIMATION (utility — called from booking.js)
   ─────────────────────────────────────────────────────────────
   Shows a full-card success overlay when a form is submitted.

   Usage:
     FormFeedback.showSuccess(formCard, "Booking Confirmed!", "Redirecting...")
     FormFeedback.shakeField(inputElement)
================================================================ */
window.FormFeedback = {

  showSuccess: function (container, title, message) {
    if (!container) return;
    container.style.position = "relative";

    var overlay = document.createElement("div");
    overlay.className = "form-success-overlay";
    overlay.innerHTML = `
      <div class="success-circle">
        <i class="fa-solid fa-check" aria-hidden="true"></i>
      </div>
      <p class="success-title">${title || "Success!"}</p>
      <p class="success-message">${message || ""}</p>
    `;
    container.appendChild(overlay);

    /* Trigger animation on next frame */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add("is-visible");
      });
    });
  },

  shakeField: function (inputEl) {
    if (!inputEl) return;
    inputEl.classList.remove("is-shaking");
    /* Force reflow so animation re-triggers even if already shaking */
    void inputEl.offsetWidth;
    inputEl.classList.add("is-shaking");
    inputEl.addEventListener("animationend", function () {
      inputEl.classList.remove("is-shaking");
    }, { once: true });
  }
};


/* ================================================================
   10. BACK-TO-TOP BUTTON WITH SCROLL PROGRESS RING
   ─────────────────────────────────────────────────────────────
   A floating button that appears after 400px of scroll.
   An SVG ring around it fills up as you scroll down the page.

   CONCEPT: Scroll progress calculation
   ─────────────────────────────────────────────────────────────
   progress = scrollTop / (scrollHeight - windowHeight)
   → 0.0 = top of page
   → 1.0 = bottom of page

   stroke-dashoffset controls how much of the SVG ring is hidden:
   → 138 = fully hidden (top of page)
   → 0   = fully drawn  (bottom of page)

   We set: dashoffset = 138 * (1 - progress)
================================================================ */
var Feature10_BackToTop = {

  btn: null,
  ring: null,
  CIRCUMFERENCE: 138,  /* 2 * π * r = 2 * 3.14159 * 22 ≈ 138 */

  init: function () {
    /* Don't create a second button if scroll-top already exists in HTML */
    var existing = document.getElementById("scrollTopBtn") || document.getElementById("backToTop");
    if (existing) {
      this.btn  = existing;
      /* attach ring to existing button */
      if (!existing.querySelector(".back-to-top__ring")) {
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("class", "back-to-top__ring");
        svg.setAttribute("viewBox", "0 0 52 52");
        svg.setAttribute("aria-hidden", "true");
        svg.innerHTML = `
          <circle class="back-to-top__ring-track" cx="26" cy="26" r="22"/>
          <circle class="back-to-top__ring-progress" cx="26" cy="26" r="22"/>
        `;
        existing.insertBefore(svg, existing.firstChild);
      }
      this.ring = existing.querySelector(".back-to-top__ring-progress");
      existing.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      window.addEventListener("scroll", this.onScroll.bind(this), { passive: true });
      return;
    }

    /* Create the button */
    var btn = document.createElement("button");
    btn.className  = "back-to-top";
    btn.id         = "backToTop";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML  = `
      <svg class="back-to-top__ring" viewBox="0 0 52 52" aria-hidden="true">
        <circle class="back-to-top__ring-track"    cx="26" cy="26" r="22"/>
        <circle class="back-to-top__ring-progress" cx="26" cy="26" r="22"/>
      </svg>
      <i class="fa-solid fa-arrow-up"></i>
    `;
    document.body.appendChild(btn);

    this.btn  = btn;
    this.ring = btn.querySelector(".back-to-top__ring-progress");

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", this.onScroll.bind(this), { passive: true });
  },

  onScroll: function () {
    var scrollTop    = window.pageYOffset;
    var docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    var progress     = docHeight > 0 ? scrollTop / docHeight : 0;

    /* Show button after 400px */
    this.btn.classList.toggle("is-visible", scrollTop > 400);

    /* Update ring: dashoffset goes from 138 (hidden) → 0 (full) */
    var offset = this.CIRCUMFERENCE * (1 - progress);
    if (this.ring) {
      this.ring.style.strokeDashoffset = offset;
    }
  }
};


/* ================================================================
   11. SCROLL ANIMATIONS (IntersectionObserver)
   ─────────────────────────────────────────────────────────────
   Observes every element with a [data-animate] attribute and
   adds .is-animated when it enters the viewport.

   CONCEPT: IntersectionObserver
   ─────────────────────────────────────────────────────────────
   IntersectionObserver watches elements and fires a callback
   when they cross a threshold into the visible viewport.
   It's much more performant than scroll event listeners because:
   • It doesn't run on every scroll pixel
   • It runs off the main thread
   • We call unobserve() after animating (no wasted work)

   We also automatically tag common elements with data-animate
   so existing pages get animations without adding attributes.
================================================================ */
var Feature11_ScrollAnimations = {

  observer: null,

  init: function () {

    /* Auto-tag common elements that should animate */
    this.autoTag();

    /* Create the observer */
    this.observer = new IntersectionObserver(
      this.onIntersect.bind(this),
      {
        threshold  : 0.12,         /* trigger when 12% is visible */
        rootMargin : "0px 0px -40px 0px"  /* slightly early trigger */
      }
    );

    /* Observe all tagged elements */
    this.observeAll();
  },

  autoTag: function () {
    var rules = [
      /* selector,             animation,    delay step (ms) */
      [".section-header",     "fade-up",     0   ],
      [".why-us__card",       "zoom-in",     100 ],
      [".destination-card",   "fade-up",     100 ],
      [".hotel-card",         "fade-up",     80  ],
      [".wishlist-card",      "fade-up",     80  ],
      [".booking-card",       "fade-up",     80  ],
      [".footer__brand",      "fade-right",  0   ],
      [".footer__nav",        "fade-up",     100 ],
      [".footer__contact",    "fade-left",   0   ],
      [".newsletter__content","zoom-in",     0   ]
    ];

    rules.forEach(function (rule) {
      var selector  = rule[0];
      var anim      = rule[1];
      var stepMs    = rule[2];

      document.querySelectorAll(selector).forEach(function (el, i) {
        /* Don't overwrite manually set attributes */
        if (!el.dataset.animate) {
          el.dataset.animate = anim;
        }
        if (stepMs > 0 && !el.dataset.animateDelay) {
          var delay = Math.min(i * stepMs, 500);  /* cap at 500ms */
          el.style.transitionDelay = delay + "ms";
        }
      });
    });
  },

  observeAll: function () {
    var self = this;
    document.querySelectorAll("[data-animate]").forEach(function (el) {
      self.observer.observe(el);
    });
  },

  onIntersect: function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-animated");
        /* Stop watching — no need to re-animate */
        Feature11_ScrollAnimations.observer.unobserve(entry.target);
      }
    });
  }
};


/* ================================================================
   12. RESPONSIVE MOBILE MENU
   ─────────────────────────────────────────────────────────────
   Enhances the hamburger menu with:
   • A dark overlay behind the menu (click it to close)
   • Escape key closes the menu
   • Body scroll lock when menu is open
   • Active link highlight

   CONCEPT: Scroll lock
   ─────────────────────────────────────────────────────────────
   When the mobile menu is open, we don't want the page behind
   it to scroll. We achieve this by setting:
     document.body.style.overflow = "hidden"
   and reverting it on close.
================================================================ */
var Feature12_MobileMenu = {

  hamburger: null,
  navLinks : null,
  overlay  : null,
  isOpen   : false,

  init: function () {
    this.hamburger = document.getElementById("hamburgerBtn");
    this.navLinks  = document.getElementById("navLinks");

    if (!this.hamburger || !this.navLinks) return;

    /* Create the dark overlay */
    this.overlay = document.createElement("div");
    this.overlay.className = "nav-overlay";
    this.overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(this.overlay);

    /* Highlight the current page link */
    this.highlightCurrentPage();

    /* Event listeners */
    this.hamburger.addEventListener("click", this.toggle.bind(this));
    this.overlay.addEventListener("click",   this.close.bind(this));

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && Feature12_MobileMenu.isOpen) {
        Feature12_MobileMenu.close();
      }
    });

    /* Close menu when a nav link is clicked */
    this.navLinks.addEventListener("click", function (e) {
      if (e.target.classList.contains("navbar__link")) {
        Feature12_MobileMenu.close();
      }
    });

    /* Close menu if window resizes to desktop width */
    window.addEventListener("resize", function () {
      if (window.innerWidth > 768 && Feature12_MobileMenu.isOpen) {
        Feature12_MobileMenu.close();
      }
    });
  },

  toggle: function () {
    this.isOpen ? this.close() : this.open();
  },

  open: function () {
    this.isOpen = true;
    this.navLinks.classList.add("is-open");
    this.hamburger.classList.add("is-open");
    this.overlay.classList.add("is-open");
    this.hamburger.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";  /* lock background scroll */

    /* Move focus to first nav link (accessibility) */
    var firstLink = this.navLinks.querySelector(".navbar__link");
    if (firstLink) firstLink.focus();
  },

  close: function () {
    this.isOpen = false;
    this.navLinks.classList.remove("is-open");
    this.hamburger.classList.remove("is-open");
    this.overlay.classList.remove("is-open");
    this.hamburger.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";   /* restore scroll */
    this.hamburger.focus();              /* return focus to hamburger */
  },

  highlightCurrentPage: function () {
    /*
      window.location.pathname gives the current URL path.
      e.g. "/travel-booking/hotels.html"
      We check each nav link's href against it.
    */
    var currentPath = window.location.pathname;
    var links = this.navLinks.querySelectorAll(".navbar__link");

    links.forEach(function (link) {
      var href = link.getAttribute("href");
      if (!href) return;

      /* Extract just the filename for comparison */
      var linkFile = href.split("/").pop().split("?")[0].split("#")[0];
      var currFile = currentPath.split("/").pop().split("?")[0];

      if (linkFile && linkFile === currFile) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
  }
};
