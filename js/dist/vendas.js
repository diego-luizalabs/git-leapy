"use strict";
// vendas.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
console.log("LOG INICIAL: js/vendas.ts foi lido e está sendo processado.");
try {
    if (typeof Chart !== 'undefined' && typeof Chart.register === 'function' &&
        typeof ChartDataLabels !== 'undefined' && ChartDataLabels) {
        Chart.register(ChartDataLabels);
        // console.log("DEBUG VENDAS (TS): chartjs-plugin-datalabels registrado (se disponível).");
    }
    else {
        if (typeof Chart === 'undefined' || typeof Chart.register !== 'function') {
            // console.warn("AVISO VENDAS (TS): Biblioteca Chart.js ou Chart.register não disponível.");
        }
        if (typeof ChartDataLabels === 'undefined' || !ChartDataLabels) {
            // console.info("INFO VENDAS (TS): Plugin ChartDataLabels não encontrado. Rótulos nos gráficos podem não aparecer.");
        }
    }
}
catch (error) {
    console.error("ERRO VENDAS (TS): Falha ao tentar registrar ChartDataLabels:", error);
}
const URL_PLANILHA_CSV_VENDAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTc4Li4jKj5mCtp-LqMGZpZQ_YQftOHcYV-doFLokTgEcrRcsgR-N6GM7q4aPZid_lq6YKAJON_1IZO/pub?gid=896325874&single=true&output=csv';
let graficoTendenciaInstanceVendas = null;
let dadosCompletosVendas = [];
let colunasDefinidasCSVVendas = [];
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG VENDAS (TS): DOMContentLoaded INICIADO.");
    if (sessionStorage.getItem('isXuxuGlowAdminLoggedIn') !== 'true') {
        console.warn("DOM Vendas (TS): Usuário não logado. Redirecionando.");
        window.location.href = 'index.html';
        return;
    }
    console.log("DOM Vendas (TS): Usuário logado.");
    const NOME_COLUNA_VALOR_VENDA = 'Total da Semana';
    const NOME_COLUNA_DATA = 'Data';
    const COL_S1 = 'Primeira Semana';
    const COL_S2 = 'Segunda Semana';
    const COL_S3 = 'Terceira Semana';
    const COL_S4 = 'Quarta Semana';
    const computedStyles = getComputedStyle(document.documentElement);
    const corTextoPrincipalDark = computedStyles.getPropertyValue('--cor-texto-principal-dark').trim() || '#e5e7eb';
    const corTextoSecundarioDark = computedStyles.getPropertyValue('--cor-texto-secundario-dark').trim() || '#9ca3af';
    const chartDatasetColorsDark = [
        computedStyles.getPropertyValue('--cor-primaria-accent-dark').trim() || '#8B5CF6',
        computedStyles.getPropertyValue('--cor-secundaria-accent-dark').trim() || '#34d399',
        '#ef4444',
        '#facc15', '#818cf8', '#a78bfa', '#f472b6', '#60a5fa',
        '#f97316', '#14b8a6', '#ec4899', '#0ea5e9'
    ];
    const corLinhaTendencia = chartDatasetColorsDark[0];
    const corAreaTendencia = `${corLinhaTendencia}4D`;
    const corLinhaExemplo = chartDatasetColorsDark[2];
    const kpiTotalVendasEl = document.getElementById('kpi-total-vendas');
    const kpiNumTransacoesEl = document.getElementById('kpi-num-transacoes');
    const kpiTicketMedioEl = document.getElementById('kpi-ticket-medio');
    const ctxTendenciaCanvas = document.getElementById('grafico-tendencia-vendas');
    const corpoTabelaVendas = document.getElementById('corpo-tabela-vendas');
    const cabecalhoTabelaVendasEl = document.getElementById('cabecalho-tabela');
    const filtroGeralInputVendas = document.getElementById('filtro-geral');
    const loadingMessageDivVendas = document.getElementById('loading-message');
    const errorMessageDivVendas = document.getElementById('error-message');
    const noDataMessageDivVendas = document.getElementById('no-data-message');
    const sidebarVendas = document.querySelector('.dashboard-sidebar');
    const menuToggleBtnVendas = document.querySelector('.menu-toggle-btn');
    const bodyVendas = document.body;
    const navLinksVendas = document.querySelectorAll('.sidebar-nav a');
    const sectionsVendas = document.querySelectorAll('.dashboard-page-content > .dashboard-section');
    const tituloSecaoHeaderVendas = document.getElementById('dashboard-titulo-secao');
    if (sidebarVendas && menuToggleBtnVendas) {
        menuToggleBtnVendas.addEventListener('click', () => {
            const isVisible = sidebarVendas.classList.toggle('sidebar-visible');
            bodyVendas.classList.toggle('sidebar-overlay-active', isVisible);
            menuToggleBtnVendas.setAttribute('aria-expanded', isVisible.toString());
        });
        bodyVendas.addEventListener('click', (event) => {
            if (bodyVendas.classList.contains('sidebar-overlay-active') && sidebarVendas.classList.contains('sidebar-visible')) {
                const target = event.target;
                if (!sidebarVendas.contains(target) && !menuToggleBtnVendas.contains(target)) {
                    sidebarVendas.classList.remove('sidebar-visible');
                    bodyVendas.classList.remove('sidebar-overlay-active');
                    menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
    function updateActiveLinkAndTitleVendas(activeLink) {
        navLinksVendas.forEach(navLink => navLink.classList.remove('active'));
        if (activeLink) {
            activeLink.classList.add('active');
            if (tituloSecaoHeaderVendas) {
                let titulo = activeLink.dataset.title || (activeLink.textContent || '').trim() || 'Dashboard';
                if (!activeLink.dataset.title) {
                    const iconSpan = activeLink.querySelector('.icon');
                    if (iconSpan && iconSpan.textContent) {
                        titulo = titulo.replace(iconSpan.textContent.trim(), '').trim();
                    }
                }
                const lowerCaseTitle = titulo.toLowerCase();
                tituloSecaoHeaderVendas.textContent = (lowerCaseTitle === 'dashboard' || lowerCaseTitle === 'dashboard principal' || lowerCaseTitle === 'visão geral das vendas')
                    ? 'Visão Geral das Vendas'
                    : titulo;
            }
        }
    }
    function showSectionVendas(targetId) {
        let sectionFoundAndDisplayed = false;
        if (!sectionsVendas || sectionsVendas.length === 0) {
            console.warn("showSectionVendas: Nenhuma seção encontrada.");
            return false;
        }
        sectionsVendas.forEach(section => {
            if (section.id === targetId) {
                section.style.display = 'block';
                section.classList.add('active-section');
                sectionFoundAndDisplayed = true;
                section.querySelectorAll('.kpi-card, .grafico-card, .card-secao, .secao-tabela-detalhada').forEach((card, index) => {
                    card.style.animation = 'none';
                    void card.offsetWidth;
                    card.style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                if (targetId === 'secao-dashboard') {
                    if (dadosCompletosVendas.length > 0) {
                        if (noDataMessageDivVendas)
                            noDataMessageDivVendas.style.display = 'none';
                        calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                        const termoFiltro = (filtroGeralInputVendas === null || filtroGeralInputVendas === void 0 ? void 0 : filtroGeralInputVendas.value.toLowerCase()) || '';
                        renderizarTabelaVendas(dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoFiltro)));
                    }
                    else {
                        renderizarTabelaVendas([]);
                        calcularKPIsEVisualizacoesVendas([]);
                        if ((loadingMessageDivVendas === null || loadingMessageDivVendas === void 0 ? void 0 : loadingMessageDivVendas.style.display) !== 'flex' && (errorMessageDivVendas === null || errorMessageDivVendas === void 0 ? void 0 : errorMessageDivVendas.style.display) !== 'flex') {
                            if (noDataMessageDivVendas)
                                mostrarGlobalMessageVendas(noDataMessageDivVendas, 'Nenhum dado de vendas para exibir no dashboard no momento.');
                        }
                    }
                }
            }
            else {
                section.style.display = 'none';
                section.classList.remove('active-section');
            }
        });
        if (!sectionFoundAndDisplayed)
            console.warn(`showSectionVendas: Seção com ID '${targetId}' não encontrada.`);
        return sectionFoundAndDisplayed;
    }
    navLinksVendas.forEach(link => {
        link.addEventListener('click', function (event) {
            const currentAnchor = this;
            const hrefAttribute = currentAnchor.getAttribute('href');
            const dataTargetSection = currentAnchor.dataset.target;
            if (hrefAttribute && hrefAttribute.includes('.html') && !hrefAttribute.startsWith('#')) {
                return;
            }
            if (hrefAttribute && (hrefAttribute.startsWith('http://') || hrefAttribute.startsWith('https://') || hrefAttribute.startsWith('//'))) {
                return;
            }
            event.preventDefault();
            let sectionIdToDisplay = dataTargetSection ||
                (hrefAttribute && hrefAttribute.startsWith('#') && hrefAttribute.length > 1 ? `secao-${hrefAttribute.substring(1)}` : 'secao-dashboard');
            if (hrefAttribute === '#dashboard')
                sectionIdToDisplay = 'secao-dashboard';
            if (showSectionVendas(sectionIdToDisplay)) {
                updateActiveLinkAndTitleVendas(currentAnchor);
                const newHash = sectionIdToDisplay === 'secao-dashboard' ? '#dashboard' : (sectionIdToDisplay.startsWith('secao-') ? `#${sectionIdToDisplay.substring(6)}` : `#${sectionIdToDisplay}`);
                if (window.location.hash !== newHash && newHash !== '#undefined' && newHash !== '#null') {
                    history.pushState({ section: sectionIdToDisplay }, "", newHash);
                }
            }
            if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                sidebarVendas.classList.remove('sidebar-visible');
                bodyVendas.classList.remove('sidebar-overlay-active');
                menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
            }
        });
    });
    function handlePageLoadAndNavigationVendas() {
        const currentPathFilename = window.location.pathname.split('/').pop() || 'index.html';
        const hash = location.hash.substring(1);
        let activeLinkElement = null;
        let targetSectionIdFromLoad = 'secao-dashboard';
        if (currentPathFilename.endsWith('index.html') || currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html') || currentPathFilename === "") {
            if (hash) {
                activeLinkElement = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
                targetSectionIdFromLoad = (activeLinkElement === null || activeLinkElement === void 0 ? void 0 : activeLinkElement.dataset.target) || `secao-${hash}`;
            }
            else {
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
                targetSectionIdFromLoad = (activeLinkElement === null || activeLinkElement === void 0 ? void 0 : activeLinkElement.dataset.target) || 'secao-dashboard';
            }
        }
        else {
            activeLinkElement = document.querySelector(`.sidebar-nav a[href$="${currentPathFilename}"]`);
            if (activeLinkElement)
                updateActiveLinkAndTitleVendas(activeLinkElement);
            return;
        }
        if (!showSectionVendas(targetSectionIdFromLoad)) {
            if (showSectionVendas('secao-dashboard')) {
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
            }
        }
        updateActiveLinkAndTitleVendas(activeLinkElement);
    }
    window.addEventListener('popstate', () => handlePageLoadAndNavigationVendas());
    function mostrarGlobalMessageVendas(elemento, mensagem = '', mostrarSpinner = false) {
        const todasMensagensGlobais = [loadingMessageDivVendas, errorMessageDivVendas, noDataMessageDivVendas];
        todasMensagensGlobais.forEach(msgEl => { if (msgEl && msgEl !== elemento)
            msgEl.style.display = 'none'; });
        if (elemento) {
            elemento.innerHTML = '';
            if (mostrarSpinner) {
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                elemento.appendChild(spinner);
            }
            if (mensagem)
                elemento.appendChild(document.createTextNode(mostrarSpinner ? ' ' + mensagem : mensagem));
            elemento.style.display = 'flex';
        }
    }
    function processarCSVVendas(textoCsv) {
        const todasLinhasTexto = textoCsv.trim().split(/\r\n|\n|\r/);
        if (todasLinhasTexto.length === 0) {
            return { cabecalhos: [], linhas: [] };
        }
        const cabecalhoLinha = todasLinhasTexto.shift();
        if (!cabecalhoLinha || cabecalhoLinha.trim() === '') {
            console.warn("processarCSVVendas: Cabeçalho vazio ou ausente.");
            return { cabecalhos: [], linhas: [] };
        }
        const cabecalhos = cabecalhoLinha.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        colunasDefinidasCSVVendas = cabecalhos;
        const linhasProcessadas = todasLinhasTexto
            .filter(linhaTexto => linhaTexto.trim() !== '')
            .map((linhaTexto) => {
            const valores = [];
            let dentroDeAspas = false;
            let valorAtual = '';
            for (let i = 0; i < linhaTexto.length; i++) {
                const char = linhaTexto[i];
                if (char === '"') {
                    if (dentroDeAspas && i + 1 < linhaTexto.length && linhaTexto[i + 1] === '"') {
                        valorAtual += '"';
                        i++;
                        continue;
                    }
                    dentroDeAspas = !dentroDeAspas;
                }
                else if (char === ',' && !dentroDeAspas) {
                    valores.push(valorAtual.trim());
                    valorAtual = '';
                }
                else {
                    valorAtual += char;
                }
            }
            valores.push(valorAtual.trim());
            const linhaObj = {};
            cabecalhos.forEach((cabecalho, index) => {
                let valorFinal = valores[index] !== undefined ? valores[index] : '';
                linhaObj[cabecalho] = valorFinal;
            });
            return linhaObj;
        });
        return { cabecalhos, linhas: linhasProcessadas };
    }
    function formatarMoedaVendas(valor) {
        let numValor = typeof valor === 'string' ? parseFloat(valor.replace("R$", "").replace(/\./g, '').replace(',', '.').trim()) : Number(valor);
        if (isNaN(numValor))
            return 'R$ 0,00';
        return numValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    function calcularKPIsEVisualizacoesVendas(dados) {
        console.log("DEBUG VENDAS (TS calcularKPIs): INICIADO com dados.length:", dados.length);
        if (kpiTotalVendasEl)
            kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
        if (kpiNumTransacoesEl)
            kpiNumTransacoesEl.textContent = '0';
        if (kpiTicketMedioEl)
            kpiTicketMedioEl.textContent = formatarMoedaVendas(0);
        if (graficoTendenciaInstanceVendas) {
            graficoTendenciaInstanceVendas.destroy();
            graficoTendenciaInstanceVendas = null;
        }
        const clearCanvasMessage = (canvas) => {
            if (canvas && canvas.parentElement) {
                canvas.parentElement.querySelectorAll('.chart-message').forEach(msg => msg.remove());
            }
        };
        clearCanvasMessage(ctxTendenciaCanvas);
        const createMessageForCanvas = (canvas, text) => {
            if (canvas && canvas.parentElement && !canvas.parentElement.querySelector('.chart-message')) {
                const p = document.createElement('p');
                p.textContent = text;
                p.className = 'chart-message';
                p.style.textAlign = 'center';
                p.style.padding = '20px';
                p.style.color = corTextoSecundarioDark;
                canvas.parentElement.appendChild(p);
            }
        };
        if (dados.length === 0) {
            console.log("DEBUG VENDAS (TS calcularKPIs): Sem dados para KPIs e gráficos.");
            createMessageForCanvas(ctxTendenciaCanvas, 'Sem dados para o gráfico de tendência.');
            return;
        }
        let totalVendasNumericoGlobal = 0;
        let unidadesSemana1 = 0, unidadesSemana2 = 0, unidadesSemana3 = 0, unidadesSemana4 = 0;
        const nomeColunaValorRealKPI = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === NOME_COLUNA_VALOR_VENDA.toLowerCase());
        const colS1Real = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === COL_S1.toLowerCase());
        const colS2Real = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === COL_S2.toLowerCase());
        const colS3Real = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === COL_S3.toLowerCase());
        const colS4Real = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === COL_S4.toLowerCase());
        if (!nomeColunaValorRealKPI) {
            console.error(`ERRO KPI: Coluna de valor ('${NOME_COLUNA_VALOR_VENDA}') NÃO encontrada no CSV. Cabeçalhos: [${colunasDefinidasCSVVendas.join(', ')}]`);
        }
        dados.forEach((item) => {
            if (nomeColunaValorRealKPI) {
                const valorVendaOriginal = String(item[nomeColunaValorRealKPI] || '0');
                const valorVendaStr = valorVendaOriginal.replace("R$", "").replace(/\./g, '').replace(',', '.').trim();
                const valorItemNumerico = parseFloat(valorVendaStr);
                if (!isNaN(valorItemNumerico)) {
                    totalVendasNumericoGlobal += valorItemNumerico;
                }
            }
            if (colS1Real)
                unidadesSemana1 += parseInt(String(item[colS1Real] || '0')) || 0;
            if (colS2Real)
                unidadesSemana2 += parseInt(String(item[colS2Real] || '0')) || 0;
            if (colS3Real)
                unidadesSemana3 += parseInt(String(item[colS3Real] || '0')) || 0;
            if (colS4Real)
                unidadesSemana4 += parseInt(String(item[colS4Real] || '0')) || 0;
        });
        const numTransacoes = dados.length;
        const ticketMedio = numTransacoes > 0 && totalVendasNumericoGlobal > 0 ? totalVendasNumericoGlobal / numTransacoes : 0;
        if (kpiTotalVendasEl)
            kpiTotalVendasEl.textContent = formatarMoedaVendas(totalVendasNumericoGlobal);
        if (kpiNumTransacoesEl)
            kpiNumTransacoesEl.textContent = numTransacoes.toString();
        if (kpiTicketMedioEl)
            kpiTicketMedioEl.textContent = formatarMoedaVendas(ticketMedio);
        if (colS1Real && colS2Real && colS3Real && colS4Real && ctxTendenciaCanvas && typeof Chart !== 'undefined') {
            const labelsSemanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
            const dadosSemanasReais = [unidadesSemana1, unidadesSemana2, unidadesSemana3, unidadesSemana4];
            const dadosSemanasExemploLojaComum = [
                Math.max(0, Math.floor(unidadesSemana1 * 0.6)),
                Math.max(0, Math.floor(unidadesSemana2 * 0.5)),
                Math.max(0, Math.floor(unidadesSemana3 * 0.7)),
                Math.max(0, Math.floor(unidadesSemana4 * 0.4))
            ];
            if (graficoTendenciaInstanceVendas)
                graficoTendenciaInstanceVendas.destroy();
            graficoTendenciaInstanceVendas = new Chart(ctxTendenciaCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labelsSemanas,
                    datasets: [
                        {
                            label: 'Produtos Vendidos', // <<< LABEL AJUSTADO AQUI >>>
                            data: dadosSemanasReais,
                            borderColor: corLinhaTendencia,
                            backgroundColor: corAreaTendencia,
                            tension: 0.3,
                            fill: true,
                            pointBackgroundColor: corLinhaTendencia,
                            pointBorderColor: corTextoPrincipalDark,
                            order: 1
                        },
                        {
                            label: 'Loja Comum',
                            data: dadosSemanasExemploLojaComum,
                            borderColor: corLinhaExemplo,
                            backgroundColor: `${corLinhaExemplo}1A`,
                            tension: 0.3,
                            fill: false,
                            borderDash: [5, 5],
                            pointRadius: 3,
                            pointBackgroundColor: corLinhaExemplo,
                            order: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            bottom: 20
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, ticks: { color: corTextoSecundarioDark, callback: (v) => Number.isInteger(v) ? v : null } },
                        x: { ticks: { color: corTextoSecundarioDark }, grid: { display: false } }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                color: corTextoSecundarioDark,
                                padding: 15
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (c) => `${c.dataset.label || 'Unidades'}: ${c.raw}`
                            }
                        }
                    }
                }
            });
        }
        else {
            console.warn("VENDAS.TS: Não foi possível renderizar o gráfico de tendência semanal. Verifique se as colunas semanais existem no CSV e se o canvas 'grafico-tendencia-vendas' está no HTML.");
            createMessageForCanvas(ctxTendenciaCanvas, 'Dados semanais de unidades não encontrados no CSV.');
        }
        console.log("INFO VENDAS (TS): Lógica do gráfico de Vendas por Categoria foi removida, pois o elemento HTML correspondente não foi encontrado.");
    }
    function renderizarTabelaVendas(dadosParaRenderizar) {
        if (!cabecalhoTabelaVendasEl) {
            console.error("Vendas.ts FATAL: Elemento <tr> cabeçalho (ID: cabecalho-tabela) NÃO ENCONTRADO!");
            return;
        }
        if (!corpoTabelaVendas) {
            console.error("Vendas.ts FATAL: Elemento <tbody> (ID: corpo-tabela-vendas) NÃO ENCONTRADO!");
            return;
        }
        cabecalhoTabelaVendasEl.innerHTML = '';
        corpoTabelaVendas.innerHTML = '';
        if (colunasDefinidasCSVVendas.length > 0) {
            colunasDefinidasCSVVendas.forEach(textoCabecalho => {
                const th = document.createElement('th');
                th.textContent = textoCabecalho;
                const thLower = textoCabecalho.toLowerCase();
                if (thLower.includes('valor') || thLower.includes('preço') || thLower.includes('total') ||
                    thLower.includes('semana') || thLower.includes('unidades') ||
                    thLower.includes('qtd') || thLower.includes('quantidade') || thLower.includes('número') || thLower.includes('id')) {
                    th.classList.add('coluna-numero');
                }
                cabecalhoTabelaVendasEl.appendChild(th);
            });
        }
        else if (dadosParaRenderizar.length > 0) {
            Object.keys(dadosParaRenderizar[0]).forEach(key => {
                const th = document.createElement('th');
                th.textContent = key;
                cabecalhoTabelaVendasEl.appendChild(th);
            });
        }
        if (dadosParaRenderizar.length === 0) {
            const numColunas = Math.max(colunasDefinidasCSVVendas.length, 1);
            const mensagem = (filtroGeralInputVendas === null || filtroGeralInputVendas === void 0 ? void 0 : filtroGeralInputVendas.value.trim()) !== ''
                ? 'Nenhuma venda encontrada para o filtro aplicado.'
                : 'Nenhum dado de vendas para exibir.';
            corpoTabelaVendas.innerHTML = `<tr><td colspan="${numColunas}" style="text-align:center; padding: 20px; color: ${corTextoSecundarioDark};">${mensagem}</td></tr>`;
            return;
        }
        dadosParaRenderizar.forEach((linhaObj) => {
            const tr = corpoTabelaVendas.insertRow();
            (colunasDefinidasCSVVendas.length > 0 ? colunasDefinidasCSVVendas : Object.keys(linhaObj)).forEach(cabecalho => {
                const td = tr.insertCell();
                let valor = String(linhaObj[cabecalho] !== undefined ? linhaObj[cabecalho] : '');
                const cabecalhoLower = cabecalho.toLowerCase();
                const nomeColunaValorRealCSV = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === NOME_COLUNA_VALOR_VENDA.toLowerCase());
                if ((nomeColunaValorRealCSV && cabecalho.toLowerCase() === nomeColunaValorRealCSV.toLowerCase()) ||
                    cabecalhoLower.includes('preço') || cabecalhoLower.includes('valor total')) {
                    td.textContent = formatarMoedaVendas(valor);
                    td.classList.add('coluna-numero');
                }
                else if (cabecalhoLower.includes('semana') || cabecalhoLower.includes('unidades') ||
                    cabecalhoLower.includes('qtd') || cabecalhoLower.includes('id')) {
                    td.textContent = valor;
                    td.classList.add('coluna-numero');
                }
                else {
                    td.textContent = valor;
                }
            });
        });
    }
    function filtrarLinhaVendas(linha, termoBusca) {
        if (!termoBusca)
            return true;
        const termoLower = termoBusca.toLowerCase();
        const colunasParaBusca = colunasDefinidasCSVVendas.length > 0 ? colunasDefinidasCSVVendas : Object.keys(linha);
        return colunasParaBusca.some(cabecalho => String(linha[cabecalho]).toLowerCase().includes(termoLower));
    }
    function carregarDadosVendas() {
        return __awaiter(this, void 0, void 0, function* () {
            if (loadingMessageDivVendas)
                mostrarGlobalMessageVendas(loadingMessageDivVendas, 'Carregando dados...', true);
            if (errorMessageDivVendas)
                errorMessageDivVendas.style.display = 'none';
            if (noDataMessageDivVendas)
                noDataMessageDivVendas.style.display = 'none';
            if (cabecalhoTabelaVendasEl)
                cabecalhoTabelaVendasEl.innerHTML = '';
            if (corpoTabelaVendas) {
                const numCols = Math.max(colunasDefinidasCSVVendas.length, 1);
                corpoTabelaVendas.innerHTML = `<tr><td colspan="${numCols}" style="text-align:center; padding:20px; color:${corTextoSecundarioDark};">Carregando dados...</td></tr>`;
            }
            if (!URL_PLANILHA_CSV_VENDAS || URL_PLANILHA_CSV_VENDAS.length < 50) {
                mostrarGlobalMessageVendas(errorMessageDivVendas, 'Erro: URL da planilha CSV inválida ou não configurada.');
                renderizarTabelaVendas([]);
                calcularKPIsEVisualizacoesVendas([]);
                return;
            }
            try {
                const resposta = yield fetch(URL_PLANILHA_CSV_VENDAS, { cache: 'no-store' });
                if (!resposta.ok)
                    throw new Error(`Falha ao buscar CSV da planilha (${resposta.status} ${resposta.statusText}).`);
                const textoCsv = yield resposta.text();
                if (!textoCsv || textoCsv.trim() === '')
                    throw new Error('Arquivo CSV da planilha está vazio ou inválido.');
                const { linhas } = processarCSVVendas(textoCsv);
                dadosCompletosVendas = linhas;
                if (loadingMessageDivVendas)
                    loadingMessageDivVendas.style.display = 'none';
                if (typeof handlePageLoadAndNavigationVendas === "function") {
                    handlePageLoadAndNavigationVendas();
                }
                else {
                    console.error("ERRO FATAL: handlePageLoadAndNavigationVendas não está definida ao final de carregarDadosVendas!");
                    const dashboardSectionEl = document.getElementById('secao-dashboard');
                    if (dashboardSectionEl) {
                        dashboardSectionEl.style.display = 'block';
                        dashboardSectionEl.classList.add('active-section');
                        if (tituloSecaoHeaderVendas)
                            tituloSecaoHeaderVendas.textContent = 'Visão Geral das Vendas';
                        if (dadosCompletosVendas.length > 0) {
                            calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                            renderizarTabelaVendas(dadosCompletosVendas);
                        }
                        else {
                            renderizarTabelaVendas([]);
                            calcularKPIsEVisualizacoesVendas([]);
                            if (noDataMessageDivVendas)
                                mostrarGlobalMessageVendas(noDataMessageDivVendas, 'Nenhum dado de vendas para exibir.');
                        }
                    }
                }
            }
            catch (erro) {
                console.error("ERRO VENDAS (TS carregarDadosVendas):", erro);
                if (loadingMessageDivVendas)
                    loadingMessageDivVendas.style.display = 'none';
                mostrarGlobalMessageVendas(errorMessageDivVendas, `Erro ao carregar dados: ${(erro instanceof Error ? erro.message : 'Erro desconhecido.')}`);
                renderizarTabelaVendas([]);
                calcularKPIsEVisualizacoesVendas([]);
            }
        });
    }
    if (filtroGeralInputVendas) {
        filtroGeralInputVendas.addEventListener('input', () => {
            const termoBusca = filtroGeralInputVendas.value.trim().toLowerCase();
            const dashboardSection = document.getElementById('secao-dashboard');
            if ((dashboardSection === null || dashboardSection === void 0 ? void 0 : dashboardSection.style.display) === 'block' || (dashboardSection === null || dashboardSection === void 0 ? void 0 : dashboardSection.classList.contains('active-section'))) {
                const dadosFiltrados = dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoBusca));
                renderizarTabelaVendas(dadosFiltrados);
            }
        });
    }
    carregarDadosVendas();
});
//# sourceMappingURL=vendas.js.map