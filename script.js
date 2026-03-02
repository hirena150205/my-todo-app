// 1. 初期データの読み込み（ブラウザから取得）
let tasks = JSON.parse(localStorage.getItem("myTasks")) || [];

// 残り日数からカテゴリー（行のID）を判定する関数
function getDeadlineCategory(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "today"; // 今日（または期限超過）
  if (diffDays === 1) return "tomorrow"; // 明日
  if (diffDays <= 7) return "week"; // 1週間以内
  return "later"; // それ以降
}

// 画面を更新する関数
function render() {
  const lists = document.querySelectorAll(".task-list");
  lists.forEach((list) => (list.innerHTML = ""));
  const doneList = document.getElementById("doneTaskList");
  doneList.innerHTML = "";

  // 重要度でソート
  tasks.sort((a, b) => b.importance - a.importance);

  tasks.forEach((task, index) => {
    if (!task.isDone) {
      const category = getDeadlineCategory(task.deadlineDate);
      const card = document.createElement("div");
      card.className = `task-card ${getImportanceClass(task.importance)}`;
      card.innerHTML = `
        <div class="card-content">
            <span>${getImportanceLabel(task.importance)} (${task.deadlineDate})</span>
            <div class="task-title">${task.title}</div>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="delete-btn" onclick="toggleDone(${index})">完了</button>
                <button class="delete-btn" onclick="deleteTask(${index})" style="color:var(--text-sub);">削除</button>
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
                <button onclick="toggleDone(${index})" style="background:none; border:none; color:var(--low); cursor:pointer; font-size:0.7rem; margin-left:10px;">戻す</button>
            `;
      doneList.appendChild(doneCard);
    }
  });

  // データをブラウザに保存
  localStorage.setItem("myTasks", JSON.stringify(tasks));
}

// タスク追加関数
function addTask() {
  const title = document.getElementById("taskTitle").value;
  const deadlineDate = document.getElementById("taskDeadline").value;
  const importance = parseInt(document.getElementById("taskImportance").value);

  if (!title || !deadlineDate) {
    alert("タスク名と期限を入力してください");
    return;
  }

  tasks.push({
    title: title,
    importance: importance,
    deadlineDate: deadlineDate,
    isDone: false,
  });

  render();
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDeadline").value = "";
}

// 完了切り替え機能
function toggleDone(index) {
  tasks[index].isDone = !tasks[index].isDone;
  render();
}

// 削除機能
function deleteTask(index) {
  if (confirm("このタスクを削除しますか？")) {
    tasks.splice(index, 1);
    render();
  }
}

// サイドパネルの開閉
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

// 初回起動
render();
