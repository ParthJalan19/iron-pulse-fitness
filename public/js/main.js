/* ==========================================================================
   IRON PULSE FITNESS - MAIN ANIMATIONS & INTERACTIONS (GSAP & LENIS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Ensure GSAP plugins are registered
  gsap.registerPlugin(ScrollTrigger);

  // Initialize Core Systems
  initLenis();
  initPreloader();
  initScrollProgressBar();
  initMagneticButtons();
  initSmokeParticles();
  initTextSplitting();
  initScrollAnimations();
});

/* ==========================================
   1. LENIS SMOOTH SCROLLING
   ========================================== */
let lenis;
function initLenis() {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false
  });

  // Sync ScrollTrigger with Lenis
  lenis.on('scroll', ScrollTrigger.update);

  // Connect Lenis to GSAP ticker
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // Disable lag smoothing to prevent visual jumps
  gsap.ticker.lagSmoothing(0);
}

/* ==========================================
   2. SCROLL PROGRESS INDICATOR
   ========================================== */
function initScrollProgressBar() {
  const scrollProgress = document.querySelector('.scroll-progress-bar');
  if (!scrollProgress) return;

  window.addEventListener('scroll', () => {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    if (totalScroll > 0) {
      const percentage = (window.scrollY / totalScroll) * 100;
      scrollProgress.style.width = `${percentage}%`;
    }
  });
}

/* ==========================================
   3. MAGNETIC BUTTONS
   ========================================== */
function initMagneticButtons() {
  const magneticBtns = document.querySelectorAll('.magnetic-btn');

  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      // Calculate cursor position relative to button center
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      // Attract the button slightly (30% pull)
      gsap.to(btn, {
        x: x * 0.35,
        y: y * 0.35,
        duration: 0.3,
        ease: "power2.out"
      });
    });

    btn.addEventListener('mouseleave', () => {
      // Revert button to original coordinates
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.3)"
      });
    });
  });
}

/* ==========================================
   4. CANVAS SMOKE PARTICLES SIMULATOR
   ========================================== */
