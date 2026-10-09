const $=s=>document.querySelector(s),$=s=>[...document.querySelectorAll(s)];
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let csrfToken='';
const categories=[['DRESSES','cat-dresses.jpg'],['TOPS','cat-tops.jpg'],['CO-ORD SETS','cat-coord.jpg'],['JACKETS','cat-jackets.jpg'],['ACCESSORIES','cat-accessories.jpg'],['LOUNGEWEAR','cat-lounge.jpg']];
let products=[
 ['Linen Maxi Dress','₹2,499','DRESSES','product-1.jpg','Lightweight linen with an effortless everyday silhouette.',['S','M','L','XL']],
 ['Floral Wrap Dress','₹2,499','DRESSES','product-2.jpg','A feminine floral wrap dress made for sunny days.',['S','M','L','XL']],
 ['Satin Cowl Top','₹1,499','TOPS','product-3.jpg','A fluid satin top with an elegant cowl neckline.',['S','M','L']],
 ['Pleated Midi Skirt','₹1,899','SKIRTS','product-4.jpg','A graceful pleated skirt that moves with you.',['S','M','L']],
 ['Linen Co-ord Set','₹2,799','CO-ORD SETS','product-5.jpg','A relaxed matching set for polished everyday dressing.',['S','M','L','XL']]
];
const articles=[['5 Ways to Style Linen This Summer','Simple styling ideas for breathable, timeless linen pieces.'],['Wardrobe Staples You Need','The versatile essentials that make getting dressed easier.'],['Neutral Tones, Endless Possibilities','Build a calm, coordinated wardrobe with neutral shades.']];
const heroSlides=[{title:'Confidence\\nLooks Good\\nOn You.',text:'Effortless styles for your everyday moments.',image:'/hero-photo.jpg'},{title:'Everyday\\nElegance.',text:'Timeless pieces designed for effortless styling.',image:'/editorial.jpg'},{title:'Wear Your\\nStory.',text:'Discover pieces that feel like you.',image:'/journal-1.jpg'}];
const readJSON=(key,fallback)=>{try{const v=JSON.parse(localStorage.getItem(key)||'');return v??fallback}catch{return fallback}};
const normalizeCart=items=>Array.isArray(items)?items.map(x=>typeof x==='number'?{i:x,size:'M',qty:1}:x).filter(x=>x&&Number.isInteger(x.i)&&x.i>=0&&x.i<products.length&&typeof x.size==='string'&&products[x.i][5].includes(x.size)&&Number.isInteger(x.qty)&&x.qty>0):[];
const storedWish=readJSON('mirae-wish',[]);const state={cart:normalizeCart(readJSON('mirae-cart',[])),wish:Array.isArray(storedWish)?storedWish.filter(i=>Number.isInteger(i)&&i>=0&&i<products.length):[],filter:'all'};
let lastFocus=null;let supabaseClient=null;
async function getSupabase(){
 if(supabaseClient)return supabaseClient;
 try{
  const cfg=await fetch('/api/config').then(r=>r.ok?r.json():null);
  if(!cfg?.supabaseUrl||!cfg?.supabasePublishableKey)return null;
  const mod=await import('https://esm.sh/@supabase/supabase-js@2');
  supabaseClient=mod.createClient(cfg.supabaseUrl,cfg.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:true}});
  return supabaseClient;
 }catch{return null}
}
async function currentSession(){const sb=await getSupabase();if(!sb)return null;const {data}=await sb.auth.getSession();return data.session||null}
const productionProducts=rows=>rows.map(p=>[
 p.name, `₹${Number(p.price_inr).toLocaleString('en-IN')}`, String(p.category||'').toUpperCase(),
 Array.isArray(p.images)&&p.images[0]?p.images[0]: 'product-1.jpg', p.description||'', Array.isArray(p.available_sizes)&&p.available_sizes.length?p.available_sizes:['S','M','L'], p.id, p.slug || p.id
]);
async function loadProducts(){
 try{
  const r=await fetch('/api/products',{headers:{Accept:'application/json'}});
  if(!r.ok)return;
  const data=await r.json();
  if(Array.isArray(data.products)&&data.products.length){
   products=productionProducts(data.products);
   state.cart=normalizeCart(state.cart);
   state.wish=state.wish.filter(i=>i<products.length);
   renderProducts();updateCart();
  }
 }catch{}
}
async function getCsrfToken(){
 if(csrfToken)return csrfToken;
 try{
  const r=await fetch('/api/csrf',{headers:{Accept:'application/json'}});
  const d=await r.json();
  if(r.ok&&d.csrfToken){csrfToken=d.csrfToken;return csrfToken}
 }catch{}
 return '';
}
async function postJSON(url,payload,token){
 const csrf=await getCsrfToken();
 const headers={'Content-Type':'application/json',Accept:'application/json'};if(token)headers.Authorization=`Bearer ${token}`;if(csrf)headers['X-CSRF-Token']=csrf;
 const r=await fetch(url,{method:'POST',headers,body:JSON.stringify(payload)});
 const data=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(data.error||'Request failed.');
 return data;
}
const asset=n=>{const s=String(n||'');return /^https?:\/\//i.test(s)||s.startsWith('/')?s:`/${s}`};
function save(){try{localStorage.setItem('mirae-cart',JSON.stringify(state.cart));localStorage.setItem('mirae-wish',JSON.stringify(state.wish))}catch{}}
function openModal(title,body,ready){lastFocus=document.activeElement;$('#modal-content').innerHTML=`<h2 id="modal-title">${escapeHTML(title)}</h2>${body}`;$('#overlay').hidden=false;document.body.classList.add('modal-open');ready?.();setTimeout(()=>$('#overlay .modal button,#overlay .modal input,#overlay .modal textarea')?.focus(),0)}
function closeModal(){if($('#overlay').hidden)return;$('#overlay').hidden=true;document.body.classList.remove('modal-open');lastFocus?.focus?.()}
function renderCategories(){$('#categories').innerHTML=categories.map(([n,img])=>`<div class="category-wrap"><button class="category" data-category="${escapeHTML(n)}" aria-label="Shop ${escapeHTML(n.toLowerCase())}"><img src="${escapeHTML(asset(img))}" alt="${escapeHTML(n)}" loading="lazy"></button><span>${escapeHTML(n)}</span></div>`).join('')}
function renderProducts(){const rows=products.map((p,i)=>({p,i})).filter(x=>state.filter==='all'||x.p[2]===state.filter);$('#products').innerHTML=rows.map(({p,i})=>`<article class="product"><button class="heart" data-wish="${i}" aria-label="${state.wish.includes(i)?'Remove':'Add'} ${escapeHTML(p[0])} ${state.wish.includes(i)?'from':'to'} wishlist">${state.wish.includes(i)?'♥':'♡'}</button><button class="product-image" data-product="${i}" aria-label="View ${escapeHTML(p[0])}"><img src="${escapeHTML(asset(p[3]))}" alt="${escapeHTML(p[0])}" loading="lazy"></button><h3>${escapeHTML(p[0])}</h3><p class="price">${escapeHTML(p[1])}</p><div class="swatches" aria-hidden="true"><i></i><i></i><i></i></div><button class="primary" data-add="${i}">ADD TO BAG</button><button class="text-button" data-product="${i}">VIEW DETAILS</button></article>`).join('')||'<p>No pieces in this collection yet.</p>'}
function cartCount(){return state.cart.reduce((n,x)=>n+x.qty,0)}
function updateCart(){save();$('#cart-count').textContent=cartCount();$('#cart-items').innerHTML=state.cart.length?state.cart.map((x,line)=>{const p=products[x.i];return`<div class="cart-line"><span><b>${escapeHTML(p[0])}</b><small>Size ${escapeHTML(x.size)} · ${escapeHTML(p[1])}</small><span class="qty"><button data-qty="-1" data-line="${line}" aria-label="Decrease quantity">−</button><b>${x.qty}</b><button data-qty="1" data-line="${line}" aria-label="Increase quantity">+</button></span></span><button data-remove="${line}" aria-label="Remove ${escapeHTML(p[0])}">×</button></div>`}).join(''):'<p>Your bag is empty.</p>';const total=state.cart.reduce((s,x)=>s+Number(products[x.i][1].replace(/[^0-9]/g,''))*x.qty,0);$('#cart-total').textContent=`₹${total.toLocaleString('en-IN')}`}
function showCart(){$('#drawer').classList.add('open');updateCart()}
function addToCart(i,size='M'){const existing=state.cart.find(x=>x.i===i&&x.size===size);if(existing)existing.qty++;else state.cart.push({i,size,qty:1});showCart()}
function showProduct(i){const p=products[i];const slug=p[7]||p[6]||encodeURIComponent(p[0].toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''));const sizes=p[5].map(s=>'<option value="'+escapeHTML(s)+'">'+escapeHTML(s)+'</option>').join('');openModal(p[0],'<img class="modal-product-image" src="'+escapeHTML(asset(p[3]))+'" alt="'+escapeHTML(p[0])+'"><p>'+escapeHTML(p[4])+'</p><h3>'+escapeHTML(p[1])+'</h3><p>Category: '+escapeHTML(p[2])+'</p><label for="product-size"><b>Size</b></label><select id="product-size">'+sizes+'</select><button class="primary" data-modal-add="'+i+'">ADD TO BAG →</button><p><a class="text-button" href="/product.html?slug='+encodeURIComponent(slug)+'">VIEW FULL PRODUCT PAGE →</a></p>')}
function showWishlist(){openModal('Your Wishlist',state.wish.map(i=>`<p><b>${escapeHTML(products[i][0])}</b> — ${escapeHTML(products[i][1])} <button data-product="${i}">View</button></p>`).join('')||'<p>Your wishlist is waiting for a little love ♡</p>')}
function showSearch(){openModal('Find your style','<p>Search products by name or category.</p><label class="sr-only" for="search-input">Search products</label><input id="search-input" placeholder="Try linen, dresses or tops" autocomplete="off"><div id="search-results"></div>');const input=$('#search-input');const render=()=>{const q=input.value.toLowerCase();$('#search-results').innerHTML=products.map((p,i)=>({p,i})).filter(x=>`${x.p[0]} ${x.p[2]}`.toLowerCase().includes(q)).map(x=>`<p><button class="text-button" data-product="${x.i}">${escapeHTML(x.p[0])} — ${escapeHTML(x.p[1])}</button></p>`).join('')||'<p>No matching styles found.</p>'};input.addEventListener('input',render);render();input.focus()}
async function showMfaEnroll(){
 const sb=await getSupabase();if(!sb)return;
 const {data,error}=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'MIRAE'});
 if(error){openModal('2FA setup','<p>'+escapeHTML(error.message)+'</p>');return}
 const qr='data:image/svg+xml,'+encodeURIComponent(data.totp.qr_code);
 openModal('Enable 2FA','<p>Scan this QR code with your authenticator app, then enter the 6-digit code.</p><img class="mfa-qr" src="'+escapeHTML(qr)+'" alt="2FA setup QR code"><p><small>Secret: '+escapeHTML(data.totp.secret)+'</small></p><form id="mfa-enroll-form"><input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required placeholder="6-digit code"><button class="primary">ENABLE 2FA</button></form><p id="mfa-message"></p>');
 $('#mfa-enroll-form').addEventListener('submit',async e=>{e.preventDefault();const m=$('#mfa-message');const challenge=await sb.auth.mfa.challenge({factorId:data.id});if(challenge.error){m.textContent=challenge.error.message;return}const verify=await sb.auth.mfa.verify({factorId:data.id,challengeId:challenge.data.id,code:e.target.code.value.trim()});m.textContent=verify.error?verify.error.message:'2FA enabled successfully.';if(!verify.error)setTimeout(showAccount,600)});
}
async function requireMfaIfEnrolled(){
 const sb=await getSupabase();if(!sb)return false;
 const aal=await sb.auth.mfa.getAuthenticatorAssuranceLevel();if(aal.error||aal.data?.currentLevel==='aal2'||aal.data?.nextLevel!=='aal2')return true;
 const factors=await sb.auth.mfa.listFactors();const factor=factors.data?.totp?.find(f=>f.status==='verified');if(!factor)return true;
 openModal('Two-factor verification','<p>Enter the code from your authenticator app.</p><form id="mfa-login-form"><input name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" required placeholder="6-digit code"><button class="primary">VERIFY</button></form><p id="mfa-login-message"></p>');
 $('#mfa-login-form').addEventListener('submit',async e=>{e.preventDefault();const m=$('#mfa-login-message');const result=await sb.auth.mfa.challengeAndVerify({factorId:factor.id,code:e.target.code.value.trim()});if(result.error){m.textContent=result.error.message;return}closeModal();showAccount()});
 return false;
}
async function showAccount(){
 const session=await currentSession();
 if(session){
  openModal('Your MIRAE Account','<p>Signed in as <b>'+escapeHTML(session.user.email)+'</b>.</p><div id="account-orders"><p>Loading order history…</p></div><button class="primary" data-auth-mfa>ENABLE 2FA</button><button class="text-button" data-auth-logout>SIGN OUT</button><button class="text-button" data-auth-reset>RESET PASSWORD</button>');
  await renderOrders(session);$('#overlay').querySelector('[data-auth-mfa]')?.addEventListener('click',showMfaEnroll);
  return;
 }
 openModal('Your MIRAE Account','<p>Use your email to sign in and view orders.</p><form id="account-form"><input name="email" type="email" required autocomplete="email" placeholder="Email address"><input name="password" type="password" required minlength="6" autocomplete="current-password" placeholder="Password"><button class="primary">SIGN IN</button><button type="button" class="text-button" data-auth-signup>CREATE ACCOUNT</button><button type="button" class="text-button" data-auth-reset>FORGOT PASSWORD?</button></form><p id="account-message"></p><div id="account-orders"></div>');$('#account-form').addEventListener('submit',async e=>{e.preventDefault();const m=$('#account-message');m.textContent='Signing in…';const sb=await getSupabase();if(!sb){m.textContent='Authentication is not configured yet.';return}const {data,error}=await sb.auth.signInWithPassword({email:e.target.email.value,password:e.target.password.value});if(error){m.textContent=error.message;return}m.textContent='Signed in successfully.';if(await requireMfaIfEnrolled())await renderOrders(data.session)});$('#overlay').querySelector('[data-auth-signup]').addEventListener('click',async()=>{const f=$('#account-form'),m=$('#account-message'),sb=await getSupabase();if(!sb){m.textContent='Authentication is not configured yet.';return}m.textContent='Creating account…';const {error}=await sb.auth.signUp({email:f.email.value,password:f.password.value});m.textContent=error?error.message:'Account created. Check your email to verify your address.'});
 $('#overlay').querySelector('[data-auth-reset]')?.addEventListener('click',async()=>{const f=$('#account-form'),m=$('#account-message'),sb=await getSupabase();if(!sb){m.textContent='Authentication is not configured yet.';return}if(!f?.email?.value){m.textContent='Enter your email first.';return}const {error}=await sb.auth.resetPasswordForEmail(f.email.value,{redirectTo:location.origin});m.textContent=error?error.message:'Password reset email sent.'});
}
async function renderOrders(session){if(!session)return;const box=$('#account-orders');if(!box)return;try{const r=await fetch('/api/orders',{headers:{Authorization:'Bearer '+session.access_token}}),d=await r.json();const rows=(d.orders||[]).map(o=>'<p><b>#'+escapeHTML(String(o.id).slice(0,8))+'</b> · '+escapeHTML(o.status)+' · ₹'+Number(o.total_inr).toLocaleString('en-IN')+'</p>').join('');box.innerHTML='<h3>Order history</h3>'+(rows||'<p>No orders yet.</p>')}catch{box.innerHTML='<p>Unable to load orders.</p>'}}
function showJournal(i=null){openModal(i===null?'From the Journal':articles[i][0],i===null?articles.map((a,j)=>`<p><b>${a[0]}</b><br>${a[1]}<br><button class="text-button" data-article="${j}">READ ARTICLE →</button></p>`).join(''):`<p>${articles[i][1]}</p><p>Read more styling inspiration in the next MIRAE editorial edition.</p>`)}
function showContact(){openModal('We’re here to help','<p>Our support team is happy to help.</p><form id="contact-form"><input required autocomplete="name" placeholder="Your name"><input type="email" required autocomplete="email" placeholder="Email address"><textarea required placeholder="How can we help?"></textarea><button class="primary">SEND MESSAGE</button></form><p id="contact-message"></p>');$('#contact-form').addEventListener('submit',async e=>{e.preventDefault();const m=$('#contact-message');m.textContent='Sending…';try{await postJSON('/api/contact',{name:e.target.elements[0].value,email:e.target.elements[1].value,message:e.target.elements[2].value});m.textContent='Thanks! Your message has been sent.';e.target.reset()}catch(err){m.textContent=err.message}})}
function showMenu(){openModal('MIRAE Menu','<div class="menu-links"><button data-scroll="#new">New Arrivals</button><button data-scroll="#shop">Shop</button><button data-scroll="#collections">Collections</button><button data-scroll="#about">About</button><button data-scroll="#journal">Journal</button></div>')}
function setHero(i){const s=heroSlides[i];if(!s)return;$('.hero h1').textContent=s.title.replace(/\\n/g,'\n');$('.hero-copy>p:not(.eyebrow)').textContent=s.text;$('.hero-image img').src=s.image;$$('[data-hero]').forEach((b,n)=>b.classList.toggle('active',n===i))}
document.addEventListener('click',e=>{const t=e.target.closest('button,a');if(!t)return;const d=t.dataset,a=d.action;if(d.action||d.filter!==undefined||d.category||d.scroll||d.product!==undefined||d.add!==undefined||d.modalAdd!==undefined||d.wish!==undefined||d.article!==undefined||d.remove!==undefined||d.qty!==undefined)e.preventDefault();
if(d.add!==undefined){showProduct(+d.add);return}
if(d.modalAdd!==undefined){addToCart(+d.modalAdd,$('#product-size')?.value||'M');closeModal();return}
if(d.remove!==undefined){state.cart.splice(+d.remove,1);updateCart();return}
if(d.qty!==undefined){const line=+d.line;if(!state.cart[line])return;state.cart[line].qty+=+d.qty;if(state.cart[line].qty<=0)state.cart.splice(line,1);updateCart();return}
if(d.product!==undefined){showProduct(+d.product);return}
if(d.wish!==undefined){const i=+d.wish;state.wish=state.wish.includes(i)?state.wish.filter(x=>x!==i):[...state.wish,i];renderProducts();save();return}
if(d.article!==undefined){showJournal(+d.article);return}
if(d.category){state.filter=d.category;renderProducts();$('#new').scrollIntoView({behavior:'smooth'});return}
if(d.filter!==undefined){state.filter='all';renderProducts();$('#new').scrollIntoView({behavior:'smooth'});return}
if(d.scroll){closeModal();document.querySelector(d.scroll)?.scrollIntoView({behavior:'smooth'});return}
if(d.hero!==undefined){setHero(+d.hero);return}
if(d.authLogout!==undefined){(async()=>{const sb=await getSupabase();if(sb)await sb.auth.signOut();closeModal();showAccount()})();return}
if(d.authReset!==undefined){(async()=>{const sb=await getSupabase(),session=await currentSession();if(!sb||!session)return;const {error}=await sb.auth.resetPasswordForEmail(session.user.email,{redirectTo:location.origin});openModal('Password reset',error?'<p>'+escapeHTML(error.message)+'</p>':'<p>Password reset email sent.</p>')})();return}
if(a==='search')return showSearch();if(a==='account')return showAccount();if(a==='wishlist')return showWishlist();if(a==='journal')return showJournal();if(a==='read')return showJournal(0);if(a==='contact')return showContact();if(a==='checkout')return startCheckout();if(a==='menu')return showMenu();if(a==='close')return closeModal();if(a==='cart')return showCart();if(a==='close-cart'){$('#drawer').classList.remove('open');return}});
$('#overlay').addEventListener('click',e=>{if(e.target===$('#overlay'))closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#overlay').hidden)closeModal();else $('#drawer').classList.remove('open')}});
async function startCheckout(){
 const n=cartCount(); if(!n)return;
 $('#drawer').classList.remove('open');
 openModal('Checkout','<p>'+n+' item(s) in your bag.</p><form id="checkout-form"><input name="email" type="email" required autocomplete="email" placeholder="Email address"><input name="name" required autocomplete="name" placeholder="Full name"><input name="phone" required inputmode="numeric" pattern="[0-9]{10}" autocomplete="tel" placeholder="10-digit phone"><textarea name="address" required autocomplete="street-address" placeholder="Address"></textarea><div class="checkout-row"><input name="city" required autocomplete="address-level2" placeholder="City"><input name="state" required autocomplete="address-level1" placeholder="State"></div><input name="pincode" required inputmode="numeric" pattern="[0-9]{6}" autocomplete="postal-code" placeholder="6-digit PIN"><button class="primary">PLACE DEMO ORDER →</button></form><p id="checkout-message"></p>');
 $('#checkout-form').addEventListener('submit',async e=>{
  e.preventDefault();const f=e.target,m=$('#checkout-message');m.textContent='Creating your demo order…';
  try{
   const session=await currentSession();
   const shipping={name:f.name.value.trim(),phone:f.phone.value.trim(),address:f.address.value.trim(),city:f.city.value.trim(),state:f.state.value.trim(),pincode:f.pincode.value.trim()};
   const data=await postJSON('/api/checkout',{items:state.cart.map(x=>({product_id:products[x.i][6],quantity:x.qty,size:x.size})),customer_email:f.email.value.trim(),shipping_address:shipping},session?.access_token);
   if(!data.orderId)throw new Error('Unable to create the demo order.');
   state.cart=[];save();updateCart();
   openModal('Order confirmed ♡','<p>This is a portfolio demo checkout — no payment was charged.</p><p>Your MIRAE demo order <b>#'+String(data.localOrderId||data.orderId).slice(0,8)+'</b> has been placed and inventory was reserved.</p><button class="primary" data-action="account">VIEW ORDER HISTORY</button>');
  }catch(err){m.textContent=err.message}
 });
}
$('#newsletter').addEventListener('submit',async e=>{e.preventDefault();const email=e.target.elements[0].value;try{await postJSON('/api/newsletter',{email});openModal('You’re on the list ♡','<p>Thank you for subscribing to MIRAE updates.</p>');e.target.reset()}catch(err){openModal('Subscription unavailable',`<p>${escapeHTML(err.message)}</p>`)}});
renderCategories();renderProducts();updateCart();loadProducts();