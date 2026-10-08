/* ================================================================
   TravelEase — hotels.js
   Powers the hotels.html listing page.

   WHAT THIS FILE DOES:
   1. Reads hotel data from data.js (hotels[], destinations[])
   2. Builds and renders hotel cards into the DOM
   3. Filters hotels by: destination, price, category, rating
   4. SEARCH: filters by name, destination, or location text
   5. Sorts hotels by: price (low/high), rating, name
   6. Shows "No hotels found" when nothing matches
   7. Shows active filter chips so user knows what's applied
   8. Handles navbar, scroll-to-top, and mobile filter drawer

   KEY CONCEPTS:
   • DOM Manipulation   – finding and updating HTML elements
   • forEach()          – looping over every item in an array
   • filter()           – narrowing an array to matching items
   • sort()             – reordering an array
   • .toLowerCase()     – makes search case-insensitive
   • .includes()        – checks if a string contains another
   • Event Listeners    – responding to user actions
   • Template literals  – building HTML with backtick strings
================================================================ */


/* ================================================================
   PART 1 — GRAB DOM ELEMENTS
   ----------------------------------------------------------------
   document.getElementById("someId") finds the HTML element
   that has id="someId" and returns a reference to it.

   We store each reference in a const variable so we can reuse
   it later without searching the DOM every single time.
   Searching the DOM is expensive — do it once, cache the result.
================================================================ */

const hotelsGrid         = document.getElementById("hotelsGrid");
const resultsCount       = document.getElementById("resultsCount");
const hotelSearchInput   = document.getElementById("hotelSearchInput");
const searchClearBtn     = document.getElementById("searchClearBtn");
const priceFilter        = document.getElementById("priceFilter");
const priceDisplay       = document.getElementById("priceDisplay");
const sortSelect         = document.getElementById("sortSelect");
const resetFiltersBtn    = document.getElementById("resetFiltersBtn");
const activeFiltersDiv   = document.getElementById("activeFilters");
const destinationFilters = document.getElementById("destinationFilters");
const filterToggleBtn    = document.getElementById("filterToggleBtn");
const filterOverlay      = document.getElementById("filterOverlay");
const filterDrawer       = document.getElementById("filterDrawer");
const filterDrawerClose  = document.getElementById("filterDrawerClose");
const hamburgerBtn       = document.getElementById("hamburgerBtn");
const navLinks           = document.getElementById("navLinks");
const scrollTopBtn       = document.getElementById("scrollTopBtn");
const toast              = document.getElementById("toast");
const currentYearSpan    = document.getElementById("currentYear");


/* ================================================================
   PART 2 — APPLICATION STATE
   ----------------------------------------------------------------
   STATE = the current values of all active filters.

   We keep all filter values in ONE object called "state".
   When any filter changes, we update state, then call
   renderHotels() which re-reads state and redraws everything.

   This is called "Single Source of Truth" — one place to look
   to know exactly what filters are currently active.
================================================================ */

const state = {
  searchQuery : "",        // text the user typed in the search box
  destination : "all",    // which destination button is active
  maxPrice    : 30000,    // maximum price from the slider
  category    : "all",    // Luxury / Premium / Budget / all
  minRating   : 0,        // minimum star rating
  sortBy      : "default" // how to sort the results
};


/* ================================================================
   PART 3 — INITIALISE
   ----------------------------------------------------------------
   init() is called once when the page has fully loaded.
   It builds the dynamic buttons, attaches all event listeners,
   and draws the hotel cards for the first time.
================================================================ */

function init() {
  // Set the current year in the footer automatically
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  // Check if user arrived via the homepage search form
  // e.g. hotels.html?destination=goa
  // If yes, pre-fill the destination filter
  handleUrlParams();

  buildDestinationButtons();   // create sidebar destination buttons
  updateCategoryButtonCounts(); // fill in (4), (6) etc. next to categories
  attachEventListeners();       // wire up all click/input handlers
  renderHotels();               // draw all hotels on first load
  setupScrollEffects();         // navbar shadow + scroll-to-top
}


/* ================================================================
   PART 4 — HANDLE URL PARAMETERS
   ----------------------------------------------------------------
   When the user searches on the homepage and clicks Search,
   we redirect them to:  hotels.html?destination=goa

   Here we read that URL parameter and pre-set the destination
   filter so the right hotels appear immediately.

   window.location.search   → "?destination=goa"
   new URLSearchParams(...) → lets us read individual params
   params.get("destination") → "goa"
================================================================ */

function handleUrlParams() {
  // window.location.search gives the "?..." part of the URL
  const params = new URLSearchParams(window.location.search);

  const destParam = params.get("destination");  // e.g. "goa"
  const queryParam = params.get("q");           // e.g. "beach resort"

  if (destParam) {
    // Check if this destination actually exists in our data
    const exists = destinations.some(function(d) {
      return d.id === destParam.toLowerCase();
    });

    if (exists) {
      state.destination = destParam.toLowerCase();
    }
  }

  if (queryParam) {
    state.searchQuery = queryParam.toLowerCase();
    // Also fill the search input box so user can see it
    if (hotelSearchInput) {
      hotelSearchInput.value = queryParam;
      if (searchClearBtn) searchClearBtn.classList.add("is-visible");
    }
  }
}


