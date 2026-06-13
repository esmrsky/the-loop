(function () {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);
  document.body.classList.add("js");

  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const D = RM ? 0.05 : 1;
  const C = window.CONTENT;

  const state = {
    need: C.defaults.need,
    agent: C.defaults.agent,
    will: 0,
    achieve: 0,
    labelMode: "personal"
  };

  Loop.init({ durScale: D });

  // ---------- personalization ----------
  function reroute() { return C.reroutes[state.agent] || "the fridge"; }

  function fill(tpl) {
    return tpl.replace("{need}", state.need).replace("{agent}", state.agent);
  }

  function syncBinds() {
    document.querySelectorAll("[data-bind=need]").forEach((el) => (el.textContent = state.need));
    document.querySelectorAll("[data-bind=agent]").forEach((el) => (el.textContent = state.agent));
    document.querySelectorAll("[data-bind=reroute]").forEach((el) => (el.textContent = reroute()));
    if (state.labelMode === "personal") applyLabels("personal");
  }

  function applyLabels(mode) {
    state.labelMode = mode;
    const set = C.nodeLabels[mode];
    Object.keys(set).forEach((id) => Loop.setLabel(id, fill(set[id].main), fill(set[id].sub)));
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
  syncBinds();

  // ---------- shading ----------
  function shade(cls) {
    document.body.classList.remove("deep", "deepest");
    if (cls) document.body.classList.add(cls);
  }

  function goLight() {
    document.body.classList.remove("deep", "deepest");
    document.body.classList.add("light");
    document.querySelectorAll(".post-grace").forEach((el) => el.classList.add("revealed"));
  }

  function ensureGrace(then) {
    if (Loop.graceDone) { then && then(); return; }
    Loop.grace(goLight, then);
  }

  // ---------- step states ----------
  const stateHandlers = {
    n1: () => Loop.showUpTo(1),
    n2: () => Loop.showUpTo(2),
    n3: () => Loop.showUpTo(3),
    n4: () => Loop.showUpTo(4),
    n5: () => Loop.showUpTo(5),
    n6: () => Loop.showUpTo(6),
    earnloop: () => applyLabels("earning"),
    backpersonal: () => applyLabels("personal"),
    curvatus: () => { if (state.labelMode !== "personal") applyLabels("personal"); Loop.centerLabel(true); },
    graceauto: () => ensureGrace(),
    fruits: () => ensureGrace(() => {
      Loop.showFruits();
      const note = document.getElementById("stageNote");
      note.textContent = C.spiralCaption;
      note.classList.add("shown");
    })
  };

  function buildTriggers() {
    document.querySelectorAll("[data-state]").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 62%",
        onEnter: () => stateHandlers[el.dataset.state] && stateHandlers[el.dataset.state](),
        onEnterBack: () => stateHandlers[el.dataset.state] && stateHandlers[el.dataset.state]()
      });
    });

    // active step highlighting
    document.querySelectorAll(".step").forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: "top 70%",
        end: "bottom 35%",
        onToggle: (self) => el.classList.toggle("active", self.isActive)
      });
    });

    // the center label is a reveal — hide it again if the reader scrolls back up
    ScrollTrigger.create({
      trigger: "[data-state=curvatus]",
      start: "top 62%",
      onLeaveBack: () => Loop.centerLabel(false)
    });

    // stage fade-in + background shading
    ScrollTrigger.create({
      trigger: ".scrolly", start: "top 75%",
      onEnter: () => { gsap.to(".stage-inner", { opacity: 1, duration: 1.2 * D }); shade("deep"); },
      onLeaveBack: () => shade(null)
    });
    ScrollTrigger.create({
      trigger: "#act-earn", start: "top 62%",
      onEnter: () => !Loop.graceDone && shade("deepest"),
      onLeaveBack: () => !Loop.graceDone && shade("deep")
    });
    ScrollTrigger.refresh();
  }

  // wait for fonts/layout so trigger positions are computed against the final page
  if (document.readyState === "complete") buildTriggers();
  else window.addEventListener("load", buildTriggers);

  // ---------- act 3: run the loop ----------
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

  // ---------- act 4: willpower ----------
  const willBtn = document.getElementById("willBtn");
  willBtn.addEventListener("click", () => {
    state.will++;
    willBtn.disabled = true;
    if (state.will === 1) {
      document.getElementById("beat1").classList.add("shown");
      Loop.willpower(1, () => {
        Loop.setLabel("behavior", reroute(), "the new exit");
        document.getElementById("beat2").classList.add("shown");
      }, () => {
        willBtn.disabled = false;
        willBtn.textContent = "Try willpower again";
      });
    } else {
      document.getElementById("beat3").classList.add("shown");
      Loop.willpower(2, null, () => {
        Loop.setLabel("behavior", state.agent, "the exit");
        willBtn.textContent = "The loop knows this trick now";
      });
    }
  });

  // ---------- act 4.5: acceptance meter ----------
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

  // ---------- act 5: receive ----------
  const receiveBtn = document.getElementById("receiveBtn");
  receiveBtn.addEventListener("click", () => {
    receiveBtn.disabled = true;
    receiveBtn.textContent = "received";
    ensureGrace();
  });

  // ---------- act 7: restart ----------
  document.getElementById("restartBtn").addEventListener("click", () => {
    window.scrollTo(0, 0);
    setTimeout(() => location.reload(), 60);
  });
})();
