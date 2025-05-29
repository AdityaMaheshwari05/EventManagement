// Global variable to store original event data
let currentEvent = null;

// Helper function to display errors
function showError(message, isFatal = false) {
  console.error(message);
  alert(message);
  if (isFatal) {
    window.location.href = "my-events.html";
  }
}

// Helper function to get URL parameter
function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  const paramValue = urlParams.get(name);
  console.log(`URL parameter ${name}:`, paramValue);
  return paramValue;
}

// Helper function to safely get form values
function getFormValue(id) {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Form element with ID '${id}' not found`);
  }
  return element.value;
}

// Helper function to safely set form values
function setFormValue(id, value) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Element with ID '${id}' not found`);
    return false;
  }
  element.value = value !== undefined && value !== null ? value : "";
  return true;
}

// Verify all required elements exist
function verifyRequiredElements() {
  const requiredElements = [
    "editEventForm",
    "eventTitle",
    "eventDescription",
    "eventCategory",
    "eventDateTime",
    "eventLocation",
    "eventMaxSlots",
    "submitBtn",
    "cancelBtn",
  ];

  const missingElements = requiredElements.filter(
    (id) => !document.getElementById(id)
  );

  if (missingElements.length > 0) {
    throw new Error(`Missing required elements: ${missingElements.join(", ")}`);
  }
}

// Populate form with event data
function populateForm(event) {
  if (!event) {
    throw new Error("No event data provided to populate form");
  }

  // Convert and set date
  if (event.dateTime) {
    try {
      const date = new Date(event.dateTime);
      if (!isNaN(date.getTime())) {
        const localDateTime = new Date(
          date.getTime() - date.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        setFormValue("eventDateTime", localDateTime);
      }
    } catch (error) {
      console.error("Error converting date:", error);
    }
  }

  // Set other form values
  setFormValue("eventTitle", event.title);
  setFormValue("eventDescription", event.description);
  setFormValue("eventCategory", event.category);
  setFormValue("eventLocation", event.location);
  setFormValue("eventMaxSlots", event.maxSlots);
}

// Load event data from API
async function loadEvent(eventId) {
  const form = document.getElementById("editEventForm");
  const loadingIndicator = document.createElement("div");
  loadingIndicator.className = "loading";
  loadingIndicator.textContent = "Loading event details...";
  form.replaceWith(loadingIndicator);

  try {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const response = await fetch(
      `http://localhost:8080/api/events/${eventId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Server returned ${response.status}`
      );
    }

    const eventData = await response.json();

    if (!eventData) {
      throw new Error("Received empty event data");
    }

    populateForm(eventData);
    currentEvent = eventData;
  } catch (error) {
    console.error("Error loading event:", error);
    throw error;
  } finally {
    loadingIndicator.replaceWith(form);
  }
}

// Validate form data
function validateFormData(formData) {
  const errors = [];

  if (!formData.title) {
    document.getElementById("titleError").textContent = "Title is required";
    errors.push("Title is required");
  }
  if (!formData.description) {
    document.getElementById("descriptionError").textContent =
      "Description is required";
    errors.push("Description is required");
  }
  if (!formData.category) {
    document.getElementById("categoryError").textContent =
      "Category is required";
    errors.push("Category is required");
  }
  if (!formData.dateTime) {
    document.getElementById("dateTimeError").textContent =
      "Date and time is required";
    errors.push("Date and time is required");
  }
  if (!formData.location) {
    document.getElementById("locationError").textContent =
      "Location is required";
    errors.push("Location is required");
  }
  if (isNaN(formData.maxSlots) || formData.maxSlots < 1) {
    document.getElementById("maxSlotsError").textContent =
      "Must have at least 1 attendee";
    errors.push("Invalid attendee count");
  }

  return errors;
}

// Update event via API
async function updateEvent(eventId) {
  const submitBtn = document.getElementById("submitBtn");
  if (!submitBtn) {
    throw new Error("Submit button not found");
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Updating...";

  // Clear previous errors
  document.querySelectorAll(".error").forEach((el) => (el.textContent = ""));

  try {
    // Get form data
    const formData = {
      title: getFormValue("eventTitle").trim(),
      description: getFormValue("eventDescription").trim(),
      category: getFormValue("eventCategory"),
      dateTime: getFormValue("eventDateTime"),
      location: getFormValue("eventLocation").trim(),
      maxSlots: parseInt(getFormValue("eventMaxSlots")),
    };

    // Validate form data
    const validationErrors = validateFormData(formData);
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join("\n"));
    }

    // Calculate available slots if maxSlots changed
    if (currentEvent && formData.maxSlots !== currentEvent.maxSlots) {
      const slotsDifference = formData.maxSlots - currentEvent.maxSlots;
      formData.availableSlots = currentEvent.availableSlots + slotsDifference;

      if (formData.availableSlots < 0) {
        document.getElementById(
          "maxSlotsError"
        ).textContent = `Cannot reduce below ${
          currentEvent.maxSlots - currentEvent.availableSlots
        } (current bookings)`;
        throw new Error("Cannot reduce slots below current bookings");
      }
    }

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const response = await fetch(
      `http://localhost:8080/api/events/${eventId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.message || `Update failed with status ${response.status}`;

      if (response.status === 403) {
        throw new Error(`Permission denied: ${errorMessage}`);
      } else if (response.status === 400) {
        throw new Error(`Invalid data: ${errorMessage}`);
      } else {
        throw new Error(errorMessage);
      }
    }

    alert("Event updated successfully");
    window.location.href = "my-events.html";
  } catch (error) {
    console.error("Error in updateEvent:", error);
    throw error;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Update Event";
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    console.log("Initializing edit event page");

    // 1. Verify all required elements exist
    verifyRequiredElements();

    // 2. Get event ID from URL
    const eventId = getUrlParam("id");
    if (!eventId) {
      throw new Error(
        "No event specified in URL. Please select an event from the events list."
      );
    }

    // 3. Setup cancel button
    document.getElementById("cancelBtn").addEventListener("click", () => {
      if (
        confirm(
          "Are you sure you want to cancel editing? Any unsaved changes will be lost."
        )
      ) {
        window.location.href = "my-events.html";
      }
    });

    // 4. Load event data
    console.log("Loading event data for ID:", eventId);
    await loadEvent(eventId);

    // 5. Setup form submission
    document
      .getElementById("editEventForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await updateEvent(eventId);
        } catch (error) {
          showError(error.message);
        }
      });

    console.log("Page initialization complete");
  } catch (error) {
    console.error("Initialization failed:", error);
    showError(error.message, true);
  }
});
