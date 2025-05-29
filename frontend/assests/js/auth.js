function showAlert(message, type) {
  // Remove existing alerts
  const existingAlert = document.querySelector(".alert");
  if (existingAlert) existingAlert.remove();

  // Create alert element
  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
      <span>${message}</span>
      <button class="close-alert">&times;</button>
    `;

  document.body.appendChild(alert);

  // Auto-remove after 5 seconds
  const autoRemove = setTimeout(() => alert.remove(), 5000);

  // Manual close
  alert.querySelector(".close-alert").addEventListener("click", () => {
    clearTimeout(autoRemove);
    alert.remove();
  });
}

window.getUserRole = function () {
  try {
    console.log("Checking user role...");

    // 1. First check localStorage user data
    const userData = localStorage.getItem("user");
    console.log("User data from localStorage:", userData);

    if (userData) {
      const user = JSON.parse(userData);
      console.log("Parsed user object:", user);
      if (user.role) {
        console.log("Role from user object:", user.role);
        return user.role;
      }
    }

    // 2. Fallback to token verification
    const token = localStorage.getItem("token");
    console.log("Token from localStorage:", token ? "exists" : "missing");

    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      console.log("Token payload:", payload);
      const role = payload.role || "ATTENDEE";
      console.log("Role from token:", role);
      return role;
    }
  } catch (e) {
    console.error("Role verification error:", e);
  }

  console.log("Defaulting to ATTENDEE role");
  return "ATTENDEE";
};

window.verifyOrganizer = function () {
  const role = window.getUserRole();
  console.log("Verified role:", role);
  return role === "ORGANIZER";
};

async function login(email, password) {
  try {
    const response = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Login failed");
    }

    const data = await response.json();
    console.log("Full login response:", data);

    // Verify response structure
    if (!data.token || !data.email || !data.role) {
      throw new Error("Invalid response format from server");
    }

    // Store all user data
    const user = {
      email: data.email,
      role: data.role,
    };
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", data.token);

    // Verify token payload
    const payload = JSON.parse(atob(data.token.split(".")[1]));
    console.log("Token payload:", payload);

    return { success: true, user, token: data.token };
  } catch (error) {
    console.error("Login error:", error);
    showAlert(error.message, "error");
    return { success: false, error: "Incorrect Credentials" };
  }
}

async function register(email, password, role) {
  try {
    const response = await fetch("http://localhost:8080/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed");
    }

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: error.message };
  }
}

function setupLoginForm() {
  const loginForm = document.getElementById("login-form");
  const loginBtn = document.getElementById("login-btn");

  if (!loginForm || !loginBtn) return;

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    // Set loading state
    const originalText = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    try {
      const result = await login(email, password);

      if (result.success) {
        showAlert("Login successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "index.html";
        }, 1500);
      } else {
        showAlert(result.error || "Login failed", "error");
      }
    } catch (error) {
      showAlert("An unexpected error occurred", "error");
    } finally {
      // Reset button state
      loginBtn.disabled = false;
      loginBtn.innerHTML = originalText;
    }
  });
}

function setupRegistrationForm() {
  const registerForm = document.getElementById("register-form");
  const registerBtn = document.getElementById("register-btn");

  if (!registerForm || !registerBtn) return;

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    const role = document.getElementById("register-role").value;

    // Set loading state
    const originalText = registerBtn.innerHTML;
    registerBtn.disabled = true;
    registerBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Registering...';

    try {
      const result = await register(email, password, role);

      if (result.success) {
        showAlert(
          "Registration successful! Redirecting to login...",
          "success"
        );
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        showAlert(result.error || "Registration failed", "error");
      }
    } catch (error) {
      showAlert("An unexpected error occurred", "error");
    } finally {
      // Reset button state
      registerBtn.disabled = false;
      registerBtn.innerHTML = originalText;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Add spinner animation style
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
      
      .alert-error {
        background-color: #FF3333;
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

  // Setup forms
  setupLoginForm();
  setupRegistrationForm();
});
