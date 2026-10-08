/* ================================================================
   TravelEase — confirmation.js
   Powers the confirmation.html page.

   WHAT THIS FILE DOES:
   1. Reads the booking object from LocalStorage
   2. Builds and renders the full receipt card
   3. Renders the booking history table
   4. Handles Print / Download via window.print()
   5. Handles "Clear History" button
   6. Navbar and scroll-to-top
================================================================ */


/* ================================================================
   PART 1 — STORAGE KEYS (must match booking.js)
   ----------------------------------------------------------------
   These are the exact same keys used in BookingStorage in
   booking.js. We read the same keys here to get the data back.
================================================================ */
var CURRENT_KEY = "travelease_current_booking";
var HISTORY_KEY = "travelease_bookings";


/* ================================================================
   PART 2 — INITIALISE
================================================================ */
document.addEventListener("DOMContentLoaded", function () {

  /* Auto-fill current year in footer */
  var yearSpan = document.getElementById("currentYear");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  /* Read booking from LocalStorage and render the page */
  var booking = readCurrentBooking();

  if (booking) {
    renderConfirmationPage(booking);
  } else {
    renderNoBookingPage();
  }

  initNavbar();
  initScrollTop();
});


/* ================================================================
   PART 3 — READ BOOKING FROM LOCALSTORAGE
   ----------------------------------------------------------------
   CONCEPT: JSON.parse()
   -----------------------------------------------
   localStorage stores only STRINGS.
   Our booking was saved as:
     localStorage.setItem("travelease_current_booking", JSON.stringify(booking))
     → stored as: '{"bookingId":"TE-20261003-7842","customerName":"Rahul",...}'

   To get the object back, we PARSE the string:
     JSON.parse(storedString)
     → returns: { bookingId: "TE-20261003-7842", customerName: "Rahul", ... }

   JSON.parse() is the reverse of JSON.stringify().
================================================================ */
function readCurrentBooking() {

  /* Step 1: get the raw string from LocalStorage */
  var raw = localStorage.getItem(CURRENT_KEY);
  /*
    raw is either:
      null    → key doesn't exist (user hasn't booked yet)
      string  → '{"bookingId":"TE-20261003-7842",...}'
  */

  if (raw === null) {
    return null;   /* no booking found */
  }

  /* Step 2: convert the string back into a JavaScript object */
  try {
    var booking = JSON.parse(raw);
    /*
      JSON.parse('{"bookingId":"TE-20261003-7842","customerName":"Rahul"}')
      returns:
      { bookingId: "TE-20261003-7842", customerName: "Rahul" }
    */
    return booking;
  } catch (e) {
    /* JSON.parse throws an error if the string is malformed */
    console.error("TravelEase: Could not parse booking from LocalStorage.", e);
    return null;
  }
}


/* Read ALL bookings from history */
function readBookingHistory() {
  var raw = localStorage.getItem(HISTORY_KEY);
  if (raw === null) return [];

  try {
    var history = JSON.parse(raw);
    if (!Array.isArray(history)) return [];
    /* Sort newest first */
    return history.sort(function (a, b) {
      return new Date(b.bookingDate) - new Date(a.bookingDate);
    });
  } catch (e) {
    return [];
  }
}


/* ================================================================
   PART 4 — RENDER THE FULL CONFIRMATION PAGE
   ----------------------------------------------------------------
   Called when a booking IS found in LocalStorage.
   Injects three sections into <main>:
     1. Hero banner ("Booking Confirmed!")
     2. Receipt card (the printable area)
     3. Booking history table
================================================================ */
function renderConfirmationPage(booking) {
  var main = document.getElementById("mainContent");
  if (!main) return;

  main.innerHTML =
    buildHeroBanner(booking) +
    buildProgressSteps()     +
    '<div class="confirm-layout">'  +
      buildReceiptCard(booking)     +
      buildActionButtons()          +
      buildHistorySection()         +
    '</div>';

  /* Wire up buttons after injecting HTML */
  attachButtonHandlers(booking);
  renderHistoryTable();
}


