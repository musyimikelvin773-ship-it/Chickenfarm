// script.js - Agro-Boutique homepage logic
// Single-file front-end logic: Supabase fetch (optional), product rendering, buy flow (M-Pesa STK simulation), PDF receipt via jsPDF, search, sort, category filters, contact/newsletter handlers.

const SUPABASE_URL = "https://your-project.supabase.co"; // <-- replace
const SUPABASE_ANON_KEY = "public-anon-key"; // <-- replace

// Helper: format KES
function formatKES(n){ return `KES ${Number(n).toLocaleString()}`; }

const sampleProducts = [
    { id:'s1', name:'Improved Kienyeji Broiler (Day-old)', price:85, image:'https://via.placeholder.com/800x600?text=Vercel+Blob', location:'Kitui Farm' },
    { id:'s2', name:'Layer Pullets (1 month)', price:110, image:'https://via.placeholder.com/800x600?text=Vercel+Blob', location:'Kitui Farm' },
    { id:'s3', name:'Mature Kienyeji Rooster', price:950, image:'https://via.placeholder.com/800x600?text=Vercel+Blob', location:'Kitui Farm' },
    { id:'s4', name:'Fertilized Eggs (Tray)', price:240, image:'https://via.placeholder.com/800x600?text=Vercel+Blob', location:'Kitui Farm' }
];

// Init Supabase if configured
let supabaseClient = null;
try{
    if(SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project')){
        // global variable from CDN is 'supabase'
        supabaseClient = supabase.createClient ? supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY) : null;
    }
}catch(e){ console.warn('Supabase init failed', e); supabaseClient = null; }

async function fetchProducts(){
    if(!supabaseClient) return sampleProducts;
    try{
        const { data, error } = await supabaseClient.from('chickens').select('*').order('created_at',{ascending:false}).limit(40);
        if(error) { console.warn(error); return sampleProducts; }
        if(!data || data.length===0) return sampleProducts;
        return data.map(d=>({ id:d.id||d.product_id, name:d.name||d.title, price:d.price||d.amount, image:d.image_url||'https://via.placeholder.com/800x600?text=Vercel+Blob', location:d.location||'Kitui Farm' }));
    }catch(e){ console.warn(e); return sampleProducts; }
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function renderProducts(products){
    const grid = document.getElementById('productGrid');
    if(!grid) return;
    grid.innerHTML = '';
    products.forEach(p=>{
        const article = document.createElement('article');
        article.className = 'product-card';
        article.innerHTML = `
            <img src="${p.image}" alt="${escapeHtml(p.name)}">
            <div class="product-body">
                <h3>${escapeHtml(p.name)}</h3>
                <div class="product-meta">
                    <div class="price">${formatKES(p.price)}</div>
                    <div class="badge">${escapeHtml(p.location)}</div>
                </div>
                <div style="margin-top:10px;display:flex;justify-content:space-between;align-items:center">
                    <button class="buy-btn" data-id="${p.id}" data-name="${escapeHtml(p.name)}" data-price="${p.price}">Buy Now</button>
                </div>
            </div>
        `;
        grid.appendChild(article);
    });
    attachBuyHandlers();
}

function attachBuyHandlers(){
    document.querySelectorAll('.buy-btn').forEach(b=>{
        b.removeEventListener('click', onBuyClick);
        b.addEventListener('click', onBuyClick);
    });
}

async function onBuyClick(e){
    const btn = e.currentTarget;
    const name = btn.dataset.name;
    const price = Number(btn.dataset.price||0);
    let phone = prompt(`Enter phone number to pay ${formatKES(price)} (e.g. 07XXXXXXXX or +2547XXXXXXXX):`);
    if(!phone) return alert('Payment cancelled');
    phone = phone.trim();
    const cleaned = phone.replace(/\s|-/g,'');
    if(!/^\+?\d{9,14}$/.test(cleaned)) return alert('Please enter a valid phone number');

    const ok = confirm(`Simulate M-Pesa STK Push to ${cleaned} for ${formatKES(price)}?`);
    if(!ok) return alert('Payment cancelled');

    // simulate async
    await new Promise(r=>setTimeout(r,900));
    alert('Payment successful (simulated). Preparing receipt...');

    try{
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({unit:'pt', format:'a4'});
        doc.setFontSize(16);
        doc.text("Paul's Chicken Farm - Receipt",40,60);
        doc.setFontSize(12);
        doc.text(`Product: ${name}`,40,100);
        doc.text(`Amount: ${formatKES(price)}`,40,120);
        doc.text(`Phone: ${cleaned}`,40,140);
        doc.text(`Date: ${new Date().toLocaleString()}`,40,160);
        const filename = `receipt_${new Date().toISOString().replace(/[:.]/g,'-')}.pdf`;
        doc.save(filename);
    }catch(err){ console.warn('PDF failed', err); alert('Payment recorded (simulated).'); }
}

function setupSearchAndSort(products){
    const search = document.getElementById('siteSearch');
    const sort = document.getElementById('sortSelect');
    function refresh(){
        const q = (search && search.value || '').toLowerCase().trim();
        let filtered = products.filter(p => p.name.toLowerCase().includes(q));
        const mode = sort && sort.value;
        if(mode==='price-asc') filtered.sort((a,b)=>a.price-b.price);
        if(mode==='price-desc') filtered.sort((a,b)=>b.price-a.price);
        renderProducts(filtered);
    }
    if(search) search.addEventListener('input', refresh);
    if(sort) sort.addEventListener('change', refresh);
}

function setupShopNow(){
    const btn = document.getElementById('shopNow');
    const grid = document.getElementById('productGrid');
    if(btn && grid) btn.addEventListener('click', ()=> grid.scrollIntoView({behavior:'smooth'}));
}

function setupCategories(products){
    document.querySelectorAll('.cat').forEach(catBtn=>{
        catBtn.addEventListener('click', ()=>{
            const label = (catBtn.querySelector('.cat-label')||{}).textContent || '';
            const key = label.split(' ')[0].toLowerCase();
            const filtered = products.filter(p=> p.name.toLowerCase().includes(key) || p.name.toLowerCase().includes(label.toLowerCase()));
            renderProducts(filtered.length?filtered:products);
            document.getElementById('productGrid').scrollIntoView({behavior:'smooth'});
        });
    });
}

function setupContact(){
    const contactForm = document.getElementById('contactForm');
    if(contactForm){
        contactForm.addEventListener('submit', e=>{
            e.preventDefault();
            const fd = new FormData(contactForm);
            const name = fd.get('name');
            const phone = fd.get('phone');
            const message = fd.get('message');
            const subject = encodeURIComponent('Website enquiry from ' + name);
            const body = encodeURIComponent(`Name: ${name}%0APhone: ${phone}%0A%0A${message}`);
            window.location.href = `mailto:info@paulschicken.example?subject=${subject}&body=${body}`;
        });
    }
    const newsletter = document.getElementById('newsletterForm');
    if(newsletter){
        newsletter.addEventListener('submit', e=>{ e.preventDefault(); alert('Thanks — subscription simulated.'); newsletter.reset(); });
    }
}

(async function init(){
    setupShopNow();
    const products = await fetchProducts();
    renderProducts(products);
    setupSearchAndSort(products);
    setupCategories(products);
    setupContact();
})();

