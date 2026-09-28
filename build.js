import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";
import hljs from "highlight.js";
import sharp from "sharp";
import { Feed } from "feed";
import * as prettier from "prettier";

hljs.configure({ classPrefix: "hl-" });

function escape(s) {
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
const POSTS_DIR = path.join(process.cwd(), "posts");
const TEMPLATE = fs.readFileSync(
  path.join(process.cwd(), "template.html"),
  "utf8",
);
const OG_TEMPLATE = fs.readFileSync(
  path.join(process.cwd(), "og-template.svg"),
  "utf8",
);

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

function highlightConsole(source) {
  let cont = false;
  return source
    .trimEnd()
    .split("\n")
    .map((line) => {
      if (cont) {
        cont = line.endsWith("\\");
        return `${escape(line)}\n`;
      }
      if (line.startsWith("$ ")) {
        cont = line.endsWith("\\");
        return `<span class="hl-title function_">$</span> ${escape(line.substring(2))}\n`;
      }
      if (line.startsWith("#")) {
        return `<span class="hl-comment">${escape(line)}</span>\n`;
      }
      return `<span class="hl-output">${escape(line)}</span>\n`;
    })
    .join("");
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

function highlight(source, lang) {
  if (lang === "adoc") return escape(source);
  if (lang === "console") return highlightConsole(source);
  try {
    if (!lang || !hljs.getLanguage(lang))
      return hljs.highlightAuto(source).value;
    return hljs.highlight(source, { language: lang, ignoreIllegals: true })
      .value;
  } catch {
    return escape(source);
  }
}

function highlight_code(source, infostring) {
  const parts = (infostring || "").trim().split(/\s+/);
  const language = parts[0];
  const spec = parse_highlight_spec(parts[1]);
  let highlighted = String(highlight(String(source), language)).trimEnd();

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
      return `<span class="line${cls}">${it}</span>`;
    })
    .join("\n");

  return `<figure class="code-block"><pre><code>${lines}</code></pre></figure>`;
}

const renderer = new marked.Renderer();
renderer.code = function (code) {
  if (code && typeof code === "object") {
    const info = [code.lang || "", code.meta || ""].join(" ").trim();
    return highlight_code(code.text ?? String(code), info);
  }
  return highlight_code(code, "");
};
function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

renderer.heading = function ({ tokens, depth, text }) {
  const id = slugify(text);
  const inner = this.parser.parseInline(tokens);
  return `<h${depth} id="${id}">${inner} <a class="anchor" href="#${id}" aria-label="Link to this section">&sect;</a></h${depth}>\n`;
};

marked.use({ renderer });

function generateRssFeed(posts) {
  const feed = new Feed({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    id: SITE_URL,
    link: SITE_URL,
    language: "en",
    feedLinks: { rss2: `${SITE_URL}/feed.xml` },
  });
  for (const p of posts) {
    feed.addItem({
      title: p.title,
      id: `${SITE_URL}/${p.url}`,
      link: `${SITE_URL}/${p.url}`,
      date: parseDateLocal(p.date) || new Date(),
    });
  }
  return feed.rss2();
}

