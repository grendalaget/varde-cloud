import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import ts from "typescript";

function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  });
}

function unguardedHandlers(text: string): string[] {
  const source = ts.createSourceFile("route.ts", text, ts.ScriptTarget.Latest, true);
  const guards = new Set<string>();
  for (const node of source.statements) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === "@/lib/csrf") {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const specifier of bindings.elements) {
          if ((specifier.propertyName ?? specifier.name).text === "withSameOrigin") guards.add(specifier.name.text);
        }
      }
    }
  }
  const unsafe = (name: string) => /^[A-Z]+$/.test(name) && !["GET", "HEAD", "OPTIONS"].includes(name);
  const failures: string[] = [];
  for (const node of source.statements) {
    if (ts.isExportDeclaration(node)) {
      if (!node.exportClause) failures.push("unreviewed export star");
      else if (ts.isNamedExports(node.exportClause)) {
        for (const item of node.exportClause.elements) if (unsafe(item.name.text)) failures.push(item.name.text);
      }
      continue;
    }
    if (!ts.canHaveModifiers(node) || !ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) continue;
    if (ts.isFunctionDeclaration(node) && node.name && unsafe(node.name.text)) failures.push(node.name.text);
    if (ts.isVariableStatement(node)) {
      for (const declaration of node.declarationList.declarations) {
        const names = ts.isIdentifier(declaration.name) ? [declaration.name.text] : declaration.name.elements.flatMap((element) => ts.isBindingElement(element) ? [element.name.getText(source)] : []);
        const wrapped = declaration.initializer && ts.isCallExpression(declaration.initializer) && ts.isIdentifier(declaration.initializer.expression) && guards.has(declaration.initializer.expression.text);
        for (const name of names) if (unsafe(name) && !wrapped) failures.push(name);
      }
    }
  }
  return failures;
}

test("every mutating API route export uses the shared CSRF wrapper", () => {
  const routes = files("src/app/api").filter((path) => /\/route\.[cm]?[jt]sx?$/.test(path));
  assert.ok(routes.length > 0);
  for (const path of routes) assert.deepEqual(unguardedHandlers(readFileSync(path, "utf8")), [], path);
});

test("coverage rejects forgotten, destructured and re-exported mutating handlers", () => {
  for (const code of ["export async function POST() {}", "export const DELETE = handler;", "export const { GET, POST } = handlers;", "export { handler as PATCH };", "export * from './other';"]) assert.ok(unguardedHandlers(code).length > 0, code);
  assert.deepEqual(unguardedHandlers("import {withSameOrigin} from '@/lib/csrf'; export const POST = withSameOrigin(handler); export function GET() {}"), []);
});

test("new server actions require an explicit CSRF review", () => {
  for (const path of files("src").filter((path) => /\.[cm]?[jt]sx?$/.test(path))) {
    const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression)) assert.notEqual(node.expression.text, "use server", `${path}: review and guard new server actions before allowing them`);
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
});
