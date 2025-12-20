const STATUS = ["Yet to Start", "In Progress", "Completed", "Skipped"];
const VITAMINS = ["🥕","🌾","🍊","☀️","🥬","🥛"];

let plan = [];
let currentDay = 0;

/* INIT */
document.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  load();
  showPage("day");
});

/* NAV */
function showPage(page){
  ["day","week","summary","week-grid"].forEach(p=>{
    const el=document.getElementById("page-"+p);
    if(el) el.style.display="none";
  });
  document.getElementById("page-"+page).style.display="block";
  if(page==="week") renderWeekView();
  if(page==="summary") renderWeeklySummary();
  if(page==="week-grid") renderWeekGrid();
}

/* CSV LOAD */
function loadMealPlanFromCSV(input){
  const file=input.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    parseCSV(e.target.result);
    autoLockCompletedPastDays();
    save();
    renderDayStrip();
    renderDayDetails();
    alert("✅ Meal plan loaded");
  };
  reader.readAsText(file);
}

function parseCSV(text){
  const rows=text.split(/\r?\n/).filter(r=>r.trim());
  plan=[];
  for(let i=1;i<rows.length;i++){
    const c=parseRow(rows[i]);
    plan.push({
      day:c[0],
      date:c[1],
      locked:false,
      meals:{
        breakfast:{name:c[2],status:norm(c[3])},
        fruit:{name:c[4],status:norm(c[5])},
        lunch:{name:c[6],status:norm(c[7])},
        evening:{name:c[8],status:norm(c[9])},
        dinner:{name:c[10],status:norm(c[11])}
      },
      calories:Number((c[12]||"0").replace(/,/g,"")),
      vitamins:[...VITAMINS],
      notes:c[14]||""
    });
  }
  currentDay=0;
}

function parseRow(r){
  const res=[]; let cur="",q=false;
  for(const ch of r){
    if(ch==='"') q=!q;
    else if(ch===","&&!q){res.push(cur);cur="";}
    else cur+=ch;
  }
  res.push(cur);
  return res.map(v=>v.trim().replace(/^"|"$/g,""));
}

function norm(v){
  if(!v) return STATUS[0];
  v=v.toLowerCase();
  if(v.includes("complete")) return STATUS[2];
  if(v.includes("progress")) return STATUS[1];
  if(v.includes("skip")) return STATUS[3];
  return STATUS[0];
}

/* DAY VIEW */
function renderDayStrip(){
  const s=document.getElementById("dayStrip");
  s.innerHTML="";
  plan.forEach((d,i)=>{
    const t=document.createElement("div");
    t.className="day-tile"+
      (i===currentDay?" active":"")+
      (isDayFullyCompleted(d)?" completed":"");
    t.innerHTML=`${d.day}<br>${new Date(d.date).toDateString()}`;
    t.onclick=()=>selectDay(i);
    s.appendChild(t);
  });
}

function renderDayDetails(){
  const d=plan[currentDay];
  if(!d) return;
  document.getElementById("dayDetails").innerHTML=`
    <div class="day-card ${isDayFullyCompleted(d)?"day-completed":""}">
      <h3>${d.day} — ${d.date}</h3>

      ${!d.locked && isDayFullyCompleted(d)
        ? `<button onclick="completeAndLockDay()">✅ Complete & Lock Day</button>`
        : `<button onclick="toggleDayLock()">${d.locked?"🔓 Unlock":"🔒 Lock"} Day</button>`
      }

      ${mealRow("Breakfast","8–10 AM","breakfast")}
      ${mealRow("Fruit","12–12:30 PM","fruit")}
      ${mealRow("Lunch","2–3 PM","lunch")}
      ${mealRow("Evening","5:30–6:30 PM","evening")}
      ${mealRow("Dinner","7:30–8:30 PM","dinner")}

      <hr>
      🔥 ${d.calories} calories<br>
      💊 ${d.vitamins.join(" ")}
      <textarea ${d.locked?"disabled":""}
        oninput="saveNote(this.value)">${d.notes}</textarea>
    </div>`;
}

