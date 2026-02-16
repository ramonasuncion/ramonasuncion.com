import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import hljs from "highlight.js";

hljs.configure({ classPrefix: "hl-" });

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const SITE_URL = "https://ramonasuncion.com";
const SITE_TITLE = "Ramon Asuncion";
const SITE_DESCRIPTION = "Ramon Asuncion's blog";

function parse_highlight_spec(spec) {
  if (!spec) return [];
  return spec.split(",").flatMap((el) => {
    if (el.includes("-")) {
      const [los, his] = el.split("-");
      const lo = parseInt(los, 10);
      const hi = parseInt(his, 10);
      return Array.from({ length: hi - lo + 1 }, (_x, i) => lo + i);
    }
    return [parseInt(el, 10)];
  });
}

function parse_callouts(source) {
  const res = new Map();
  let line = 0;
  const s = String(source);
  const without_callouts = s.replace(/<(\d)>|\n/g, (m, d) => {
    if (m === "\n") {
      line += 1;
      return m;
    }
    const arr = res.get(line) ?? [];
    arr.push(d);
    res.set(line, arr);
    return "";
  });
  return [without_callouts, res];
}

function add_spans_console(source) {
  let cont = false;
  const lines = source
    .trimEnd()
    .split("\n")
    .map((line) => {
      if (cont) {
        cont = line.endsWith("\\");
        return `${escapeHtml(line)}\n`;
      }
      if (line.startsWith("$ ")) {
        cont = line.endsWith("\\");
        return `<span class="hl-title function_">$</span> ${escapeHtml(
          line.substring(2),
        )}\n`;
      }
      if (line.startsWith("#")) {
        return `<span class="hl-comment">${escapeHtml(line)}</span>\n`;
      }
      return `<span class="hl-output">${escapeHtml(line)}</span>\n`;
    });
  return lines.join("");
}

function add_spans(source, language) {
  if (!language || language === "adoc") return escapeHtml(source);
  if (language === "console") return add_spans_console(source);
  try {
    if (language && hljs.getLanguage && !hljs.getLanguage(language)) {
      // fallback to auto-detection
      const auto = hljs.highlightAuto(source);
      return auto.value;
    }
    const res = hljs.highlight(source, { language, ignoreIllegals: true });
    return res.value;
  } catch (e) {
    console.error(e);
    console.error(`\n    hljs failed for language=${language}\n`);
    return escapeHtml(source);
  }
}

function parseDateLocal(date) {
  if (!date) return null;
  // Treat bare YYYY-MM-DD as a local date (avoid UTC shift)
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map((v) => parseInt(v, 10));
    return new Date(y, m - 1, d);
  }
  return new Date(date);
}
function highlight_code(source, infostring) {
  // `source` MUST BE a string
  source = String(source);
  const parts = (infostring || "").trim().split(/\s+/);
  const language = parts[0];
  const spec = parse_highlight_spec(parts[1]);
  let src = source;
  let callouts;
  [src, callouts] = parse_callouts(src);
  let highlighted = add_spans(src, language);
  highlighted = String(highlighted).trimEnd();

  // balance open spans across line breaks
  const openTags = [];
  highlighted = highlighted.replace(
    /(<span [^>]+>)|(<\/span>)|(\n)/g,
    (match) => {
      if (match === "\n") {
        return "</span>".repeat(openTags.length) + "\n" + openTags.join("");
      }

      if (match === "</span>") {
        openTags.pop();
      } else {
        openTags.push(match);
      }

      return match;
    },
  );

  const lines = highlighted
    .split("\n")
    .map((it, idx) => {
      const cls = spec.includes(idx + 1) ? " hl-line" : "";
      const calls = (callouts.get(idx) ?? [])
        .map((it) => `<i class="callout" data-value="${it}"></i>`)
        .join(" ");
      return `<span class="line${cls}">${it}${calls}</span>`;
    })
    .join("\n");

  return `<figure class="code-block"><pre><code>${lines}</code></pre></figure>`;
}

const renderer = new marked.Renderer();
renderer.code = function (code, infostring, escaped) {
  if (code && typeof code === "object") {
    const lang = code.lang || "";
    const meta = code.meta || "";
    const info = (lang + (meta ? ` ${meta}` : "")).trim();
    return highlight_code(code.text ?? String(code), info);
  }
  return highlight_code(code, infostring);
};
marked.use({ renderer });

const POSTS_DIR = path.join(process.cwd(), "posts");

function readMarkdownFiles(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
}

function generateRssFeed(posts) {
  const items = posts
    .map((p) => {
      const pubDate = p.date
        ? parseDateLocal(p.date).toUTCString()
        : new Date().toUTCString();
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/${p.url}</link>
      <guid>${SITE_URL}/${p.url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(p.excerpt || p.title)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

function renderPostToHtml(meta, htmlContent) {
  const title = meta.title || "Untitled";
  const date = meta.date || "";
  const formattedDate = date
    ? parseDateLocal(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
  const out = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>${title}</title>
		<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
		<link rel="stylesheet" href="../../assets/styles.css" />
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/styles/github.min.css">
     <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"
      crossorigin="anonymous"
      referrerpolicy="no-referrer"
    />
	</head>
	<body>
    <header>
      <h1><a href="/">Ramon Asuncion</a></h1>
      <nav>
        <a href="/about/">About</a>
        <a href="/links/">Links</a>
        <a href="/blogroll/">Blogroll</a>
      </nav>
    </header>
		<main>
			<article class="post">
            <h2>${title}</h2>
            <time>${formattedDate}</time>
				<div class="post-content">
					${htmlContent}
				</div>
			</article>
		</main>
      <footer>
        <p class="footer-social-links">
          <a
            href="https://github.com/ramonasuncion"
            target="_blank"
            rel="noopener"
            title="GitHub"
          >
            <i class="fab fa-github" aria-hidden="true"></i>
            GitHub
          </a>
          <a href="mailto:asuncionbatista@gmail.com" title="Email">
            <i class="fas fa-envelope" aria-hidden="true"></i>
            Email
          </a>
          <a href="/feed.xml" title="Subscribe (RSS)">
            <i class="fas fa-rss" aria-hidden="true"></i>
            Subscribe (RSS)
          </a>
        </p>
      </footer>
    <!-- highlight.js is applied at build time -->
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
    <script src="../../assets/js/scripts.js"></script>
	</body>
</html>`;
  return out;
}

function build() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error("posts directory not found");
    process.exit(1);
  }

  const files = readMarkdownFiles(POSTS_DIR);
  const posts = [];

  for (const file of files) {
    const src = path.join(POSTS_DIR, file);
    const raw = fs.readFileSync(src, "utf8");
    const { data, content } = matter(raw);
    const slug = data.slug || file.replace(/\.md$/, "");
    const html = marked(content);
    const outDir = path.join(POSTS_DIR, slug);
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "index.html");
    fs.writeFileSync(outPath, renderPostToHtml(data, html), "utf8");

    posts.push({
      title: data.title || slug,
      date: data.date || "",
      slug,
      url: `posts/${slug}/`,
      excerpt: data.excerpt || "",
    });
  }

  posts.sort((a, b) => {
    const da = parseDateLocal(a.date);
    const db = parseDateLocal(b.date);
    return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
  });
  const indexPath = path.join(POSTS_DIR, "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(posts, null, 2), "utf8");

  const feedPath = path.join(process.cwd(), "feed.xml");
  fs.writeFileSync(feedPath, generateRssFeed(posts), "utf8");

  console.log(`Built ${posts.length} posts`);
}

build();
