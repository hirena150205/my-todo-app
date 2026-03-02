// 1. 初期データの読み込み（LocalStorageから取得、なければ空配列）
let tasks = JSON.parse(localStorage.getItem("myTasks")) || [];

// 画面を更新する関数
function render() {
  // すべてのリストエリアを一旦空にする
  const lists = document.querySelectorAll(".task-list");
  lists.forEach((list) => (list.innerHTML = ""));

  // 重要度を数値化して、降順（高い順）にソート
  tasks.sort((a, b) => b.importance - a.importance);

  // タスクを1つずつ適切な行に振り分ける
  tasks.forEach((task, index) => {
    const card = document.createElement("div");
    card.className = `task-card ${getImportanceClass(task.importance)}`;
    card.innerHTML = `
    <div class="card-content">
        <span>${getImportanceLabel(task.importance)}</span>
        <div class="task-title">${task.title}</div>
        <button class="delete-btn" onclick="deleteTask(${index})">タスクを削除</button>
    </div>
`;

    // 該当する期限の行にある .task-list に追加
    const targetRow = document.querySelector(
      `[data-deadline="${task.deadline}"] .task-list`,
    );
    if (targetRow) targetRow.appendChild(card);
  });

  // データを保存
  localStorage.setItem("myTasks", JSON.stringify(tasks));
}

// タスク追加関数
function addTask() {
  const title = document.getElementById("taskTitle").value;
  const importance = document.getElementById("taskImportance").value;
  const deadline = document.getElementById("taskDeadline").value;

  if (!title) return alert("タスク名を入力してください");

  const newTask = {
    title: title,
    importance: parseInt(importance),
    deadline: deadline,
  };

  tasks.push(newTask);
  render(); // 画面更新

  // 入力欄をクリア
  document.getElementById("taskTitle").value = "";
}

// 削除機能
function deleteTask(index) {
  tasks.splice(index, 1);
  render();
}

// 補助：重要度に応じたクラス名を返す
function getImportanceClass(val) {
  if (val === 3) return "high";
  if (val === 2) return "medium";
  return "low";
}

// 補助：重要度のラベルを返す
function getImportanceLabel(val) {
  if (val === 3) return "最重要";
  if (val === 2) return "重要";
  return "通常";
}

// 1. データ構造に 'isDone' を追加するように修正
function addTask() {
  const title = document.getElementById("taskTitle").value;
  const deadlineDate = document.getElementById("taskDeadline").value; // '2023-10-25' 形式
  const importance = parseInt(document.getElementById("taskImportance").value);

  if (!title || !deadlineDate) return alert("タスク名と期限を入力してください");

  tasks.push({
    title: title,
    importance: importance,
    deadlineDate: deadlineDate, // 具体的な日付を保存
    isDone: false,
  });
  render();
}

// 残り日数からカテゴリー（行のID）を判定する関数
function getDeadlineCategory(dateString) {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時間をリセットして日付のみで比較

  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);

  // 差分をミリ秒から日数に変換 (1日 = 24 * 60 * 60 * 1000 ms)
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "today"; // 今日（または期限超過）
  if (diffDays === 1) return "tomorrow"; // 明日
  if (diffDays <= 7) return "week"; // 1週間以内
  return "later"; // それ以降
}

// 表示ロジックの更新
function render() {
  const lists = document.querySelectorAll(".task-list");
  lists.forEach((list) => (list.innerHTML = ""));

  const doneList = document.getElementById("doneTaskList");
  doneList.innerHTML = "";

  // 重要度順にソート
  tasks.sort((a, b) => b.importance - a.importance);

  tasks.forEach((task, index) => {
    if (!task.isDone) {
      // ★ ここで現在時刻に基づき、どの行(category)に表示するかを動的に決定
      const category = getDeadlineCategory(task.deadlineDate);

      const card = document.createElement("div");
      card.className = `task-card ${getImportanceClass(task.importance)}`;
      card.innerHTML = `
                <span>${getImportanceLabel(task.importance)} (${task.deadlineDate})</span>
                <div>${task.title}</div>
                <div style="display:flex; gap:10px;">
                    <button class="delete-btn" onclick="toggleDone(${index})">完了</button>
                    <button class="delete-btn" onclick="deleteTask(${index})" style="color:#666;">削除</button>
                </div>
            `;

      const targetRow = document.querySelector(
        `[data-deadline="${category}"] .task-list`,
      );
      if (targetRow) targetRow.appendChild(card);
    } else {
      // 完了済みはサイドパネルへ
      const doneCard = document.createElement("div");
      doneCard.className = "done-card";
      doneCard.innerHTML = `${task.title} <button onclick="toggleDone(${index})">戻す</button>`;
      doneList.appendChild(doneCard);
    }
  });

  localStorage.setItem("myTasks", JSON.stringify(tasks));
}

// 2. 完了切り替え機能
function toggleDone(index) {
  tasks[index].isDone = !tasks[index].isDone;
  render();
}

// 3. 表示ロジックの更新
function render() {
  const lists = document.querySelectorAll(".task-list");
  lists.forEach((list) => (list.innerHTML = ""));

  const doneList = document.getElementById("doneTaskList");
  doneList.innerHTML = "";

  tasks.forEach((task, index) => {
    if (!task.isDone) {
      // 未完了タスク：メインボードへ
      const card = document.createElement("div");
      card.className = `task-card ${getImportanceClass(task.importance)}`;
      card.innerHTML = `
                <span>${getImportanceLabel(task.importance)}</span>
                <div>${task.title}</div>
                <div style="display:flex; gap:10px;">
                    <button class="delete-btn" onclick="toggleDone(${index})">完了</button>
                    <button class="delete-btn" onclick="deleteTask(${index})" style="color:#666;">削除</button>
                </div>
            `;
      document
        .querySelector(`[data-deadline="${task.deadline}"] .task-list`)
        .appendChild(card);
    } else {
      // 完了タスク：サイドパネルへ
      const doneCard = document.createElement("div");
      doneCard.className = "done-card";
      doneCard.innerHTML = `
                ${task.title}
                <button onclick="toggleDone(${index})" style="background:none; border:none; color:var(--low); cursor:pointer; font-size:0.7rem;">戻す</button>
            `;
      doneList.appendChild(doneCard);
    }
  });

  localStorage.setItem("myTasks", JSON.stringify(tasks));
}

// 4. サイドパネルの開閉
function toggleDrawer(isOpen) {
  document.getElementById("doneDrawer").classList.toggle("open", isOpen);
  document.getElementById("overlay").classList.toggle("show", isOpen);
}
// 初回起動時に実行
render();