/* ================================================================
   PART 5 — BUILD HERO BANNER
================================================================ */
function buildHeroBanner(booking) {
  return `
    <section class="confirm-hero" aria-label="Booking confirmed">
      <div class="confirm-hero__content">
        <!-- Animated check icon -->
        <div class="confirm-hero__icon" aria-hidden="true">
          <i class="fa-solid fa-check"></i>
        </div>
        <h1 class="confirm-hero__title">Booking Confirmed!</h1>
        <p class="confirm-hero__subtitle">
          Your reservation at <strong>${escHtml(booking.hotel)}</strong> is confirmed.
          A summary is shown below.
        </p>
        <!-- Booking ID pill -->
        <span class="confirm-hero__ref" aria-label="Booking reference ${escHtml(booking.bookingId)}">
          <i class="fa-solid fa-hashtag" aria-hidden="true"></i>
          ${escHtml(booking.bookingId)}
        </span>
      </div>
    </section>
  `;
}


/* ================================================================
   PART 6 — PROGRESS STEPS (step 2 = Confirmation active)
================================================================ */
function buildProgressSteps() {
  return `
    <div class="booking-steps" aria-label="Booking progress">
      <div class="booking-steps__inner">
        <div class="step is-done">
          <span class="step__num"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
          <span class="step__label">Your Details</span>
        </div>
        <div class="step-connector is-done" aria-hidden="true"></div>
        <div class="step is-done">
          <span class="step__num"><i class="fa-solid fa-check" aria-hidden="true"></i></span>
          <span class="step__label">Confirmation</span>
        </div>
        <div class="step-connector is-done" aria-hidden="true"></div>
        <div class="step is-active" aria-current="step">
          <span class="step__num">3</span>
          <span class="step__label">Done!</span>
        </div>
      </div>
    </div>
  `;
}


