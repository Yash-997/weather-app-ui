const API_BASE = "https://weather-api-1tct.onrender.com";

const $ = (id) => document.getElementById(id);
const cityInput = $("city-input");
const daysInput = $("days-input");
const loadBtn = $("load-btn");
const loader = $("loader");
const notice = $("notice");

const elCity = $("city");
const elRegion = $("region");
const elTemp = $("temp");
const elCond = $("condition");
const elHumidity = $("humidity");
const elUpdated = $("updated");
const forecastContainer = $("forecast-container");
const weatherIllustration = $("weather-illustration");
const currentWeatherCard = $("current-weather");

// New UI elements
const localTime = $("local-time");
const highTemp = $("high-temp");
const lowTemp = $("low-temp");
const humidityFill = $("humidity-fill");


// Temperature unit state (UI only)
let currentUnit = "C";

// NOTE: removed old mini-info-row creation — using explicit DOM fields in HTML instead.

function showLoader(on) {
  if (on) {
    loader.classList.add("show");
  } else {
    loader.classList.remove("show");
  }
}
function showNotice(msg, isError = true) {
  notice.textContent = msg || "";
  notice.className = "atmos-notice show";
  setTimeout(() => notice.classList.remove("show"), 3200);
}
function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  } catch {
    return iso || "";
  }
}

// Determine time of day (6 AM - 6 PM = day, else night)
function getTimeMode() {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 18) ? "day" : "night";
}

// Get weather condition type from condition string
function getConditionType(condition) {
  if (!condition) return "clear";
  const cond = condition.toLowerCase();
  if (cond.includes("sunny") || cond.includes("clear")) return "clear";
  if (cond.includes("thunder") || cond.includes("storm")) return "thunder";
  if (cond.includes("rain") || cond.includes("drizzle")) return "rain";
  if (cond.includes("snow")) return "snow";
  if (cond.includes("mist") || cond.includes("fog")) return "mist";
  if (cond.includes("cloud")) return "cloud";
  return "clear";
}

// Generate SVG for weather illustration
function generateWeatherSVG(conditionType, timeMode) {
  const isNight = timeMode === "night";
  const isClear = conditionType === "clear";
  
  if (isClear && isNight) {
    // Clear Night: Moon + Stars
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="moonGrad" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#f0e68c" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#d4af37" stop-opacity="0.6"/>
          </radialGradient>
        </defs>
        <path class="moon" d="M100 60 Q85 60 85 75 Q85 90 100 90 Q115 90 115 75 Q115 60 100 60" fill="url(#moonGrad)" opacity="0.9"/>
        <circle class="star" cx="60" cy="50" r="2" fill="#ffffff" opacity="0.8"/>
        <circle class="star" cx="140" cy="45" r="1.5" fill="#ffffff" opacity="0.7"/>
        <circle class="star" cx="50" cy="100" r="1.8" fill="#ffffff" opacity="0.9"/>
        <circle class="star" cx="150" cy="110" r="2" fill="#ffffff" opacity="0.8"/>
      </svg>
    `;
  } else if (isClear || conditionType === "sunny") {
    // Sunny Day: Sun with rays
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="sunGrad" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#ffd700" stop-opacity="1"/>
            <stop offset="70%" stop-color="#ffaa00" stop-opacity="0.8"/>
            <stop offset="100%" stop-color="#ff8800" stop-opacity="0.4"/>
          </radialGradient>
        </defs>
        <g class="sun-ray" transform="translate(100, 100)">
          <line x1="0" y1="-80" x2="0" y2="-65" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <line x1="0" y1="80" x2="0" y2="65" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <line x1="-80" y1="0" x2="-65" y2="0" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <line x1="80" y1="0" x2="65" y2="0" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <line x1="-56" y1="-56" x2="-46" y2="-46" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <line x1="56" y1="56" x2="46" y2="46" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <line x1="-56" y1="56" x2="-46" y2="46" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
          <line x1="56" y1="-56" x2="46" y2="-46" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        </g>
        <circle class="sun-core" cx="100" cy="100" r="25" fill="url(#sunGrad)"/>
      </svg>
    `;
  } else if (conditionType === "cloud") {
    // Cloudy: Layered clouds
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <g class="cloud" transform="translate(100, 100)">
          <path d="M-40 20 Q-50 20 -50 10 Q-50 0 -40 0 Q-30 -10 -20 -10 Q-10 -20 0 -20 Q10 -20 20 -10 Q30 -10 40 0 Q50 0 50 10 Q50 20 40 20 L-40 20 Z" 
                fill="rgba(255,255,255,0.4)" opacity="0.6"/>
        </g>
        <g class="cloud" transform="translate(80, 120)">
          <path d="M-30 15 Q-38 15 -38 8 Q-38 0 -30 0 Q-22 -8 -15 -8 Q-8 -15 0 -15 Q8 -15 15 -8 Q22 -8 30 0 Q38 0 38 8 Q38 15 30 15 L-30 15 Z" 
                fill="rgba(255,255,255,0.35)" opacity="0.5"/>
        </g>
        <g class="cloud" transform="translate(120, 110)">
          <path d="M-25 12 Q-32 12 -32 6 Q-32 0 -25 0 Q-18 -6 -12 -6 Q-6 -12 0 -12 Q6 -12 12 -6 Q18 -6 25 0 Q32 0 32 6 Q32 12 25 12 L-25 12 Z" 
                fill="rgba(255,255,255,0.3)" opacity="0.4"/>
        </g>
      </svg>
    `;
  } else if (conditionType === "rain") {
    // Rain: Clouds + falling raindrops
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 80 Q30 80 30 70 Q30 60 40 60 Q50 50 60 50 Q70 40 80 40 Q90 40 100 50 Q110 50 120 60 Q130 60 130 70 Q130 80 120 80 L40 80 Z" 
              fill="rgba(255,255,255,0.4)" opacity="0.6"/>
        <line class="raindrop" x1="60" y1="90" x2="60" y2="110" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        <line class="raindrop" x1="80" y1="95" x2="80" y2="115" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        <line class="raindrop" x1="100" y1="90" x2="100" y2="110" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        <line class="raindrop" x1="120" y1="95" x2="120" y2="115" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
        <line class="raindrop" x1="70" y1="100" x2="70" y2="120" stroke="#60a5fa" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
      </svg>
    `;
  } else if (conditionType === "thunder") {
    // Thunderstorm: Dark clouds + lightning
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M30 90 Q20 90 20 80 Q20 70 30 70 Q40 60 50 60 Q60 50 70 50 Q80 50 90 60 Q100 60 110 70 Q120 70 120 80 Q120 90 110 90 L30 90 Z" 
              fill="rgba(60,60,80,0.6)" opacity="0.7"/>
        <path class="lightning" d="M75 70 L85 90 L80 90 L90 130 L70 100 L75 100 L65 70 Z" fill="#ffd700" opacity="1"/>
        <line class="raindrop" x1="50" y1="100" x2="50" y2="120" stroke="#4a5568" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <line class="raindrop" x1="70" y1="105" x2="70" y2="125" stroke="#4a5568" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <line class="raindrop" x1="90" y1="100" x2="90" y2="120" stroke="#4a5568" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <line class="raindrop" x1="110" y1="105" x2="110" y2="125" stroke="#4a5568" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
      </svg>
    `;
  } else if (conditionType === "snow") {
    // Snow: Clouds + snowflakes
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <path d="M40 80 Q30 80 30 70 Q30 60 40 60 Q50 50 60 50 Q70 40 80 40 Q90 40 100 50 Q110 50 120 60 Q130 60 130 70 Q130 80 120 80 L40 80 Z" 
              fill="rgba(255,255,255,0.5)" opacity="0.7"/>
        <g class="snowflake" transform="translate(60, 100)">
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <line x1="-6" y1="-6" x2="6" y2="6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-6" y1="6" x2="6" y2="-6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
        </g>
        <g class="snowflake" transform="translate(100, 110)">
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <line x1="-6" y1="-6" x2="6" y2="6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-6" y1="6" x2="6" y2="-6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
        </g>
        <g class="snowflake" transform="translate(140, 105)">
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
          <line x1="-6" y1="-6" x2="6" y2="6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-6" y1="6" x2="6" y2="-6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
        </g>
      </svg>
    `;
  } else if (conditionType === "mist") {
    // Mist/Fog: Gradient fog layers
    return `
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="fogGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.1)" stop-opacity="0"/>
            <stop offset="50%" stop-color="rgba(255,255,255,0.2)" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.1)" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="fogGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.15)" stop-opacity="0"/>
            <stop offset="50%" stop-color="rgba(255,255,255,0.25)" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.15)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect class="fog-layer" x="0" y="80" width="200" height="30" fill="url(#fogGrad1)" opacity="0.5"/>
        <rect class="fog-layer" x="0" y="110" width="200" height="25" fill="url(#fogGrad2)" opacity="0.4"/>
        <rect class="fog-layer" x="0" y="135" width="200" height="20" fill="url(#fogGrad1)" opacity="0.3"/>
      </svg>
    `;
  } else {
    // Default: Clear day
    return generateWeatherSVG("clear", "day");
  }
}

