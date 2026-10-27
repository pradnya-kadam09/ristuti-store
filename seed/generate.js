// Generates and synchronizes data/products.json with high-resolution fashion imagery
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const prodImgDir = path.join(root, 'public', 'images', 'products');
fs.mkdirSync(prodImgDir, { recursive: true });

let seed = 21;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rand() * a.length)];

const colors = [['Rose Blush','#e8a0b4','#b94e72'],['Ivory','#f5ecd9','#cdbb94'],['Midnight Navy','#2c3e70','#121c3d'],['Emerald','#2e9d78','#0f5c43'],['Royal Maroon','#a8324f','#5e1428'],['Mustard','#e5b23c','#a8741a'],['Lavender','#b9a3e3','#7b62b8'],['Teal','#2aa5a5','#116466'],['Coral','#f48b73','#c2503a'],['Charcoal','#5b5b66','#26262d'],['Sky Blue','#8ec5ef','#4a8cc4'],['Olive','#8c9a4b','#56622a'],['Peach','#f8c4a4','#d98a60'],['Wine','#7d2a52','#3f1029'],['Pearl White','#fbfaf7','#d7d3c8'],['Sage','#a8c3a0','#6b8d63']];
const denim = [['Classic Blue','#4f78b0','#2a4a7c'],['Light Wash','#9dbfe3','#6b95c6'],['Dark Indigo','#2b3f66','#141f38'],['Jet Black','#3a3a40','#111114'],['Stone Grey','#8d949e','#5a6069'],['Ice Blue','#c3d9ee','#8fb2d4']];

const cats = [
  { name: 'Traditional Wear', price: [699, 3299], fabric: 'Fine mulmul cotton & chanderi silk blend', styles: ['Anarkali Kurti', 'Straight Kurti', 'Printed Kurta Set', 'Embroidered Kurti', 'Palazzo Kurta Set', 'Chikankari Kurti', 'Block Print Kurti', 'Festive Salwar Suit'] },
  { name: 'Ethnic Dresses', price: [1299, 4499], fabric: 'Flowing georgette, crepe & organza', styles: ['Anarkali Gown', 'Flared Kurta Dress', 'Indo-Western Dress', 'Lehenga Set', 'Sharara Set', 'Gharara Set', 'Angrakha Dress', 'Kaftan Dress'] },
  { name: 'Sarees', price: [999, 6999], fabric: 'Pure Banarasi zari, Kanjivaram silk & chiffon', styles: ['Silk Saree', 'Cotton Saree', 'Georgette Saree', 'Chiffon Saree', 'Banarasi Saree', 'Kanjivaram Saree', 'Chanderi Saree', 'Organza Saree'] },
  { name: "Women's Tops", price: [399, 1399], fabric: 'Satin silk, breathable cotton & soft crepe', styles: ['Ruffle Blouse', 'Crop Top', 'Peplum Top', 'Off-Shoulder Top', 'Wrap Top', 'Puff Sleeve Top', 'Satin Cami Top', 'Tie-Knot Top'] },
  { name: 'T-Shirts', price: [299, 999], fabric: '100% Combed bio-wash cotton jersey', styles: ['Oversized Tee', 'Graphic Tee', 'Basic Cotton Tee', 'Boxy Tee', 'Striped Tee', 'Printed Tee', 'Polo Tee', 'Slogan Tee'] },
  { name: 'Jeans', price: [899, 2299], fabric: 'Premium stretch denim with comfort waist', styles: ['Skinny Jeans', 'Mom Fit Jeans', 'Straight Jeans', 'Wide-Leg Jeans', 'Flared Jeans', 'High-Rise Jeans', 'Boyfriend Jeans', 'Bootcut Jeans'], denim: true },
  { name: 'Shorts', price: [349, 1099], fabric: 'Washed denim, breathable linen & pure cotton', styles: ['Denim Shorts', 'Linen Shorts', 'Cycling Shorts', 'Paperbag Shorts', 'Pleated Shorts', 'Cotton Shorts', 'Bermuda Shorts', 'Frill Shorts'] },
  { name: 'Leggings', price: [249, 849], fabric: '4-way super stretch cotton lycra', styles: ['Churidar Leggings', 'Ankle Leggings', 'Gym Leggings', 'Cotton Leggings', 'Stretch Leggings', 'High-Waist Leggings', 'Printed Leggings', 'Pencil Leggings'] },
  { name: 'Skirts', price: [499, 1899], fabric: 'Satin slip, pleated crepe & tiered cotton', styles: ['Pleated Skirt', 'Midi Skirt', 'A-Line Skirt', 'Wrap Skirt', 'Tiered Skirt', 'Satin Skirt', 'Denim Skirt', 'Mini Skirt'] },
  { name: 'Jackets', price: [999, 3399], fabric: 'Tailored twill, denim & quilted satin', styles: ['Denim Jacket', 'Bomber Jacket', 'Blazer', 'Shrug', 'Cropped Jacket', 'Quilted Jacket', 'Puffer Jacket', 'Linen Jacket'] }
];

