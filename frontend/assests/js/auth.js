function showAlert(message, type) {
  const existingAlert = document.querySelector(".alert");
  if (existingAlert) existingAlert.remove();

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.innerHTML = `
      <span>${message}</span>
      <button class="close-alert">&times;</button>
    `;

  document.body.appendChild(alert);

  const autoRemove = setTimeout(() => alert.remove(), 5000);

  alert.querySelector(".close-alert").addEventListener("click", () => {
    clearTimeout(autoRemove);
    alert.remove();
  });
}

window.getUserRole = function () {
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role) return user.role;
    }

    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.role || "ATTENDEE";
    }
  } catch (e) {
    console.error("Role verification error:", e);
  }
  return "ATTENDEE";
};

window.verifyOrganizer = function () {
  const role = window.getUserRole();
  return role === "ORGANIZER";
};

function isEmailValid(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isPasswordValid(password) {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/;
  return passwordRegex.test(password);
}

async function login(email, password) {
  try {
    if (!isEmailValid(email)) {
      showAlert("Invalid email address.", "error");
      return { success: false };
    }

    if (!isPasswordValid(password)) {
      showAlert(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.",
        "error"
      );
      return { success: false };
    }

    const response = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const contentType = response.headers.get("Content-Type");

    let data = {};
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      throw new Error("Invalid response format");
    }

    if (!response.ok) {
      throw new Error("Login failed");
    }

    if (!data.token || !data.email || !data.role) {
      throw new Error("Missing login data");
    }

    const user = {
      email: data.email,
      role: data.role,
    };
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", data.token);

    return { success: true, user, token: data.token };
  } catch (error) {
    console.error("Login error:", error);
    let errorMessage = "Login failed. Please check your credentials.";
    try {
      const text = await response.text();
      errorMessage = text || errorMessage;
    } catch (e) {
      console.error("Error parsing login failure response:", e);
    }
    showAlert(errorMessage, "error");

    return { success: false };
  }
}

async function register(email, password, role) {
  try {
    if (!isEmailValid(email)) {
      showAlert("Invalid email address.", "error");
      return { success: false };
    }

    if (!isPasswordValid(password)) {
      showAlert(
        "Password must be at least 8 characters, include uppercase, lowercase, number, and special character.",
        "error"
      );
      return { success: false };
    }

    const response = await fetch("http://localhost:8080/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, role }),
    });

    const contentType = response.headers.get("Content-Type");

    if (!response.ok) {
      let errorMessage = "Registration failed. Please try again.";
      try {
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          errorMessage = errData.message || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing error message:", e);
      }

      showAlert(errorMessage, "error");
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    showAlert("Registration failed. Please check the input.", "error");
    return { success: false };
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
      }
    } catch (error) {
      showAlert("An unexpected error occurred", "error");
    } finally {
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
      }
    } catch (error) {
      showAlert("An unexpected error occurred", "error");
    } finally {
      registerBtn.disabled = false;
      registerBtn.innerHTML = originalText;
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
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

  setupLoginForm();
  setupRegistrationForm();
});