// Update weather illustration and time mode
function updateWeatherVisuals(condition) {
  const timeMode = getTimeMode();
  const conditionType = getConditionType(condition);
  
  // Update time mode on body and hero card
  document.body.setAttribute("data-time-mode", timeMode);
  currentWeatherCard.setAttribute("data-time-mode", timeMode);
  
  // Update weather illustration
  weatherIllustration.setAttribute("data-condition", conditionType);
  weatherIllustration.setAttribute("data-time-mode", timeMode);
  weatherIllustration.innerHTML = generateWeatherSVG(conditionType, timeMode);
}

// Generate small forecast icon SVG
function getForecastIconSVG(condition) {
  const cond = condition ? condition.toLowerCase() : "";
  if (cond.includes("sunny") || cond.includes("clear")) {
    return `<svg class="forecast-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="8" fill="#ffd700" opacity="0.9"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="#ffd700" stroke-width="1.5"/>
      <line x1="16" y1="26" x2="16" y2="30" stroke="#ffd700" stroke-width="1.5"/>
      <line x1="2" y1="16" x2="6" y2="16" stroke="#ffd700" stroke-width="1.5"/>
      <line x1="26" y1="16" x2="30" y2="16" stroke="#ffd700" stroke-width="1.5"/>
    </svg>`;
  } else if (cond.includes("rain")) {
    return `<svg class="forecast-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20 Q6 20 6 18 Q6 16 8 16 Q10 14 12 14 Q14 12 16 12 Q18 12 20 14 Q22 14 24 16 Q26 16 26 18 Q26 20 24 20 L8 20 Z" fill="rgba(255,255,255,0.4)"/>
      <line x1="12" y1="22" x2="12" y2="26" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
      <line x1="16" y1="24" x2="16" y2="28" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="22" x2="20" y2="26" stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  } else if (cond.includes("snow")) {
    return `<svg class="forecast-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20 Q6 20 6 18 Q6 16 8 16 Q10 14 12 14 Q14 12 16 12 Q18 12 20 14 Q22 14 24 16 Q26 16 26 18 Q26 20 24 20 L8 20 Z" fill="rgba(255,255,255,0.5)"/>
      <line x1="16" y1="22" x2="16" y2="26" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="14" y1="24" x2="18" y2="24" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  } else {
    return `<svg class="forecast-icon" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 20 Q6 20 6 18 Q6 16 8 16 Q10 14 12 14 Q14 12 16 12 Q18 12 20 14 Q22 14 24 16 Q26 16 26 18 Q26 20 24 20 L8 20 Z" fill="rgba(255,255,255,0.4)"/>
      <path d="M6 18 Q4 18 4 16 Q4 14 6 14 Q8 12 10 12 Q12 10 14 10 Q16 10 18 12 Q20 12 22 14 Q24 14 24 16 Q24 18 22 18 L6 18 Z" fill="rgba(255,255,255,0.3)"/>
    </svg>`;
  }
}

async function loadWeather() {
  const city = (cityInput.value || "").trim();
  let days = parseInt(daysInput.value, 10);

  if (!city) {
    showNotice("Please enter a city name.");
    return;
  }
  if (Number.isNaN(days) || days < 1) days = 1;
  if (days > 7) days = 7;

  showLoader(true);
  try {
    // Current weather
    const currentUrl = `${API_BASE}/weather/${encodeURIComponent(city)}`;
    console.log("Current URL:", currentUrl);
    const curRes = await fetch(currentUrl);
    if (!curRes.ok) throw new Error(`Current failed: ${curRes.status}`);
    const currentData = await curRes.json();
    console.log("Current JSON:", currentData);

    // Handle both data structures: direct or nested in weatherResponse
    const weatherData = currentData.weatherResponse || currentData;
    const isDay = weatherData.isDay === 1 || weatherData.isDay === true;
    
    // Update header
    elCity.textContent = weatherData.city || "—";
    elRegion.textContent = weatherData.region || "—";
    localTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Update temperature
    const tempValue = weatherData.tempreature != null && weatherData.tempreature !== "" ? parseFloat(weatherData.tempreature) : null;
    updateTemperature(tempValue);
    
    // Update condition
    elCond.textContent = weatherData.condition || "—";
    
    // Update time info from API last_updated if provided (format: "YYYY-MM-DD HH:mm")
    let minutesAgo = 1;
    if (weatherData.last_updated) {
      const isoGuess = String(weatherData.last_updated).replace(' ', 'T');
      const last = new Date(isoGuess);
      if (!Number.isNaN(last.getTime())) {
        minutesAgo = Math.max(1, Math.floor((Date.now() - last.getTime()) / 60000));
      }
    } else {
      const updateTime = new Date();
      minutesAgo = Math.floor((Date.now() - updateTime.getTime()) / 60000) || 1;
    }
    elUpdated.textContent = `Updated ${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} ago`;
    
    // Update humidity
    const humidity = weatherData.humidity ? parseFloat(weatherData.humidity) : null;
    if (humidity !== null) {
      elHumidity.textContent = `${Math.round(humidity)}%`;
      humidityFill.style.width = `${humidity}%`;
    } else {
      elHumidity.textContent = "—";
      humidityFill.style.width = "0%";
    }
    
    // UI only: inject weather SVG into #weather-bg from weatherResponse.condition + isDay (0=night, 1=day)
    updateWeatherBackgroundAtmos(weatherData.condition || "", isDay);

    // Populate the explicit UI fields added to the HTML (feelslike, wind, precip)
    document.getElementById("feelslike").textContent =
      (weatherData && weatherData.feelslike_c != null && weatherData.feelslike_c !== '')
        ? Math.round(parseFloat(weatherData.feelslike_c)) + "°C"
        : "—";

    document.getElementById("wind").textContent =
      (weatherData && weatherData.windSpeed != null && weatherData.windSpeed !== '')
        ? weatherData.windSpeed + " km/h"
        : "—";

    document.getElementById("precip").textContent =
      (weatherData && weatherData.precip_mm != null && weatherData.precip_mm !== '')
        ? weatherData.precip_mm + " mm"
        : "—";

    // Forecast
    const forecastUrl = `${API_BASE}/weather/forecast?city=${encodeURIComponent(city)}&days=${encodeURIComponent(days)}`;
    console.log("Forecast URL:", forecastUrl);
    const fcRes = await fetch(forecastUrl);
    if (!fcRes.ok) throw new Error(`Forecast failed: ${fcRes.status}`);
    const forecastData = await fcRes.json();
    console.log("Forecast JSON:", forecastData);

    const arr = Array.isArray(forecastData.dayTemperature) ? forecastData.dayTemperature : [];
    forecastContainer.innerHTML = "";
    if (arr.length === 0) {
      const empty = document.createElement("div");
      empty.className = "forecast-card";
      empty.textContent = "No forecast data";
      forecastContainer.appendChild(empty);
    } else {
      // Update high/low temps from first forecast day
      if (arr.length > 0) {
        const firstDay = arr[0];
        const maxTemp = firstDay.maxTemp ? parseFloat(firstDay.maxTemp) : null;
        const minTemp = firstDay.minTemp ? parseFloat(firstDay.minTemp) : null;
        updateHighLowTemp(maxTemp, minTemp);
      }
      
      for (const d of arr) {
        const card = document.createElement("div");
        card.className = "forecast-card";
        const iconSVG = getForecastIconSVGAtmos(d.condition || "", d.isDay === 1 || d.isDay === true);
        const minTemp = d.minTemp ? formatTemp(parseFloat(d.minTemp)) : "—";
        const avgTemp = d.avgTemp ? formatTemp(parseFloat(d.avgTemp)) : "—";
        const maxTemp = d.maxTemp ? formatTemp(parseFloat(d.maxTemp)) : "—";
        
        card.innerHTML = `
          <div class="forecast-date">${formatDate(d.date)}</div>
          <div class="forecast-icon">${iconSVG}</div>
          <div class="forecast-temps">
            <div class="forecast-temp-item">
              <span>High</span>
              <span class="forecast-temp-value">${maxTemp}°</span>
            </div>
            <div class="forecast-temp-item">
              <span>Avg</span>
              <span class="forecast-temp-value">${avgTemp}°</span>
            </div>
            <div class="forecast-temp-item">
              <span>Low</span>
              <span class="forecast-temp-value">${minTemp}°</span>
            </div>
          </div>
        `;
        forecastContainer.appendChild(card);
      }
    }
  } catch (err) {
    console.error(err);
    showNotice(String(err.message || "Request failed"));
  } finally {
    showLoader(false);
  }
}

