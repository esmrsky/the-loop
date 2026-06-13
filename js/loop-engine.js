// Animation primitives for the loop diagram. Copy/labels are decided in main.js.
window.Loop = (function () {
  const NODES = ["pain", "craving", "behavior", "relief", "shame"];
  const ORIGINS = {
    pain: "300 140", craving: "461.7 257.5", behavior: "399.9 447.5",
    relief: "200.1 447.5", shame: "138.3 257.5"
  };
  // ring fractions for the pulse: top=0, then 0.2 per node clockwise
  const FRACTION = { pain: 0, craving: 0.2, behavior: 0.4, relief: 0.6, shame: 0.8 };

  let D = 1;            // duration scale (reduced motion => ~0)
  let passes = 0;
  let built = 0;        // how many nodes/arcs are visible
  let graceDone = false;

  const arc = (i) => "#arc" + i;
  const node = (id) => "#node-" + id;

  function init(opts) {
    D = opts && opts.durScale != null ? opts.durScale : 1;
    const spiral = document.getElementById("spiral");
    const len = spiral.getTotalLength();
    gsap.set(spiral, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 });
    gsap.set("#pulse", { opacity: 0 });
    NODES.forEach((id) => gsap.set(node(id), { opacity: 0, svgOrigin: ORIGINS[id] }));
    for (let i = 0; i < 5; i++) gsap.set(arc(i), { opacity: 0, strokeWidth: 1.5 });
    gsap.set("#centerLabel", { opacity: 0 });
    gsap.set("#fruits text", { opacity: 0 });
  }

  function showUpTo(n) {
    // n nodes visible; arcs trail one behind; n=6 closes the circle (arc4)
    for (let i = 0; i < 5; i++) {
      gsap.to(node(NODES[i]), { opacity: i < n ? 1 : 0, duration: 0.7 * D });
      gsap.to(arc(i), { opacity: i < n - 1 ? 1 : 0, duration: 0.7 * D });
    }
    if (n >= 6) gsap.to(arc(4), { opacity: 1, duration: 0.7 * D });
    built = Math.max(built, n);
  }

  function strengthen(extra) {
    const w = Math.min(1.5 + (passes + (extra || 0)) * 0.7, 5.5);
    gsap.to("[id^=arc]", { strokeWidth: w, duration: 0.8 * D });
  }

  function runPass(onDone) {
    showUpTo(6);
    passes++;
    const dur = Math.max(2.8 - passes * 0.3, 1.1) * D;
    const tl = gsap.timeline({ onComplete: onDone });
    tl.set("#pulse", { opacity: 1, motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5], start: 0, end: 0 } })
      .to("#pulse", { motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5] }, duration: dur, ease: "none" })
      .to("#pulse", { opacity: 0, duration: 0.3 * D });
    strengthen(0);
    gsap.to(node("relief"), { scale: Math.max(1 - passes * 0.1, 0.55), duration: 0.9 * D });
    gsap.to(node("shame"), { scale: Math.min(1 + passes * 0.13, 1.7), duration: 0.9 * D });
    return tl;
  }

  function willpower(step, onReroute, onDone) {
    showUpTo(6);
    const tl = gsap.timeline({ onComplete: onDone });
    if (step === 1) {
      // cut the wire into the behavior, stall the pulse at craving, pressure builds
      tl.to(arc(1), { opacity: 0.12, duration: 0.5 * D })
        .set("#pulse", { opacity: 1, motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5], start: 0, end: 0 } })
        .to("#pulse", { motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5], start: 0, end: FRACTION.craving }, duration: 1.4 * D, ease: "power2.out" })
        .to("#pulse", { x: "+=4", repeat: 7, yoyo: true, duration: 0.07 * D })
        .to(node("pain"), { scale: 1.14, duration: 0.8 * D }, "<")
        .to(node("shame"), { scale: "+=0.12", duration: 0.8 * D }, "<")
        .add(() => onReroute && onReroute())
        .to(arc(1), { opacity: 1, strokeWidth: "+=1.2", duration: 0.6 * D }, "+=" + 0.6 * D)
        .to("#pulse", { motionPath: { path: "#ring", align: "#ring", alignOrigin: [0.5, 0.5], start: FRACTION.craving, end: 1 }, duration: 1.4 * D, ease: "none" })
        .to("#pulse", { opacity: 0, duration: 0.3 * D });
    } else {
      // the dam breaks: everything thicker, shame swells
      tl.to("[id^=arc]", { strokeWidth: "+=1", duration: 0.8 * D })
        .to(node("shame"), { scale: "+=0.2", duration: 0.8 * D }, "<")
        .to(node("pain"), { scale: "+=0.08", duration: 0.8 * D }, "<");
    }
    return tl;
  }

  function setLabel(id, main, sub) {
    const g = document.querySelector(node(id));
    const tMain = g.querySelector(".n-main");
    const tSub = g.querySelector(".n-sub");
    gsap.to([tMain, tSub], {
      opacity: 0, duration: 0.25 * D, onComplete: () => {
        tMain.textContent = main;
        tSub.textContent = sub;
        gsap.to([tMain, tSub], { opacity: 1, duration: 0.35 * D });
      }
    });
  }

  function centerLabel(show) {
    gsap.to("#centerLabel", { opacity: show ? 1 : 0, duration: 1.2 * D });
  }

  function grace(onLight, onDone) {
    if (graceDone) { onDone && onDone(); return; }
    graceDone = true;
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to("#pulse", { opacity: 0, duration: 0.3 * D })
      .to(node("shame"), { opacity: 0, scale: 0.5, duration: 1.4 * D, ease: "power2.in" })
      .to([arc(3), arc(4)], { opacity: 0, duration: 1.1 * D }, "<")
      .add(() => onLight && onLight())
      .to(["#node-pain", "#node-craving", "#node-behavior", "#node-relief", "#arc0", "#arc1", "#arc2", "#centerLabel"],
        { opacity: 0, duration: 1.4 * D }, "<0.4")
      .to("#spiral", { opacity: 1, duration: 0.4 * D }, "<0.6")
      .to("#spiral", { strokeDashoffset: 0, duration: 2.8 * D, ease: "power1.inOut" }, "<");
    return tl;
  }

  function showFruits() {
    gsap.to("#fruits text", { opacity: 1, duration: 1.2 * D, stagger: 0.35 * D });
  }

  return {
    init, showUpTo, runPass, willpower, setLabel, centerLabel, grace, showFruits,
    get passes() { return passes; },
    get graceDone() { return graceDone; }
  };
})();
