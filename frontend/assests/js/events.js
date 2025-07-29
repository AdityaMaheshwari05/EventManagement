// Global variables
let currentPage = 1;
const eventsPerPage = 9;
let totalEvents = 0;
let allEvents = [];
let currentFilters = {
  category: "",
  fromDate: "",
  searchQuery: "",
};

//Images available globally
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

async function loadEvents(page = 1, filters = {}) {
  try {
    let url = "http://localhost:8080/api/events/available?";
    const params = new URLSearchParams();

    // Safely handle filters
    if (filters?.category)
      params.append("category", filters.category.toUpperCase());
    // if (filters?.fromDate) {
    //   const dateObj = new Date(filters.fromDate);
    //   if (!isNaN(dateObj.getTime())) {
    //     params.append("fromDate", dateObj.toISOString().split("T")[0]);
    //   }
    // }
    if (filters?.searchQuery) params.append("query", filters.searchQuery);

    url += params.toString();
    console.log("Fetching:", url);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

    let events = await response.json();

    // Filter out null categories if filtering by category
    if (filters?.category) {
      events = events.filter(
        (event) => event.category === filters.category.toUpperCase()
      );
    }

    allEvents = events;
    totalEvents = events.length;

    displayEvents(page, events);
    updatePagination();

    currentFilters = { ...filters };
  } catch (error) {
    console.error("Error loading events:", error);
    showError(error.message || "Failed to load events");
  }
}
async function getMyEvents() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  try {
    const response = await fetch("http://localhost:8080/api/events/my-events", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch events");
    return await response.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

function displayEvents(page, events) {
  const startIndex = (page - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = events.slice(startIndex, endIndex);

  const eventsGrid = document.getElementById("events-grid");

  if (!paginatedEvents.length) {
    eventsGrid.innerHTML = `
        <div class="no-events">
          <i class="far fa-calendar-times"></i>
          <h3>No events found</h3>
          <p>Try adjusting your search filters</p>
        </div>
      `;
    return;
  }

  eventsGrid.innerHTML = paginatedEvents
    .map(
      (event) => `
      <div class="event-card">
        <div class="event-image">
          <img src="${
            window.categoryImages[event.category] ||
            window.categoryImages.DEFAULT
          }" 
               alt="${event.title || "Event image"}">
        </div>
        <div class="event-info">
          <h3 class="event-title">${event.title || "Untitled Event"}</h3>
          <p class="event-description">${
            event.description || "No description available"
          }</p>
          <div class="event-meta">
            <span class="event-category">${event.category || "GENERAL"}</span>
            <span class="event-date">
              <i class="far fa-calendar-alt"></i>
              ${
                event.dateTime
                  ? new Date(event.dateTime).toLocaleDateString()
                  : "Date not set"
              }
            </span>
          </div>
          <a href="event-detail.html?id=${
            event.id
          }" class="btn btn-primary">View Details</a>
        </div>
      </div>
    `
    )
    .join("");
}

async function getAvailableEvents() {
  try {
    const response = await fetch("http://localhost:8080/api/events/available");
    if (!response.ok) throw new Error("Failed to fetch events");
    return await response.json();
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

async function createEvent(eventData) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("http://localhost:8080/api/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create event");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

// Update pagination controls
function updatePagination() {
  const totalPages = Math.ceil(totalEvents / eventsPerPage);
  document.getElementById(
    "page-info"
  ).textContent = `Page ${currentPage} of ${totalPages}`;

  document.getElementById("prev-page").disabled = currentPage === 1;
  document.getElementById("next-page").disabled =
    currentPage === totalPages || totalPages === 0;
}

// Pagination controls
document.getElementById("prev-page")?.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    loadEvents(currentPage, currentFilters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

document.getElementById("next-page")?.addEventListener("click", () => {
  const totalPages = Math.ceil(totalEvents / eventsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    loadEvents(currentPage, currentFilters);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});
// In event-search.js
document
  .getElementById("search-form")
  ?.addEventListener("submit", async (e) => {
    e.preventDefault();

    currentPage = 1;
    const filters = {
      category: document.getElementById("category-filter").value,
      fromDate: document.getElementById("date-filter").value,
      searchQuery: document.getElementById("search-query").value.trim(),
    };

    // Clear null/undefined filters
    Object.keys(filters).forEach((key) => {
      if (!filters[key]) delete filters[key];
    });

    await loadEvents(currentPage, filters);
  });
// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  // Check for URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const category = urlParams.get("category");
  const fromDate = urlParams.get("fromDate");

  if (category) {
    document.getElementById("category-filter").value = category;
  }

  const filters = {
    category,
    fromDate,
  };
  loadEvents(currentPage, filters);
});