/* ================================================================
   PART 5 — BUILD DESTINATION FILTER BUTTONS
   ----------------------------------------------------------------
   We loop through destinations[] from data.js and create a
   <button> for each one. Clicking a button filters the hotels.

   forEach() runs a function once for every item in the array.

   Syntax:
     array.forEach(function(item) {
       // this runs once per item
     });
================================================================ */

function buildDestinationButtons() {
  if (!destinationFilters) return;  // safety check — element must exist

  // First button: "All Destinations"
  const allBtn = document.createElement("button");  // creates <button>
  allBtn.className = "filter-btn is-active";         // CSS class
  allBtn.dataset.destination = "all";                // data-destination="all"
  allBtn.setAttribute("aria-pressed", "true");
  allBtn.innerHTML = `
    <span>All Destinations</span>
    <span class="filter-btn__count">${hotels.length}</span>
  `;
  destinationFilters.appendChild(allBtn);  // adds to the page

  // One button for each destination (Goa, Delhi, etc.)
  destinations.forEach(function(dest) {

    // Count how many hotels belong to this destination
    const count = hotels.filter(function(h) {
      return h.destination === dest.id;
    }).length;

    // Mark as active if this destination was set via URL param
    const isActive = (state.destination === dest.id);

    const btn = document.createElement("button");
    btn.className = "filter-btn" + (isActive ? " is-active" : "");
    btn.dataset.destination = dest.id;
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    btn.innerHTML = `
      <span>${dest.name}</span>
      <span class="filter-btn__count">${count}</span>
    `;
    destinationFilters.appendChild(btn);
  });

  // If a destination was pre-selected, deactivate the "All" button
  if (state.destination !== "all") {
    allBtn.classList.remove("is-active");
    allBtn.setAttribute("aria-pressed", "false");
  }
}


/* ================================================================
   PART 6 — CATEGORY BUTTON COUNTS
   -----------------------------------------------
   Adds the number of hotels to each category button.
   e.g. "Luxury (5)"
================================================================ */

function updateCategoryButtonCounts() {
  document.querySelectorAll("[data-category]").forEach(function(btn) {
    const cat = btn.dataset.category;
    if (cat === "all") return;  // skip the "All" button

    const count = hotels.filter(function(h) {
      return h.category === cat;
    }).length;

    const countSpan = btn.querySelector(".filter-btn__count");
    if (countSpan) countSpan.textContent = count;
  });
}


/* ================================================================
   PART 7 — ATTACH EVENT LISTENERS
   ----------------------------------------------------------------
   An event listener waits for something to happen (a "event")
   and runs a function when it does.

   Syntax:
     element.addEventListener("eventName", function() {
       // runs when the event fires
     });

   Common events:
     "input"  → fires on every keystroke inside an <input>
     "click"  → fires when something is clicked
     "change" → fires when a <select> value changes
     "scroll" → fires when the page scrolls
================================================================ */

