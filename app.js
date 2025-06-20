// ── Dark Mode Manager ──────────────────────
class DarkModeManager {
  constructor() {
    this.darkModeToggle = document.getElementById('darkModeToggle');
    this.body = document.body;
    this.init();
  }

  init() {
  
    if (window.darkModeEnabled === undefined) {
     
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      window.darkModeEnabled = prefersDark;
    }
    
    if (window.darkModeEnabled) {
      this.enableDarkMode();
    }

    
    this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
    
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (window.darkModeUserSet !== true) {
        if (e.matches) {
          this.enableDarkMode();
        } else {
          this.disableDarkMode();
        }
      }
    });
  }

  toggleDarkMode() {
    window.darkModeUserSet = true; 
    if (this.body.classList.contains('dark-mode')) {
      this.disableDarkMode();
    } else {
      this.enableDarkMode();
    }
  }

  enableDarkMode() {
    this.body.classList.add('dark-mode');
    this.darkModeToggle.innerHTML = '☀️';
    this.darkModeToggle.title = 'Switch to Light Mode';
    window.darkModeEnabled = true;
  }

  disableDarkMode() {
    this.body.classList.remove('dark-mode');
    this.darkModeToggle.innerHTML = '🌙';
    this.darkModeToggle.title = 'Switch to Dark Mode';
    window.darkModeEnabled = false;
  }
}

//  City Manage//
class CityManager {
  constructor() {
    this.cities = [
      { name: "Calgary", lat: 51.0501, lon: -114.0853, flag: "🇨🇦" },
      { name: "New York", lat: 40.7128, lon: -74.0060, flag: "🇺🇸" },
      { name: "London", lat: 51.5074, lon: -0.1278, flag: "🇬🇧" },
      { name: "Paris", lat: 48.8566, lon: 2.3522, flag: "🇫🇷" },
      { name: "Tokyo", lat: 35.6762, lon: 139.6503, flag: "🇯🇵" },
    ];
    
    this.currentCityIndex = 0;
    this.init();
  }

  init() {
    // 從記憶體變數載入上次選擇的城市
    if (window.selectedCityIndex !== undefined) {
      this.currentCityIndex = window.selectedCityIndex;
    }

    this.createCitySelector();
  }

  createCitySelector() {
    const citySelect = document.getElementById('citySelect');
    if (!citySelect) return;

    // 清空現有選項
    citySelect.innerHTML = '';

    // 添加城市選項
    this.cities.forEach((city, index) => {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = `${city.flag} ${city.name}`;
      if (index === this.currentCityIndex) {
        option.selected = true;
      }
      citySelect.appendChild(option);
    });

    // 綁定改變事件
    citySelect.addEventListener('change', (e) => {
      this.currentCityIndex = parseInt(e.target.value);
      window.selectedCityIndex = this.currentCityIndex;
      // 重新載入天氣數據
      loadForecast();
    });
  }

  getCurrentCity() {
    return this.cities[this.currentCityIndex];
  }

  getCityName() {
    const city = this.getCurrentCity();
    return `${city.flag} ${city.name}`;
  }
}

// Weather Widget 
// State //
let useCelsius = true;
let forecast = [];
let selectedDay = 0;
let cityManager;

// DOM refs//
const mainCard = document.getElementById("mainCard");
const miniGrid = document.getElementById("miniGrid");
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("unitToggle");
const cityNameEl = document.getElementById("cityName");

// Fetch forecast //
async function loadForecast() {
  try {
    statusEl.textContent = "Loading…";
    statusEl.style.display = "block";
    toggleBtn.disabled = true;
    mainCard.className = "main-card loading";
    mainCard.textContent = "Loading forecast...";
    const currentCity = cityManager.getCurrentCity();
    
    const url = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${currentCity.lat}&longitude=${currentCity.lon}` +
      `&daily=weathercode,temperature_2m_max` + 
      `&hourly=temperature_2m,weathercode` +
      `&current=temperature_2m` +
      `&temperature_unit=celsius&timezone=auto`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { daily } = await res.json();
    forecast = daily.time.map((d, i) => {
      const c = Math.round(daily.temperature_2m_max[i]);
      return {
        day: new Date(d).toLocaleDateString("en-CA", { weekday: "short" }),
        tempC: c,
        tempF: Math.round(c * 9/5 + 32),
        cond: codeToCond(daily.weathercode[i])
      };
    });

    // change city's name
    if (cityNameEl) {
      cityNameEl.textContent = cityManager.getCityName();
    }

    statusEl.style.display = "none";
    toggleBtn.disabled = false;
    selectedDay = 0;
    renderAll();
  } catch (err) {
    statusEl.className = "error";
    statusEl.style.display = "block";
    statusEl.textContent = `Error: ${err.message}`;
    mainCard.className = "main-card loading";
    mainCard.textContent = "Failed to load weather data";
  }
}

//
function codeToCond(c) {
  if (c === 0) return "Sunny";
  if ([1, 2, 3].includes(c)) return "Partly Cloudy";
  if ([45, 48].includes(c)) return "Fog";
  if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(c)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(c)) return "Snow";
  if ([95, 96, 99].includes(c)) return "Thunderstorm";
  return "Cloudy";
}

function icon(cond) {
  return {
    Sunny: "☀️", 
    "Partly Cloudy": "⛅", 
    Cloudy: "☁️", 
    Fog: "🌫️",
    Rain: "🌧️", 
    Thunderstorm: "⛈️", 
    Snow: "🌨️"
  }[cond] || "🌡️";
}

const gradClass = c => ({
  Sunny: "sunny", 
  "Partly Cloudy": "partly", 
  Cloudy: "cloudy",
  Rain: "rain", 
  Snow: "snow", 
  Thunderstorm: "storm", 
  Fog: "fog"
}[c] || "cloudy");

function renderMain() {
  const d = forecast[selectedDay];
  mainCard.className = `main-card ${gradClass(d.cond)}`;
  mainCard.innerHTML = `
    <div class="main-icon">${icon(d.cond)}</div>
    <div class="main-temp">${useCelsius ? d.tempC + "°C" : d.tempF + "°F"}</div>
    <div class="main-cond">${d.cond}</div>
    <div class="main-day">${d.day}</div>`;
}

function renderMini() {
  miniGrid.innerHTML = "";
  forecast.forEach((d, i) => {
    const li = document.createElement("li");
    li.className = `mini-card ${i === selectedDay ? "active" : ""}`;
    li.innerHTML = `
      <span class="icon">${icon(d.cond)}</span>
      <span>${d.day}</span>
      <span>${useCelsius ? d.tempC : d.tempF}°</span>`;
    li.onclick = () => { 
      selectedDay = i; 
      renderMain(); 
      renderMini(); 
    };
    miniGrid.appendChild(li);
  });
}

const renderAll = () => { 
  renderMain(); 
  renderMini(); 
};

// events//
toggleBtn.onclick = () => {
  useCelsius = !useCelsius;
  toggleBtn.textContent = useCelsius ? "°F" : "°C";
  renderAll();
};

// init //
document.addEventListener('DOMContentLoaded', () => {
  new DarkModeManager();
  cityManager = new CityManager();
  loadForecast();
});