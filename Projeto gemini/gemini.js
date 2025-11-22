let dados = [];

// Element getters (lazy, in case HTML structure changes)
function getResultsContainer() {
    return document.querySelector('#results') || document.querySelector('.card-container') || document.body;
}

function getInput() {
    return document.querySelector('#input-busca') || document.querySelector('.search-input');
}

function getScopeSelect() {
    return document.querySelector('#search-scope') || document.querySelector('.search-scope');
}

async function carregarDados() {
    if (dados && dados.length) return dados;
    try {
        const resposta = await fetch('gemini.json');
        dados = await resposta.json();
    } catch (e) {
        console.error('Erro ao carregar dados:', e);
        dados = [];
    }
    return dados;
}

// Função principal chamada pelo formulário
async function iniciarBusca() {
    const queryInput = getInput();
    const scopeSelect = getScopeSelect();
    const container = getResultsContainer();

    await carregarDados();

    const termo = (queryInput && queryInput.value) ? queryInput.value.trim().toLowerCase() : '';
    const scope = (scopeSelect && scopeSelect.value) ? scopeSelect.value : 'all';

    const resultados = filtrarDados(dados, termo, scope);
    renderizarCards(resultados, container, termo);
}

// Filtra os dados por termo e escopo (scope)
function filtrarDados(lista, termo, scope) {
    if (!lista || !lista.length) return [];

    return lista.filter(item => {
        // Normaliza campos
        const nome = (item.nome || '').toLowerCase();
        const descricao = (item.descricao || '').toLowerCase();
        const categoria = (item.categoria || '').toLowerCase();

        // Filtrar por scope quando não for 'all'
        if (scope && scope !== 'all') {
            const s = scope.toLowerCase();
            const matchesScope = categoria.includes(s)
                || descricao.includes(s)
                || nome.includes(s)
                || (item.link && item.link.toLowerCase().includes(s))
                || (s === 'data' && (descricao.includes('dados') || descricao.includes('data')))
                || (s === 'web' && descricao.includes('web'))
                || (s === 'mobile' && (descricao.includes('mobile') || descricao.includes('android') || descricao.includes('ios') || descricao.includes('app')));

            if (!matchesScope) return false;
        }

        // Se não houver termo, mantém (já filtrado por scope acima)
        if (!termo) return true;

        // Suporta múltiplas palavras no termo: todas devem aparecer em algum campo (AND)
        const tokens = termo.split(/\s+/).filter(Boolean);
        return tokens.every(t => nome.includes(t) || descricao.includes(t) || categoria.includes(t));
    });
}

// Renderiza lista de cards em container (limpa antes)
function renderizarCards(lista, container, termo) {
    if (!container) return;
    container.innerHTML = ''; // limpa resultados anteriores

    if (!lista || lista.length === 0) {
        const msg = document.createElement('div');
        msg.className = 'no-results';
        msg.textContent = termo ? `Nenhuma linguagem encontrada para "${termo}".` : 'Nenhuma linguagem disponível.';
        msg.style.color = 'var(--on-surface-secondary-color)';
        msg.style.padding = '1rem';
        container.appendChild(msg);
        return;
    }

    for (const item of lista) {
        const article = document.createElement('article');
        article.className = 'result-item card';

        // Safe HTML: escapando campos simples
        const nome = escapeHtml(item.nome || '');
        const ano = escapeHtml(item.ano || '');
        const descricao = escapeHtml(item.descricao || '');
        const link = item.link ? item.link : '#';

        article.innerHTML = `
            <h2>${nome}</h2>
            <h3>${ano}</h3>
            <p>${descricao}</p>
            <a href="${link}" target="_blank" rel="noopener">Saiba mais</a>
        `;

        container.appendChild(article);
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Exporta função para o escopo global (caso o HTML chame diretamente)
window.iniciarBusca = iniciarBusca;