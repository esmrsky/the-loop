window.CONTENT = {
  defaults: { need: "worth", agent: "scrolling" },

  needs: ["rest", "comfort", "worth", "closeness", "safety", "joy"],

  agents: ["scrolling", "porn", "food", "a drink", "work", "approval", "shopping", "gaming"],

  // where the loop reroutes to when willpower cuts the wire
  reroutes: {
    "scrolling": "the fridge",
    "porn": "scrolling",
    "food": "shopping",
    "a drink": "work",
    "work": "approval",
    "approval": "work",
    "shopping": "food",
    "gaming": "scrolling"
  },

  nodeLabels: {
    personal: {
      pain:     { main: "the ache", sub: "of {need}" },
      craving:  { main: "the pull", sub: "craving" },
      behavior: { main: "{agent}", sub: "the exit" },
      relief:   { main: "relief", sub: "~11 minutes" },
      shame:    { main: "shame", sub: "the bill" }
    },
    earning: {
      pain:     { main: "enough?", sub: "the question" },
      craving:  { main: "prove it", sub: "the pull" },
      behavior: { main: "perform", sub: "the work" },
      relief:   { main: "applause", sub: "it lands" },
      shame:    { main: "wears off", sub: "the bill returns" }
    }
  },

  achievements: [
    "The grades.",
    "The promotion.",
    "The marathon.",
    "They clapped.",
    "“You’ve changed!”",
    "A perfect streak."
  ],

  spiralCaption: "the ache → brought, not hidden → met at the source → trust deepens → fruit"
};