function initSmokeParticles() {
  const canvas = document.getElementById('smoke-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  });

  class Particle {
    constructor() {
      this.reset();
      // Start in a random lifecycle phase so they distribute evenly
      this.life = Math.random() * this.maxLife;
    }

    reset() {
      this.x = Math.random() * w;
      this.y = h + Math.random() * 80;
      this.vx = (Math.random() - 0.5) * 0.5;
      this.vy = -(Math.random() * 0.8 + 0.3); // Rising
      this.size = Math.random() * 100 + 100;
      this.maxLife = Math.random() * 300 + 300;
      this.life = 0;
      this.alpha = 0;
      this.angle = Math.random() * Math.PI * 2;
      this.spin = (Math.random() - 0.5) * 0.003;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.spin;
      this.life++;

      // Fade-in at start, fade-out at end of life
      const lifeRatio = this.life / this.maxLife;
      if (lifeRatio < 0.2) {
        this.alpha = (lifeRatio / 0.2) * 0.07; // Max opacity 7%
      } else if (lifeRatio > 0.6) {
        this.alpha = 0.07 * (1 - (lifeRatio - 0.6) / 0.4);
      } else {
        this.alpha = 0.07;
      }

      if (this.life >= this.maxLife || this.y < -150) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      // Create radial gradient for a soft, smoky puff
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size);
      grad.addColorStop(0, `rgba(255, 107, 0, ${this.alpha * 0.8})`); // Soft amber glow core
      grad.addColorStop(0.3, `rgba(40, 40, 40, ${this.alpha})`);
      grad.addColorStop(1, 'rgba(13, 13, 13, 0)');
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Generate smoke particles
  const particleCount = Math.min(25, Math.floor(w / 70));
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Animation Loop
  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  
  animate();
}

/* ==========================================
   5. PREMIUM PRELOADER & HERO ENTRANCE
   ========================================== */
function initPreloader() {
  const preloader = document.getElementById('preloader');
  const loaderNum = document.getElementById('loader-num');
  const loaderBar = document.querySelector('.loader-bar');
  
  if (!preloader) return;

  let loadedPercent = 0;
  
  // Custom timeline for smooth percentage count
  const countInterval = setInterval(() => {
    loadedPercent += Math.floor(Math.random() * 8) + 2;
    if (loadedPercent >= 100) {
      loadedPercent = 100;
      clearInterval(countInterval);
      triggerHeroReveal();
    }
    loaderNum.textContent = `${loadedPercent}%`;
    loaderBar.style.width = `${loadedPercent}%`;
  }, 45);

  function triggerHeroReveal() {
    // Enable scroll
    document.body.classList.remove('loading-active');

    const loaderTl = gsap.timeline({
      onComplete: () => {
        preloader.style.display = 'none';
      }
    });

    // Elegant loading closure
    loaderTl.to(['.loader-logo', '.loader-progress', '.loader-tagline'], {
      y: -30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.inOut"
    })
    .to('.loader-bg-slice', {
      yPercent: -100,
      duration: 1.0,
      ease: "power4.inOut"
    }, "-=0.3")
    .to(preloader, {
      opacity: 0,
      duration: 0.5
    }, "-=0.8");

    // Hero elements reveal (conditional)
    if (document.querySelector('.hero-video')) {
      loaderTl.from('.hero-video', {
        scale: 1.25,
        duration: 2.0,
        ease: "power3.out"
      }, "-=1.2");
    }
    
    if (document.querySelector('.hero-title .char')) {
      loaderTl.from('.hero-title .char', {
        y: 120,
        opacity: 0,
        rotateX: 45,
        stagger: 0.03,
        duration: 1.2,
        ease: "power4.out"
      }, "-=1.0");
    }
    
    if (document.querySelector('.hero-subtitle')) {
      loaderTl.from('.hero-subtitle', {
        y: 30,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out"
      }, "-=0.7");
    }
    
    if (document.querySelector('.hero-buttons .btn')) {
      loaderTl.from('.hero-buttons .btn', {
        scale: 0.9,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.5");
    }
    
    if (document.querySelector('.main-header')) {
      loaderTl.from('.main-header', {
        y: -50,
        opacity: 0,
        duration: 1.0,
        ease: "power3.out"
      }, "-=0.8");
    }
    
    if (document.querySelector('.scroll-indicator')) {
      loaderTl.from('.scroll-indicator', {
        opacity: 0,
        y: -10,
        duration: 0.8
      }, "-=0.3");
    }
  }
}

/* ==========================================
   6. PREMIUM TEXT SPLITTING (CHARACTERS & WORDS)
   ========================================== */
function initTextSplitting() {
  // Character Split
  const splitChars = document.querySelectorAll('.split-chars');
  splitChars.forEach(el => {
    // Replace breaks with spaces to avoid merging adjacent words
    let text = el.innerHTML.replace(/<br\s*\/?>/gi, ' ');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    text = tempDiv.innerText || tempDiv.textContent || '';
    
    el.innerHTML = '';
    
    const words = text.trim().split(/\s+/);
    words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.classList.add('word-span');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.whiteSpace = 'nowrap';
      
      const chars = word.split('');
      chars.forEach(char => {
        const charSpan = document.createElement('span');
        charSpan.classList.add('char');
        charSpan.style.display = 'inline-block';
        charSpan.textContent = char;
        wordSpan.appendChild(charSpan);
      });

      el.appendChild(wordSpan);
      
      if (wordIndex < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    });
  });

  // Word Split
  const splitWords = document.querySelectorAll('.split-words');
  splitWords.forEach(el => {
    const text = el.textContent || el.innerText || '';
    const words = text.trim().split(/\s+/);
    el.innerHTML = '';
    words.forEach(word => {
      const wordSpan = document.createElement('span');
      wordSpan.classList.add('word');
      wordSpan.style.display = 'inline-block';
      wordSpan.style.overflow = 'hidden';
      wordSpan.style.verticalAlign = 'top';
      wordSpan.innerHTML = `<span style="display:inline-block; transform:translateY(100%); opacity:0;">${word}</span>`;
      el.appendChild(wordSpan);
      el.appendChild(document.createTextNode(' '));
    });
  });
}

/* ==========================================
   7. SCROLL-TRIGGERED ANIMATIONS
   ========================================== */
function initScrollAnimations() {
  // --- STICKY HEADER SCROLL BLUR ---
  const header = document.querySelector('.main-header');
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // --- HERO BACKGROUND SCROLL ZOOM ---
  if (document.querySelector('.hero-section')) {
    gsap.to('.hero-video', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      },
      scale: 1.25,
      y: 100,
      ease: "none"
    });
  }

  // --- ANIME COUNT-UP STATISTICS ---
  const counters = document.querySelectorAll('.count-up');
  if (counters.length > 0) {
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      
      gsap.fromTo(counter, {
        innerText: 0
      }, {
        innerText: target,
        duration: 2.0,
        ease: "power2.out",
        scrollTrigger: {
          trigger: counter,
          start: "top 85%",
          toggleActions: "play none none none"
        },
        snap: { innerText: 1 }, // Round to whole numbers
        onUpdate: function() {
          // Force rendering text update
          counter.textContent = Math.ceil(this.targets()[0].innerText);
        }
      });
    });
  }

  // --- PARALLAX BACKGROUND IMAGES ---
  const parallaxBgs = document.querySelectorAll('.parallax-bg');
  if (parallaxBgs.length > 0) {
    parallaxBgs.forEach(container => {
      const img = container.querySelector('img');
      if (img) {
        const speed = parseFloat(container.getAttribute('data-speed')) || 0.05;
        
        gsap.to(img, {
          yPercent: speed * 150,
          ease: "none",
          scrollTrigger: {
            trigger: container,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        });
      }
    });
  }

  // --- SECTION TITLE WORD REVEALS ---
  const sections = document.querySelectorAll('section');
  sections.forEach(sec => {
    const words = sec.querySelectorAll('.split-words .word > span');
    if (words.length > 0) {
      gsap.to(words, {
        y: 0,
        opacity: 1,
        stagger: 0.05,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sec,
          start: "top 75%",
          toggleActions: "play none none none"
        }
      });
    }

    // Generic reveal elements inside this section
    const revealItems = sec.querySelectorAll('.reveal-item');
    if (revealItems.length > 0) {
      gsap.from(revealItems, {
        y: 50,
        opacity: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sec,
          start: "top 70%",
          toggleActions: "play none none none"
        }
      });
    }
  });

  // --- PROGRAMS DYNAMIC HORIZONTAL PIN SCROLL ---
  const scrollWrapper = document.querySelector('.horizontal-scroll-wrapper');
  if (scrollWrapper && document.querySelector('.programs-section')) {
    const scrollWidth = scrollWrapper.scrollWidth - window.innerWidth;
    
    gsap.to(scrollWrapper, {
      x: -scrollWidth,
      ease: "none",
      scrollTrigger: {
        trigger: '.programs-section',
        pin: true,
        start: 'top top',
        end: () => `+=${scrollWidth}`,
        scrub: 1,
        invalidateOnRefresh: true
      }
    });
  }

  // --- COMPONENT BUTTON RIPPLE INJECTION ---
  const rippleBtns = document.querySelectorAll('.btn-ripple');
  if (rippleBtns.length > 0) {
    rippleBtns.forEach(btn => {
      btn.addEventListener('click', function(e) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('span');
        ripple.classList.add('ripple-effect');
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.appendChild(ripple);

        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
  }

  // --- FOOTER PARALLAX REVEAL DISABLED ---
  // Disabled to prevent static layout overlaps and item cut-offs on shorter viewports
}

// Refresh ScrollTrigger calculations after all assets/images fully load
window.addEventListener('load', () => {
  ScrollTrigger.refresh();
});
