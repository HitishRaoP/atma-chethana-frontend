const BACKEND_URL = "https://atma-chethana-backend.vercel.app";

document.addEventListener("DOMContentLoaded", function () {
  function formatTime12Hour(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }

  // Handle navigation clicks
  document.querySelectorAll(".menu a").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      document
        .querySelectorAll(".menu a")
        .forEach((el) => el.classList.remove("active"));
      this.classList.add("active");
      const section = this.getAttribute("data-section");
      document.querySelectorAll(".content-section").forEach((section) => {
        section.style.display = "none";
      });
      if (section === "dashboard") {
        document.getElementById("dashboardContent").style.display = "block";
      } else if (section === "pending") {
        document.getElementById("pendingContent").style.display = "block";
      } else if (section === "students") {
        document.getElementById("studentsContent").style.display = "block";
        loadStudentRecords();
      }
    });
  });

  // Initialize with dashboard visible
  document.getElementById("dashboardContent").style.display = "block";

  // Dashboard statistics
  async function updateDashboardStats() {
    try {
      // Get all appointments
      const response = await fetch(`${BACKEND_URL}/api/appointment`);
      const data = await response.json();

      if (data.success) {
        const appointments = data.appointments;

        // Count total students (unique users)
        const uniqueStudents = new Set(appointments.map((apt) => apt.usn)).size;

        // Count total sessions (all appointments)
        const totalSessions = appointments.length;

        // Count pending sessions (appointments with status 'scheduled')
        const pendingSessions = appointments.filter(
          (apt) => apt.status === "scheduled"
        ).length;

        // Update the stats in the UI
        document.getElementById("studentCount").textContent = uniqueStudents;
        document.getElementById("sessionCount").textContent = totalSessions;
        document.getElementById("pendingSessionCount").textContent =
          pendingSessions;
      }
    } catch (error) {
      console.error("Error updating dashboard stats:", error);
    }
  }

  // Sort dashboard table
  function sortDashboardTable() {
    const tableBody = document.querySelector("#dashboardContent table tbody");
    const rows = Array.from(tableBody.querySelectorAll("tr"));
    rows.sort((a, b) => {
      const dateA = new Date(
        a.cells[4].textContent + " " + a.cells[5].textContent
      );
      const dateB = new Date(
        b.cells[4].textContent + " " + b.cells[5].textContent
      );
      return dateA - dateB;
    });
    rows.forEach((row) => tableBody.appendChild(row));
  }

  // Save dashboard data to localStorage
  function saveDashboardData() {
    const dashboardTableBody = document.querySelector(
      "#dashboardContent table tbody"
    );
    const rows = Array.from(dashboardTableBody.querySelectorAll("tr"));
    const data = rows.map((row) => ({
      studentName: row.cells[0].textContent,
      department: row.cells[1].textContent,
      usn: row.cells[2].textContent,
      semester: row.cells[3].textContent,
      date: row.cells[4].textContent,
      time: row.cells[5].textContent,
      reason: row.cells[6].textContent,
      completed: row.querySelector(".complete-checkbox").checked,
    }));
    localStorage.setItem("dashboardData", JSON.stringify(data));
  }

  // Load dashboard data from localStorage
  async function loadDashboardData() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/appointment`);
      const data = await response.json();

      if (data.success) {
        const dashboardTableBody = document.querySelector(
          "#dashboardContent table tbody"
        );
        dashboardTableBody.innerHTML = "";

        data.appointments
          .filter(appointment => appointment.status === "scheduled" || appointment.status === "confirmed")
          .forEach((appointment) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                    <td>${appointment.studentName}</td>
                    <td>${appointment.department}</td>
                    <td>${appointment.usn}</td>
                    <td>${appointment.semester}</td>
                    <td>${new Date(appointment.date).toLocaleDateString()}</td>
                    <td>${appointment.time}</td>
                    <td>${appointment.reason}</td>
                    <td>
                        <input type="checkbox"
                               class="status-checkbox"
                               data-appointment-id="${appointment._id}">
                    </td>
                `;
            dashboardTableBody.appendChild(row);
          });

        // Add event listeners to checkboxes
        document.querySelectorAll(".status-checkbox").forEach((checkbox) => {
          checkbox.addEventListener("change", handleStatusChange);
        });

        // Update stats after loading dashboard data
        updateDashboardStats();
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
  }

  // Load pending data
  async function loadPendingData() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/appointment`);
      const data = await response.json();

      if (data.success) {
        const pendingTableBody = document.querySelector(
          "#pendingContent table tbody"
        );
        pendingTableBody.innerHTML = "";

        // Filter for pending appointments
        const pendingAppointments = data.appointments.filter(
          (apt) => apt.status === "requested" || apt.status === "pending"
        );

        pendingAppointments.forEach((appointment) => {
          const row = document.createElement("tr");
          row.setAttribute('data-appointment-id', appointment._id);
          row.innerHTML = `
                    <td>${appointment.studentName}</td>
                    <td>${appointment.department}</td>
                    <td>${appointment.usn}</td>
                    <td>${appointment.semester}</td>
                    <td>${appointment.reason}</td>
                    <td class="action-buttons">
                        <button class="confirm-btn">Confirm</button>
                    </td>
                `;
          pendingTableBody.appendChild(row);
        });

        // Update stats after loading pending data
        updateDashboardStats();
      }
    } catch (error) {
      console.error("Error loading pending data:", error);
    }
  }

  // Handle status change
  async function handleStatusChange(event) {
    const checkbox = event.target;
    const appointmentId = checkbox.dataset.appointmentId;
    const newStatus = checkbox.checked ? "completed" : "scheduled";

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/appointment/${appointmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        checkbox.checked = !checkbox.checked; // Revert the checkbox state
        showNotification("Failed to update appointment status");
      } else {
        // Update dashboard stats after successful status change
        updateDashboardStats();
        // Reload both dashboard and pending data to reflect changes
        loadDashboardData();
        loadPendingData();
      }
    } catch (error) {
      console.error("Error updating appointment status:", error);
      checkbox.checked = !checkbox.checked; // Revert the checkbox state
      showNotification("Error updating appointment status");
    }
  }

  // Check delayed sessions
  function checkDelayedSessions() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const dashboardRows = document.querySelectorAll(
      "#dashboardContent table tbody tr"
    );
    const pendingTableBody = document.querySelector(
      "#pendingContent table tbody"
    );

    dashboardRows.forEach((row) => {
      const dateStr = row.cells[4].textContent;
      const timeStr = row.cells[5].textContent;
      const checkbox = row.querySelector(".complete-checkbox");
      const sessionDateTime = new Date(`${dateStr} ${timeStr}`);

      if (sessionDateTime < today && !checkbox.checked) {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
                    <td>${row.cells[0].textContent}</td>
                    <td>${row.cells[1].textContent}</td>
                    <td>${row.cells[2].textContent}</td>
                    <td>${row.cells[3].textContent}</td>
                    <td>${row.cells[6].textContent}</td>
                    <td><button class="reschedule-btn">Reschedule</button></td>
                `;
        pendingTableBody.appendChild(newRow);
        row.remove();
        saveDashboardData();
      }
    });
    updateDashboardStats();
  }

  // Load initial data
  loadDashboardData();
  loadPendingData();
  sortDashboardTable();
  checkDelayedSessions();
  updateDashboardStats();
  setInterval(checkDelayedSessions, 60000);

  // Event listeners
  document.addEventListener("click", function (e) {
    if (e.target.classList.contains("confirm-btn")) {
      const row = e.target.closest("tr");
      if (row) {
        const studentName = row.cells[0].textContent || "Student";
        showConfirmationModal(e.target, studentName, row);
      }
    }

    if (e.target.classList.contains("reschedule-btn")) {
      const row = e.target.closest("tr");
      if (row) {
        const studentName = row.cells[0].textContent || "Student";
        showRescheduleModal(e.target, studentName, row);
      }
    }

    if (e.target.classList.contains("schedule-btn")) {
      const row = e.target.closest("tr");
      if (row) {
        const studentName = row.cells[0].textContent || "Student";
        showScheduleModal(e.target, studentName);
      }
    }

    if (e.target.id === "sendConfirmation") {
      sendConfirmationEmail();
    }

    if (e.target.id === "sendReschedule") {
      sendRescheduleEmail();
    }

    if (e.target.id === "sendSchedule") {
      sendScheduleEmail();
    }

    if (e.target.id === "cancelModal") {
      document.getElementById("appointmentModal")?.remove();
    }
  });

  document.addEventListener("change", async function (e) {
    if (e.target.classList.contains("complete-checkbox")) {
      const row = e.target.closest("tr");
      const appointmentId = e.target.dataset.appointmentId;

      if (e.target.checked) {
        try {
          // Update appointment status in the backend
          const response = await fetch(
            `${BACKEND_URL}/api/appointment/${appointmentId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ completed: true }),
            }
          );

          if (!response.ok) {
            throw new Error("Failed to update appointment");
          }

          const rowData = Array.from(row.cells)
            .slice(0, 7)
            .map((cell) => cell.textContent);
          const studentName = rowData[0];
          const sessionDate = rowData[4];
          const sessionReason = rowData[6];
          const semester = rowData[3];

          // Update student session history
          await updateStudentSessionHistory(
            studentName,
            sessionDate,
            sessionReason,
            semester
          );

          // Remove the row from the table
          row.remove();

          // Show success notification
          showNotification("Session completed and session history updated");

          // Update dashboard stats
          updateDashboardStats();
        } catch (error) {
          console.error("Error updating appointment:", error);
          e.target.checked = false; // Revert checkbox if update fails
          showNotification("Error updating appointment status");
        }
      }
    }
  });

  function updateStudentSessionHistory(studentName, date, reason, semester) {
    const studentCards = document.querySelectorAll(".student-card");
    let studentFound = false;

    studentCards.forEach((card) => {
      const studentData = JSON.parse(card.getAttribute("data-student"));
      if (studentData.name === studentName) {
        studentFound = true;
        studentData.sessions.push({ date: date, reason: reason });
        if (studentData.sem !== semester) {
          studentData.sem = semester;
          card.querySelector(".student-sem").textContent = semester;
        }
        card.setAttribute("data-student", JSON.stringify(studentData));
      }
    });

    if (!studentFound) {
      console.warn(`No student card found for ${studentName}`);
    }
  }

  async function showConfirmationModal(button, studentName, row) {
    try {
      // Get USN from the row
      const usn = row.cells[2].textContent;
      const department = row.cells[1].textContent;
      const semester = row.cells[3].textContent;

      // Fetch user data from API using USN
      const response = await fetch(
        `${BACKEND_URL}/api/student/byUSN?usn=${encodeURIComponent(usn)}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const { success, userData } = await response.json();

      if (!success || !userData) {
        console.error("User data not found");
        showNotification("Error: User data not found");
        return;
      }

      const studentEmail = userData.email;

      const modalHTML = `
            <div class="modal-overlay" id="appointmentModal">
                <div class="appointment-modal">
                    <h3>Confirm Appointment for ${studentName}</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Student Email:</label>
                            <div class="student-email">${studentEmail}</div>
                        </div>
                        <div class="form-group">
                            <label for="sessionDateTime">Session Date & Time:</label>
                            <input type="datetime-local" id="sessionDateTime" class="large-datetime" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="confirmationMessage">Confirmation Message:</label>
                        <textarea id="confirmationMessage" rows="5">Dear ${studentName.split(" ")[0]},
Your counseling session has been confirmed for:
Date: [DATE]
Time: [TIME]
Semester: ${semester}
Department: ${department}
Location: Counseling Center - Pg block fourth floor near lift
Counselor: Ms. Sneha H</textarea>
                    </div>
                    <div class="modal-actions">
                        <button class="cancel-btn" id="cancelModal">Cancel</button>
                        <button class="send-email-btn" id="sendConfirmation">Send Confirmation Email</button>
                    </div>
                </div>
            </div>
        `;
      showModal(button, modalHTML, "sessionDateTime");
    } catch (error) {
      console.error("Error fetching user data:", error);
      showNotification("Error fetching user data. Please try again.");
    }
  }

  function showRescheduleModal(button, studentName, row) {
    const studentEmail = `${studentName
      .toLowerCase()
      .replace(/\s+/g, ".")}@bmsce.ac.in`;
    const semester = row.cells[3].textContent;

    const modalHTML = `
        <div class="modal-overlay" id="appointmentModal">
            <div class="appointment-modal">
                <h3>Reschedule Appointment for ${studentName}</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>Student Email:</label>
                        <div class="student-email">${studentEmail}</div>
                    </div>
                    <div class="form-group">
                        <label for="rescheduleDateTime">New Session Date & Time:</label>
                        <input type="datetime-local" id="rescheduleDateTime" class="large-datetime" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="rescheduleMessage">Reschedule Message:</label>
                    <textarea id="rescheduleMessage" rows="5">Dear ${
                      studentName.split(" ")[0]
                    },
Your previous counseling session was missed. Please find the new schedule:
Date: ${new Date().toLocaleDateString}
Time:  ${new Date().toLocaleTimeString}
Semester: ${semester}
Location: Counseling Center - Pg block fourth floor near lift
Counselor: Ms. Sneha H</textarea>
                </div>
                <div class="modal-actions">
                    <button class="cancel-btn" id="cancelModal">Cancel</button>
                    <button class="send-email-btn" id="sendReschedule">Send Reschedule Email</button>
                </div>
            </div>
        </div>
        `;
    showModal(button, modalHTML, "rescheduleDateTime");
  }

  function showScheduleModal(button, studentName) {
    const studentEmail = `${studentName
      .toLowerCase()
      .replace(/\s+/g, ".")}@bmsce.ac.in`;

    const modalHTML = `
        <div class="modal-overlay" id="appointmentModal">
            <div class="appointment-modal">
                <h3>Schedule Appointment for ${studentName}</h3>
                <div class="form-row">
                    <div class="form-group">
                        <label>Student Email:</label>
                        <div class="student-email">${studentEmail}</div>
                    </div>
                    <div class="form-group">
                        <label for="scheduleDateTime">Proposed Time:</label>
                        <input type="datetime-local" id="scheduleDateTime" class="large-datetime" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="scheduleMessage">Scheduling Message:</label>
                    <textarea id="scheduleMessage" rows="5">Dear ${
                      studentName.split(" ")[0]
                    },
I would like to schedule a counseling session for:
Date: [DATE]
Time: [TIME]
Please let me know if this time works for you or suggest an alternative.
Looking forward to our session.</textarea>
                </div>
                <div class="modal-actions">
                    <button class="cancel-btn" id="cancelModal">Cancel</button>
                    <button class="send-email-btn" id="sendSchedule">Send Proposal</button>
                </div>
            </div>
        </div>
        `;
    showModal(button, modalHTML, "scheduleDateTime");
  }

  function showModal(button, modalHTML, datetimeId) {
    document.body.insertAdjacentHTML("beforeend", modalHTML);
    const defaultTime = new Date();
    defaultTime.setDate(defaultTime.getDate() + 1);
    defaultTime.setHours(10, 0, 0, 0);
    const datetimeInput = document.getElementById(datetimeId);
    datetimeInput.value = defaultTime.toISOString().slice(0, 16);
    if (!button.id)
      button.id = "btn-" + Math.random().toString(36).substr(2, 9);
    document.getElementById("appointmentModal").dataset.originalButton =
      button.id;
  }

  async function sendConfirmationEmail() {
    const modal = document.getElementById("appointmentModal");
    if (!modal) return;

    const sessionDateTime = document.getElementById("sessionDateTime");
    if (!sessionDateTime.value) {
      alert("Please select a date and time for the session");
      sessionDateTime.focus();
      return;
    }

    const dateObj = new Date(sessionDateTime.value);
    const formattedDate = dateObj.toLocaleDateString("en-CA");
    const formattedTime = formatTime12Hour(dateObj);

    const button = document.getElementById(modal.dataset.originalButton);
    const row = button?.closest("tr");

    if (button && row) {
      const studentName = row.cells[0].textContent;
      const department = row.cells[1].textContent;
      const usn = row.cells[2].textContent;
      const semester = row.cells[3].textContent;
      const reason = row.cells[4].textContent;
      let appointmentId = null;
      if (row.dataset && row.dataset.appointmentId) {
        appointmentId = row.dataset.appointmentId;
      } else if (row.querySelector('[data-appointment-id]')) {
        appointmentId = row.querySelector('[data-appointment-id]').getAttribute('data-appointment-id');
      }

      // Build the HTML email template
      const message = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      max-width: 150px;
      height: auto;
    }
    .content {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .session-details {
      background-color: #fff;
      padding: 15px;
      border-radius: 5px;
      margin: 15px 0;
      border-left: 4px solid #4CAF50;
    }
    .footer {
      text-align: center;
      font-size: 0.9em;
      color: #666;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    .highlight {
      color: #4CAF50;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://atma-chethana-backend.vercel.app/app-icon.png" alt="Athma Chethana Logo" class="logo">
    <div style="font-size:1.3em;font-weight:bold;margin-top:8px;">Athma Chethana</div>
    <h2>Counseling Session Confirmation</h2>
  </div>
  <div class="content">
    <p>Dear ${studentName.split(" ")[0]},</p>
    <p>Your counseling session has been confirmed with the following details:</p>
    <div class="session-details">
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${formattedTime}</p>
      <p><strong>Semester:</strong> ${semester}</p>
      <p><strong>Department:</strong> ${department}</p>
      <p><strong>Location:</strong> Counseling Center - Pg block fourth floor near lift</p>
      <p><strong>Counselor:</strong> Ms. Sneha H</p>
    </div>
    <p>Please arrive 5 minutes before your scheduled time. If you need to reschedule, please contact us at least 24 hours in advance.</p>
  </div>
  <div class="footer">
    <p>Best regards,<br>
    <span class="highlight">Athma Chethana</span></p>
    <p>
      BMS College of Engineering<br>
      Bull Temple Road, Basavanagudi,<br>
      Bengaluru - 560019, Karnataka, India<br>
      <a href="mailto:athma.chethana@bmsce.ac.in" style="color:#4CAF50;text-decoration:none;">atma.chethana@bmsce.ac.in</a>
    </p>
  </div>
</body>
</html>`;

      if (appointmentId) {
        console.log("Sending PATCH for appointment", appointmentId);
        try {
          const response = await fetch(
            `${BACKEND_URL}/api/appointment/${appointmentId}`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                date: dateObj.toISOString(),
                time: formattedTime,
                status: "scheduled",
                emailData: {
                  subject: "Appointment Confirmation",
                  message: message,
                },
              }),
            }
          );

          const data = await response.json();
          console.log("PATCH response", data);
          if (data.success) {
            row.remove();
            updateDashboardStats();
            showNotification(
              data.message || "Appointment confirmed and email sent successfully!"
            );
          } else {
            showNotification(
              data.message || "Failed to update appointment. Please try again."
            );
          }
        } catch (err) {
          showNotification("Failed to update appointment status!");
          return;
        }
      }
    }

    modal.remove();
  }

  function sendRescheduleEmail() {
    const modal = document.getElementById("appointmentModal");
    if (!modal) return;

    const rescheduleDateTime = document.getElementById("rescheduleDateTime");
    if (!rescheduleDateTime.value) {
      alert("Please select a new date and time for the session");
      rescheduleDateTime.focus();
      return;
    }

    const dateObj = new Date(rescheduleDateTime.value);
    const formattedDate = dateObj.toLocaleDateString("en-CA");
    const formattedTime = formatTime12Hour(dateObj);

    const message = document
      .getElementById("rescheduleMessage")
      .value.replace("[DATE]", formattedDate)
      .replace("[TIME]", formattedTime);

    const button = document.getElementById(modal.dataset.originalButton);
    const row = button?.closest("tr");

    if (button && row) {
      const studentName = row.cells[0].textContent;
      const department = row.cells[1].textContent;
      const usn = row.cells[2].textContent;
      const semester = row.cells[3].textContent;
      const reason = row.cells[4].textContent;

      const dashboardTableBody = document.querySelector(
        "#dashboardContent table tbody"
      );
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
                <td>${studentName}</td>
                <td>${department}</td>
                <td>${usn}</td>
                <td>${semester}</td>
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
                <td>${reason}</td>
                <td><input type="checkbox" class="complete-checkbox"></td>
            `;
      dashboardTableBody.appendChild(newRow);
      row.remove();
      savePendingData();
      saveDashboardData();
      sortDashboardTable();
      checkDelayedSessions();
    }

    showNotification(
      "Reschedule email sent successfully! Appointment moved to Dashboard."
    );
    modal.remove();
    updateDashboardStats();
  }

  function sendScheduleEmail() {
    const modal = document.getElementById("appointmentModal");
    if (!modal) return;

    const scheduleDateTime = document.getElementById("scheduleDateTime");
    if (!scheduleDateTime.value) {
      alert("Please select a proposed date and time");
      scheduleDateTime.focus();
      return;
    }

    const dateObj = new Date(scheduleDateTime.value);
    const formattedDate = dateObj.toLocaleDateString();
    const formattedTime = formatTime12Hour(dateObj);

    const message = document
      .getElementById("scheduleMessage")
      .value.replace("[DATE]", formattedDate)
      .replace("[TIME]", formattedTime);

    const button = document.getElementById(modal.dataset.originalButton);
    const row = button?.closest("tr");

    if (button && row) {
      button.textContent = `🗓️ ${formattedDate} ${formattedTime}`;
      button.style.backgroundColor = "#2196F3";
      button.style.color = "white";
      button.disabled = true;
      row.querySelector(".confirm-btn")?.setAttribute("disabled", true);
      row.style.backgroundColor = "#f0f8ff";
      savePendingData();
    }

    showNotification("Scheduling proposal sent successfully!");
    modal.remove();
  }

  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => notification.remove(), 500);
    }, 2500);
  }

  // STUDENT RECORDS FUNCTIONALITY
  const deptSemesters = {
    "Aerospace Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Artificial Intelligence and Data Science": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Bio-Technology": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Chemical Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Civil Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Computer Applications (MCA)": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Computer Science and Business Systems": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Computer Science and Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Computer Science and Engineering (DS)": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Computer Science and Engineering (IoT and CS)": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Electrical and Electronics Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Electronics and Communication Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Electronics and Instrumentation Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Electronics and Telecommunication Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Industrial Engineering and Management": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Information Science and Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Machine Learning (AI and ML)": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Management Studies and Research Centre": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Mechanical Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Medical Electronics Engineering": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Physics Department": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Chemistry Department": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
    "Mathematics Department": [
      "1st Sem",
      "2nd Sem",
      "3rd Sem",
      "4th Sem",
      "5th Sem",
      "6th Sem",
      "7th Sem",
      "8th Sem",
    ],
  };

  function initializeStudentDeptFilter() {
    const studentDeptFilter = document.getElementById("studentDeptFilter");
    studentDeptFilter.innerHTML = '<option value="">All Departments</option>';
    Object.keys(deptSemesters).forEach((dept) => {
      const option = document.createElement("option");
      option.value = dept;
      option.textContent = dept;
      studentDeptFilter.appendChild(option);
    });
  }

  const studentDeptFilter = document.getElementById("studentDeptFilter");
  const studentSemFilter = document.getElementById("studentSemFilter");
  const studentNameSearch = document.getElementById("studentNameSearch");

  initializeStudentDeptFilter();

  studentDeptFilter.addEventListener("change", function () {
    const dept = this.value;
    studentSemFilter.innerHTML = '<option value="">All Semesters</option>';
    studentSemFilter.disabled = !dept;
    if (dept) {
      deptSemesters[dept].forEach((sem) => {
        const option = document.createElement("option");
        option.value = sem;
        option.textContent = sem;
        studentSemFilter.appendChild(option);
      });
    }
    filterStudents();
  });

  studentSemFilter.addEventListener("change", filterStudents);
  studentNameSearch.addEventListener("input", filterStudents);

  function filterStudents() {
    const dept = studentDeptFilter.value;
    const sem = studentSemFilter.value;
    const searchTerm = studentNameSearch.value.toLowerCase();
    document.querySelectorAll(".student-card").forEach((card) => {
      const cardDept = card.querySelector(".student-dept").textContent;
      const cardSem = card.querySelector(".student-sem").textContent;
      const cardName = card
        .querySelector(".student-name")
        .textContent.toLowerCase();
      const deptMatch = !dept || cardDept === dept;
      const semMatch = !sem || cardSem === sem;
      const nameMatch = !searchTerm || cardName.includes(searchTerm);
      card.style.display =
        deptMatch && semMatch && nameMatch ? "block" : "none";
    });
  }

  const profileModal = document.getElementById("profileModal");
  const studentCards = document.querySelectorAll(".student-card");
  const closeProfileBtn = document.querySelector(".close-profile-btn");
  const deleteRemarkBtn = document.getElementById("deleteRemark");
  const saveRemarkBtn = document.getElementById("saveRemark");
  const remarkNotification = document.getElementById("remarkNotification");
  let currentStudentData = null;

  function loadRemarks(usn) {
    const remarksData = localStorage.getItem(`remarks_${usn}`);
    return remarksData || "";
  }

  function saveRemarks(usn, remarks) {
    localStorage.setItem(`remarks_${usn}`, remarks);
  }

  function deleteRemarks(usn) {
    localStorage.removeItem(`remarks_${usn}`);
  }

  function showStudentProfile(studentData) {
    currentStudentData = studentData;
    document.getElementById("modalAvatar").textContent =
      studentData.name.charAt(0);
    document.getElementById("modalName").textContent = studentData.name;
    document.getElementById("modalUsn").textContent = studentData.usn;
    document.getElementById("modalSoulScore").textContent =
      studentData.soulScore;
    document.getElementById("modalDept").textContent = studentData.dept;
    document.getElementById("modalSem").textContent = studentData.sem;

    const sessionsContainer = document.getElementById("modalSessions");
    sessionsContainer.innerHTML = "";

    if (studentData.sessions && studentData.sessions.length > 0) {
      studentData.sessions.forEach((session) => {
        const sessionItem = document.createElement("div");
        sessionItem.className = "session-item";
        const sessionDate = new Date(session.date).toLocaleDateString();
        sessionItem.innerHTML = `
                <div class="session-date">${sessionDate}</div>
                <div class="session-reason">${session.reason}</div>
                <div class="session-status ${session.status}">${session.status}</div>
            `;
        sessionsContainer.appendChild(sessionItem);
      });
    } else {
      sessionsContainer.innerHTML = "<p>No sessions recorded</p>";
    }

    const savedRemarks = loadRemarks(studentData.usn);
    document.getElementById("modalRemarks").value = savedRemarks;
    profileModal.style.display = "flex";
  }

  studentCards.forEach((card) => {
    card.addEventListener("click", function () {
      const studentData = JSON.parse(this.getAttribute("data-student"));
      showStudentProfile(studentData);
    });
  });

  closeProfileBtn.addEventListener("click", function () {
    profileModal.style.display = "none";
  });

  saveRemarkBtn.addEventListener("click", function () {
    if (currentStudentData) {
      const remarks = document.getElementById("modalRemarks").value;
      saveRemarks(currentStudentData.usn, remarks);
      remarkNotification.style.display = "block";
      setTimeout(() => {
        remarkNotification.style.display = "none";
      }, 2000);
    }
  });

  deleteRemarkBtn.addEventListener("click", function () {
    if (currentStudentData) {
      deleteRemarks(currentStudentData.usn);
      document.getElementById("modalRemarks").value = "";
    }
  });

  profileModal.addEventListener("click", function (e) {
    if (e.target === this) {
      this.style.display = "none";
    }
  });

  filterStudents();

  // PROFILE DROPDOWN AND SIGNOUT FUNCTIONALITY
  const avatar = document.getElementById("profileAvatar");
  const dropdown = document.getElementById("profileDropdown");

  // Function to show the sign-out modal
  function showSignoutModal() {
    // Remove existing modal if it exists
    const existingModal = document.getElementById("signoutModal");
    if (existingModal) existingModal.remove();

    // Create the sign-out modal with increased size and red buttons
    const modalHTML = `
        <div id="signoutModal" style="
            display: flex;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            justify-content: center;
            align-items: center;
            z-index: 1000;">
            <div class="signout-modal" style="
                background: #fff;
                padding: 25px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                text-align: center;
                width: 95%;
                max-width: 450px;">
                <h3 style="
                    margin: 0 0 20px;
                    font-size: 1.6em;
                    color: #333;">Confirm Sign Out</h3>
                <p style="
                    margin: 0 0 25px;
                    color: #666;
                    font-size: 1.1em;">Are you sure you want to sign out?</p>
                <div class="modal-actions" style="
                    display: flex;
                    justify-content: space-around;
                    gap: 15px;">
                    <button id="cancelSignout" style="
                        padding: 12px 25px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 1.1em;
                        background-color:green;
                        color: white;
                        width: 45%;
                        transition: background-color 0.3s ease;">Cancel</button>
                    <button id="confirmSignout" style="
                        padding: 12px 25px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 1.1em;
                        background-color: #ff3333;
                        color: white;
                        width: 45%;
                        transition: background-color 0.3s ease;">Sign Out</button>
                </div>
            </div>
        </div>
        `;

    // Append the modal to the body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Add responsive styles
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
            @media (max-width: 600px) {
                .signout-modal {
                    width: 90% !important;
                    padding: 20px !important;
                }
                .signout-modal h3 {
                    font-size: 1.4em !important;
                }
                .signout-modal p {
                    font-size: 1em !important;
                }
                #cancelSignout, #confirmSignout {
                    padding: 10px 20px !important;
                    font-size: 1em !important;
                    width: 48% !important;
                }
            }
            @media (max-width: 400px) {
                .signout-modal {
                    width: 95% !important;
                    padding: 15px !important;
                }
                .modal-actions {
                    flex-direction: column !important;
                    gap: 20px !important;
                }
                #cancelSignout, #confirmSignout {
                    width: 100% !important;
                    padding: 12px !important;
                }
            }
            #cancelSignout:hover {
                background-color: green !important;
            }
            #confirmSignout:hover {
                background-color: #cc0000 !important;
            }
        `;
    document.head.appendChild(styleSheet);

    // Add event listeners for the buttons
    document
      .getElementById("cancelSignout")
      .addEventListener("click", function () {
        document.getElementById("signoutModal").style.display = "none";
      });

    document
      .getElementById("confirmSignout")
      .addEventListener("click", function () {
        window.location.href = "login.html";
      });
  }

  avatar.addEventListener("click", function (e) {
    e.stopPropagation();
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", function () {
    dropdown.style.display = "none";
  });

  dropdown.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.getElementById("signOutBtn").addEventListener("click", function (e) {
    e.preventDefault();
    dropdown.style.display = "none";
    showSignoutModal();
  });

  // Function to fetch and display student data
  async function loadStudentRecords() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/student`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      const users = await response.json();
      const studentCardsContainer = document.querySelector(
        ".student-cards-container"
      );
      studentCardsContainer.innerHTML = ""; // Clear existing cards

      users.forEach((user) => {
        const studentCard = document.createElement("div");
        studentCard.className = "student-card";
        studentCard.setAttribute(
          "data-student",
          JSON.stringify({
            name: user.fullName,
            usn: user.usn,
            dept: user.department,
            sem: user.semester,
            sessions: user.sessionHistory || [], // Use actual session history
            soulScore: user.soul_score || 75,
            remarks: "",
          })
        );

        studentCard.innerHTML = `
                <div class="student-avatar">${user.fullName.charAt(0)}</div>
                <div class="student-details">
                    <h3 class="student-name">${user.fullName}</h3>
                    <p class="student-dept">${user.department}</p>
                    <p class="student-sem">${user.semester}</p>
                    <p class="student-soul-score">Soul Score: ${
                      user.soul_score || 75
                    }</p>
                    <p class="session-count">Sessions: ${
                      user.sessionHistory ? user.sessionHistory.length : 0
                    }</p>
                </div>
            `;

        // Add click event listener for the profile modal
        studentCard.addEventListener("click", function () {
          const studentData = JSON.parse(this.getAttribute("data-student"));
          showStudentProfile(studentData);
        });

        studentCardsContainer.appendChild(studentCard);
      });

      // Update dashboard stats
      updateDashboardStats();
    } catch (error) {
      console.error("Error loading student records:", error);
      showNotification("Error loading student records");
    }
  }
});