/* ================================================================
   PART 7 — BUILD RECEIPT CARD
   ----------------------------------------------------------------
   This is the main printable area (id="receiptCard").
   Contains: header, hotel preview, customer info,
             stay details, price breakdown, footer stamp.
================================================================ */
function buildReceiptCard(b) {

  /* Format dates nicely: "2026-11-01" → "01 Nov 2026" */
  var checkinFormatted  = prettyDate(b.checkin);
  var checkoutFormatted = prettyDate(b.checkout);
  var bookedFormatted   = prettyDate(b.bookingDate.slice(0, 10));

  /* Price calculations */
  var ppn      = b.pricePerNight || 0;
  var nights   = b.nights        || 0;
  var rooms    = b.rooms         || 1;
  var subtotal = b.subtotal      || (ppn * nights * rooms);
  var taxes    = b.taxes         || Math.round(subtotal * 0.05);
  var total    = b.totalPrice    || (subtotal + taxes);
  var taxRate  = b.taxRate       || 5;

  return `
    <!-- ══ RECEIPT CARD (id used by print CSS) ══ -->
    <div id="receiptCard" role="region" aria-label="Booking receipt">

      <!-- ── Receipt header: logo + booking meta ── -->
      <div class="receipt__header">
        <div class="receipt__header-logo">
          <i class="fa-solid fa-plane-departure" aria-hidden="true"></i>
          TravelEase
        </div>
        <div class="receipt__header-meta">
          <div>Booking ID: <strong>${escHtml(b.bookingId)}</strong></div>
          <div>Booked on: ${bookedFormatted}</div>
          <div>Status: <strong>CONFIRMED</strong></div>
        </div>
      </div>

      <!-- ── Hotel banner ── -->
      <div class="receipt__hotel-banner">
        <img
          src="${escHtml(b.hotelImage)}"
          alt="${escHtml(b.hotel)}"
          class="receipt__hotel-img"
          onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=70'"
        />
        <div class="receipt__hotel-info">
          <h2 class="receipt__hotel-name">${escHtml(b.hotel)}</h2>
          <p class="receipt__hotel-location">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            ${escHtml(b.hotelLocation || b.destination)}
          </p>
          <span class="receipt__hotel-category">${escHtml(b.hotelCategory || "Hotel")}</span>
          ${b.hotelRating ? `
            <div class="stars" style="margin-top:var(--sp-2);"
                 aria-label="Rating ${b.hotelRating} out of 5">
              ${generateStarHTML(b.hotelRating)}
            </div>` : ""}
        </div>
      </div>

      <!-- ── Receipt body ── -->
      <div class="receipt__body">

        <!-- SECTION: Customer Information -->
        <p class="receipt__section-title">
          <i class="fa-solid fa-user" aria-hidden="true"></i>
          Customer Information
        </p>
        <div class="receipt__details-grid">

          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-user" aria-hidden="true"></i>
              Customer Name
            </p>
            <p class="detail-item__value">${escHtml(b.customerName || b.fullName || "—")}</p>
          </div>

          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-envelope" aria-hidden="true"></i>
              Email Address
            </p>
            <p class="detail-item__value">${escHtml(b.email)}</p>
          </div>

          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-phone" aria-hidden="true"></i>
              Phone Number
            </p>
            <p class="detail-item__value">${escHtml(b.phone)}</p>
          </div>

          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
              Destination
            </p>
            <p class="detail-item__value">${escHtml(b.destination)}</p>
          </div>

        </div>

        <hr class="receipt__divider" />

        <!-- SECTION: Stay Details -->
        <p class="receipt__section-title">
          <i class="fa-solid fa-calendar" aria-hidden="true"></i>
          Stay Details
        </p>
        <div class="receipt__details-grid">

          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
              Check-in Date
            </p>
            <p class="detail-item__value">${checkinFormatted}</p>
          </div>

          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-calendar-xmark" aria-hidden="true"></i>
              Check-out Date
            </p>
            <p class="detail-item__value">${checkoutFormatted}</p>
          </div>

          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-moon" aria-hidden="true"></i>
              Number of Nights
            </p>
            <p class="detail-item__value">
              <span class="nights-pill">
                <i class="fa-solid fa-moon" aria-hidden="true"></i>
                ${nights} Night${nights !== 1 ? "s" : ""}
              </span>
            </p>
          </div>

          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-user-group" aria-hidden="true"></i>
              Guests
            </p>
            <p class="detail-item__value">
              ${b.guests} Guest${b.guests !== 1 ? "s" : ""}
            </p>
          </div>

          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-door-open" aria-hidden="true"></i>
              Rooms
            </p>
            <p class="detail-item__value">
              ${rooms} Room${rooms !== 1 ? "s" : ""}
            </p>
          </div>

          ${b.specialRequests ? `
          <div class="detail-item">
            <p class="detail-item__label">
              <i class="fa-solid fa-comment-dots" aria-hidden="true"></i>
              Special Requests
            </p>
            <p class="detail-item__value">${escHtml(b.specialRequests)}</p>
          </div>` : ""}

        </div>

        <hr class="receipt__divider" />

        <!-- SECTION: Price Breakdown -->
        <p class="receipt__section-title">
          <i class="fa-solid fa-receipt" aria-hidden="true"></i>
          Price Breakdown
        </p>

        <table class="receipt__price-table" aria-label="Price breakdown">
          <tbody>
            <tr>
              <td class="receipt__price-label">
                Price per night
              </td>
              <td>${formatPrice(ppn)}</td>
            </tr>
            <tr>
              <td class="receipt__price-label">
                ${formatPrice(ppn)} &times; ${rooms} room${rooms !== 1 ? "s" : ""}
                &times; ${nights} night${nights !== 1 ? "s" : ""}
              </td>
              <td>${formatPrice(subtotal)}</td>
            </tr>
            <tr>
              <td class="receipt__price-label">
                Tax (${taxRate}%)
              </td>
              <td>+ ${formatPrice(taxes)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Total price -->
        <div class="receipt__total-row" aria-label="Total amount ${formatPrice(total)}">
          <div class="receipt__total-label">
            Total Amount
            <span>inclusive of ${taxRate}% tax</span>
          </div>
          <div class="receipt__total-price">${formatPrice(total)}</div>
        </div>

      </div>
      <!-- end receipt body -->

      <!-- ── Receipt footer ── -->
      <div class="receipt__footer">
        <p class="receipt__footer-note">
          Thank you for booking with TravelEase.<br />
          Please present this receipt at the hotel check-in counter.<br />
          For support: <strong>hello@travelease.com</strong> | <strong>+91 1800-123-456</strong>
        </p>
        <div class="receipt__stamp">
          <i class="fa-solid fa-circle-check" aria-hidden="true"></i>
          CONFIRMED
        </div>
      </div>

    </div>
    <!-- end #receiptCard -->
  `;
}


