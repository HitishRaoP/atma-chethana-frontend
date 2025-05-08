
 const BACKEND_URL = 'https://atma-chethana-backend.vercel.app';

document.addEventListener("DOMContentLoaded", function () {
  // Handle login form submission
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      if (email === "" || password === "") {
        alert("Please fill in all fields.");
        return;
      }

      // Prepare request data
      const loginData = {
        email: email,
        password: password,
      };

      fetch(`${BACKEND_URL}/api/counsellor/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.message === "Login successful") {
            localStorage.setItem("token", data.token);
            window.location.href = "dashboard.html";
          } else {
            alert(data.message || "Login failed. Please try again.");
          }
        })
        .catch((error) => {
          console.error("Error during login:", error);
          alert("Something went wrong. Please try again later.");
        });
    });
  }

  const forgotPasswordLink = document.querySelector(".forgot-password");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", function (event) {
      event.preventDefault();
      window.location.href = "forgotPswrd.html"; // Redirect to Forgot Password page
    });
  }
});
