// DOM Elements
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
const authButtons = document.querySelector(".auth-buttons");
const userDropdown = document.querySelector(".user-dropdown");

window.categoryImages = {
  CONFERENCE:
    "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  WORKSHOP:
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  SEMINAR:
    "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  MUSIC:
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  SPORTS:
    "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  ART: "https://images.unsplash.com/photo-1536922246289-88c42f957773?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
  DEFAULT:
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
};

// Toggle mobile menu
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
  hamburger.innerHTML = navLinks.classList.contains("active")
    ? '<i class="fas fa-times"></i>'
    : '<i class="fas fa-bars"></i>';
});

// Check authentication status on page load
function checkAuth() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (token && user) {
    // User is authenticated
    document
      .querySelectorAll(".auth-buttons")
      .forEach((el) => (el.style.display = "none"));
    document
      .querySelectorAll(".user-dropdown")
      .forEach((el) => (el.style.display = "flex"));
    document.getElementById("user-name").textContent = user.email;
  } else {
    // User is not authenticated
    document
      .querySelectorAll(".auth-buttons")
      .forEach((el) => (el.style.display = "flex"));
    document
      .querySelectorAll(".user-dropdown")
      .forEach((el) => (el.style.display = "none"));
  }
}

function checkAuthStatus() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || null);

  if (token) {
    // If we have a token but no user, create minimal user object
    if (!user) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const minimalUser = {
          email: payload.sub || "user@example.com",
          role: payload.role || "USER",
        };
        localStorage.setItem("user", JSON.stringify(minimalUser));
      } catch (e) {
        console.error("Error parsing token:", e);
      }
    }

    document
      .querySelectorAll(".auth-buttons")
      .forEach((el) => (el.style.display = "none"));
    document
      .querySelectorAll(".user-dropdown")
      .forEach((el) => (el.style.display = "flex"));
    document.getElementById("user-name").textContent =
      user?.email?.split("@")[0] || "User";
  } else {
    document
      .querySelectorAll(".auth-buttons")
      .forEach((el) => (el.style.display = "flex"));
    document
      .querySelectorAll(".user-dropdown")
      .forEach((el) => (el.style.display = "none"));
  }
}
// Logout functionality
document.getElementById("logout-btn")?.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
});

// Load featured events
async function loadFeaturedEvents() {
  try {
    const response = await fetch("http://localhost:8080/api/events/available");
    if (!response.ok) throw new Error("Failed to fetch events");

    const events = await response.json();
    const eventsGrid = document.getElementById("featured-events");

    if (events.length === 0) {
      eventsGrid.innerHTML =
        '<p class="no-events">No featured events available at the moment.</p>';
      return;
    }

    eventsGrid.innerHTML = events
      .slice(0, 6)
      .map(
        (event) => `
            <div class="event-card">
                <div class="event-image">
                    <img src="${
                      window.categoryImages[event.category] ||
                      window.categoryImages.DEFAULT
                    }" alt="${event.title}">
                </div>
                <div class="event-info">
                    <div class="event-date">
                        <i class="far fa-calendar-alt"></i>
                        ${new Date(event.dateTime).toLocaleDateString()}
                    </div>
                    <h3 class="event-title">${event.title}</h3>
                    <p class="event-description">${event.description}</p>
                    <div class="event-meta">
                        <span class="event-category">${event.category}</span>
                        <span class="event-slots">
                            <i class="fas fa-users"></i>
                            ${event.availableSlots}/${event.maxSlots}
                        </span>
                    </div>
                    <a href="event-detail.html?id=${
                      event.id
                    }" class="btn btn-primary" style="width: 100%; margin-top: 15px;">View Details</a>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Error loading featured events:", error);
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus();
  if (document.getElementById("featured-events")) {
    loadFeaturedEvents();
  }
});

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// Add event listeners
document.addEventListener("DOMContentLoaded", () => {
  checkAuth();

  document
    .getElementById("logout-btn")
    ?.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
});
