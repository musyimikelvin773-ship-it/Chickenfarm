// script.js
// 1) Smooth scroll to #sectorSection when viewCatalogBtn is clicked
(function(){
    const viewBtn = document.getElementById('viewCatalogBtn');
    const sector = document.getElementById('sectorSection');
    if(viewBtn && sector){
        viewBtn.addEventListener('click', function(e){
            e.preventDefault();
            sector.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // 2) Inquire buttons: when clicked, find nearest card's h3 and alert
    function handleInquireClick(e){
        const btn = e.currentTarget;
        // find nearest card ancestor (.product-card or .sector-card)
        const card = btn.closest('.product-card, .sector-card');
        if(!card){
            alert('You are inquiring about this item. We will contact you shortly!');
            return;
        }
        const titleEl = card.querySelector('h3');
        const productName = titleEl ? titleEl.textContent.trim() : 'this product';
        alert(`You are inquiring about ${productName}. We will contact you shortly!`);
    }

    const inquireBtns = document.querySelectorAll('.inquire-btn');
    if(inquireBtns.length){
        inquireBtns.forEach(b => b.addEventListener('click', handleInquireClick));
    }
})();
