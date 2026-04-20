(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  /* -------------------------------------------------
     Page-load intro (curtain)
     ------------------------------------------------- */
  const intro = () => {
    const panels = document.querySelectorAll(".page-transition span");
    if (!panels.length) return;
    if (!window.gsap) {
      panels.forEach((p) => (p.style.transform = "scaleY(0)"));
      return;
    }
    gsap.set(panels, { transformOrigin: "bottom" });
    gsap.to(panels, {
      scaleY: 0,
      duration: 1.1,
      ease: "power4.inOut",
      stagger: 0.06,
      delay: 0.1,
      onComplete: () => {
        document.querySelector(".page-transition")?.remove();
      },
    });
  };

  /* -------------------------------------------------
     Lenis smooth scroll + GSAP ScrollTrigger sync
     ------------------------------------------------- */
  const smoothScroll = () => {
    if (!window.Lenis || reduceMotion) return null;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });

    if (window.gsap && window.ScrollTrigger) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => {
        lenis.raf(t);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    }

    document.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (!id || id === "#") return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -40, duration: 1.4 });
      });
    });

    return lenis;
  };

  /* -------------------------------------------------
     Custom cursor (desktop only)
     ------------------------------------------------- */
  const cursor = () => {
    if (isTouch || reduceMotion) return;
    const el = document.querySelector(".cursor");
    if (!el) return;
    const dot = el.querySelector(".cursor__dot");
    const ring = el.querySelector(".cursor__ring");

    const pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...pos };

    window.addEventListener("mousemove", (e) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    });

    window.addEventListener("mouseleave", () => el.classList.add("is-hidden"));
    window.addEventListener("mouseenter", () => el.classList.remove("is-hidden"));

    const tick = () => {
      ringPos.x += (pos.x - ringPos.x) * 0.18;
      ringPos.y += (pos.y - ringPos.y) * 0.18;
      ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      requestAnimationFrame(tick);
    };
    tick();

    document
      .querySelectorAll("a, button, [data-magnetic], [data-link]")
      .forEach((t) => {
        t.addEventListener("mouseenter", () => el.classList.add("is-hover"));
        t.addEventListener("mouseleave", () => el.classList.remove("is-hover"));
      });
  };

  /* -------------------------------------------------
     Magnetic buttons
     ------------------------------------------------- */
  const magnets = () => {
    if (isTouch || reduceMotion) return;
    const items = document.querySelectorAll("[data-magnetic]");
    items.forEach((el) => {
      const strength = parseFloat(el.dataset.strength) || 0.35;
      const inner = el.querySelector(":scope > *") || el;
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        if (window.gsap) {
          gsap.to(el, { x: dx, y: dy, duration: 0.5, ease: "power3.out" });
          gsap.to(inner, { x: dx * 0.4, y: dy * 0.4, duration: 0.5, ease: "power3.out" });
        } else {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
        }
      });
      el.addEventListener("mouseleave", () => {
        if (window.gsap) {
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
          gsap.to(inner, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
        } else {
          el.style.transform = "";
        }
      });
    });
  };

  /* -------------------------------------------------
     Text splitting (word + char)
     ------------------------------------------------- */
  const splitWords = (el) => {
    const text = el.textContent;
    el.textContent = "";
    const frag = document.createDocumentFragment();
    text.split(/(\s+)/).forEach((chunk) => {
      if (/^\s+$/.test(chunk)) {
        frag.appendChild(document.createTextNode(" "));
      } else if (chunk.length) {
        const w = document.createElement("span");
        w.className = "split-word";
        w.textContent = chunk;
        frag.appendChild(w);
      }
    });
    el.appendChild(frag);
    return el.querySelectorAll(".split-word");
  };

  const wrapLine = (node) => {
    const mask = document.createElement("span");
    mask.className = "line-mask";
    const inner = document.createElement("span");
    inner.className = "line-mask__inner";
    while (node.firstChild) inner.appendChild(node.firstChild);
    mask.appendChild(inner);
    node.appendChild(mask);
    return inner;
  };

  /* -------------------------------------------------
     Reveal animations via ScrollTrigger
     ------------------------------------------------- */
  const reveals = () => {
    if (!window.gsap) return;
    const { ScrollTrigger } = window;

    // Hero split targets — character-ish rise
    document.querySelectorAll("[data-split]").forEach((el) => {
      const inner = wrapLine(el);
      gsap.set(inner, { yPercent: 110, rotate: 4 });
    });

    gsap.to("[data-split] .line-mask__inner", {
      yPercent: 0,
      rotate: 0,
      duration: 1.2,
      ease: "power4.out",
      stagger: 0.08,
      delay: 0.55,
    });

    // Section titles — line-by-line rise when scrolled to
    document.querySelectorAll("[data-split-lines]").forEach((el) => {
      const words = splitWords(el);
      gsap.set(words, { yPercent: 120, opacity: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 80%",
        once: true,
        onEnter: () =>
          gsap.to(words, {
            yPercent: 0,
            opacity: 1,
            duration: 1,
            ease: "power4.out",
            stagger: 0.03,
          }),
      });
    });

    // Generic reveals
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: () =>
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
          }),
      });
    });

    document.querySelectorAll("[data-fade]").forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power2.out",
        delay: 0.3 + i * 0.08,
      });
    });

    // Projects entry
    gsap.utils.toArray("[data-project]").forEach((el) => {
      const media = el.querySelector(".project__media");
      const info = el.querySelectorAll(".project__info > *");
      gsap.set(media, { yPercent: 12, opacity: 0, scale: 0.98 });
      gsap.set(info, { yPercent: 40, opacity: 0 });
      ScrollTrigger.create({
        trigger: el,
        start: "top 78%",
        once: true,
        onEnter: () => {
          gsap.to(media, {
            yPercent: 0,
            opacity: 1,
            scale: 1,
            duration: 1.2,
            ease: "power4.out",
          });
          gsap.to(info, {
            yPercent: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.07,
            delay: 0.15,
          });
        },
      });
    });

    // Parallax on project media
    gsap.utils.toArray("[data-parallax]").forEach((el) => {
      gsap.to(el, {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });
  };

  /* -------------------------------------------------
     Marquee — GSAP xPercent loop tied to scroll velocity
     ------------------------------------------------- */
  const marquees = () => {
    if (!window.gsap) return;
    document.querySelectorAll("[data-marquee], [data-marquee-slow]").forEach((el) => {
      const slow = el.hasAttribute("data-marquee-slow");
      const base = slow ? 40 : 20;
      const tween = gsap.to(el, {
        xPercent: -50,
        duration: base,
        ease: "none",
        repeat: -1,
      });

      if (window.ScrollTrigger) {
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = self.getVelocity();
            const target = gsap.utils.clamp(0.4, 4, 1 + Math.abs(v) / 1200);
            const dir = v < 0 ? -1 : 1;
            gsap.to(tween, {
              timeScale: target * dir,
              duration: 0.4,
              overwrite: true,
            });
          },
        });
      }
    });
  };

  /* -------------------------------------------------
     Counters
     ------------------------------------------------- */
  const counters = () => {
    if (!window.gsap) return;
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: () =>
          gsap.to(obj, {
            v: target,
            duration: 1.6,
            ease: "power3.out",
            onUpdate: () => {
              el.textContent = Math.round(obj.v).toString().padStart(2, "0");
            },
          }),
      });
    });
  };

  /* -------------------------------------------------
     Nav show/hide on scroll
     ------------------------------------------------- */
  const navBehavior = () => {
    const nav = document.querySelector("[data-nav]");
    if (!nav) return;
    let lastY = window.scrollY;
    let ticking = false;
    const update = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-pinned", y > 40);
      if (y > lastY && y > 160) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      lastY = y;
      ticking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  };

  /* -------------------------------------------------
     Live clock (IST)
     ------------------------------------------------- */
  const clock = () => {
    const nodes = document.querySelectorAll("[data-clock]");
    if (!nodes.length) return;
    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    const tick = () => {
      const t = fmt.format(new Date());
      nodes.forEach((n) => (n.textContent = t));
    };
    tick();
    setInterval(tick, 1000);
  };

  /* -------------------------------------------------
     Project hover — subtle visual lift
     ------------------------------------------------- */
  const projectHover = () => {
    if (isTouch || reduceMotion) return;
    document.querySelectorAll(".project").forEach((p) => {
      const media = p.querySelector(".project__media");
      if (!media || !window.gsap) return;
      p.addEventListener("mousemove", (e) => {
        const r = media.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        gsap.to(media, {
          rotateX: -dy * 4,
          rotateY: dx * 6,
          transformPerspective: 900,
          duration: 0.6,
          ease: "power3.out",
        });
      });
      p.addEventListener("mouseleave", () => {
        gsap.to(media, { rotateX: 0, rotateY: 0, duration: 0.9, ease: "power3.out" });
      });
    });
  };

  /* -------------------------------------------------
     Boot
     ------------------------------------------------- */
  const boot = () => {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
    }
    intro();
    smoothScroll();
    cursor();
    magnets();
    reveals();
    marquees();
    counters();
    navBehavior();
    clock();
    projectHover();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
