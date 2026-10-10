/* ================================================================
   TravelEase — booking.js
   Powers the booking.html page.

   WHAT THIS FILE DOES:
   1.  Reads URL params → pre-fills destination & hotel
   2.  Populates destination & hotel dropdowns from data.js
   3.  Validates every field in real time (on blur) AND on submit
   4.  Calculates total price live as the user fills the form
   5.  Updates the booking summary sidebar automatically
   6.  Saves the confirmed booking to localStorage
   7.  Redirects to confirmation.html on success

   VALIDATION RULES:
   • Full Name    – cannot be empty, min 2 chars
   • Email        – must match standard email pattern
   • Phone        – 7–15 digits, optional +, spaces, dashes
   • Destination  – must select a value (not the placeholder)
   • Hotel        – must select a value
   • Check-in     – cannot be a past date
   • Check-out    – must be strictly after check-in
   • Guests       – integer between 1 and 20
   • Rooms        – integer between 1 and hotel.availableRooms
================================================================ */


/* ================================================================
   PART 1 — DOM ELEMENT REFERENCES
   Declared here, assigned inside DOMContentLoaded so the DOM
   exists when getElementById is called.
================================================================ */

var form             = null;
var submitBtn        = null;
var summaryContent   = null;
var currentYearSpan  = null;
var toastEl          = null;
var scrollTopBtn     = null;
var fullNameInput    = null;
var emailInput       = null;
var phoneInput       = null;
var destSelect       = null;
var hotelSelect      = null;
var checkinInput     = null;
var checkoutInput    = null;
var guestsInput      = null;
var roomsInput       = null;
var specialInput     = null;
var formLevelError   = null;


/* ================================================================
   PART 2 — PAGE INITIALISATION
================================================================ */

document.addEventListener("DOMContentLoaded", function () {
  /* Assign DOM references now — the page is fully parsed */
  form             = document.getElementById("bookingForm");
  submitBtn        = document.getElementById("submitBtn");
  summaryContent   = document.getElementById("summaryContent");
  currentYearSpan  = document.getElementById("currentYear");
  toastEl          = document.getElementById("toast");
  scrollTopBtn     = document.getElementById("scrollTopBtn");
  fullNameInput    = document.getElementById("fullName");
  emailInput       = document.getElementById("email");
  phoneInput       = document.getElementById("phone");
  destSelect       = document.getElementById("destinationSelect");
  hotelSelect      = document.getElementById("hotelSelect");
  checkinInput     = document.getElementById("checkinDate");
  checkoutInput    = document.getElementById("checkoutDate");
  guestsInput      = document.getElementById("guestsInput");
  roomsInput       = document.getElementById("roomsInput");
  specialInput     = document.getElementById("specialRequests");
  formLevelError   = document.getElementById("form-level-error");

  if (currentYearSpan) currentYearSpan.textContent = new Date().getFullYear();

  setDateDefaults();          // set min dates + sensible default dates
  populateDestinations();     // fill the destination <select>
  readUrlParams();            // pre-fill from ?hotel=xxx&destination=yyy
  attachAllListeners();       // wire up validation + summary update
  updateNightsBadge();        // show nights badge using default dates
  initNavbar();
  initScrollTop();
});


/* ================================================================
   PART 3 — SET DEFAULT DATES
   ----------------------------------------------------------------
   CONCEPT: JavaScript Date object
   ─────────────────────────────────────────────────────────────
   new Date()
   → Creates a Date representing THIS EXACT MOMENT.
     Internally just a big number: milliseconds since 1 Jan 1970.

   new Date("2026-11-01")
   → Creates a Date from a string in YYYY-MM-DD format.
     The browser parses the string and converts it to that
     same big-number representation.

   .toISOString()
   → Converts the Date back to a string: "2026-11-01T00:00:00.000Z"

   .split("T")[0]
   → Keeps only the date part before the "T": "2026-11-01"
     This is exactly what <input type="date"> needs as its value.

   .setDate(d.getDate() + 1)
   → Adds 1 day. JavaScript handles month/year rollovers
     automatically (e.g. Jan 31 + 1 day = Feb 1, not Jan 32).
================================================================ */
function setDateDefaults() {
  var today = new Date();

  /* Strip the time portion so comparisons are date-only.
     Without this, "today at 11pm" would be "in the past"
     compared to "today at midnight" — confusing for users. */
  today.setHours(0, 0, 0, 0);

  var tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);   /* today + 1 day */

  var dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);   /* today + 2 days */

  /* Helper: Date object → "YYYY-MM-DD" string */
  function toInputValue(d) {
    return d.toISOString().split("T")[0];
  }

  /* Set the minimum selectable date for each input */
  checkinInput.min  = toInputValue(today);     /* today */
  checkoutInput.min = toInputValue(tomorrow);  /* tomorrow */

  /* Sensible defaults so the summary sidebar shows a price immediately */
  checkinInput.value  = toInputValue(tomorrow);
  checkoutInput.value = toInputValue(dayAfter);
}


/* ================================================================
   PART 4 — POPULATE DESTINATION DROPDOWN
   ----------------------------------------------------------------
   Reads destinations[] from data.js and creates one <option>
   per destination inside the <select>.

   CONCEPT: createElement + appendChild
   -----------------------------------------------
   document.createElement("option")  → creates a new <option> tag
   option.value   = "goa"            → the value submitted in the form
   option.textContent = "Goa"        → the text the user sees
   select.appendChild(option)        → adds it to the dropdown
================================================================ */

function populateDestinations() {
  // destinations[] comes from data.js
  destinations.forEach(function (dest) {
    const option       = document.createElement("option");
    option.value       = dest.id;         // "goa"
    option.textContent = dest.name;       // "Goa"
    destSelect.appendChild(option);
  });
}


/* ================================================================
   PART 5 — POPULATE HOTEL DROPDOWN
   ----------------------------------------------------------------
   Called whenever the destination changes.
   Clears the hotel <select> and re-fills it with hotels
   that belong to the chosen destination.
================================================================ */

function populateHotels(destinationId) {
  // Clear everything except the placeholder option
  hotelSelect.innerHTML = '<option value="">Select a hotel</option>';

  if (!destinationId) return;

  // getHotelsByDestination() is from data.js
  var destHotels = getHotelsByDestination(destinationId);

  if (destHotels.length === 0) {
    hotelSelect.innerHTML = '<option value="">No hotels available</option>';
    return;
  }

  destHotels.forEach(function (hotel) {
    const option       = document.createElement("option");
    option.value       = hotel.id;
    // Show name + price so user can compare at a glance
    option.textContent = hotel.name + "  –  " + formatPrice(hotel.pricePerNight) + "/night";
    option.dataset.hotelId = hotel.id;
    hotelSelect.appendChild(option);
  });
}


/* ================================================================
   PART 6 — READ URL PARAMETERS
   ----------------------------------------------------------------
   When the user clicks "Book Now" on a hotel card, they arrive at:
     booking.html?hotel=taj-exotica-goa&destination=goa

   We read these params and pre-select the correct dropdown options.

   CONCEPT: URLSearchParams
   -----------------------------------------------
   new URLSearchParams(window.location.search)
   → parses "?hotel=taj-exotica-goa&destination=goa"
   .get("hotel")        → "taj-exotica-goa"
   .get("destination")  → "goa"
================================================================ */

