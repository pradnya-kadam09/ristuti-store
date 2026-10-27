const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "orders.json");
const PRODUCT_FILE = path.join(__dirname, "data", "products.json");
const PHOTO_DIR = path.join(__dirname, "public", "images", "products");
const REVIEWS_FILE = path.join(__dirname, "data", "reviews.json");
const FEEDBACK_FILE = path.join(__dirname, "data", "feedback.json");
const NEWSLETTER_FILE = path.join(__dirname, "data", "newsletter.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

// Loads products from data/products.json with real photos from public/images/products
function loadProducts() {
  let list;
  try {
    list = JSON.parse(fs.readFileSync(PRODUCT_FILE, "utf8"));
  } catch {
    console.error("data/products.json is missing.");
    return [];
  }
  let photos = [];
  try {
    photos = fs.readdirSync(PHOTO_DIR);
  } catch {}

  const ALL_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
  return list.map(p => {
    const file = photos.find(n => /^\d+\.(jpe?g|png|webp)$/i.test(n) && parseInt(n, 10) === p.id);
    const image = file ? `/images/products/${file}` : (p.image || `/images/products/1.jpg`);
    return {
      ...p,
      image,
      sizes: ALL_SIZES,
      rating: p.rating || Number((4.6 + ((p.id % 5) * 0.08)).toFixed(1)),
      reviewCount: p.reviewCount || (18 + ((p.id * 7) % 85)),
      inStock: true
    };
  });
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Rate limiting helper
const hits = {};
function tooMany(req, label, max = 10) {
  const key = label + (req.ip || "");
  const now = Date.now();
  hits[key] = (hits[key] || []).filter(t => now - t < 3600000);
  if (hits[key].length >= max) return true;
  hits[key].push(now);
  return false;
}

const clean = (v, max) => String(v || "").replace(/\s+/g, " ").trim().slice(0, max);

// Product listing API with filtering, sorting, and tag support
app.get("/api/products", (req, res) => {
  const { category, search, tag, sort, minPrice, maxPrice } = req.query;
  let result = loadProducts();

  if (category && category !== "All") {
    result = result.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }
  if (tag) {
    const t = String(tag).toUpperCase();
    if (t === "BESTSELLER") result = result.filter(p => (p.tag || "").includes("BESTSELLER") || p.id % 7 === 0);
    else if (t === "NEW") result = result.filter(p => (p.tag || "").includes("NEW") || p.id % 6 === 1);
    else if (t === "SALE" || t === "OFFERS") result = result.filter(p => (p.tag || "").includes("OFF") || (p.oldPrice && p.oldPrice > p.price));
    else if (t === "TRENDING") result = result.filter(p => p.id % 5 === 2 || (p.tag || "").includes("CURATED"));
  }
  if (minPrice) {
    result = result.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    result = result.filter(p => p.price <= Number(maxPrice));
  }
  if (search) {
    const term = String(search).toLowerCase();
    result = result.filter(p => `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(term));
  }

  if (sort === "price-asc") result = [...result].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") result = [...result].sort((a, b) => b.price - a.price);
  else if (sort === "newest") result = [...result].sort((a, b) => b.id - a.id);
  else if (sort === "discount") result = [...result].sort((a, b) => ((b.oldPrice - b.price) / b.oldPrice) - ((a.oldPrice - a.price) / a.oldPrice));

  res.json(result);
});

// Single product details
app.get("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const products = loadProducts();
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

// Orders API
app.post("/api/orders", (req, res) => {
  const { customer, items, address, paymentMethod, promoCode, note } = req.body || {};
  if (!customer?.name || !customer?.phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Please provide your name, phone, address and bag items." });
  }

  const products = loadProducts();
  const safeItems = [];
  for (const item of items) {
    const product = products.find(p => p.id === Number(item.id));
    const quantity = Math.min(10, Math.max(1, Number(item.quantity) || 1));
    const size = item.size || "M";
    if (product) {
      safeItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        quantity,
        size
      });
    }
  }
  if (!safeItems.length) return res.status(400).json({ error: "No valid products found." });

  let subtotal = safeItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let discount = 0;
  let code = clean(promoCode, 20).toUpperCase();
  if (code === "NOIR10" || code === "WELCOME10") {
    discount = Math.round(subtotal * 0.1);
  } else if (code === "FESTIVE20" || code === "ROYAL20") {
    discount = Math.round(subtotal * 0.2);
  }
  const total = Math.max(0, subtotal - discount);

  const orders = readOrders();
  const order = {
    id: `RST-${Date.now().toString().slice(-8)}`,
    customer: {
      name: String(customer.name).slice(0, 100),
      phone: String(customer.phone).slice(0, 20),
      email: String(customer.email || "").slice(0, 150)
    },
    address: String(address).slice(0, 500),
    items: safeItems,
    subtotal,
    discount,
    promoCode: code || null,
    total,
    note: clean(note, 300),
    paymentMethod: paymentMethod === "Online payment (demo)" ? "Online payment (demo)" : "Cash on Delivery",
    paymentStatus: "Pending",
    status: "Order received · Processing for dispatch",
    createdAt: new Date().toISOString()
  };

  orders.unshift(order);
  saveOrders(orders);
  res.status(201).json({ message: "Order placed successfully.", order });
});

// Admin orders endpoint
app.get("/api/admin/orders", (req, res) => {
  res.json(readOrders());
});

// Customer reviews
app.get("/api/reviews", (req, res) => {
  const reviews = readJson(REVIEWS_FILE);
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
  });
  const count = reviews.length;
  const average = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 5.0;
  res.json({ reviews: reviews.slice(0, 100), count, average, breakdown });
});

app.post("/api/reviews", (req, res) => {
  const body = req.body || {};
  const rating = Number(body.rating);
  const name = clean(body.name, 60);
  const comment = clean(body.comment, 600);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ error: "Please choose a rating from 1 to 5 stars." });
  if (name.length < 2) return res.status(400).json({ error: "Please enter your name." });
  if (comment.length < 5) return res.status(400).json({ error: "Please write a few words about your experience." });
  if (tooMany(req, "review", 8)) return res.status(429).json({ error: "You have sent several reviews already. Please try again later." });

  const review = {
    id: Date.now(),
    name,
    rating,
    title: clean(body.title, 80),
    comment,
    createdAt: new Date().toISOString()
  };
  const reviews = readJson(REVIEWS_FILE);
  reviews.unshift(review);
  writeJson(REVIEWS_FILE, reviews);
  res.status(201).json({ message: "Review saved.", review });
});

// Feedback endpoint
app.post("/api/feedback", (req, res) => {
  const body = req.body || {};
  const message = clean(body.message, 1500);
  const types = ["Suggestion", "Compliment", "Product request", "Complaint", "Other"];
  if (message.length < 10) return res.status(400).json({ error: "Please write at least 10 characters." });
  if (tooMany(req, "feedback", 8)) return res.status(429).json({ error: "You have sent several messages already. Please try again later." });

  const rating = Number(body.rating);
  const entry = {
    id: Date.now(),
    name: clean(body.name, 60),
    contact: clean(body.contact, 150),
    type: types.includes(body.type) ? body.type : "Other",
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
    message,
    createdAt: new Date().toISOString()
  };
  const all = readJson(FEEDBACK_FILE);
  all.unshift(entry);
  writeJson(FEEDBACK_FILE, all);
  res.status(201).json({ message: "Thank you for your feedback." });
});

// Newsletter subscription endpoint
app.post("/api/newsletter", (req, res) => {
  const email = clean(req.body?.email, 150);
  if (!email || !email.includes("@")) return res.status(400).json({ error: "Please provide a valid email address." });
  const list = readJson(NEWSLETTER_FILE);
  if (!list.includes(email)) {
    list.push(email);
    writeJson(NEWSLETTER_FILE, list);
  }
  res.json({ message: "Welcome to the RISTUTI VIP Club! Use code NOIR10 for 10% off your order." });
});

// Validate promo coupon code
app.get("/api/coupon/:code", (req, res) => {
  const code = (req.params.code || "").trim().toUpperCase();
  if (code === "NOIR10" || code === "WELCOME10") {
    res.json({ valid: true, discountPercent: 10, code, message: "10% VIP Discount Applied!" });
  } else if (code === "FESTIVE20" || code === "ROYAL20") {
    res.json({ valid: true, discountPercent: 20, code, message: "20% Festive Special Discount Applied!" });
  } else {
    res.status(400).json({ valid: false, message: "Invalid or expired coupon code." });
  }
});

app.get("/feedback", (req, res) => res.sendFile(path.join(__dirname, "public", "feedback.html")));
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

app.listen(PORT, () => {
  console.log(`RISTUTI store running at http://localhost:${PORT}`);
});
