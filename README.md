# RISTUTI | Haute Couture & Luxury Indian Ethnic Fashion Boutique

A premium, full-stack e-commerce boutique website built with **Node.js, Express, Vanilla JavaScript, and Luxury Modern CSS**.

---

## ✨ Highlights & Enhancements
- **336+ Curated Products**: Spanning 10 distinct women's fashion categories (Traditional Wear, Royal Sarees, Ethnic Dresses, Women's Tops, T-Shirts, Premium Jeans, Chic Shorts, Leggings, Flared Skirts, and Jackets).
- **Category-Accurate, Realistic Photography**: Every single product features its own realistic, high-resolution photo matching its exact clothing category—no repetitive drawings or mismatched images.
- **High-End Couture Design**:
  - Luxury typography with *Cormorant Garamond*, *Playfair Display*, and *Plus Jakarta Sans*.
  - Regal burgundy, champagne gold, and warm silk ivory color palette.
  - Floating announcement bar, glassmorphism sticky header, rotating seal, and hero couture banner.
  - Interactive Brand Pillars: Authentic Handcrafting, Express Shipping, 7-Day Easy Returns, Cash on Delivery.
  - Visual Category Lookbook with zoom-on-hover cards.
  - Curated tabs: All Pieces, Bestsellers, New Arrivals, Trending Now, Special Offers.
  - Category chips with real-time counters and horizontal scroll.
  - Interactive Search with instant debouncing and popular keyword tags.
  - Price range and multi-option sorting (Newest, Price Low to High, Price High to Low, Highest Discount).
  - Floating Add-to-Bag particle animations.
  - **Quick View Modal** with image zoom, size selectors (XS, S, M, L, XL), fabric care info, and one-click add to bag.
  - **Interactive Wishlist** (saved to localStorage with live counter badge).
  - **Sliding Shopping Bag Drawer** with a real-time Free Shipping milestone progress bar (Goal: ₹1,499) and promo coupon engine (`NOIR10` for 10% off, `FESTIVE20` for 20% off).
  - **Seamless Checkout Modal** with Cash on Delivery & Demo Online Payment, phone validation, and printable order confirmation receipt.
  - **Customer Reviews** with average 4.9★ rating breakdown, interactive star rating picker, and verified customer testimonials.
  - **Instagram Community Lookbook** linking directly to [@_ristuti_](https://www.instagram.com/_ristuti_/).
  - **VIP Privilege Club Newsletter** with instant 10% coupon generation.
  - **Dedicated Customer Feedback Page** (`/feedback`).

---

## 🚀 Step-by-Step Instructions to Run Locally in VS Code

### Prerequisites
- Install **Node.js 18 or newer** from [https://nodejs.org](https://nodejs.org).

### Steps
1. **Extract the ZIP file** to any folder on your computer.
2. **Open Visual Studio Code**, click **File > Open Folder...**, and select the extracted `ristuti-store` folder.
3. **Open the VS Code Terminal**:
   - Press ``Ctrl + ` `` (Backtick) or go to **Terminal > New Terminal**.
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start the server**:
   ```bash
   npm start
   ```
6. **Open in your browser**:
   - Main Store: [http://localhost:3000](http://localhost:3000)
   - Customer Feedback: [http://localhost:3000/feedback](http://localhost:3000/feedback)

---

## 📁 Project Structure

```
ristuti-store/
├── data/
│   ├── orders.json        # Stored customer orders
│   ├── products.json      # 336 curated fashion items with prices, categories, and tags
│   ├── reviews.json       # Verified customer reviews and ratings
│   ├── feedback.json      # Suggestions and inquiries from the feedback page
│   └── newsletter.json    # Subscribed VIP club email list
├── public/
│   ├── images/
│   │   └── products/      # 336 high-resolution, unique category-specific photos (1.jpg to 336.jpg)
│   ├── app.js             # Client e-commerce logic, cart, wishlist, filters, quickview & checkout
│   ├── fx.js              # Scroll reveals, sticky header transition, animations
│   ├── style.css          # Luxury responsive styling, gold accents, and animations
│   ├── index.html         # Main luxury boutique storefront
│   ├── feedback.html      # Dedicated customer feedback & suggestion page
│   └── feedback.js        # Feedback form handling and live character count
├── seed/
│   └── generate.js        # Database generator & category photo synchronizer
├── package.json           # Node.js dependencies and run scripts
├── server.js              # Express.js REST API and static file web server
└── README.md              # Project documentation and setup guide
```

---

## 💎 Demo Coupon Codes
You can test the checkout promo engine in the bag drawer:
- `NOIR10` - 10% Off VIP Discount
- `FESTIVE20` - 20% Off Festive Special Discount

---

## 📞 Boutique Contact Details
- **Customer Helpline**: [+91 72635 18364](tel:+917263518364)
- **Instagram**: [@_ristuti_](https://www.instagram.com/_ristuti_/)
- **Delivery**: Pan-India dispatch with Cash on Delivery & Express delivery options.