function wrapText(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    if (current && (current + " " + word).length > maxChars) {
      lines.push(current);
      current = word;
    } else {
      current = current ? current + " " + word : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function generateOgImage(title, outPath) {
  const lines = wrapText(title, 20);
  const fontSize = 72;
  const lineHeight = fontSize * 1.2;
  const startY = 200;

  const titleLines = lines
    .map(
      (line, i) =>
        `<text x="100" y="${startY + i * lineHeight}" font-family="Georgia, serif" font-size="${fontSize}" font-weight="700" fill="#c0392b">${escape(line)}</text>`,
    )
    .join("\n  ");

  const svg = OG_TEMPLATE.replace("{{title_lines}}", titleLines);
  await sharp(Buffer.from(svg)).png().toFile(outPath);
}

function formatDate(date) {
  return date
    ? parseDateLocal(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";
}

function renderReadNext(others) {
  if (!others.length) return "";
  const items = others
    .map((p) => {
      const desc = p.description ? `<p>${escape(p.description)}</p>` : "";
      return `<li><div><a href="/${p.url}">${escape(p.title)}</a>${desc}</div><time datetime="${p.date}">${formatDate(p.date)}</time></li>`;
    })
    .join("\n");
  return `<section class="read-next"><h2 class="label" id="read-next">Read Next <a class="anchor" href="#read-next" aria-label="Link to this section">&sect;</a></h2><ul class="list">${items}</ul></section>`;
}

function renderPostToHtml(meta, htmlContent, slug, readNext) {
  const title = meta.title || "Untitled";
  const subtitle = meta.description
    ? `<p class="subtitle">${escape(meta.description)}</p>`
    : "";
  return TEMPLATE.replace(/\{\{title\}\}/g, escape(title))
    .replace("{{subtitle}}", subtitle)
    .replace("{{date}}", formatDate(meta.date || ""))
    .replace("{{content}}", htmlContent)
    .replace("{{read_next}}", readNext)
    .replace("{{og_image}}", `${SITE_URL}/posts/${slug}/og.png`)
    .replace("{{og_url}}", `${SITE_URL}/posts/${slug}/`);
}

async function build() {
  if (!fs.existsSync(POSTS_DIR)) {
    console.error("posts directory not found");
    process.exit(1);
  }

  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));
  const posts = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const date = file.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] || "";
    const slug =
      data.slug ||
      file.replace(/^\d{4}-\d{2}-\d{2}-/, "").replace(/\.md$/, "");
    posts.push({
      title: data.title || slug,
      description: data.description || "",
      date,
      slug,
      url: `posts/${slug}/`,
      data,
      html: marked(content),
    });
  }

  posts.sort((a, b) => {
    const da = parseDateLocal(a.date);
    const db = parseDateLocal(b.date);
    return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
  });

  for (const post of posts) {
    const outDir = path.join(POSTS_DIR, post.slug);
    fs.mkdirSync(outDir, { recursive: true });
    const readNext = renderReadNext(
      posts.filter((p) => p.slug !== post.slug).slice(0, 3),
    );
    fs.writeFileSync(
      path.join(outDir, "index.html"),
      renderPostToHtml(
        { ...post.data, date: post.date },
        post.html,
        post.slug,
        readNext,
      ),
      "utf8",
    );
    await generateOgImage(post.title, path.join(outDir, "og.png"));
  }

  const index = posts.map(({ title, description, date, slug, url }) => ({
    title,
    description,
    date,
    slug,
    url,
  }));
  const indexPath = path.join(POSTS_DIR, "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf8");

  const homePath = path.join(process.cwd(), "index.html");
  const home = fs.readFileSync(homePath, "utf8");
  const recent = posts
    .slice(0, 3)
    .map((p) => {
      const desc = p.description ? `<p>${escape(p.description)}</p>` : "";
      return `        <li>
          <div><a href="${p.url}">${escape(p.title)}</a>${desc}</div>
          <time datetime="${p.date}">${formatDate(p.date)}</time>
        </li>`;
    })
    .join("\n");
  const updatedHome = home.replace(
    /<!-- recent-posts -->[\s\S]*?<!-- \/recent-posts -->/,
    `<!-- recent-posts -->\n      <ul class="list">\n${recent}\n      </ul>\n      <!-- /recent-posts -->`,
  );
  const prettierConfig = (await prettier.resolveConfig(homePath)) || {};
  fs.writeFileSync(
    homePath,
    await prettier.format(updatedHome, { ...prettierConfig, parser: "html" }),
    "utf8",
  );

  const feedPath = path.join(process.cwd(), "feed.xml");
  fs.writeFileSync(feedPath, generateRssFeed(posts), "utf8");

  console.log(`Built ${posts.length} posts`);
}

build();
