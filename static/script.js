const SETTINGS = {
  friendName: "Neju",
  fromName: "Your friend Harris",
  brandName: "Birthday",

  // Use local time. Example: "2026-04-02T00:00:00"
  birthdayISO: "2026-04-28T00:00:00",

  // Put an mp3 in static/assets/ and set this.
  // Example: "/static/assets/music.mp3"
  musicSrc: "/static/assets/music.mp3",

  // Slideshow on the main page (images with a `src` from gallery).
  slideshowIntervalMs: 3200,

  // Celebrate button: overlay text (confetti + optional chime).
  celebrateMessage: "Happy Birthday Neju ❤️",

  subtitle:
    "Wishing you a year full of calm wins, big laughs, and the kind of memories that stick.",

  letterTitle: "A note for you",
  letterBody:
    "You’ve been such a bright part of my life—thank you for being you. I’m proud of you, I’m cheering for you, and I hope this birthday feels like a deep exhale.",

  highlights: [
    "Your laugh (it fixes the room).",
    "Your heart (big, steady, real).",
    "Your drive (quietly unstoppable).",
  ],
  wish: "May your next year be lighter than the last and twice as beautiful.",

  // Gallery gate: visitor must answer to see photos. Case-insensitive, trimmed.
  // Leave galleryAnswer empty ("") or [] to show the gallery without a question.
  // Multiple acceptable answers: use an array or separate with |  e.g. "pink|rose"
  galleryQuestion: "What is your favorite color?",
  galleryAnswer: "pink",

  // Put photos in ./static/assets/ then add them here.
  // Example: { src: "/static/assets/photo1.jpg", title: "That day", note: "2024" }
  gallery: [
    { src: "/static/assets/hero.jpg", title: "", note: "ONE of my favorite picture" },
    { src: "/static/assets/neju1.jpg", title: "", note:  },
    { src: "", title: "", note: "You got this" },
    { src: "", title: "", note: "❤️" },
    { src: "", title: "", note: "✨" },
    { src: "", title: "", note: "🎂" },
  ],

};

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (!el) return;
  el.textContent = value;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function hydrate() {
  document.title = `Happy Birthday, ${SETTINGS.friendName}!`;

  setText("friendName", SETTINGS.friendName);
  setText("fromName", `From: ${SETTINGS.fromName}`);
  setText("brandName", SETTINGS.brandName);

  setText("letterTitle", loadOverride("letterTitle", SETTINGS.letterTitle));
  setText("letterBody", loadOverride("letterBody", SETTINGS.letterBody));
  setText("wish", loadOverride("wish", SETTINGS.wish));

  setText("footerTitle", `Made for ${SETTINGS.friendName}`);

  const overlayMsg = $("celebrateOverlayText");
  if (overlayMsg) overlayMsg.textContent = SETTINGS.celebrateMessage;

  setText("galleryGateQuestion", SETTINGS.galleryQuestion);

  // Reset gallery gate on reload for testing
  try {
    window.localStorage.removeItem(GALLERY_UNLOCK_KEY);
    window.localStorage.removeItem(GALLERY_UNLOCK_LEGACY_KEY);
  } catch {
    /* ignore */
  }

  const list = $("highlightsList");
  if (list) {
    list.innerHTML = "";
    for (const item of SETTINGS.highlights) {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    }
  }

  applyGalleryGateVisibility();
}

// Stores the normalized answer that unlocked the gallery (must match an allowed answer in SETTINGS).
const GALLERY_UNLOCK_KEY = "birthdaySite.galleryUnlockMatch";
const GALLERY_UNLOCK_LEGACY_KEY = "birthdaySite.galleryUnlocked";

function normalizeGalleryAnswer(s) {
  let t = String(s ?? "");
  try {
    t = t.normalize("NFC");
  } catch {
    /* ignore */
  }
  return t.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Acceptable answers from SETTINGS.galleryAnswer: string, "a|b", or string[]. */
function getAllowedGalleryAnswers() {
  const raw = SETTINGS.galleryAnswer;
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.map(normalizeGalleryAnswer).filter(Boolean);
  }
  const str = String(raw).trim();
  if (!str) return [];
  if (str.includes("|")) {
    return str
      .split("|")
      .map((x) => normalizeGalleryAnswer(x))
      .filter(Boolean);
  }
  const one = normalizeGalleryAnswer(str);
  return one ? [one] : [];
}

function isGalleryGateEnabled() {
  return getAllowedGalleryAnswers().length > 0;
}

