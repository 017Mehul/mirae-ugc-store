const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

const categories = [
  ['DRESSES', 'cat-dresses.jpg'], ['TOPS', 'cat-tops.jpg'], ['CO-ORD SETS', 'cat-coord.jpg'],
  ['JACKETS', 'cat-jackets.jpg'], ['ACCESSORIES', 'cat-accessories.jpg'], ['LOUNGEWEAR', 'cat-lounge.jpg']
];
const products = [
  ['Linen Maxi Dress', '₹2,499', 'DRESSES', 'product-1.jpg', 'Lightweight linen with an effortless everyday silhouette.'],
  ['Floral Wrap Dress', '₹2,499', 'DRESSES', 'product-2.jpg', 'A feminine floral wrap dress made for sunny days.'],
  ['Satin Cowl Top', '₹1,499', 'TOPS', 'product-3.jpg', 'A fluid satin top with an elegant cowl neckline.'],
  ['Pleated Midi Skirt', '₹1,899', 'SKIRTS', 'product-4.jpg', 'A graceful pleated skirt that moves with you.'],
  ['Linen Co-ord Set', '₹2,799', 'CO-ORD SETS', 'product-5.jpg', 'A relaxed matching set for polished everyday dressing.']
];
const articles = [
  ['5 Ways to Style Linen This Summer', 'Simple styling ideas for breathable, timeless linen pieces.'],
  ['Wardrobe Staples You Need', 'The versatile essentials that make getting dressed easier.'],
  ['Neutral Tones, Endless Possibilities', 'Build a calm, coordinated wardrobe with neutral shades.']
];
const state = { cart: [], wish: [], filter: 'all' };
const asset = (name) => `/${name}`;
const money = (value) => Number(value.replace(/[^0-9]/g, '')).toLocaleString('en-IN');

function openModal(title, body, onReady) {
  $('#modal-content').innerHTML = `<h2>${title}</h2>${body}`;
  $('#overlay').hidden = false;
  document.body.classList.add('modal-open');
  if (onReady) onReady();
}
function closeModal() { $('#overlay').hidden = true; document.body.classList.remove('modal-open'); }
function renderCategories() {
  $('#categories').innerHTML = categories.map(([name, image]) =>
    `<div class="category-wrap"><button class="category" data-category="${name}" aria-label="Shop ${name}"><img src="${asset(image)}" alt="${name}"></button><span>${name}</span></div>`
  ).join('');
}
function renderProducts() {
  const visible = products.map((p, index) => ({ p, index })).filter(({ p }) => state.filter === 'all' || p[2] === state.filter);
  $('#products').innerHTML = visible.map(({ p, index }) => `
    <article class="product">
      <button class="heart" data-wish="${index}" aria-label="Toggle wishlist">${state.wish.includes(index) ? '♥' : '♡'}</button>
      <button class="product-image" data-product="${index}" aria-label="View ${p[0]}"><img src="${asset(p[3])}" alt="${p[0]}" loading="lazy"></button>
      <h3>${p[0]}</h3><p class="price">${p[1]}</p><div class="swatches"><i></i><i></i><i></i></div>
      <button class="primary" data-add="${index}" style="padding:8px 10px;margin:0 4px">ADD TO BAG</button>
      <button class="text-button" data-product="${index}">VIEW DETAILS</button>
    </article>`).join('') || '<p>No pieces in this collection yet.</p>';
}
function updateCart() {
  $('#cart-count').textContent = state.cart.length;
  $('#cart-items').innerHTML = state.cart.length ? state.cart.map((index, line) => `
    <div class="cart-line"><span>${products[index][0]}<small>${products[index][1]}</small></span>
    <button data-remove="${line}" aria-label="Remove item">×</button></div>`).join('') : '<p>Your bag is empty.</p>';
  const total = state.cart.reduce((sum, index) => sum + Number(products[index][1].replace(/[^0-9]/g, '')), 0);
  $('#cart-total').textContent = `₹${total.toLocaleString('en-IN')}`;
}
function showCart() { $('#drawer').classList.add('open'); updateCart(); }
function showProduct(index) {
  const p = products[index];
  openModal(p[0], `<img class="modal-product-image" src="${asset(p[3])}" alt="${p[0]}"><p>${p[4]}</p><h3>${p[1]}</h3><p>Category: ${p[2]}</p><button class="primary" data-add="${index}">ADD TO BAG →</button>`);
}
function showWishlist() {
  const items = state.wish.map(index => `<p><b>${products[index][0]}</b> — ${products[index][1]} <button data-product="${index}">View</button></p>`).join('');
  openModal('Your Wishlist', items || '<p>Your wishlist is waiting for a little love ♡</p>');
}
function showSearch() {
  openModal('Find your style', '<p>Search products by name or category.</p><input id="search-input" placeholder="Try linen, dresses or tops" autofocus><div id="search-results"></div>');
  const input = $('#search-input');
  const render = () => {
    const q = input.value.toLowerCase().trim();
    const matches = products.map((p, i) => ({ p, i })).filter(({ p }) => `${p[0]} ${p[2]}`.toLowerCase().includes(q));
    $('#search-results').innerHTML = matches.map(({ p, i }) => `<p><button class="text-button" data-product="${i}">${p[0]} — ${p[1]}</button></p>`).join('') || '<p>No matching styles found.</p>';
  };
  input.addEventListener('input', render); render();
}
function showAccount() {
  openModal('Welcome to MIRAE', '<p>Sign in to save your wishlist and track orders.</p><form id="account-form"><input type="email" required placeholder="Email address"><input type="password" required minlength="4" placeholder="Password"><button class="primary">CONTINUE</button></form><p id="account-message"></p>');
  $('#account-form').addEventListener('submit', (e) => { e.preventDefault(); $('#account-message').textContent = 'Demo sign-in complete. Connect authentication to enable real accounts.'; e.target.reset(); });
}
function showJournal(index = null) {
  if (index !== null) openModal(articles[index][0], `<p>${articles[index][1]}</p><p>Read more styling inspiration in the next MIRAE editorial edition.</p>`);
  else openModal('From the Journal', articles.map((a, i) => `<p><b>${a[0]}</b><br>${a[1]}<br><button class="text-button" data-article="${i}">READ ARTICLE →</button></p>`).join(''));
}
function showContact() {
  openModal('We’re here to help', '<p>Our support team is happy to help with orders, delivery, returns and styling questions.</p><form id="contact-form"><input required placeholder="Your name"><input type="email" required placeholder="Email address"><textarea required placeholder="How can we help?"></textarea><button class="primary">SEND MESSAGE</button></form><p id="contact-message"></p>');
  $('#contact-form').addEventListener('submit', (e) => { e.preventDefault(); $('#contact-message').textContent = 'Thanks! Your demo message has been recorded locally. Connect a backend to send it.'; e.target.reset(); });
}
function showMenu() {
  openModal('MIRAE Menu', '<div class="menu-links"><button data-scroll="#new">New Arrivals</button><button data-scroll="#shop">Shop</button><button data-scroll="#collections">Collections</button><button data-scroll="#about">About</button><button data-scroll="#journal">Journal</button></div>');
}

