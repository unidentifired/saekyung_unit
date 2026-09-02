import {
  doc, setDoc, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, siteState } from "./firebase-config.js";

const UNIT_IDS = ["unit-a", "unit-b"];
const ownerControlsEl = document.getElementById("owner-unit-controls");

function formatPrice(value) {
  if (!value) return "₱—";
  return "₱" + Number(value).toLocaleString("en-PH") + " / night";
}

function formatUpdated(ts) {
  if (!ts) return "Not set yet";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return "Updated " + date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function applyStatusToPill(el, status) {
  el.classList.remove("status-pill--available", "status-pill--unavailable", "status-pill--pending");
  if (status === "available") {
    el.classList.add("status-pill--available");
    el.textContent = "Available";
  } else if (status === "unavailable") {
    el.classList.add("status-pill--unavailable");
    el.textContent = "Booked";
  } else {
    el.classList.add("status-pill--pending");
    el.textContent = "Not set";
  }
}

function renderUnit(unitId, data) {
  siteState.units[unitId] = {
    ...siteState.units[unitId],
    status: data.status || "unknown",
    price: data.price || null,
    updatedAt: data.updatedAt || null,
  };

  document.querySelectorAll(`[data-unit-badge="${unitId}"]`).forEach((el) => applyStatusToPill(el, data.status));
  document.querySelectorAll(`[data-unit-badge-lg="${unitId}"]`).forEach((el) => applyStatusToPill(el, data.status));
  document.querySelectorAll(`[data-unit-price="${unitId}"]`).forEach((el) => { el.textContent = formatPrice(data.price); });
  document.querySelectorAll(`[data-unit-updated="${unitId}"]`).forEach((el) => { el.textContent = formatUpdated(data.updatedAt); });

  renderOwnerControlIfNeeded(unitId);

  // Mirror onto window so the non-module chatbot script can read live status.
  window.__siteAvailability = window.__siteAvailability || {};
  window.__siteAvailability[unitId] = siteState.units[unitId];
}

function renderOwnerControlIfNeeded(unitId) {
  if (!siteState.isOwner) return;
  const existing = document.getElementById(`owner-card-${unitId}`);
  const unit = siteState.units[unitId];
  const html = `
    <div class="owner-unit-card" id="owner-card-${unitId}">
      <p class="text-white font-medium text-sm">${unit.name}</p>
      <div class="owner-toggle-group">
        <button class="owner-toggle-btn ${unit.status === "available" ? "active-available" : ""}" data-action="set-status" data-unit="${unitId}" data-status="available">Available</button>
        <button class="owner-toggle-btn ${unit.status === "unavailable" ? "active-unavailable" : ""}" data-action="set-status" data-unit="${unitId}" data-status="unavailable">Booked</button>
      </div>
      <label class="block text-xs text-white/60 mt-3 mb-1">Nightly price (₱)</label>
      <input type="number" min="0" step="50" class="w-full text-sm rounded-lg px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-white/40" placeholder="e.g. 1800" value="${unit.price || ""}" data-action="set-price" data-unit="${unitId}">
    </div>
  `;
  if (existing) {
    existing.outerHTML = html;
  } else {
    ownerControlsEl.insertAdjacentHTML("beforeend", html);
  }
  wireOwnerControlEvents();
}

function wireOwnerControlEvents() {
  ownerControlsEl.querySelectorAll('[data-action="set-status"]').forEach((btn) => {
    btn.onclick = () => updateUnit(btn.dataset.unit, { status: btn.dataset.status });
  });
  ownerControlsEl.querySelectorAll('[data-action="set-price"]').forEach((input) => {
    input.onchange = () => {
      const price = parseInt(input.value, 10);
      if (!isNaN(price)) updateUnit(input.dataset.unit, { price });
    };
  });
}

async function updateUnit(unitId, patch) {
  try {
    await setDoc(doc(db, "units", unitId), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
  } catch (err) {
    console.error("Couldn't update unit:", err);
    alert("That update didn't save. Check your Firestore rules / connection.");
  }
}

function subscribeToUnits() {
  UNIT_IDS.forEach((unitId) => {
    onSnapshot(
      doc(db, "units", unitId),
      (snap) => {
        renderUnit(unitId, snap.exists() ? snap.data() : { status: "unknown" });
      },
      (err) => {
        console.error(`Availability listener failed for ${unitId}:`, err);
        document.querySelectorAll(`[data-unit-badge="${unitId}"], [data-unit-badge-lg="${unitId}"]`)
          .forEach((el) => { el.textContent = "Unavailable to check"; });
      }
    );
  });
}

document.addEventListener("auth-changed", () => {
  if (siteState.isOwner) {
    ownerControlsEl.innerHTML = "";
    UNIT_IDS.forEach((unitId) => renderOwnerControlIfNeeded(unitId));
  } else {
    ownerControlsEl.innerHTML = "";
  }
});

subscribeToUnits();