/* ================================================================
   PART 8 — ACTION BUTTONS
================================================================ */
function buildActionButtons() {
  return `
    <div class="confirm-actions" role="group" aria-label="Booking actions">

      <!-- Print / Download -->
      <button
        class="btn btn--primary btn--lg"
        id="printBtn"
        aria-label="Print or download booking confirmation"
      >
        <i class="fa-solid fa-print" aria-hidden="true"></i>
        Print / Download
      </button>

      <!-- Go to Home -->
      <a href="index.html" class="btn btn--outline btn--lg" id="homeBtn">
        <i class="fa-solid fa-house" aria-hidden="true"></i>
        Go to Home
      </a>

      <!-- View My Bookings (smooth scroll) -->
      <button
        class="btn btn--outline btn--lg"
        id="historyBtn"
        aria-label="View booking history"
      >
        <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
        View My Bookings
      </button>

    </div>
  `;
}


/* ================================================================
   PART 9 — BOOKING HISTORY SECTION (shell)
   The table rows are filled by renderHistoryTable() below.
================================================================ */
function buildHistorySection() {
  return `
    <section class="bookings-history" id="bookingsHistory" aria-label="My booking history">
      <div class="bookings-history__header">
        <h2 class="bookings-history__title">
          <i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i>
          My Booking History
        </h2>
        <button
          class="bookings-history__clear"
          id="clearHistoryBtn"
          aria-label="Clear all booking history"
        >
          <i class="fa-solid fa-trash" aria-hidden="true"></i>
          Clear History
        </button>
      </div>

      <!-- Table is injected by renderHistoryTable() -->
      <div class="bookings-table-wrap" id="historyTableWrap">
        <!-- injected below -->
      </div>
    </section>
  `;
}


