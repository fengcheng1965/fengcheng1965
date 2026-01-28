const API_BASE_URL = 'http://localhost:3000/api';

let cartCount = 0;
let currentCategory = 'all';
let currentPage = 1;
let allProducts = [];

async function fetchProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    const result = await response.json();
    if (result.success) {
      allProducts = result.data;
      renderProducts(allProducts);
      document.getElementById('productCount').textContent = allProducts.length;
    }
  } catch (error) {
    console.error('获取产品失败:', error);
    showNotification('获取产品数据失败', 'error');
  }
}

function renderProducts(products) {
  const productsGrid = document.getElementById('productsGrid');
  productsGrid.innerHTML = '';
  
  products.forEach(product => {
    const productCard = document.createElement('article');
    productCard.className = 'product-card';
    productCard.dataset.category = product.category;
    productCard.dataset.price = product.price;
    productCard.dataset.brand = product.brand;
    productCard.dataset.id = product.id;
    
    productCard.innerHTML = `
      <div class="product-image">
        <img src="${product.image_url || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 200\'%3E%3Crect fill=\'%23A5D6A7\' width=\'200\' height=\'200\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%2343A047\' font-size=\'48\' font-family=\'Arial\'%3E🌱%3C/text%3E%3C/svg%3E'}" alt="${product.name}">
        <div class="product-actions">
          <button class="action-btn quick-view-btn" onclick="quickView(${product.id})" title="快速预览">
            <i class="fas fa-eye"></i>
          </button>
          <button class="action-btn" onclick="addToCart('${product.name}', ${product.price})" title="加入购物车">
            <i class="fas fa-shopping-cart"></i>
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <p class="product-category">${product.category}</p>
        <div class="product-meta">
          <span class="product-brand">${product.brand}</span>
          <span class="product-stock">库存: ${product.stock}</span>
        </div>
        <div class="product-price">
          <span class="current-price">¥${product.price}</span>
          ${product.original_price ? `<span class="original-price">¥${product.original_price}</span>` : ''}
        </div>
        <button class="btn btn-primary btn-block" onclick="addToCart('${product.name}', ${product.price})">
          加入购物车
        </button>
      </div>
    `;
    
    productsGrid.appendChild(productCard);
  });
}

async function quickView(productId) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);
    const result = await response.json();
    
    if (result.success) {
      const product = result.data;
      const modal = document.getElementById('quickViewModal');
      const modalBody = document.getElementById('modalBody');
      
      modalBody.innerHTML = `
        <div class="quick-view-content">
          <div class="quick-view-image">
            <img src="${product.image_url || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 300 300\'%3E%3Crect fill=\'%23A5D6A7\' width=\'300\' height=\'300\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%2343A047\' font-size=\'72\' font-family=\'Arial\'%3E🌱%3C/text%3E%3C/svg%3E'}" alt="${product.name}">
          </div>
          <div class="quick-view-info">
            <h4>${product.name}</h4>
            <p class="price">¥${product.price}</p>
            ${product.original_price ? `<p class="original-price">原价: ¥${product.original_price}</p>` : ''}
            <p class="description">${product.description || '暂无描述'}</p>
            ${product.specifications ? `<p class="specs"><strong>规格:</strong> ${product.specifications}</p>` : ''}
            ${product.usage_instructions ? `<p class="usage"><strong>使用说明:</strong> ${product.usage_instructions}</p>` : ''}
            ${product.precautions ? `<p class="precautions"><strong>注意事项:</strong> ${product.precautions}</p>` : ''}
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
              <button class="btn btn-primary" onclick="addToCart('${product.name}', ${product.price})">
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
  } catch (error) {
    console.error('获取产品详情失败:', error);
    showNotification('获取产品详情失败', 'error');
  }
}

function addToCart(productName, price) {
  cartCount++;
  document.getElementById('cartBadge').textContent = cartCount;
  showNotification(`已将「${productName}」加入购物车`, 'success');
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
  fetchProducts();
  
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
    
    .quick-view-info .original-price {
      font-size: 1rem;
      color: #999;
      text-decoration: line-through;
      margin-bottom: 15px;
    }
    
    .quick-view-info .description {
      color: #757575;
      margin-bottom: 20px;
      line-height: 1.6;
    }
    
    .quick-view-info .specs,
    .quick-view-info .usage,
    .quick-view-info .precautions {
      margin-bottom: 10px;
      color: #555;
      line-height: 1.5;
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
