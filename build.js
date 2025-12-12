import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

const POSTS_DIR = path.join(process.cwd(), "posts");

function readMarkdownFiles(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
}

function renderPostToHtml(meta, htmlContent) {
  const title = meta.title || "Untitled";
  const date = meta.date || "";
  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
  const out = `<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>${title}</title>
		<link rel="stylesheet" href="../../assets/styles.css" />
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css" />
		<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/styles/github.min.css">
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
    <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.8.0/build/highlight.min.js"></script>
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
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  const indexPath = path.join(POSTS_DIR, "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(posts, null, 2), "utf8");
  console.log(`Built ${posts.length} posts`);
}

build();
