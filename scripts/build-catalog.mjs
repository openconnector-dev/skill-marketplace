#!/usr/bin/env node
import { lstat, readFile, readdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const skillsRoot = join(root, "skills");
const catalogPath = join(root, "catalog.json");
const slugPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const toolPattern = /^[A-Z][A-Z0-9_]+$/;
const textExtensions = new Set([".md", ".json", ".svg"]);
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const maxFileBytes = 128_000;
const maxFiles = 25;

function fail(message) {
  throw new Error(message);
}

function requiredString(value, label) {
  if (typeof value !== "string" || !value.trim()) fail(`${label} must be a nonempty string`);
  return value.trim();
}

function frontmatter(markdown, slug) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(markdown);
  if (!match) fail(`${slug}: SKILL.md needs YAML frontmatter`);
  const fields = new Map();
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^(name|description):\s*(.+)$/.exec(line);
    if (field) fields.set(field[1], field[2].replace(/^["']|["']$/g, "").trim());
  }
  const name = requiredString(fields.get("name"), `${slug} name`);
  const description = requiredString(fields.get("description"), `${slug} description`);
  if (name !== slug) fail(`${slug}: frontmatter name must match directory`);
  if (description.length > 500) fail(`${slug}: description is too long`);
  return { name, description };
}

async function filesIn(directory, base = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isSymbolicLink()) fail(`symlinks are not allowed: ${absolute}`);
    if (entry.isDirectory()) {
      files.push(...(await filesIn(absolute, base)));
      continue;
    }
    if (!entry.isFile()) fail(`unsupported entry: ${absolute}`);
    const path = relative(base, absolute).replaceAll("\\", "/");
    if (path === "marketplace.json") continue;
    const ext = extname(path).toLowerCase();
    if (!textExtensions.has(ext) && !imageExtensions.has(ext)) {
      fail(`unsupported file type: ${path}`);
    }
    const stat = await lstat(absolute);
    if (stat.size > maxFileBytes) fail(`file too large: ${path}`);
    const data = await readFile(absolute);
    files.push({
      path,
      encoding: imageExtensions.has(ext) ? "base64" : "utf8",
      content: data.toString(imageExtensions.has(ext) ? "base64" : "utf8"),
    });
  }
  return files.sort((a, b) => a.path.localeCompare(b.path));
}

const skills = [];
for (const entry of await readdir(skillsRoot, { withFileTypes: true })) {
  if (!entry.isDirectory() || !slugPattern.test(entry.name)) {
    fail(`invalid Skill directory: ${entry.name}`);
  }
  const slug = entry.name;
  const directory = join(skillsRoot, slug);
  const metadata = JSON.parse(await readFile(join(directory, "marketplace.json"), "utf8"));
  const title = requiredString(metadata.title, `${slug} title`);
  const authorName = requiredString(metadata.author?.name, `${slug} author.name`);
  const authorUrl = requiredString(metadata.author?.url, `${slug} author.url`);
  if (!authorUrl.startsWith("https://")) fail(`${slug}: author.url must use HTTPS`);
  if (!Array.isArray(metadata.toolkits) || metadata.toolkits.length === 0 ||
      metadata.toolkits.some((value) => typeof value !== "string" || !slugPattern.test(value))) {
    fail(`${slug}: toolkits must contain lowercase Toolkit slugs`);
  }
  if (!Array.isArray(metadata.toolSlugs) || metadata.toolSlugs.length === 0 ||
      metadata.toolSlugs.some((value) => typeof value !== "string" || !toolPattern.test(value))) {
    fail(`${slug}: toolSlugs must contain exact Tool slugs`);
  }
  const files = await filesIn(directory);
  if (files.length > maxFiles) fail(`${slug}: too many files`);
  const skillFile = files.find((file) => file.path === "SKILL.md");
  if (!skillFile) fail(`${slug}: missing SKILL.md`);
  const { name, description } = frontmatter(skillFile.content, slug);
  skills.push({
    slug, name, title, description,
    author: { name: authorName, url: authorUrl },
    toolkits: [...new Set(metadata.toolkits)].sort(),
    toolSlugs: [...new Set(metadata.toolSlugs)].sort(),
    digest: createHash("sha256").update(JSON.stringify(files)).digest("hex"),
    files,
  });
}
skills.sort((a, b) => a.slug.localeCompare(b.slug));
const output = JSON.stringify({ schemaVersion: 1, skills }, null, 2) + "\n";
if (process.argv.includes("--check")) {
  const existing = await readFile(catalogPath, "utf8").catch(() => "");
  if (existing !== output) fail("catalog.json is stale; run npm run catalog and commit it");
  console.log(`Validated ${skills.length} Skills`);
} else {
  await writeFile(catalogPath, output);
  console.log(`Wrote catalog.json with ${skills.length} Skills`);
}
