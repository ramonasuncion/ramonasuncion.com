async function fetchPosts() {
  try {
    const res = await fetch("/posts/index.json");
    if (!res.ok) throw new Error("Could not fetch posts");
    const posts = await res.json();
    renderPosts(posts);
  } catch (err) {
    console.warn(err);
  }
}

function renderPosts(posts) {
  const container = document.getElementById("posts");
  if (!container) return;
  container.innerHTML = "";
  posts.forEach((p) => {
    const el = document.createElement("article");
    el.className = "post-list-item";

    const h = document.createElement("h3");
    const link = document.createElement("a");
    link.href = "/" + p.url;
    link.textContent = p.title;
    h.appendChild(link);

    const time = document.createElement("time");
    time.dateTime = p.date || "";
    time.textContent = new Date(p.date || "").toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    el.appendChild(h);
    el.appendChild(time);
    container.appendChild(el);
  });
}

function addLineNumbers() {
  document.querySelectorAll("pre").forEach((pre) => {
    if (pre.dataset.lined) return;

    const codeEl = pre.querySelector("code") || pre;

    codeEl.style.display = "block";
    codeEl.style.whiteSpace = "pre";

    const raw = codeEl.textContent || "";
    let textLines = raw.split(/\r\n|\r|\n/);

    if (textLines.length > 1 && textLines[textLines.length - 1].trim() === "") {
      textLines.pop();
    }

    const wrapper = document.createElement("div");
    wrapper.className = "code-wrapper";

    const gutter = document.createElement("div");
    gutter.className = "line-numbers";

    for (let i = 0; i < textLines.length; i++) {
      const span = document.createElement("span");
      span.textContent = i + 1;
      gutter.appendChild(span);
    }

    let htmlLines = codeEl.innerHTML.split(/\r\n|\r|\n/);

    if (htmlLines.length === 1 && textLines.length > 1) {
      const esc = (s) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      htmlLines = textLines.map((ln) => (ln.trim() === "" ? "​" : esc(ln)));
    } else {
      for (let i = 0; i < textLines.length; i++) {
        if (textLines[i].trim() === "") {
          htmlLines[i] = '<span class="hljs-empty-line">\u200B</span>';
        }
      }
      for (let i = htmlLines.length; i < textLines.length; i++) {
        htmlLines.push('<span class="hljs-empty-line">\u200B</span>');
      }
    }

    codeEl.innerHTML = htmlLines.join("\n");

    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(gutter);
    wrapper.appendChild(pre);

    pre.dataset.lined = "1";
    pre.classList.add("has-line-numbers");
  });
}

function initCodeEnhancements() {
  if (window.hljs && typeof hljs.highlightAll === "function") {
    hljs.highlightAll();
  }

  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
    });
  }

  addLineNumbers();
}

document.addEventListener("DOMContentLoaded", () => {
  initCodeEnhancements();
});

document.addEventListener("DOMContentLoaded", () => {
  fetchPosts();
});
