// utils.js
export async function handleResponse(response) {
  if (response.ok) return response.json();

  const error = await response.json();
  throw new Error(error.message || "Something went wrong");
}

export function displayError(error) {
  const errorElement = document.getElementById("error-message");
  if (errorElement) {
    errorElement.textContent = error.message;
    errorElement.style.display = "block";
    setTimeout(() => {
      errorElement.style.display = "none";
    }, 5000);
  } else {
    alert(error.message);
  }
}