function attachEventListeners() {

  /* -------------------------------------------------------
     SEARCH INPUT
     -------------------------------------------------------
     "input" event fires on EVERY keystroke — so results
     update in real time as the user types. No need to hit
     Enter. This creates the "instant search" experience.
  ------------------------------------------------------- */
  hotelSearchInput.addEventListener("input", function() {
    // "this" refers to the input element itself
    // .trim() removes leading and trailing spaces
    // .toLowerCase() converts to lowercase for case-insensitive search
    state.searchQuery = this.value.trim().toLowerCase();

    // Show the × (clear) button only when there is text in the box
    // classList.toggle(className, condition)
    // → adds class if condition is true, removes it if false
    searchClearBtn.classList.toggle("is-visible", this.value.length > 0);

    renderHotels();  // re-filter and re-render
  });

  /* -------------------------------------------------------
     CLEAR SEARCH BUTTON (the × icon)
     -------------------------------------------------------
     When the user clicks ×, we wipe the input and re-render.
  ------------------------------------------------------- */
  searchClearBtn.addEventListener("click", function() {
    hotelSearchInput.value = "";    // clear the text box
    state.searchQuery = "";         // clear the state
    this.classList.remove("is-visible");  // hide the × button
    hotelSearchInput.focus();       // put cursor back in the box
    renderHotels();
  });

  /* -------------------------------------------------------
     KEYBOARD: pressing Enter in the search box
     -------------------------------------------------------
     Some users expect to press Enter to trigger search.
     We handle it here — though results already update live.
  ------------------------------------------------------- */
  hotelSearchInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      e.preventDefault();   // prevent any default form submission
      renderHotels();       // trigger render (same results, just confirms)
    }
  });

  /* -------------------------------------------------------
     PRICE RANGE SLIDER
     -------------------------------------------------------
     "input" fires continuously while the thumb is dragged.
     We update both the displayed value AND the state,
     then re-render so the hotel list updates live.
  ------------------------------------------------------- */
  priceFilter.addEventListener("input", function() {
    const val = parseInt(this.value);  // parseInt converts string → number
    state.maxPrice = val;

    // Update the "₹12,500" label above the slider
    priceDisplay.textContent = formatPrice(val);

    // Update the CSS --fill variable to colour the slider track
    const fillPercent = ((val / 30000) * 100);
    this.style.setProperty("--fill", fillPercent + "%");

    renderHotels();
  });

  /* -------------------------------------------------------
     DESTINATION FILTER BUTTONS
     -------------------------------------------------------
     CONCEPT: Event Delegation
     Instead of adding a listener to EVERY button, we add
     ONE listener to the parent container.

     When any button inside is clicked, the event "bubbles up"
     to the parent and we detect which button was clicked via
     e.target (the element the user actually clicked).

     This works even for buttons added dynamically later.
  ------------------------------------------------------- */
  destinationFilters.addEventListener("click", function(e) {
    // e.target = the element clicked
    // .closest(".filter-btn") = walk up the DOM to find the button
    // (handles clicks on child <span> elements inside the button)
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;  // click was outside any button — ignore

    // Remove "is-active" from ALL destination buttons
    document.querySelectorAll("[data-destination]").forEach(function(b) {
      b.classList.remove("is-active");
      b.setAttribute("aria-pressed", "false");
    });

    // Add "is-active" to the clicked button
    btn.classList.add("is-active");
    btn.setAttribute("aria-pressed", "true");

    // Store the selected destination in state
    // e.g. "goa" or "all"
    state.destination = btn.dataset.destination;

    renderHotels();
  });

  /* -------------------------------------------------------
     CATEGORY FILTER BUTTONS
  ------------------------------------------------------- */
  document.querySelectorAll("[data-category]").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll("[data-category]").forEach(function(b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      this.classList.add("is-active");
      this.setAttribute("aria-pressed", "true");
      state.category = this.dataset.category;
      renderHotels();
    });
  });

  /* -------------------------------------------------------
     RATING FILTER BUTTONS
  ------------------------------------------------------- */
  document.querySelectorAll("[data-min-rating]").forEach(function(btn) {
    btn.addEventListener("click", function() {
      document.querySelectorAll("[data-min-rating]").forEach(function(b) {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      this.classList.add("is-active");
      this.setAttribute("aria-pressed", "true");
      // parseFloat converts the string "4.5" → number 4.5
      state.minRating = parseFloat(this.dataset.minRating);
      renderHotels();
    });
  });

  /* -------------------------------------------------------
     SORT DROPDOWN
  ------------------------------------------------------- */
  sortSelect.addEventListener("change", function() {
    state.sortBy = this.value;
    renderHotels();
  });

  /* -------------------------------------------------------
     RESET ALL FILTERS BUTTON
  ------------------------------------------------------- */
  resetFiltersBtn.addEventListener("click", resetFilters);

  /* -------------------------------------------------------
     MOBILE FILTER DRAWER
  ------------------------------------------------------- */
  filterToggleBtn.addEventListener("click", openFilterDrawer);
  filterOverlay.addEventListener("click", function(e) {
    if (e.target === filterOverlay) closeFilterDrawer();
  });
  if (filterDrawerClose) {
    filterDrawerClose.addEventListener("click", closeFilterDrawer);
  }

  /* -------------------------------------------------------
     NAVBAR HAMBURGER
  ------------------------------------------------------- */
  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener("click", function() {
      const isOpen = navLinks.classList.toggle("is-open");
      this.classList.toggle("is-open", isOpen);
      this.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.addEventListener("click", function(e) {
      if (e.target.classList.contains("navbar__link")) {
        navLinks.classList.remove("is-open");
        hamburgerBtn.classList.remove("is-open");
        hamburgerBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
}


/* ================================================================
   PART 8 — THE SEARCH ENGINE
   ----------------------------------------------------------------
   This is the core of the destination search feature.

   It takes the raw text the user typed and returns TRUE if
   the hotel matches, or FALSE if it does not.

   We check three fields on each hotel:
     1. hotel.name        — "Taj Exotica Resort & Spa"
     2. hotel.destination — "goa"
     3. hotel.location    — "Benaulim Beach, South Goa"

   If the search query appears in ANY of these, the hotel matches.

   -----------------------------------------------
   CONCEPT: .toLowerCase()
   -----------------------------------------------
   "GOA".toLowerCase()  → "goa"
   "Goa".toLowerCase()  → "goa"
   "goa".toLowerCase()  → "goa"  (no change)

   By converting BOTH the query and the hotel field to lowercase
   before comparing, we guarantee case-insensitive matching.

   -----------------------------------------------
   CONCEPT: .includes()
   -----------------------------------------------
   "benaulim beach, south goa".includes("goa")  → true
   "city palace hotel, delhi".includes("goa")   → false
   "benaulim beach, south goa".includes("beach") → true

   .includes(searchText) checks whether searchText appears
   anywhere inside the string. Returns true or false.

   -----------------------------------------------
   CONCEPT: || (logical OR)
   -----------------------------------------------
   condition1 || condition2
   → true if EITHER condition1 OR condition2 is true

   So our match logic reads:
   "does name contain query?"  OR
   "does destination contain query?"  OR
   "does location contain query?"

   If any one of those is yes → the hotel is a match.
================================================================ */

function hotelMatchesSearch(hotel, query) {

  // If the search box is empty, every hotel is a match.
  // No need to check anything further.
  if (!query || query.length === 0) {
    return true;
  }

  // Step 1: convert the query to lowercase.
  // This means "GOA", "Goa", "goa" all become "goa".
  const q = query.toLowerCase();

  // Step 2: convert each hotel field to lowercase too.
  // Now both sides are lowercase — comparison is case-insensitive.
  const nameLC        = hotel.name.toLowerCase();
  const destinationLC = hotel.destination.toLowerCase();
  const locationLC    = hotel.location.toLowerCase();

  // Step 3: build a combined "search blob" by joining the three
  // fields. This lets one .includes() call cover everything.
  //
  // Example for Taj Exotica Goa:
  // "taj exotica resort & spa goa benaulim beach, south goa"
  //                           ^^^                      ^^^
  //                     destination matches!      location matches!
  const searchBlob = nameLC + " " + destinationLC + " " + locationLC;

  // Step 4: check if the query appears anywhere in the blob.
  // .includes() returns true/false.
  return searchBlob.includes(q);

  /*
    EXAMPLES:
    query = "goa"
      blob = "taj exotica resort & spa goa benaulim beach, south goa"
      blob.includes("goa") → TRUE  ✓

    query = "GOA" (but q = "goa" after toLowerCase)
      blob = "... goa ..."
      blob.includes("goa") → TRUE  ✓

    query = "delhi"
      blob = "taj exotica resort & spa goa benaulim beach, south goa"
      blob.includes("delhi") → FALSE  ✗  (correct — this is a Goa hotel)

    query = "beach"
      blob = "... benaulim beach, south goa"
      blob.includes("beach") → TRUE  ✓  (location match)

    query = "taj"
      blob = "taj exotica resort & spa ..."
      blob.includes("taj") → TRUE  ✓  (name match)
  */
}


/* ================================================================
   PART 9 — RENDER HOTELS
   ----------------------------------------------------------------
   Called every time any filter changes.
   Steps:
     1. Filter hotels[] using all active state values
     2. Sort the filtered results
     3. If 0 results → show "No hotels found"
     4. If 1+ results → build and inject hotel cards
================================================================ */

function renderHotels() {

  /* ─────────────────────────────────────────────────────────
     STEP 1: FILTER
     ─────────────────────────────────────────────────────────
     .filter() creates a NEW array containing only the hotels
     that pass ALL the tests inside the callback function.

     Each test returns true (keep) or false (remove).
     ALL tests must return true for a hotel to be included.
  ───────────────────────────────────────────────────────── */

  var result = hotels.filter(function(hotel) {

    /* TEST 1: SEARCH QUERY
       -----------------------------------------------
       We call our hotelMatchesSearch() function defined above.
       It returns true if the hotel name/destination/location
       contains the search text (case-insensitive).

       If it returns false → immediately return false from
       the filter callback, excluding this hotel.
    */
    if (!hotelMatchesSearch(hotel, state.searchQuery)) {
      return false;  // ← this hotel is excluded
    }

    /* TEST 2: DESTINATION FILTER
       -----------------------------------------------
       state.destination is "all" by default.
       If the user clicked a specific destination button
       (e.g. "Goa"), state.destination becomes "goa".

       hotel.destination stores the destination id: "goa",
       "hyderabad", "delhi", etc.

       We only filter when state.destination is NOT "all".
    */
    if (state.destination !== "all") {
      if (hotel.destination !== state.destination) {
        return false;  // wrong destination → exclude
      }
    }

    /* TEST 3: MAX PRICE
       -----------------------------------------------
       state.maxPrice starts at 30000 (show everything).
       If the user drags the slider left to 8000, we only
       keep hotels where pricePerNight ≤ 8000.
    */
    if (hotel.pricePerNight > state.maxPrice) {
      return false;  // too expensive → exclude
    }

    /* TEST 4: CATEGORY
       -----------------------------------------------
       state.category is "all" by default.
       If the user clicks "Luxury", only show Luxury hotels.
    */
    if (state.category !== "all") {
      if (hotel.category !== state.category) {
        return false;  // wrong category → exclude
      }
    }

    /* TEST 5: MINIMUM RATING
       -----------------------------------------------
       state.minRating is 0 by default (show all).
       If the user selects "4.5+", we exclude hotels
       with a rating below 4.5.
    */
    if (hotel.rating < state.minRating) {
      return false;  // rating too low → exclude
    }

    /*
      If ALL five tests passed (none returned false),
      we reach here and return true — hotel is included.
    */
    return true;
  });


  /* ─────────────────────────────────────────────────────────
     STEP 2: SORT
     ─────────────────────────────────────────────────────────
     .sort() reorders the array using a comparator function.
     The comparator receives two items (a, b) and must return:
       Negative number → a comes before b
       Positive number → b comes before a
       0               → order unchanged

     [...result] creates a shallow copy so we never modify
     the original hotels[] array from data.js.
  ───────────────────────────────────────────────────────── */

  result = [...result].sort(function(a, b) {

    if (state.sortBy === "price-low") {
      // a.price - b.price:
      // if a=2000, b=8000 → 2000-8000 = -6000 (negative) → a first
      // → ascending: cheapest first ✓
      return a.pricePerNight - b.pricePerNight;
    }

    if (state.sortBy === "price-high") {
      // b.price - a.price:
      // if a=2000, b=8000 → 8000-2000 = +6000 (positive) → b first
      // → descending: most expensive first ✓
      return b.pricePerNight - a.pricePerNight;
    }

    if (state.sortBy === "rating") {
      // b.rating - a.rating → highest rated first
      return b.rating - a.rating;
    }

    if (state.sortBy === "name") {
      // .localeCompare() handles alphabetical sorting correctly
      // including accented characters
      return a.name.localeCompare(b.name);
    }

    // Default sort: featured hotels first, then by rating
    // (b.isFeatured ? 1 : 0) converts true→1, false→0
    const featuredDiff = (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    if (featuredDiff !== 0) return featuredDiff;
    return b.rating - a.rating;
  });


  /* ─────────────────────────────────────────────────────────
     STEP 3: UPDATE RESULT COUNT
     ─────────────────────────────────────────────────────────
     Uses a ternary operator for "hotel" vs "hotels":
       condition ? valueIfTrue : valueIfFalse
       result.length !== 1 ? "hotels" : "hotel"
       → 0 hotels, 2 hotels, but 1 hotel (not "1 hotels")
  ───────────────────────────────────────────────────────── */

  resultsCount.innerHTML =
    "Showing <strong>" + result.length + "</strong> " +
    (result.length !== 1 ? "hotels" : "hotel") +
    (state.searchQuery ? " for <em>\"" + state.searchQuery + "\"</em>" : "");


  /* ─────────────────────────────────────────────────────────
     STEP 4: RENDER CARDS OR "NO RESULTS" MESSAGE
  ───────────────────────────────────────────────────────── */

  if (result.length === 0) {
    // No hotels matched → show the empty state
    hotelsGrid.innerHTML = buildEmptyState();
  } else {
    // Build all card HTML strings, join them, inject once
    // .map() transforms each hotel object → HTML string
    // .join("") merges the array of strings into one big string
    hotelsGrid.innerHTML = result.map(function(hotel) {
      return buildHotelCard(hotel);
    }).join("");

    // Wire up buttons on the newly created cards
    attachCardButtons();
  }

  // Update the filter chip row
  updateActiveFilterChips();
}


/* ================================================================
   PART 10 — "NO HOTELS FOUND" EMPTY STATE
   ----------------------------------------------------------------
   Shown when the filter + search combination has 0 results.

   We show:
   • A large icon (for visual feedback)
   • A heading "No hotels found"
   • The specific query that returned nothing
   • A "Reset Filters" button so the user can recover easily
================================================================ */

function buildEmptyState() {
  // Build a helpful message depending on what the user searched
  var message = "Try adjusting your search or filters.";

  if (state.searchQuery) {
    // Show what they searched for so they know we understood
    message = "No hotels match <strong>\"" + state.searchQuery + "\"</strong>. " +
              "Try a different spelling or destination name.";
  } else if (state.destination !== "all") {
    // They picked a destination but other filters narrowed to zero
    var dest = destinations.find(function(d) {
      return d.id === state.destination;
    });
    var destName = dest ? dest.name : state.destination;
    message = "No hotels in <strong>" + destName + "</strong> match your current filters. " +
              "Try increasing the price range or removing the rating filter.";
  }

  return `
    <div class="hotels-empty" role="status" aria-live="polite">

      <!-- Big icon for visual feedback -->
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true"
         style="font-size:3rem; color:var(--clr-border); margin-bottom:var(--sp-5);"></i>

      <h3 style="font-size:var(--fs-xl); color:var(--clr-text-heading); margin-bottom:var(--sp-3);">
        No hotels found
      </h3>

      <!-- Dynamic help message -->
      <p style="color:var(--clr-text-muted); font-size:var(--fs-base);
                max-width:400px; margin-inline:auto; line-height:1.7;">
        ${message}
      </p>

      <!-- Suggestions list -->
      <ul style="margin-top:var(--sp-5); color:var(--clr-text-muted);
                 font-size:var(--fs-sm); text-align:left; display:inline-block;">
        <li style="margin-bottom:var(--sp-2);">
          <i class="fa-solid fa-circle-info" style="color:var(--clr-primary);" aria-hidden="true"></i>
          &nbsp;Try: <strong>Goa</strong>, <strong>Delhi</strong>, <strong>Kerala</strong>
        </li>
        <li style="margin-bottom:var(--sp-2);">
          <i class="fa-solid fa-circle-info" style="color:var(--clr-primary);" aria-hidden="true"></i>
          &nbsp;Search is case-insensitive: "goa", "GOA", "Goa" all work
        </li>
        <li>
          <i class="fa-solid fa-circle-info" style="color:var(--clr-primary);" aria-hidden="true"></i>
          &nbsp;Try searching by area: "beach", "palace", "city"
        </li>
      </ul>

      <!-- Reset button so the user can recover easily -->
      <div style="margin-top:var(--sp-8);">
        <button
          class="btn btn--primary"
          onclick="resetFilters()"
          aria-label="Reset all filters and show all hotels"
        >
          <i class="fa-solid fa-rotate-left" aria-hidden="true"></i>
          Show All Hotels
        </button>
      </div>

    </div>
  `;
}


/* ================================================================
   PART 11 — BUILD A SINGLE HOTEL CARD HTML STRING
   ----------------------------------------------------------------
   CONCEPT: Template Literals
   -----------------------------------------------
   Template literals use backtick characters.
   ${expression} embeds a JavaScript value directly into the string.

   We build the entire card as one HTML string and return it.
   renderHotels() collects all these strings and sets
   hotelsGrid.innerHTML to all of them at once.
================================================================ */

function buildHotelCard(hotel) {
  // Calculate the discount percentage if originalPrice exists
  var discountPercent = hotel.originalPrice
    ? Math.round((1 - hotel.pricePerNight / hotel.originalPrice) * 100)
    : 0;

  // Choose colour based on room availability
  var roomsClass = hotel.availableRooms <= 5 ? "hotel-card__rooms--low" : "";

  // Build the availability text
  var roomsText = hotel.availableRooms <= 5
    ? `<i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i> Only ${hotel.availableRooms} rooms left!`
    : `<i class="fa-solid fa-circle-check" aria-hidden="true"></i> ${hotel.availableRooms} rooms available`;

  // Build amenity badges — show first 4 only
  var amenitiesHTML = hotel.amenities.slice(0, 4).map(function(a) {
    return `<span class="hotel-card__amenity">
              <i class="fa-solid fa-check" aria-hidden="true"></i>${a}
            </span>`;
  }).join("");

  // "+3 more" tag if hotel has more than 4 amenities
  var moreAmenities = hotel.amenities.length > 4
    ? `<span class="hotel-card__amenity" style="color:var(--clr-primary);">
         +${hotel.amenities.length - 4} more
       </span>`
    : "";

  // Original price (struck-through) if available
  var originalPriceHTML = hotel.originalPrice
    ? `<span style="font-size:var(--fs-xs);color:var(--clr-text-muted);
                    text-decoration:line-through;">
         ${formatPrice(hotel.originalPrice)}
       </span>`
    : "";

  // Discount badge on the image
  var discountBadge = discountPercent > 0
    ? `<span style="
         position:absolute; bottom:var(--sp-3); left:var(--sp-3);
         background:var(--clr-danger); color:white;
         font-size:var(--fs-xs); font-weight:700;
         padding:2px 8px; border-radius:var(--radius-full);">
         ${discountPercent}% OFF
       </span>`
    : "";

  return `
    <article class="hotel-card fade-up" role="listitem" data-hotel-id="${hotel.id}">

      <!-- LEFT: Hotel image -->
      <div class="hotel-card__image-wrap">
        <img
          src="${hotel.image}"
          alt="${hotel.name}, ${hotel.location}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'"
        />

        <!-- Category badge: Luxury / Premium / Budget -->
        <span class="badge hotel-card__badge">${hotel.category}</span>

        <!-- Save to wishlist (heart icon)
             data-wishlist-id is read by WishlistManager in wishlist.js
             to identify which hotel to add/remove. -->
        <button
          class="hotel-card__wishlist"
          data-wishlist-id="${hotel.id}"
          data-hotel-id="${hotel.id}"
          aria-label="Add ${hotel.name} to wishlist"
          aria-pressed="false"
        >
          <i class="fa-regular fa-heart" aria-hidden="true"></i>
        </button>

        ${discountBadge}
      </div>

      <!-- RIGHT: Hotel details -->
      <div class="hotel-card__body">

        <!-- Row 1: location + room availability -->
        <div style="display:flex; align-items:center;
                    justify-content:space-between; flex-wrap:wrap; gap:var(--sp-2);">

          <span class="hotel-card__location">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            ${hotel.location}
          </span>

          <span class="hotel-card__rooms ${roomsClass}">
            ${roomsText}
          </span>
        </div>

        <!-- Row 2: hotel name -->
        <h2 class="hotel-card__name">${hotel.name}</h2>

        <!-- Row 3: short description (max 2 lines via CSS) -->
        <p class="hotel-card__desc">${hotel.description}</p>

        <!-- Row 4: amenity icons -->
        <div class="hotel-card__amenities" aria-label="Amenities">
          ${amenitiesHTML}
          ${moreAmenities}
        </div>

        <!-- Row 5: footer — rating | price | buttons -->
        <div class="hotel-card__footer">

          <!-- Rating stars + score + review count -->
          <div class="hotel-card__meta">
            <span class="stars" aria-label="Rating ${hotel.rating} out of 5">
              ${generateStarHTML(hotel.rating)}
            </span>
            <span class="hotel-card__rating-score">${hotel.rating}</span>
            <span class="hotel-card__rating-label">
              (${hotel.reviewCount.toLocaleString("en-IN")} reviews)
            </span>
          </div>

          <!-- Price and action buttons -->
          <div style="display:flex; align-items:center; gap:var(--sp-5);">

            <!-- Price column -->
            <div class="hotel-card__price-wrap">
              ${originalPriceHTML}
              <span class="hotel-card__price">
                ${formatPrice(hotel.pricePerNight)}
              </span>
              <span class="hotel-card__price-sub">per night</span>
            </div>

            <!-- Action buttons -->
            <div class="hotel-card__actions">
              <button
                class="hotel-card__btn--details"
                data-hotel-id="${hotel.id}"
                aria-label="View details for ${hotel.name}"
              >
                Details
              </button>
              <a
                href="booking.html?hotel=${hotel.id}&destination=${hotel.destination}"
                class="hotel-card__btn"
                aria-label="Book ${hotel.name} now"
              >
                Book Now
              </a>
            </div>

          </div>
        </div>
        <!-- end footer -->

      </div>
      <!-- end body -->

    </article>
  `;
}


/* ================================================================
   PART 12 — ATTACH CARD BUTTON HANDLERS
   -----------------------------------------------
   Called after renderHotels() injects new cards.
   Hearts are handled globally by WishlistManager (wishlist.js).
   We only need to wire detail buttons + scroll reveal here.
================================================================ */

function attachCardButtons() {

  // Sync heart state with LocalStorage after cards are rendered
  // WishlistManager is defined in wishlist.js (loaded before this file)
  if (typeof WishlistManager !== "undefined") {
    WishlistManager.syncHearts();
  }

  // ---- VIEW DETAILS BUTTONS ----
  document.querySelectorAll(".hotel-card__btn--details").forEach(function(btn) {
    btn.addEventListener("click", function() {
      var hotel = getHotelById(this.dataset.hotelId);
      if (hotel) showHotelDetails(hotel);
    });
  });

  // ---- SCROLL REVEAL: observe newly rendered cards ----
  document.querySelectorAll(".hotel-card.fade-up").forEach(function(card, i) {
    card.style.transitionDelay = (i * 0.05) + "s";
    observer.observe(card);
  });
}


/* ================================================================
   PART 13 — ACTIVE FILTER CHIPS
   -----------------------------------------------
   Shows removable "chips" like [Goa ×] [Luxury ×] [4.5+ ×]
   so the user can see what is active and remove a specific one.
================================================================ */

function updateActiveFilterChips() {
  var chips = [];

  if (state.searchQuery) {
    chips.push({
      label: "\"" + state.searchQuery + "\"",
      clear: function() {
        hotelSearchInput.value = "";
        state.searchQuery = "";
        searchClearBtn.classList.remove("is-visible");
      }
    });
  }

  if (state.destination !== "all") {
    var dest = destinations.find(function(d) { return d.id === state.destination; });
    chips.push({
      label: dest ? dest.name : state.destination,
      clear: function() {
        state.destination = "all";
        syncButtonGroup("[data-destination]", "data-destination", "all");
      }
    });
  }

  if (state.maxPrice < 30000) {
    chips.push({
      label: "Max " + formatPrice(state.maxPrice),
      clear: function() {
        state.maxPrice = 30000;
        priceFilter.value = 30000;
        priceDisplay.textContent = "₹30,000";
        priceFilter.style.setProperty("--fill", "100%");
      }
    });
  }

  if (state.category !== "all") {
    chips.push({
      label: state.category,
      clear: function() {
        state.category = "all";
        syncButtonGroup("[data-category]", "data-category", "all");
      }
    });
  }

  if (state.minRating > 0) {
    chips.push({
      label: state.minRating + "+ Stars",
      clear: function() {
        state.minRating = 0;
        syncButtonGroup("[data-min-rating]", "data-min-rating", "0");
      }
    });
  }

  if (chips.length === 0) {
    activeFiltersDiv.innerHTML = "";
    return;
  }

  activeFiltersDiv.innerHTML = chips.map(function(chip, i) {
    return `<span class="filter-chip">
              ${chip.label}
              <button data-chip-index="${i}" aria-label="Remove ${chip.label} filter">×</button>
            </span>`;
  }).join("");

  activeFiltersDiv.querySelectorAll("button").forEach(function(btn) {
    btn.addEventListener("click", function() {
      chips[parseInt(this.dataset.chipIndex)].clear();
      renderHotels();
    });
  });
}

// Helper: reset a group of toggle buttons back to the default value
function syncButtonGroup(selector, attribute, defaultValue) {
  document.querySelectorAll(selector).forEach(function(b) {
    var isDefault = b.getAttribute(attribute) === defaultValue;
    b.classList.toggle("is-active", isDefault);
    b.setAttribute("aria-pressed", isDefault ? "true" : "false");
  });
}


/* ================================================================
   PART 14 — RESET FILTERS
================================================================ */

function resetFilters() {
  state.searchQuery = "";
  state.destination = "all";
  state.maxPrice    = 30000;
  state.category    = "all";
  state.minRating   = 0;
  state.sortBy      = "default";

  // Reset DOM elements
  if (hotelSearchInput) hotelSearchInput.value = "";
  if (searchClearBtn)   searchClearBtn.classList.remove("is-visible");
  if (priceFilter)      { priceFilter.value = 30000; priceFilter.style.setProperty("--fill", "100%"); }
  if (priceDisplay)     priceDisplay.textContent = "₹30,000";
  if (sortSelect)       sortSelect.value = "default";

  // Reset all button groups
  syncButtonGroup("[data-destination]", "data-destination", "all");
  syncButtonGroup("[data-category]",    "data-category",    "all");
  syncButtonGroup("[data-min-rating]",  "data-min-rating",  "0");

  renderHotels();
  showToast("All filters cleared", "");
}


/* ================================================================
   PART 15 — VIEW DETAILS MODAL
================================================================ */

function showHotelDetails(hotel) {
  var existing = document.getElementById("hotelModal");
  if (existing) existing.remove();

  var amenitiesHTML = hotel.amenities.map(function(a) {
    return `<li style="display:flex;align-items:center;gap:6px;
                        font-size:var(--fs-sm);color:var(--clr-text-body);">
              <i class="fa-solid fa-check"
                 style="color:var(--clr-primary);font-size:0.7rem;"
                 aria-hidden="true"></i>
              ${a}
            </li>`;
  }).join("");

  var modal = document.createElement("div");
  modal.id = "hotelModal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", hotel.name + " details");
  modal.style.cssText = [
    "position:fixed", "inset:0", "z-index:2000",
    "background:rgba(0,0,0,0.65)", "backdrop-filter:blur(6px)",
    "display:flex", "align-items:center", "justify-content:center",
    "padding:var(--sp-4)"
  ].join(";");

  modal.innerHTML = `
    <div style="background:var(--clr-white);border-radius:var(--radius-xl);
                max-width:580px;width:100%;max-height:90vh;overflow-y:auto;position:relative;">

      <div style="position:relative;height:240px;overflow:hidden;
                  border-radius:var(--radius-xl) var(--radius-xl) 0 0;">
        <img src="${hotel.image}" alt="${hotel.name}"
             style="width:100%;height:100%;object-fit:cover;"
             onerror="this.src='https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'" />
        <div style="position:absolute;inset:0;
                    background:linear-gradient(to top,rgba(0,0,0,0.55),transparent);"></div>
        <p style="position:absolute;bottom:var(--sp-4);left:var(--sp-5);
                  color:white;font-family:var(--ff-heading);
                  font-size:var(--fs-xl);font-weight:700;">${hotel.name}</p>
        <button onclick="document.getElementById('hotelModal').remove()"
                aria-label="Close"
                style="position:absolute;top:var(--sp-3);right:var(--sp-3);
                       width:36px;height:36px;border-radius:50%;
                       background:rgba(0,0,0,0.5);color:white;border:none;
                       cursor:pointer;font-size:var(--fs-md);
                       display:flex;align-items:center;justify-content:center;">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>

      <div style="padding:var(--sp-6);">
        <div style="display:flex;justify-content:space-between;
                    align-items:flex-start;margin-bottom:var(--sp-4);flex-wrap:wrap;gap:var(--sp-3);">
          <div>
            <p style="display:flex;align-items:center;gap:var(--sp-1);
                      font-size:var(--fs-sm);color:var(--clr-primary);
                      font-weight:700;margin-bottom:var(--sp-1);">
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
            ${hotel.originalPrice
              ? `<p style="font-size:var(--fs-sm);color:var(--clr-text-muted);
                           text-decoration:line-through;">
                   ${formatPrice(hotel.originalPrice)}
                 </p>`
              : ""}
            <p style="font-size:var(--fs-2xl);font-weight:800;
                      color:var(--clr-text-heading);">${formatPrice(hotel.pricePerNight)}</p>
            <p style="font-size:var(--fs-xs);color:var(--clr-text-muted);">per night</p>
          </div>
        </div>

        <p style="color:var(--clr-text-body);line-height:1.75;
                  margin-bottom:var(--sp-5);">${hotel.description}</p>

        <h3 style="font-size:var(--fs-base);font-weight:700;
                   color:var(--clr-text-heading);margin-bottom:var(--sp-3);">Amenities</h3>
        <ul style="display:grid;grid-template-columns:1fr 1fr;
                   gap:var(--sp-2);margin-bottom:var(--sp-6);">
          ${amenitiesHTML}
        </ul>

        <div style="display:flex;gap:var(--sp-3);align-items:center;">
          <a href="booking.html?hotel=${hotel.id}&destination=${hotel.destination}"
             class="btn btn--primary btn--lg"
             style="flex:1;justify-content:center;">
            Book Now – ${formatPrice(hotel.pricePerNight)}/night
          </a>
          <button onclick="document.getElementById('hotelModal').remove()"
                  class="btn btn--outline">Close</button>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  modal.addEventListener("click", function(e) {
    if (e.target === modal) modal.remove();
  });

  document.addEventListener("keydown", function closeOnEsc(e) {
    if (e.key === "Escape") {
      modal.remove();
      document.removeEventListener("keydown", closeOnEsc);
    }
  });
}


/* ================================================================
   PART 16 — MOBILE FILTER DRAWER
================================================================ */

function openFilterDrawer() {
  var sidebar = document.getElementById("filterSidebar");
  if (sidebar && filterDrawer) {
    filterDrawer.innerHTML = "";
    var clone = sidebar.cloneNode(true);
    clone.removeAttribute("id");
    clone.style.cssText = "position:static;border:none;box-shadow:none;border-radius:0;";
    filterDrawer.appendChild(clone);

    var closeBtn = document.createElement("button");
    closeBtn.setAttribute("aria-label", "Close filters");
    closeBtn.style.cssText = "position:absolute;top:var(--sp-4);right:var(--sp-4);" +
      "background:none;border:none;font-size:var(--fs-xl);color:var(--clr-text-muted);cursor:pointer;";
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    closeBtn.addEventListener("click", closeFilterDrawer);
    filterDrawer.insertBefore(closeBtn, filterDrawer.firstChild);
  }

  filterOverlay.style.display = "block";
  requestAnimationFrame(function() {
    filterOverlay.classList.add("is-open");
  });
  filterToggleBtn.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeFilterDrawer() {
  filterOverlay.classList.remove("is-open");
  filterToggleBtn.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  setTimeout(function() {
    filterOverlay.style.display = "none";
  }, 400);
}


/* ================================================================
   PART 17 — SCROLL EFFECTS + IntersectionObserver
================================================================ */

var observer = new IntersectionObserver(
  function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 }
);

function setupScrollEffects() {
  var navbar = document.querySelector(".navbar");

  window.addEventListener("scroll", function() {
    if (navbar)       navbar.classList.toggle("navbar--scrolled", window.scrollY > 10);
    if (scrollTopBtn) scrollTopBtn.classList.toggle("is-visible", window.scrollY > 400);
  }, { passive: true });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", function() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
}


/* ================================================================
   PART 18 — TOAST NOTIFICATION
================================================================ */

var toastTimer = null;

function showToast(message, type) {
  if (!toast) return;
  toast.textContent = message;
  toast.className = "toast is-visible" + (type ? " toast--" + type : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toast.classList.remove("is-visible");
  }, 3000);
}


/* ================================================================
   START
================================================================ */

document.addEventListener("DOMContentLoaded", init);