function isGalleryUnlocked() {
  if (!isGalleryGateEnabled()) return true;
  try {
    const allowed = getAllowedGalleryAnswers();
    let stored = window.localStorage.getItem(GALLERY_UNLOCK_KEY);
    if (stored != null && allowed.includes(stored)) return true;
    // Legacy: old "1" flag — only trust if current single-answer set still matches (cannot verify which answer).
    const legacy = window.localStorage.getItem(GALLERY_UNLOCK_LEGACY_KEY);
    if (legacy === "1" && allowed.length === 1) {
      window.localStorage.removeItem(GALLERY_UNLOCK_LEGACY_KEY);
      window.localStorage.setItem(GALLERY_UNLOCK_KEY, allowed[0]);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function setGalleryUnlocked(matchedNormalized) {
  try {
    window.localStorage.setItem(GALLERY_UNLOCK_KEY, matchedNormalized);
    window.localStorage.removeItem(GALLERY_UNLOCK_LEGACY_KEY);
  } catch {
    /* ignore */
  }
}

function applyGalleryGateVisibility() {
  const gate = $("galleryGate");
  const content = $("galleryContent");
  const lead = $("gallerySectionLead");
  if (!gate || !content) return;

  const enabled = isGalleryGateEnabled();
  const unlocked = isGalleryUnlocked();

  if (lead) {
    lead.textContent = enabled
      ? "Moments in motion — answer the question below to unlock the photos. Use Music in the header for soft background audio "
      : "Moments in motion — autoplay or browse at your pace. Use Music in the header for soft background audio (tap to play; browsers require a gesture).";
  }

  if (!enabled || unlocked) {
    gate.hidden = true;
    content.hidden = false;
  } else {
    gate.hidden = false;
    content.hidden = true;
  }

  const section = $("gallerySection");
  if (section && (!enabled || unlocked)) {
    section.classList.add("is-visible");
  }
}

function revealSlideshowAfterUnlock() {
  initSlideshow();
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    slideshowPlaying = false;
    applySlideshowToggleLabel();
    clearSlideshowTimer();
  } else if (getSlideshowItems().length > 1 && slideshowPlaying) {
    startSlideshowTimer();
  }
}

function unlockGalleryWithAnswer(raw) {
  const got = normalizeGalleryAnswer(raw);
  const allowed = getAllowedGalleryAnswers();
  const err = $("galleryGateError");
  if (!got) {
    if (err) {
      err.textContent = "Type an answer, then tap Unlock.";
      err.hidden = false;
    }
    return false;
  }
  if (!allowed.includes(got)) {
    if (err) {
      err.textContent = "Not quite — try again.";
      err.hidden = false;
    }
    return false;
  }
  if (err) {
    err.textContent = "";
    err.hidden = true;
  }
  const input = $("galleryGateInput");
  if (input) input.value = "";
  setGalleryUnlocked(got);
  applyGalleryGateVisibility();
  $("gallerySection")?.classList.add("is-visible");
  revealSlideshowAfterUnlock();
  return true;
}

function setupGalleryGate() {
  const submit = $("galleryGateSubmit");
  const input = $("galleryGateInput");
  if (!submit || !input) return;

  const tryUnlock = () => unlockGalleryWithAnswer(input.value);

  submit.addEventListener("click", tryUnlock);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryUnlock();
  });
}

function getTypingText() {
  return loadOverride("subtitle", SETTINGS.subtitle);
}

function startTypingEffect() {
  const out = $("typingText");
  const cursor = $("typingCursor");
  if (!out) return;

  const full = getTypingText();
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduceMotion) {
    out.textContent = full;
    if (cursor) cursor.style.display = "none";
    return;
  }

  out.textContent = "";
  let i = 0;

  function tick() {
    if (i >= full.length) return;
    out.textContent += full[i];
    i += 1;
    const ms = 40 + Math.random() * 40;
    window.setTimeout(tick, ms);
  }

  tick();
}

function setupScrollReveal() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      }
    },
    { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
  );
  els.forEach((el) => io.observe(el));
}

function lsKey(key) {
  return `birthdaySite.edit.${key}`;
}

