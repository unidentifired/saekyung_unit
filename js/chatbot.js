(function () {
  const toggle = document.getElementById("chatbot-toggle");
  const panel = document.getElementById("chatbot-panel");
  const closeBtn = document.getElementById("chatbot-close");
  const messagesEl = document.getElementById("chatbot-messages");
  const suggestionsEl = document.getElementById("chatbot-suggestions");
  const form = document.getElementById("chatbot-form");
  const input = document.getElementById("chatbot-input");

  const SUGGESTIONS = [
    "How much per night?",
    "Any unit available?",
    "Do you offer discounts?",
    "How do I book?",
  ];

  function addMessage(text, sender) {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble " + (sender === "user" ? "chat-bubble--user" : "chat-bubble--bot");
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderSuggestions(list) {
    suggestionsEl.innerHTML = "";
    list.forEach((text) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = text;
      btn.addEventListener("click", () => handleUserMessage(text));
      suggestionsEl.appendChild(btn);
    });
  }

  function unitLine(unitId) {
    // siteState is populated by availability.js / reviews.js (loaded as modules on window via firebase-config export isn't global,
    // so we read a lightweight mirror kept on window by main.js for the chatbot to use without module imports).
    const u = (window.__siteAvailability || {})[unitId];
    if (!u) return null;
    const name = unitId === "unit-a" ? "Unit A (Poolview Studio)" : "Unit B (Garden 1BR)";
    if (u.status === "available") {
      return `${name} is currently available${u.price ? ` at ₱${Number(u.price).toLocaleString()}/night` : ""}.`;
    } else if (u.status === "unavailable") {
      return `${name} is currently booked.`;
    }
    return `${name}'s status hasn't been set by the owner yet.`;
  }

  function handleUserMessage(rawText) {
    const text = rawText.trim();
    if (!text) return;
    addMessage(text, "user");
    input.value = "";

    setTimeout(() => {
      addMessage(getBotReply(text), "bot");
    }, 350);
  }

  function getBotReply(text) {
    const t = text.toLowerCase();

    if (/(price|cost|rate|how much|per night|nightly)/.test(t)) {
      const lines = [unitLine("unit-a"), unitLine("unit-b")].filter(Boolean);
      return lines.length
        ? "Current nightly rates:\n" + lines.join("\n")
        : "Rates are set by the owner and shown on the Units section above — scroll up to see current pricing.";
    }

    if (/(available|availability|vacant|open date|free date|book.*date)/.test(t)) {
      const lines = [unitLine("unit-a"), unitLine("unit-b")].filter(Boolean);
      return lines.length ? lines.join(" ") : "Checking live availability — please see the Availability section above.";
    }

    if (/(discount|promo|deal|cheaper|lower price|long.?stay|weekly|monthly)/.test(t)) {
      return "Stays of a week or longer usually get a small discount, and returning guests get priority on our better rate. Message the owner with your dates and length of stay for an exact quote.";
    }

    if (/(book|reserve|reservation|how do i)/.test(t)) {
      return "Booking is simple: check the unit's live status above, then message the owner through the Contact section with your preferred dates. They'll confirm and send payment details to lock it in.";
    }

    if (/(pool|gym|wifi|amenit|kitchen|parking|aircon|ac\b)/.test(t)) {
      return "Both units include free WiFi, air-conditioning, and access to the building's pool and gym. Unit A has a kitchenette; Unit B has a full kitchen and separate living area.";
    }

    if (/(location|address|where|far|airport|beach)/.test(t)) {
      return "We're in Marigondon, Lapu-Lapu City on Mactan Island — about 20 minutes from Mactan-Cebu International Airport and close to several beaches.";
    }

    if (/(contact|owner|message|email|phone|call)/.test(t)) {
      return "You can reach the owner directly from the Contact section at the bottom of the page — email or phone, whichever's easier for you.";
    }

    if (/(hi|hello|hey)/.test(t)) {
      return "Hi there! Ask me about pricing, current availability, discounts, or how booking works.";
    }

    return "I can help with pricing, availability, discounts, amenities, or how to book. Could you rephrase your question around one of those?";
  }

  toggle.addEventListener("click", () => {
    panel.classList.toggle("hidden");
    if (!panel.classList.contains("hidden") && messagesEl.children.length === 0) {
      addMessage("Hi! I'm the Saekyung Staycation assistant. Ask me about pricing, availability, or discounts.", "bot");
      renderSuggestions(SUGGESTIONS);
    }
  });
  closeBtn.addEventListener("click", () => panel.classList.add("hidden"));

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    handleUserMessage(input.value);
  });
})();
