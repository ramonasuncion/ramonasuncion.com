async function fetchPosts() {
  try {
    const res = await fetch("/posts/index.json");
    if (!res.ok) throw new Error("Could not fetch posts");
    let posts;
    try {
      posts = await res.json();
    } catch (err) {
      const body = await res.text();
      console.error("Failed to parse /posts/index.json:", err, "body:", body);
      return;
    }
    renderPosts(posts);
  } catch (err) {
    console.warn(err);
  }
}

function parseDateLocal(date) {
  if (!date) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map((v) => parseInt(v, 10));
    return new Date(y, m - 1, d);
  }
  return new Date(date);
}

function renderPosts(posts) {
  const container = document.getElementById("posts");
  if (!container) return;
  container.innerHTML = "";
  let list = null;
  let year = null;
  posts.forEach((p) => {
    const d = parseDateLocal(p.date || "");
    const y = d ? d.getFullYear() : null;
    if (!list || y !== year) {
      const h = document.createElement("h2");
      h.className = "label";
      h.textContent = y;
      container.appendChild(h);
      list = document.createElement("ul");
      list.className = "list";
      container.appendChild(list);
      year = y;
    }

    const el = document.createElement("li");
    const text = document.createElement("div");

    const link = document.createElement("a");
    link.href = "/" + p.url;
    link.textContent = p.title;
    text.appendChild(link);

    if (p.description) {
      const desc = document.createElement("p");
      desc.textContent = p.description;
      text.appendChild(desc);
    }

    const time = document.createElement("time");
    time.dateTime = p.date || "";
    time.textContent = d
      ? d.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

    el.appendChild(text);
    el.appendChild(time);
    list.appendChild(el);
  });
}

function renderMath() {
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderMath();
  fetchPosts();
});
