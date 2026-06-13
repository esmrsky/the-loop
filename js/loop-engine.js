// Diagram primitives. Scroll-driven visual state is class-based (deterministic,
// reversible); only button-driven one-shot animations use GSAP timelines.
window.Loop = (function () {
  const NODES = ["pain", "craving", "behavior", "relief", "shame"];
  const ORIGINS = {
    pain: "300 140", craving: "461.7 257.5", behavior: "399.9 447.5",
    relief: "200.1 447.5", shame: "138.3 257.5"
  };
  const CRAVING_FRAC = 0.2; // craving node's position around the ring (0=top)

  let D = 1;
  let passes = 0;
  let current = 0;
  let spiralLen = 1200;

  const node = (id) => document.getElementById("node-" + id);
  const arc = (i) => document.getElementById("arc" + i);

  function init(opts) {
    D = opts && opts.durScale != null ? opts.durScale : 1;
    NODES.forEach((id) => gsap.set(node(id), { svgOrigin: ORIGINS[id] }));
    const sp = document.getElementById("spiral");
    spiralLen = sp.getTotalLength();
    sp.style.strokeDasharray = spiralLen;
    sp.style.strokeDashoffset = spiralLen;
  }

  // Show exactly n nodes (and the arcs between them). Idempotent + reversible.
  function showUpTo(n) {
    current = n;
    NODES.forEach((id, i) => node(id).classList.toggle("on", i < n));
    for (let i = 0; i < 5; i++) {
      const on = i < n - 1 || (i === 4 && n >= 6);
      arc(i).classList.toggle("on", on);
    }
  }

  function setLabel(id, main, sub) {
    const g = node(id);
    g.querySelector(".n-main").textContent = main;
    g.querySelector(".n-sub").textContent = sub;
  }

  function centerLabel(on) {
    document.getElementById("centerLabel").classList.toggle("on", on);
  }

  // The grace morph: loop ⇄ spiral. Pure CSS state, fully reversible.
  function setSpiraled(on) {
    document.querySelector(".stage-inner").classList.toggle("spiraled", on);
    document.getElementById("spiral").style.strokeDashoffset = on ? 0 : spiralLen;
  }

  // ---- button-driven one-shots (GSAP) ----
  function runPass(onDone) {
    passes++;
    const dur = Math.max(2.8 - passes * 0.3, 1.1) * D;
    const tl = gsap.timeline({ onComplete: onDone });
    tl.set("#pulse", { opacity: 1, motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5], start: 0, end: 0 } })
      .to("#pulse", { motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5] }, duration: dur, ease: "none" })
      .to("#pulse", { opacity: 0, duration: 0.3 * D });
    gsap.to("[id^=arc].on", { strokeWidth: Math.min(1.5 + passes * 0.7, 5.5), duration: 0.8 * D });
    gsap.to(node("relief"), { scale: Math.max(1 - passes * 0.1, 0.55), duration: 0.9 * D });
    gsap.to(node("shame"), { scale: Math.min(1 + passes * 0.13, 1.7), duration: 0.9 * D });
    return tl;
  }

  function willpower(step, onReroute, onDone) {
    const tl = gsap.timeline({ onComplete: onDone });
    if (step === 1) {
      tl.to(arc(1), { opacity: 0.12, duration: 0.5 * D })
        .set("#pulse", { opacity: 1, motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5], start: 0, end: 0 } })
        .to("#pulse", { motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5], start: 0, end: CRAVING_FRAC }, duration: 1.4 * D, ease: "power2.out" })
        .to("#pulse", { x: "+=4", repeat: 7, yoyo: true, duration: 0.07 * D })
        .to(node("pain"), { scale: 1.14, duration: 0.8 * D }, "<")
        .add(() => onReroute && onReroute())
        .to("#pulse", { motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5], start: CRAVING_FRAC, end: 1 }, duration: 1.4 * D, ease: "none" }, "+=" + 0.5 * D)
        .to("#pulse", { opacity: 0, duration: 0.3 * D })
        .set(arc(1), { clearProps: "opacity" }); // hand control back to the .on class
    } else {
      tl.to(node("shame"), { scale: "+=0.2", duration: 0.8 * D })
        .to(node("pain"), { scale: "+=0.08", duration: 0.8 * D }, "<");
    }
    return tl;
  }

  function resetScales() {
    gsap.set([node("relief"), node("shame"), node("pain")], { scale: 1 });
  }

  return {
    init, showUpTo, setLabel, centerLabel, setSpiraled, runPass, willpower, resetScales,
    get passes() { return passes; },
    get current() { return current; }
  };
})();
