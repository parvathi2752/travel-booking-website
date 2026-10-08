/* ================================================================
   TravelEase — wishlist.js
   Shared wishlist module. Loaded on every page that shows
   hotel cards (index.html, hotels.html, wishlist.html).

   WHAT THIS FILE DOES:
   1.  Reads / writes the wishlist array in LocalStorage
   2.  Provides a toggle function (add if absent, remove if present)
   3.  Syncs the visual heart state of every button on the page
   4.  Exposes a clean public API: WishlistManager

   CONCEPT: Why a shared module?
   ─────────────────────────────────────────────────────────────
   The heart button appears on THREE pages:
     • index.html (featured hotel cards)
     • hotels.html (full listing)
     • wishlist.html (the wishlist page itself)

   Instead of copying the same logic three times, we write it
   ONCE here and load this file on every page that needs it.
   This is the "Don't Repeat Yourself" (DRY) principle.
================================================================ */


/* ================================================================
   PART 1 — STORAGE KEY
================================================================ */
var WISHLIST_KEY = "travelease_wishlist";
/*
  LocalStorage entry will look like:
  KEY   → "travelease_wishlist"
  VALUE → '["taj-exotica-goa","leela-palace-bengaluru"]'
           ^ JSON-stringified array of hotel IDs (strings)
*/