function loadOverride(key, fallback) {
  try {
    const v = window.localStorage.getItem(lsKey(key));
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

function getGalleryItems() {
  const items = (SETTINGS.gallery ?? []).filter((x) => x && (x.src || x.title || x.note));
  return items.length ? items : [];
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getSlideshowItems() {
  return getGalleryItems().filter((x) => x && x.src);
}

let slideshowIndex = 0;
let slideshowPlaying = true;
let slideshowTimer = 0;
let slideFrontEl = null;
let slideBackEl = null;

function updateSlideshowMeta() {
  const items = getSlideshowItems();
  const titleEl = $("slideshowTitle");
  const noteEl = $("slideshowNote");
  const countEl = $("slideshowCount");
  if (!items.length) {
    if (titleEl) titleEl.textContent = "Add photos";
    if (noteEl) noteEl.textContent = "List images in static/script.js (gallery entries with src).";
    if (countEl) countEl.textContent = "";
    return;
  }
  const item = items[slideshowIndex];
  if (titleEl) titleEl.textContent = item.title || `Photo ${slideshowIndex + 1}`;
  if (noteEl) noteEl.textContent = item.note || "";
  if (countEl) countEl.textContent = `${slideshowIndex + 1} / ${items.length}`;
}

function applySlideshowToggleLabel() {
  const btn = $("slideshowToggle");
  if (!btn) return;
  btn.setAttribute("aria-pressed", slideshowPlaying ? "true" : "false");
  btn.setAttribute("aria-label", slideshowPlaying ? "Pause slideshow" : "Play slideshow");
  btn.textContent = slideshowPlaying ? "Pause" : "Play";
}

function goSlideshowStep(delta) {
  const items = getSlideshowItems();
  if (items.length === 0) return;
  if (items.length === 1) {
    updateSlideshowMeta();
    return;
  }
  const nextIdx = (slideshowIndex + delta + items.length) % items.length;
  const item = items[nextIdx];
  const loader = slideBackEl;
  const show = slideFrontEl;
  if (!loader || !show) return;

  const done = () => {
    loader.onload = null;
    loader.onerror = null;
    loader.classList.add("is-visible");
    show.classList.remove("is-visible");
    slideFrontEl = loader;
    slideBackEl = show;
    slideshowIndex = nextIdx;
    updateSlideshowMeta();
  };

  loader.onerror = () => {
    loader.onload = null;
    loader.onerror = null;
    slideshowIndex = nextIdx;
    updateSlideshowMeta();
  };
  loader.src = item.src;
  loader.alt = item.title || `Photo ${nextIdx + 1}`;
  if (loader.complete) {
    loader.onload = null;
    window.requestAnimationFrame(done);
  } else {
    loader.onload = done;
  }
}

function initSlideshow() {
  const a = $("slideA");
  const b = $("slideB");
  slideFrontEl = a;
  slideBackEl = b;
  const items = getSlideshowItems();
  const prevBtn = $("slideshowPrev");
  const nextBtn = $("slideshowNext");
  const toggleBtn = $("slideshowToggle");

  if (!a || !b) return;

  if (!items.length) {
    a.removeAttribute("src");
    b.removeAttribute("src");
    a.classList.remove("is-visible");
    updateSlideshowMeta();
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (toggleBtn) toggleBtn.disabled = true;
    return;
  }

  if (prevBtn) prevBtn.disabled = items.length <= 1;
  if (nextBtn) nextBtn.disabled = items.length <= 1;
  if (toggleBtn) toggleBtn.disabled = false;

  slideshowIndex = clamp(slideshowIndex, 0, items.length - 1);
  const first = items[slideshowIndex];
  a.src = first.src;
  a.alt = first.title || `Photo ${slideshowIndex + 1}`;
  a.classList.add("is-visible");
  b.classList.remove("is-visible");
  b.removeAttribute("src");
  updateSlideshowMeta();
  applySlideshowToggleLabel();
}

function clearSlideshowTimer() {
  if (slideshowTimer) {
    window.clearInterval(slideshowTimer);
    slideshowTimer = 0;
  }
}

function startSlideshowTimer() {
  clearSlideshowTimer();
  const ms = Math.max(2000, Math.min(4000, SETTINGS.slideshowIntervalMs || 3200));
  slideshowTimer = window.setInterval(() => {
    if (!slideshowPlaying) return;
    const items = getSlideshowItems();
    if (items.length <= 1) return;
    goSlideshowStep(1);
  }, ms);
}

let slideshowControlsBound = false;

function setupSlideshow() {
  if (!slideshowControlsBound) {
    const prevBtn = $("slideshowPrev");
    const nextBtn = $("slideshowNext");
    const toggleBtn = $("slideshowToggle");

    if (prevBtn) prevBtn.addEventListener("click", () => goSlideshowStep(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => goSlideshowStep(1));
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        slideshowPlaying = !slideshowPlaying;
        applySlideshowToggleLabel();
        if (slideshowPlaying) startSlideshowTimer();
        else clearSlideshowTimer();
      });
    }
    slideshowControlsBound = true;
  }

  if (isGalleryUnlocked()) {
    revealSlideshowAfterUnlock();
  }
}

function setupModals() {
  const openers = document.querySelectorAll("[data-open-modal]");
  const closers = document.querySelectorAll("[data-close-modal]");

  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeAll = () => {
    document.querySelectorAll(".modal.is-open").forEach((m) => {
      m.classList.remove("is-open");
      m.setAttribute("aria-hidden", "true");
    });
    document.body.style.overflow = "";
  };

  openers.forEach((el) => {
    el.addEventListener("click", () => openModal(el.getAttribute("data-open-modal")));
  });

  closers.forEach((el) => {
    el.addEventListener("click", () => closeAll());
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}

function showToast({ title, subtitle = "", actionLabel = "", onAction = null, durationMs = 0 }) {
  const toast = $("toast");
  if (!toast) return () => {};

  toast.innerHTML = `
    <div>
      <div class="toast__text">${title}</div>
      ${subtitle ? `<div class="toast__small">${subtitle}</div>` : ""}
    </div>
    <div class="toast__actions">
      ${actionLabel ? `<button class="btn btn--glass" id="toastActionBtn" type="button">${actionLabel}</button>` : ""}
      <button class="iconbtn" id="toastCloseBtn" type="button" aria-label="Close">✕</button>
    </div>
  `.trim();

  toast.classList.add("is-open");

  const close = () => {
    toast.classList.remove("is-open");
    toast.innerHTML = "";
  };

  const closeBtn = $("toastCloseBtn");
  if (closeBtn) closeBtn.addEventListener("click", close, { once: true });

  const actionBtn = $("toastActionBtn");
  if (actionBtn && typeof onAction === "function") {
    actionBtn.addEventListener(
      "click",
      async () => {
        try {
          await onAction();
        } finally {
          close();
        }
      },
      { once: true },
    );
  }

  let t = 0;
  if (durationMs > 0) t = window.setTimeout(close, durationMs);
  return () => {
    if (t) window.clearTimeout(t);
    close();
  };
}

function setupMusic() {
  const dock = document.querySelector(".topbar__music");
  if (!SETTINGS.musicSrc) {
    if (dock) dock.style.display = "none";
    return;
  }
  if (dock) dock.style.display = "";

  const audio = new Audio(SETTINGS.musicSrc);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0.34;

  audio.addEventListener("error", () => {
    showToast({
      title: "Music file not found",
      subtitle: `Check musicSrc in static/script.js`,
      durationMs: 3500,
    });
  });

  const btn = $("musicToggle");
  if (!btn) return;

  const sync = () => {
    const on = !audio.paused;
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Pause background music" : "Play background music");
  };

  audio.addEventListener("play", sync);
  audio.addEventListener("pause", sync);

  btn.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      showToast({
        title: "Could not play music",
        subtitle: "Try again or check your browser audio settings.",
        durationMs: 3200,
      });
    }
    sync();
  });

  sync();
}

