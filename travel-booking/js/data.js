/* ================================================================
   TravelEase — data.js
   ----------------------------------------------------------------
   This file is our "mini database".
   No backend, no SQL, no server — just plain JavaScript.

   CONCEPT: JavaScript Objects
   -----------------------------------------------
   An object stores related data together using key: value pairs.
   Think of it like a hotel registration form — every field
   (name, city, price) is a key, and what you fill in is the value.

     let hotel = {
       name: "Grand Palace",      ← string value
       pricePerNight: 3500,       ← number value
       available: true,           ← boolean value
       amenities: ["WiFi","Pool"] ← array value (a list)
     };

   CONCEPT: JavaScript Arrays
   -----------------------------------------------
   An array is an ordered list, written with square brackets [].
   We use an array to hold ALL our hotel objects together.

     let hotels = [ hotel1, hotel2, hotel3 ];
     hotels[0]      → first hotel
     hotels.length  → total count

   WHY STORE DATA HERE?
   -----------------------------------------------
   Other JS files (main.js, hotels.js, booking.js) will import
   this data and use it to build the page dynamically.
   Keeping data separate from logic is a professional pattern
   called "Separation of Concerns".
================================================================ */


/* ================================================================
   DESTINATIONS DATA
   ----------------------------------------------------------------
   Each destination object has:
   • id         – unique identifier (used in URL params)
   • name       – display name
   • tagline    – short catchy description
   • image      – Unsplash photo URL (free, no login needed)
   • hotelCount – shown on destination card
   • gradient   – CSS gradient fallback if image is slow to load
================================================================ */

const destinations = [
  {
    id: "goa",
    name: "Goa",
    tagline: "Sun, Sand & Serenity",
    image: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=800&q=80",
    hotelCount: 48,
    gradient: "linear-gradient(135deg, #0f9b8e, #000000)"
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    tagline: "City of Nizams & Biryani",
    image: "https://images.unsplash.com/photo-1588416936097-41850ab3d86d?w=800&q=80",
    hotelCount: 62,
    gradient: "linear-gradient(135deg, #b06ab3, #4568dc)"
  },
  {
    id: "bengaluru",
    name: "Bengaluru",
    tagline: "Garden City of India",
    image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?w=800&q=80",
    hotelCount: 75,
    gradient: "linear-gradient(135deg, #134e5e, #71b280)"
  },
  {
    id: "chennai",
    name: "Chennai",
    tagline: "Gateway to South India",
    image: "https://images.unsplash.com/photo-1603905745017-bcfe3bfe2e86?w=800&q=80",
    hotelCount: 54,
    gradient: "linear-gradient(135deg, #f7971e, #ffd200)"
  },
  {
    id: "delhi",
    name: "Delhi",
    tagline: "History Meets Modernity",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=800&q=80",
    hotelCount: 91,
    gradient: "linear-gradient(135deg, #fc4a1a, #f7b733)"
  },
  {
    id: "kerala",
    name: "Kerala",
    tagline: "God's Own Country",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&q=80",
    hotelCount: 43,
    gradient: "linear-gradient(135deg, #11998e, #38ef7d)"
  }
];


/* ================================================================
   HOTELS DATA
   ----------------------------------------------------------------
   Each hotel object has these properties:

   id             – unique string, used in URLs (?hotel=taj-goa)
   name           – full hotel name
   destination    – must match a destination id above
   location       – specific area within the city
   image          – high-quality Unsplash photo URL
   rating         – number between 1.0 and 5.0
   reviewCount    – number of reviews (adds realism)
   pricePerNight  – price in Indian Rupees (₹)
   originalPrice  – crossed-out "was" price (shows discount)
   category       – "Luxury" | "Premium" | "Budget"
   description    – 1-2 sentence summary
   amenities      – array of strings (shown as icon tags)
   availableRooms – number (used in booking validation)
   isFeatured     – boolean (true = shown on homepage)
================================================================ */

