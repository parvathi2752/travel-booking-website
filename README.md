# ✈️ TravelEase — Travel Booking Website

<div align="center">

![TravelEase Banner](https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&h=400&fit=crop&q=80)

**A fully responsive, feature-rich travel booking website built with pure HTML5, CSS3, and Vanilla JavaScript.**

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-222222?style=for-the-badge&logo=github&logoColor=white)](https://pages.github.com/)

[🌐 Live Demo](#) · [📁 Source Code](https://github.com/parvathi2752/travel-booking-website) · [🐛 Report Bug](https://github.com/parvathi2752/travel-booking-website/issues)

</div>

---

## 📌 Table of Contents

- [About the Project](#about-the-project)
- [Features](#features)
- [Screenshots](#screenshots)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [How to Run](#how-to-run)
- [JavaScript Concepts Used](#javascript-concepts-used)
- [Future Enhancements](#future-enhancements)
- [Author](#author)

---

## 📖 About the Project

**TravelEase** is a complete, multi-page travel booking website built entirely with **HTML5, CSS3, and Vanilla JavaScript** — no frameworks, no libraries, no backend.

It was built as a learning project to demonstrate real-world frontend development skills including DOM manipulation, form validation, LocalStorage, CSS variables, responsive design, and advanced UI features like dark mode, scroll animations, and image sliders.

> **Who is this for?** B.Tech / BCA students, beginner-to-intermediate developers learning frontend web development from scratch.

---

## ✨ Features

### 🏠 Homepage (`index.html`)
- Hero section with animated gradient background
- Destination search with live suggestions dropdown
- Popular destinations grid (6 destinations)
- Featured hotel cards with wishlist hearts
- "Why Choose Us" section with hover animations
- Newsletter subscription form with validation

### 🏨 Hotels Page (`hotels.html`)
- Full hotel listing (14 hotels across 6 Indian cities)
- **Real-time search** — case-insensitive, searches name + city + location
- **Filters:** Destination | Price Range (slider) | Category | Rating
- **Sort by:** Recommended | Price Low→High | Price High→Low | Rating | Name A–Z
- Active filter chips — removable tags showing applied filters
- Hotel detail modal popup with full info
- Mobile filter drawer

### 📋 Booking Page (`booking.html`)
- Complete booking form with 9 fields
- **Real-time form validation** with error messages
- Live booking summary sidebar — updates as you type
- **Price calculation:** `pricePerNight × rooms × nights + 5% tax`
- Check-in/check-out date picker with validation
- Live "3 Nights" badge between date fields
- Pre-fills hotel details from URL parameters

### ✅ Confirmation Page (`confirmation.html`)
- Booking confirmed hero animation
- Full printable receipt with all booking details
- Price breakdown table
- **Print / Download** via `window.print()`
- Booking history table

### 📚 My Bookings Page (`bookings.html`)
- All bookings listed from LocalStorage
- Filter by: All | Confirmed | Cancelled
- Booking stats chips (total / confirmed / cancelled count)
- **Cancel booking** — soft delete (keeps in history, status → "Cancelled")
- View full booking details in a modal
- Clear all history with double confirmation

### ❤️ Wishlist Page (`wishlist.html`)
- Save hotels with the heart button on any page
- Persisted in LocalStorage (survives page refresh)
- **View Hotel** modal | **Book Now** link | **Remove** button
- Clear entire wishlist with confirmation

### 🌙 Dark Mode
- Toggle button in every page's navbar
- Saves preference in LocalStorage
- Applied in `<head>` before page paint (no flash)
- Detects OS dark mode preference automatically

### 📱 Responsive Design
- Works on: 320px → 375px → 425px → 768px → 1024px → 1440px+
- Mobile hamburger menu with dark overlay
- Touch-friendly buttons (min 44px)
- iOS input zoom prevention (font-size: 16px)

### ⚡ Advanced Features
- Page loading animation (spinner + progress bar)
- Toast notification system (4 types: success, error, warning, info)
- Smooth scrolling with navbar offset
- Hotel image slider with touch/swipe support
- Search suggestions dropdown with keyboard navigation
- Scroll animations (IntersectionObserver)
- Back-to-top button with scroll progress ring
- Form shake animation on validation error

---

## 📸 Screenshots

> Open the project locally and take screenshots to add here.

| Page | Description |
|------|-------------|
| `index.html` | Homepage with hero search |
| `hotels.html` | Hotel listing with filters |
| `booking.html` | Booking form with live summary |
| `confirmation.html` | Booking receipt |
| `bookings.html` | My Bookings history |
| `wishlist.html` | Saved hotels wishlist |

*Add screenshots by placing `.png` files in `travel-booking/images/screenshots/` and referencing them here.*

---

## 🛠️ Technologies Used

| Technology | Purpose |
|------------|---------|
| **HTML5** | Semantic page structure (`<section>`, `<article>`, `<nav>`, `<main>`, `<footer>`) |
| **CSS3** | Styling, animations, responsive layout |
| **CSS Custom Properties** | Design tokens (colours, spacing, shadows) — dark mode without duplicating CSS |
| **CSS Grid** | 2D layouts: hotel grids, footer columns, booking form layout |
| **CSS Flexbox** | 1D layouts: navbar, card footers, button rows |
| **CSS Media Queries** | Responsive design at 6 breakpoints |
| **Vanilla JavaScript** | All interactivity — no frameworks |
| **DOM Manipulation** | Dynamic card rendering, form updates, modal popups |
| **LocalStorage** | Wishlist, bookings, dark mode preference |
| **JSON.stringify / parse** | Saving/reading objects in LocalStorage |
| **IntersectionObserver** | Scroll animations, lazy loading |
| **URLSearchParams** | Passing data between pages via URL |
| **Date API** | Date validation, night count calculation |
| **window.print()** | Print / PDF download for booking receipt |
| **Font Awesome 6** | Icons throughout the site |
| **Google Fonts** | Playfair Display (headings) + Inter (body) |

---

## 📁 Project Structure

```
travel-booking-website/
│
├── README.md                    ← This file
├── .gitignore
│
└── travel-booking/              ← Root of the website
    │
    ├── index.html               ← Homepage
    ├── hotels.html              ← Hotel listing + filters
    ├── booking.html             ← Booking form
    ├── confirmation.html        ← Booking receipt
    ├── bookings.html            ← My Bookings history
    ├── wishlist.html            ← Saved wishlist
    │
    ├── css/
    │   └── style.css            ← All styles (2800+ lines)
    │                              Includes dark mode, responsive,
    │                              animations, all components
    │
    ├── js/
    │   ├── data.js              ← Hotel + destination data (mini-DB)
    │   │                          14 hotels, 6 destinations
    │   │                          Helper functions: filter, sort, format
    │   │
    │   ├── main.js              ← Homepage logic
    │   │                          Renders destination + hotel cards
    │   │                          Hero search form → redirect to hotels.html
    │   │
    │   ├── hotels.js            ← Hotels page logic
    │   │                          Filter, sort, search, hotel detail modal
    │   │
    │   ├── booking.js           ← Booking form logic
    │   │                          Validation, price calc, LocalStorage save
    │   │
    │   ├── confirmation.js      ← Confirmation page logic
    │   │                          Reads LocalStorage, renders receipt
    │   │
    │   ├── bookings.js          ← My Bookings page logic
    │   │                          Cancel bookings, filter, history table
    │   │
    │   ├── wishlist.js          ← Shared wishlist module
    │   │                          WishlistManager (toggle, sync, persist)
    │   │
    │   ├── wishlist-page.js     ← Wishlist page logic
    │   │                          Renders wishlist grid, remove, clear
    │   │
    │   ├── theme.js             ← Dark/light mode
    │   │                          Applies theme before page paint
    │   │                          Reads OS preference, saves to LocalStorage
    │   │
    │   └── features.js          ← 12 advanced UI features
    │                              Loader, toasts, sliders, suggestions,
    │                              scroll animations, back-to-top, etc.
    │
    └── images/                  ← Place your images here
        └── (empty — project uses Unsplash CDN images)
```

---

## 🚀 How to Run

### Method 1 — Just open the file (simplest)
```
1. Download or clone this repository
2. Open the folder  travel-booking/
3. Double-click  index.html
4. It opens in your browser — done!
```

### Method 2 — VS Code Live Server (recommended)
```
1. Install VS Code: https://code.visualstudio.com/
2. Install the "Live Server" extension
3. Open the travel-booking-website/ folder in VS Code
4. Right-click index.html → "Open with Live Server"
5. Browser opens at http://127.0.0.1:5500/travel-booking/
```
> Live Server auto-refreshes on every file save — great for development.

### Method 3 — Python local server
```bash
# Navigate to the project folder
cd travel-booking-website/travel-booking

# Python 3
python -m http.server 8080

# Open http://localhost:8080 in your browser
```

### Method 4 — GitHub Pages (free hosting)
```
1. Push this project to GitHub (see Git commands below)
2. Go to your repository → Settings → Pages
3. Source: Deploy from branch → main → /root
4. Your site is live at:
   https://parvathi2752.github.io/travel-booking-website/travel-booking/
```

---

## 💡 JavaScript Concepts Used

This project demonstrates 20+ core JavaScript concepts, making it excellent for learning:

| Concept | Where used |
|---------|-----------|
| DOM Manipulation | Hotel cards, forms, modals |
| `addEventListener` | Every interactive element |
| `localStorage` + JSON | Bookings, wishlist, dark mode |
| Array `.filter()` | Hotel search and filters |
| Array `.map()` | Building card HTML |
| Array `.find()` | Getting hotel by ID |
| Array `.sort()` | Price/rating/name sorting |
| Template Literals | Building HTML strings |
| `Date` object | Night calculation, date validation |
| `URLSearchParams` | Passing hotel data between pages |
| `IntersectionObserver` | Scroll animations |
| `window.print()` | Print/PDF receipt |
| `window.confirm()` | Cancel/clear confirmations |
| Regex `.test()` | Email and phone validation |
| Event Delegation | Efficient event handling |
| Debouncing | Search input performance |
| IIFE | WishlistManager, ThemeManager modules |
| CSS Custom Properties + JS | Dark mode instant toggle |
| `requestAnimationFrame` | Smooth toast animations |
| Touch events | Image slider swipe support |

---

## 🔮 Future Enhancements

| Feature | Description |
|---------|-------------|
| 🔐 User Authentication | Login/signup with Firebase or JWT |
| 💳 Payment Integration | Razorpay or Stripe payment gateway |
| 🗺️ Map Integration | Google Maps for hotel locations |
| 🌐 Real Hotel API | Connect to RapidAPI Hotels API |
| 🔔 Push Notifications | Web Push API for booking reminders |
| 📧 Email Confirmation | EmailJS or backend email service |
| ⭐ Hotel Reviews | User review and rating system |
| 🔍 Advanced Filters | Amenities, distance, star rating |
| 📱 PWA | Progressive Web App with offline support |
| 🌍 Multi-language | i18n support (English, Hindi, Telugu) |
| 🖼️ Real Images | Hotel image gallery from actual APIs |
| 📊 Admin Dashboard | Manage hotels and bookings |

---

## 👤 Author

**Parvathi**

- 🎓 B.Tech CSE Student
- 🐙 GitHub: [@parvathi2752](https://github.com/parvathi2752)
- 📧 Email: *(add your email here)*

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

```
MIT License — free to use, modify, and distribute with attribution.
```

---

## 🙏 Acknowledgements

- [Unsplash](https://unsplash.com/) — Free high-quality hotel and destination photos
- [Font Awesome](https://fontawesome.com/) — Icon library
- [Google Fonts](https://fonts.google.com/) — Playfair Display + Inter typefaces
- [MDN Web Docs](https://developer.mozilla.org/) — JavaScript + CSS reference

---

<div align="center">

Made with ❤️ for travellers | Built with pure HTML, CSS & JavaScript

⭐ **Star this repository if you found it helpful!** ⭐

</div>
