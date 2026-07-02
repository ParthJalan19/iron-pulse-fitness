/* ==========================================================================
   IRON PULSE FITNESS - CLIENT SIDE COMPONENTS & LOGIC
   ========================================================================== */

// Configure base URL for backend connection (change this URL after deploying the Render backend)
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'https://iron-pulse-fitness-backend.onrender.com'; // Replace with your Render URL if deploying frontend to Netlify

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Components
  initMobileNav();
  initBillingToggle();
  initFaqAccordion();
  initBackToTop();
  initBeforeAfterSlider();
  initScheduleFilter();
  initBmiCalculator();
  initGalleryLightbox();
  initTestimonialsSlider();
  initModalManager();
  initFormSubmissions();
});

/* ==========================================
   1. MOBILE NAVIGATION DRAWER
   ========================================== */
function initMobileNav() {
  const hamburger = document.querySelector('.hamburger-menu');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const links = document.querySelectorAll('.mobile-link');

  if (!hamburger || !drawer) return;

  const toggleMenu = () => {
    hamburger.classList.toggle('active');
    drawer.classList.toggle('open');
    // Animate hamburger bars to X shape
    const bars = hamburger.querySelectorAll('.bar');
    if (drawer.classList.contains('open')) {
      bars[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
      bars[1].style.opacity = '0';
      bars[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
    } else {
      bars[0].style.transform = 'none';
      bars[1].style.opacity = '1';
      bars[2].style.transform = 'none';
    }
  };

  hamburger.addEventListener('click', toggleMenu);
  links.forEach(link => {
    link.addEventListener('click', () => {
      if (drawer.classList.contains('open')) {
        toggleMenu();
      }
    });
  });
}

/* ==========================================
   2. BACK TO TOP BUTTON & WHATSAPP TOOLTIP
   ========================================== */
function initBackToTop() {
  const backToTopBtn = document.getElementById('back-to-top');
  if (!backToTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.style.display = 'flex';
      setTimeout(() => backToTopBtn.style.opacity = '1', 50);
    } else {
      backToTopBtn.style.opacity = '0';
      setTimeout(() => {
        if (window.scrollY <= 400) backToTopBtn.style.display = 'none';
      }, 300);
    }
  });

  backToTopBtn.addEventListener('click', () => {
    // Scroll smoothly back to top using Lenis
    if (typeof lenis !== 'undefined') {
      lenis.scrollTo(0, { duration: 1.2 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
}

/* ==========================================
   3. BEFORE / AFTER DRAGGABLE SLIDER
   ========================================== */
function initBeforeAfterSlider() {
  const container = document.querySelector('.ba-slider-container');
  if (!container) return;

  const afterImg = container.querySelector('.after-image');
  const handle = container.querySelector('.slider-handle');
  let isDragging = false;

  const moveSlider = (clientX) => {
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    let percentage = (x / rect.width) * 100;

    // Boundaries check
    if (percentage < 0) percentage = 0;
    if (percentage > 100) percentage = 100;

    afterImg.style.width = `${100 - percentage}%`;
    handle.style.left = `${percentage}%`;
  };

  // Mouse Events
  handle.addEventListener('mousedown', () => isDragging = true);
  window.addEventListener('mouseup', () => isDragging = false);
  container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    moveSlider(e.clientX);
  });

  // Touch Events (Mobile)
  handle.addEventListener('touchstart', () => isDragging = true);
  window.addEventListener('touchend', () => isDragging = false);
  container.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    moveSlider(e.touches[0].clientX);
  });
}

/* ==========================================
   4. SCHEDULE TIMETABLE FILTERING
   ========================================== */
function initScheduleFilter() {
  const filterBtns = document.querySelectorAll('.schedule-filters .filter-btn');
  const classCells = document.querySelectorAll('.schedule-table td.class-cell');
  const emptyCells = document.querySelectorAll('.schedule-table td.empty');

  if (filterBtns.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle Active buttons class
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterVal = btn.getAttribute('data-filter');

      classCells.forEach(cell => {
        const classType = cell.getAttribute('data-class-type');
        
        if (filterVal === 'all') {
          cell.classList.remove('faded', 'highlight');
        } else if (classType === filterVal) {
          cell.classList.remove('faded');
          cell.classList.add('highlight');
        } else {
          cell.classList.remove('highlight');
          cell.classList.add('faded');
        }
      });

      emptyCells.forEach(cell => {
        if (filterVal === 'all') {
          cell.classList.remove('faded');
        } else {
          cell.classList.add('faded');
        }
      });
    });
  });
}

