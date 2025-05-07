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

  // Departments data
  const departments = [
    "Aerospace Engineering",
    "Artificial Intelligence and Data Science",
    "Bio-Technology",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Applications (MCA)",
    "Computer Science and Business Systems",
    "Computer Science and Engineering",
    "Computer Science and Engineering (DS)",
    "Computer Science and Engineering (IoT and CS)",
    "Electrical and Electronics Engineering",
    "Electronics and Communication Engineering",
    "Electronics and Instrumentation Engineering",
    "Electronics and Telecommunication Engineering",
    "Industrial Engineering and Management",
    "Information Science and Engineering",
    "Machine Learning (AI and ML)",
    "Management Studies and Research Centre",
    "Mechanical Engineering",
    "Medical Electronics Engineering",
    "Physics Department",
    "Chemistry Department",
    "Mathematics Department",
  ];

  // Initialize department dropdown
  const deptDropdown = document.getElementById("deptDropdown");
  departments.forEach((dept) => {
    const option = document.createElement("option");
    option.value = dept;
    option.textContent = dept;
    deptDropdown.appendChild(option);
  });

  // Function to filter tables by department
  function filterTablesByDepartment(selectedDept) {
    const dashboardRows = document.querySelectorAll(
      "#dashboardContent table tbody tr"
    );
    dashboardRows.forEach((row) => {
      const deptCell = row.cells[1];
      row.style.display =
        selectedDept === "" || deptCell.textContent === selectedDept
          ? ""
          : "none";
    });

    const pendingRows = document.querySelectorAll(
      "#pendingContent table tbody tr"
    );
    pendingRows.forEach((row) => {
      const deptCell = row.cells[1];
      row.style.display =
        selectedDept === "" || deptCell.textContent === selectedDept
          ? ""
          : "none";
    });

    if (document.getElementById("studentsContent").style.display === "block") {
      filterStudents();
    }
  }

  // Handle department filter
  deptDropdown.addEventListener("change", function () {
    filterTablesByDepartment(this.value);
  });

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
      }
      filterTablesByDepartment(deptDropdown.value);
    });
  });

  // Initialize with dashboard visible
  document.getElementById("dashboardContent").style.display = "block";

  // Dashboard statistics
  function updateDashboardStats() {
    const studentCount = document.querySelectorAll(".student-card").length;
    const sessionCount = document.querySelectorAll(
      "#dashboardContent table tbody tr"
    ).length;
    const pendingSessionCount = document.querySelectorAll(
      "#pendingContent table tbody tr"
    ).length;
    document.getElementById("studentCount").textContent = studentCount;
    document.getElementById("sessionCount").textContent = sessionCount;
    document.getElementById("pendingSessionCount").textContent =
      pendingSessionCount;
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
    const dashboardTableBody = document.querySelector(
      "#dashboardContent table tbody"
    );
    const response = await fetch(`http://localhost:8080/api/appointment`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const { appointments } = await response.json();
    if (appointments) {
      dashboardTableBody.innerHTML = "";
      appointments.forEach((item) => {
        if (!item.completed) {
          const newRow = document.createElement("tr");
          newRow.innerHTML = `
                        <td>${item.studentName}</td>
                        <td>${item.department}</td>
                        <td>${item.usn}</td>
                        <td>${item.semester}</td>
                        <td>${new Date(
                          item.createdAt
                        ).toLocaleDateString()}</td>
                        <td>${new Date(
                          item.createdAt
                        ).toLocaleTimeString()}</td>
                        <td>${item.reason}</td>
                    `;
          dashboardTableBody.appendChild(newRow);
        }
      });
    }
  }

  // Load pending data from localStorage, preserving HTML rows if present
  async function loadPendingData() {
    const pendingTableBody = document.querySelector(
      "#pendingContent table tbody"
    );
    const savedData = localStorage.getItem("pendingData");

    pendingTableBody.innerHTML = "";

    const response = await fetch(`http://localhost:8080/api/appointment`, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    const { appointments } = await response.json();
    console.log(appointments);

    appointments.forEach((item) => {
      const newRow = document.createElement("tr");
      newRow.innerHTML = `
                <td>${item.studentName}</td>
                <td>${item.department}</td>
                <td>${item.usn}</td>
                <td>${item.semester}</td>
                <td>${item.reason}</td>
                <td class="action-buttons">
                    <button class="${
                      item.isDelayed ? "reschedule-btn" : "confirm-btn"
                    }">
                        ${item.isDelayed ? "Reschedule" : "Confirm"}
                    </button>
                </td>
            `;
      pendingTableBody.appendChild(newRow);
    });
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

  document.addEventListener("change", function (e) {
    if (e.target.classList.contains("complete-checkbox")) {
      const row = e.target.closest("tr");
      if (e.target.checked) {
        const rowData = Array.from(row.cells)
          .slice(0, 7)
          .map((cell) => cell.textContent);
        const studentName = rowData[0];
        const sessionDate = rowData[4];
        const sessionReason = rowData[6];
        const semester = rowData[3];

        updateStudentSessionHistory(
          studentName,
          sessionDate,
          sessionReason,
          semester
        );
        row.remove();
        saveDashboardData();
        showNotification("Session completed and session history updated");
        updateDashboardStats();
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

  function showConfirmationModal(button, studentName, row) {
    const studentEmail = `${studentName
      .toLowerCase()
      .replace(/\s+/g, ".")}@bmsce.ac.in`;
    const semester = row.cells[3].textContent;

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
                    <textarea id="confirmationMessage" rows="5">Dear ${
                      studentName.split(" ")[0]
                    },
Your counseling session has been confirmed for:
Date: [DATE]
Time: [TIME]
Semester: ${semester}
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
Date: [DATE]
Time: [TIME]
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

  function sendConfirmationEmail() {
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

    const message = document
      .getElementById("confirmationMessage")
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

      button.textContent = "✓ Confirmed";
      button.style.backgroundColor = "#4CAF50";
      button.style.color = "white";
      button.disabled = true;
    }

    showNotification(
      "Confirmation email sent successfully! Appointment moved to Dashboard."
    );
    modal.remove();
    filterTablesByDepartment(document.getElementById("deptDropdown").value);
    updateDashboardStats();
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
    filterTablesByDepartment(document.getElementById("deptDropdown").value);
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
    studentData.sessions.forEach((session) => {
      const sessionItem = document.createElement("div");
      sessionItem.className = "session-item";
      sessionItem.innerHTML = `
                <div class="session-date">${session.date}</div>
                <div class="session-reason">${session.reason}</div>
            `;
      sessionsContainer.appendChild(sessionItem);
    });

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
});
