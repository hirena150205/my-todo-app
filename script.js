// 1. 初期データの読み込み（ブラウザから取得）
let tasks = JSON.parse(localStorage.getItem("myTasks")) || [];
let editingIndex = null; // 編集中のタスクのインデックス
// 2. カテゴリーの初期化（必要に応じてローカルストレージから取得）
let categories = JSON.parse(localStorage.getItem("myCategories")) || [
  "就活",
  "大学",
  "バイト",
  "プライベート",
  "その他",
];

// 3. フィルターの状態管理
let activeFilter = "すべて"; // 現在選択されているフィルター

// 日付フォーマット関数（YYYY-MM-DD → M月D日）
function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  return `${parseInt(parts[1])}月${parseInt(parts[2])}日`;
}

// 今日の日付文字列を取得（YYYY-MM-DD）
function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function ensureSonotaAtEnd() {
  const index = categories.indexOf("その他");
  if (index !== -1) {
    categories.splice(index, 1); // 一旦削除
  }
  categories.push("その他"); // 末尾に追加
}

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

// カテゴリフィルターのボタンを生成
function renderFilters() {
  const container = document.getElementById("categoryFilter");
  if (!container) return;
  container.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = `filter-btn ${activeFilter === "すべて" ? "active" : ""}`;
  allBtn.innerText = "すべて";
  allBtn.onclick = () => {
    activeFilter = "すべて";
    renderFilters();
    render();
  };
  container.appendChild(allBtn);

  categories.forEach((cat) => {
    if (cat === "その他") return; // 「その他」をフィルターに出すかはお好みで変更可
    const btn = document.createElement("button");
    btn.className = `filter-btn ${activeFilter === cat ? "active" : ""}`;
    btn.innerText = cat;
    btn.onclick = () => {
      activeFilter = cat;
      renderFilters();
      render();
    };
    container.appendChild(btn);
  });
}

// Doneタスクの全件消去
function clearAllDoneTasks() {
  if (confirm("すべての完了済みタスクを完全に消去しますか？")) {
    tasks = tasks.filter((t) => !t.isDone);
    render();
  }
}

// 特定の日付のDoneタスクのみ消去
function clearDoneTasksByDate(dateStr) {
  const displayDate = dateStr === "日付不明" ? "日付不明" : formatDate(dateStr);
  if (confirm(`${displayDate}の完了済みタスクを消去しますか？`)) {
    tasks = tasks.filter(
      (t) =>
        !(
          t.isDone &&
          (t.completedDate === dateStr ||
            (dateStr === "日付不明" && !t.completedDate))
        ),
    );
    render();
  }
}