function readUrlParams() {
  var params   = new URLSearchParams(window.location.search);
  var destId   = params.get("destination");
  var hotelId  = params.get("hotel");
  var checkin  = params.get("checkin");
  var checkout = params.get("checkout");
  var guests   = params.get("guests");

  // Pre-fill destination
  if (destId) {
    destSelect.value = destId;
    populateHotels(destId);   // load hotels for this destination
  }

  // Pre-fill hotel (must happen AFTER populateHotels)
  if (hotelId) {
    hotelSelect.value = hotelId;
    updateSummary();   // show the hotel details in the sidebar immediately
  }

  // Pre-fill dates from search form
  if (checkin)  checkinInput.value  = checkin;
  if (checkout) checkoutInput.value = checkout;
  if (guests)   guestsInput.value   = guests;

  // Also try sessionStorage (set by the homepage search form)
  var saved = sessionStorage.getItem("searchParams");
  if (saved && !destId) {
    try {
      const s = JSON.parse(saved);
      if (s.destination && !destSelect.value) {
        destSelect.value = s.destination;
        populateHotels(s.destination);
      }
      if (s.checkin  && !checkinInput.value)  checkinInput.value  = s.checkin;
      if (s.checkout && !checkoutInput.value) checkoutInput.value = s.checkout;
      if (s.guests   && !guestsInput.value)   guestsInput.value   = s.guests;
    } catch (e) { /* ignore parse errors */ }
  }
}


/* ================================================================
   PART 7 — ATTACH ALL EVENT LISTENERS
================================================================ */

function attachAllListeners() {

  /* ── Validate fields on blur (when user leaves a field) ──
     "blur" fires when an input loses focus.
     Validating on blur (not on every keystroke) is better UX:
     we don't yell at the user before they have finished typing.
  */
  fullNameInput.addEventListener("blur",   function () { validateField(this); });
  emailInput.addEventListener("blur",      function () { validateField(this); });
  phoneInput.addEventListener("blur",      function () { validateField(this); });
  checkinInput.addEventListener("blur",    function () { validateField(this); updateNightsBadge(); updateSummary(); });
  checkoutInput.addEventListener("blur",   function () { validateField(this); updateNightsBadge(); updateSummary(); });
  guestsInput.addEventListener("blur",     function () { validateField(this); updateSummary(); });
  roomsInput.addEventListener("blur",      function () { validateField(this); updateSummary(); });

  /* ── Also validate live on input for number fields ── */
  guestsInput.addEventListener("input",    function () { updateSummary(); });
  roomsInput.addEventListener("input",     function () { updateSummary(); });

  /* ── Destination change → reload hotels dropdown ── */
  destSelect.addEventListener("change", function () {
    validateField(this);
    populateHotels(this.value);
    hotelSelect.value = "";       // reset hotel selection
    clearFieldState(hotelSelect); // remove any previous valid/invalid styling
    updateSummary();
  });

  /* ── Hotel change → update summary ── */
  hotelSelect.addEventListener("change", function () {
    validateField(this);
    updateRoomsHint();  // show "X rooms available" hint
    updateSummary();
  });

  /* ── Check-in change → advance checkout minimum + update nights ── */
  checkinInput.addEventListener("change", function () {
    handleCheckinChange();
    updateSummary();
  });

  checkoutInput.addEventListener("change", function () {
    validateField(this);
    updateNightsBadge();   /* refresh the "3 Nights" display */
    updateSummary();
  });

  /* ── Form submit ── */
  form.addEventListener("submit", handleSubmit);
}


/* ================================================================
   PART 8 — THE VALIDATION ENGINE
   ----------------------------------------------------------------
   validateField(inputEl) is called for any input element.
   It reads the input's id, applies the right rule, and
   calls either showError() or showSuccess().

   CONCEPT: Regex (Regular Expression)
   -----------------------------------------------
   A regex is a pattern used to test whether a string
   matches a certain format.

   /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   ↑ email regex — checks for something@something.something

   Breakdown:
     ^           → start of string
     [^\s@]+     → one or more chars that are NOT a space or @
     @           → literal @ symbol
     [^\s@]+     → one or more chars that are NOT a space or @
     \.          → literal dot
     [^\s@]+     → one or more chars (the domain extension)
     $           → end of string

   .test("hello@world.com") → true  ✓
   .test("hello@")          → false ✗
   .test("notanemail")      → false ✗

   -----------------------------------------------
   CONCEPT: Ternary operator
   -----------------------------------------------
   condition ? valueIfTrue : valueIfFalse
   Used throughout to keep validation concise.
================================================================ */

function validateField(inputEl) {
  var id  = inputEl.id;
  var val = inputEl.value.trim();

  // Each case returns either an error string or "" (no error)
  let error = "";

  switch (id) {

    /* ── FULL NAME ── */
    case "fullName":
      if (!val) {
        error = "Full name is required.";
      } else if (val.length < 2) {
        error = "Name must be at least 2 characters.";
      } else if (!/^[a-zA-Z\s'.'-]+$/.test(val)) {
        error = "Name can only contain letters and spaces.";
      }
      break;

    /* ── EMAIL ── */
    case "email":
      if (!val) {
        error = "Email address is required.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        /*
          Regex breakdown:
          ^[^\s@]+   → starts with 1+ non-space, non-@ chars  (the username)
          @          → literal @ sign
          [^\s@]+    → 1+ non-space, non-@ chars               (the domain)
          \.         → literal dot
          [^\s@]+$   → 1+ chars to end                         (the TLD: .com, .in)
        */
        error = "Please enter a valid email address.";
      }
      break;

    /* ── PHONE ── */
    case "phone":
      if (!val) {
        error = "Phone number is required.";
      } else {
        /*
          Strip all spaces, dashes, and parentheses,
          then check the remaining characters are digits (and optional leading +).
          Valid: "+91 98765 43210", "9876543210", "+1-800-123-4567"
          Invalid: "abc", "123"
        */
        const digits = val.replace(/[\s\-().]/g, "");
        if (!/^\+?\d{7,15}$/.test(digits)) {
          error = "Enter a valid phone number (7–15 digits).";
        }
      }
      break;

    /* ── DESTINATION ── */
    case "destinationSelect":
      if (!val) {
        error = "Please select a destination.";
      }
      break;

    /* ── HOTEL ── */
    case "hotelSelect":
      if (!val) {
        error = "Please select a hotel.";
      }
      break;

    /* ── CHECK-IN DATE ── */
    case "checkinDate": {
      if (!val) {
        error = "Check-in date is required.";
      } else {
        const today     = new Date();
        today.setHours(0, 0, 0, 0);       // strip time — compare dates only
        const checkinDate = new Date(val);
        checkinDate.setHours(0, 0, 0, 0);

        if (checkinDate < today) {
          // User picked a past date
          error = "Check-in date cannot be in the past.";
          /*
            WHY: new Date("2025-01-01") < new Date() is TRUE if today is after 2025.
            We zero out the time component so today's date is always valid.
          */
        }
      }
      break;
    }

    /* ── CHECK-OUT DATE ── */
    case "checkoutDate": {
      if (!val) {
        error = "Check-out date is required.";
      } else if (!checkinInput.value) {
        error = "Please set a check-in date first.";
      } else {
        const checkin  = new Date(checkinInput.value);
        const checkout = new Date(val);

        if (checkout <= checkin) {
          // Same day or earlier than check-in
          error = "Check-out must be at least one day after check-in.";
        }
      }
      break;
    }

    /* ── GUESTS ── */
    case "guestsInput": {
      const n = parseInt(val);
      if (!val || isNaN(n)) {
        error = "Number of guests is required.";
      } else if (n < 1) {
        error = "At least 1 guest is required.";
      } else if (n > 20) {
        error = "Maximum 20 guests per booking.";
      }
      break;
    }

    /* ── ROOMS ── */
    case "roomsInput": {
      const n = parseInt(val);
      if (!val || isNaN(n)) {
        error = "Number of rooms is required.";
      } else if (n < 1) {
        error = "At least 1 room is required.";
      } else if (n > 10) {
        error = "Maximum 10 rooms per booking.";
      } else {
        // Check against hotel availability
        const selectedHotel = getSelectedHotel();
        if (selectedHotel && n > selectedHotel.availableRooms) {
          error = "Only " + selectedHotel.availableRooms + " rooms available for this hotel.";
        }
      }
      break;
    }
  }

  // Apply the result to the UI
  if (error) {
    showError(inputEl, error);
    return false;   // field is INVALID
  } else {
    showSuccess(inputEl);
    return true;    // field is VALID
  }
}