function playCelebrateChime() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
  void (async () => {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      if (ctx.state === "suspended") await ctx.resume();
      const now = ctx.currentTime;
      const master = ctx.createGain();
      master.gain.value = 0.09;
      master.connect(ctx.destination);

      function tone(freq, t0, dur) {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = "sine";
        o.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g);
        g.connect(master);
        o.start(t0);
        o.stop(t0 + dur + 0.02);
      }

      tone(523.25, now, 0.12);
      tone(659.25, now + 0.1, 0.14);
      tone(783.99, now + 0.2, 0.16);

      window.setTimeout(() => {
        try {
          ctx.close?.();
        } catch {
          /* ignore */
        }
      }, 900);
    } catch {
      // ignore
    }
  })();
}

function parseBirthday() {
  if (!SETTINGS.birthdayISO) return null;
  const d = new Date(SETTINGS.birthdayISO);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function startCountdown() {
  const dd = $("dd");
  const hh = $("hh");
  const mm = $("mm");
  const ss = $("ss");
  const note = $("dateNote");

  const target = parseBirthday();
  if (!target) {
    if (note) note.textContent = "Set a birthday date in static/script.js (SETTINGS.birthdayISO).";
    return;
  }

  if (note) note.textContent = `Target: ${target.toLocaleString()}`;

  const tick = () => {
    const now = new Date();
    let diff = target.getTime() - now.getTime();
    if (diff < 0) diff = 0;

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (dd) dd.textContent = String(days);
    if (hh) hh.textContent = pad2(hours);
    if (mm) mm.textContent = pad2(minutes);
    if (ss) ss.textContent = pad2(seconds);

    if (diff === 0 && note) note.textContent = "It’s birthday time. 🎉";
  };

  tick();
  window.setInterval(tick, 1000);
}

// --- Confetti ---
function setupConfetti() {
  const canvas = $("confetti");
  const btn = $("confettiBtn");
  if (!canvas || !btn) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let raf = 0;
  let running = false;
  let burstUntil = 0;
  const pieces = [];
  const colors = ["#fb7185", "#a855f7", "#f472d0", "#fde68a", "#fff", "#c4b5fd"];
  const shapes = ["rect", "heart"];

  function resize() {
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnBurst({ x, y, power = 1 }) {
    const count = Math.floor(190 * power);
    for (let i = 0; i < count; i++) {
      const size = 3.5 + Math.random() * 7.5;
      const angle = Math.random() * Math.PI * 2;
      const spd = (4 + Math.random() * 9) * power;
      pieces.push({
        x,
        y,
        vx: Math.cos(angle) * spd + (Math.random() - 0.5) * 1.6,
        vy: Math.sin(angle) * spd - (8 + Math.random() * 6) * power,
        g: 0.14 + Math.random() * 0.10,
        r: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.30,
        w: size,
        h: size * (0.6 + Math.random() * 1.5),
        color: colors[(Math.random() * colors.length) | 0],
        life: 190 + ((Math.random() * 100) | 0),
        shape: shapes[(Math.random() * shapes.length) | 0],
        swing: (Math.random() - 0.5) * 0.06,
      });
    }
  }

  function drawHeart(px, py, size, color, alpha, rot) {
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const s = size / 12;
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(-6, -2, -12, 4, 0, 14);
    ctx.bezierCurveTo(12, 4, 6, -2, 0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function hardStop() {
    running = false;
    burstUntil = 0;
    cancelAnimationFrame(raf);
    raf = 0;
    pieces.length = 0;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    canvas.style.opacity = "1";
    canvas.style.transition = "";
  }

  function step() {
    if (!running) return;
    raf = requestAnimationFrame(step);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    const w = window.innerWidth;
    const h = window.innerHeight;
    if (Date.now() < burstUntil && Math.random() < 0.045) {
      spawnBurst({
        x: w * (0.12 + Math.random() * 0.76),
        y: h * (0.08 + Math.random() * 0.32),
        power: 0.55 + Math.random() * 0.55,
      });
    }

    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vx += p.swing;
      p.r += p.vr;
      p.life -= 1;

      const a = Math.max(0, Math.min(1, p.life / 120));
      if (p.shape === "heart") {
        drawHeart(p.x, p.y, p.w * 2.2, p.color, a, p.r);
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (p.life <= 0 || p.y > window.innerHeight + 40) pieces.splice(i, 1);
    }
  }

  function openCelebrateOverlay() {
    const el = $("celebrateOverlay");
    if (!el) return;
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    window.setTimeout(() => {
      el.classList.remove("is-open");
      el.setAttribute("aria-hidden", "true");
    }, 2600);
  }

  function start() {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
      openCelebrateOverlay();
      return;
    }

    hardStop();
    running = true;
    resize();
    canvas.style.opacity = "1";
    canvas.style.transition = "opacity 0.85s ease";

    openCelebrateOverlay();
    playCelebrateChime();

    const cx = window.innerWidth * (0.25 + Math.random() * 0.5);
    const cy = window.innerHeight * 0.2;
    spawnBurst({ x: cx, y: cy, power: 1.15 });
    spawnBurst({ x: cx + 130, y: cy + 36, power: 0.95 });
    spawnBurst({ x: cx - 130, y: cy + 36, power: 0.95 });
    window.setTimeout(() => spawnBurst({ x: cx, y: cy + 20, power: 0.85 }), 320);
    window.setTimeout(() => spawnBurst({ x: cx - 80, y: cy + 10, power: 0.75 }), 700);
    window.setTimeout(() => spawnBurst({ x: cx + 90, y: cy + 14, power: 0.75 }), 1100);

    burstUntil = Date.now() + 2600;
    step();

    window.setTimeout(() => {
      canvas.style.opacity = "0";
    }, 3600);

    window.setTimeout(() => {
      hardStop();
    }, 4600);
  }

  btn.addEventListener("click", () => {
    start();
  });

  window.addEventListener("resize", () => {
    if (!running) return;
    resize();
  });
}

function setupBackToTop() {
  const a = $("backToTop");
  if (!a) return;
  a.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

hydrate();
startTypingEffect();
startCountdown();
setupConfetti();
setupBackToTop();
setupModals();
setupMusic();
setupSlideshow();
setupGalleryGate();
setupScrollReveal();

