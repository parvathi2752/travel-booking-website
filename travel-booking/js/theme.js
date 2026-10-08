/* ================================================================
   TravelEase — theme.js
   Dark / Light mode toggle with LocalStorage persistence.
   Loaded in the <head> of every page (before body renders).

   ════════════════════════════════════════════════════════════════
   HOW CSS VARIABLES + JAVASCRIPT WORK TOGETHER
   ════════════════════════════════════════════════════════════════

   STEP 1 — CSS defines two palettes using custom properties:

     :root {
       --clr-bg: #f5f7fa;     ← used everywhere in the stylesheet
       --clr-text: #0f172a;
     }

     [data-theme="dark"] {
       --clr-bg: #0f172a;     ← overrides when dark mode is on
       --clr-text: #f1f5f9;
     }

   Every rule in style.css uses  var(--clr-bg), var(--clr-text)
   etc., NOT hard-coded hex values.

   STEP 2 — JavaScript changes ONE attribute on <html>:

     document.documentElement.setAttribute("data-theme", "dark")

   document.documentElement  is the <html> element.
   setAttribute("data-theme", "dark") adds  data-theme="dark"  to it.

   Result:
     <html data-theme="dark">   ← [data-theme="dark"] CSS fires
     <html>                     ← :root CSS fires (light mode)

   STEP 3 — The browser re-resolves every  var()  reference.
   Because all components use CSS variables, the ENTIRE page
   recolours with zero extra CSS rules duplicated.

   ════════════════════════════════════════════════════════════════
   LOCALSTORAGE PERSISTENCE
   ════════════════════════════════════════════════════════════════

   We save the user's choice to LocalStorage:
     localStorage.setItem("travelease_theme", "dark")

   On the NEXT page load, we read it back immediately in the
   <head> (before the page paints) so there is NO flash of the
   wrong theme between page loads.

   ════════════════════════════════════════════════════════════════
   WHY LOAD IN <head>?
   ════════════════════════════════════════════════════════════════

   If we loaded this script at the bottom of <body> (like our
   other scripts), the browser would first paint the page in
   light mode, THEN switch to dark — causing an ugly white flash.

   Loading in <head> means the theme is applied BEFORE the first
   paint, so the user never sees the wrong theme.
================================================================ */


/* ================================================================
   PART 1 — APPLY THEME IMMEDIATELY (before page paints)
   ─────────────────────────────────────────────────────────────
   This runs synchronously as soon as the browser reads the
   <script> tag in <head>.  No DOMContentLoaded needed here —
   we only touch document.documentElement which exists instantly.
================================================================ */
(function applyThemeImmediately() {

  /* Step 1: read saved preference from LocalStorage
     localStorage.getItem() returns:
       "dark"  → user previously chose dark mode
       "light" → user previously chose light mode
       null    → first visit, no preference saved yet
  */
  var saved = localStorage.getItem("travelease_theme");

  /*
    Step 2: if no saved preference, check the operating system
    preference using the CSS media query:
      window.matchMedia("(prefers-color-scheme: dark)").matches
      → true  if the OS is in dark mode
      → false if the OS is in light mode

    This gives new users the right theme without any setting.
  */
  var prefersDark = window.matchMedia &&
                    window.matchMedia("(prefers-color-scheme: dark)").matches;

  /*
    Step 3: decide which theme to apply:
      saved === "dark"                → dark
      saved === "light"               → light  (explicit user choice)
      saved === null && OS dark       → dark   (match OS default)
      saved === null && OS light      → light  (match OS default)
  */
  var theme = saved ? saved : (prefersDark ? "dark" : "light");

  /*
    Step 4: apply the theme attribute to <html>.
    If theme is "dark":
      <html data-theme="dark">
    If theme is "light" (or default):
      <html>   (no attribute needed — :root handles light mode)
  */
  if (theme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }

})();
/* The IIFE above runs IMMEDIATELY — before any HTML is painted. */


