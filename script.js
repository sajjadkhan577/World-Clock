/* Clock Suite - main script
   Features: World clock, Stopwatch (with laps), Timer (pause/resume), Alarms (localStorage), Bedtime
*/

// ---------- Helpers ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const pad = (n, d = 2) => String(n).padStart(d, '0');

function formatMs(ms){
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor(ms % 3600000 / 60000);
  const secs = Math.floor(ms % 60000 / 1000);
  const milli = ms % 1000;
  return `${pad(hours)}:${pad(mins)}:${pad(secs)}.${String(milli).padStart(3,'0')}`;
}
function formatMSShort(ms){
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor(ms % 60000 / 1000);
  return `${pad(mins)}:${pad(secs)}`;
}

// ---------- TAB NAV ----------
$$('.tab').forEach(btn=>{
  btn.addEventListener('click', (e)=>{
    const target = btn.dataset.tab;
    $$('.tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    $$('.panel').forEach(p=>{
      if(p.id === target){
        p.classList.add('active'); p.hidden = false;
      } else {
        p.classList.remove('active'); p.hidden = true;
      }
    });
  });
});

// ---------- WORLD CLOCK ----------
const zones = [
  {label:'London', tz:'Europe/London'},
  {label:'New York', tz:'America/New_York'},
  {label:'Tokyo', tz:'Asia/Tokyo'},
  {label:'Dubai', tz:'Asia/Dubai'},
  {label:'Karachi', tz:'Asia/Karachi'},
  {label:'Sydney', tz:'Australia/Sydney'},
  {label:'Los Angeles', tz:'America/Los_Angeles'},
  {label:'Berlin', tz:'Europe/Berlin'}
];
const citySelect = $('#tzSelect');
zones.forEach(z => {
  const opt = document.createElement('option');
  opt.value = z.tz; opt.textContent = z.label + ' — ' + z.tz;
  citySelect.appendChild(opt);
});

let worldCities = JSON.parse(localStorage.getItem('worldCities') || '[]');
function renderWorld(){
  const ul = $('#cities');
  if(!ul) return;
  ul.innerHTML = '';
  worldCities.forEach((tz, i)=>{
    const li = document.createElement('li');
    li.className = 'world-item';
    const dt = new Date().toLocaleTimeString([], {timeZone: tz, hour12:false});
    li.innerHTML = `<div><strong>${tz.split('/').slice(-1)[0].replace('_',' ')}</strong><div class="muted small">${tz}</div></div>
                    <div style="font-family:monospace">${dt}</div>
                    <div><button data-i="${i}" class="ghost remove-city">Remove</button></div>`;
    ul.appendChild(li);
  });
}
const addCityBtn = $('#addCity');
if(addCityBtn){
  addCityBtn.addEventListener('click', ()=>{
    const tz = citySelect.value;
    if(!worldCities.includes(tz)){ worldCities.push(tz); localStorage.setItem('worldCities', JSON.stringify(worldCities)); renderWorld(); }
  });
}
const clearCitiesBtn = $('#clear-cities');
if(clearCitiesBtn){
  clearCitiesBtn.addEventListener('click', ()=>{
    worldCities = []; localStorage.removeItem('worldCities'); renderWorld();
  });
}
document.addEventListener('click', (e)=>{
  if(e.target.classList.contains('remove-city')){
    const idx = +e.target.dataset.i;
    worldCities.splice(idx,1); localStorage.setItem('worldCities', JSON.stringify(worldCities)); renderWorld();
  }
});
function tickWorld(){
  renderWorld();
}
setInterval(tickWorld,1000);
renderWorld();

// ---------- STOPWATCH ----------
let swStart = 0, swElapsed = 0, swTimer = null;
const swDisplay = $('#sw-display');
const swStartBtn = $('#sw-start'), swStopBtn = $('#sw-stop'), swLapBtn = $('#sw-lap'), swResetBtn = $('#sw-reset');
const swLaps = $('#sw-laps');

function updateSwDisplay(){
  const elapsed = swElapsed + (swStart ? (Date.now() - swStart) : 0);
  swDisplay.textContent = formatMs(elapsed);
}

