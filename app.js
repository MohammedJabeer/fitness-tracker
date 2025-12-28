/**************** FOOD DATABASE ****************/
const FOOD_DB = {
  omelette: { name: "Omelette", serving: "2 eggs", calories: 180 },
  egg_bhurji: { name: "Egg Bhurji", serving: "2 eggs", calories: 190 },
  boiled_eggs: { name: "Boiled Eggs", serving: "2 eggs", calories: 140 },

  oats: { name: "Oats", serving: "40 g", calories: 163 },
  poha: { name: "Poha", serving: "100 g", calories: 130 },
  dosa: { name: "Dosa", serving: "1", calories: 170 },

  rice: { name: "White Rice", serving: "100 g", calories: 130 },
  chapati: { name: "Chapati", serving: "1", calories: 100 },

  chicken: { name: "Chicken Breast", serving: "100 g", calories: 165 },
  fish: { name: "Fish", serving: "100 g", calories: 97 },

  dal: { name: "Dal", serving: "100 g", calories: 120 },
  paneer: { name: "Paneer", serving: "100 g", calories: 265 },

  lauki: { name: "Lauki", serving: "150 g", calories: 50 },
  palak: { name: "Palak", serving: "150 g", calories: 50 },

  apple: { name: "Apple", serving: "150 g", calories: 80 },
  banana: { name: "Banana", serving: "100 g", calories: 89 },

  milk: { name: "Milk", serving: "200 ml", calories: 90 },

  olive_oil: { name: "Olive Oil", serving: "1 tsp", calories: 40 },
  ghee: { name: "Ghee", serving: "1 tsp", calories: 45 },

  salt: { name: "Salt", serving: "1 tsp", calories: 0 },
  chilli: { name: "Red Chilli Powder", serving: "1 tsp", calories: 6 }
};

const STATUS = ["Yet to Start", "In Progress", "Completed", "Skipped"];

let plan = [];
let currentDay = 0;

/**************** INIT ****************/
document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  initPlan();
  showPage("day");
});

/**************** PLAN ****************/
function initPlan() {
  const saved = localStorage.getItem("plan");
  if (saved) {
    plan = JSON.parse(saved);
    currentDay = Number(localStorage.getItem("day")) || 0;
  } else {
    for (let i = 1; i <= 62; i++) {
      plan.push({
        day: "Day " + i,
        date: new Date(Date.now() + (i - 1) * 86400000).toISOString().slice(0,10),
        locked: false,
        meals: {
          breakfast: { foodId: "", status: STATUS[0] },
          fruit: { foodId: "", status: STATUS[0] },
          lunch: { foodId: "", status: STATUS[0] },
          evening: { foodId: "", status: STATUS[0] },
          dinner: { foodId: "", status: STATUS[0] }
        },
        calories: 0,
        notes: ""
      });
    }
    save();
  }
  renderDayStrip();
  renderDayDetails();
}

function save() {
  localStorage.setItem("plan", JSON.stringify(plan));
  localStorage.setItem("day", currentDay);
}

/**************** NAV ****************/
function showPage(page) {
  ["day","week","week-grid","summary"].forEach(p => {
    const el = document.getElementById("page-" + p);
    if (el) el.style.display = "none";
  });
  document.getElementById("page-" + page).style.display = "block";

  if (page === "week") renderWeekView();
  if (page === "week-grid") renderWeekGrid();
  if (page === "summary") renderWeeklySummary();
}

/**************** DAY VIEW ****************/
function renderDayStrip() {
  const strip = document.getElementById("dayStrip");
  strip.innerHTML = "";
  plan.forEach((d, i) => {
    const tile = document.createElement("div");
    tile.className = "day-tile" + (i === currentDay ? " active" : "");
    tile.innerHTML = d.day;
    tile.onclick = () => selectDay(i);
    strip.appendChild(tile);
  });
}

function renderDayDetails() {
  const d = plan[currentDay];
  document.getElementById("dayDetails").innerHTML = `
    <div class="day-card">
      <h3>${d.day}</h3>

      ${mealRow("Breakfast", "8–10 AM", "breakfast")}
      ${mealRow("Fruit", "12 PM", "fruit")}
      ${mealRow("Lunch", "2–3 PM", "lunch")}
      ${mealRow("Evening", "6 PM", "evening")}
      ${mealRow("Dinner", "8 PM", "dinner")}

      <hr>
      🔥 ${d.calories} calories
      <textarea placeholder="Notes..." oninput="saveNote(this.value)">${d.notes}</textarea>
    </div>
  `;
}

function mealRow(label, time, key) {
  const meal = plan[currentDay].meals[key];
  const options = Object.entries(FOOD_DB)
    .map(([id, f]) =>
      `<option value="${id}" ${meal.foodId === id ? "selected" : ""}>
        ${f.name} (${f.serving}, ${f.calories} kcal)
      </option>`
    ).join("");

  return `
    <div class="meal-row">
      <div>
        <b>${label}</b><br><small>${time}</small><br>
        <select onchange="updateMealFood('${key}', this.value)">
          <option value="">-- Select Food --</option>
          ${options}
        </select>
      </div>

      <select onchange="updateMealStatus('${key}', this.value)">
        ${STATUS.map(s =>
          `<option ${meal.status === s ? "selected" : ""}>${s}</option>`
        ).join("")}
      </select>
    </div>
  `;
}

/**************** UPDATES ****************/
function updateMealFood(key, foodId) {
  plan[currentDay].meals[key].foodId = foodId;
  recalcCalories();
  save();
  renderDayDetails();
}

function updateMealStatus(key, status) {
  plan[currentDay].meals[key].status = status;
  save();
}

function recalcCalories() {
  let total = 0;
  Object.values(plan[currentDay].meals).forEach(m => {
    if (m.foodId && FOOD_DB[m.foodId]) {
      total += FOOD_DB[m.foodId].calories;
    }
  });
  plan[currentDay].calories = total;
}

function saveNote(v) {
  plan[currentDay].notes = v;
  save();
}

function selectDay(i) {
  currentDay = i;
  save();
  renderDayStrip();
  renderDayDetails();
}

/**************** WEEK & SUMMARY ****************/
function renderWeekView() {
  document.getElementById("weekView").innerHTML =
    "<div class='day-card'>Week view coming next</div>";
}

function renderWeekGrid() {
  document.getElementById("weekGrid").innerHTML =
    "<div class='day-card'>Calendar view coming next</div>";
}

function renderWeeklySummary() {
  const start = Math.floor(currentDay / 7) * 7;
  let sum = 0, c = 0;
  for (let i = start; i < start + 7 && i < plan.length; i++) {
    sum += plan[i].calories;
    c++;
  }
  document.getElementById("weeklySummary").innerHTML =
    `<div class="day-card">Avg Calories: ${Math.round(sum / c)}</div>`;
}

/**************** DELETE ****************/
function deleteMealPlan() {
  if (confirm("Delete entire plan?")) {
    localStorage.clear();
    location.reload();
  }
}

/**************** DARK MODE ****************/
function initDarkMode() {
  const b = document.getElementById("darkToggle");
  if (localStorage.getItem("dark") === "1") document.body.classList.add("dark");
  b.onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("dark",
      document.body.classList.contains("dark") ? "1" : "0");
  };
}
