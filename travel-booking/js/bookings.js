/* ================================================================
   TravelEase — bookings.js
   Powers the bookings.html "My Bookings" page.

   WHAT THIS FILE DOES:
   1.  Reads ALL bookings from LocalStorage (the history array)
   2.  Renders booking cards — one card per booking
   3.  Filters cards: All / Confirmed / Cancelled
   4.  Cancels a booking — updates its status to "Cancelled"
       WITHOUT deleting it from history
   5.  Shows full booking detail in a modal popup
   6.  Clears ALL booking history with a confirmation dialog
   7.  Updates stats chips (total / confirmed / cancelled count)

   KEY CONCEPTS:
   • LocalStorage read/write        – get, parse, update, save
   • Array .find() / .map()         – locate and transform items
   • Status update (not delete)     – immutable history pattern
   • window.confirm()               – native confirmation dialog
================================================================ */


/* ================================================================
   PART 1 — LOCALSTORAGE KEYS
   (same keys used in booking.js so we read the same data)
================================================================ */
var HISTORY_KEY = "travelease_bookings";
var CURRENT_KEY = "travelease_current_booking";


/* ================================================================
   PART 2 — STATE
   Active filter: "all" | "confirmed" | "cancelled"
================================================================ */
var activeFilter = "all";


/* ================================================================
   PART 3 — INITIALISE
================================================================ */
document.addEventListener("DOMContentLoaded", function () {
  var yearSpan = document.getElementById("currentYear");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  renderPage();        /* draw everything */
  attachToolbar();     /* filter tabs + clear button */
  initNavbar();
  initScrollTop();
});


/* ================================================================
   PART 4 — READ FROM LOCALSTORAGE
   ----------------------------------------------------------------
   CONCEPT: JSON.parse()
   ─────────────────────────────────────────────────────────────
   When booking.js saved the array it used JSON.stringify():
     localStorage.setItem(key, JSON.stringify([ booking1, booking2 ]))

   The value stored is a STRING like:
     '[{"bookingId":"TE-...","status":"confirmed"}, ...]'

   To turn it back into a usable JavaScript array we call:
     JSON.parse(raw)  →  [ { bookingId: "TE-...", ... }, ... ]

   If the key has never been set, getItem() returns null,
   so we default to an empty array [].
================================================================ */
function readAllBookings() {
  /* Step 1: get the raw string */
  var raw = localStorage.getItem(HISTORY_KEY);

  /* Step 2: if nothing stored yet, return empty array */
  if (raw === null) return [];

  /* Step 3: parse the JSON string → JavaScript array */
  try {
    var arr = JSON.parse(raw);
    /* Safety: make sure it really is an array */
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn("TravelEase: could not parse booking history.", e);
    return [];
  }
}


/* ================================================================
   PART 5 — WRITE UPDATED BOOKINGS BACK TO LOCALSTORAGE
   ─────────────────────────────────────────────────────────────
   After any mutation (e.g. cancel) we replace the stored array.

   CONCEPT: JSON.stringify()
   ─────────────────────────────────────────────────────────────
   JavaScript arrays/objects CANNOT be stored in LocalStorage
   directly — it stores only strings.

   JSON.stringify(array)
   → converts  [ { id: "TE-...", status: "cancelled" }, ... ]
   → to string '[{"id":"TE-...","status":"cancelled"},...]'

   localStorage.setItem(key, string)  → persists it.
================================================================ */
function saveAllBookings(bookings) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.error("TravelEase: could not save bookings.", e);
  }
}


/* ================================================================
   PART 6 — RENDER THE WHOLE PAGE
   ─────────────────────────────────────────────────────────────
   Reads bookings, applies the active filter, builds cards.
================================================================ */
function renderPage() {
  var all      = readAllBookings();
  var filtered = applyFilter(all, activeFilter);

  updateStats(all);        /* refresh the stats chips in toolbar */
  renderCards(filtered);   /* draw the booking cards */
}