const products = [
  { id: 1, name: 'Rose Printed Kurti', category: 'Traditional Wear', price: 899, oldPrice: 1199, image: '/images/products/1.jpg', description: 'A graceful Chikankari & rose printed kurti for everyday elegance.', tag: 'CURATED PICK' },
  { id: 2, name: 'Festive Anarkali', category: 'Ethnic Dresses', price: 1899, oldPrice: 2299, image: '/images/products/2.jpg', description: 'A statement ethnic gown for celebrations and grand festive occasions.', tag: 'CURATED PICK' },
  { id: 3, name: 'Classic Everyday Top', category: "Women's Tops", price: 699, oldPrice: 899, image: '/images/products/3.jpg', description: 'An easy-to-style chic blouse made for your everyday boutique wardrobe.' },
  { id: 4, name: 'Elegant Ethnic Set', category: 'Traditional Wear', price: 1499, oldPrice: 1799, image: '/images/products/4.jpg', description: 'A timeless traditional kurta & palazzo set with a modern touch.' },
  { id: 5, name: 'Pastel Occasion Dress', category: 'Ethnic Dresses', price: 2199, oldPrice: 2699, image: '/images/products/5.jpg', description: 'A soft, flowing pastel dress tailored for memorable occasions.' },
  { id: 6, name: 'Minimal Chic Top', category: "Women's Tops", price: 749, oldPrice: 999, image: '/images/products/6.jpg', description: 'A versatile satin wrap top that pairs beautifully with your favourite looks.' }
];

const perCat = 33;
const byCat = cats.map(c => {
  const pool = c.denim ? denim : colors;
  const combos = [];
  pool.forEach(col => c.styles.forEach(s => combos.push([col, s])));
  for (let i = combos.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [combos[i], combos[j]] = [combos[j], combos[i]];
  }
  return combos.slice(0, perCat).map(([col, style]) => ({ c, col, style }));
});

for (let n = 0; n < perCat; n++) {
  byCat.forEach(list => {
    const { c, col, style } = list[n];
    const id = products.length + 1;
    const oldPrice = Math.round((c.price[0] + rand() * (c.price[1] - c.price[0])) / 50) * 50;
    const off = pick([10, 15, 20, 25, 30, 40, 50]);
    const price = Math.round(oldPrice * (1 - off / 100) / 10) * 10 - 1;
    const pct = Math.round((1 - price / oldPrice) * 100);
    const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    products.push({
      id,
      name: `${col[0]} ${style}`,
      category: c.name,
      price,
      oldPrice,
      image: `/images/products/${id}.jpg`,
      sizes: ALL_SIZES,
      description: `${col[0]} ${style.toLowerCase()}. Fabric: ${c.fabric}. Handcrafted for superior comfort and luxury silhouette.`,
      tag: id % 9 === 0 ? 'BESTSELLER' : id % 7 === 1 ? 'NEW' : pct >= 40 ? `${pct}% OFF` : (id % 5 === 2 ? 'TRENDING' : '')
    });
  });
}

// Preserve existing real images in products folder
const existingJson = path.join(root, 'data', 'products.json');
fs.writeFileSync(existingJson, JSON.stringify(products, null, 2));
console.log(`Updated products database: ${products.length} products with category-matched photography.`);