/* ================================================================
   PART 10 — RENDER HISTORY TABLE
   ----------------------------------------------------------------
   Reads ALL bookings from LocalStorage and builds a table.
   Called on page load and again after "Clear History".
================================================================ */
function renderHistoryTable() {
  var wrap = document.getElementById("historyTableWrap");
  if (!wrap) return;

  var history = readBookingHistory();

  if (history.length === 0) {
    wrap.innerHTML = `
      <div class="history-empty">
        <i class="fa-solid fa-calendar-xmark" aria-hidden="true"></i>
        <p style="font-weight:600;color:var(--clr-text-body);margin-bottom:var(--sp-2);">
          No booking history yet.
        </p>
        <p style="font-size:var(--fs-sm);">
          Your confirmed bookings will appear here.
        </p>
      </div>
    `;
    return;
  }

  /*
    Build the table rows dynamically with forEach().
    .map() transforms each booking → one <tr> HTML string.
    .join("") merges all strings into one.
  */
  var rows = history.map(function (b) {
    return `
      <tr>
        <td class="booking-id-cell">${escHtml(b.bookingId)}</td>
        <td>${escHtml(b.customerName || b.fullName || "—")}</td>
        <td>${escHtml(b.hotel)}</td>
        <td>${escHtml(b.destination)}</td>
        <td>${prettyDate(b.checkin)}</td>
        <td>${prettyDate(b.checkout)}</td>
        <td>${b.nights} night${b.nights !== 1 ? "s" : ""}</td>
        <td>${b.guests}</td>
        <td>${b.rooms}</td>
        <td class="price-cell">${formatPrice(b.totalPrice)}</td>
        <td>${prettyDate(b.bookingDate ? b.bookingDate.slice(0,10) : "")}</td>
      </tr>
    `;
  }).join("");

  wrap.innerHTML = `
    <table class="bookings-table" aria-label="Booking history">
      <thead>
        <tr>
          <th>Booking ID</th>
          <th>Name</th>
          <th>Hotel</th>
          <th>Destination</th>
          <th>Check-in</th>
          <th>Check-out</th>
          <th>Nights</th>
          <th>Guests</th>
          <th>Rooms</th>
          <th>Total</th>
          <th>Booked On</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}


/* ================================================================
   PART 11 — ATTACH BUTTON HANDLERS
   ----------------------------------------------------------------
   CONCEPT: window.print()
   -----------------------------------------------
   window.print() opens the browser's native Print dialog.
   The user can then:
     • Print to a physical printer
     • "Save as PDF" (all modern browsers support this)

   Our @media print CSS rules hide everything except
   #receiptCard, so the printed page looks like a clean receipt.
================================================================ */
function attachButtonHandlers(booking) {

  /* ── PRINT BUTTON ── */
  var printBtn = document.getElementById("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", function () {
      /*
        window.print() opens the print dialog.
        The @media print CSS in confirmation.html:
          • Hides: navbar, hero, buttons, footer, history
          • Shows: only #receiptCard
        So the output is a clean one-page receipt.
      */
      window.print();
    });
  }

  /* ── VIEW MY BOOKINGS (scroll down) ── */
  var historyBtn = document.getElementById("historyBtn");
  if (historyBtn) {
    historyBtn.addEventListener("click", function () {
      var section = document.getElementById("bookingsHistory");
      if (section) {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  /* ── CLEAR HISTORY BUTTON ── */
  var clearBtn = document.getElementById("clearHistoryBtn");
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      var confirmed = window.confirm(
        "Are you sure you want to delete all booking history?\nThis cannot be undone."
      );
      if (!confirmed) return;

      /* Remove both LocalStorage keys */
      localStorage.removeItem(HISTORY_KEY);
      localStorage.removeItem(CURRENT_KEY);

      /* Re-render the table (will show empty state) */
      renderHistoryTable();
      showToast("Booking history cleared.", "");
    });
  }
}


/* ================================================================
   PART 12 — NO BOOKING PAGE
   ----------------------------------------------------------------
   Shown when LocalStorage has no current booking
   (user landed here directly without booking).
================================================================ */
function renderNoBookingPage() {
  var main = document.getElementById("mainContent");
  if (!main) return;

  main.innerHTML = `
    <div class="confirm-layout">
      <div class="no-booking" role="status">
        <i class="fa-solid fa-calendar-xmark" aria-hidden="true"></i>
        <h2>No Booking Found</h2>
        <p>
          It looks like you haven't completed a booking yet,
          or your session has expired.
        </p>
        <div style="display:flex; gap:var(--sp-4); justify-content:center; flex-wrap:wrap;">
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
    </div>
  `;
}


/* ================================================================
   PART 13 — UTILITY FUNCTIONS
================================================================ */

/* Format "YYYY-MM-DD" → "03 Nov 2026" */
function prettyDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

/*
  Escape HTML special characters.
  Prevents XSS (Cross-Site Scripting) — if a booking field
  somehow contained <script> tags, this makes them harmless
  by converting < to &lt; etc.
*/
function escHtml(str) {
  if (typeof str !== "string") return String(str || "");
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


/* ================================================================
   PART 14 — NAVBAR + SCROLL-TO-TOP
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

var toastTimer = null;
function showToast(message, type) {
  var toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = "toast is-visible" + (type ? " toast--" + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 3000);
}