swStartBtn.addEventListener('click', ()=>{
  if(!swTimer){
    if(!swStart) swStart = Date.now();
    else swStart = Date.now();
    swTimer = setInterval(updateSwDisplay, 33);
    swStartBtn.disabled = true; swStopBtn.disabled = false; swLapBtn.disabled = false;
  }
});
swStopBtn.addEventListener('click', ()=>{
  if(swTimer){
    clearInterval(swTimer); swTimer = null;
    swElapsed += Date.now() - swStart;
    swStart = 0;
    updateSwDisplay();
    swStartBtn.disabled = false; swStopBtn.disabled = true; swLapBtn.disabled = true;
  }
});
swResetBtn.addEventListener('click', ()=>{
  clearInterval(swTimer); swTimer = null; swStart = 0; swElapsed = 0; swDisplay.textContent='00:00:00.000';
  swLaps.innerHTML = ''; swStartBtn.disabled = false; swStopBtn.disabled = true; swLapBtn.disabled = true;
});
swLapBtn.addEventListener('click', ()=>{
  const elapsed = swElapsed + (swStart ? (Date.now() - swStart) : 0);
  const li = document.createElement('li');
  li.textContent = `${formatMs(elapsed)}`;
  swLaps.prepend(li);
});

// ---------- TIMER ----------
let timerRemaining = 0, timerInterval = null;
const timerDisplay = $('#timer-display'), timerMin = $('#timer-min'), timerSec = $('#timer-sec');
const timerStart = $('#timer-start'), timerPause = $('#timer-pause'), timerReset = $('#timer-reset');

function renderTimer(){
  timerDisplay.textContent = timerRemaining > 0 ? formatMSShort(timerRemaining*1000) : '00:00';
}

timerStart.addEventListener('click', ()=>{
  const mins = parseInt(timerMin.value || 0, 10);
  const secs = parseInt(timerSec.value || 0, 10);
  if(isNaN(mins) || isNaN(secs)) return alert('Enter minutes/seconds');
  timerRemaining = mins * 60 + secs;
  if(timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=>{
    if(timerRemaining <= 0){
      clearInterval(timerInterval); timerInterval = null; renderTimer();
      alarmRing('Timer');
      timerPause.disabled = true;
      return;
    }
    timerRemaining--; renderTimer();
  }, 1000);
  timerPause.disabled = false;
});
timerPause.addEventListener('click', ()=>{
  if(timerInterval){
    clearInterval(timerInterval); timerInterval = null; timerPause.textContent = 'Resume';
  } else {
    if(timerRemaining <= 0) return;
    timerInterval = setInterval(()=>{
      if(timerRemaining <= 0){
        clearInterval(timerInterval); timerInterval = null; alarmRing('Timer');
      } else { timerRemaining--; renderTimer(); }
    }, 1000);
    timerPause.textContent = 'Pause';
  }
});
timerReset.addEventListener('click', ()=>{
  clearInterval(timerInterval); timerInterval = null; timerRemaining = 0; renderTimer(); timerPause.disabled = true; timerPause.textContent = 'Pause';
});

// ---------- ALARMS ----------
const alarmForm = $('#alarm-form'), alarmList = $('#alarm-list');
let alarms = JSON.parse(localStorage.getItem('alarms') || '[]');

function saveAlarms(){ localStorage.setItem('alarms', JSON.stringify(alarms)); }
function renderAlarms(){
  alarmList.innerHTML = '';
  alarms.forEach((a, i)=>{
    const li = document.createElement('li'); li.className = 'alarm-item';
    const repeat = (a.recur === 'daily') ? 'Daily' : (a.recur === 'weekdays' ? 'Weekdays' : 'Once');
    li.innerHTML = `<div><strong>${a.time}</strong> <div class="muted small">${a.label || ''} ${a.label? '•':''} ${repeat}</div></div>
                    <div>
                      <button data-i="${i}" class="ghost delete-alarm">Delete</button>
                    </div>`;
    alarmList.appendChild(li);
  });
}
alarmForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const time = $('#alarm-time').value;
  const label = $('#alarm-label').value.trim();
  const recur = $('#alarm-recur').value;
  if(!time) return;
  alarms.push({time, label, recur});
  saveAlarms(); renderAlarms();
  alarmForm.reset();
});
document.addEventListener('click', (e)=>{
  if(e.target.classList.contains('delete-alarm')){
    const idx = +e.target.dataset.i;
    alarms.splice(idx,1); saveAlarms(); renderAlarms();
  }
});
renderAlarms();