/* ================================================================
   PART 9 — SHOW ERROR / SHOW SUCCESS
   ----------------------------------------------------------------
   These two functions update the visual state of a form field.

   showError()   → red border, red X icon, red message below
   showSuccess() → green border, green tick icon, message hidden

   CONCEPT: querySelector
   -----------------------------------------------
   We use the form-group wrapper to find sibling elements:
     group.querySelector(".form-error")  → the error <p>
     group.querySelector(".input-status") → the icon span
================================================================ */

function showError(inputEl, message) {
  // Remove both classes first, then add only "is-invalid"
  inputEl.classList.remove("is-valid");
  inputEl.classList.add("is-invalid");

  // Find the error <p> inside the same .form-group parent
  var group = inputEl.closest(".form-group");
  if (!group) return;

  var errorEl  = group.querySelector(".form-error");
  var statusEl = group.querySelector(".input-status");

  if (errorEl) {
    errorEl.querySelector("span").textContent = message;
    errorEl.classList.add("is-visible");
  }

  if (statusEl) {
    statusEl.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
  }
}

function showSuccess(inputEl) {
  inputEl.classList.remove("is-invalid");
  inputEl.classList.add("is-valid");

  var group = inputEl.closest(".form-group");
  if (!group) return;

  var errorEl  = group.querySelector(".form-error");
  var statusEl = group.querySelector(".input-status");

  if (errorEl) {
    errorEl.querySelector("span").textContent = "";
    errorEl.classList.remove("is-visible");
  }

  if (statusEl) {
    statusEl.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
  }
}

function clearFieldState(inputEl) {
  inputEl.classList.remove("is-valid", "is-invalid");
  var group = inputEl.closest(".form-group");
  if (!group) return;
  var errorEl  = group.querySelector(".form-error");
  var statusEl = group.querySelector(".input-status");
  if (errorEl)  { errorEl.classList.remove("is-visible"); errorEl.querySelector("span").textContent = ""; }
  if (statusEl) { statusEl.innerHTML = ""; }
}


/* ================================================================
   PART 10 — VALIDATE ALL FIELDS (run on submit)
   ----------------------------------------------------------------
   Runs validateField() on every required input.
   Returns true only if ALL fields pass.
   If any fail, scrolls to the first error.
================================================================ */

function validateAll() {
  // Array of all required fields to check
  var fields = [
    fullNameInput,
    emailInput,
    phoneInput,
    destSelect,
    hotelSelect,
    checkinInput,
    checkoutInput,
    guestsInput,
    roomsInput
  ];

  let allValid = true;
  let firstInvalid = null;

  fields.forEach(function (field) {
    const isValid = validateField(field);
    if (!isValid) {
      allValid = false;
      // Track the first invalid field so we can scroll to it
      if (!firstInvalid) firstInvalid = field;
    }
  });

  // Scroll to the first error field so the user sees it
  if (firstInvalid) {
    firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
    firstInvalid.focus();
  }

  return allValid;
}


/* ================================================================
   PART 11 — HANDLE FORM SUBMIT
   ----------------------------------------------------------------
   This is the function that runs when the user clicks
   "Confirm Booking".

   Steps:
   1. Prevent the default page reload (e.preventDefault)
   2. Validate all fields
   3. If invalid → show error banner, stop
   4. If valid   → build booking object, save to localStorage,
                   redirect to confirmation.html
================================================================ */

function handleSubmit(e) {
  /*
    CONCEPT: e.preventDefault()
    -----------------------------------------------
    By default, submitting an HTML form causes a full page reload.
    e.preventDefault() stops that so our JavaScript can handle it.
    This is how every modern form works.
  */
  e.preventDefault();

  // Disable the button while we process (prevents double-clicks)
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Validating…';

  // Small timeout so the spinner is visible (simulates a real check)
  setTimeout(function () {

    const isValid = validateAll();

    if (!isValid) {
      // Show the form-level error banner
      formLevelError.classList.add("is-visible");

      // Re-enable the button
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<i class="fa-solid fa-lock"></i> Confirm Booking <i class="fa-solid fa-arrow-right"></i>';
      return;
    }

    /* ── EXTRA GUARD: block if nights ≤ 0 ───────────────────────
       validateAll() checks individual fields, but this catches
       the edge case where both dates are individually "valid"
       (not in the past) yet somehow produce 0 nights.
       We never want to save a booking for 0 nights.
    ─────────────────────────────────────────────────────────── */
    var nights = calculateNights();
    if (nights <= 0) {
      showDateError("Please select valid check-in and check-out dates (minimum 1 night).");
      document.getElementById("checkinDate").scrollIntoView({ behavior: "smooth", block: "center" });
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<i class="fa-solid fa-lock"></i> Confirm Booking <i class="fa-solid fa-arrow-right"></i>';
      return;
    }

    // All valid — hide the error banner
    formLevelError.classList.remove("is-visible");

    // Build the complete booking object
    var booking = buildBookingObject();

    // Save to LocalStorage using our dedicated module
    BookingStorage.save(booking);

    // Clear the temporary search session data
    sessionStorage.removeItem("searchParams");

    // Show success feedback on the button before redirecting
    submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Booking Confirmed! Redirecting…';
    submitBtn.style.background = "linear-gradient(135deg, var(--clr-success), #155e30)";

    showToast("Booking confirmed! Taking you to your receipt…", "success");

    // Redirect after 1.2 seconds
    setTimeout(function () {
      window.location.href = "confirmation.html";
    }, 1200);

  }, 400);
}


/* ================================================================
   PART 12 — BUILD BOOKING OBJECT
   ----------------------------------------------------------------
   Assembles all form values + calculated totals into one clean
   object that we save to localStorage.
================================================================ */