/* ==========================================
   5. BMI CALCULATOR (WITH LIVE BACKEND SYNC)
   ========================================== */
function initBmiCalculator() {
  const form = document.getElementById('bmi-form');
  const resultCard = document.querySelector('.bmi-result-card');
  
  if (!form || !resultCard) return;

  const placeholder = resultCard.querySelector('.result-placeholder');
  const display = resultCard.querySelector('.result-display');
  const scoreNum = resultCard.querySelector('.bmi-score-num');
  const categoryLbl = resultCard.querySelector('.bmi-category');
  const gaugeMarker = resultCard.querySelector('.gauge-marker');
  const recommendation = resultCard.querySelector('.bmi-recommendation');
  const historyList = resultCard.querySelector('#bmi-history-list');
  const genderBtns = form.querySelectorAll('.gender-selectors .gender-btn');

  let activeGender = 'Male';

  if (genderBtns.length > 0) {
    genderBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        genderBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeGender = btn.getAttribute('data-gender');
      });
    });
  }

  // Load history immediately on page load
  fetchBmiHistory();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const weight = parseFloat(document.getElementById('bmi-weight').value);
    const height = parseFloat(document.getElementById('bmi-height').value);
    const age = parseInt(document.getElementById('bmi-age').value);

    if (!weight || !height || !age) return;

    // BMI Formula
    const heightM = height / 100;
    const bmi = parseFloat((weight / (heightM * heightM)).toFixed(1));

    // Determine category
    let category = '';
    let recomText = '';
    let markerPercent = 50;

    if (bmi < 18.5) {
      category = 'Underweight';
      recomText = 'Your BMI signals a lean body weight baseline. Work with our coaches on custom mass hypertrophy loading and structured protein intake.';
      markerPercent = 15;
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      category = 'Normal Weight';
      recomText = 'Outstanding baseline ratio! Your body composition index is ideal. Maintain physical conditioning with CrossFit, HIIT, and strength splits.';
      markerPercent = 45;
    } else if (bmi >= 25 && bmi <= 29.9) {
      category = 'Overweight';
      recomText = 'Slightly above baseline indicators. Consider pairing caloric deficit templates with metabolic conditioning and weight progression routines.';
      markerPercent = 75;
    } else {
      category = 'Obesity Category';
      recomText = 'High body mass indexes verified. Schedule a private strategy meeting with David Thorne or Marcus Vance to formulate safety-focused cardiovascular regimes.';
      markerPercent = 95;
    }

    // Set UI displays
    if (scoreNum) scoreNum.textContent = bmi;
    if (categoryLbl) categoryLbl.textContent = category;
    if (gaugeMarker) gaugeMarker.style.left = `${markerPercent}%`;
    if (recommendation) recommendation.textContent = recomText;

    // Show Results
    if (placeholder) placeholder.classList.add('hide');
    if (display) display.classList.remove('hide');

    // Trigger pulse effect
    if (display) {
      gsap.fromTo(display, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.6 });
    }

    // Save calculation metrics to Backend server
    try {
      const response = await fetch(`${API_BASE}/api/bmi`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height, weight, age, gender: activeGender, bmi, category })
      });
      if (response.ok) {
        // Refresh logs list
        fetchBmiHistory();
      }
    } catch (err) {
      console.error('Error logging BMI calculations:', err);
    }
  });

  async function fetchBmiHistory() {
    if (!historyList) return;
    try {
      const response = await fetch(`${API_BASE}/api/bmi/history`);
      const data = await response.json();
      
      if (data.success && data.history.length > 0) {
        historyList.innerHTML = '';
        data.history.forEach(item => {
          const date = new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' });
          const li = document.createElement('li');
          li.innerHTML = `
            <span>${date} (${item.gender})</span>
            <span>BMI: <strong>${item.bmi}</strong> - ${item.category}</span>
          `;
          historyList.appendChild(li);
        });
      }
    } catch (err) {
      console.log('Unable to pull calculations logs history.', err);
    }
  }
}