/* ================================================================
   PART 2 — WISHLIST MANAGER (public API)
   ─────────────────────────────────────────────────────────────
   We wrap everything in an IIFE (Immediately Invoked Function
   Expression) that returns a plain object with public methods.

   CONCEPT: IIFE
   ─────────────────────────────────────────────────────────────
   var X = (function() {
     // private code here
     return { publicMethod: ... };
   })();

   The () at the end makes it run immediately.
   Code INSIDE is private (can't be accessed from outside).
   The returned object is what the rest of the app can use.

   This prevents our internal variables from polluting the
   global scope and accidentally clashing with other scripts.
================================================================ */
var WishlistManager = (function () {

  /* ================================================================
     read()
     ─────────────────────────────────────────────────────────────
     Returns the current wishlist as an array of hotel ID strings.

     CONCEPT: JSON.parse
     ─────────────────────────────────────────────────────────────
     LocalStorage stores only strings.
     Our wishlist is saved as:  '["taj-exotica-goa","kumarakom-lake-resort"]'

     JSON.parse(...)  converts that string → JavaScript array:
       ["taj-exotica-goa", "kumarakom-lake-resort"]

     If the key has never been set, getItem() returns null,
     so we return [] as a safe default.
  ================================================================ */
  function read() {
    var raw = localStorage.getItem(WISHLIST_KEY);
    if (raw === null) return [];
    try {
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }


  /* ================================================================
     write(array)
     ─────────────────────────────────────────────────────────────
     Saves the wishlist array back to LocalStorage.

     CONCEPT: JSON.stringify
     ─────────────────────────────────────────────────────────────
     JSON.stringify(["taj-exotica-goa", "leela-palace-bengaluru"])
     → '["taj-exotica-goa","leela-palace-bengaluru"]'

     Now it's a string → localStorage can store it.
  ================================================================ */
  function write(arr) {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error("TravelEase Wishlist: could not write to LocalStorage.", e);
    }
  }


  /* ================================================================
     contains(hotelId)
     ─────────────────────────────────────────────────────────────
     Returns true if the hotel is already in the wishlist.

     CONCEPT: Array.indexOf()
     ─────────────────────────────────────────────────────────────
     ["goa-hotel", "delhi-hotel"].indexOf("goa-hotel")  → 0  (found)
     ["goa-hotel", "delhi-hotel"].indexOf("kerala-hotel")→ -1 (not found)

     indexOf returns -1 when the item doesn't exist, so
     idx !== -1 means "it IS in the array".
  ================================================================ */
  function contains(hotelId) {
    return read().indexOf(hotelId) !== -1;
  }


  /* ================================================================
     toggle(hotelId)
     ─────────────────────────────────────────────────────────────
     If hotel IS in wishlist  → remove it (un-like)
     If hotel NOT in wishlist → add it   (like)

     Returns: true  = now in wishlist (just added)
              false = now removed     (just removed)

     CONCEPT: Array.filter() for removal
     ─────────────────────────────────────────────────────────────
     To remove an item from an array we use .filter() to keep
     everything EXCEPT the item we want to remove:

       ["a", "b", "c"].filter(x => x !== "b")
       → ["a", "c"]   ← "b" is gone ✓

     We never use .splice() here because .filter() creates a
     NEW array without mutating the original.
  ================================================================ */
  function toggle(hotelId) {
    var list = read();

    if (list.indexOf(hotelId) !== -1) {
      /* ── REMOVE: keep every id that is NOT this one ── */
      var updated = list.filter(function (id) {
        return id !== hotelId;
      });
      write(updated);
      return false;   /* removed → heart should be empty */

    } else {
      /* ── ADD: push this id onto the array ── */
      list.push(hotelId);
      write(list);
      return true;    /* added → heart should be filled */
    }
  }


  /* ================================================================
     getAll()
     ─────────────────────────────────────────────────────────────
     Returns the full array of hotel ID strings.
     Used by wishlist.html to know which hotels to display.
  ================================================================ */
  function getAll() {
    return read();
  }


  /* ================================================================
     count()
     ─────────────────────────────────────────────────────────────
     Returns how many hotels are saved.
     Used to update the nav badge / counter.
  ================================================================ */
  function count() {
    return read().length;
  }


  /* ================================================================
     clear()
     ─────────────────────────────────────────────────────────────
     Removes all saved hotels from the wishlist.
  ================================================================ */
  function clear() {
    localStorage.removeItem(WISHLIST_KEY);
  }


  /* ================================================================
     syncHearts()
     ─────────────────────────────────────────────────────────────
     Scans the page for ALL heart buttons ([data-wishlist-id])
     and updates their visual state to match LocalStorage.

     Called:
       • On page load   → so previously-liked hotels show filled hearts
       • After toggle() → so the clicked button updates immediately

     CONCEPT: querySelectorAll + forEach
     ─────────────────────────────────────────────────────────────
     document.querySelectorAll("[data-wishlist-id]")
     → returns a NodeList of every element with that attribute

     We loop through each one, check if its ID is in the wishlist,
     and add/remove the .is-liked CSS class accordingly.
  ================================================================ */
  function syncHearts() {
    var list    = read();
    var buttons = document.querySelectorAll("[data-wishlist-id]");

    buttons.forEach(function (btn) {
      var id    = btn.dataset.wishlistId;
      var liked = list.indexOf(id) !== -1;

      /* Update CSS class */
      btn.classList.toggle("is-liked", liked);

      /* Update the icon: solid heart (liked) vs outline (not liked) */
      var icon = btn.querySelector("i");
      if (icon) {
        icon.className = liked
          ? "fa-solid fa-heart"
          : "fa-regular fa-heart";
      }

      /* Update aria-label for screen readers */
      btn.setAttribute(
        "aria-label",
        liked ? "Remove from wishlist" : "Add to wishlist"
      );

      /* Update aria-pressed for accessibility */
      btn.setAttribute("aria-pressed", liked ? "true" : "false");
    });

    /* Update the wishlist counter badge in the navbar (if it exists) */
    updateNavBadge(list.length);
  }


  /* ================================================================
     updateNavBadge(count)
     ─────────────────────────────────────────────────────────────
     If the navbar has a wishlist link badge (#wishlistBadge),
     update its number and show/hide it.
  ================================================================ */
  function updateNavBadge(n) {
    var badge = document.getElementById("wishlistBadge");
    if (!badge) return;
    badge.textContent = n;
    badge.style.display = n > 0 ? "inline-flex" : "none";
  }


  /* ================================================================
     attachHeartListeners()
     ─────────────────────────────────────────────────────────────
     Wires up click listeners on ALL heart buttons on the page.
     Called once after cards are rendered.

     We use EVENT DELEGATION on each card's parent container
     rather than individual listeners — explained inline.
  ================================================================ */
  function attachHeartListeners() {
    /*
      CONCEPT: Event Delegation
      ─────────────────────────────────────────────────────────────
      Adding a listener to every single heart button is wasteful,
      especially when cards are re-rendered dynamically.

      Instead we listen on the DOCUMENT for click events and
      check if the clicked element is (or is inside) a heart button.

      e.target.closest("[data-wishlist-id]")
      → walks UP the DOM from the clicked element looking for
        the first ancestor that has [data-wishlist-id]
      → if found, that's our heart button
      → if not found (clicked elsewhere), returns null → we ignore it
    */
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-wishlist-id]");
      if (!btn) return;   /* clicked somewhere else → ignore */

      e.preventDefault();   /* don't follow any link */
      e.stopPropagation();  /* don't trigger parent card click */

      var hotelId = btn.dataset.wishlistId;
      var added   = toggle(hotelId);   /* add or remove */

      /*
        Immediately update this specific button before syncHearts()
        so the user sees instant feedback without waiting.
      */
      btn.classList.toggle("is-liked", added);
      var icon = btn.querySelector("i");
      if (icon) {
        icon.className = added ? "fa-solid fa-heart" : "fa-regular fa-heart";
      }
      btn.setAttribute("aria-pressed", added ? "true" : "false");
      btn.setAttribute("aria-label", added ? "Remove from wishlist" : "Add to wishlist");

      /* Sync all other hearts on the page (same hotel could appear twice) */
      syncHearts();

      /* Animate the heart button */
      btn.classList.add("heart-pop");
      setTimeout(function () { btn.classList.remove("heart-pop"); }, 400);

      /* Show a toast message */
      showWishlistToast(added);
    });
  }


  /* ================================================================
     showWishlistToast(added)
     ─────────────────────────────────────────────────────────────
     Shows a small popup at the bottom of the screen.
     Reuses the existing #toast element from the page.
  ================================================================ */
  function showWishlistToast(added) {
    var toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = added ? "❤️ Added to wishlist!" : "Removed from wishlist";
    toast.className   = "toast is-visible" + (added ? " toast--success" : "");
    clearTimeout(window._wishlistToastTimer);
    window._wishlistToastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2500);
  }


  /* ── expose the public API ── */
  return {
    toggle              : toggle,
    contains            : contains,
    getAll              : getAll,
    count               : count,
    clear               : clear,
    syncHearts          : syncHearts,
    attachHeartListeners: attachHeartListeners,
    updateNavBadge      : updateNavBadge
  };

})();


