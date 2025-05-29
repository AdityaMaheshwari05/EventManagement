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

async function loadMyBookings() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(
      "http://localhost:8080/api/bookings/my-bookings",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch bookings");

    const bookings = await response.json();

    if (bookings.length === 0) {
      document.getElementById("no-bookings").classList.remove("hidden");
      return;
    }

    const now = new Date();

    const upcomingBookings = bookings.filter(
      (booking) => !booking.cancelled && new Date(booking.event.dateTime) > now
    );

    const pastBookings = bookings.filter(
      (booking) => !booking.cancelled && new Date(booking.event.dateTime) <= now
    );

    const cancelledBookings = bookings.filter((booking) => booking.cancelled);

    displayBookings(upcomingBookings, "upcoming-bookings");
    displayBookings(pastBookings, "past-bookings");
    displayBookings(cancelledBookings, "cancelled-bookings");

    // Show appropriate message if a tab is empty
    if (upcomingBookings.length === 0) {
      document.getElementById("upcoming-bookings").innerHTML = `
                <div class="no-bookings-in-tab">
                    <i class="far fa-calendar-plus"></i>
                    <p>No upcoming bookings. <a href="events.html">Browse events</a> to book one!</p>
                </div>
            `;
    }

    if (pastBookings.length === 0) {
      document.getElementById("past-bookings").innerHTML = `
                <div class="no-bookings-in-tab">
                    <i class="far fa-calendar-check"></i>
                    <p>No past bookings yet.</p>
                </div>
            `;
    }

    if (cancelledBookings.length === 0) {
      document.getElementById("cancelled-bookings").innerHTML = `
                <div class="no-bookings-in-tab">
                    <i class="far fa-calendar-times"></i>
                    <p>No cancelled bookings.</p>
                </div>
            `;
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    document.querySelector(".my-bookings .container").innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Failed to load bookings</h3>
                <p>${error.message}</p>
                <a href="index.html" class="btn btn-primary">Go Home</a>
            </div>
        `;
  }
}

async function bookEvent(eventId) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      `http://localhost:8080/api/bookings/${eventId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Booking failed");
    }

    return await response.json();
  } catch (error) {
    console.error("Error booking event:", error);
    throw error;
  }
}

async function getMyBookings() {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch(
      "http://localhost:8080/api/bookings/my-bookings",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) throw new Error("Failed to fetch bookings");
    return await response.json();
  } catch (error) {
    console.error("Error fetching bookings:", error);
    throw error;
  }
}

let eventListenersAttached = false;

// In bookings.js
function displayBookings(bookings, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = bookings
    .map(
      (booking) => `
        <div class="booking-card ${booking.cancelled ? "cancelled" : ""}">
              <div class="booking-event">
                  <div class="event-image">
                      <img src="${
                        window.categoryImages?.[booking.event.category] ||
                        window.categoryImages?.DEFAULT ||
                        "assets/images/default-event.jpg"
                      }" 
                           alt="${booking.event.title}">
                  </div>
                  <div class="event-info">
                      <h3>${booking.event.title}</h3>
                      <div class="event-meta">
                          <span class="event-category">${
                            booking.event.category
                          }</span>
                          <span class="event-date">
                              <i class="far fa-calendar-alt"></i>
                              ${new Date(
                                booking.event.dateTime
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                          </span>
                      </div>
                  </div>
              </div>
              <div class="booking-details">
                  <div class="booking-meta">
                      <p><strong>Booked on:</strong> ${new Date(
                        booking.bookedAt
                      ).toLocaleDateString()}</p>
                      ${
                        booking.cancelled
                          ? "<p><strong>Cancelled</strong></p>"
                          : ""
                      }
                  </div>
                  <div class="booking-actions">
                      <a href="event-detail.html?id=${
                        booking.event.id
                      }" class="btn btn-outline">View Event</a>
                      ${
                        !booking.cancelled &&
                        new Date(booking.event.dateTime) > new Date()
                          ? `
                          <button class="btn btn-danger cancel-booking-btn" data-id="${booking.id}">Cancel Booking</button>
                      `
                          : ""
                      }
                  </div>
              </div>
          </div>
    `
    )
    .join("");

  if (!eventListenersAttached) {
    document.querySelectorAll(".cancel-booking-btn").forEach((btn) => {
      btn.addEventListener("click", async function () {
        // Your cancellation logic here
      });
    });
    eventListenersAttached = true;
  }

  // Add event listeners to cancel buttons - UPDATED VERSION
  const cancelButtons = document.querySelectorAll(".cancel-booking-btn");

  // Remove any existing listeners first to prevent duplicates
  cancelButtons.forEach((btn) => {
    btn.replaceWith(btn.cloneNode(true));
  });

  // Add new listeners
  document.querySelectorAll(".cancel-booking-btn").forEach((btn) => {
    btn.addEventListener(
      "click",
      async function () {
        if (!confirm("Are you sure you want to cancel this booking?")) return;

        try {
          const response = await fetch(
            `http://localhost:8080/api/bookings/${this.dataset.id}/cancel`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || errorData.message || "Cancellation failed"
            );
          }

          const result = await response.json();
          showAlert(
            result.message || "Booking cancelled successfully",
            "success"
          );
          loadMyBookings(); // Refresh the list
        } catch (error) {
          console.error("Cancellation error:", error);
          showAlert(error.message, "error");
        }
      },
      { once: true }
    ); // This ensures the handler runs only once
  });
}

// Tab switching
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // Update active tab
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Show corresponding content
    document
      .querySelectorAll(".bookings-list")
      .forEach((list) => list.classList.add("hidden"));
    document
      .getElementById(`${btn.dataset.tab}-bookings`)
      .classList.remove("hidden");
  });
});

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadMyBookings();
});