// 画面を更新する関数
function render() {
  const lists = document.querySelectorAll(".task-list");
  lists.forEach((list) => (list.innerHTML = ""));
  const doneList = document.getElementById("doneTaskList");
  doneList.innerHTML = "";

  tasks.sort((a, b) => {
    if (b.importance !== a.importance) return b.importance - a.importance;
    return new Date(a.deadlineDate) - new Date(b.deadlineDate);
  });

  // ▼ ① アクティブタスクの描画（フィルターと日付フォーマット適用） ▼
  tasks.forEach((task, index) => {
    if (!task.isDone) {
      const taskCat = task.category || "その他";
      // フィルターが「すべて」以外で、カテゴリが一致しなければスキップ
      if (activeFilter !== "すべて" && activeFilter !== taskCat) return;

      const category = getDeadlineCategory(task.deadlineDate);
      const card = document.createElement("div");
      card.className = `task-card ${getImportanceClass(task.importance)}`;
      card.style.background = getCategoryColor(taskCat);

      // 日付の表示を formatDate() と薄い色で洗練
      card.innerHTML = `
        <div class="card-content">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
              <span style="margin-bottom:0; display:flex; align-items:center;">
                ${getImportanceLabel(task.importance)} 
                <span style="color:rgba(255,255,255,0.6); font-weight:normal; font-size:0.85em; margin-left:6px;">${formatDate(task.deadlineDate)}</span>
              </span>
              <span class="category-tag">${taskCat}</span>
            </div>
            <div class="task-title">${task.title}</div>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button class="delete-btn" onclick="toggleDone(${index}, event)">完了</button>
                <button class="delete-btn" onclick="editTask(${index})" style="color:#a855f7;">編集</button> 
                <button class="delete-btn" onclick="deleteTask(${index}, event)" style="color:var(--text-sub);">削除</button>
            </div>
        </div>
      `;
      const targetRow = document.querySelector(
        `[data-deadline="${category}"] .task-list`,
      );
      if (targetRow) targetRow.appendChild(card);
    }
  });

  // ▼ ② Doneタスクの描画（完了日でグループ化） ▼
  const doneGrouped = {};
  tasks.forEach((task, index) => {
    if (task.isDone) {
      const dDate = task.completedDate || "日付不明"; // 過去の完了日がないタスク用
      if (!doneGrouped[dDate]) doneGrouped[dDate] = [];
      doneGrouped[dDate].push({ task, originalIndex: index });
    }
  });

  // 日付を新しい順にソート
  const sortedDates = Object.keys(doneGrouped).sort((a, b) => {
    if (a === "日付不明") return 1;
    if (b === "日付不明") return -1;
    return new Date(b) - new Date(a);
  });

  sortedDates.forEach((dateStr) => {
    // 日付ヘッダーとラベル単位の消去ボタン
    const header = document.createElement("div");
    header.className = "done-date-header";
    header.innerHTML = `
      <span>${dateStr === "日付不明" ? "日付不明" : formatDate(dateStr) + " 完了"}</span>
      <button onclick="clearDoneTasksByDate('${dateStr}')">この日を消去</button>
    `;
    doneList.appendChild(header);

    // その日のタスクを並べる
    doneGrouped[dateStr].forEach((item) => {
      const doneCard = document.createElement("div");
      doneCard.className = "done-card";
      doneCard.innerHTML = `
        ${item.task.title}
        <button onclick="toggleDone(${item.originalIndex}, event)" style="background:none; border:none; color:var(--low); cursor:pointer; font-size:0.7rem; margin-left:10px;">戻す</button>
      `;
      doneList.appendChild(doneCard);
    });
  });

  localStorage.setItem("myTasks", JSON.stringify(tasks));

  document.querySelectorAll(".deadline-row").forEach((row) => {
    const list = row.querySelector(".task-list");
    if (list.children.length === 0) {
      list.innerHTML =
        '<div style="color: var(--text-sub); padding: 10px; font-size: 0.8rem;">タスクはありません</div>';
    }
  });
}

// タスク追加関数
function addTask() {
  const title = document.getElementById("taskTitle").value;
  const deadlineDate = document.getElementById("taskDeadline").value;
  const importance = parseInt(document.getElementById("taskImportance").value);
  const category = document.getElementById("taskCategory").value;

  if (!title || !deadlineDate) {
    alert("タスク名と期限を入力してください");
    return;
  }

  tasks.push({
    title: title,
    importance: importance,
    deadlineDate: deadlineDate,
    category: category,
    isDone: false,
  });

  render();
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDeadline").value = "";
}

// 完了切り替え機能（アニメーション対応）
function toggleDone(index, event) {
  if (event) {
    // クリックされたボタンの親であるカード要素を取得
    const card =
      event.target.closest(".task-card") || event.target.closest(".done-card");
    if (card) {
      card.classList.add("removing"); // スライドアウトアニメーションを開始

      // アニメーションが終わるまで（350ミリ秒）待ってからデータを更新
      setTimeout(() => {
        tasks[index].isDone = !tasks[index].isDone;
        // 完了日時の管理
        if (tasks[index].isDone) {
          tasks[index].completedDate = getTodayString();
        } else {
          delete tasks[index].completedDate;
        }
        render();
      }, 350);
      return; // ここで処理を一旦終了
    }
  }
  // eventが取得できなかった場合の予備処理
  tasks[index].isDone = !tasks[index].isDone;
  render();
}