// Alarm check loop - every second
const alarmSound = document.getElementById('alarm-sound');
function alarmRing(source){
  // visual
  alert(`🔔 ${source} finished!`);
  // try to play sound
  try { alarmSound.currentTime = 0; alarmSound.play(); } catch(e){}
}
setInterval(()=>{
  const now = new Date();
  const hh = pad(now.getHours()), mm = pad(now.getMinutes());
  const nowStr = `${hh}:${mm}`;
  alarms.forEach((a, idx)=>{
    if(a._lastTriggered === nowStr) return; // avoid multiple triggers same minute
    // check recurrence
    if(a.time === nowStr){
      const dow = now.getDay(); // 0 Sun ... 6 Sat
      if(a.recur === 'once'){
        alarmRing(a.label || 'Alarm');
        a._lastTriggered = nowStr;
        // remove once alarms after firing
        alarms.splice(idx,1); saveAlarms(); renderAlarms();
      } else if(a.recur === 'daily'){
        alarmRing(a.label || 'Alarm'); a._lastTriggered = nowStr;
      } else if(a.recur === 'weekdays'){
        if(dow >= 1 && dow <=5){ alarmRing(a.label || 'Alarm'); a._lastTriggered = nowStr; }
      }
    }
  });
}, 1000);

// ---------- BEDTIME ----------
const sleepInput = $('#sleep-time'), wakeInput = $('#wake-time'), saveBedBtn = $('#save-bedtime'), clearBedBtn = $('#clear-bedtime');
const bedtimeInfo = $('#bedtime-info');
let bedtime = JSON.parse(localStorage.getItem('bedtime') || 'null');

function renderBedtime(){
  if(!bedtime){ bedtimeInfo.textContent = 'No bedtime set.'; return; }
  const s = bedtime.sleep, w = bedtime.wake;
  bedtimeInfo.innerHTML = `Sleep: <strong>${s}</strong> — Wake: <strong>${w}</strong>`;
  // Also show next sleep duration
  const now = new Date();
  const [sh, sm] = s.split(':').map(Number);
  const [wh, wm] = w.split(':').map(Number);
  const sleepDt = new Date(now);
  sleepDt.setHours(sh, sm, 0, 0);
  if(sleepDt <= now) sleepDt.setDate(sleepDt.getDate() + 1);
  const wakeDt = new Date(sleepDt);
  wakeDt.setHours(wh, wm, 0, 0);
  if(wakeDt <= sleepDt) wakeDt.setDate(wakeDt.getDate() + 1);
  const ms = wakeDt - sleepDt;
  const hours = Math.floor(ms / (1000*60*60));
  const mins = Math.floor(ms / (1000*60)) % 60;
  bedtimeInfo.innerHTML += `<div class="muted small">Planned sleep duration: ${hours}h ${mins}m</div>`;
}

saveBedBtn.addEventListener('click', ()=>{
  const s = sleepInput.value, w = wakeInput.value;
  if(!s || !w){ alert('Set both sleep and wake times'); return; }
  bedtime = {sleep: s, wake: w};
  localStorage.setItem('bedtime', JSON.stringify(bedtime));
  renderBedtime();
});
clearBedBtn.addEventListener('click', ()=>{
  bedtime = null; localStorage.removeItem('bedtime'); renderBedtime();
});
if(bedtime){ sleepInput.value = bedtime.sleep; wakeInput.value = bedtime.wake; }
renderBedtime();

// ---------- INITIAL UI STATE ----------
renderTimer();
updateSwDisplay();

// Optional: request notification permission (non-blocking)
if('Notification' in window && Notification.permission === 'default'){
  try{ Notification.requestPermission(); } catch(e){}
}
