
const $ = (selector) => document.querySelector(selector);

const taskForm = $("#task-form");
const taskInput = $("#task-input");
const taskPriority = $("#task-priority");
const taskList = $("#task-list");
const emptyState = $("#empty-state");

let tasks = [];
let activeFilter = "all";

try {
  const savedTasks = JSON.parse(localStorage.getItem("focusflow-tasks"));
  tasks = Array.isArray(savedTasks) ? savedTasks : [];
} catch {
  tasks = [];
}

let selectedMinutes = 25;
let remainingSeconds = selectedMinutes * 60;
let timerInterval = null;
let timerRunning = false;
let sessionsToday = Number(localStorage.getItem("focusflow-sessions") || 0);
let completedToday = localStorage.getItem("focusflow-session-date") === new Date().toDateString()
  ? sessionsToday
  : 0;

const today = new Date();
$("#today-date").textContent = today.toLocaleDateString("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long"
});

function saveTasks() {
  localStorage.setItem("focusflow-tasks", JSON.stringify(tasks));
}

function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderTasks() {
  const filteredTasks = tasks.filter((task) => {
    if (activeFilter === "active") return !task.completed;
    if (activeFilter === "completed") return task.completed;
    return true;
  });

  taskList.innerHTML = "";

  filteredTasks.forEach((task) => {
    const item = document.createElement("li");
    item.className = `task-item${task.completed ? " is-complete" : ""}`;

    const checkbox = document.createElement("button");
    checkbox.className = "task-check";
    checkbox.type = "button";
    checkbox.setAttribute("aria-label", task.completed ? "Mark task incomplete" : "Complete task");
    checkbox.textContent = task.completed ? "✓" : "";
    checkbox.addEventListener("click", () => toggleTask(task.id));

    const details = document.createElement("div");
    details.className = "task-details";

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("span");
    meta.className = "task-meta";
    meta.textContent = `${task.priority} priority`;

    details.append(title, meta);

    const priority = document.createElement("span");
    priority.className = `priority-dot priority-${task.priority.toLowerCase()}`;
    priority.setAttribute("aria-label", `${task.priority} priority`);

    const remove = document.createElement("button");
    remove.className = "task-delete";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.addEventListener("click", () => deleteTask(task.id));

    item.append(checkbox, details, priority, remove);
    taskList.appendChild(item);
  });

  emptyState.hidden = filteredTasks.length > 0;
  $("#heading-count").textContent = `${filteredTasks.length} ${filteredTasks.length === 1 ? "task" : "tasks"}`;
  $("#nav-task-count").textContent = tasks.filter((task) => !task.completed).length;

  updateStats();
}

function addTask(title, priority = "Medium") {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;

  tasks.unshift({
    id: createId(),
    title: cleanTitle,
    priority,
    completed: false,
    createdAt: new Date().toISOString()
  });

  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

function updateStats() {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  $("#total-tasks").textContent = total;
  $("#completed-tasks").textContent = completed;
  $("#progress-percent").textContent = `${percent}%`;
  $("#progress-line").style.width = `${percent}%`;
  $("#completed-line").style.width = `${percent}%`;
  $("#focus-sessions").textContent = completedToday;
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value, taskPriority.value);
  taskInput.value = "";
  taskInput.focus();
});

document.querySelectorAll(".filter-btn").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");
    activeFilter = button.dataset.filter || "all";
    renderTasks();
  });
});

$("#clear-completed").addEventListener("click", () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

// Focus timer
function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  $("#timer-display").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalSeconds = selectedMinutes * 60;
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0;
  const circumference = 2 * Math.PI * 54;

  $("#timer-progress").style.strokeDasharray = circumference;
  $("#timer-progress").style.strokeDashoffset = circumference * (1 - progress);
}

function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  timerRunning = false;
  $("#timer-start").textContent = "Start Focus";
}

function resetTimer() {
  stopTimer();
  remainingSeconds = selectedMinutes * 60;
  $("#timer-mode").textContent = "FOCUS SESSION";
  $("#timer-caption").textContent = "Ready when you are. One thing at a time.";
  updateTimerDisplay();
}

function startTimer() {
  if (timerRunning) {
    stopTimer();
    $("#timer-caption").textContent = "Timer paused. Resume when ready.";
    return;
  }

  if (remainingSeconds <= 0) {
    remainingSeconds = selectedMinutes * 60;
  }

  timerRunning = true;
  $("#timer-start").textContent = "Pause";
  $("#timer-mode").textContent = "STAY FOCUSED";
  $("#timer-caption").textContent = "You are doing great. Keep going.";

  timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    updateTimerDisplay();

    if (remainingSeconds <= 0) {
      stopTimer();
      $("#timer-mode").textContent = "SESSION COMPLETE";
      $("#timer-caption").textContent = "Nice work! Take a short break.";

      const nowDate = new Date().toDateString();
      const savedDate = localStorage.getItem("focusflow-session-date");

      if (savedDate !== nowDate) {
        sessionsToday = 0;
        localStorage.setItem("focusflow-session-date", nowDate);
      }

      sessionsToday += 1;
      completedToday = sessionsToday;
      localStorage.setItem("focusflow-sessions", String(sessionsToday));
      localStorage.setItem("focusflow-session-date", nowDate);
      updateStats();
    }
  }, 1000);
}

$("#timer-start").addEventListener("click", startTimer);
$("#timer-reset").addEventListener("click", resetTimer);

document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".preset").forEach((btn) => {
      btn.classList.remove("active");
    });

    button.classList.add("active");
    selectedMinutes = Number(button.dataset.minutes) || 25;
    resetTimer();
    $("#timer-caption").textContent = `${selectedMinutes} minutes set aside for you.`;
  });
});

renderTasks();
resetTimer();