/* ================================================================
   PART 2 — THEME MANAGER (public API)
   ─────────────────────────────────────────────────────────────
   These functions are called by the toggle button.
   We expose them as a global  ThemeManager  object.
================================================================ */
var ThemeManager = (function () {

  var STORAGE_KEY = "travelease_theme";


  /* ── isDark(): is dark mode currently on? ── */
  function isDark() {
    /*
      document.documentElement.getAttribute("data-theme")
      → "dark"  if dark mode is on
      → null    if attribute is absent (light mode)
    */
    return document.documentElement.getAttribute("data-theme") === "dark";
  }


  /* ── setTheme(theme): apply "dark" or "light" ── */
  function setTheme(theme) {

    if (theme === "dark") {
      /*
        Adding the attribute causes the browser to match
        [data-theme="dark"] in style.css, overriding :root variables.
        Result: all  var(--clr-*)  values update instantly.
      */
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      /*
        Removing the attribute means no [data-theme] selector matches.
        The browser falls back to :root variables → light mode.
      */
      document.documentElement.removeAttribute("data-theme");
    }

    /*
      Persist the choice so the next page load / next visit
      starts with the correct theme.
      JSON.stringify is not needed here — "dark" / "light"
      are plain strings, not objects.
    */
    localStorage.setItem(STORAGE_KEY, theme);

    /* Update all toggle buttons on this page */
    updateAllButtons(theme);
  }


  /* ── toggle(): flip between dark and light ── */
  function toggle() {
    var newTheme = isDark() ? "light" : "dark";
    setTheme(newTheme);
    return newTheme;
  }


  /* ── updateAllButtons(theme): sync every button's icon + label ──
     There can be multiple toggle buttons across the page
     (desktop navbar and mobile menu). We update all of them.
  */
  function updateAllButtons(theme) {
    var buttons = document.querySelectorAll(".theme-toggle");

    buttons.forEach(function (btn) {
      var icon = btn.querySelector(".theme-toggle__icon");
      if (!icon) return;

      if (theme === "dark") {
        /*
          In dark mode: show the SUN icon so the user knows
          "clicking this will bring back the light".
        */
        icon.innerHTML = '<i class="fa-solid fa-sun" aria-hidden="true"></i>';
        btn.setAttribute("aria-label", "Switch to light mode");
        btn.setAttribute("title",      "Switch to light mode");
      } else {
        /*
          In light mode: show the MOON icon so the user knows
          "clicking this will activate dark mode".
        */
        icon.innerHTML = '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
        btn.setAttribute("aria-label", "Switch to dark mode");
        btn.setAttribute("title",      "Switch to dark mode");
      }
    });
  }


  /* ── init(): wire up toggle buttons once DOM is ready ── */
  function init() {
    /* Sync button icons to match the currently active theme */
    updateAllButtons(isDark() ? "dark" : "light");

    /* Attach click handler to every toggle button */
    document.querySelectorAll(".theme-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {

        /* Spin animation — gives tactile feedback */
        btn.classList.add("is-spinning");
        setTimeout(function () {
          btn.classList.remove("is-spinning");
        }, 500);

        /* Toggle the theme */
        toggle();
      });
    });

    /*
      Listen for OS-level theme changes.
      If the user switches their OS from light to dark while
      the page is open AND they haven't manually set a preference,
      we follow the OS change.
    */
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", function (e) {
          /* Only follow OS if user hasn't made a manual choice */
          var hasManualChoice = localStorage.getItem(STORAGE_KEY);
          if (!hasManualChoice) {
            setTheme(e.matches ? "dark" : "light");
          }
        });
    }
  }


  /* Expose public API */
  return {
    init      : init,
    toggle    : toggle,
    setTheme  : setTheme,
    isDark    : isDark
  };

})();


/* ================================================================
   PART 3 — AUTO-INIT when DOM is ready
================================================================ */
document.addEventListener("DOMContentLoaded", function () {
  ThemeManager.init();
});