function buildBookingObject() {
  var hotel   = getSelectedHotel();
  var nights  = calculateNights();
  var rooms   = parseInt(roomsInput.value)  || 1;
  var guests  = parseInt(guestsInput.value) || 1;

  /* Use the shared calculatePrice() engine — keeps numbers consistent */
  var price   = calculatePrice(hotel ? hotel.pricePerNight : 0, rooms, nights);
  var subtotal   = price.subtotal;
  var taxes      = price.tax;
  var totalPrice = price.totalPrice;

  /* ── Generate unique Booking ID ─────────────────────────────
     Format: TE-YYYYMMDD-XXXX
     e.g.    TE-20261003-7842

     new Date().toISOString()          → "2026-10-03T15:22:00.000Z"
     .slice(0,10)                      → "2026-10-03"
     .replace(/-/g, "")                → "20261003"
     Math.floor(1000 + Math.random() * 9000) → random 4-digit number
  ────────────────────────────────────────────────────────────── */
  var now        = new Date();
  var datePart   = now.toISOString().slice(0, 10).replace(/-/g, "");
  var randomPart = Math.floor(1000 + Math.random() * 9000);
  var bookingId  = "TE-" + datePart + "-" + randomPart;

  return {
    /* ── Identity ── */
    bookingId       : bookingId,              /* e.g. "TE-20261003-7842" */
    bookingDate     : now.toISOString(),      /* ISO timestamp of when booked */

    /* ── Customer details ── */
    customerName    : fullNameInput.value.trim(),
    email           : emailInput.value.trim(),
    phone           : phoneInput.value.trim(),
    specialRequests : specialInput ? specialInput.value.trim() : "",

    /* ── Destination & Hotel ── */
    destination     : destSelect.options[destSelect.selectedIndex].text,
    destinationId   : destSelect.value,
    hotel           : hotel ? hotel.name : hotelSelect.options[hotelSelect.selectedIndex].text,
    hotelId         : hotelSelect.value,
    hotelImage      : hotel ? hotel.image      : "",
    hotelLocation   : hotel ? hotel.location   : "",
    hotelCategory   : hotel ? hotel.category   : "",
    hotelRating     : hotel ? hotel.rating     : 0,

    /* ── Stay details ── */
    checkin         : checkinInput.value,      /* "YYYY-MM-DD" */
    checkout        : checkoutInput.value,     /* "YYYY-MM-DD" */
    nights          : nights,                  /* integer */
    guests          : guests,                  /* integer */
    rooms           : rooms,                   /* integer */

    /* ── Price breakdown ── */
    pricePerNight   : hotel ? hotel.pricePerNight : 0,
    subtotal        : subtotal,
    taxes           : taxes,
    taxRate         : 5,
    totalPrice      : totalPrice,
    currency        : "INR",
    status          : "Confirmed"
  };
}


/* ================================================================
   PART 13 — PRICE CALCULATION ENGINE
   ----------------------------------------------------------------

   THE FORMULA (matches your spec exactly):
   ─────────────────────────────────────────
   numberOfNights = checkOutDate  - checkInDate   (in whole days)
   subtotal       = pricePerNight × rooms × nights
   tax            = subtotal × 5%                 (5% flat tax)
   totalPrice     = subtotal + tax

   EXAMPLE (from your spec):
   ─────────────────────────────────────────
   pricePerNight = ₹2500
   rooms         = 2
   nights        = 3
   subtotal      = 2500 × 2 × 3  = ₹15,000
   tax           = 15000 × 0.05  = ₹750
   totalPrice    = 15000 + 750   = ₹15,750  ✓

   ─────────────────────────────────────────
   CONCEPT: How date subtraction works in JavaScript
   ─────────────────────────────────────────
   In JavaScript, a Date object stores time as milliseconds
   since 1 Jan 1970 (called a "Unix timestamp").

   new Date("2026-11-04").getTime()  →  1762214400000  (ms)
   new Date("2026-11-01").getTime()  →  1761955200000  (ms)

   Difference = 1762214400000 - 1761955200000
              = 259200000 ms

   Convert ms → days:
     1 second = 1000 ms
     1 minute = 60 seconds = 60,000 ms
     1 hour   = 60 minutes = 3,600,000 ms
     1 day    = 24 hours   = 86,400,000 ms

   So:  259200000 ÷ 86400000  =  3 nights  ✓

   We use Math.round() instead of Math.floor() to handle
   daylight-saving-time edge cases (clocks jump by 1 hour
   in some countries, making a 3-day gap appear as 2.958 days).
================================================================ */

/* Tax rate constant — change here to update everywhere */
var TAX_RATE = 0.05;   /* 5% */

/**
 * Core price calculator.
 * Returns a plain object with every price breakdown value.
 *
 * @param  {number} pricePerNight  – hotel's nightly rate in ₹
 * @param  {number} rooms          – number of rooms booked
 * @param  {number} nights         – number of nights
 * @returns {Object} price breakdown
 */
function calculatePrice(pricePerNight, rooms, nights) {

  /* ── STEP 1: sanitise inputs ──────────────────────────────
     parseInt / parseFloat convert strings to numbers safely.
     "2" → 2,  "" → NaN.
     We use || 0 as a fallback so NaN becomes 0.
  ────────────────────────────────────────────────────────── */
  var ppn    = parseFloat(pricePerNight) || 0;   /* price per night  */
  var r      = parseInt(rooms)           || 0;   /* number of rooms  */
  var n      = parseInt(nights)          || 0;   /* number of nights */

  /* ── STEP 2: subtotal ─────────────────────────────────────
     subtotal = pricePerNight × rooms × nights
     e.g.     = 2500 × 2 × 3 = 15000
  ────────────────────────────────────────────────────────── */
  var subtotal = ppn * r * n;

  /* ── STEP 3: tax ──────────────────────────────────────────
     tax = subtotal × TAX_RATE
         = 15000 × 0.05
         = 750

     Math.round() removes floating-point noise.
     e.g. 15000 × 0.05 = 750.0000000001 in some engines → 750
  ────────────────────────────────────────────────────────── */
  var tax = Math.round(subtotal * TAX_RATE);

  /* ── STEP 4: total ────────────────────────────────────────
     totalPrice = subtotal + tax
               = 15000 + 750
               = 15750
  ────────────────────────────────────────────────────────── */
  var totalPrice = subtotal + tax;

  /* Return every value so the summary can display them all */
  return {
    pricePerNight : ppn,
    rooms         : r,
    nights        : n,
    subtotal      : subtotal,
    tax           : tax,
    taxRate       : TAX_RATE * 100,   /* 5  (used for display "5%") */
    totalPrice    : totalPrice
  };
}


/* ================================================================
   PART 14 — UPDATE BOOKING SUMMARY SIDEBAR
   ----------------------------------------------------------------
   Called whenever hotel, check-in, check-out, or rooms change.

   Flow:
   1. Read current form values
   2. Call calculateNights() for the date diff
   3. Call calculatePrice() for the price breakdown
   4. Rebuild the sidebar HTML and inject it
================================================================ */

