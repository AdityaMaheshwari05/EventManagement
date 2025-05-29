// Alert/notification system
function showAlert(message, type = "success") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.classList.add("fade-out");
    setTimeout(() => alertDiv.remove(), 500);
  }, 5000);
}

// Track if event listeners are attached
let eventListenersAttached = false;

// Load my events
async function loadMyEvents() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch("http://localhost:8080/api/events/my-events", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch events");

    const events = await response.json();
    processAndDisplayEvents(events);
  } catch (error) {
    console.error("Error loading events:", error);
    showError(error);
  }
}

// Process and display events
function processAndDisplayEvents(events) {
  const now = new Date();

  const upcomingEvents = events.filter(
    (event) => !event.cancelled && new Date(event.dateTime) > now
  );

  const pastEvents = events.filter(
    (event) => !event.cancelled && new Date(event.dateTime) <= now
  );

  const cancelledEvents = events.filter((event) => event.cancelled);

  displayEvents(upcomingEvents, "upcoming-events");
  displayEvents(pastEvents, "past-events");
  displayEvents(cancelledEvents, "cancelled-events");

  // Show empty state messages
  showEmptyState(upcomingEvents, "upcoming-events", "No upcoming events");
  showEmptyState(pastEvents, "past-events", "No past events");
  showEmptyState(cancelledEvents, "cancelled-events", "No cancelled events");
}

// Display events in a container
function displayEvents(events, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = events.map((event) => createEventCard(event)).join("");

  // Handle cancel button event listeners
  setupCancelButtons();
}

// Create event card HTML
function createEventCard(event) {
  return `
      <div class="event-card ${event.cancelled ? "cancelled" : ""}">
        <div class="event-image">
          <img src="${
            window.categoryImages[event.category] ||
            window.categoryImages.DEFAULT
          }" 
               alt="${event.title || "Event image"}">
          ${
            event.cancelled
              ? '<span class="cancelled-badge">CANCELLED</span>'
              : ""
          }
        </div>
        <div class="event-info">
          <div class="event-date">
            <i class="far fa-calendar-alt"></i>
            ${new Date(event.dateTime).toLocaleString()}
          </div>
          <h3>${event.title}</h3>
          <p>${event.description}</p>
          <div class="event-meta">
            <span>${event.category}</span>
            <span><i class="fas fa-users"></i> ${event.availableSlots}/${
    event.maxSlots
  }</span>
          </div>
          <div class="event-actions">
            <a href="event-detail.html?id=${event.id}" class="btn">View</a>
            ${
              !event.cancelled && new Date(event.dateTime) > new Date()
                ? `
              <a href="edit-event.html?id=${event.id}" class="btn">Edit</a>
              <button class="btn btn-danger cancel-btn" data-id="${event.id}">Cancel</button>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;
}

// Set up cancel button event listeners
function setupCancelButtons() {
  // Remove any existing listeners first
  const cancelButtons = document.querySelectorAll(".cancel-btn");
  cancelButtons.forEach((btn) => {
    btn.replaceWith(btn.cloneNode(true));
  });

  // Add new listeners with {once: true} to prevent duplicates
  document.querySelectorAll(".cancel-btn").forEach((btn) => {
    btn.addEventListener(
      "click",
      async function () {
        await handleCancelEvent(this.dataset.id);
      },
      { once: true }
    );
  });
}

// Handle event cancellation
// Handle event cancellation properly
async function handleCancelEvent(eventId) {
  if (
    !confirm(
      "Are you sure you want to cancel this event? This action cannot be undone."
    )
  ) {
    return;
  }

  const btn = document.querySelector(`.cancel-btn[data-id="${eventId}"]`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
  }

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const response = await fetch(
      `http://localhost:8080/api/events/${eventId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error || result.message || "Failed to cancel event"
      );
    }

    // Show success message
    showAlert("Event cancelled successfully", "success");

    // Update the UI immediately without reloading
    const eventCard = btn.closest(".event-card");
    if (eventCard) {
      // Mark as cancelled in UI
      eventCard.classList.add("cancelled");

      // Add cancelled badge
      const eventImage = eventCard.querySelector(".event-image");
      if (eventImage && !eventImage.querySelector(".cancelled-badge")) {
        const badge = document.createElement("span");
        badge.className = "cancelled-badge";
        badge.textContent = "CANCELLED";
        eventImage.appendChild(badge);
      }

      // Remove action buttons
      const actionsDiv = eventCard.querySelector(".event-actions");
      if (actionsDiv) {
        actionsDiv.innerHTML =
          '<a href="event-detail.html?id=${eventId}" class="btn">View</a>';
      }

      // Move to cancelled section
      setTimeout(() => {
        const cancelledSection = document.getElementById("cancelled-events");
        if (cancelledSection) {
          cancelledSection.prepend(eventCard);
          showEmptyState([], "upcoming-events", "No upcoming events");
          showEmptyState([], "past-events", "No past events");
          showEmptyState([], "cancelled-events", "No cancelled events");
        }
      }, 500);
    }
  } catch (error) {
    console.error("Cancellation error:", error);
    showAlert(error.message, "error");
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Cancel";
    }
  }
}

// Show empty state message
function showEmptyState(events, containerId, message) {
  if (events.length === 0) {
    document.getElementById(containerId).innerHTML = `
        <div class="empty-state">
          <p>${message}</p>
        </div>
      `;
  }
}

// Show error message
function showError(error) {
  document.querySelector(".container").innerHTML = `
      <div class="error-state">
        <h3>Error Loading Events</h3>
        <p>${error.message}</p>
        <button class="btn" onclick="loadMyEvents()">Try Again</button>
      </div>
    `;
}

// Tab switching
function setupTabSwitching() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".events-grid").forEach((grid) => {
        grid.classList.add("hidden");
      });
      document
        .getElementById(`${btn.dataset.tab}-events`)
        .classList.remove("hidden");
    });
  });
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  setupTabSwitching();
  loadMyEvents();
});