const hotels = [

  /* ── GOA ──────────────────────────────────────────────── */
  {
    id: "taj-exotica-goa",
    name: "Taj Exotica Resort & Spa",
    destination: "goa",
    location: "Benaulim Beach, South Goa",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
    rating: 4.9,
    reviewCount: 1284,
    pricePerNight: 12500,
    originalPrice: 16000,
    category: "Luxury",
    description: "A palatial resort spread across 56 acres of lush grounds, with a private beach, world-class spa, and breathtaking Arabian Sea views.",
    amenities: ["Private Beach", "Infinity Pool", "Spa", "Free WiFi", "Restaurant", "Bar"],
    availableRooms: 8,
    isFeatured: true
  },
  {
    id: "cidade-de-goa",
    name: "Cidade de Goa",
    destination: "goa",
    location: "Vainguinim Beach, Panaji",
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    rating: 4.6,
    reviewCount: 876,
    pricePerNight: 7800,
    originalPrice: 9500,
    category: "Premium",
    description: "A stunning Portuguese-inspired resort nestled on a hillside with panoramic sea views and vibrant Goan culture at every turn.",
    amenities: ["Sea View", "Pool", "Free WiFi", "Gym", "Restaurant", "Parking"],
    availableRooms: 14,
    isFeatured: true
  },
  {
    id: "the-baywatch-goa",
    name: "The Baywatch Resort",
    destination: "goa",
    location: "Calangute Beach, North Goa",
    image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80",
    rating: 4.2,
    reviewCount: 542,
    pricePerNight: 3200,
    originalPrice: 4000,
    category: "Budget",
    description: "A cheerful, well-maintained resort just 50 metres from Calangute Beach — perfect for budget-conscious travellers who want it all.",
    amenities: ["Beach Access", "Pool", "Free WiFi", "Restaurant", "Air Conditioning"],
    availableRooms: 22,
    isFeatured: false
  },

  /* ── HYDERABAD ───────────────────────────────────────── */
  {
    id: "taj-falaknuma",
    name: "Taj Falaknuma Palace",
    destination: "hyderabad",
    location: "Falaknuma, Old City",
    image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
    rating: 5.0,
    reviewCount: 2103,
    pricePerNight: 28000,
    originalPrice: 34000,
    category: "Luxury",
    description: "A former Nizam's palace perched 2000 feet above Hyderabad, offering an unmatched royal experience with antique furniture and butler service.",
    amenities: ["Palace Stay", "Butler Service", "Pool", "Spa", "Fine Dining", "Heritage Tours"],
    availableRooms: 5,
    isFeatured: true
  },
  {
    id: "novotel-hyderabad",
    name: "Novotel Hyderabad Convention Centre",
    destination: "hyderabad",
    location: "HICC Complex, Madhapur",
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    rating: 4.5,
    reviewCount: 1120,
    pricePerNight: 5500,
    originalPrice: 6800,
    category: "Premium",
    description: "A contemporary business and leisure hotel with spacious rooms, rooftop pool, and direct access to the HICC convention centre.",
    amenities: ["Rooftop Pool", "Free WiFi", "Gym", "Business Centre", "Restaurant", "Airport Shuttle"],
    availableRooms: 30,
    isFeatured: false
  },
  {
    id: "lemon-tree-hyderabad",
    name: "Lemon Tree Hotel Hyderabad",
    destination: "hyderabad",
    location: "Begumpet, Central Hyderabad",
    image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
    rating: 4.1,
    reviewCount: 683,
    pricePerNight: 2800,
    originalPrice: 3500,
    category: "Budget",
    description: "A vibrant, modern hotel with a zesty personality — great value, friendly staff, and a convenient location near Begumpet Airport Road.",
    amenities: ["Free WiFi", "Pool", "Restaurant", "Gym", "Parking", "Air Conditioning"],
    availableRooms: 40,
    isFeatured: false
  },

  /* ── BENGALURU ────────────────────────────────────────── */
  {
    id: "leela-palace-bengaluru",
    name: "The Leela Palace Bengaluru",
    destination: "bengaluru",
    location: "Old Airport Road, Kodihalli",
    image: "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80",
    rating: 4.8,
    reviewCount: 1567,
    pricePerNight: 16000,
    originalPrice: 20000,
    category: "Luxury",
    description: "An opulent palace hotel set in 9 acres of landscaped gardens, blending Dravidian architecture with modern luxury and impeccable service.",
    amenities: ["Pool", "Spa", "Free WiFi", "Fine Dining", "Gym", "Concierge", "Valet Parking"],
    availableRooms: 10,
    isFeatured: true
  },
  {
    id: "ibis-bengaluru",
    name: "Ibis Bengaluru Hosur Road",
    destination: "bengaluru",
    location: "Hosur Road, Electronic City",
    image: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    rating: 4.0,
    reviewCount: 890,
    pricePerNight: 2200,
    originalPrice: 2800,
    category: "Budget",
    description: "A smart, no-fuss hotel ideal for tech professionals — close to Electronic City and Infosys campus with reliable WiFi and clean rooms.",
    amenities: ["Free WiFi", "Restaurant", "Gym", "Air Conditioning", "24/7 Reception"],
    availableRooms: 55,
    isFeatured: false
  },

  /* ── CHENNAI ─────────────────────────────────────────── */
  {
    id: "itc-grand-chola",
    name: "ITC Grand Chola",
    destination: "chennai",
    location: "Mount Road, Guindy",
    image: "https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80",
    rating: 4.9,
    reviewCount: 1876,
    pricePerNight: 14000,
    originalPrice: 18000,
    category: "Luxury",
    description: "India's largest LEED Platinum-certified luxury hotel, inspired by the grand Chola temples, with 600 rooms and legendary Southern hospitality.",
    amenities: ["Pool", "Spa", "Multiple Restaurants", "Free WiFi", "Business Centre", "Club Lounge"],
    availableRooms: 12,
    isFeatured: true
  },
  {
    id: "radisson-blu-chennai",
    name: "Radisson Blu Hotel Chennai",
    destination: "chennai",
    location: "Egmore, Central Chennai",
    image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80",
    rating: 4.4,
    reviewCount: 734,
    pricePerNight: 6200,
    originalPrice: 7500,
    category: "Premium",
    description: "A polished city hotel in the heart of Chennai with a rooftop pool, well-equipped gym, and proximity to major business and cultural landmarks.",
    amenities: ["Rooftop Pool", "Free WiFi", "Gym", "Restaurant", "Bar", "Airport Shuttle"],
    availableRooms: 25,
    isFeatured: false
  },

  /* ── DELHI ───────────────────────────────────────────── */
  {
    id: "the-imperial-delhi",
    name: "The Imperial New Delhi",
    destination: "delhi",
    location: "Janpath, Connaught Place",
    image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80",
    rating: 4.9,
    reviewCount: 2210,
    pricePerNight: 22000,
    originalPrice: 27000,
    category: "Luxury",
    description: "A legendary 1936 heritage hotel on Janpath, housing one of Delhi's finest art collections and offering timeless colonial elegance in the city's heart.",
    amenities: ["Heritage Property", "Pool", "Spa", "Fine Dining", "Free WiFi", "Art Gallery", "Butler"],
    availableRooms: 6,
    isFeatured: true
  },
  {
    id: "treebo-delhi",
    name: "Treebo Trend Royal Inn",
    destination: "delhi",
    location: "Paharganj, New Delhi",
    image: "https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800&q=80",
    rating: 3.9,
    reviewCount: 412,
    pricePerNight: 1500,
    originalPrice: 2000,
    category: "Budget",
    description: "A no-frills, clean, and comfortable stay near New Delhi Railway Station — perfect for solo backpackers and budget travellers exploring the capital.",
    amenities: ["Free WiFi", "Air Conditioning", "24/7 Reception", "Hot Water", "Luggage Storage"],
    availableRooms: 60,
    isFeatured: false
  },

  /* ── KERALA ──────────────────────────────────────────── */
  {
    id: "kumarakom-lake-resort",
    name: "Kumarakom Lake Resort",
    destination: "kerala",
    location: "Kumarakom, Kottayam",
    image: "https://images.unsplash.com/photo-1540541338537-1220059ddcd8?w=800&q=80",
    rating: 4.8,
    reviewCount: 1432,
    pricePerNight: 18500,
    originalPrice: 23000,
    category: "Luxury",
    description: "An award-winning luxury heritage resort on the banks of Vembanad Lake, offering traditional Kerala architecture, backwater cruises, and Ayurvedic spa.",
    amenities: ["Backwater View", "Ayurvedic Spa", "Private Pool", "Houseboat", "Free WiFi", "Yoga"],
    availableRooms: 9,
    isFeatured: true
  },
  {
    id: "spice-village-kerala",
    name: "Spice Village",
    destination: "kerala",
    location: "Kumily, Thekkady",
    image: "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&q=80",
    rating: 4.6,
    reviewCount: 987,
    pricePerNight: 8500,
    originalPrice: 11000,
    category: "Premium",
    description: "An eco-friendly retreat nestled in a spice plantation near Periyar Tiger Reserve — a unique blend of nature, wildlife, and rustic charm.",
    amenities: ["Spice Garden", "Pool", "Jungle Walks", "Free WiFi", "Ayurvedic Spa", "Restaurant"],
    availableRooms: 18,
    isFeatured: true
  }

];
/* ── End of hotels array ─────────────────────────────────── */


