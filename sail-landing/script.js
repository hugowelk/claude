// Navbar scroll effect
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset;

  if (currentScroll > 100) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  lastScroll = currentScroll;
});

// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const isOpen = navLinks.classList.contains('active');
    mobileMenuBtn.innerHTML = isOpen ? '✕' : '☰';
  });

  // Close mobile menu when clicking a link
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      mobileMenuBtn.innerHTML = '☰';
    });
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const offsetTop = target.offsetTop - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  });
});

// FAQ accordion
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const question = item.querySelector('.faq-question');

  question.addEventListener('click', () => {
    const isActive = item.classList.contains('active');

    // Close all other items
    faqItems.forEach(otherItem => {
      if (otherItem !== item) {
        otherItem.classList.remove('active');
      }
    });

    // Toggle current item
    if (isActive) {
      item.classList.remove('active');
    } else {
      item.classList.add('active');
    }
  });
});

// Scroll reveal animation
const revealElements = document.querySelectorAll('.feature-card, .step, .testimonial-card, .faq-item');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('reveal');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(element => {
  revealObserver.observe(element);
});

// Waitlist form submission
const waitlistForm = document.getElementById('waitlist-form');

if (waitlistForm) {
  waitlistForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      painType: document.getElementById('pain-type').value,
      timestamp: new Date().toISOString()
    };

    // Validate email
    if (!isValidEmail(formData.email)) {
      showNotification('Please enter a valid email address', 'error');
      return;
    }

    // Show loading state
    const submitBtn = waitlistForm.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Joining waitlist...';
    submitBtn.disabled = true;

    try {
      // Here you would send the data to your backend
      // For demo purposes, we'll just log it and show success
      console.log('Waitlist submission:', formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Show success message
      showNotification('Successfully joined the waitlist! Check your email for updates.', 'success');

      // Reset form
      waitlistForm.reset();

      // Track conversion (if analytics is set up)
      if (window.gtag) {
        window.gtag('event', 'waitlist_signup', {
          pain_type: formData.painType
        });
      }
    } catch (error) {
      console.error('Submission error:', error);
      showNotification('Something went wrong. Please try again.', 'error');
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Email validation helper
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Notification system
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  // Add styles
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '16px 24px',
    borderRadius: '12px',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '14px',
    zIndex: '10000',
    animation: 'slideInRight 0.3s ease',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
    maxWidth: '400px',
    backgroundColor: type === 'success' ? '#10B981' : '#EF4444'
  });

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Add slide animations for notifications
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

// Animated counters for stats
const animateCounter = (element, target, duration = 2000) => {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = formatNumber(target);
      clearInterval(timer);
    } else {
      element.textContent = formatNumber(Math.floor(current));
    }
  }, 16);
};

const formatNumber = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K+';
  }
  return num.toString();
};

// Observe and animate stats when they come into view
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const statNumber = entry.target.querySelector('.stat-number');
      const target = parseInt(statNumber.dataset.target);
      animateCounter(statNumber, target);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
  const number = stat.querySelector('.stat-number');
  const text = number.textContent;
  const numericValue = parseInt(text.replace(/[^0-9]/g, ''));
  number.dataset.target = numericValue;
  number.textContent = '0';
  statsObserver.observe(stat);
});

// Research stats animation
const researchStatsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const number = entry.target.querySelector('.number');
      const text = number.textContent;
      const numericValue = parseInt(text.replace(/[^0-9]/g, ''));
      number.dataset.target = numericValue;
      number.textContent = '0';

      setTimeout(() => {
        animateCounter(number, numericValue, 1500);
      }, 300);

      researchStatsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.research-stat').forEach(stat => {
  researchStatsObserver.observe(stat);
});

// Parallax effect for hero section
window.addEventListener('scroll', () => {
  const scrolled = window.pageYOffset;
  const heroVisual = document.querySelector('.hero-visual');

  if (heroVisual && scrolled < window.innerHeight) {
    heroVisual.style.transform = `translateY(${scrolled * 0.5}px)`;
  }
});

// Add ripple effect to buttons
document.querySelectorAll('.btn-primary, .btn-secondary, .submit-btn').forEach(button => {
  button.addEventListener('click', function(e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.className = 'ripple';

    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });
});

// Add ripple styles
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  .btn-primary, .btn-secondary, .submit-btn {
    position: relative;
    overflow: hidden;
  }

  .ripple {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transform: scale(0);
    animation: rippleEffect 0.6s ease-out;
    pointer-events: none;
  }

  @keyframes rippleEffect {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(rippleStyle);

// Track scroll depth for analytics
let maxScroll = 0;
const scrollMilestones = [25, 50, 75, 100];
const trackedMilestones = new Set();

window.addEventListener('scroll', () => {
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset;
  const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;

  if (scrollPercent > maxScroll) {
    maxScroll = scrollPercent;

    scrollMilestones.forEach(milestone => {
      if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
        trackedMilestones.add(milestone);

        // Track with analytics (if set up)
        if (window.gtag) {
          window.gtag('event', 'scroll_depth', {
            percent: milestone
          });
        }

        console.log(`Scroll depth: ${milestone}%`);
      }
    });
  }
});

// Preload critical images
const preloadImages = () => {
  const images = document.querySelectorAll('img[data-src]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', preloadImages);
} else {
  preloadImages();
}

// Handle form input focus states
document.querySelectorAll('.form-group input, .form-group select').forEach(input => {
  input.addEventListener('focus', function() {
    this.parentElement.classList.add('focused');
  });

  input.addEventListener('blur', function() {
    this.parentElement.classList.remove('focused');
    if (this.value) {
      this.parentElement.classList.add('filled');
    } else {
      this.parentElement.classList.remove('filled');
    }
  });
});

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

      console.log(`Page load time: ${pageLoadTime}ms`);

      // Track with analytics (if set up)
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: 'page_load',
          value: pageLoadTime,
          event_category: 'Performance'
        });
      }
    }, 0);
  });
}

// Console welcome message
console.log('%c🏥 Sail Health', 'font-size: 24px; font-weight: bold; color: #6366F1;');
console.log('%cA digital coach for chronic pain, built with leading researchers', 'font-size: 14px; color: #818CF8;');
console.log('%cInterested in joining our team? Email: hello@sailhealth.com', 'font-size: 12px; color: #9CA3AF;');
