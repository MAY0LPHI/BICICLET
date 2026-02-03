
// Mocking the function logic directly to verify it works as expected
function formatLogDetails(log) {
    const details = [];
    const d = log.details || {};

    // --- Dados / Backup ---
    if (d.tipo) details.push(`Tipo: ${d.tipo}`);
    if (d.tipos && Array.isArray(d.tipos)) details.push(`Tipos: ${d.tipos.join(', ')}`);
    if (d.quantidade !== undefined) details.push(`Qtd: ${d.quantidade}`);
    if (d.formato) details.push(`Formato: ${d.formato}`);
    if (d.resultado) details.push(`Resultado: ${d.resultado}`);
    if (d.periodo) {
        const inicio = d.periodo.inicio ? d.periodo.inicio : 'Início';
        const fim = d.periodo.fim ? d.periodo.fim : 'Hoje';
        details.push(`Período: ${inicio} até ${fim}`);
    }

    // --- Clientes / Pessoas ---
    if (d.nome) details.push(`Nome: ${d.nome}`);
    if (d.cpf) details.push(`CPF: ${d.cpf}`);
    if (d.telefone) details.push(`Tel: ${d.telefone}`);
    if (d.email) details.push(`Email: ${d.email}`);

    // --- Bicicletas ---
    if (d.modelo) details.push(`Modelo: ${d.modelo}`);
    if (d.marca) details.push(`Marca: ${d.marca}`);
    if (d.cor) details.push(`Cor: ${d.cor}`);

    // --- Registros / Movimentação ---
    if (d.cliente) details.push(`Cliente: ${d.cliente}`);
    if (d.clienteCpf) details.push(`CPF: ${d.clienteCpf}`);
    if (d.dataHoraEntrada) details.push(`Entrada: ${d.dataHoraEntrada}`);
    if (d.dataHoraSaida) details.push(`Saída: ${d.dataHoraSaida}`);
    if (d.acao) details.push(`Ação: ${d.acao}`);
    if (d.from && d.to) details.push(`De: ${d.from} → Para: ${d.to}`);

    // --- Usuários ---
    if (d.username) details.push(`Usuário: ${d.username}`);
    if (d.userTipo || (d.tipo && log.entity === 'usuario')) details.push(`Função: ${d.userTipo || d.tipo}`);

    // --- Comentários ---
    if (d.comentario) details.push(`Comentário: "${d.comentario}"`);
    if (d.commentId) details.push(`ID Comentário: ${d.commentId}`);

    // --- Alterações Genéricas (Changes) ---
    if (d.changes) {
        const changesList = [];
        const before = d.changes.before || {};
        const after = d.changes.after || {};

        for (const key in after) {
            if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                let valBefore = before[key];
                let valAfter = after[key];

                if (typeof valBefore === 'object') valBefore = JSON.stringify(valBefore);
                if (typeof valAfter === 'object') valAfter = JSON.stringify(valAfter);

                changesList.push(`${key}: ${valBefore} -> ${valAfter}`);
            }
        }
        if (changesList.length > 0) {
            details.push(`Alterações: [${changesList.join(', ')}]`);
        }
    }

    return details.join(' | ') || 'Sem detalhes';
}

// Test Cases
const tests = [
    {
        name: 'Export Clients',
        log: {
            action: 'export',
            entity: 'dados',
            details: { tipo: 'clientes', formato: 'xlsx', quantidade: 15, periodo: { inicio: '2025-01-01', fim: '2025-01-31' } }
        },
        expectedIncludes: ['Tipo: clientes', 'Qtd: 15', 'Período: 2025-01-01']
    },
    {
        name: 'Delete Data',
        log: {
            action: 'delete',
            entity: 'dados',
            details: { tipos: ['Clientes', 'Registros'], resultado: '10 clientes apagados' }
        },
        expectedIncludes: ['Tipos: Clientes, Registros', 'Resultado: 10 clientes apagados']
    },
    {
        name: 'Edit Client',
        log: {
            action: 'edit',
            entity: 'cliente',
            details: {
                nome: 'João',
                changes: {
                    before: { nome: 'João', telefone: '000' },
                    after: { nome: 'João', telefone: '111' }
                }
            }
        },
        expectedIncludes: ['Nome: João', 'telefone: 000 -> 111']
    }
];

let failed = 0;
tests.forEach(test => {
    const result = formatLogDetails(test.log);
    const passed = test.expectedIncludes.every(sub => result.includes(sub));
    console.log(`Test '${test.name}': ${passed ? 'PASS' : 'FAIL'}`);
    if (!passed) {
        console.log(`   Result: ${result}`);
        console.log(`   Expected to include: ${test.expectedIncludes}`);
        failed++;
    }
});

if (failed === 0) {
    console.log('All tests passed.');
} else {
    process.exit(1);
}