/* ================================================================
   PART 7 — APPLY FILTER
   ─────────────────────────────────────────────────────────────
   CONCEPT: Array .filter()
   ─────────────────────────────────────────────────────────────
   .filter() returns a NEW array containing only items where
   the callback returns true.

     all.filter(b => b.status === "confirmed")
     → returns only confirmed bookings

   "all" filter keeps everything (always returns true).
================================================================ */
function applyFilter(bookings, filter) {
  if (filter === "all") return bookings;

  return bookings.filter(function (b) {
    /* If a booking has no status field, treat it as "confirmed"
       (older bookings may have been saved before we added status) */
    var status = (b.status || "confirmed").toLowerCase();
    return status === filter;
  });
}


/* ================================================================
   PART 8 — UPDATE STATS CHIPS
================================================================ */
function updateStats(all) {
  var statsEl = document.getElementById("bookingStats");
  if (!statsEl) return;

  var total     = all.length;
  var confirmed = all.filter(function (b) {
    return (b.status || "confirmed").toLowerCase() === "confirmed";
  }).length;
  var cancelled = all.filter(function (b) {
    return (b.status || "").toLowerCase() === "cancelled";
  }).length;

  statsEl.innerHTML = `
    <span class="stat-chip stat-chip--all">
      <i class="fa-solid fa-layer-group" aria-hidden="true"></i>
      ${total} Total
    </span>
    <span class="stat-chip stat-chip--confirmed">
      <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
      ${confirmed} Confirmed
    </span>
    <span class="stat-chip stat-chip--cancelled">
      <i class="fa-solid fa-ban" aria-hidden="true"></i>
      ${cancelled} Cancelled
    </span>
  `;
}


/* ================================================================
   PART 9 — RENDER BOOKING CARDS
   ─────────────────────────────────────────────────────────────
   CONCEPT: Array .map() + .join()
   ─────────────────────────────────────────────────────────────
   .map()  → transforms each booking object into an HTML string
   .join("") → merges all those strings into one big string
   innerHTML → injects the whole thing into the DOM at once

   This is faster than creating elements one-by-one because
   it causes only ONE browser repaint/reflow.
================================================================ */
function renderCards(bookings) {
  var list = document.getElementById("bookingsList");
  if (!list) return;

  /* Sort newest first using bookingDate */
  var sorted = bookings.slice().sort(function (a, b) {
    return new Date(b.bookingDate || 0) - new Date(a.bookingDate || 0);
  });

  if (sorted.length === 0) {
    list.innerHTML = buildEmptyState();
    return;
  }

  list.innerHTML = sorted.map(function (booking, index) {
    return buildBookingCard(booking, index);
  }).join("");

  /* Attach event listeners to the newly rendered buttons */
  attachCardButtons();
}