function updateSummary() {

  /* ── Read current values from the form ── */
  var hotel  = getSelectedHotel();                  /* object or null       */
  var nights = calculateNights();                   /* integer ≥ 0          */
  var rooms  = parseInt(roomsInput.value)  || 1;   /* integer, default 1   */
  var guests = parseInt(guestsInput.value) || 1;

  /* ── If no hotel chosen yet, show placeholder ── */
  if (!hotel) {
    summaryContent.innerHTML = `
      <div class="summary-placeholder">
        <i class="fa-solid fa-hotel" aria-hidden="true"></i>
        <p style="font-size:var(--fs-sm);font-weight:600;
                  color:var(--clr-text-body);margin-bottom:var(--sp-2);">
          No hotel selected yet
        </p>
        <p style="font-size:var(--fs-xs);">
          Choose a destination and hotel to see your price breakdown.
        </p>
      </div>
    `;
    return;
  }

  /* ── Calculate the price breakdown ── */
  var price = calculatePrice(hotel.pricePerNight, rooms, nights);
  /*
    price.pricePerNight = 2500
    price.rooms         = 2
    price.nights        = 3
    price.subtotal      = 15000
    price.tax           = 750
    price.totalPrice    = 15750
  */

  /* ── Helper: "2026-11-01" → "01 Nov 2026" ── */
  function prettyDate(str) {
    if (!str) return "—";
    return new Date(str).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  /* ── Decide what to show for nights when dates aren't set ── */
  var nightsDisplay  = nights > 0 ? nights + " night" + (nights > 1 ? "s" : "") : "—";
  var subtotalLabel  = nights > 0
    ? formatPrice(price.pricePerNight) + " × " + rooms
      + " room" + (rooms > 1 ? "s" : "")
      + " × " + nights + " night" + (nights > 1 ? "s" : "")
    : "Select dates to calculate";

  /* ── Inject the HTML ── */
  summaryContent.innerHTML = `

    <!-- Hotel preview image + name -->
    <div class="summary-hotel">
      <img
        src="${hotel.image}"
        alt="${hotel.name}"
        class="summary-hotel__img"
        onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=70'"
      />
      <div>
        <p class="summary-hotel__name">${hotel.name}</p>
        <p class="summary-hotel__location">
          <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
          ${hotel.location}
        </p>
        <div class="stars" style="margin-top:4px;" aria-label="Rating ${hotel.rating} out of 5">
          ${generateStarHTML(hotel.rating)}
        </div>
      </div>
    </div>

    <!-- Stay details -->
    <div class="summary-body">

      <div class="summary-row">
        <span class="summary-row__label">
          <i class="fa-solid fa-calendar-check" aria-hidden="true"></i>
          Check-in
        </span>
        <span class="summary-row__value">${prettyDate(checkinInput.value)}</span>
      </div>

      <div class="summary-row">
        <span class="summary-row__label">
          <i class="fa-solid fa-calendar-xmark" aria-hidden="true"></i>
          Check-out
        </span>
        <span class="summary-row__value">${prettyDate(checkoutInput.value)}</span>
      </div>

      <div class="summary-row">
        <span class="summary-row__label">
          <i class="fa-solid fa-moon" aria-hidden="true"></i>
          Duration
        </span>
        <span class="summary-row__value"
              style="${nights === 0 ? 'color:var(--clr-text-faint)' : ''}">
          ${nightsDisplay}
        </span>
      </div>

      <div class="summary-row">
        <span class="summary-row__label">
          <i class="fa-solid fa-user-group" aria-hidden="true"></i>
          Guests
        </span>
        <span class="summary-row__value">${guests}</span>
      </div>

      <div class="summary-row">
        <span class="summary-row__label">
          <i class="fa-solid fa-door-open" aria-hidden="true"></i>
          Rooms
        </span>
        <span class="summary-row__value">${rooms}</span>
      </div>

      <hr class="summary-divider" />

      <!-- ── PRICE BREAKDOWN ── -->

      <!-- Row: Price per night -->
      <div class="summary-row">
        <span class="summary-row__label">
          <i class="fa-solid fa-tag" aria-hidden="true"></i>
          Price per night
        </span>
        <span class="summary-row__value">${formatPrice(price.pricePerNight)}</span>
      </div>

      <!-- Row: Subtotal formula -->
      <div class="summary-row">
        <span class="summary-row__label" style="font-size:var(--fs-xs);color:var(--clr-text-muted);">
          <i class="fa-solid fa-calculator" aria-hidden="true"></i>
          ${subtotalLabel}
        </span>
        <span class="summary-row__value">
          ${nights > 0 ? formatPrice(price.subtotal) : "—"}
        </span>
      </div>

      <!-- Row: Tax -->
      <div class="summary-row">
        <span class="summary-row__label">
          <i class="fa-solid fa-receipt" aria-hidden="true"></i>
          Tax (${price.taxRate}%)
        </span>
        <span class="summary-row__value">
          ${nights > 0 ? "+" + formatPrice(price.tax) : "—"}
        </span>
      </div>

    </div>
    <!-- end summary-body -->

    <!-- ── TOTAL PRICE (highlighted box) ── -->
    <div class="summary-total"
         aria-label="Total price ${nights > 0 ? formatPrice(price.totalPrice) : 'not yet calculated'}">
      <div class="summary-total__label">
        Total Amount
        <span>incl. ${price.taxRate}% tax</span>
      </div>
      <div class="summary-total__price"
           style="${nights === 0 ? 'font-size:var(--fs-lg);color:var(--clr-text-muted)' : ''}">
        ${nights > 0 ? formatPrice(price.totalPrice) : "Select dates"}
      </div>
    </div>

    <!-- ── FORMULA BREAKDOWN CARD (educational — shows the working) ── -->
    ${nights > 0 ? `
    <div style="
      margin: var(--sp-4) var(--sp-5);
      padding: var(--sp-4);
      background: var(--clr-bg);
      border-radius: var(--radius-md);
      border: 1px dashed var(--clr-border);
      font-size: var(--fs-xs);
      color: var(--clr-text-muted);
      line-height: 1.9;
    ">
      <p style="font-weight:700;color:var(--clr-text-body);margin-bottom:var(--sp-2);">
        <i class="fa-solid fa-calculator" style="color:var(--clr-primary)"></i>
        Price Breakdown
      </p>
      <p>Subtotal = ${formatPrice(price.pricePerNight)} × ${rooms} × ${nights}
         = <strong>${formatPrice(price.subtotal)}</strong></p>
      <p>Tax&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; = ${formatPrice(price.subtotal)} × ${price.taxRate}%
         = <strong>${formatPrice(price.tax)}</strong></p>
      <p style="border-top:1px solid var(--clr-border);margin-top:var(--sp-2);padding-top:var(--sp-2);">
        Total&nbsp;&nbsp;&nbsp;&nbsp; = ${formatPrice(price.subtotal)} + ${formatPrice(price.tax)}
         = <strong style="color:var(--clr-primary)">${formatPrice(price.totalPrice)}</strong>
      </p>
    </div>` : ""}

    <!-- Trust badges -->
    <div class="summary-trust">
      <div class="trust-item">
        <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
        Secure payment – data is protected
      </div>
      <div class="trust-item">
        <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
        Free cancellation on most bookings
      </div>
      <div class="trust-item">
        <i class="fa-solid fa-headset" aria-hidden="true"></i>
        24/7 customer support
      </div>
    </div>
  `;
}


/* ================================================================
   PART 14 — HELPER FUNCTIONS
================================================================ */

/* Returns the currently selected hotel object from data.js */
function getSelectedHotel() {
  var hotelId = hotelSelect.value;
  if (!hotelId) return null;
  return getHotelById(hotelId);
}

/* Calculate number of nights between check-in and check-out */

/* ================================================================
   DATE SYSTEM — full implementation
   ================================================================

   THREE PUBLIC FUNCTIONS:
   ─────────────────────────────────────────────────────────────
   handleCheckinChange()  → called when check-in date changes
   updateNightsBadge()    → called when either date changes
   calculateNights()      → pure calculation, returns a number
   ─────────────────────────────────────────────────────────────


   ════════════════════════════════════════════════════════
   HOW JAVASCRIPT DATE OBJECTS WORK  (beginner explanation)
   ════════════════════════════════════════════════════════

   Think of a Date object like a stopwatch that started ticking
   on 1 January 1970 at midnight. Every millisecond that passes
   adds 1 to a hidden counter.

   new Date()
   → reads the counter right now
   → "It is 1,761,955,200,000 ms since 1 Jan 1970"
   → that number represents a specific date and time

   new Date("2026-11-01")
   → converts the string "2026-11-01" to that counter number

   WHY IS THIS USEFUL?
   You can SUBTRACT two counters to get a time difference:
     checkout - checkin = gap in milliseconds
     gap ÷ 86,400,000   = gap in days (nights)

   That's literally all date arithmetic is in JavaScript.


   ════════════════════════════════════════════════════════
   THE "TODAY" PROBLEM
   ════════════════════════════════════════════════════════

   new Date() includes the current TIME (e.g. 14:35:22).
   new Date("2026-10-03") defaults to midnight (00:00:00).

   If today is 2026-10-03 at 14:35:
     new Date()              → Oct 3 at 14:35  (1761994522000 ms)
     new Date("2026-10-03")  → Oct 3 at 00:00  (1761955200000 ms)

   Comparing them: today (14:35) > "today" (00:00)
   → The user's check-in of today would appear to be in the "past"!

   FIX: strip the time from today before comparing:
     today.setHours(0, 0, 0, 0)
   Now today = Oct 3 at 00:00 = same reference point as the input.

   ════════════════════════════════════════════════════════ */


/* ── HANDLE CHECK-IN CHANGE ────────────────────────────────────
   When the user picks a new check-in date:
   1. Validate: is it today or later?
   2. Push check-out minimum to at least 1 day after check-in
   3. If current check-out is now invalid, auto-fix it
   4. Re-validate check-out
   5. Update the nights badge
────────────────────────────────────────────────────────────── */
function handleCheckinChange() {

  /* Step 1: validate check-in field */
  validateField(checkinInput);
  if (!checkinInput.value) {
    hideDateBanner();
    return;
  }

  /* Step 2: compute the minimum allowed check-out date
             (= check-in + 1 day)

     new Date(checkinInput.value)
     → e.g. "2026-11-01" → Date object for 1 Nov 2026 00:00

     .setDate(.getDate() + 1)
     → adds 1 day: now points to 2 Nov 2026 00:00
     → JS handles month rollover: Jan 31 + 1 = Feb 1 ✓  */
  var checkinDate  = new Date(checkinInput.value);
  var minCheckout  = new Date(checkinDate);
  minCheckout.setDate(checkinDate.getDate() + 1);

  /* Step 3: format as "YYYY-MM-DD" for the input's min attribute */
  var minCheckoutStr = minCheckout.toISOString().split("T")[0];
  checkoutInput.min  = minCheckoutStr;

  /* Step 4: if the current check-out is now BEFORE the new minimum,
             automatically advance it by 1 day so the form stays valid.
             We never leave the user in an impossible state. */
  if (checkoutInput.value && checkoutInput.value <= checkinInput.value) {
    checkoutInput.value = minCheckoutStr;
    /* Show green tick — we auto-fixed it for them */
    showSuccess(checkoutInput);
  }

  /* Step 5: re-validate check-out (its constraints just changed) */
  if (checkoutInput.value) {
    validateField(checkoutInput);
  }

  /* Step 6: refresh the nights badge */
  updateNightsBadge();
}


/* ── UPDATE NIGHTS BADGE ───────────────────────────────────────
   Reads both date inputs, calculates nights, and updates the
   green badge showing "3 Nights" between the date fields.

   STATES:
   • Both empty     → hide the badge entirely
   • Invalid dates  → show red error banner, hide badge
   • Valid dates    → show badge with "X Night(s)" + date range
────────────────────────────────────────────────────────────── */
function updateNightsBadge() {

  var nightsBadge     = document.getElementById("nightsBadge");
  var nightsCount     = document.getElementById("nightsCount");
  var nightsDateRange = document.getElementById("nightsDateRange");
  var nightsPriceNote = document.getElementById("nightsPriceNote");
  var datesErrorBanner= document.getElementById("datesErrorBanner");
  var datesErrorText  = document.getElementById("datesErrorText");

  /* Safety: if HTML elements don't exist, do nothing */
  if (!nightsBadge || !nightsCount) return;

  var checkinVal  = checkinInput.value;
  var checkoutVal = checkoutInput.value;

  /* ── Case 1: one or both dates missing ── */
  if (!checkinVal || !checkoutVal) {
    hideDateBanner();
    nightsBadge.style.opacity       = "0";
    nightsBadge.style.transform     = "translateY(-6px)";
    nightsBadge.style.pointerEvents = "none";
    return;
  }

  /* ── Parse both values into Date objects ─────────────────────
     new Date("2026-11-01") creates a Date for 1 Nov 2026 00:00.
     We use these objects for comparisons and calculations.    */
  var today    = new Date();
  today.setHours(0, 0, 0, 0);   /* strip time — compare date only */

  var checkin  = new Date(checkinVal);
  var checkout = new Date(checkoutVal);

  /* ── Case 2: check-in is in the past ── */
  if (checkin < today) {
    showDateError("Check-in date cannot be in the past. Please select today or a future date.");
    nightsBadge.style.opacity = "0";
    return;
  }

  /* ── Case 3: checkout is not after checkin ── */
  if (checkout <= checkin) {
    showDateError("Check-out must be at least 1 day after check-in.");
    nightsBadge.style.opacity = "0";
    return;
  }

  /* ── Case 4: valid dates → calculate and display ─────────────
     Date arithmetic step by step:

       checkout.getTime()  → 1762214400000  (ms since epoch)
       checkin.getTime()   → 1761955200000  (ms since epoch)
       difference          →    259200000   ms

       259200000 ÷ 86400000 = 3 days = 3 nights
  ────────────────────────────────────────────────────────────── */
  hideDateBanner();

  var nights = calculateNights();   /* uses the same arithmetic */

  if (nights <= 0) {
    showDateError("Invalid date range. Check-out must be after check-in.");
    nightsBadge.style.opacity = "0";
    return;
  }

  /* ── Build the badge text ── */
  var nightLabel = nights + " Night" + (nights !== 1 ? "s" : "");
  nightsCount.textContent = nightLabel;

  /* Format dates for the subtitle: "01 Nov → 04 Nov 2026" */
  var opts = { day: "2-digit", month: "short" };
  var fromStr = checkin.toLocaleDateString("en-IN",  opts);
  var toStr   = checkout.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  nightsDateRange.textContent = fromStr + " → " + toStr;

  /* Per-night note if hotel is selected */
  var hotel = getSelectedHotel();
  if (hotel && nightsPriceNote) {
    var perNight = formatPrice(hotel.pricePerNight);
    nightsPriceNote.textContent = perNight + "/night";
  } else if (nightsPriceNote) {
    nightsPriceNote.textContent = "";
  }

  /* Show the badge with a smooth animation */
  nightsBadge.style.opacity       = "1";
  nightsBadge.style.transform     = "translateY(0)";
  nightsBadge.style.pointerEvents = "auto";
}


/* ── DATE ERROR BANNER helpers ─────────────────────────────── */
function showDateError(message) {
  var banner   = document.getElementById("datesErrorBanner");
  var textEl   = document.getElementById("datesErrorText");
  if (!banner) return;
  textEl.textContent  = message;
  banner.style.display = "flex";
}

function hideDateBanner() {
  var banner = document.getElementById("datesErrorBanner");
  if (banner) banner.style.display = "none";
}


/* ================================================================
   calculateNights() — pure date arithmetic
   ----------------------------------------------------------------
   Takes no arguments — reads the input values directly.
   Returns the number of nights as a whole integer.

   STEP-BY-STEP WALKTHROUGH:
   ─────────────────────────────────────────────────────────────
   Inputs: checkin = "2026-11-01",  checkout = "2026-11-04"

   1. new Date("2026-11-01")
      → Date object: 1 Nov 2026 00:00:00 UTC
      → .getTime() = 1761955200000 ms

   2. new Date("2026-11-04")
      → Date object: 4 Nov 2026 00:00:00 UTC
      → .getTime() = 1762214400000 ms

   3. Difference:
      1762214400000 - 1761955200000 = 259,200,000 ms

   4. Convert ms → days:
      One day = 24 hours × 60 min × 60 sec × 1000 ms
              = 86,400,000 ms

      259,200,000 ÷ 86,400,000 = 3.0 days = 3 nights ✓

   5. Math.round():
      Daylight Saving Time shifts clocks by 1 hour, making a
      3-day gap compute as 2.9583 days.
      Math.round(2.9583) = 3  ✓
      Math.floor(2.9583) = 2  ✗  (off by one!)

   6. Math.max(0, result):
      Guards against invalid inputs returning negative numbers.
================================================================ */
function calculateNights() {
  if (!checkinInput.value || !checkoutInput.value) return 0;

  /* Step 1: create Date objects from the string values */
  var checkin  = new Date(checkinInput.value);
  var checkout = new Date(checkoutInput.value);

  /* Step 2: get raw millisecond timestamps */
  var checkinMs  = checkin.getTime();
  var checkoutMs = checkout.getTime();

  /* Step 3: subtract → gap in milliseconds */
  var differenceMs = checkoutMs - checkinMs;

  /* Step 4: define how many ms are in one full day */
  var MILLISECONDS_IN_ONE_DAY = 1000   /* ms per second */
                               * 60   /* seconds per minute */
                               * 60   /* minutes per hour */
                               * 24;  /* hours per day */
  /* = 86,400,000 */

  /* Step 5: convert ms gap → number of days */
  var nights = Math.round(differenceMs / MILLISECONDS_IN_ONE_DAY);
  /*
    Example:
    differenceMs / MILLISECONDS_IN_ONE_DAY
    = 259200000 / 86400000
    = 3.0
    Math.round(3.0) = 3 nights ✓
  */

  /* Step 6: clamp — never return a negative number */
  return Math.max(0, nights);
}

/* Update the "X rooms available" hint below the rooms input */
function updateRoomsHint() {
  var hintEl = document.getElementById("rooms-hint");
  if (!hintEl) return;
  var hotel = getSelectedHotel();
  if (hotel) {
    hintEl.querySelector("span").textContent =
      hotel.availableRooms + " rooms available for this hotel.";
    roomsInput.max = hotel.availableRooms;
  } else {
    hintEl.querySelector("span").textContent = "";
  }
}


/* ================================================================
   BOOKING STORAGE MODULE
   ----------------------------------------------------------------
   A clean, reusable API for all LocalStorage operations.

   ════════════════════════════════════════════════════════════════
   WHAT IS LOCALSTORAGE? (Simple explanation)
   ════════════════════════════════════════════════════════════════

   LocalStorage is a KEY → VALUE store built into every browser.
   Think of it like a small dictionary/notepad that stays saved
   even after the user closes and reopens the browser.

   KEYS and VALUES are always STRINGS.

   Analogy:
   ┌──────────────────┬───────────────────────────────────────┐
   │  KEY (address)   │  VALUE (what's stored there)          │
   ├──────────────────┼───────────────────────────────────────┤
   │ "username"       │ "Rahul"                               │
   │ "lastVisit"      │ "2026-10-03"                          │
   │ "travelease_bkgs"│ "[{...booking1...},{...booking2...}]" │
   └──────────────────┴───────────────────────────────────────┘

   THE THREE CORE METHODS:
   ───────────────────────
   localStorage.setItem("key", "value")
   → Writes a value. Overwrites if key already exists.

   localStorage.getItem("key")
   → Reads the value. Returns null if key doesn't exist.

   localStorage.removeItem("key")
   → Deletes the key-value pair permanently.

   ════════════════════════════════════════════════════════════════
   WHY JSON.stringify() AND JSON.parse()?
   ════════════════════════════════════════════════════════════════

   LocalStorage can ONLY store strings. Our booking is an object:
     { bookingId: "TE-...", customerName: "Rahul", ... }

   You CANNOT store an object directly:
     localStorage.setItem("booking", myObject)
     → stores "[object Object]"  ← useless string ✗

   SOLUTION — JSON (JavaScript Object Notation):
     JSON.stringify(myObject)
     → converts the object to a string:
        '{"bookingId":"TE-20261003-7842","customerName":"Rahul",...}'
     → now it's a string → localStorage can store it ✓

     JSON.parse(storedString)
     → converts the string back to a JavaScript object:
        { bookingId: "TE-20261003-7842", customerName: "Rahul", ... }
     → now we can use .bookingId, .totalPrice etc. again ✓

   VISUAL:
     JavaScript Object  →  JSON.stringify()  →  String in LocalStorage
     String in LocalStorage  →  JSON.parse()  →  JavaScript Object

   ════════════════════════════════════════════════════════════════
   WHY AN ARRAY OF BOOKINGS?
   ════════════════════════════════════════════════════════════════

   A user might book multiple trips. We store ALL their bookings
   in ONE array under a single key. Each new booking is pushed
   onto the array, not overwritten.

     Key: "travelease_bookings"
     Value (stringified):
     [
       { bookingId: "TE-20261001-1234", hotel: "Taj Goa",  ... },
       { bookingId: "TE-20261003-7842", hotel: "ITC Chennai", ... }
     ]

   The most recent booking is always stored separately under
   "travelease_current_booking" so confirmation.html can find
   it instantly without parsing the full history.
================================================================ */

var BookingStorage = (function () {

  /* ── Storage keys ── */
  var HISTORY_KEY = "travelease_bookings";         /* all bookings array  */
  var CURRENT_KEY = "travelease_current_booking";  /* latest booking only */


  /* ================================================================
     save(booking)
     ─────────────────────────────────────────────────────────────
     Saves the booking in TWO places:
     1. The full history array (append to existing list)
     2. The "current booking" slot (overwrite — latest only)

     Steps:
       a) Read existing history array from LocalStorage (or [])
       b) Push the new booking onto the array
       c) Stringify the array and save it back
       d) Also save the booking alone under the current key
  ================================================================ */
  function save(booking) {

    /* ── Step a: read existing bookings array ─────────────────────
       localStorage.getItem() returns:
         • a string if the key exists  → we parse it with JSON.parse
         • null if the key never existed → we use [] as fallback
    ────────────────────────────────────────────────────────────── */
    var existingRaw = localStorage.getItem(HISTORY_KEY);
    /*
      existingRaw is either:
        null                                  (first ever booking)
        '[{"bookingId":"TE-..."},...]'         (previous bookings exist)
    */

    var history = [];
    if (existingRaw !== null) {
      try {
        /*
          JSON.parse(existingRaw)
          → converts the stored string back into a JavaScript array.
          We wrap in try/catch in case the stored data is somehow
          corrupted — we don't want the whole page to crash.
        */
        history = JSON.parse(existingRaw);

        /* Safety: if somehow not an array, reset to empty array */
        if (!Array.isArray(history)) {
          history = [];
        }
      } catch (e) {
        /* Corrupted data — start fresh */
        console.warn("TravelEase: Could not parse booking history. Starting fresh.");
        history = [];
      }
    }

    /* ── Step b: add the new booking to the history ── */
    history.push(booking);
    /*
      history is now an array like:
      [
        { bookingId: "TE-20261001-1234", ... },   ← old booking
        { bookingId: "TE-20261003-7842", ... }    ← new booking just pushed
      ]
    */

    /* ── Step c: stringify and save the updated array ─────────────
       JSON.stringify(history)
       → converts the JavaScript array back to a string:
          '[{"bookingId":"TE-...","customerName":"Rahul",...},...]'

       localStorage.setItem(key, string)
       → writes it to the browser's storage
    ────────────────────────────────────────────────────────────── */
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      /*
        What gets stored in the browser:
        KEY   → "travelease_bookings"
        VALUE → '[{"bookingId":"TE-20261003-7842","customerName":"Rahul",...}]'
      */
    } catch (e) {
      /* LocalStorage can be full (quota exceeded ~5MB) */
      console.error("TravelEase: Could not save to LocalStorage.", e);
      return false;
    }

    /* ── Step d: also save as "current" booking ───────────────────
       confirmation.html reads JUST this key — much simpler
       than parsing the whole history and finding the last entry.
    ────────────────────────────────────────────────────────────── */
    try {
      localStorage.setItem(CURRENT_KEY, JSON.stringify(booking));
      /*
        What gets stored:
        KEY   → "travelease_current_booking"
        VALUE → '{"bookingId":"TE-20261003-7842","customerName":"Rahul",...}'
      */
    } catch (e) {
      console.error("TravelEase: Could not save current booking.", e);
      return false;
    }

    /* Log to console for learning purposes */
    console.group("✅ TravelEase — Booking Saved to LocalStorage");
    console.log("Booking ID  :", booking.bookingId);
    console.log("Customer    :", booking.customerName);
    console.log("Hotel       :", booking.hotel);
    console.log("Destination :", booking.destination);
    console.log("Check-in    :", booking.checkin);
    console.log("Check-out   :", booking.checkout);
    console.log("Nights      :", booking.nights);
    console.log("Guests      :", booking.guests);
    console.log("Rooms       :", booking.rooms);
    console.log("Total Price :", formatPrice(booking.totalPrice));
    console.log("Booked at   :", booking.bookingDate);
    console.log("─── Raw JSON saved ───");
    console.log(JSON.stringify(booking, null, 2));
    console.groupEnd();

    return true;
  }


  /* ================================================================
     getCurrent()
     ─────────────────────────────────────────────────────────────
     Retrieves the most recently saved booking.
     Used by: confirmation.html

     Returns: booking object, or null if nothing saved yet.
  ================================================================ */
  function getCurrent() {
    var raw = localStorage.getItem(CURRENT_KEY);
    /*
      raw is either:
        null                               → nothing saved yet
        '{"bookingId":"TE-...","hotel":…}' → a JSON string
    */

    if (raw === null) return null;

    try {
      /*
        JSON.parse(raw)
        → '{"bookingId":"TE-20261003-7842","customerName":"Rahul",...}'
        →  { bookingId: "TE-20261003-7842", customerName: "Rahul", ... }
        Now we can use booking.bookingId, booking.totalPrice etc.
      */
      return JSON.parse(raw);
    } catch (e) {
      console.warn("TravelEase: Could not parse current booking.");
      return null;
    }
  }


  /* ================================================================
     getHistory()
     ─────────────────────────────────────────────────────────────
     Returns ALL bookings ever made (as an array).
     Sorted newest-first.
  ================================================================ */
  function getHistory() {
    var raw = localStorage.getItem(HISTORY_KEY);
    if (raw === null) return [];

    try {
      var history = JSON.parse(raw);
      if (!Array.isArray(history)) return [];

      /* Sort newest first using bookingDate */
      return history.sort(function (a, b) {
        return new Date(b.bookingDate) - new Date(a.bookingDate);
      });
    } catch (e) {
      return [];
    }
  }


  /* ================================================================
     clearCurrent()
     ─────────────────────────────────────────────────────────────
     Removes only the "current" booking slot.
     Called after confirmation.html has displayed it, so a
     hard-refresh doesn't show a stale confirmation.
  ================================================================ */
  function clearCurrent() {
    localStorage.removeItem(CURRENT_KEY);
  }


  /* ================================================================
     clearAll()
     ─────────────────────────────────────────────────────────────
     Removes ALL TravelEase data from LocalStorage.
     Useful for testing / "reset app" functionality.
  ================================================================ */
  function clearAll() {
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(CURRENT_KEY);
    console.log("TravelEase: All booking data cleared from LocalStorage.");
  }


  /* ── Expose the public API ── */
  return {
    save         : save,
    getCurrent   : getCurrent,
    getHistory   : getHistory,
    clearCurrent : clearCurrent,
    clearAll     : clearAll
  };

})();   /* IIFE — runs immediately and returns the public methods */


/* ================================================================
   PART 15 — NAVBAR, SCROLL-TO-TOP, TOAST
================================================================ */

function initNavbar() {
  var hamburgerBtn = document.getElementById("hamburgerBtn");
  var navLinks     = document.getElementById("navLinks");
  var navbar       = document.querySelector(".navbar");

  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener("click", function () {
      const isOpen = navLinks.classList.toggle("is-open");
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
  if (!scrollTopBtn) return;
  window.addEventListener("scroll", function () {
    scrollTopBtn.classList.toggle("is-visible", window.scrollY > 400);
  }, { passive: true });
  scrollTopBtn.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

var toastTimer = null;
function showToast(message, type) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.className = "toast is-visible" + (type ? " toast--" + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toastEl.classList.remove("is-visible");
  }, 3500);
}
