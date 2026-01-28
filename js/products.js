let cartCount = 0;
let currentCategory = 'all';
let currentPage = 1;

function addToCart(productName, price) {
 cartCount++;
 document.getElementById('cartBadge').textContent = cartCount;
 showNotification(`已将「${productName}」加入购物车`, 'success');
}

function quickView(productName) {
 const modal = document.getElementById('quickViewModal');
 const modalBody = document.getElementById('modalBody');
 
 modalBody.innerHTML = `
 <div class="quick-view-content">
 <div class="quick-view-image">
 <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 300'%3E%3Crect fill='%23A5D6A7' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%2343A047' font-size='72' font-family='Arial'%3E🌱%3C/text%3E%3C/svg%3E" alt="${productName}">
 </div>
 <div class="quick-view-info">
 <h4>${productName}</h4>
 <p class="price">¥128.00</p>
 <p class="description">这是一款高效的植保产品，能够有效防治农作物病虫害，保护作物健康生长。</p>
 <div class="features">
 <div class="feature-item">
 <i class="fas fa-check-circle"></i>
 <span>高效安全</span>
 </div>
 <div class="feature-item">
 <i class="fas fa-check-circle"></i>
 <span>持效期长</span>
 </div>
 <div class="feature-item">
 <i class="fas fa-check-circle"></i>
 <span>使用方便</span>
 </div>
 </div>
 <div class="quick-view-actions">
 <button class="btn btn-primary" onclick="addToCart('${productName}', 128)">
 <i class="fas fa-shopping-cart"></i> 加入购物车
 </button>
 <button class="btn btn-secondary" onclick="document.getElementById('quickViewModal').style.display='none'">
 关闭
 </button>
 </div>
 </div>
 </div>
 `;
 
 modal.style.display = 'flex';
 document.body.style.overflow = 'hidden';
}

function showNotification(message, type = 'info') {
 const notification = document.createElement('div');
 notification.className = `notification notification-${type}`;
 notification.innerHTML = `
 <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
 <span>${message}</span>
 <button class="notification-close">&times;</button>
 `;
 
 notification.style.cssText = `
 position: fixed;
 top: 20px;
 right: 20px;
 background: white;
 padding: 15px 20px;
 border-radius: 8px;
 box-shadow: 0 4px 12px rgba(0,0,0,0.15);
 display: flex;
 align-items: center;
 gap: 12px;
 z-index: 10000;
 animation: slideInRight 0.3s ease;
 border-left: 4px solid ${type === 'success' ? '#43A047' : type === 'error' ? '#F44336' : '#1976D2'};
 `;
 
 document.body.appendChild(notification);
 
 notification.querySelector('.notification-close').addEventListener('click', () => {
 notification.style.animation = 'slideOutRight 0.3s ease';
 setTimeout(() => notification.remove(), 300);
 });
 
 setTimeout(() => {
 notification.style.animation = 'slideOutRight 0.3s ease';
 setTimeout(() => notification.remove(), 300);
 }, 3000);
}

