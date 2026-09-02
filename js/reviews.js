import {
  collection, addDoc, deleteDoc, doc, updateDoc, onSnapshot,
  query, where, orderBy, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db, siteState } from "./firebase-config.js";

const starInput = document.getElementById("star-input");
const reviewText = document.getElementById("review-text");
const submitBtn = document.getElementById("review-submit-btn");
const statusEl = document.getElementById("review-status");
const listEl = document.getElementById("reviews-list");
const emptyEl = document.getElementById("reviews-empty");
const summaryAvg = document.getElementById("summary-avg");
const summaryCount = document.getElementById("summary-count");
const summaryBars = document.getElementById("summary-bars");
const heroAvg = document.getElementById("hero-avg-rating");
const pendingContainer = document.getElementById("owner-pending-reviews");

// ---------- Star picker for the composer ----------
let selectedRating = 0;
function renderStarInput() {
  starInput.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const span = document.createElement("span");
    span.textContent = "★";
    span.className = i <= selectedRating ? "active" : "";
    span.addEventListener("click", () => { selectedRating = i; renderStarInput(); });
    starInput.appendChild(span);
  }
}
renderStarInput();

function starString(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full);
}

function timeAgo(ts) {
  if (!ts || !ts.toDate) return "";
  const date = ts.toDate();
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

// ---------- Submit a new review (starts unapproved, pending owner review) ----------
submitBtn.addEventListener("click", async () => {
  const user = siteState.user;
  if (!user) return;
  if (selectedRating === 0) {
    statusEl.textContent = "Pick a star rating first.";
    return;
  }
  const comment = reviewText.value.trim();
  submitBtn.disabled = true;
  statusEl.textContent = "Submitting…";
  try {
    await addDoc(collection(db, "reviews"), {
      uid: user.uid,
      name: user.displayName || "Guest",
      photoURL: user.photoURL || null,
      rating: selectedRating,
      comment,
      approved: false,
      createdAt: serverTimestamp(),
    });
    statusEl.textContent = "Thanks! Your review is awaiting approval.";
    reviewText.value = "";
    selectedRating = 0;
    renderStarInput();
  } catch (err) {
    console.error("Review submit failed:", err);
    statusEl.textContent = "Couldn't submit — please try again.";
  } finally {
    submitBtn.disabled = false;
  }
});

// ---------- Public feed: approved reviews only ----------
function renderPublicReviews(reviews) {
  siteState.reviews = reviews;

  if (reviews.length === 0) {
    listEl.innerHTML = "";
    listEl.appendChild(emptyEl);
    emptyEl.textContent = "No reviews yet — be the first to share your stay.";
    summaryAvg.textContent = "—";
    summaryCount.textContent = "no reviews yet";
    heroAvg.textContent = "—";
    summaryBars.innerHTML = "";
    return;
  }

  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  summaryAvg.textContent = avg.toFixed(1);
  summaryCount.textContent = `from ${reviews.length} review${reviews.length === 1 ? "" : "s"}`;
  heroAvg.textContent = avg.toFixed(1) + " ★";

  const counts = [5, 4, 3, 2, 1].map((star) => reviews.filter((r) => r.rating === star).length);
  summaryBars.innerHTML = counts.map((count, i) => {
    const star = 5 - i;
    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return `<div class="bar-row"><span class="w-8">${star}★</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span class="w-6 text-right">${count}</span></div>`;
  }).join("");

  listEl.innerHTML = reviews.map((r) => `
    <div class="review-card">
      <div class="flex items-center gap-3">
        ${r.photoURL ? `<img src="${r.photoURL}" referrerpolicy="no-referrer" class="w-9 h-9 rounded-full">` : `<div class="w-9 h-9 rounded-full bg-sand flex items-center justify-center text-xs font-semibold">${(r.name || "G")[0]}</div>`}
        <div>
          <p class="text-sm font-medium">${escapeHtml(r.name || "Guest")}</p>
          <p class="review-stars">${starString(r.rating)}</p>
        </div>
        <span class="ml-auto text-xs text-ink/40">${timeAgo(r.createdAt)}</span>
      </div>
      ${r.comment ? `<p class="mt-3 text-sm text-ink/75 leading-relaxed">${escapeHtml(r.comment)}</p>` : ""}
    </div>
  `).join("");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function subscribeToPublicReviews() {
  const q = query(collection(db, "reviews"), where("approved", "==", true), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    renderPublicReviews(reviews);
  }, (err) => {
    console.error("Reviews listener failed:", err);
    listEl.innerHTML = "";
    listEl.appendChild(emptyEl);
    if (err.code === "failed-precondition") {
      emptyEl.textContent = "Reviews need a Firestore index — check the browser console for a link to create it.";
    } else if (err.code === "permission-denied") {
      emptyEl.textContent = "Reviews are blocked by Firestore security rules — see README.md.";
    } else {
      emptyEl.textContent = "Couldn't load reviews (" + (err.code || err.message || "unknown error") + ").";
    }
  });
}

// ---------- Owner moderation queue: pending reviews ----------
function renderPendingReviews(reviews) {
  if (reviews.length === 0) {
    pendingContainer.innerHTML = `<p class="text-sm text-seafoam/50">Nothing waiting on you right now.</p>`;
    return;
  }
  pendingContainer.innerHTML = reviews.map((r) => `
    <div class="pending-review-card">
      <div class="flex items-center justify-between">
        <p class="text-sm font-medium text-white">${escapeHtml(r.name || "Guest")} &middot; ${starString(r.rating)}</p>
        <span class="text-xs text-white/40">${timeAgo(r.createdAt)}</span>
      </div>
      ${r.comment ? `<p class="text-sm text-white/70 mt-2">${escapeHtml(r.comment)}</p>` : ""}
      <div class="pending-review-actions">
        <button class="btn-approve" data-action="approve" data-id="${r.id}">Approve</button>
        <button class="btn-remove" data-action="remove" data-id="${r.id}">Remove</button>
      </div>
    </div>
  `).join("");

  pendingContainer.querySelectorAll('[data-action="approve"]').forEach((btn) => {
    btn.addEventListener("click", () => updateDoc(doc(db, "reviews", btn.dataset.id), { approved: true }));
  });
  pendingContainer.querySelectorAll('[data-action="remove"]').forEach((btn) => {
    btn.addEventListener("click", () => deleteDoc(doc(db, "reviews", btn.dataset.id)));
  });
}

let unsubscribePending = null;
document.addEventListener("auth-changed", (e) => {
  if (unsubscribePending) { unsubscribePending(); unsubscribePending = null; }
  if (e.detail.isOwner) {
    const q = query(collection(db, "reviews"), where("approved", "==", false), orderBy("createdAt", "desc"));
    unsubscribePending = onSnapshot(q, (snap) => {
      renderPendingReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (err) => {
      console.error("Pending reviews listener failed:", err);
      pendingContainer.innerHTML = `<p class="text-sm text-seafoam/50">Couldn't load pending reviews (${err.code || "unknown error"}). Check the console for a Firestore index link, or your security rules.</p>`;
    });
  }
});

subscribeToPublicReviews();