/* ==========================================
   6. GALLERY CATEGORIES & LIGHTBOX
   ========================================== */
function initGalleryLightbox() {
  const filterBtns = document.querySelectorAll('.gallery-filter-btn');
  const items = document.querySelectorAll('.gallery-item-wrapper');
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-image');
  const lightboxCap = document.getElementById('lightbox-caption');
  const closeBtn = document.querySelector('.lightbox-close-btn');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (!lightbox || items.length === 0) return;

  let activeItems = Array.from(items);
  let currentImgIndex = 0;

  // Lightbox Open Function
  const openLightbox = (index) => {
    currentImgIndex = index;
    const targetItem = activeItems[currentImgIndex];
    const img = targetItem.querySelector('img');
    const caption = targetItem.querySelector('h4');

    if (img) {
      lightboxImg.src = img.src;
      lightboxCap.textContent = caption ? caption.textContent : 'Iron Pulse Sanctuary';
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      gsap.to(lightbox, { opacity: 1, duration: 0.4 });
    }
  };

  // Bind Click Event to Item Wrappers
  items.forEach(item => {
    item.addEventListener('click', () => {
      const index = activeItems.indexOf(item);
      if (index !== -1) {
        openLightbox(index);
      }
    });
  });

  // Close Function
  const closeLightbox = () => {
    gsap.to(lightbox, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  };

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-content-box')) {
      closeLightbox();
    }
  });

  // Slide Navigations
  const slideNext = () => {
    if (activeItems.length === 0) return;
    let nextIdx = currentImgIndex + 1;
    if (nextIdx >= activeItems.length) nextIdx = 0;
    openLightbox(nextIdx);
  };

  const slidePrev = () => {
    if (activeItems.length === 0) return;
    let prevIdx = currentImgIndex - 1;
    if (prevIdx < 0) prevIdx = activeItems.length - 1;
    openLightbox(prevIdx);
  };

  if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); slideNext(); });
  if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); slidePrev(); });

  // Filter Functionality
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filterVal = btn.getAttribute('data-filter');

        activeItems = [];
        items.forEach(item => {
          const hasClass = item.classList.contains(`filter-${filterVal}`);
          if (filterVal === 'all' || hasClass) {
            activeItems.push(item);
            gsap.to(item, { scale: 1, opacity: 1, duration: 0.4, display: 'block' });
          } else {
            gsap.to(item, { scale: 0.8, opacity: 0, duration: 0.4, display: 'none' });
          }
        });
      });
    });
  }
}

/* ==========================================
   7. AUTO RUNNING TESTIMONIALS SLIDER
   ========================================== */
function initTestimonialsSlider() {
  const slides = document.querySelectorAll('.testimonial-slide');
  const dots = document.querySelectorAll('.slider-dots .dot');
  const prevBtn = document.querySelector('.prev-btn');
  const nextBtn = document.querySelector('.next-btn');

  if (slides.length === 0) return;

  let currentIndex = 0;
  let slideInterval;

  const showSlide = (index) => {
    slides.forEach((slide, i) => {
      slide.classList.remove('active');
      dots[i].classList.remove('active');
    });

    slides[index].classList.add('active');
    dots[index].classList.add('active');
    
    // Animate content reveal
    gsap.fromTo(slides[index], { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" });
    
    currentIndex = index;
  };

  const nextSlide = () => {
    let index = currentIndex + 1;
    if (index >= slides.length) index = 0;
    showSlide(index);
  };

  const prevSlide = () => {
    let index = currentIndex - 1;
    if (index < 0) index = slides.length - 1;
    showSlide(index);
  };

  // Nav click actions
  if (nextBtn) nextBtn.addEventListener('click', () => { resetTimer(); nextSlide(); });
  if (prevBtn) prevBtn.addEventListener('click', () => { resetTimer(); prevSlide(); });

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      resetTimer();
      const index = parseInt(dot.getAttribute('data-index'));
      showSlide(index);
    });
  });

  // Auto transition ticker
  const startTimer = () => {
    slideInterval = setInterval(nextSlide, 7000);
  };

  const resetTimer = () => {
    clearInterval(slideInterval);
    startTimer();
  };

  startTimer();
}

