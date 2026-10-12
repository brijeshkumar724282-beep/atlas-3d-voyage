/* Atlas Voyage main script. All CDN features are guarded so the page stays usable if a CDN fails. */
(function () {
  document.documentElement.classList.add("js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = function () { return window.innerWidth <= 820; };

  /* ---------- smooth anchors + lenis ---------- */
  var lenis = null;
  try {
    if (!reduced && typeof Lenis !== "undefined") {
      lenis = new Lenis({ duration: 1.15, smoothWheel: true });
      var rafLenis = function (t) { lenis.raf(t); requestAnimationFrame(rafLenis); };
      requestAnimationFrame(rafLenis);
    }
  } catch (e) { lenis = null; }

  function goTo(target) {
    var el = document.querySelector(target);
    if (!el) return;
    if (lenis && lenis.scrollTo) {
      lenis.scrollTo(el, { offset: -90 });
    } else {
      el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }
  }

  document.querySelectorAll("[data-scroll]").forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var t = a.getAttribute("data-scroll");
      if (t && t.charAt(0) === "#") {
        ev.preventDefault();
        goTo(t);
        closeMenu();
      }
    });
  });

  /* ---------- nav menu ---------- */
  var burger = document.getElementById("burger");
  var navLinks = document.getElementById("navLinks");
  function closeMenu() {
    if (!navLinks || !burger) return;
    navLinks.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Open menu");
  }
  if (burger && navLinks) {
    burger.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  /* ---------- progress bar ---------- */
  var fill = document.getElementById("progressFill");
  function updateProgress() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? window.scrollY / h : 0;
    if (fill) fill.style.transform = "scaleX(" + p.toFixed(4) + ")";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  updateProgress();

  /* ---------- active section + dots ---------- */
  var sections = ["#start", "#depart", "#orbit", "#land", "#highlights", "#contact"];
  var navA = Array.prototype.slice.call(document.querySelectorAll(".nav.links a"));
  var dots = Array.prototype.slice.call(document.querySelectorAll(".dot"));
  function setActive(id) {
    navA.forEach(function (a) { a.classList.toggle("active", a.getAttribute("data-scroll") === id); });
    var map = { "#start": 0, "#depart": 1, "#orbit": 2, "#land": 3, "#highlights": 4, "#contact": 5 };
    dots.forEach(function (d, i) { d.classList.toggle("active", i === map[id]); });
    if (window.__voyageChapter && map[id] >= 1 && map[id] <= 3) {
      window.__voyageChapter = map[id] - 1;
    }
  }
  window.__voyageChapter = 0;
  if ("IntersectionObserver" in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) setActive("#" + en.target.id);
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) {
      var el = document.querySelector(s);
      if (el) obs.observe(el);
    });
  }

  /* ---------- three.js scene ---------- */
  window.__voyageBoost = 0;
  var lastY = window.scrollY;
  window.addEventListener("scroll", function () {
    var d = Math.abs(window.scrollY - lastY);
    lastY = window.scrollY;
    window.__voyageBoost = Math.min(3, window.__voyageBoost + d / 400);
  }, { passive: true });

  var mouseX = 0, mouseY = 0;
  window.addEventListener("mousemove", function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function initScene() {
    var canvas = document.getElementById("scene");
    if (!canvas) return;
    if (typeof THREE === "undefined") { canvas.style.display = "none"; return; }
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { canvas.style.display = "none"; return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x070b18, 1);

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b18, 0.028);
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    var key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(4, 6, 6);
    scene.add(key);
    var glow = new THREE.PointLight(0xffb224, 60, 40);
    glow.position.set(-4, 2, 3);
    scene.add(glow);

    // starfield
    var starCount = reduced ? 400 : 1300;
    var pos = new Float32Array(starCount * 3);
    for (var i = 0; i < starCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 28;
      pos[i * 3 + 2] = -Math.random() * 24 - 2;
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    var stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.9 }));
    scene.add(stars);

    // floating low poly shapes
    var group = new THREE.Group();
    scene.add(group);
    var shapes = [];
    function addMesh(geo, color, x, y, z, wire) {
      var mat = wire
        ? new THREE.MeshBasicMaterial({ color: color, wireframe: true, transparent: true, opacity: 0.55 })
        : new THREE.MeshStandardMaterial({ color: color, flatShading: true, roughness: 0.55, metalness: 0.25 });
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.userData.spin = 0.15 + Math.random() * 0.5;
      m.userData.float = Math.random() * Math.PI * 2;
      group.add(m);
      shapes.push(m);
      return m;
    }
    addMesh(new THREE.IcosahedronGeometry(1.15, 0), 0xffb224, -3.4, 0.6, 0, false);
    addMesh(new THREE.OctahedronGeometry(0.9, 0), 0x3b82f6, 3.4, 1.1, -1, false);
    addMesh(new THREE.TorusGeometry(0.8, 0.28, 8, 18), 0xffffff, 0.2, -1.8, -1.5, false);
    addMesh(new THREE.DodecahedronGeometry(0.7, 0), 0x22c55e, 2.2, -2.2, 0.5, false);
    addMesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), 0xa855f7, -2.2, -2.0, -0.5, false);
    addMesh(new THREE.IcosahedronGeometry(1.8, 1), 0xfff2cf, 0, 2.6, -6, true);

    var chapterTargets = [
      { gy: 0.0, gx: 0.0, spread: 1.0, glow: 0xffb224 },
      { gy: 1.4, gx: 0.25, spread: 1.45, glow: 0x7dd3fc },
      { gy: 2.6, gx: -0.2, spread: 0.75, glow: 0x3b82f6 }
    ];

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    if (reduced) {
      group.rotation.y = 0.5;
      renderer.render(scene, camera);
      return;
    }

    var clock = new THREE.Clock();
    var smoothMX = 0, smoothMY = 0;
    var curSpread = 1;
    (function tick() {
      requestAnimationFrame(tick);
      var t = clock.getElapsedTime();
      window.__voyageBoost *= 0.94;
      var boost = 1 + window.__voyageBoost;
      var ch = chapterTargets[window.__voyageChapter || 0] || chapterTargets[0];

      smoothMX += (mouseX - smoothMX) * 0.045;
      smoothMY += (mouseY - smoothMY) * 0.045;
      curSpread += (ch.spread - curSpread) * 0.03;

      group.rotation.y += (0.0016 * boost + 0.0012) + (ch.gy - group.rotation.y) * 0.015;
      group.rotation.x += ((ch.gx + smoothMY * 0.18) - group.rotation.x) * 0.03;
      camera.position.x += (smoothMX * 1.1 - camera.position.x) * 0.04;
      camera.position.y += (-smoothMY * 0.7 + (window.scrollY / (document.body.scrollHeight || 1)) * -1.2 - camera.position.y) * 0.03;

      shapes.forEach(function (m, idx) {
        m.rotation.x += 0.003 * m.userData.spin * boost;
        m.rotation.y += 0.004 * m.userData.spin * boost;
        var baseY = Math.sin(t * 0.7 + m.userData.float) * 0.28;
        m.position.y += (baseY * 0.02);
        var dir = idx % 2 === 0 ? 1 : -1;
        m.position.x += Math.sin(t * 0.25 + idx) * 0.0006 * dir * boost;
      });
      group.scale.set(curSpread, curSpread, 1);
      stars.rotation.y = t * 0.008 * boost;
      stars.position.y = -(window.scrollY * 0.0006);

      try { glow.color.setHex(ch.glow); } catch (e) {}
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    })();
  }
  initScene();

  /* ---------- reveals ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && (typeof gsap === "undefined" || reduced)) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); rObs.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { rObs.observe(el); });
  } else if (typeof gsap === "undefined") {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- gsap motion, pinned chapters ---------- */
  try {
    if (typeof gsap !== "undefined" && !reduced) {
      var hasST = typeof ScrollTrigger !== "undefined";
      if (hasST && gsap.registerPlugin) gsap.registerPlugin(ScrollTrigger);
      if (lenis && hasST && lenis.on) {
        lenis.on("scroll", ScrollTrigger.update);
      }
      // hero intro
      gsap.from(".hero.title .line", { y: 70, opacity: 0, duration: 1, stagger: 0.14, ease: "power3.out" });
      gsap.from(".hero.actions .btn", { y: 24, opacity: 0, duration: 0.7, stagger: 0.1, delay: 0.5, ease: "power2.out", clearProps: "all" });

      if (hasST && !isMobile()) {
        document.querySelectorAll(".chapter .chapter.pin, .chapter .pin").forEach(function () {});
        gsap.utils.toArray(".chapter").forEach(function (sec) {
          var pin = sec.querySelector(".pin");
          if (!pin) return;
          ScrollTrigger.create({
            trigger: sec,
            start: "top top+=80",
            end: "+=70%",
            pin: pin,
            pinSpacing: true,
            scrub: false,
            onEnter: function () {
              var id = sec.id;
              window.__voyageChapter = id === "depart" ? 0 : id === "orbit" ? 1 : 2;
            },
            onEnterBack: function () {
              var id = sec.id;
              window.__voyageChapter = id === "depart" ? 0 : id === "orbit" ? 1 : 2;
            }
          });
          gsap.fromTo(pin.querySelector(".card"), { y: 50, opacity: 0.4 }, {
            y: 0, opacity: 1, ease: "none",
            scrollTrigger: { trigger: sec, start: "top bottom", end: "top 20%", scrub: 1 }
          });
        });
        gsap.to(".hero.inner", {
          y: -90, opacity: 0.15, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
        });
      } else {
        // mobile or no pin: reveal via gsap only
        if (hasST) {
          gsap.utils.toArray(".reveal").forEach(function (el) {
            gsap.fromTo(el, { y: 26, opacity: 0 }, {
              y: 0, opacity: 1, duration: 0.7, ease: "power2.out",
              scrollTrigger: { trigger: el, start: "top 88%" }
            });
          });
        } else {
          revealEls.forEach(function (el) { el.classList.add("in"); });
        }
      }
      if (hasST) {
        setTimeout(function () { ScrollTrigger.refresh(); }, 300);
      }
    } else {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    }
  } catch (e) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- counters ---------- */
  var counts = document.querySelectorAll(".count");
  function runCount(el) {
    var end = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduced) { el.textContent = end.toLocaleString("en-US"); return; }
    var start = 0;
    var dur = 1400;
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(start + (end - start) * eased).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    counts.forEach(function (c) { cObs.observe(c); });
  } else {
    counts.forEach(runCount);
  }

  /* ---------- tilt ---------- */
  var fine = window.matchMedia("(pointer: fine)").matches;
  if (fine && !reduced) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(800px) rotateY(" + (px * 10).toFixed(2) + "deg) rotateX(" + (-py * 10).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- form ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = document.getElementById("fName");
      var email = document.getElementById("fEmail");
      var msg = document.getElementById("fMsg");
      var ok = true;
      function setErr(id, text) {
        var el = document.getElementById(id);
        if (el) el.textContent = text;
      }
      setErr("eName", ""); setErr("eEmail", ""); setErr("eMsg", "");
      var okBox = document.getElementById("formOk");
      if (okBox) okBox.textContent = "";
      if (!name.value || name.value.trim().length < 2) { setErr("eName", "Please enter your name."); ok = false; }
      if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { setErr("eEmail", "Please enter a valid email."); ok = false; }
      if (!msg.value || msg.value.trim().length < 10) { setErr("eMsg", "Please write at least 10 characters."); ok = false; }
      if (!ok) return;
      if (okBox) okBox.textContent = "Thanks. Your message is on its way. We reply soon.";
      form.reset();
    });
  }

  /* ---------- back to top ---------- */
  var top = document.getElementById("toTop");
  if (top) top.addEventListener("click", function () {
    if (lenis && lenis.scrollTo) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });
})();
