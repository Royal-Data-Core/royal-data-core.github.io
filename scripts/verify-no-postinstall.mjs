#!/usr/bin/env node
/**
 * ADR-001 D4 — Garante que `npm ci --ignore-scripts` é SEGURO.
 *
 * A premissa de que nenhuma dependência precisa de lifecycle script
 * (esbuild/sharp usam optionalDependencies de plataforma desde 0.16/0.33)
 * NAO e presumida: e verificada. Se uma dependencia (inclusive transitiva)
 * declarar preinstall/install/postinstall, o build FALHA (fail-closed).
 *
 * Uso: node scripts/verify-no-postinstall.mjs [--allow <pkg> --allow <pkg>]
 * Exit: 0 = limpo | 1 = violacao
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const FORBIDDEN = ["preinstall", "install", "postinstall"];

// Allowlist vazia por padrao. Adicionar aqui EXIGE ADR (CONSTITUTION §C3).
const args = process.argv.slice(2);
const allowlist = new Set(
  args.flatMap((a, i) => (a === "--allow" ? [args[i + 1]] : [])),
);

let tree;
try {
  tree = JSON.parse(
    execFileSync("npm", ["ls", "--all", "--json", "--depth=Infinity"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    }),
  );
} catch (err) {
  const stdout = err?.stdout?.toString?.() ?? "";
  try {
    tree = JSON.parse(stdout); // `npm ls` sai != 0 com deps extraneous, mas ainda emite JSON
  } catch {
    console.error(
      "::error::verify-no-postinstall: falha ao ler a arvore de dependencias",
    );
    console.error(stdout || err.message);
    process.exit(1);
  }
}

const violations = [];
const seen = new Set();

function walk(node, path) {
  if (!node || typeof node !== "object") return;
  const name = node.name ?? path.at(-1) ?? "<root>";
  const here = [...path, name];
  const key = `${name}@${node.version ?? "?"}`;

  if (node.resolved && !seen.has(key)) {
    seen.add(key);
    if (!allowlist.has(name)) {
      const pkgPath = node.resolved ? null : null;
      const scripts = readScripts(node);
      for (const hook of FORBIDDEN) {
        if (scripts?.[hook]) {
          violations.push({
            pkg: key,
            hook,
            cmd: String(scripts[hook]).slice(0, 120),
            path: here.join(" › "),
          });
        }
      }
    }
  }

  for (const [depName, depNode] of Object.entries(node.dependencies ?? {})) {
    walk(depNode, here);
  }
}

function readScripts(node) {
  // `npm ls --json` nao inclui scripts; lemos o package.json instalado quando ha resolved local
  if (!node.name) return null;
  const candidates = [
    `node_modules/${node.name}/package.json`,
    ...nestedPaths(node.name),
  ];
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, "utf8")).scripts ?? null;
    } catch {
      /* tenta o proximo */
    }
  }
  return null;
}

function nestedPaths(name) {
  // varredura rasa de node_modules aninhados (escopos inclusive)
  const out = [];
  const roots = execFileSync(
    "find",
    [
      "node_modules",
      "-maxdepth",
      "6",
      "-type",
      "d",
      "-name",
      name.split("/").pop(),
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  for (const r of roots) out.push(`${r}/package.json`);
  return out;
}

walk(tree, []);

if (violations.length > 0) {
  console.error(
    "::error::ADR-001 D4 violado — dependencias com lifecycle scripts encontradas.",
  );
  console.error(
    "`npm ci --ignore-scripts` NAO as executara, o que pode quebrar binarios nativos.\n",
  );
  for (const v of violations) {
    console.error(`  ✗ ${v.pkg}`);
    console.error(`      hook: ${v.hook}`);
    console.error(`      cmd : ${v.cmd}`);
    console.error(`      via : ${v.path}`);
  }
  console.error("\nAcao requerida:");
  console.error(
    "  1. Preferir versao que distribua binarios via optionalDependencies de plataforma;",
  );
  console.error(
    "  2. OU criar ADR justificando e registrando em allowlist (--allow <pkg>);",
  );
  console.error("  3. allowlist nao vazia EXIGE ADR (CONSTITUTION §C3).");
  process.exit(1);
}

console.log(
  `✓ verify-no-postinstall: ${seen.size} pacotes inspecionados, 0 lifecycle scripts. --ignore-scripts e seguro.`,
);
if (allowlist.size)
  console.log(`  allowlist (exige ADR): ${[...allowlist].join(", ")}`);
process.exit(0);
