try {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") {
    document.documentElement.dataset.theme = saved;
  }
} catch {}

const systemDark = matchMedia("(prefers-color-scheme: dark)");

function updateFavicon() {
  const theme =
    document.documentElement.dataset.theme ||
    (systemDark.matches ? "dark" : "light");
  document.getElementById("favicon").href =
    theme === "dark" ? "favicon-dark.png" : "favicon.png";
}

updateFavicon();
systemDark.addEventListener("change", updateFavicon);