document.addEventListener('DOMContentLoaded', function() {
 const searchBtn = document.getElementById('searchBtn');
 const searchOverlay = document.getElementById('searchOverlay');
 const searchClose = document.getElementById('searchClose');
 const searchInput = document.getElementById('searchInput');
 
 searchBtn.addEventListener('click', () => {
 searchOverlay.style.display = 'flex';
 searchInput.focus();
 });
 
 searchClose.addEventListener('click', () => {
 searchOverlay.style.display = 'none';
 });
 
 searchOverlay.addEventListener('click', (e) => {
 if (e.target === searchOverlay) {
 searchOverlay.style.display = 'none';
 }
 });
 
 const categoryItems = document.querySelectorAll('.category-item');
 categoryItems.forEach(item => {
 item.addEventListener('click', () => {
 categoryItems.forEach(i => i.classList.remove('active'));
 item.classList.add('active');
 currentCategory = item.dataset.category;
 filterProducts();
 });
 });
 
 const priceMin = document.getElementById('priceMin');
 const priceMax = document.getElementById('priceMax');
 const priceMinValue = document.getElementById('priceMinValue');
 const priceMaxValue = document.getElementById('priceMaxValue');
 const priceFilterBtn = document.getElementById('priceFilterBtn');
 
 priceMin.addEventListener('input', () => {
 priceMinValue.textContent = priceMin.value;
 });
 
 priceMax.addEventListener('input', () => {
 priceMaxValue.textContent = priceMax.value;
 });
 
 priceFilterBtn.addEventListener('click', () => {
 filterProducts();
 showNotification('价格筛选已应用', 'success');
 });
 
 const sortSelect = document.getElementById('sortSelect');
 sortSelect.addEventListener('change', () => {
 sortProducts(sortSelect.value);
 });
 
 const modalClose = document.getElementById('modalClose');
 const modal = document.getElementById('quickViewModal');
 
 modalClose.addEventListener('click', () => {
 modal.style.display = 'none';
 document.body.style.overflow = 'auto';
 });
 
 modal.addEventListener('click', (e) => {
 if (e.target === modal) {
 modal.style.display = 'none';
 document.body.style.overflow = 'auto';
 }
 });
 
 const sidebarToggle = document.getElementById('sidebarToggle');
 const sidebar = document.getElementById('sidebar');
 
 sidebarToggle.addEventListener('click', () => {
 sidebar.classList.toggle('active');
 });
 
 const paginationPages = document.querySelectorAll('.pagination-page');
 const prevPage = document.getElementById('prevPage');
 const nextPage = document.getElementById('nextPage');
 
 paginationPages.forEach(page => {
 page.addEventListener('click', () => {
 paginationPages.forEach(p => p.classList.remove('active'));
 page.classList.add('active');
 currentPage = parseInt(page.dataset.page);
 updatePagination();
 showNotification(`已切换到第 ${currentPage} 页`, 'info');
 });
 });
 
 prevPage.addEventListener('click', () => {
 if (currentPage > 1) {
 currentPage--;
 paginationPages.forEach(p => p.classList.remove('active'));
 document.querySelector(`[data-page="${currentPage}"]`).classList.add('active');
 updatePagination();
 }
 });
 
 nextPage.addEventListener('click', () => {
 if (currentPage < 2) {
 currentPage++;
 paginationPages.forEach(p => p.classList.remove('active'));
 document.querySelector(`[data-page="${currentPage}"]`).classList.add('active');
 updatePagination();
 }
 });
 
 function updatePagination() {
 prevPage.disabled = currentPage === 1;
 nextPage.disabled = currentPage === 2;
 }
 
 function filterProducts() {
 const products = document.querySelectorAll('.product-card');
 let visibleCount = 0;
 
 products.forEach(product => {
 const category = product.dataset.category;
 const price = parseFloat(product.dataset.price);
 const minPrice = parseInt(priceMin.value);
 const maxPrice = parseInt(priceMax.value);
 
 const categoryMatch = currentCategory === 'all' || category === currentCategory;
 const priceMatch = price >= minPrice && price <= maxPrice;
 
 if (categoryMatch && priceMatch) {
 product.style.display = 'block';
 visibleCount++;
 } else {
 product.style.display = 'none';
 }
 });
 
 document.getElementById('productCount').textContent = visibleCount;
 }
 
 function sortProducts(sortBy) {
 const productsGrid = document.getElementById('productsGrid');
 const products = Array.from(document.querySelectorAll('.product-card'));
 
 switch(sortBy) {
 case 'price-asc':
 products.sort((a, b) => parseFloat(a.dataset.price) - parseFloat(b.dataset.price));
 break;
 case 'price-desc':
 products.sort((a, b) => parseFloat(b.dataset.price) - parseFloat(a.dataset.price));
 break;
 case 'sales':
 products.sort((a, b) => {
 const salesA = parseInt(a.querySelector('.rating-count').textContent.replace(/[()]/g, ''));
 const salesB = parseInt(b.querySelector('.rating-count').textContent.replace(/[()]/g, ''));
 return salesB - salesA;
 });
 break;
 case 'newest':
 products.reverse();
 break;
 default:
 break;
 }
 
 productsGrid.innerHTML = '';
 products.forEach(product => productsGrid.appendChild(product));
 }
 
 const style = document.createElement('style');
 style.textContent = `
 @keyframes slideInRight {
 from {
 transform: translateX(100%);
 opacity: 0;
 }
 to {
 transform: translateX(0);
 opacity: 1;
 }
 }
 
 @keyframes slideOutRight {
 from {
 transform: translateX(0);
 opacity: 1;
 }
 to {
 transform: translateX(100%);
 opacity: 0;
 }
 }
 
 .quick-view-content {
 display: grid;
 grid-template-columns: 1fr 1fr;
 gap: 30px;
 }
 
 .quick-view-image img {
 width: 100%;
 border-radius: 8px;
 }
 
 .quick-view-info h4 {
 font-size: 1.5rem;
 margin-bottom: 15px;
 }
 
 .quick-view-info .price {
 font-size: 2rem;
 font-weight: 700;
 color: #43A047;
 margin-bottom: 15px;
 }
 
 .quick-view-info .description {
 color: #757575;
 margin-bottom: 20px;
 line-height: 1.6;
 }
 
 .quick-view-info .features {
 margin-bottom: 20px;
 }
 
 .quick-view-info .feature-item {
 display: flex;
 align-items: center;
 gap: 10px;
 margin-bottom: 10px;
 color: #43A047;
 }
 
 .quick-view-actions {
 display: flex;
 gap: 15px;
 }
 
 @media (max-width: 768px) {
 .quick-view-content {
 grid-template-columns: 1fr;
 }
 
 .quick-view-actions {
 flex-direction: column;
 }
 }
 `;
 document.head.appendChild(style);
 
 console.log('产品页面已加载完成');
});