// 削除機能（アニメーション対応）
function deleteTask(index, event) {
  if (confirm("このタスクを削除しますか？")) {
    if (event) {
      const card = event.target.closest(".task-card");
      if (card) {
        card.classList.add("removing"); // スライドアウトアニメーションを開始

        setTimeout(() => {
          tasks.splice(index, 1);
          render();
        }, 350);
        return;
      }
    }
    // eventが取得できなかった場合の予備処理
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

// カテゴリーに応じた背景色を返す関数
function getCategoryColor(category) {
  // 基本カテゴリの専用色（文字が見やすいように透明度0.3のダークトーン）
  switch (category) {
    case "就活":
      return "rgba(67, 56, 202, 0.3)"; // インディゴ系
    case "大学":
      return "rgba(3, 105, 161, 0.3)"; // ブルー系
    case "バイト":
    case "塾講":
      return "rgba(21, 128, 61, 0.3)"; // グリーン系
    case "プライベート":
      return "rgba(190, 24, 93, 0.3)"; // ピンク系
    case "その他":
      return "rgba(30, 41, 59, 0.7)"; // デフォルト（元の色）
    default:
      // ユーザーが新しく追加したカテゴリには、名前の文字から自動で色を選択
      const colors = [
        "rgba(147, 51, 234, 0.3)", // パープル
        "rgba(180, 83, 9, 0.3)", // アンバー
        "rgba(4, 120, 87, 0.3)", // エメラルド
        "rgba(190, 18, 60, 0.3)", // ローズ
        "rgba(15, 118, 110, 0.3)", // ティール
      ];
      let hash = 0;
      for (let i = 0; i < category.length; i++) {
        hash = category.charCodeAt(i) + ((hash << 5) - hash);
      }
      return colors[Math.abs(hash) % colors.length];
  }
}

// タスクを編集状態にする関数
function editTask(index) {
  const task = tasks[index];

  // フォームに既存のデータを入れる
  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDeadline").value = task.deadlineDate;
  document.getElementById("taskImportance").value = task.importance;
  document.getElementById("taskCategory").value = task.category || "その他";

  // 編集中のインデックスを記憶
  editingIndex = index;

  // 「追加」ボタンを「更新」ボタンに変更する
  const submitBtn = document.querySelector(".input-form button");
  submitBtn.innerText = "更新";
  submitBtn.onclick = updateTask;

  // スマホなど画面下部にある場合、上部の入力フォームへスクロールさせる
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// 編集したタスクを保存する関数
function updateTask() {
  const title = document.getElementById("taskTitle").value;
  const deadlineDate = document.getElementById("taskDeadline").value;
  const importance = parseInt(document.getElementById("taskImportance").value);
  const category = document.getElementById("taskCategory").value;

  if (!title || !deadlineDate) {
    alert("タスク名と期限を入力してください");
    return;
  }

  // 記憶しておいたインデックスのデータを上書き
  tasks[editingIndex].title = title;
  tasks[editingIndex].deadlineDate = deadlineDate;
  tasks[editingIndex].importance = importance;
  tasks[editingIndex].category = category;

  // 状態をリセットして「追加」モードに戻す
  editingIndex = null;
  const submitBtn = document.querySelector(".input-form button");
  submitBtn.innerText = "追加";
  submitBtn.onclick = addTask;

  // フォームを空にする
  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDeadline").value = "";

  // 画面を再描画
  render();
}

// カテゴリのドロップダウンを生成する関数
function renderCategories() {
  const select = document.getElementById("taskCategory");
  if (!select) return; // まだHTMLがない場合はスキップ

  select.innerHTML = ""; // 一旦中身を空にする

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.innerText = cat;
    select.appendChild(opt);
  });

  const manageOpt = document.createElement("option");
  manageOpt.value = "manage";
  manageOpt.innerText = "カテゴリを編集...";
  manageOpt.style.color = "#fdfdfd"; // 紫色で目立たせる
  select.appendChild(manageOpt);
}

// ドロップダウンで「編集...」が選ばれた時のイベント
document.addEventListener("DOMContentLoaded", () => {
  const categorySelect = document.getElementById("taskCategory");
  if (categorySelect) {
    categorySelect.addEventListener("change", function (e) {
      if (e.target.value === "manage") {
        toggleCategoryDrawer(true); // パネルを開く
        e.target.value = categories[0] || ""; // 選択を一番上のカテゴリに戻す
      }
    });
  }
});

// カテゴリ管理ドロワーの開閉とリストの描画
function toggleCategoryDrawer(isOpen) {
  document.getElementById("categoryDrawer").classList.toggle("open", isOpen);
  document.getElementById("overlay").classList.toggle("show", isOpen);
  if (isOpen) {
    renderCategoryManager(); // 開いた時にリストを描画
  }
}

// カテゴリ管理のドラッグ＆ドロップの実装
let draggedIndex = null; // ドラッグ中のインデックスを記憶

function renderCategoryManager() {
  const listDiv = document.getElementById("categoryManageList");
  listDiv.innerHTML = "";

  categories.forEach((cat, index) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.background = "rgba(255, 255, 255, 0.05)";
    row.style.padding = "10px";
    row.style.borderRadius = "8px";

    // 「その他」は特別扱い（ドラッグ不可、編集・削除不可）
    if (cat === "その他") {
      row.style.cursor = "default";
      row.innerHTML = `
        <div style="display: flex; align-items: center; padding-left: 24px;">
          <span style="color: var(--text-sub);">${cat}</span>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-sub);">基本カテゴリ</span>
      `;
      listDiv.appendChild(row);
      return;
    }

    // ドラッグ＆ドロップの設定（その他以外のカテゴリ）
    row.style.cursor = "grab";
    row.draggable = true;

    // ドラッグ開始時
    row.addEventListener("dragstart", (e) => {
      draggedIndex = index;
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => (row.style.opacity = "0.4"), 0); // ドラッグ元を少し透明に
    });

    // ドラッグ終了時
    row.addEventListener("dragend", () => {
      draggedIndex = null;
      row.style.opacity = "1";
      renderCategoryManager(); // 線などのハイライトをリセット
    });

    row.addEventListener("dragover", (e) => {
      e.preventDefault(); // ドロップを許可
      e.dataTransfer.dropEffect = "move";
    });

    // ドラッグ要素が重なった時（目安の線を表示）
    row.addEventListener("dragenter", (e) => {
      e.preventDefault();
      if (draggedIndex !== null && draggedIndex !== index) {
        row.style.borderTop = "2px solid #a855f7";
      }
    });

    row.addEventListener("dragleave", () => {
      row.style.borderTop = "none";
    });

    // ドロップされた時
    row.addEventListener("drop", (e) => {
      e.preventDefault();
      row.style.borderTop = "none";

      if (draggedIndex === null || draggedIndex === index) return;

      // 配列の要素を入れ替える
      const targetCat = cat;
      const draggedCat = categories[draggedIndex];

      categories.splice(draggedIndex, 1);
      const targetIndex = categories.indexOf(targetCat);
      categories.splice(targetIndex, 0, draggedCat);

      ensureSonotaAtEnd(); // 念のため「その他」を末尾に確認
      saveCategories();
      renderCategoryManager();
    });

    // カテゴリ名と編集・削除ボタンを表示
    row.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: var(--text-sub); cursor: grab; font-size: 1.2rem;">≡</span>
        <span>${cat}</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <button onclick="editCategoryFromDrawer(${index})" style="background: none; border: none; padding: 0; color: #a855f7; font-size: 0.85rem;">変更</button>
        <button onclick="deleteCategoryFromDrawer(${index})" style="background: none; border: none; padding: 0; color: #ef4444; font-size: 0.85rem;">削除</button>
      </div>
    `;
    listDiv.appendChild(row);
  });
}

function addCategoryFromDrawer() {
  const input = document.getElementById("newCategoryInput");
  const newCat = input.value.trim();
  if (newCat && !categories.includes(newCat)) {
    categories.push(newCat);
    ensureSonotaAtEnd(); // 追加後に「その他」を末尾へ
    saveCategories();
    input.value = "";
    renderCategoryManager();
  } else if (categories.includes(newCat)) {
    alert("そのカテゴリはすでに存在します。");
  }
}

function deleteCategoryFromDrawer(index) {
  const delCat = categories[index];
  if (confirm(`「${delCat}」を削除しますか？`)) {
    categories.splice(index, 1);
    ensureSonotaAtEnd();
    saveCategories();
    renderCategoryManager();
  }
}

function editCategoryFromDrawer(index) {
  const oldCat = categories[index];
  const newCat = prompt(`「${oldCat}」の新しい名前を入力してください:`, oldCat);

  if (newCat && newCat.trim() !== "" && !categories.includes(newCat.trim())) {
    categories[index] = newCat.trim();

    // 既存のタスクのカテゴリも一斉更新
    tasks.forEach((task) => {
      if (task.category === oldCat) {
        task.category = newCat.trim();
      }
    });
    localStorage.setItem("myTasks", JSON.stringify(tasks));
    ensureSonotaAtEnd();
    saveCategories();
    render();
    renderCategoryManager();
  } else if (categories.includes(newCat) && newCat !== oldCat) {
    alert("その名前はすでに存在します。");
  }
}

// カテゴリデータを保存して画面を更新する関数
function saveCategories() {
  localStorage.setItem("myCategories", JSON.stringify(categories));
  renderCategories();
  render(); // タスクの表示も更新
}

// 初回起動時の処理
ensureSonotaAtEnd(); // 初回読み込み時に実行
renderCategories();
render();