/* ================================================================
   PART 10 — BUILD A SINGLE BOOKING CARD
   ─────────────────────────────────────────────────────────────
   Returns an HTML string for one booking.
   We embed the bookingId in data-* attributes so button click
   handlers can identify which booking was acted on.
================================================================ */
function buildBookingCard(b, index) {
  var status    = (b.status || "confirmed").toLowerCase();
  var isCancelled = status === "cancelled";

  /* Stagger animation delay */
  var delay = (index * 0.06) + "s";

  /* Format dates */
  var checkin  = prettyDate(b.checkin);
  var checkout = prettyDate(b.checkout);
  var nights   = b.nights || 0;

  /* Status badge HTML */
  var badgeClass = isCancelled
    ? "booking-card__status-badge--cancelled"
    : "booking-card__status-badge--confirmed";
  var badgeIcon  = isCancelled ? "fa-ban" : "fa-circle-check";
  var badgeText  = isCancelled ? "CANCELLED" : "CONFIRMED";

  /* Cancel/restore button — disabled if already cancelled */
  var cancelBtn = isCancelled
    ? `<button class="booking-card__btn booking-card__btn--cancel"
               disabled
               aria-disabled="true"
               aria-label="Booking already cancelled">
         <i class="fa-solid fa-ban" aria-hidden="true"></i>
         Cancelled
       </button>`
    : `<button class="booking-card__btn booking-card__btn--cancel"
               data-action="cancel"
               data-booking-id="${escHtml(b.bookingId)}"
               aria-label="Cancel booking ${escHtml(b.bookingId)}">
         <i class="fa-solid fa-xmark" aria-hidden="true"></i>
         Cancel
       </button>`;

  return `
    <article
      class="booking-card ${isCancelled ? "booking-card--cancelled" : ""} fade-up"
      role="listitem"
      data-booking-id="${escHtml(b.bookingId)}"
      style="animation-delay:${delay};"
    >
      <div class="booking-card__inner">

        <!-- LEFT: Hotel image -->
        <div class="booking-card__img-wrap">
          <img
            src="${escHtml(b.hotelImage || "")}"
            alt="${escHtml(b.hotel || "Hotel")}"
            loading="lazy"
            onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=70'"
          />
          <!-- Status badge -->
          <span class="booking-card__status-badge ${badgeClass}"
                aria-label="Status: ${badgeText}">
            <i class="fa-solid ${badgeIcon}" aria-hidden="true"></i>
            ${badgeText}
          </span>
        </div>

        <!-- MIDDLE: Booking details -->
        <div class="booking-card__body">

          <!-- Top: ID + hotel name + location -->
          <div class="booking-card__top">
            <div>
              <span class="booking-card__id">${escHtml(b.bookingId)}</span>
              <h2 class="booking-card__hotel" style="margin-top:var(--sp-2);">
                ${escHtml(b.hotel || b.hotelName || "Unknown Hotel")}
              </h2>
              <p class="booking-card__location">
                <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                ${escHtml(b.destination || "")}
              </p>
            </div>
          </div>

          <!-- Details row -->
          <div class="booking-card__details">

            <div class="booking-detail">
              <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
              <span>Check-in: <strong>${checkin}</strong></span>
            </div>

            <div class="booking-detail">
              <i class="fa-solid fa-calendar-xmark" aria-hidden="true"></i>
              <span>Check-out: <strong>${checkout}</strong></span>
            </div>

            <div class="booking-detail">
              <i class="fa-solid fa-moon" aria-hidden="true"></i>
              <span><strong>${nights}</strong> Night${nights !== 1 ? "s" : ""}</span>
            </div>

            <div class="booking-detail">
              <i class="fa-solid fa-user-group" aria-hidden="true"></i>
              <span><strong>${b.guests || 1}</strong> Guest${b.guests !== 1 ? "s" : ""}</span>
            </div>

            <div class="booking-detail">
              <i class="fa-solid fa-door-open" aria-hidden="true"></i>
              <span><strong>${b.rooms || 1}</strong> Room${b.rooms !== 1 ? "s" : ""}</span>
            </div>

          </div>

          <!-- Cancellation notice (shown only if cancelled) -->
          ${isCancelled ? `
            <div class="booking-card__cancel-notice">
              <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
              This booking was cancelled on ${prettyDate(b.cancelledAt ? b.cancelledAt.slice(0,10) : b.bookingDate.slice(0,10))}.
            </div>` : ""}

        </div>

        <!-- RIGHT: Price + buttons -->
        <div class="booking-card__side">
          <div class="booking-card__price">
            <div class="booking-card__price-amount">${formatPrice(b.totalPrice || 0)}</div>
            <div class="booking-card__price-label">Total paid</div>
          </div>

          <div class="booking-card__btns">
            <!-- View details -->
            <button
              class="booking-card__btn booking-card__btn--view"
              data-action="view"
              data-booking-id="${escHtml(b.bookingId)}"
              aria-label="View details for booking ${escHtml(b.bookingId)}"
            >
              <i class="fa-solid fa-eye" aria-hidden="true"></i>
              View
            </button>

            <!-- Cancel / disabled if already cancelled -->
            ${cancelBtn}
          </div>
        </div>

      </div>
    </article>
  `;
}