// Visual-only function: Updates #weather-visual based on #condition text and time
function updateWeatherVisual() {
  const weatherVisual = document.getElementById("weather-visual");
  if (!weatherVisual) return;
  
  const conditionText = (document.getElementById("condition")?.textContent || "").toLowerCase();
  const currentHour = new Date().getHours();
  const isDay = currentHour >= 6 && currentHour < 18;
  
  let svg = "";
  
  // Mapping logic as specified
  if ((conditionText.includes("sunny") || conditionText.includes("clear")) && isDay) {
    // Sunny Day: Animated SUN with rotating rays + glow
    svg = `
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px;">
        <defs>
          <radialGradient id="sunGradVisual" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#ffd700" stop-opacity="1"/>
            <stop offset="70%" stop-color="#ffaa00" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#ff8800" stop-opacity="0.5"/>
          </radialGradient>
          <filter id="sunGlow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <g transform="translate(80, 80)">
          <g class="sun-rays-rotate" style="animation: rotateRays 20s linear infinite; transform-origin: 0 0;">
            <line x1="0" y1="-60" x2="0" y2="-48" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.9" filter="url(#sunGlow)"/>
            <line x1="0" y1="60" x2="0" y2="48" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.9" filter="url(#sunGlow)"/>
            <line x1="-60" y1="0" x2="-48" y2="0" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.9" filter="url(#sunGlow)"/>
            <line x1="60" y1="0" x2="48" y2="0" stroke="#ffd700" stroke-width="3" stroke-linecap="round" opacity="0.9" filter="url(#sunGlow)"/>
            <line x1="-42" y1="-42" x2="-35" y2="-35" stroke="#ffd700" stroke-width="2.5" stroke-linecap="round" opacity="0.9" filter="url(#sunGlow)"/>
            <line x1="42" y1="42" x2="35" y2="35" stroke="#ffd700" stroke-width="2.5" stroke-linecap="round" opacity="0.9" filter="url(#sunGlow)"/>
            <line x1="-42" y1="42" x2="-35" y2="35" stroke="#ffd700" stroke-width="2.5" stroke-linecap="round" opacity="0.9" filter="url(#sunGlow)"/>
            <line x1="42" y1="-42" x2="35" y2="-35" stroke="#ffd700" stroke-width="2.5" stroke-linecap="round" opacity="0.9" filter="url(#sunGlow)"/>
          </g>
          <circle cx="0" cy="0" r="20" fill="url(#sunGradVisual)" filter="url(#sunGlow)" style="animation: sunPulseVisual 3s ease-in-out infinite;">
            <animate attributeName="opacity" values="1;0.9;1" dur="3s" repeatCount="indefinite"/>
          </circle>
        </g>
        <style>
          @keyframes rotateRays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes sunPulseVisual { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        </style>
      </svg>
    `;
  } else if (conditionText.includes("clear") && !isDay) {
    // Clear Night: Crescent MOON + twinkling stars
    svg = `
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px;">
        <defs>
          <radialGradient id="moonGradVisual" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#f0e68c" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="#d4af37" stop-opacity="0.7"/>
          </radialGradient>
        </defs>
        <path d="M80 50 Q68 50 68 62 Q68 74 80 74 Q92 74 92 62 Q92 50 80 50" fill="url(#moonGradVisual)" opacity="0.95">
          <animate attributeName="opacity" values="0.95;0.85;0.95" dur="4s" repeatCount="indefinite"/>
        </path>
        <circle cx="50" cy="45" r="2" fill="#ffffff" opacity="0.8">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
        </circle>
        <circle cx="110" cy="40" r="1.5" fill="#ffffff" opacity="0.7">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.3s" repeatCount="indefinite" begin="0.3s"/>
        </circle>
        <circle cx="45" cy="80" r="1.8" fill="#ffffff" opacity="0.9">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.1s" repeatCount="indefinite" begin="0.6s"/>
        </circle>
        <circle cx="115" cy="85" r="2" fill="#ffffff" opacity="0.8">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.2s" repeatCount="indefinite" begin="0.9s"/>
        </circle>
        <circle cx="130" cy="70" r="1.3" fill="#ffffff" opacity="0.6">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" repeatCount="indefinite" begin="1.2s"/>
        </circle>
      </svg>
    `;
  } else if (conditionText.includes("cloudy") || conditionText.includes("overcast")) {
    // Cloudy/Overcast: Drifting layered CLOUDS with parallax motion
    svg = `
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px;">
        <g transform="translate(80, 80)">
          <g class="cloud-drift-1" style="animation: cloudDrift1 15s ease-in-out infinite;">
            <path d="M-35 15 Q-42 15 -42 8 Q-42 0 -35 0 Q-28 -8 -20 -8 Q-12 -15 -5 -15 Q2 -15 10 -8 Q18 -8 25 0 Q32 0 32 8 Q32 15 25 15 L-35 15 Z" 
                  fill="rgba(255,255,255,0.45)" opacity="0.65"/>
          </g>
          <g class="cloud-drift-2" style="animation: cloudDrift2 18s ease-in-out infinite;">
            <path d="M-28 12 Q-34 12 -34 6 Q-34 0 -28 0 Q-22 -6 -15 -6 Q-8 -12 0 -12 Q8 -12 15 -6 Q22 -6 28 0 Q34 0 34 6 Q34 12 28 12 L-28 12 Z" 
                  fill="rgba(255,255,255,0.4)" opacity="0.55"/>
          </g>
          <g class="cloud-drift-3" style="animation: cloudDrift3 20s ease-in-out infinite;">
            <path d="M-25 10 Q-30 10 -30 5 Q-30 0 -25 0 Q-20 -5 -15 -5 Q-10 -10 -5 -10 Q0 -10 5 -5 Q10 -5 15 0 Q20 0 20 5 Q20 10 15 10 L-25 10 Z" 
                  fill="rgba(255,255,255,0.35)" opacity="0.5"/>
          </g>
        </g>
        <style>
          @keyframes cloudDrift1 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(8px); } }
          @keyframes cloudDrift2 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-6px); } }
          @keyframes cloudDrift3 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } }
        </style>
      </svg>
    `;
  } else if (conditionText.includes("partly cloudy")) {
    // Partly Cloudy: SUN partially hidden behind clouds
    svg = `
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px;">
        <defs>
          <radialGradient id="sunGradPartly" cx="50%" cy="50%">
            <stop offset="0%" stop-color="#ffd700" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#ffaa00" stop-opacity="0.6"/>
          </radialGradient>
        </defs>
        <circle cx="50" cy="70" r="18" fill="url(#sunGradPartly)" opacity="0.85"/>
        <g transform="translate(80, 80)">
          <path d="M-30 10 Q-38 10 -38 3 Q-38 -5 -30 -5 Q-22 -12 -15 -12 Q-8 -18 0 -18 Q8 -18 15 -12 Q22 -12 30 -5 Q38 -5 38 3 Q38 10 30 10 L-30 10 Z" 
                fill="rgba(255,255,255,0.5)" opacity="0.7"/>
        </g>
      </svg>
    `;
  } else if (conditionText.includes("rain") || conditionText.includes("drizzle")) {
    // Rain/Drizzle: CLOUDS + falling RAIN droplets (looped animation)
    svg = `
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px;">
        <g transform="translate(80, 60)">
          <path d="M-30 10 Q-38 10 -38 3 Q-38 -5 -30 -5 Q-22 -12 -15 -12 Q-8 -18 0 -18 Q8 -18 15 -12 Q22 -12 30 -5 Q38 -5 38 3 Q38 10 30 10 L-30 10 Z" 
                fill="rgba(255,255,255,0.45)" opacity="0.65"/>
        </g>
        <line x1="50" y1="80" x2="50" y2="100" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.85" style="animation: rainDrop1 1s linear infinite;">
          <animate attributeName="y2" values="80;100" dur="1s" repeatCount="indefinite"/>
        </line>
        <line x1="70" y1="85" x2="70" y2="105" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.85" style="animation: rainDrop2 1s linear infinite;">
          <animate attributeName="y2" values="85;105" dur="1s" repeatCount="indefinite" begin="0.2s"/>
        </line>
        <line x1="90" y1="80" x2="90" y2="100" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.85" style="animation: rainDrop3 1s linear infinite;">
          <animate attributeName="y2" values="80;100" dur="1s" repeatCount="indefinite" begin="0.4s"/>
        </line>
        <line x1="110" y1="85" x2="110" y2="105" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.85" style="animation: rainDrop4 1s linear infinite;">
          <animate attributeName="y2" values="85;105" dur="1s" repeatCount="indefinite" begin="0.6s"/>
        </line>
        <line x1="60" y1="90" x2="60" y2="110" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.85" style="animation: rainDrop5 1s linear infinite;">
          <animate attributeName="y2" values="90;110" dur="1s" repeatCount="indefinite" begin="0.1s"/>
        </line>
        <line x1="100" y1="90" x2="100" y2="110" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round" opacity="0.85" style="animation: rainDrop6 1s linear infinite;">
          <animate attributeName="y2" values="90;110" dur="1s" repeatCount="indefinite" begin="0.3s"/>
        </line>
      </svg>
    `;
  } else if (conditionText.includes("thunder") || conditionText.includes("thunderstorm")) {
    // Thunderstorm: Dark CLOUDS + intermittent LIGHTNING flash (every 3-6 seconds)
    svg = `
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px;">
        <g transform="translate(80, 60)">
          <path d="M-35 15 Q-42 15 -42 8 Q-42 0 -35 0 Q-28 -8 -20 -8 Q-12 -15 -5 -15 Q2 -15 10 -8 Q18 -8 25 0 Q32 0 32 8 Q32 15 25 15 L-35 15 Z" 
                fill="rgba(60,60,80,0.7)" opacity="0.75"/>
        </g>
        <path d="M70 70 L78 90 L75 90 L82 130 L68 100 L72 100 L65 70 Z" fill="#ffd700" opacity="0" style="animation: lightningFlash 4s ease-in-out infinite;">
          <animate attributeName="opacity" values="0;1;1;0;0;0;0;0" dur="4s" repeatCount="indefinite"/>
        </path>
        <line x1="55" y1="95" x2="55" y2="115" stroke="#4a5568" stroke-width="2" stroke-linecap="round" opacity="0.6" style="animation: rainDrop1 1s linear infinite;">
          <animate attributeName="y2" values="95;115" dur="1s" repeatCount="indefinite"/>
        </line>
        <line x1="75" y1="100" x2="75" y2="120" stroke="#4a5568" stroke-width="2" stroke-linecap="round" opacity="0.6" style="animation: rainDrop2 1s linear infinite;">
          <animate attributeName="y2" values="100;120" dur="1s" repeatCount="indefinite" begin="0.2s"/>
        </line>
        <line x1="95" y1="95" x2="95" y2="115" stroke="#4a5568" stroke-width="2" stroke-linecap="round" opacity="0.6" style="animation: rainDrop3 1s linear infinite;">
          <animate attributeName="y2" values="95;115" dur="1s" repeatCount="indefinite" begin="0.4s"/>
        </line>
        <line x1="105" y1="100" x2="105" y2="120" stroke="#4a5568" stroke-width="2" stroke-linecap="round" opacity="0.6" style="animation: rainDrop4 1s linear infinite;">
          <animate attributeName="y2" values="100;120" dur="1s" repeatCount="indefinite" begin="0.6s"/>
        </line>
        <style>
          @keyframes lightningFlash { 
            0%, 92%, 100% { opacity: 0; } 
            93%, 95% { opacity: 1; }
          }
        </style>
      </svg>
    `;
  } else if (conditionText.includes("snow")) {
    // Snow: CLOUDS + gently falling SNOWFLAKES
    svg = `
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px;">
        <g transform="translate(80, 60)">
          <path d="M-30 10 Q-38 10 -38 3 Q-38 -5 -30 -5 Q-22 -12 -15 -12 Q-8 -18 0 -18 Q8 -18 15 -12 Q22 -12 30 -5 Q38 -5 38 3 Q38 10 30 10 L-30 10 Z" 
                fill="rgba(255,255,255,0.55)" opacity="0.75"/>
        </g>
        <g transform="translate(60, 90)" style="animation: snowFall1 3s linear infinite;">
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="-4" y1="4" x2="4" y2="-4" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,70; 0,70" dur="3s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="3s" repeatCount="indefinite" additive="sum"/>
        </g>
        <g transform="translate(100, 85)" style="animation: snowFall2 3.5s linear infinite;">
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="-4" y1="4" x2="4" y2="-4" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,75; 0,75" dur="3.5s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="3.5s" repeatCount="indefinite" additive="sum"/>
        </g>
        <g transform="translate(80, 95)" style="animation: snowFall3 4s linear infinite;">
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="-4" y1="4" x2="4" y2="-4" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,65; 0,65" dur="4s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="4s" repeatCount="indefinite" additive="sum"/>
        </g>
        <g transform="translate(120, 88)" style="animation: snowFall4 3.2s linear infinite;">
          <line x1="0" y1="-6" x2="0" y2="6" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-6" y1="0" x2="6" y2="0" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          <line x1="-4" y1="4" x2="4" y2="-4" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/>
          <animateTransform attributeName="transform" type="translate" values="0,0; 0,72; 0,72" dur="3.2s" repeatCount="indefinite"/>
          <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="3.2s" repeatCount="indefinite" additive="sum"/>
        </g>
      </svg>
    `;
  } else if (conditionText.includes("mist") || conditionText.includes("fog") || conditionText.includes("haze")) {
    // Mist/Fog/Haze: Moving gradient FOG waves
    svg = `
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px;">
        <defs>
          <linearGradient id="fogGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.15)" stop-opacity="0"/>
            <stop offset="50%" stop-color="rgba(255,255,255,0.25)" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.15)" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="fogGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.2)" stop-opacity="0"/>
            <stop offset="50%" stop-color="rgba(255,255,255,0.3)" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0.2)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <rect x="0" y="70" width="160" height="25" fill="url(#fogGrad1)" opacity="0.5" style="animation: fogMove1 8s ease-in-out infinite;">
          <animateTransform attributeName="transform" type="translate" values="-10,0; 10,0; -10,0" dur="8s" repeatCount="indefinite"/>
        </rect>
        <rect x="0" y="95" width="160" height="20" fill="url(#fogGrad2)" opacity="0.4" style="animation: fogMove2 10s ease-in-out infinite;">
          <animateTransform attributeName="transform" type="translate" values="10,0; -10,0; 10,0" dur="10s" repeatCount="indefinite"/>
        </rect>
        <rect x="0" y="115" width="160" height="18" fill="url(#fogGrad1)" opacity="0.3" style="animation: fogMove3 9s ease-in-out infinite;">
          <animateTransform attributeName="transform" type="translate" values="-8,0; 8,0; -8,0" dur="9s" repeatCount="indefinite"/>
        </rect>
      </svg>
    `;
  } else {
    // Default: Simple cloud
    svg = `
      <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" style="width: 140px; height: 140px;">
        <g transform="translate(80, 80)">
          <path d="M-30 10 Q-38 10 -38 3 Q-38 -5 -30 -5 Q-22 -12 -15 -12 Q-8 -18 0 -18 Q8 -18 15 -12 Q22 -12 30 -5 Q38 -5 38 3 Q38 10 30 10 L-30 10 Z" 
                fill="rgba(255,255,255,0.4)" opacity="0.6"/>
        </g>
      </svg>
    `;
  }
  
  weatherVisual.innerHTML = svg;
}

