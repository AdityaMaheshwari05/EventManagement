let eventId;
let currentEvent;
let isBooked = false;

document.addEventListener("DOMContentLoaded", () => {
  eventId = new URLSearchParams(window.location.search).get("id");
  if (!eventId) {
    window.location.href = "events.html";
    return;
  }

  loadEventDetails();
  setupEventListeners();
});

function setupEventListeners() {
  document
    .getElementById("book-btn")
    ?.addEventListener("click", handleBookEvent);
  document
    .getElementById("cancel-booking-btn")
    ?.addEventListener("click", handleCancelBooking);
}

async function loadEventDetails() {
  try {
    const token = localStorage.getItem("token");
    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        }
      : {};

    const response = await fetch(
      `http://localhost:8080/api/events/${eventId}`,
      { headers }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to load event");
    }

    currentEvent = await response.json();

    if (currentEvent.status === "CANCELLED") {
      disableBooking("Event cancelled");
    } else if (currentEvent.availableSlots <= 0) {
      disableBooking("Fully booked");
    } else {
      displayEventDetails();
    }

    if (token) await checkUserBooking();
  } catch (error) {
    showError(error.message);
  }
}

function disableBooking(message) {
  const bookBtn = document.getElementById("book-btn");
  if (bookBtn) {
    bookBtn.disabled = true;
    bookBtn.textContent = message;
  }
}

function displayEventDetails() {
  document.getElementById("event-title").textContent = currentEvent.title;
  document.getElementById("event-description").innerHTML =
    currentEvent.description;
  document.getElementById("event-category").textContent = currentEvent.category;
  document.getElementById(
    "event-slots"
  ).textContent = `${currentEvent.availableSlots}/${currentEvent.maxSlots}`;

  const eventDate = new Date(currentEvent.dateTime);
  document.getElementById("event-date").textContent = eventDate.toLocaleString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  const statusElement = document.createElement("div");
  statusElement.className = `event-status ${
    currentEvent.status?.toLowerCase() || "active"
  }`;
  statusElement.textContent = currentEvent.status || "ACTIVE";
  document.getElementById("event-header")?.prepend(statusElement);

  if (currentEvent.organizer) {
    document.getElementById("organizer-name").textContent =
      currentEvent.organizer.email?.split("@")[0] || "Organizer";
  }

  const eventImage = document.getElementById("event-detail-image");
  if (eventImage) {
    eventImage.src =
      window.categoryImages?.[currentEvent.category] ||
      "assets/images/default-event.jpg";
  }

  initMap();
}

async function handleBookEvent() {
  const bookBtn = document.getElementById("book-btn");
  if (!bookBtn) return;

  try {
    bookBtn.disabled = true;
    bookBtn.textContent = "Processing...";

    const token = localStorage.getItem("token");
    if (!token) {
      if (confirm("You need to login to book this event. Go to login page?")) {
        window.location.href = `login.html?redirect=${encodeURIComponent(
          window.location.href
        )}`;
      }
      return;
    }

    const response = await fetch(
      `http://localhost:8080/api/bookings/${eventId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // First check if response is successful
    if (!response.ok) {
      // Try to parse error response as JSON, fallback to text
      let errorMessage = "Booking failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        const text = await response.text();
        if (text) errorMessage = text;
      }

      if (response.status === 403) {
        if (errorMessage.toLowerCase().includes("cancelled")) {
          disableBooking("Event cancelled");
          throw new Error("This event has been cancelled");
        } else if (errorMessage.toLowerCase().includes("already booked")) {
          throw new Error("You've already booked this event");
        }
      }
      throw new Error(errorMessage);
    }

    // If successful, update UI state
    isBooked = true;
    currentEvent.availableSlots--;
    updateUIAfterBooking();

    // No need to parse response if successful and we don't need data from it
  } catch (error) {
    showAlert(error.message, "error");
    console.error("Booking error:", error);
  } finally {
    bookBtn.disabled = false;
    bookBtn.textContent = "Book Now";
  }
}

function updateUIAfterBooking() {
  loadEventDetails(); // Refresh event details
  showAlert("Booking confirmed!");
}

async function checkUserBooking() {
  const token = localStorage.getItem("token");
  if (!token) {
    isBooked = false;
    updateBookingButton();
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8080/api/bookings/my-bookings",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      }
    );

    if (response.ok) {
      const bookings = await response.json();
      isBooked = bookings.some((b) => b.event.id == eventId && !b.cancelled);
    }
  } catch (error) {
    console.error("Booking check error:", error);
    isBooked = false;
  }

  updateBookingButton();
}

function updateBookingButton() {
  const bookBtn = document.getElementById("book-btn");
  const cancelBtn = document.getElementById("cancel-booking-btn");

  if (!bookBtn || !cancelBtn) return;

  bookBtn.style.display = isBooked ? "none" : "block";
  cancelBtn.style.display = isBooked ? "block" : "none";

  if (currentEvent.availableSlots <= 0 && !isBooked) {
    bookBtn.disabled = true;
    bookBtn.textContent = "Fully Booked";
  }
}

async function handleCancelBooking() {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  const token = localStorage.getItem("token");
  if (!token) {
    showAlert("Please login to cancel booking", "error");
    return;
  }

  try {
    const bookingsResponse = await fetch(
      "http://localhost:8080/api/bookings/my-bookings",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!bookingsResponse.ok) throw new Error("Failed to fetch bookings");

    const bookings = await bookingsResponse.json();
    const userBooking = bookings.find(
      (b) => b.event.id == eventId && !b.cancelled
    );

    if (!userBooking) throw new Error("No active booking found");

    const cancelResponse = await fetch(
      `http://localhost:8080/api/bookings/${userBooking.id}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!cancelResponse.ok) throw new Error("Cancellation failed");

    isBooked = false;
    currentEvent.availableSlots++;
    updateUIAfterCancellation();
  } catch (error) {
    showAlert(error.message, "error");
    console.error("Cancellation error:", error);
  }
}

function updateUIAfterCancellation() {
  updateBookingButton();
  const slotsElement = document.getElementById("event-slots");
  if (slotsElement) {
    slotsElement.textContent = `${currentEvent.availableSlots}/${currentEvent.maxSlots}`;
  }
  showAlert("Booking cancelled", "success");
}

function initMap() {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;

  try {
    // Replace with your actual Mapbox access token
    mapboxgl.accessToken =
      "pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw";

    // Only initialize map if we have a valid token
    if (!mapboxgl.accessToken || mapboxgl.accessToken === "YOUR_MAPBOX_TOKEN") {
      console.error("Mapbox access token not configured");
      return;
    }

    new mapboxgl.Map({
      container: "map",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-74.5, 40],
      zoom: 9,
    });
  } catch (error) {
    console.error("Map initialization error:", error);
  }
}

function showAlert(message, type = "success") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  document.body.appendChild(alertDiv);
  setTimeout(() => alertDiv.remove(), 5000);
}

function showError(message) {
  const container = document.querySelector(".event-detail");
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <h3>${message}</h3>
        <a href="events.html" class="btn">Back to Events</a>
      </div>
    `;
  }
}
