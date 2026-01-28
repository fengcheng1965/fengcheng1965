const API_BASE_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function() {
  const navbar = document.getElementById('navbar');
  const navbarMenu = document.getElementById('navbarMenu');
  const navbarToggle = document.getElementById('navbarToggle');
  const navLinks = document.querySelectorAll('.nav-link');

  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  navbarToggle.addEventListener('click', function() {
    navbarMenu.classList.toggle('active');
    navbarToggle.classList.toggle('active');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          const offsetTop = targetElement.offsetTop - 70;
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          });
        }
        
        navbarMenu.classList.remove('active');
        navbarToggle.classList.remove('active');
      }
    });
  });

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  const animateElements = document.querySelectorAll('.service-card, .product-card, .about-text, .contact-info, .contact-form');
  animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      const contactForm = document.querySelector('#contact form');
      const messageForm = document.querySelector('#message form');
      
      if (contactForm || messageForm) {
        try {
          const response = await fetch(`${API_BASE_URL}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: data.name || data.customerName || '匿名用户',
              email: data.email || '',
              phone: data.phone || '',
              subject: data.subject || '在线咨询',
              content: data.message || data.content || ''
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            showNotification('留言已提交，我们会尽快与您联系！', 'success');
            this.reset();
          } else {
            showNotification('提交失败，请稍后重试', 'error');
          }
        } catch (error) {
          console.error('提交留言失败:', error);
          showNotification('提交失败，请检查网络连接', 'error');
        }
      } else {
        console.log('表单提交:', data);
        showNotification('表单已提交', 'success');
        this.reset();
      }
    });
  });

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
  `;
  document.head.appendChild(style);

  const productButtons = document.querySelectorAll('.product-card .btn');
  productButtons.forEach(button => {
    button.addEventListener('click', function() {
      const productTitle = this.closest('.product-card').querySelector('.product-title').textContent;
      showNotification(`已将「${productTitle}」加入购物车`, 'success');
    });
  });

  const banner = document.querySelector('.banner');
  if (banner) {
    const height = banner.offsetHeight;
    window.addEventListener('scroll', function() {
      const scrollY = window.scrollY;
      const scale = 1 + (scrollY / height) * 0.1;
      const opacity = 1 - (scrollY / height) * 0.5;
      
      const bannerContent = banner.querySelector('.banner-content');
      if (bannerContent) {
        bannerContent.style.transform = `scale(${scale})`;
        bannerContent.style.opacity = opacity;
      }
    });
  }

  console.log('苏顺植保网站已加载完成！');
});
