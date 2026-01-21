const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const jsDir = path.join(rootDir, 'js');

console.log("\x1b[36m%s\x1b[0m", "==================================================");
console.log("\x1b[36m%s\x1b[0m", "   SISTEMA DE AUTO-REPARO BICICLETÁRIO v2.0       ");
console.log("\x1b[36m%s\x1b[0m", "==================================================");

let errorCount = 0;
let warningCount = 0;
let fixedCount = 0;

function logError(context, msg) {
    errorCount++;
    console.error("\x1b[31m%s\x1b[0m", `[X] ERRO CRÍTICO (${context}):`);
    console.error(`    ${msg}`);
}

function logSuccess(msg) {
    console.log("\x1b[32m%s\x1b[0m", `[OK] ${msg}`);
}

function logFix(msg) {
    fixedCount++;
    console.log("\x1b[34m%s\x1b[0m", `[🔧] REPARO APLICADO: ${msg}`);
}

// --- 0. AUTO-FIXER MODULE ---
function tryAutoFix(filepath, errorMsg) {
    const filename = path.basename(filepath);

    // Fix for the known SpaceInvadersGame syntax error (extra brace)
    if (filename === 'jogos.js' && errorMsg.includes("Unexpected token '{'")) {
        console.log("\nDetectado erro de sintaxe conhecido em jogos.js. Tentando corrigir...");
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            const lines = content.split('\n');
            let patched = false;

            // Look for the pattern: updateScoreDisplay() { ... } { spawnWave() ...
            // The error is usually an extra curly brace alone or before spawnWave

            // Heuristic: Search for the isolated brace before spawnWave
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                // If we find a lonely '{' or '}' that shouldn't be there around line 3438
                if (line === '{' && i > 3000) {
                    // Double check context
                    if (lines[i + 1] && lines[i + 1].includes('spawnWave')) {
                        console.log(`Removendo chave extra na linha ${i + 1}...`);
                        lines.splice(i, 1); // Delete the line
                        patched = true;
                        break;
                    }
                }
            }

            if (patched) {
                fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
                logFix("Sintaxe inválida (chave extra) removida de jogos.js");
                return true; // Fixed
            }
        } catch (e) {
            console.error("Falha ao aplicar correção automática:", e.message);
        }
    }
    return false;
}

// --- 1. Syntax Check (Advanced Mode) ---
console.log("\n1. Verificando e Corrigindo Arquivos JS...");

function checkSyntax(filepath) {
    const content = fs.readFileSync(filepath);
    const relPath = path.relative(rootDir, filepath);

    try {
        execSync('node --input-type=module -c', {
            input: content,
            stdio: 'pipe',
            cwd: rootDir
        });
    } catch (e) {
        let output = e.stderr.toString();
        let errorMsg = output.split('\n')[1] || output.split('\n')[0];

        // Try to fix
        if (tryAutoFix(filepath, errorMsg)) {
            // Re-check after fix
            try {
                const newContent = fs.readFileSync(filepath);
                execSync('node --input-type=module -c', { input: newContent, stdio: 'pipe', cwd: rootDir });
                logSuccess(`Arquivo reparado com sucesso: ${relPath}`);
                errorCount--; // Decrement since we fixed it (if logError adds one, but here we handled it)
                return;
            } catch (e2) {
                logError("Sintaxe", `Correção falhou. Erro persiste em: ${relPath}`);
            }
        } else {
            logError("Sintaxe", `Erro no arquivo: ${relPath}\n    Detalhe: ${errorMsg.trim()}`);
        }
    }
}

function walkAndCheckSyntax(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walkAndCheckSyntax(filepath);
        } else if (file.endsWith('.js')) {
            checkSyntax(filepath);
        }
    });
}
walkAndCheckSyntax(jsDir);

// --- 2. Critical Files Existence ---
console.log("\n2. Verificando Dependências...");
const indexPath = path.join(rootDir, 'index.html');
if (fs.existsSync(indexPath)) {
    const htmlContent = fs.readFileSync(indexPath, 'utf8');
    const scriptRegex = /<script[^>]+src=["']([^"']+)["']/g;

    let match;
    while ((match = scriptRegex.exec(htmlContent)) !== null) {
        let relativePath = match[1];
        if (relativePath.startsWith('http') || relativePath.startsWith('chrome-extension')) continue;
        relativePath = relativePath.split('?')[0];
        const fullPath = path.join(rootDir, relativePath);
        if (!fs.existsSync(fullPath)) {
            logError("Arquivo Ausente", `Script ausente: ${relativePath}`);
        }
    }
    logSuccess("Dependências verificadas.");
}

console.log("\n==================================================");
if (fixedCount > 0) {
    console.log("\x1b[32m%s\x1b[0m", `✅ SUCESSO! ${fixedCount} ERRO(S) FORAM CORRIGIDOS AUTOMATICAMENTE.`);
    console.log("   Tente abrir o sistema novamente.");
} else if (errorCount === 0) {
    console.log("\x1b[32m%s\x1b[0m", "✅ SISTEMA 100% OPERACIONAL.");
} else {
    console.log("\x1b[31m%s\x1b[0m", `❌ FALHA.`);
    console.log(`   ${errorCount} erros não puderam ser corrigidos automaticamente.`);
}
console.log("==================================================");