/* ==========================================
   8. MODAL MANAGER (BOOKINGS & INVITATIONS)
   ========================================== */
function initModalManager() {
  const modal = document.getElementById('inquiry-modal');
  const closeBtn = document.querySelector('.modal-close-btn');
  const triggerBtns = document.querySelectorAll('.open-modal-btn');
  const planSelector = document.getElementById('modal-plan');
  const commentTextarea = document.getElementById('modal-message');

  if (!modal) return;

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // If trainer trigger click, autofill details
      const trainer = btn.getAttribute('data-trainer');
      const plan = btn.getAttribute('data-plan');

      if (planSelector) {
        if (plan) {
          planSelector.value = plan;
        } else {
          planSelector.value = 'Premium'; // Default
        }
      }

      if (commentTextarea) {
        if (trainer) {
          commentTextarea.placeholder = `Requested Personal Coach: ${trainer}`;
          commentTextarea.value = `I would like to book a private assessment training session with Coach ${trainer}.`;
        } else {
          commentTextarea.placeholder = "Tell us about your fitness targets, previous injuries, or if you wish to request a specific coach.";
          commentTextarea.value = '';
        }
      }

      modal.classList.add('open');
      document.body.style.overflow = 'hidden'; // Lock scrolling
    });
  });

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = ''; // Unlock scroll
    // Clear feedback
    const fb = document.getElementById('modal-feedback-message');
    if (fb) fb.innerHTML = '';
  };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

/* ==========================================
   9. ASYNCHRONOUS FORM SUBMISSIONS (NEWSLETTER, CONTACT, INQUIRY)
   ========================================== */
