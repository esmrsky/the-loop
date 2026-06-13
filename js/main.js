(function () {
  gsap.registerPlugin(MotionPathPlugin);
  document.body.classList.add("js");

  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const D = RM ? 0.05 : 1;
  const C = window.CONTENT;

  const state = { need: C.defaults.need, agent: C.defaults.agent, will: 0, achieve: 0, labelMode: null };

  Loop.init({ durScale: D });

  // ---------- personalization ----------
  const reroute = () => C.reroutes[state.agent] || "the fridge";
  const fill = (t) => t.replace("{need}", state.need).replace("{agent}", state.agent);

  function applyLabels(mode) {
    state.labelMode = mode;
    const set = C.nodeLabels[mode];
    Object.keys(set).forEach((id) => Loop.setLabel(id, fill(set[id].main), fill(set[id].sub)));
  }

  function syncBinds() {
    document.querySelectorAll("[data-bind=need]").forEach((el) => (el.textContent = state.need));
    document.querySelectorAll("[data-bind=agent]").forEach((el) => (el.textContent = state.agent));
    document.querySelectorAll("[data-bind=reroute]").forEach((el) => (el.textContent = reroute()));
    applyLabels(state.labelMode === "earning" ? "earning" : "personal");
  }

  document.querySelectorAll(".chips").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      group.querySelectorAll(".chip").forEach((b) => b.classList.remove("sel"));
      btn.classList.add("sel");
      state[group.dataset.key] = btn.dataset.value;
      syncBinds();
    });
  });
  applyLabels("personal");

  // ---------- the single deterministic, reversible scroll renderer ----------
  const $ = (s) => document.querySelector(s);
  const buildSteps = Array.from(document.querySelectorAll("[data-build]"));
  const steps = Array.from(document.querySelectorAll(".step"));
  const elScrolly = $(".scrolly");
  const elEarn = document.getElementById("act-earn");
  const elCurvatus = document.getElementById("step-curvatus");
  const elGrace = document.getElementById("step-grace");
  const stageNote = document.getElementById("stageNote");

  const passedBy = (el, frac) => el && el.getBoundingClientRect().top < innerHeight * frac;

  let wasSpiraled = false;

  function update() {
    if (!elScrolly) return;
    const vh = innerHeight;
    const scrollyTop = elScrolly.getBoundingClientRect().top;

    const earnOn = passedBy(elEarn, 0.55);
    const curvOn = passedBy(elCurvatus, 0.55);
    const graceOn = passedBy(elGrace, 0.55);

    // diagram build — count of build steps scrolled past (full once we hit earning)
    let n = 0;
    for (const s of buildSteps) if (passedBy(s, 0.62)) n++;
    if (earnOn) n = 6;
    Loop.showUpTo(graceOn ? 6 : n);

    // node labels: earning between the earning act and the curvatus reveal
    const wantMode = earnOn && !curvOn ? "earning" : "personal";
    if (state.labelMode !== wantMode) applyLabels(wantMode);

    // "incurvatus in se" only during the curvatus reveal, before grace
    Loop.centerLabel(curvOn && !graceOn);

    // grace: loop ⇄ spiral, dark ⇄ light — all reversible
    Loop.setSpiraled(graceOn);
    if (graceOn && !wasSpiraled) Loop.resetScales();
    wasSpiraled = graceOn;
    document.body.classList.toggle("past-grace", graceOn);
    stageNote.textContent = C.spiralCaption;
    stageNote.classList.toggle("shown", graceOn);

    // background zone
    let bg = "";
    if (graceOn) bg = "light";
    else if (earnOn) bg = "deepest";
    else if (scrollyTop < vh * 0.6) bg = "deep";
    document.body.classList.remove("deep", "deepest", "light");
    if (bg) document.body.classList.add(bg);

    // active step = the one nearest the middle of the viewport
    let best = null, bestDist = Infinity;
    for (const s of steps) {
      const r = s.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) continue;
      const d = Math.abs(r.top + r.height / 2 - vh * 0.5);
      if (d < bestDist) { bestDist = d; best = s; }
    }
    steps.forEach((s) => s.classList.toggle("active", s === best));
  }
  window.__update = update;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", update);
  addEventListener("load", update);
  update();

  // ---------- interactions (button-driven one-shots) ----------
  const runBtn = document.getElementById("runBtn");
  const loopMeta = document.getElementById("loopMeta");
  const runNote = document.getElementById("runNote");
  runBtn.addEventListener("click", () => {
    runBtn.disabled = true;
    Loop.runPass(() => (runBtn.disabled = false));
    const n = Loop.passes;
    loopMeta.textContent = "passes: " + n + " · relief: shrinking · shame: growing";
    const labels = ["Run the loop", "Run it again", "Again", "Again", "You know the way by now"];
    runBtn.textContent = labels[Math.min(n, labels.length - 1)];
    if (n >= 4) runNote.classList.add("shown");
  });

  const willBtn = document.getElementById("willBtn");
  willBtn.addEventListener("click", () => {
    state.will++;
    willBtn.disabled = true;
    if (state.will === 1) {
      document.getElementById("beat1").classList.add("shown");
      Loop.willpower(1,
        () => { Loop.setLabel("behavior", reroute(), "the new exit"); document.getElementById("beat2").classList.add("shown"); },
        () => { willBtn.disabled = false; willBtn.textContent = "Try willpower again"; });
    } else {
      document.getElementById("beat3").classList.add("shown");
      Loop.willpower(2, null, () => {
        Loop.setLabel("behavior", state.agent, "the exit");
        willBtn.textContent = "The loop knows this trick now";
      });
    }
  });

  const achieveBtn = document.getElementById("achieveBtn");
  const meterFill = document.getElementById("meterFill");
  const meterLine = document.getElementById("meterLine");
  achieveBtn.addEventListener("click", () => {
    const n = state.achieve++;
    meterLine.textContent = C.achievements[n % C.achievements.length];
    const peak = Math.max(92 - n * 10, 48);
    const floor = Math.min(8 + n * 4, 30);
    const drain = Math.max(2.4 - n * 0.3, 0.9);
    gsap.timeline()
      .to(meterFill, { width: peak + "%", duration: 0.5 * D, ease: "power2.out" })
      .to(meterFill, { width: floor + "%", duration: drain * D, ease: "power1.in" });
    if (n >= 3) document.getElementById("treadmill").classList.add("shown");
  });

  // receive → scroll across the grace threshold; the renderer does the reveal
  const receiveBtn = document.getElementById("receiveBtn");
  receiveBtn.addEventListener("click", () => {
    receiveBtn.disabled = true;
    receiveBtn.textContent = "received";
    elGrace.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" });
  });

  document.getElementById("restartBtn").addEventListener("click", () => {
    scrollTo(0, 0);
    setTimeout(() => location.reload(), 60);
  });
})();
