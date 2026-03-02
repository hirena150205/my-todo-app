// 1. Firebaseの設定（自分のFirebaseコンソールの値に書き換えてください）
const firebaseConfig = {
  apiKey: "AIzaSyC7qM6VFEbHhQIm6PucRm3ibIUPz1nnuv8",
  authDomain: "my-todo-sync2026.firebaseapp.com",
  databaseURL:
    "https://my-todo-sync2026-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "my-todo-sync2026",
  storageBucket: "my-todo-sync2026.firebasestorage.app",
  messagingSenderId: "57514249674",
  appId: "1:57514249674:web:df4699aa4cf362119ed333",
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const taskRef = database.ref("tasks");

let tasks = [];

// 2. データの取得（リアルタイム監視）
// Firebase側でデータが追加・削除・更新されるたびにこの中身が実行されます
taskRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (data) {
    // Firebaseのオブジェクト形式を、扱いやすい配列形式に変換
    // キー（ID）を保持しておくと、後の削除や更新が楽になります
    tasks = Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));
  } else {
    tasks = [];
  }
  render(); // データが届いたら画面を描画
});

// 3. タスク追加関数
function addTask() {
  const title = document.getElementById("taskTitle").value;
  const deadlineDate = document.getElementById("taskDeadline").value;
  const importance = parseInt(document.getElementById("taskImportance").value);

  if (!title || !deadlineDate) {
    alert("タスク名と期限を入力してください");
    return;
  }

  // Firebaseに直接保存（LocalStorageへの保存コードは不要になります）
  taskRef.push({
    title: title,
    importance: importance,
    deadlineDate: deadlineDate,
    isDone: false,
  });

  // 入力欄をクリア
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDeadline").value = "";
}

// 4. 完了切り替え機能
function toggleDone(id) {
  // 配列のインデックスではなく、FirebaseのIDを使って更新します
  const task = tasks.find((t) => t.id === id);
  if (task) {
    database.ref(`tasks/${id}`).update({
      isDone: !task.isDone,
    });
  }
}

// 5. 削除機能
function deleteTask(id) {
  if (confirm("このタスクを削除しますか？")) {
    database.ref(`tasks/${id}`).remove();
  }
}

// --- 判定・描画ロジック（ここはほぼそのまま） ---

function getDeadlineCategory(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays <= 7) return "week";
  return "later";
}

function render() {
  const lists = document.querySelectorAll(".task-list");
  lists.forEach((list) => (list.innerHTML = ""));
  const doneList = document.getElementById("doneTaskList");
  doneList.innerHTML = "";

  tasks.sort((a, b) => b.importance - a.importance);

  tasks.forEach((task) => {
    if (!task.isDone) {
      const category = getDeadlineCategory(task.deadlineDate);
      const card = document.createElement("div");
      card.className = `task-card ${getImportanceClass(task.importance)}`;
      // toggleDoneとdeleteTaskの引数を task.id に変更
      card.innerHTML = `
        <div class="card-content">
            <span>${getImportanceLabel(task.importance)} (${task.deadlineDate})</span>
            <div class="task-title">${task.title}</div>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="delete-btn" onclick="toggleDone('${task.id}')">完了</button>
                <button class="delete-btn" onclick="deleteTask('${task.id}')" style="color:var(--text-sub);">削除</button>
            </div>
        </div>
      `;
      const targetRow = document.querySelector(
        `[data-deadline="${category}"] .task-list`,
      );
      if (targetRow) targetRow.appendChild(card);
    } else {
      const doneCard = document.createElement("div");
      doneCard.className = "done-card";
      doneCard.innerHTML = `
                ${task.title}
                <button onclick="toggleDone('${task.id}')" style="background:none; border:none; color:var(--low); cursor:pointer; font-size:0.7rem; margin-left:10px;">戻す</button>
            `;
      doneList.appendChild(doneCard);
    }
  });
}

function toggleDrawer(isOpen) {
  document.getElementById("doneDrawer").classList.toggle("open", isOpen);
  document.getElementById("overlay").classList.toggle("show", isOpen);
}

function getImportanceClass(val) {
  if (val === 3) return "high";
  if (val === 2) return "medium";
  return "low";
}

function getImportanceLabel(val) {
  if (val === 3) return "最重要";
  if (val === 2) return "重要";
  return "通常";
}
