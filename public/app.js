// Firebase v9 modular imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  initializeFirestore,
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBeLppiJGQ85iWN2YblcCI1UTjB-ZmdPU",
  authDomain: "cloud-task-ba6d8.firebaseapp.com",
  projectId: "cloud-task-ba6d8",
  storageBucket: "cloud-task-ba6d8.appspot.com",
  messagingSenderId: "1077719526291",
  appId: "1:1077719526291:web:00cffc82ae8275d98f1666",
  measurementId: "G-KK893PGVQQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});

// DOM Elements
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const filterBtns = document.querySelectorAll(".filter-btns button");

// Status flow configuration
const STATUS_FLOW = {
  "Pending": "In Progress",
  "In Progress": "Completed",
  "Completed": null
};

// Current filter status
let currentFilter = "Pending";

// Add new task
addBtn.addEventListener("click", async () => {
  const taskText = taskInput.value.trim();
  if (!taskText) return;

  try {
    await addDoc(collection(db, "tasks"), {
      text: taskText,
      status: "Pending",
      createdAt: serverTimestamp()
    });
    taskInput.value = "";
  } catch (error) {
    console.error("Error adding task:", error);
    alert("Failed to add task. Please try again.");
  }
});

// Load tasks based on current filter
function loadTasks() {
  const q = query(collection(db, "tasks"), where("status", "==", currentFilter));
  
  onSnapshot(q, (snapshot) => {
    taskList.innerHTML = "";
    
    if (snapshot.empty) {
      taskList.innerHTML = `<p class="empty-state">No ${currentFilter.toLowerCase()} tasks</p>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const task = docSnap.data();
      const taskElement = createTaskElement(docSnap.id, task);
      taskList.appendChild(taskElement);
    });
  });
}

// Create task element with status transition button
function createTaskElement(id, task) {
  const div = document.createElement("div");
  div.className = "task-item";
  div.dataset.id = id;
  
  const date = task.createdAt?.toDate() || new Date();
  const nextStatus = STATUS_FLOW[task.status];
  
  div.innerHTML = `
    <div class="task-content">
      <span class="task-text">${task.text}</span>
      <div class="task-meta">
        <span class="status-badge ${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
        <span class="task-date">${date.toLocaleString()}</span>
      </div>
    </div>
    ${nextStatus ? 
      `<button class="status-btn" data-next-status="${nextStatus}">
        ${getButtonText(nextStatus)}
      </button>` : 
      '<span class="status-completed">✓ Done</span>'
    }
  `;
  
  return div;
}

// Get appropriate button text based on next status
function getButtonText(nextStatus) {
  return {
    "In Progress": "➡️ Start Progress",
    "Completed": "✓ Complete Task"
  }[nextStatus];
}

// Handle status updates
taskList.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("status-btn")) return;
  
  const taskElement = e.target.closest(".task-item");
  const id = taskElement.dataset.id;
  const nextStatus = e.target.dataset.nextStatus;

  try {
    await updateDoc(doc(db, "tasks", id), { 
      status: nextStatus,
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    console.error("Error updating task:", error);
    alert("Failed to update task status. Please try again.");
  }
});

// Initialize filter buttons
filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.status;
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadTasks();
  });
});

// Load initial tasks
loadTasks();
document.querySelector(`.filter-btns button[data-status="Pending"]`).classList.add("active");