// Visual-only function: Updates #weather-bg behind temperature based on condition + isDay
function updateWeatherBackground(condition, isDay) {
  const weatherBg = document.getElementById("weather-bg");
  if (!weatherBg) return;
  
  const conditionText = (condition || "").toLowerCase();
  const isDayMode = isDay === true || isDay === "true";
  
  let svg = "";
  
  if (isDayMode) {
    // DAY MODE
    if (conditionText.includes("sunny") || conditionText.includes("clear")) {
      // Sunny/Clear Day: Glowing SUN with soft animated rays
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.25;">
          <defs>
            <radialGradient id="sunBgGrad" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#ffd700" stop-opacity="0.6"/>
              <stop offset="50%" stop-color="#ffaa00" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#ff8800" stop-opacity="0.1"/>
            </radialGradient>
            <filter id="sunBgGlow">
              <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g transform="translate(100, 100)">
            <g style="animation: rotateRaysBg 25s linear infinite; transform-origin: 0 0;">
              <line x1="0" y1="-70" x2="0" y2="-55" stroke="#ffd700" stroke-width="2" stroke-linecap="round" opacity="0.4" filter="url(#sunBgGlow)"/>
              <line x1="0" y1="70" x2="0" y2="55" stroke="#ffd700" stroke-width="2" stroke-linecap="round" opacity="0.4" filter="url(#sunBgGlow)"/>
              <line x1="-70" y1="0" x2="-55" y2="0" stroke="#ffd700" stroke-width="2" stroke-linecap="round" opacity="0.4" filter="url(#sunBgGlow)"/>
              <line x1="70" y1="0" x2="55" y2="0" stroke="#ffd700" stroke-width="2" stroke-linecap="round" opacity="0.4" filter="url(#sunBgGlow)"/>
              <line x1="-50" y1="-50" x2="-40" y2="-40" stroke="#ffd700" stroke-width="1.5" stroke-linecap="round" opacity="0.4" filter="url(#sunBgGlow)"/>
              <line x1="50" y1="50" x2="40" y2="40" stroke="#ffd700" stroke-width="1.5" stroke-linecap="round" opacity="0.4" filter="url(#sunBgGlow)"/>
              <line x1="-50" y1="50" x2="-40" y2="40" stroke="#ffd700" stroke-width="1.5" stroke-linecap="round" opacity="0.4" filter="url(#sunBgGlow)"/>
              <line x1="50" y1="-50" x2="40" y2="-40" stroke="#ffd700" stroke-width="1.5" stroke-linecap="round" opacity="0.4" filter="url(#sunBgGlow)"/>
            </g>
            <circle cx="0" cy="0" r="35" fill="url(#sunBgGrad)" filter="url(#sunBgGlow)" style="animation: sunPulseBg 4s ease-in-out infinite;">
              <animate attributeName="opacity" values="0.3;0.4;0.3" dur="4s" repeatCount="indefinite"/>
            </circle>
          </g>
          <style>
            @keyframes rotateRaysBg { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes sunPulseBg { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
          </style>
        </svg>
      `;
    } else if (conditionText.includes("cloudy") || conditionText.includes("overcast")) {
      // Cloudy/Overcast Day: Layered drifting CLOUDS
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.2;">
          <g transform="translate(100, 100)">
            <g style="animation: cloudDriftBg1 20s ease-in-out infinite;">
              <path d="M-50 25 Q-60 25 -60 15 Q-60 5 -50 5 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                    fill="rgba(255,255,255,0.6)" opacity="0.5"/>
            </g>
            <g style="animation: cloudDriftBg2 25s ease-in-out infinite;">
              <path d="M-40 20 Q-48 20 -48 12 Q-48 4 -40 4 Q-32 -8 -24 -8 Q-16 -16 -8 -16 Q0 -16 8 -8 Q16 -8 24 0 Q32 0 32 8 Q32 16 24 16 L-40 16 Z" 
                    fill="rgba(255,255,255,0.5)" opacity="0.4"/>
            </g>
            <g style="animation: cloudDriftBg3 30s ease-in-out infinite;">
              <path d="M-35 15 Q-42 15 -42 8 Q-42 0 -35 0 Q-28 -6 -21 -6 Q-14 -12 -7 -12 Q0 -12 7 -6 Q14 -6 21 0 Q28 0 28 7 Q28 15 21 15 L-35 15 Z" 
                    fill="rgba(255,255,255,0.4)" opacity="0.35"/>
            </g>
          </g>
          <style>
            @keyframes cloudDriftBg1 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } }
            @keyframes cloudDriftBg2 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-8px); } }
            @keyframes cloudDriftBg3 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(12px); } }
          </style>
        </svg>
      `;
    } else if (conditionText.includes("partly cloudy")) {
      // Partly Cloudy Day: SUN partially hidden behind clouds
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.22;">
          <defs>
            <radialGradient id="sunPartlyBg" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#ffd700" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="#ffaa00" stop-opacity="0.2"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="80" r="30" fill="url(#sunPartlyBg)" opacity="0.6"/>
          <g transform="translate(100, 100)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(255,255,255,0.5)" opacity="0.5"/>
          </g>
        </svg>
      `;
    } else if (conditionText.includes("rain") || conditionText.includes("drizzle")) {
      // Rain/Drizzle Day: CLOUDS + animated RAIN drops
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.2;">
          <g transform="translate(100, 80)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(255,255,255,0.5)" opacity="0.5"/>
          </g>
          <line x1="70" y1="100" x2="70" y2="130" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.4" style="animation: rainDropBg1 1.2s linear infinite;">
            <animate attributeName="y2" values="100;130" dur="1.2s" repeatCount="indefinite"/>
          </line>
          <line x1="90" y1="105" x2="90" y2="135" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.4" style="animation: rainDropBg2 1.2s linear infinite;">
            <animate attributeName="y2" values="105;135" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
          </line>
          <line x1="110" y1="100" x2="110" y2="130" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.4" style="animation: rainDropBg3 1.2s linear infinite;">
            <animate attributeName="y2" values="100;130" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
          </line>
          <line x1="130" y1="105" x2="130" y2="135" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" opacity="0.4" style="animation: rainDropBg4 1.2s linear infinite;">
            <animate attributeName="y2" values="105;135" dur="1.2s" repeatCount="indefinite" begin="0.9s"/>
          </line>
        </svg>
      `;
    } else if (conditionText.includes("thunder") || conditionText.includes("thunderstorm")) {
      // Thunderstorm Day: Dark CLOUDS + occasional LIGHTNING flash
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.25;">
          <g transform="translate(100, 80)">
            <path d="M-50 20 Q-60 20 -60 10 Q-60 0 -50 0 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                  fill="rgba(60,60,80,0.7)" opacity="0.6"/>
          </g>
          <path d="M85 90 L92 110 L88 110 L94 150 L82 120 L86 120 L80 90 Z" fill="#ffd700" opacity="0" style="animation: lightningFlashBg 5s ease-in-out infinite;">
            <animate attributeName="opacity" values="0;0.6;0.6;0;0;0;0;0;0" dur="5s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
    } else if (conditionText.includes("snow")) {
      // Snow Day: CLOUDS + gently falling SNOW
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.2;">
          <g transform="translate(100, 80)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(255,255,255,0.6)" opacity="0.5"/>
          </g>
          <g transform="translate(80, 100)" style="animation: snowFallBg1 4s linear infinite;">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,100; 0,100" dur="4s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="4s" repeatCount="indefinite" additive="sum"/>
          </g>
          <g transform="translate(120, 95)" style="animation: snowFallBg2 4.5s linear infinite;">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.6"/>
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,105; 0,105" dur="4.5s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="4.5s" repeatCount="indefinite" additive="sum"/>
          </g>
        </svg>
      `;
    } else if (conditionText.includes("mist") || conditionText.includes("fog") || conditionText.includes("haze")) {
      // Mist/Fog/Haze Day: Soft animated FOG waves
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.15;">
          <defs>
            <linearGradient id="fogGradDay1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.2)" stop-opacity="0"/>
              <stop offset="50%" stop-color="rgba(255,255,255,0.3)" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="rgba(255,255,255,0.2)" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="fogGradDay2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(255,255,255,0.25)" stop-opacity="0"/>
              <stop offset="50%" stop-color="rgba(255,255,255,0.35)" stop-opacity="0.5"/>
              <stop offset="100%" stop-color="rgba(255,255,255,0.25)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0" y="80" width="200" height="30" fill="url(#fogGradDay1)" opacity="0.4">
            <animateTransform attributeName="transform" type="translate" values="-15,0; 15,0; -15,0" dur="10s" repeatCount="indefinite"/>
          </rect>
          <rect x="0" y="110" width="200" height="25" fill="url(#fogGradDay2)" opacity="0.35">
            <animateTransform attributeName="transform" type="translate" values="15,0; -15,0; 15,0" dur="12s" repeatCount="indefinite"/>
          </rect>
        </svg>
      `;
    } else {
      // Default Day: Simple cloud
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.18;">
          <g transform="translate(100, 100)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(255,255,255,0.4)" opacity="0.5"/>
          </g>
        </svg>
      `;
    }
  } else {
    // NIGHT MODE
    if (conditionText.includes("clear") || conditionText.includes("sunny")) {
      // Clear/Sunny Night: CRESCENT MOON + faint twinkling stars
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.2;">
          <defs>
            <radialGradient id="moonBgGrad" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#f0e68c" stop-opacity="0.7"/>
              <stop offset="100%" stop-color="#d4af37" stop-opacity="0.4"/>
            </radialGradient>
          </defs>
          <path d="M100 60 Q88 60 88 72 Q88 84 100 84 Q112 84 112 72 Q112 60 100 60" fill="url(#moonBgGrad)" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.7;0.8" dur="5s" repeatCount="indefinite"/>
          </path>
          <circle cx="60" cy="50" r="1.5" fill="#ffffff" opacity="0.6">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="140" cy="45" r="1.2" fill="#ffffff" opacity="0.5">
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
          </circle>
          <circle cx="50" cy="100" r="1.4" fill="#ffffff" opacity="0.7">
            <animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.3s" repeatCount="indefinite" begin="1s"/>
          </circle>
          <circle cx="150" cy="110" r="1.5" fill="#ffffff" opacity="0.6">
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur="2.6s" repeatCount="indefinite" begin="1.5s"/>
          </circle>
        </svg>
      `;
    } else if (conditionText.includes("cloudy")) {
      // Cloudy Night: Dark clouds drifting slowly with subtle moon glow
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.18;">
          <defs>
            <radialGradient id="moonGlowBg" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#f0e68c" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#d4af37" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="70" r="25" fill="url(#moonGlowBg)" opacity="0.4"/>
          <g transform="translate(100, 100)">
            <g style="animation: cloudDriftNight1 22s ease-in-out infinite;">
              <path d="M-50 25 Q-60 25 -60 15 Q-60 5 -50 5 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                    fill="rgba(60,60,80,0.6)" opacity="0.5"/>
            </g>
            <g style="animation: cloudDriftNight2 28s ease-in-out infinite;">
              <path d="M-40 20 Q-48 20 -48 12 Q-48 4 -40 4 Q-32 -8 -24 -8 Q-16 -16 -8 -16 Q0 -16 8 -8 Q16 -8 24 0 Q32 0 32 8 Q32 16 24 16 L-40 16 Z" 
                    fill="rgba(60,60,80,0.5)" opacity="0.4"/>
            </g>
          </g>
          <style>
            @keyframes cloudDriftNight1 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(8px); } }
            @keyframes cloudDriftNight2 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-10px); } }
          </style>
        </svg>
      `;
    } else if (conditionText.includes("rain") || conditionText.includes("drizzle")) {
      // Rain Night: Dark clouds + rain drops with slight glow
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.2;">
          <g transform="translate(100, 80)">
            <path d="M-50 20 Q-60 20 -60 10 Q-60 0 -50 0 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                  fill="rgba(60,60,80,0.7)" opacity="0.6"/>
          </g>
          <line x1="70" y1="100" x2="70" y2="130" stroke="#818cf8" stroke-width="2" stroke-linecap="round" opacity="0.5" style="animation: rainDropNight1 1.2s linear infinite;">
            <animate attributeName="y2" values="100;130" dur="1.2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.2s" repeatCount="indefinite"/>
          </line>
          <line x1="90" y1="105" x2="90" y2="135" stroke="#818cf8" stroke-width="2" stroke-linecap="round" opacity="0.5" style="animation: rainDropNight2 1.2s linear infinite;">
            <animate attributeName="y2" values="105;135" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.2s" repeatCount="indefinite" begin="0.3s"/>
          </line>
          <line x1="110" y1="100" x2="110" y2="130" stroke="#818cf8" stroke-width="2" stroke-linecap="round" opacity="0.5" style="animation: rainDropNight3 1.2s linear infinite;">
            <animate attributeName="y2" values="100;130" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.2s" repeatCount="indefinite" begin="0.6s"/>
          </line>
          <line x1="130" y1="105" x2="130" y2="135" stroke="#818cf8" stroke-width="2" stroke-linecap="round" opacity="0.5" style="animation: rainDropNight4 1.2s linear infinite;">
            <animate attributeName="y2" values="105;135" dur="1.2s" repeatCount="indefinite" begin="0.9s"/>
            <animate attributeName="opacity" values="0.3;0.6;0.3" dur="1.2s" repeatCount="indefinite" begin="0.9s"/>
          </line>
        </svg>
      `;
    } else if (conditionText.includes("thunder") || conditionText.includes("thunderstorm")) {
      // Thunder Night: Dark storm clouds + lightning flashes
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.22;">
          <g transform="translate(100, 80)">
            <path d="M-50 20 Q-60 20 -60 10 Q-60 0 -50 0 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                  fill="rgba(40,40,60,0.8)" opacity="0.7"/>
          </g>
          <path d="M85 90 L92 110 L88 110 L94 150 L82 120 L86 120 L80 90 Z" fill="#ffd700" opacity="0" style="animation: lightningFlashNight 5s ease-in-out infinite;">
            <animate attributeName="opacity" values="0;0.7;0.7;0;0;0;0;0;0" dur="5s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
    } else if (conditionText.includes("snow")) {
      // Snow Night: Dark sky + drifting snowflakes
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.18;">
          <g transform="translate(80, 100)" style="animation: snowFallNight1 4.5s linear infinite;">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,100; 0,100" dur="4.5s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="4.5s" repeatCount="indefinite" additive="sum"/>
          </g>
          <g transform="translate(120, 95)" style="animation: snowFallNight2 5s linear infinite;">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,105; 0,105" dur="5s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="5s" repeatCount="indefinite" additive="sum"/>
          </g>
          <g transform="translate(100, 105)" style="animation: snowFallNight3 4.8s linear infinite;">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" opacity="0.5"/>
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,95; 0,95" dur="4.8s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="4.8s" repeatCount="indefinite" additive="sum"/>
          </g>
        </svg>
      `;
    } else if (conditionText.includes("mist") || conditionText.includes("fog")) {
      // Mist/Fog Night: Night fog gradient waves
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.12;">
          <defs>
            <linearGradient id="fogGradNight1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(200,200,220,0.15)" stop-opacity="0"/>
              <stop offset="50%" stop-color="rgba(200,200,220,0.25)" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="rgba(200,200,220,0.15)" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="fogGradNight2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(180,180,200,0.2)" stop-opacity="0"/>
              <stop offset="50%" stop-color="rgba(180,180,200,0.3)" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="rgba(180,180,200,0.2)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0" y="80" width="200" height="30" fill="url(#fogGradNight1)" opacity="0.3">
            <animateTransform attributeName="transform" type="translate" values="-12,0; 12,0; -12,0" dur="11s" repeatCount="indefinite"/>
          </rect>
          <rect x="0" y="110" width="200" height="25" fill="url(#fogGradNight2)" opacity="0.25">
            <animateTransform attributeName="transform" type="translate" values="12,0; -12,0; 12,0" dur="13s" repeatCount="indefinite"/>
          </rect>
        </svg>
      `;
    } else {
      // Default Night: Simple dark cloud
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width: 200px; height: 200px; opacity: 0.15;">
          <g transform="translate(100, 100)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(60,60,80,0.5)" opacity="0.4"/>
          </g>
        </svg>
      `;
    }
  }
  
  // Smooth fade when icon changes
  weatherBg.style.opacity = "0";
  requestAnimationFrame(() => {
    weatherBg.innerHTML = svg;
    requestAnimationFrame(() => {
      weatherBg.style.opacity = "";
    });
  });
}

// Temperature conversion (UI only)
function celsiusToFahrenheit(c) {
  return Math.round((c * 9/5) + 32);
}

function fahrenheitToCelsius(f) {
  return Math.round((f - 32) * 5/9);
}

function formatTemp(temp) {
  if (temp === null || isNaN(temp)) return "—";
  if (currentUnit === "F") {
    return celsiusToFahrenheit(temp);
  }
  return Math.round(temp);
}

function updateTemperature(temp) {
  if (temp === null || isNaN(temp)) {
    elTemp.textContent = "--";
    return;
  }
  const displayTemp = currentUnit === "F" ? celsiusToFahrenheit(temp) : Math.round(temp);
  elTemp.textContent = displayTemp;
}

function updateHighLowTemp(high, low) {
  if (high !== null && !isNaN(high)) {
    highTemp.textContent = formatTemp(high);
  } else {
    highTemp.textContent = "—";
  }
  if (low !== null && !isNaN(low)) {
    lowTemp.textContent = formatTemp(low);
  } else {
    lowTemp.textContent = "—";
  }
}

// Update info cards with data
function updateInfoCards(weatherData) {
  // Visibility (placeholder - API might not provide)
  const visibility = weatherData.visibility || null;
  if (visibility !== null) {
    visibilityValue.textContent = `${visibility} km`;
    const visibilityPercent = Math.min((visibility / 20) * 100, 100);
    visibilityFill.style.width = `${visibilityPercent}%`;
  } else {
    visibilityValue.textContent = "—";
    visibilityFill.style.width = "0%";
  }
  
  // Pressure (placeholder)
  const pressure = weatherData.pressure || null;
  if (pressure !== null) {
    pressureValue.textContent = `${pressure} hPa`;
    const pressurePercent = Math.max(0, Math.min(100, ((pressure - 980) / 60) * 100));
    pressureIndicator.style.left = `${pressurePercent}%`;
  } else {
    pressureValue.textContent = "—";
    pressureIndicator.style.left = "50%";
  }
  
  // UV Index (placeholder)
  const uv = weatherData.uvIndex || weatherData.uv || null;
  if (uv !== null) {
    uvIndex.textContent = uv;
    const uvPercent = Math.min((uv / 11) * 100, 100);
    const uvOffset = 125 - (uvPercent / 100 * 125);
    uvFill.style.strokeDashoffset = uvOffset;
    
    // Color based on UV level
    if (uv <= 2) uvFill.style.stroke = "#4CAF50";
    else if (uv <= 5) uvFill.style.stroke = "#FFC107";
    else if (uv <= 7) uvFill.style.stroke = "#FF9800";
    else uvFill.style.stroke = "#F44336";
  } else {
    uvIndex.textContent = "—";
    uvFill.style.strokeDashoffset = "125";
  }
  
  // AQI (placeholder)
  const aqi = weatherData.aqi || null;
  if (aqi !== null) {
    aqiValue.textContent = aqi;
    const aqiPercent = Math.min((aqi / 300) * 100, 100);
    const aqiOffset = 251 - (aqiPercent / 100 * 251);
    aqiFill.style.strokeDashoffset = aqiOffset;
    
    // Color based on AQI
    if (aqi <= 50) aqiFill.style.stroke = "#4CAF50";
    else if (aqi <= 100) aqiFill.style.stroke = "#FFC107";
    else if (aqi <= 150) aqiFill.style.stroke = "#FF9800";
    else aqiFill.style.stroke = "#F44336";
  } else {
    aqiValue.textContent = "—";
    aqiFill.style.strokeDashoffset = "251";
  }
}

// UI only: reads weatherResponse.condition + weatherResponse.isDay, injects correct SVG into #weather-bg
function updateWeatherBackgroundAtmos(condition, isDay) {
  const weatherBg = document.getElementById("weather-bg");
  if (!weatherBg) return;
  const conditionText = (condition || "").toLowerCase();
  let svg = "";

  // Dynamic background: set data-weather for CSS
  var bgKey = "default";
  if (!isDay) bgKey = "night";
  else if (conditionText.includes("sunny") || conditionText.includes("clear")) bgKey = "sunny";
  else if (conditionText.includes("cloudy") || conditionText.includes("overcast")) bgKey = "cloudy";
  else if (conditionText.includes("rain") || conditionText.includes("drizzle")) bgKey = "rain";
  else if (conditionText.includes("thunder")) bgKey = "thunder";
  else if (conditionText.includes("snow")) bgKey = "snow";
  else if (conditionText.includes("mist") || conditionText.includes("fog") || conditionText.includes("haze")) bgKey = "mist";
  document.body.setAttribute("data-weather", bgKey);

  if (isDay) {
    // DAY MODE
    if (conditionText.includes("sunny") || conditionText.includes("clear")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sunAtmosGrad" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#FFD700" stop-opacity="0.4"/>
              <stop offset="70%" stop-color="#FFA500" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#FF8C00" stop-opacity="0.1"/>
            </radialGradient>
          </defs>
          <g transform="translate(100, 100)">
            <g style="animation: rotateSunAtmos 20s linear infinite; transform-origin: 0 0;">
              <line x1="0" y1="-70" x2="0" y2="-55" stroke="#FFD700" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
              <line x1="0" y1="70" x2="0" y2="55" stroke="#FFD700" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
              <line x1="-70" y1="0" x2="-55" y2="0" stroke="#FFD700" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
              <line x1="70" y1="0" x2="55" y2="0" stroke="#FFD700" stroke-width="2.5" stroke-linecap="round" opacity="0.3"/>
              <line x1="-50" y1="-50" x2="-40" y2="-40" stroke="#FFD700" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
              <line x1="50" y1="50" x2="40" y2="40" stroke="#FFD700" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
              <line x1="-50" y1="50" x2="-40" y2="40" stroke="#FFD700" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
              <line x1="50" y1="-50" x2="40" y2="-40" stroke="#FFD700" stroke-width="2" stroke-linecap="round" opacity="0.3"/>
            </g>
            <circle cx="0" cy="0" r="35" fill="url(#sunAtmosGrad)" style="animation: pulseSunAtmos 3s ease-in-out infinite;">
              <animate attributeName="opacity" values="0.3;0.4;0.3" dur="3s" repeatCount="indefinite"/>
            </circle>
          </g>
          <style>
            @keyframes rotateSunAtmos { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            @keyframes pulseSunAtmos { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
          </style>
        </svg>
      `;
    } else if (conditionText.includes("cloudy") || conditionText.includes("overcast")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(100, 100)">
            <g style="animation: cloudDriftAtmos1 18s ease-in-out infinite;">
              <path d="M-50 25 Q-60 25 -60 15 Q-60 5 -50 5 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                    fill="rgba(200,200,200,0.3)" opacity="0.4"/>
            </g>
            <g style="animation: cloudDriftAtmos2 22s ease-in-out infinite;">
              <path d="M-40 20 Q-48 20 -48 12 Q-48 4 -40 4 Q-32 -8 -24 -8 Q-16 -16 -8 -16 Q0 -16 8 -8 Q16 -8 24 0 Q32 0 32 8 Q32 16 24 16 L-40 16 Z" 
                    fill="rgba(200,200,200,0.25)" opacity="0.35"/>
            </g>
            <g style="animation: cloudDriftAtmos3 25s ease-in-out infinite;">
              <path d="M-35 15 Q-42 15 -42 8 Q-42 0 -35 0 Q-28 -6 -21 -6 Q-14 -12 -7 -12 Q0 -12 7 -6 Q14 -6 21 0 Q28 0 28 7 Q28 15 21 15 L-35 15 Z" 
                    fill="rgba(200,200,200,0.2)" opacity="0.3"/>
            </g>
          </g>
          <style>
            @keyframes cloudDriftAtmos1 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(8px); } }
            @keyframes cloudDriftAtmos2 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-6px); } }
            @keyframes cloudDriftAtmos3 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(10px); } }
          </style>
        </svg>
      `;
    } else if (conditionText.includes("partly cloudy")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sunPartlyAtmos" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#FFD700" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#FFA500" stop-opacity="0.15"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="80" r="30" fill="url(#sunPartlyAtmos)" opacity="0.5"/>
          <g transform="translate(100, 100)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(200,200,200,0.3)" opacity="0.4"/>
          </g>
        </svg>
      `;
    } else if (conditionText.includes("rain") || conditionText.includes("drizzle")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(100, 80)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(200,200,200,0.3)" opacity="0.4"/>
          </g>
          <line x1="70" y1="100" x2="70" y2="130" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" opacity="0.3" style="animation: rainAtmos1 1s linear infinite;">
            <animate attributeName="y2" values="100;130" dur="1s" repeatCount="indefinite"/>
          </line>
          <line x1="90" y1="105" x2="90" y2="135" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" opacity="0.3" style="animation: rainAtmos2 1s linear infinite;">
            <animate attributeName="y2" values="105;135" dur="1s" repeatCount="indefinite" begin="0.2s"/>
          </line>
          <line x1="110" y1="100" x2="110" y2="130" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" opacity="0.3" style="animation: rainAtmos3 1s linear infinite;">
            <animate attributeName="y2" values="100;130" dur="1s" repeatCount="indefinite" begin="0.4s"/>
          </line>
          <line x1="130" y1="105" x2="130" y2="135" stroke="#60A5FA" stroke-width="2" stroke-linecap="round" opacity="0.3" style="animation: rainAtmos4 1s linear infinite;">
            <animate attributeName="y2" values="105;135" dur="1s" repeatCount="indefinite" begin="0.6s"/>
          </line>
        </svg>
      `;
    } else if (conditionText.includes("thunder") || conditionText.includes("thunderstorm")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(100, 80)">
            <path d="M-50 20 Q-60 20 -60 10 Q-60 0 -50 0 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                  fill="rgba(100,100,120,0.4)" opacity="0.5"/>
          </g>
          <path d="M85 90 L92 110 L88 110 L94 150 L82 120 L86 120 L80 90 Z" fill="#FFD700" opacity="0" style="animation: lightningAtmos 4s ease-in-out infinite;">
            <animate attributeName="opacity" values="0;0.5;0.5;0;0;0;0;0" dur="4s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
    } else if (conditionText.includes("snow")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(100, 80)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(220,220,220,0.35)" opacity="0.4"/>
          </g>
          <g transform="translate(80, 100)" style="animation: snowAtmos1 3s linear infinite;">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,100; 0,100" dur="3s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="3s" repeatCount="indefinite" additive="sum"/>
          </g>
          <g transform="translate(120, 95)" style="animation: snowAtmos2 3.5s linear infinite;">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,105; 0,105" dur="3.5s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="3.5s" repeatCount="indefinite" additive="sum"/>
          </g>
        </svg>
      `;
    } else if (conditionText.includes("mist") || conditionText.includes("fog") || conditionText.includes("haze")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fogAtmos1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(200,200,200,0.15)" stop-opacity="0"/>
              <stop offset="50%" stop-color="rgba(200,200,200,0.25)" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="rgba(200,200,200,0.15)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0" y="80" width="200" height="30" fill="url(#fogAtmos1)" opacity="0.3">
            <animateTransform attributeName="transform" type="translate" values="-10,0; 10,0; -10,0" dur="10s" repeatCount="indefinite"/>
          </rect>
          <rect x="0" y="110" width="200" height="25" fill="url(#fogAtmos1)" opacity="0.25">
            <animateTransform attributeName="transform" type="translate" values="10,0; -10,0; 10,0" dur="12s" repeatCount="indefinite"/>
          </rect>
        </svg>
      `;
    } else {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(100, 100)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(200,200,200,0.2)" opacity="0.3"/>
          </g>
        </svg>
      `;
    }
  } else {
    // NIGHT MODE
    if (conditionText.includes("clear") || conditionText.includes("sunny")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="moonAtmosGrad" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#F0E68C" stop-opacity="0.3"/>
              <stop offset="100%" stop-color="#D4AF37" stop-opacity="0.15"/>
            </radialGradient>
          </defs>
          <path d="M100 60 Q88 60 88 72 Q88 84 100 84 Q112 84 112 72 Q112 60 100 60" fill="url(#moonAtmosGrad)" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.5;0.6" dur="5s" repeatCount="indefinite"/>
          </path>
          <circle cx="60" cy="50" r="1.5" fill="#FFFFFF" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <circle cx="140" cy="45" r="1.2" fill="#FFFFFF" opacity="0.35">
            <animate attributeName="opacity" values="0.2;0.5;0.2" dur="2.8s" repeatCount="indefinite" begin="0.5s"/>
          </circle>
          <circle cx="50" cy="100" r="1.4" fill="#FFFFFF" opacity="0.45">
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.3s" repeatCount="indefinite" begin="1s"/>
          </circle>
          <circle cx="150" cy="110" r="1.5" fill="#FFFFFF" opacity="0.4">
            <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.6s" repeatCount="indefinite" begin="1.5s"/>
          </circle>
        </svg>
      `;
    } else if (conditionText.includes("cloudy")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="moonGlowAtmos" cx="50%" cy="50%">
              <stop offset="0%" stop-color="#F0E68C" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="#D4AF37" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="70" r="25" fill="url(#moonGlowAtmos)" opacity="0.3"/>
          <g transform="translate(100, 100)">
            <g style="animation: cloudNightAtmos1 20s ease-in-out infinite;">
              <path d="M-50 25 Q-60 25 -60 15 Q-60 5 -50 5 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                    fill="rgba(100,100,120,0.3)" opacity="0.4"/>
            </g>
            <g style="animation: cloudNightAtmos2 25s ease-in-out infinite;">
              <path d="M-40 20 Q-48 20 -48 12 Q-48 4 -40 4 Q-32 -8 -24 -8 Q-16 -16 -8 -16 Q0 -16 8 -8 Q16 -8 24 0 Q32 0 32 8 Q32 16 24 16 L-40 16 Z" 
                    fill="rgba(100,100,120,0.25)" opacity="0.35"/>
            </g>
          </g>
          <style>
            @keyframes cloudNightAtmos1 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(6px); } }
            @keyframes cloudNightAtmos2 { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-8px); } }
          </style>
        </svg>
      `;
    } else if (conditionText.includes("rain") || conditionText.includes("drizzle")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(100, 80)">
            <path d="M-50 20 Q-60 20 -60 10 Q-60 0 -50 0 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                  fill="rgba(80,80,100,0.4)" opacity="0.5"/>
          </g>
          <line x1="70" y1="100" x2="70" y2="130" stroke="#818CF8" stroke-width="2" stroke-linecap="round" opacity="0.3" style="animation: rainNightAtmos1 1s linear infinite;">
            <animate attributeName="y2" values="100;130" dur="1s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="1s" repeatCount="indefinite"/>
          </line>
          <line x1="90" y1="105" x2="90" y2="135" stroke="#818CF8" stroke-width="2" stroke-linecap="round" opacity="0.3" style="animation: rainNightAtmos2 1s linear infinite;">
            <animate attributeName="y2" values="105;135" dur="1s" repeatCount="indefinite" begin="0.3s"/>
            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="1s" repeatCount="indefinite" begin="0.3s"/>
          </line>
          <line x1="110" y1="100" x2="110" y2="130" stroke="#818CF8" stroke-width="2" stroke-linecap="round" opacity="0.3" style="animation: rainNightAtmos3 1s linear infinite;">
            <animate attributeName="y2" values="100;130" dur="1s" repeatCount="indefinite" begin="0.6s"/>
            <animate attributeName="opacity" values="0.2;0.4;0.2" dur="1s" repeatCount="indefinite" begin="0.6s"/>
          </line>
        </svg>
      `;
    } else if (conditionText.includes("thunder") || conditionText.includes("thunderstorm")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(100, 80)">
            <path d="M-50 20 Q-60 20 -60 10 Q-60 0 -50 0 Q-40 -10 -30 -10 Q-20 -20 -10 -20 Q0 -20 10 -10 Q20 -10 30 0 Q40 0 40 10 Q40 20 30 20 L-50 20 Z" 
                  fill="rgba(60,60,80,0.5)" opacity="0.6"/>
          </g>
          <path d="M85 90 L92 110 L88 110 L94 150 L82 120 L86 120 L80 90 Z" fill="#FFD700" opacity="0" style="animation: lightningNightAtmos 4s ease-in-out infinite;">
            <animate attributeName="opacity" values="0;0.6;0.6;0;0;0;0;0" dur="4s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
    } else if (conditionText.includes("snow")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(80, 100)" style="animation: snowNightAtmos1 4s linear infinite;">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,100; 0,100" dur="4s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="4s" repeatCount="indefinite" additive="sum"/>
          </g>
          <g transform="translate(120, 95)" style="animation: snowNightAtmos2 4.5s linear infinite;">
            <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
            <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.3"/>
            <animateTransform attributeName="transform" type="translate" values="0,0; 0,105; 0,105" dur="4.5s" repeatCount="indefinite"/>
            <animateTransform attributeName="transform" type="rotate" values="0; 360" dur="4.5s" repeatCount="indefinite" additive="sum"/>
          </g>
        </svg>
      `;
    } else if (conditionText.includes("mist") || conditionText.includes("fog")) {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="fogNightAtmos" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="rgba(150,150,170,0.1)" stop-opacity="0"/>
              <stop offset="50%" stop-color="rgba(150,150,170,0.2)" stop-opacity="0.2"/>
              <stop offset="100%" stop-color="rgba(150,150,170,0.1)" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <rect x="0" y="80" width="200" height="30" fill="url(#fogNightAtmos)" opacity="0.2">
            <animateTransform attributeName="transform" type="translate" values="-8,0; 8,0; -8,0" dur="11s" repeatCount="indefinite"/>
          </rect>
          <rect x="0" y="110" width="200" height="25" fill="url(#fogNightAtmos)" opacity="0.15">
            <animateTransform attributeName="transform" type="translate" values="8,0; -8,0; 8,0" dur="13s" repeatCount="indefinite"/>
          </rect>
        </svg>
      `;
    } else {
      svg = `
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <g transform="translate(100, 100)">
            <path d="M-40 15 Q-48 15 -48 8 Q-48 0 -40 0 Q-32 -8 -24 -8 Q-16 -15 -8 -15 Q0 -15 8 -8 Q16 -8 24 0 Q32 0 32 7 Q32 15 24 15 L-40 15 Z" 
                  fill="rgba(100,100,120,0.2)" opacity="0.3"/>
          </g>
        </svg>
      `;
    }
  }
  
  // Smooth fade when icon changes
  weatherBg.style.opacity = "0";
  requestAnimationFrame(() => {
    weatherBg.innerHTML = svg;
    requestAnimationFrame(() => {
      weatherBg.style.opacity = "";
    });
  });
}

// Get forecast icon SVG for Atmos
function getForecastIconSVGAtmos(condition, isDay) {
  const cond = (condition || "").toLowerCase();
  const size = 48;
  
  if ((cond.includes("sunny") || cond.includes("clear")) && isDay) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="10" fill="#FFD700" opacity="0.8"/>
      <line x1="24" y1="4" x2="24" y2="8" stroke="#FFD700" stroke-width="1.5"/>
      <line x1="24" y1="40" x2="24" y2="44" stroke="#FFD700" stroke-width="1.5"/>
      <line x1="4" y1="24" x2="8" y2="24" stroke="#FFD700" stroke-width="1.5"/>
      <line x1="40" y1="24" x2="44" y2="24" stroke="#FFD700" stroke-width="1.5"/>
    </svg>`;
  } else if ((cond.includes("clear") || cond.includes("sunny")) && !isDay) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 18 Q20 18 20 22 Q20 26 24 26 Q28 26 28 22 Q28 18 24 18" fill="#F0E68C" opacity="0.8"/>
      <circle cx="12" cy="12" r="1" fill="#FFFFFF" opacity="0.6"/>
      <circle cx="36" cy="10" r="0.8" fill="#FFFFFF" opacity="0.5"/>
    </svg>`;
  } else if (cond.includes("rain")) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 28 Q10 28 10 26 Q10 24 12 24 Q14 22 16 22 Q18 20 20 20 Q22 20 24 22 Q26 22 28 24 Q30 24 30 26 Q30 28 28 28 L12 28 Z" fill="rgba(200,200,200,0.5)"/>
      <line x1="16" y1="32" x2="16" y2="38" stroke="#60A5FA" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="34" x2="20" y2="40" stroke="#60A5FA" stroke-width="2" stroke-linecap="round"/>
      <line x1="24" y1="32" x2="24" y2="38" stroke="#60A5FA" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  } else if (cond.includes("snow")) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 28 Q10 28 10 26 Q10 24 12 24 Q14 22 16 22 Q18 20 20 20 Q22 20 24 22 Q26 22 28 24 Q30 24 30 26 Q30 28 28 28 L12 28 Z" fill="rgba(220,220,220,0.6)"/>
      <line x1="20" y1="32" x2="20" y2="36" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="18" y1="34" x2="22" y2="34" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  } else {
    return `<svg width="${size}" height="${size}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 28 Q10 28 10 26 Q10 24 12 24 Q14 22 16 22 Q18 20 20 20 Q22 20 24 22 Q26 22 28 24 Q30 24 30 26 Q30 28 28 28 L12 28 Z" fill="rgba(200,200,200,0.4)"/>
    </svg>`;
  }
}

// Temperature toggle handlers
document.querySelectorAll('.toggle-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentUnit = btn.dataset.unit;
    
    // Re-fetch to update temperatures (or just update display if we stored the data)
    // For now, just trigger a reload
    if (cityInput.value.trim()) {
      loadWeather();
    }
  });
});

loadBtn.addEventListener("click", loadWeather);
cityInput.addEventListener("keydown", (e) => { if (e.key === "Enter") loadWeather(); });
daysInput.addEventListener("keydown", (e) => { if (e.key === "Enter") loadWeather(); });
