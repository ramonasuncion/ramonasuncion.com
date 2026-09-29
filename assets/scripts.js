const buttons = document.querySelectorAll("[data-theme-choice]");

function showChoice(choice) {
  buttons.forEach((b) => {
    b.setAttribute(
      "aria-pressed",
      String(b.dataset.themeChoice === choice),
    );
  });
}

buttons.forEach((b) => {
  b.addEventListener("click", () => {
    const choice = b.dataset.themeChoice;
    if (choice === "auto") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = choice;
    }
    try {
      if (choice === "auto") localStorage.removeItem("theme");
      else localStorage.setItem("theme", choice);
    } catch {}
    showChoice(choice);
    updateFavicon();
  });
});

showChoice(document.documentElement.dataset.theme || "auto");

const synodicMonth = 29.530588853;
const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
const moonDays = (Date.now() - knownNewMoon) / 86400000;
const phase = (((moonDays / synodicMonth) % 1) + 1) % 1;
const phaseNames = [
  [0.03, "new moon"],
  [0.22, "waxing crescent"],
  [0.28, "first quarter"],
  [0.47, "waxing gibbous"],
  [0.53, "full moon"],
  [0.72, "waning gibbous"],
  [0.78, "last quarter"],
  [0.97, "waning crescent"],
  [1.01, "new moon"],
];
const phaseName = phaseNames.find(([limit]) => phase < limit)[1];
const radius = 18;
const terminator = Math.abs(Math.cos(2 * Math.PI * phase)) * radius;
const waxing = phase < 0.5;
const outerSweep = waxing ? 1 : 0;
const innerSweep = waxing
  ? phase < 0.25
    ? 0
    : 1
  : phase < 0.75
    ? 0
    : 1;
document
  .getElementById("moon-lit")
  .setAttribute(
    "d",
    `M20 2 A${radius} ${radius} 0 0 ${outerSweep} 20 38 A${terminator} ${radius} 0 0 ${innerSweep} 20 2 Z`,
  );
document.getElementById("moon-text").textContent =
  phaseName[0].toUpperCase() + phaseName.slice(1);

const now = new Date();
const today = document.getElementById("today");
today.dateTime = now.toLocaleDateString("en-CA");
today.textContent = now.toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});
