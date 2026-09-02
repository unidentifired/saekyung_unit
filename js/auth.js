import { onAuthStateChanged, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, googleProvider, OWNER_EMAILS, siteState } from "./firebase-config.js";

const navSigninBtn = document.getElementById("nav-signin");
const navUser = document.getElementById("nav-user");
const reviewSigninBtn = document.getElementById("review-signin-btn");
const reviewForm = document.getElementById("review-form");
const ownerPanel = document.getElementById("owner-panel");

function renderSignedIn(user) {
  navSigninBtn.classList.add("hidden");
  navUser.classList.remove("hidden");
  navUser.classList.add("flex");
  navUser.innerHTML = `
    <img src="${user.photoURL || ""}" referrerpolicy="no-referrer" class="w-8 h-8 rounded-full border border-white/30" alt="${user.displayName || "You"}">
    <button id="signout-btn" class="text-xs text-white/70 hover:text-coral">Sign out</button>
  `;
  document.getElementById("signout-btn").addEventListener("click", () => signOut(auth));

  reviewSigninBtn.classList.add("hidden");
  reviewForm.classList.remove("hidden");

  if (siteState.isOwner) {
    ownerPanel.classList.remove("hidden");
  }
}

function renderSignedOut() {
  navSigninBtn.classList.remove("hidden");
  navUser.classList.add("hidden");
  navUser.classList.remove("flex");
  navUser.innerHTML = "";

  reviewSigninBtn.classList.remove("hidden");
  reviewForm.classList.add("hidden");
  ownerPanel.classList.add("hidden");
}

async function handleSignIn() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (err) {
    console.error("Sign-in failed:", err);
    alert("Sign-in didn't go through. Please try again.");
  }
}

navSigninBtn.addEventListener("click", handleSignIn);
reviewSigninBtn.addEventListener("click", handleSignIn);

onAuthStateChanged(auth, (user) => {
  siteState.user = user;
  siteState.isOwner = !!user && OWNER_EMAILS.includes((user.email || "").toLowerCase());

  if (user) {
    renderSignedIn(user);
  } else {
    renderSignedOut();
  }

  // Let other modules (reviews/availability) react to auth changes.
  document.dispatchEvent(new CustomEvent("auth-changed", { detail: { user, isOwner: siteState.isOwner } }));
});