function initFormSubmissions() {
  // A. NEWSLETTER FORM
  const newsletterForm = document.getElementById('newsletter-form');
  const newsFeedback = document.getElementById('newsletter-message');
  
  if (newsletterForm && newsFeedback) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('newsletter-email').value;

      newsFeedback.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
      newsFeedback.className = 'form-feedback-message mt-small';

      try {
        const response = await fetch(`${API_BASE}/api/newsletter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          newsFeedback.innerHTML = `<i class="fas fa-circle-check"></i> ${data.message}`;
          newsFeedback.className = 'form-feedback-message mt-small success';
          newsletterForm.reset();
        } else {
          newsFeedback.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${data.message || 'Error occurred.'}`;
          newsFeedback.className = 'form-feedback-message mt-small error';
        }
      } catch (err) {
        newsFeedback.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Connection issue. Try again later.';
        newsFeedback.className = 'form-feedback-message mt-small error';
      }
    });
  }

  // B. CONTACT FORM
  const contactForm = document.getElementById('contact-form');
  const contactFeedback = document.getElementById('contact-message-feedback');

  if (contactForm && contactFeedback) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const phone = document.getElementById('contact-phone').value;
      const subject = document.getElementById('contact-subject').value;
      const message = document.getElementById('contact-message').value;

      contactFeedback.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Dispatching message...';
      contactFeedback.className = 'form-feedback-message mt-small';

      try {
        const response = await fetch(`${API_BASE}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, subject, message })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          contactFeedback.innerHTML = `<i class="fas fa-circle-check"></i> ${data.message}`;
          contactFeedback.className = 'form-feedback-message mt-small success';
          contactForm.reset();
        } else {
          contactFeedback.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${data.message || 'Error occurred.'}`;
          contactFeedback.className = 'form-feedback-message mt-small error';
        }
      } catch (err) {
        contactFeedback.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Server offline. Please send directly to email address.';
        contactFeedback.className = 'form-feedback-message mt-small error';
      }
    });
  }

  // C. MODAL INQUIRY FORM
  const modalForm = document.getElementById('modal-inquiry-form');
  const modalFeedback = document.getElementById('modal-feedback-message');

  if (modalForm && modalFeedback) {
    modalForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('modal-name').value;
      const email = document.getElementById('modal-email').value;
      const phone = document.getElementById('modal-phone').value;
      const plan = document.getElementById('modal-plan').value;
      const message = document.getElementById('modal-message').value;

      modalFeedback.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting credentials...';
      modalFeedback.className = 'form-feedback-message mt-small';

      try {
        const response = await fetch(`${API_BASE}/api/inquiry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, plan, message })
        });
        const data = await response.json();

        if (response.ok && data.success) {
          modalFeedback.innerHTML = `<i class="fas fa-circle-check"></i> ${data.message}`;
          modalFeedback.className = 'form-feedback-message mt-small success';
          
          // Reset form and close modal after brief delay
          modalForm.reset();
          setTimeout(() => {
            const modal = document.getElementById('inquiry-modal');
            if (modal && modal.classList.contains('open')) {
              modal.classList.remove('open');
              document.body.style.overflow = '';
            }
          }, 4000);
        } else {
          modalFeedback.innerHTML = `<i class="fas fa-circle-exclamation"></i> ${data.message || 'Submission error.'}`;
          modalFeedback.className = 'form-feedback-message mt-small error';
        }
      } catch (err) {
        modalFeedback.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Database offline. Call direct relations line.';
        modalFeedback.className = 'form-feedback-message mt-small error';
      }
    });
  }
}

/* ==========================================
   10. MEMBERSHIP BILLING TOGGLE
   ========================================== */
function initBillingToggle() {
  const switchBtn = document.getElementById('billing-switch');
  const labelMonthly = document.getElementById('label-monthly');
  const labelYearly = document.getElementById('label-yearly');
  const priceVals = document.querySelectorAll('.price-val');

  if (!switchBtn) return;

  switchBtn.addEventListener('click', () => {
    switchBtn.classList.toggle('yearly');
    const isYearly = switchBtn.classList.contains('yearly');

    if (isYearly) {
      if (labelMonthly) labelMonthly.classList.remove('active');
      if (labelYearly) labelYearly.classList.add('active');
    } else {
      if (labelMonthly) labelMonthly.classList.add('active');
      if (labelYearly) labelYearly.classList.remove('active');
    }

    priceVals.forEach(price => {
      const monthlyVal = price.getAttribute('data-monthly');
      const yearlyVal = price.getAttribute('data-yearly');

      gsap.to(price, {
        opacity: 0,
        y: -10,
        duration: 0.2,
        onComplete: () => {
          price.textContent = isYearly ? yearlyVal : monthlyVal;
          gsap.to(price, {
            opacity: 1,
            y: 0,
            duration: 0.3
          });
        }
      });
    });
  });
}

/* ==========================================
   11. FAQ ACCORDION TRIGGER
   ========================================== */
function initFaqAccordion() {
  const faqTriggers = document.querySelectorAll('.faq-trigger');

  faqTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const content = trigger.nextElementSibling;
      const isExpanded = trigger.getAttribute('aria-expanded') === 'true';

      // Collapse all other items for a premium cohesive feel
      faqTriggers.forEach(otherTrigger => {
        if (otherTrigger !== trigger) {
          otherTrigger.setAttribute('aria-expanded', 'false');
          const otherContent = otherTrigger.nextElementSibling;
          if (otherContent) {
            otherContent.style.maxHeight = '0px';
          }
        }
      });

      // Toggle current item
      if (isExpanded) {
        trigger.setAttribute('aria-expanded', 'false');
        if (content) content.style.maxHeight = '0px';
      } else {
        trigger.setAttribute('aria-expanded', 'true');
        if (content) content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}