document.addEventListener('click', (event) => {
  const target = event.target.closest('button, a');
  if (!target) return;
  const action = target.dataset.action;
  if (target.dataset.action || target.dataset.filter !== undefined || target.dataset.category || target.dataset.scroll || target.dataset.product !== undefined || target.dataset.add !== undefined || target.dataset.wish !== undefined || target.dataset.article !== undefined || target.dataset.remove !== undefined) event.preventDefault();
  if (target.dataset.add !== undefined) { state.cart.push(Number(target.dataset.add)); updateCart(); showCart(); return; }
  if (target.dataset.remove !== undefined) { state.cart.splice(Number(target.dataset.remove), 1); updateCart(); return; }
  if (target.dataset.product !== undefined) { showProduct(Number(target.dataset.product)); return; }
  if (target.dataset.wish !== undefined) { const i = Number(target.dataset.wish); state.wish = state.wish.includes(i) ? state.wish.filter(x => x !== i) : [...state.wish, i]; renderProducts(); return; }
  if (target.dataset.article !== undefined) { showJournal(Number(target.dataset.article)); return; }
  if (target.dataset.category) { state.filter = target.dataset.category; renderProducts(); $('#new').scrollIntoView({ behavior: 'smooth' }); return; }
  if (target.dataset.filter !== undefined) { state.filter = 'all'; renderProducts(); $('#new').scrollIntoView({ behavior: 'smooth' }); return; }
  if (target.dataset.scroll) { closeModal(); document.querySelector(target.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' }); return; }
  if (action === 'search') return showSearch();
  if (action === 'account') return showAccount();
  if (action === 'wishlist') return showWishlist();
  if (action === 'journal') return showJournal();
  if (action === 'read') return showJournal(Number(target.closest('article')?.dataset.index || 0));
  if (action === 'contact') return showContact();
  if (action === 'checkout') return openModal('Checkout', '<p>Your bag is ready.</p><p>This is a demo checkout screen. Connect a payment provider and order database to accept real orders.</p><button class="primary" data-action="close-cart">BACK TO SHOP</button>');
  if (action === 'menu') return showMenu();
  if (action === 'close') return closeModal();
  if (action === 'cart') return showCart();
  if (action === 'close-cart') { $('#drawer').classList.remove('open'); closeModal(); return; }
});

$('#overlay').addEventListener('click', (event) => { if (event.target === $('#overlay')) closeModal(); });
$('#newsletter').addEventListener('submit', (event) => { event.preventDefault(); openModal('You’re on the list ♡', '<p>Thank you for subscribing to MIRAE updates.</p>'); event.target.reset(); });
renderCategories(); renderProducts(); updateCart();