/* ================================================================
   PART 3 — HEART BUTTON ANIMATION (CSS injected via JS)
   ─────────────────────────────────────────────────────────────
   We inject a small <style> block for the pop animation.
   This keeps wishlist.js self-contained — no changes needed
   in style.css to get the animation working.
================================================================ */
(function injectHeartStyles() {
  var style = document.createElement("style");
  style.textContent = `
    /* Heart button base */
    [data-wishlist-id] {
      transition: transform 150ms ease, color 150ms ease !important;
    }

    /* Filled heart = liked */
    [data-wishlist-id].is-liked i {
      color: var(--clr-danger, #d93025) !important;
    }

    /* Pop animation when clicked */
    @keyframes heartPop {
      0%   { transform: scale(1);    }
      40%  { transform: scale(1.45); }
      70%  { transform: scale(0.88); }
      100% { transform: scale(1);    }
    }
    [data-wishlist-id].heart-pop {
      animation: heartPop 0.38s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

    /* Wishlist nav badge */
    .wishlist-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 9999px;
      background: var(--clr-danger, #d93025);
      color: white;
      font-size: 10px;
      font-weight: 700;
      margin-left: 4px;
      vertical-align: middle;
    }
  `;
  document.head.appendChild(style);
})();


/* ================================================================
   PART 4 — AUTO-INIT
   ─────────────────────────────────────────────────────────────
   When this script loads on any page, automatically:
   1. Attach the single document-level heart listener
   2. Sync hearts once the DOM is ready
================================================================ */
document.addEventListener("DOMContentLoaded", function () {
  WishlistManager.attachHeartListeners();
  WishlistManager.syncHearts();
});