/* ================================================================
   HELPER FUNCTIONS
   ----------------------------------------------------------------
   These functions make it easy for other JS files to query
   the data above without repeating filter/find logic everywhere.

   CONCEPT: Array methods
   -----------------------------------------------
   .filter()  → returns a NEW array with items that pass a test
   .find()    → returns the FIRST item that passes a test
   .sort()    → sorts the array (we create a copy first with [...])

   Example:
     hotels.filter(h => h.destination === "goa")
     → returns all hotels where destination equals "goa"
================================================================ */

/**
 * Get all hotels for a specific destination.
 * @param {string} destinationId  e.g. "goa"
 * @returns {Array} filtered hotels array
 */
function getHotelsByDestination(destinationId) {
  return hotels.filter(function(hotel) {
    return hotel.destination === destinationId;
  });
}

/**
 * Get a single hotel by its unique id.
 * @param {string} hotelId  e.g. "taj-exotica-goa"
 * @returns {Object|undefined} hotel object or undefined if not found
 */
function getHotelById(hotelId) {
  return hotels.find(function(hotel) {
    return hotel.id === hotelId;
  });
}

/**
 * Get the featured hotels shown on the homepage.
 * @returns {Array} hotels where isFeatured is true
 */
function getFeaturedHotels() {
  return hotels.filter(function(hotel) {
    return hotel.isFeatured === true;
  });
}