/* ================================================================
   PART 11 — EMPTY STATE
================================================================ */
function buildEmptyState() {
  var messages = {
    all       : { title: "No bookings yet",       sub: "Once you book a hotel, it will appear here." },
    confirmed : { title: "No confirmed bookings", sub: "All your active reservations will show here." },
    cancelled : { title: "No cancelled bookings", sub: "You haven't cancelled any reservations." }
  };
  var m = messages[activeFilter] || messages.all;

  return `
    <div class="bookings-empty" role="status">
      <div class="bookings-empty__icon" aria-hidden="true">
        <i class="fa-solid fa-calendar-xmark"></i>
      </div>
      <h2>${m.title}</h2>
      <p>${m.sub}</p>
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
   PART 12 — ATTACH CARD BUTTON HANDLERS
   ─────────────────────────────────────────────────────────────
   CONCEPT: Event Delegation
   ─────────────────────────────────────────────────────────────
   Instead of adding a listener to EVERY button on every card,
   we add ONE listener on the parent container #bookingsList.

   When any button inside is clicked, the event "bubbles up"
   to the parent. We check e.target.dataset.action to decide
   what to do ("view" or "cancel").

   This pattern works even for buttons added dynamically.
================================================================ */
function attachCardButtons() {
  var list = document.getElementById("bookingsList");
  if (!list) return;

  /* Remove any previous listener to avoid duplicates */
  list.removeEventListener("click", handleCardClick);
  list.addEventListener("click", handleCardClick);
}

function handleCardClick(e) {
  /* Find the button that was clicked (handles clicks on child <i>) */
  var btn = e.target.closest("[data-action]");
  if (!btn) return;

  var action    = btn.dataset.action;      /* "view" or "cancel" */
  var bookingId = btn.dataset.bookingId;

  if (action === "view") {
    openDetailModal(bookingId);
  } else if (action === "cancel") {
    confirmCancellation(bookingId);
  }
}


/* ================================================================
   PART 13 — CANCEL A BOOKING
   ─────────────────────────────────────────────────────────────
   IMPORTANT: we UPDATE the booking's status, we do NOT delete it.
   This preserves booking history for the user to see.

   CONCEPT: window.confirm()
   ─────────────────────────────────────────────────────────────
   window.confirm("message")
   → shows the browser's native "OK / Cancel" dialog
   → returns true  if user clicked OK
   → returns false if user clicked Cancel

   This is the simplest way to ask for confirmation without
   building a custom modal. It blocks until the user responds.

   STEPS:
   1. Ask for confirmation with window.confirm()
   2. Find the booking in the array using .find()
   3. Update its status field to "cancelled"
   4. Add a cancelledAt timestamp
   5. Save the updated array back to LocalStorage
   6. Re-render the page
================================================================ */
function confirmCancellation(bookingId) {

  /* Step 1: ask the user to confirm */
  var confirmed = window.confirm(
    "Are you sure you want to cancel this booking?\n\n" +
    "Booking ID: " + bookingId + "\n\n" +
    "The booking will be marked as cancelled but kept in your history."
  );

  /*
    window.confirm() returns:
      true  → user clicked "OK"    → proceed with cancellation
      false → user clicked "Cancel" → do nothing
  */
  if (!confirmed) return;

  /* Step 2: read the current array from LocalStorage */
  var bookings = readAllBookings();

  /*
    CONCEPT: Array .find()
    ─────────────────────────────────────────────────────────────
    .find() scans the array and returns the FIRST item where
    the callback returns true. Returns undefined if not found.
  */
  var booking = bookings.find(function (b) {
    return b.bookingId === bookingId;
  });

  if (!booking) {
    showToast("Booking not found.", "error");
    return;
  }

  /* Step 3: update the status — do NOT delete */
  booking.status      = "cancelled";
  booking.cancelledAt = new Date().toISOString();
  /*
    booking object now looks like:
    {
      bookingId:   "TE-20261003-7842",
      customerName: "Rahul",
      ...all original fields...
      status:      "cancelled",      ← added/changed
      cancelledAt: "2026-10-03T..."  ← added
    }

    The original booking data is untouched — only status is updated.
    This is called a "soft delete" or "status update" pattern.
  */

  /* Step 4: save the modified array back to LocalStorage */
  saveAllBookings(bookings);
  /*
    JSON.stringify(bookings) converts the array (with the updated
    booking inside it) back to a string and stores it.
  */

  /* Step 5: if this was also the "current" booking, update it too */
  var currentRaw = localStorage.getItem(CURRENT_KEY);
  if (currentRaw) {
    try {
      var current = JSON.parse(currentRaw);
      if (current.bookingId === bookingId) {
        current.status      = "cancelled";
        current.cancelledAt = booking.cancelledAt;
        localStorage.setItem(CURRENT_KEY, JSON.stringify(current));
      }
    } catch (e) { /* ignore */ }
  }

  /* Step 6: re-render so the card immediately shows "CANCELLED" */
  renderPage();

  showToast("Booking " + bookingId + " has been cancelled.", "");
}


/* ================================================================
   PART 14 — VIEW DETAIL MODAL
   ─────────────────────────────────────────────────────────────
   Shows the full booking details in a modal overlay.
   The modal is already in the HTML, hidden.
   We fill #modalContent and then make the backdrop visible.
================================================================ */
function openDetailModal(bookingId) {
  var bookings = readAllBookings();
  var booking  = bookings.find(function (b) { return b.bookingId === bookingId; });

  if (!booking) return;

  var modal   = document.getElementById("bookingModal");
  var content = document.getElementById("modalContent");
  if (!modal || !content) return;

  var status      = (booking.status || "confirmed").toLowerCase();
  var isCancelled = status === "cancelled";

  content.innerHTML = `
    <!-- Modal image header -->
    <div style="position:relative; height:200px; overflow:hidden;
                border-radius:var(--radius-xl) var(--radius-xl) 0 0;">
      <img src="${escHtml(booking.hotelImage || "")}"
           alt="${escHtml(booking.hotel)}"
           style="width:100%;height:100%;object-fit:cover;"
           onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'"
      />
      <div style="position:absolute;inset:0;
                  background:linear-gradient(to top,rgba(0,0,0,0.6),transparent);"></div>
      <p style="position:absolute;bottom:var(--sp-4);left:var(--sp-5);
                color:white;font-family:var(--ff-heading);
                font-size:var(--fs-xl);font-weight:700;">
        ${escHtml(booking.hotel)}
      </p>
      <!-- Status stamp -->
      <span style="position:absolute;top:var(--sp-3);right:var(--sp-3);
                   padding:4px var(--sp-3);border-radius:var(--radius-full);
                   font-size:var(--fs-xs);font-weight:700;
                   background:${isCancelled ? "rgba(217,48,37,0.9)" : "rgba(30,140,69,0.9)"};
                   color:white;">
        ${isCancelled ? "CANCELLED" : "CONFIRMED"}
      </span>
    </div>

    <!-- Modal body -->
    <div style="padding:var(--sp-6);">
      <!-- Booking ID -->
      <div style="display:flex;align-items:center;gap:var(--sp-2);
                  margin-bottom:var(--sp-5);">
        <span style="font-size:var(--fs-xs);font-weight:700;
                     color:var(--clr-primary);background:var(--clr-primary-light);
                     padding:2px var(--sp-2);border-radius:var(--radius-xs);
                     font-family:monospace;letter-spacing:0.05em;">
          ${escHtml(booking.bookingId)}
        </span>
        <span style="font-size:var(--fs-xs);color:var(--clr-text-muted);">
          Booked on ${prettyDate(booking.bookingDate ? booking.bookingDate.slice(0,10) : "")}
        </span>
      </div>

      <!-- Two-column details grid -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-4) var(--sp-6);margin-bottom:var(--sp-5);">
        ${modalRow("fa-user",           "Customer",    booking.customerName)}
        ${modalRow("fa-envelope",       "Email",       booking.email)}
        ${modalRow("fa-phone",          "Phone",       booking.phone)}
        ${modalRow("fa-location-dot",   "Destination", booking.destination)}
        ${modalRow("fa-calendar-check", "Check-in",    prettyDate(booking.checkin))}
        ${modalRow("fa-calendar-xmark", "Check-out",   prettyDate(booking.checkout))}
        ${modalRow("fa-moon",           "Nights",      booking.nights + " night" + (booking.nights !== 1 ? "s" : ""))}
        ${modalRow("fa-user-group",     "Guests",      booking.guests)}
        ${modalRow("fa-door-open",      "Rooms",       booking.rooms)}
      </div>

      <hr style="border:none;border-top:1px dashed var(--clr-border);margin:var(--sp-4) 0;" />

      <!-- Price breakdown -->
      <div style="display:flex;justify-content:space-between;
                  align-items:center;margin-bottom:var(--sp-2);">
        <span style="font-size:var(--fs-sm);color:var(--clr-text-muted);">Subtotal</span>
        <span style="font-weight:600;">${formatPrice(booking.subtotal || 0)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;
                  align-items:center;margin-bottom:var(--sp-4);">
        <span style="font-size:var(--fs-sm);color:var(--clr-text-muted);">Tax (${booking.taxRate || 5}%)</span>
        <span style="font-weight:600;">+ ${formatPrice(booking.taxes || 0)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;
                  padding:var(--sp-4);background:var(--clr-primary-light);
                  border-radius:var(--radius-md);border:1.5px solid rgba(26,115,232,0.2);">
        <span style="font-weight:700;font-size:var(--fs-base);">Total Paid</span>
        <span style="font-size:var(--fs-2xl);font-weight:800;color:var(--clr-primary);">
          ${formatPrice(booking.totalPrice || 0)}
        </span>
      </div>

      ${booking.specialRequests ? `
        <div style="margin-top:var(--sp-4);padding:var(--sp-3) var(--sp-4);
                    background:var(--clr-bg);border-radius:var(--radius-md);
                    font-size:var(--fs-sm);color:var(--clr-text-muted);">
          <strong style="color:var(--clr-text-body);">Special Requests:</strong>
          ${escHtml(booking.specialRequests)}
        </div>` : ""}

      <!-- Cancellation note -->
      ${isCancelled ? `
        <div style="margin-top:var(--sp-4);padding:var(--sp-3) var(--sp-4);
                    background:#fff5f5;border:1px solid rgba(217,48,37,0.3);
                    border-radius:var(--radius-md);font-size:var(--fs-sm);
                    color:var(--clr-danger);font-weight:600;">
          <i class="fa-solid fa-circle-exclamation"></i>
          Cancelled on ${prettyDate(booking.cancelledAt ? booking.cancelledAt.slice(0,10) : "")}
        </div>` : ""}

      <!-- Close button -->
      <div style="display:flex;gap:var(--sp-3);margin-top:var(--sp-6);">
        <button
          onclick="closeDetailModal()"
          class="btn btn--outline"
          style="flex:1;justify-content:center;"
        >
          Close
        </button>
        ${!isCancelled ? `
          <button
            onclick="confirmCancellation('${escHtml(booking.bookingId)}'); closeDetailModal();"
            class="btn btn--primary"
            style="justify-content:center;background:var(--clr-danger);border-color:var(--clr-danger);"
          >
            <i class="fa-solid fa-xmark"></i>
            Cancel Booking
          </button>` : ""}
      </div>
    </div>
  `;

  /* Show the modal */
  modal.style.display = "flex";
  requestAnimationFrame(function () {
    modal.classList.add("is-open");
  });

  /* Prevent background scrolling */
  document.body.style.overflow = "hidden";

  /* Close handlers */
  document.getElementById("modalClose").onclick = closeDetailModal;
  modal.addEventListener("click", function (e) {
    if (e.target === modal) closeDetailModal();
  });

  /* ESC key closes modal */
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      closeDetailModal();
      document.removeEventListener("keydown", escHandler);
    }
  });
}

/* Helper: one row inside the modal grid */
function modalRow(icon, label, value) {
  return `
    <div>
      <p style="font-size:var(--fs-xs);font-weight:700;text-transform:uppercase;
                letter-spacing:0.07em;color:var(--clr-text-muted);
                margin-bottom:3px;display:flex;align-items:center;gap:5px;">
        <i class="fa-solid ${icon}" style="color:var(--clr-primary);font-size:0.7rem;"></i>
        ${label}
      </p>
      <p style="font-size:var(--fs-sm);font-weight:600;color:var(--clr-text-heading);">
        ${escHtml(String(value || "—"))}
      </p>
    </div>
  `;
}

function closeDetailModal() {
  var modal = document.getElementById("bookingModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  document.body.style.overflow = "";
  setTimeout(function () { modal.style.display = "none"; }, 300);
}


/* ================================================================
   PART 15 — TOOLBAR: FILTER TABS + CLEAR HISTORY
================================================================ */
function attachToolbar() {

  /* ── FILTER TABS ── */
  document.querySelectorAll(".filter-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      /* Remove active from all tabs */
      document.querySelectorAll(".filter-tab").forEach(function (t) {
        t.classList.remove("is-active");
        t.setAttribute("aria-pressed", "false");
      });
      /* Activate clicked tab */
      this.classList.add("is-active");
      this.setAttribute("aria-pressed", "true");

      activeFilter = this.dataset.filter;   /* "all" | "confirmed" | "cancelled" */
      renderPage();
    });
  });

  /* ── CLEAR HISTORY BUTTON ── */
  var clearBtn = document.getElementById("clearHistoryBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      clearAllHistory();
    });
  }
}


/* ================================================================
   PART 16 — CLEAR ALL HISTORY
   ─────────────────────────────────────────────────────────────
   window.confirm() asks the user TWICE for safety:
   First confirm → are you sure?
   (We could add a second confirm for extra safety, but one is
   sufficient for a booking history clear.)

   Then we remove both LocalStorage keys and re-render.
================================================================ */
function clearAllHistory() {

  /*
    window.confirm("message")
    ─────────────────────────────────────────────────────────────
    Shows the browser's built-in confirmation dialog.
    Returns:
      true  → user clicked "OK"     → proceed
      false → user clicked "Cancel" → abort
  */
  var firstConfirm = window.confirm(
    "Clear all booking history?\n\n" +
    "This will permanently delete ALL your bookings from this device.\n" +
    "This action cannot be undone."
  );

  if (!firstConfirm) return;  /* user changed their mind → stop here */

  /* Double-confirm for destructive action */
  var secondConfirm = window.confirm(
    "Are you absolutely sure?\n\n" +
    "All booking records will be permanently removed."
  );

  if (!secondConfirm) return;

  /* Remove both storage keys */
  localStorage.removeItem(HISTORY_KEY);
  localStorage.removeItem(CURRENT_KEY);

  /* Re-render → shows the empty state */
  activeFilter = "all";
  document.querySelectorAll(".filter-tab").forEach(function (t) {
    t.classList.toggle("is-active", t.dataset.filter === "all");
  });

  renderPage();
  showToast("All booking history cleared.", "");
}


/* ================================================================
   PART 17 — UTILITY HELPERS
================================================================ */

/* Format "YYYY-MM-DD" → "03 Nov 2026" */
function prettyDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

/* Escape HTML to prevent XSS */
function escHtml(str) {
  if (typeof str !== "string") return String(str || "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* Navbar hamburger */
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

var toastTimer = null;
function showToast(message, type) {
  var toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className   = "toast is-visible" + (type ? " toast--" + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 3000);
}
