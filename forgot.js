document.addEventListener("DOMContentLoaded", function () {
    const resetForm = document.getElementById("loginForm");
    const newPasswordInput = document.getElementById("new-password");
    const confirmPasswordInput = document.getElementById("confirm-password");
    const resetBtn = document.querySelector(".sign-in-btn");

    // Create error message elements
    const newPasswordError = document.createElement("p");
    newPasswordError.classList.add("error-msg");
    
    const confirmPasswordError = document.createElement("p");
    confirmPasswordError.classList.add("error-msg");

    const successMsg = document.createElement("p");
    successMsg.classList.add("success-msg");
    successMsg.textContent = "Password reset successfully!";
    successMsg.style.display = "none"; // Initially hidden

    resetBtn.insertAdjacentElement("afterend", successMsg); // Place below reset button

    resetForm.addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission
        
        let isValid = true;
        const newPassword = newPasswordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();
        
        // Remove previous errors
        newPasswordError.textContent = "";
        confirmPasswordError.textContent = "";
        newPasswordInput.style.border = "";
        confirmPasswordInput.style.border = "";

        // Password validation: At least 8 chars, 1 letter, 1 number, 1 special char
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        if (!passwordRegex.test(newPassword)) {
            newPasswordError.textContent = "Password must be at least 8 characters with a letter, a number & a special character.";
            newPasswordInput.style.border = "2px solid red";
            newPasswordInput.insertAdjacentElement("afterend", newPasswordError);
            isValid = false;
        }

        if (newPassword !== confirmPassword) {
            confirmPasswordError.textContent = "Passwords do not match!";
            confirmPasswordInput.style.border = "2px solid red";
            confirmPasswordInput.insertAdjacentElement("afterend", confirmPasswordError);
            isValid = false;
        }

        if (!isValid) return;

        // Show success message
        successMsg.style.display = "block";

        // Redirect after 2 seconds
        setTimeout(() => {
            successMsg.style.display = "none";
            window.location.href = "login.html";
        }, 2000);
    });
});