/**
 * Get hotels filtered by category.
 * @param {string} category  "Luxury" | "Premium" | "Budget"
 * @returns {Array}
 */
function getHotelsByCategory(category) {
  return hotels.filter(function(hotel) {
    return hotel.category === category;
  });
}

/**
 * Search hotels by name or location (case-insensitive).
 * @param {string} query  user's search text
 * @returns {Array}
 */
function searchHotels(query) {
  // Convert to lowercase so "GOA" matches "goa"
  const lowerQuery = query.toLowerCase();

  return hotels.filter(function(hotel) {
    return (
      hotel.name.toLowerCase().includes(lowerQuery)        ||
      hotel.destination.toLowerCase().includes(lowerQuery) ||
      hotel.location.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Sort hotels by a given field.
 * @param {Array}  hotelList  the array to sort
 * @param {string} sortBy     "price-low" | "price-high" | "rating" | "name"
 * @returns {Array} new sorted array (original is not mutated)
 */
function sortHotels(hotelList, sortBy) {
  // [...hotelList] creates a shallow copy so we don't modify the original
  const sorted = [...hotelList];

  if (sortBy === "price-low") {
    sorted.sort(function(a, b) { return a.pricePerNight - b.pricePerNight; });
  } else if (sortBy === "price-high") {
    sorted.sort(function(a, b) { return b.pricePerNight - a.pricePerNight; });
  } else if (sortBy === "rating") {
    sorted.sort(function(a, b) { return b.rating - a.rating; });
  } else if (sortBy === "name") {
    sorted.sort(function(a, b) { return a.name.localeCompare(b.name); });
  }

  return sorted;
}

/**
 * Format a number as Indian Rupees.
 * e.g. 12500 → "₹12,500"
 * @param {number} amount
 * @returns {string}
 */
function formatPrice(amount) {
  return "₹" + amount.toLocaleString("en-IN");
}

/**
 * Generate star HTML string from a rating number.
 * e.g. 4.6 → "★★★★½"  (using filled, half, empty unicode symbols)
 * @param {number} rating  e.g. 4.6
 * @returns {string} HTML string for the stars
 */
function generateStarHTML(rating) {
  let starsHTML = "";
  const fullStars = Math.floor(rating);       // 4.6 → 4 full stars
  const hasHalf   = (rating % 1) >= 0.5;     // 4.6 → true
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  // Full stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<i class="fa-solid fa-star" aria-hidden="true"></i>';
  }
  // Half star
  if (hasHalf) {
    starsHTML += '<i class="fa-solid fa-star-half-stroke" aria-hidden="true"></i>';
  }
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<i class="fa-regular fa-star" aria-hidden="true"></i>';
  }

  return starsHTML;
}

/**
 * Get a destination object by id.
 * @param {string} destinationId
 * @returns {Object|undefined}
 */
function getDestinationById(destinationId) {
  return destinations.find(function(dest) {
    return dest.id === destinationId;
  });
}