function mealRow(label,time,key){
  const m=plan[currentDay].meals[key];
  return `
    <div class="meal-row">
      <div><b>${label}</b><br><small>${time}</small><br>${m.name}</div>
      <select ${plan[currentDay].locked?"disabled":""}
        onchange="updateMealStatus('${key}',this.value)">
        ${STATUS.map(s=>`<option ${m.status===s?"selected":""}>${s}</option>`).join("")}
      </select>
    </div>`;
}

/* WEEK */
function renderWeekView(){
  const w=document.getElementById("weekView");
  w.innerHTML="";
  const s=Math.floor(currentDay/7)*7;
  for(let i=s;i<s+7&&i<plan.length;i++){
    w.innerHTML+=`<div class="day-card">${plan[i].day}<br>${plan[i].date}</div>`;
  }
}

function renderWeekGrid(){
  const g=document.getElementById("weekGrid");
  g.innerHTML="";
  const s=Math.floor(currentDay/7)*7;
  for(let i=s;i<s+7&&i<plan.length;i++){
    const d=plan[i];
    const dt=new Date(d.date);
    const c=document.createElement("div");
    c.className="week-cell"+
      (dt.getDay()===6?" saturday":"")+
      (dt.getDay()===0?" sunday":"")+
      (d.locked?" locked":"")+
      (i===currentDay?" active":"");
    c.innerHTML=`<b>${dt.toDateString()}</b><br>🔥 ${d.calories}`;
    c.onclick=()=>{currentDay=i;showPage("day");renderDayStrip();renderDayDetails();};
    g.appendChild(c);
  }
}

/* SUMMARY */
function renderWeeklySummary(){
  const s=Math.floor(currentDay/7)*7;
  let cal=0,c=0;
  for(let i=s;i<s+7&&i<plan.length;i++){cal+=plan[i].calories;c++;}
  document.getElementById("weeklySummary").innerHTML=
    `<div class="day-card">Avg Calories: ${Math.round(cal/c)}</div>`;
}

/* LOCKS */
function toggleDayLock(){plan[currentDay].locked=!plan[currentDay].locked;save();renderDayDetails();}
function completeAndLockDay(){plan[currentDay].locked=true;save();renderDayStrip();renderDayDetails();}
function autoLockCompletedPastDays(){
  const today=new Date(); today.setHours(0,0,0,0);
  plan.forEach(d=>{
    const dd=new Date(d.date); dd.setHours(0,0,0,0);
    if(dd<today && isDayFullyCompleted(d)) d.locked=true;
  });
}

/* HELPERS */
function isDayFullyCompleted(d){
  return Object.values(d.meals).every(m=>m.status==="Completed");
}

/* STORAGE */
function save(){
  localStorage.setItem("plan",JSON.stringify(plan));
  localStorage.setItem("day",currentDay);
}
function load(){
  const p=localStorage.getItem("plan");
  if(p){plan=JSON.parse(p);currentDay=Number(localStorage.getItem("day"))||0;}
  autoLockCompletedPastDays();
  renderDayStrip();
  renderDayDetails();
}

/* GLOBAL */
function selectDay(i){currentDay=i;save();renderDayStrip();renderDayDetails();}
function updateMealStatus(k,v){plan[currentDay].meals[k].status=v;save();}
function saveNote(v){plan[currentDay].notes=v;save();}
function deleteMealPlan(){
  if(confirm("Delete entire plan?")){
    localStorage.clear(); location.reload();
  }
}

/* DARK MODE */
function initDarkMode(){
  const b=document.getElementById("darkToggle");
  if(localStorage.getItem("dark")==="1")document.body.classList.add("dark");
  b.onclick=()=>{
    document.body.classList.toggle("dark");
    localStorage.setItem("dark",document.body.classList.contains("dark")?"1":"0");
  };
}
