document.addEventListener("DOMContentLoaded", function () {
  console.log("Create Event page loaded");

  // Enhanced organizer verification
  if (!window.verifyOrganizer()) {
    console.log("User is not organizer, redirecting...");
    showAlert(
      "Only organizers can create events. Redirecting to login...",
      "error"
    );
    setTimeout(() => {
      window.location.href = `login.html?redirect=${encodeURIComponent(
        window.location.href
      )}`;
    }, 2000);
    return;
  }

  // Initialize date picker
  flatpickr("#date-time", {
    enableTime: true,
    dateFormat: "Y-m-dTH:i", // Note the 'T' between date and time
    minDate: "today",
    time_24hr: true,
  });

  document
    .getElementById("event-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const submitBtn = document.querySelector(
        "#event-form button[type='submit']"
      );
      submitBtn.disabled = true;
      submitBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Creating Event...';

      try {
        // Validate form data
        const eventData = {
          title: document.getElementById("title").value,
          description: document.getElementById("description").value,
          category: document.getElementById("category").value,
          dateTime: document.getElementById("date-time").value,
          maxSlots: parseInt(document.getElementById("max-slots").value),
        };

        if (
          !eventData.title ||
          !eventData.description ||
          !eventData.category ||
          !eventData.dateTime ||
          isNaN(eventData.maxSlots)
        ) {
          throw new Error("Please fill in all fields correctly");
        }

        // Verify token
        const token = localStorage.getItem("token");
        if (!token || token.split(".").length !== 3) {
          throw new Error("Invalid authentication token - please login again");
        }

        // Debug token
        console.log("Raw token:", token);
        try {
          const payloadBase64 = token.split(".")[1];
          const payload = JSON.parse(atob(payloadBase64));
          console.log("Token payload:", payload);

          // Verify token has required claims
          if (!payload.sub) {
            throw new Error("Token missing required subject claim");
          }
          // Check for organizer role in either 'role' or 'authorities'
          const userRole = payload.role || payload.authorities;
          if (!userRole || !userRole.includes("ORGANIZER")) {
            throw new Error("User doesn't have organizer privileges");
          }
        } catch (e) {
          console.error("Token parsing error:", e);
          throw new Error("Invalid token format");
        }

        console.log("Request details:", {
          method: "POST",
          url: "http://localhost:8080/api/events",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });

        let response;
        try {
          response = await fetch("http://localhost:8080/api/events", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(eventData),
            credentials: "include",
          });
        } catch (networkError) {
          console.error("Network error:", networkError);
          throw new Error("Network error - please check your connection");
        }

        // Process response
        if (!response.ok) {
          let errorText = await response.text();
          let errorDetails = "Server error";

          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.message || errorJson.error || errorText;
          } catch (e) {
            errorDetails = errorText;
          }

          console.error("Server response error:", {
            status: response.status,
            statusText: response.statusText,
            details: errorDetails,
          });

          throw new Error(
            `Event creation failed (${response.status}): ${errorDetails}`
          );
        }

        // Handle success
        const event = await response.json();
        showAlert("Event created successfully!", "success");
        setTimeout(() => {
          window.location.href = `event-detail.html?id=${event.id}`;
        }, 1500);
      } catch (error) {
        console.error("Event creation failed:", {
          error: error,
          message: error.message,
          stack: error.stack,
        });
        showAlert(error.message, "error");
        if (error.message.includes("token")) {
          localStorage.removeItem("token");
          setTimeout(() => {
            // window.location.href = "login.html";
          }, 2000);
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Create Event";
      }
    });

  // Cancel button
  document.getElementById("cancel-btn")?.addEventListener("click", function () {
    if (
      confirm(
        "Are you sure you want to cancel? All unsaved changes will be lost."
      )
    ) {
      window.location.href = "my-events.html";
    }
  });

  // Styles
  const style = document.createElement("style");
  style.textContent = `
      .alert {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        background-color: #FF3333;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 400px;
      }
      .alert-success {
        background-color: #4BB543;
      }
      .close-alert {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: 15px;
      }
      .fa-spinner {
        margin-right: 8px;
        animation: fa-spin 1s infinite linear;
      }
      @keyframes fa-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(359deg); }
      }
    `;
  document.head.appendChild(style);
});
