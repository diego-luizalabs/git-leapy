"use strict";
// /Users/diegosantos/Desktop/git-leapy/git-leapy/js/vendas.ts
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
if (typeof Chart !== 'undefined' && typeof ChartDataLabels !== 'undefined' && ChartDataLabels) {
    Chart.register(ChartDataLabels);
    console.log("DEBUG VENDAS (TS): chartjs-plugin-datalabels (global) e tentativa de registro feita.");
}
else {
    console.error("ERRO VENDAS (TS): Chart ou ChartDataLabels (global) não está definido. O plugin datalabels PODE NÃO FUNCIONAR. Verifique inclusões no HTML.");
}
const URL_PLANILHA_CSV_VENDAS = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIfu_bkc8cu1dNbItO9zktGmn4JjNjQEoLAzGcG9rZDyfDyDp4ISEqpPKzIFTWFrMNVIz05V3NTpGT/pub?output=csv';
let graficoCategoriaInstanceVendas = null;
let graficoTendenciaInstanceVendas = null;
document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG VENDAS (TS): DOMContentLoaded INICIADO.");
    if (sessionStorage.getItem('isXuxuGlowAdminLoggedIn') !== 'true') {
        console.warn("DOM Vendas (TS): Usuário não logado. Redirecionando.");
        window.location.href = 'index.html';
        return;
    }
    console.log("DOM Vendas (TS): Usuário logado.");
    const NOME_COLUNA_VALOR_VENDA_VENDAS = 'Valor Total';
    const NOME_COLUNA_CATEGORIA_VENDAS = 'Categoria';
    const NOME_COLUNA_DATA_VENDAS = 'Data';
    const computedStyles = getComputedStyle(document.documentElement);
    const corTextoPrincipalDark = computedStyles.getPropertyValue('--cor-texto-principal-dark').trim() || '#e5e7eb';
    const corTextoSecundarioDark = computedStyles.getPropertyValue('--cor-texto-secundario-dark').trim() || '#9ca3af';
    const corBordasDark = computedStyles.getPropertyValue('--cor-bordas-dark').trim() || '#374151';
    const corFundoCardsDark = computedStyles.getPropertyValue('--cor-fundo-cards-dark').trim() || '#1f2937';
    const chartDatasetColorsDark = [
        computedStyles.getPropertyValue('--cor-primaria-accent-dark').trim() || '#8B5CF6',
        computedStyles.getPropertyValue('--cor-secundaria-accent-dark').trim() || '#34d399',
        '#f43f5e', '#facc15', '#818cf8', '#a78bfa', '#f472b6', '#60a5fa'
    ];
    const corLinhaTendencia = chartDatasetColorsDark[0];
    const corAreaTendencia = `${corLinhaTendencia}4D`;
    const kpiTotalVendasEl = document.getElementById('kpi-total-vendas');
    const kpiNumTransacoesEl = document.getElementById('kpi-num-transacoes');
    const kpiTicketMedioEl = document.getElementById('kpi-ticket-medio');
    const ctxCategoriaCanvas = document.getElementById('grafico-vendas-categoria');
    const ctxTendenciaCanvas = document.getElementById('grafico-tendencia-vendas');
    const corpoTabelaVendas = document.getElementById('corpo-tabela-vendas');
    const cabecalhoTabelaVendasEl = document.getElementById('cabecalho-tabela');
    const filtroGeralInputVendas = document.getElementById('filtro-geral');
    const loadingMessageDivVendas = document.getElementById('loading-message');
    const errorMessageDivVendas = document.getElementById('error-message');
    const noDataMessageDivVendas = document.getElementById('no-data-message');
    let dadosCompletosVendas = [];
    let colunasDefinidasCSVVendas = [];
    // --- Restante das declarações de variáveis e lógicas de sidebar/navegação (mantidas como antes) ---
    const sidebarVendas = document.querySelector('.dashboard-sidebar');
    const menuToggleBtnVendas = document.querySelector('.menu-toggle-btn');
    const bodyVendas = document.body;
    const navLinksVendas = document.querySelectorAll('.sidebar-nav a');
    const sectionsVendas = document.querySelectorAll('.dashboard-page-content > .dashboard-section');
    const tituloSecaoHeaderVendas = document.getElementById('dashboard-titulo-secao');
    if (sidebarVendas && menuToggleBtnVendas) {
        menuToggleBtnVendas.addEventListener('click', () => {
            console.log("Vendas.ts: Botão de menu da sidebar clicado.");
            const isVisible = sidebarVendas.classList.toggle('sidebar-visible');
            bodyVendas.classList.toggle('sidebar-overlay-active', isVisible);
            menuToggleBtnVendas.setAttribute('aria-expanded', isVisible.toString());
        });
        bodyVendas.addEventListener('click', (event) => {
            if (bodyVendas.classList.contains('sidebar-overlay-active') && sidebarVendas.classList.contains('sidebar-visible')) {
                const target = event.target;
                if (!sidebarVendas.contains(target) && !menuToggleBtnVendas.contains(target)) {
                    console.log("Vendas.ts: Clique fora da sidebar, fechando sidebar.");
                    sidebarVendas.classList.remove('sidebar-visible');
                    bodyVendas.classList.remove('sidebar-overlay-active');
                    menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
    function updateActiveLinkAndTitleVendas(activeLink) {
        console.log("Vendas.ts: updateActiveLinkAndTitleVendas chamado com link:", activeLink ? activeLink.href : 'null');
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
                if (lowerCaseTitle === 'dashboard' || lowerCaseTitle === 'dashboard principal' || lowerCaseTitle === 'visão geral das vendas') {
                    tituloSecaoHeaderVendas.textContent = 'Visão Geral das Vendas';
                }
                else {
                    tituloSecaoHeaderVendas.textContent = titulo;
                }
                console.log(`Vendas.ts: Título da seção atualizado para '${tituloSecaoHeaderVendas.textContent}'.`);
            }
        }
    }
    function showSectionVendas(targetId) {
        console.log(`DEBUG VENDAS (TS showSection): INICIADO para targetId: '${targetId}'. Comprimento: ${dadosCompletosVendas.length}`);
        let sectionFoundAndDisplayed = false;
        if (!sectionsVendas || sectionsVendas.length === 0) {
            console.warn("Vendas.ts: Nenhuma .dashboard-section encontrada.");
            if (targetId === 'secao-dashboard' && tituloSecaoHeaderVendas) {
                tituloSecaoHeaderVendas.textContent = 'Visão Geral das Vendas';
            }
            return false;
        }
        sectionsVendas.forEach(section => {
            if (section.id === targetId) {
                section.style.display = 'block';
                section.classList.add('active-section');
                console.log(`DEBUG VENDAS (TS showSection): Seção ${targetId} ATIVADA.`);
                section.querySelectorAll('.kpi-card, .grafico-card, .card-secao, .secao-tabela-detalhada').forEach((card, index) => {
                    card.style.animation = 'none';
                    void card.offsetWidth;
                    card.style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                sectionFoundAndDisplayed = true;
                if (targetId === 'secao-dashboard') {
                    if (dadosCompletosVendas.length > 0) {
                        console.log("DEBUG VENDAS (TS showSection): DADOS PRESENTES para secao-dashboard.");
                        if (noDataMessageDivVendas)
                            noDataMessageDivVendas.style.display = 'none';
                        calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                        const termoFiltro = filtroGeralInputVendas ? filtroGeralInputVendas.value : '';
                        renderizarTabelaVendas(dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoFiltro)));
                    }
                    else {
                        console.warn("DEBUG VENDAS (TS showSection): DADOS AUSENTES para secao-dashboard.");
                        if (graficoCategoriaInstanceVendas)
                            graficoCategoriaInstanceVendas.destroy();
                        if (graficoTendenciaInstanceVendas)
                            graficoTendenciaInstanceVendas.destroy();
                        if (corpoTabelaVendas)
                            corpoTabelaVendas.innerHTML = '';
                        if (cabecalhoTabelaVendasEl)
                            cabecalhoTabelaVendasEl.innerHTML = '';
                        if (kpiTotalVendasEl)
                            kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
                        if (kpiNumTransacoesEl)
                            kpiNumTransacoesEl.textContent = '0';
                        if (kpiTicketMedioEl)
                            kpiTicketMedioEl.textContent = formatarMoedaVendas(0);
                        mostrarMensagemVendas(noDataMessageDivVendas, 'Nenhum dado de vendas para exibir no dashboard no momento.');
                    }
                }
            }
            else {
                section.style.display = 'none';
                section.classList.remove('active-section');
            }
        });
        if (!sectionFoundAndDisplayed) {
            console.warn(`Vendas.ts: Nenhuma seção com ID '${targetId}' foi encontrada/exibida.`);
        }
        return sectionFoundAndDisplayed;
    }
    navLinksVendas.forEach(link => {
        link.addEventListener('click', function (event) {
            const currentAnchor = this;
            const hrefAttribute = currentAnchor.getAttribute('href');
            const dataTargetSection = currentAnchor.dataset.target;
            console.log(`DEBUG VENDAS (TS Nav): Link clicado! HREF: ${hrefAttribute}, DataTargetSection: ${dataTargetSection}`);
            if (hrefAttribute && hrefAttribute.includes('.html') && !hrefAttribute.startsWith('#')) {
                const targetUrl = new URL(hrefAttribute, window.location.origin);
                const currentPageUrl = new URL(window.location.href);
                if (targetUrl.pathname !== currentPageUrl.pathname) {
                    console.log(`DEBUG VENDAS (TS Nav): Navegação para OUTRA página HTML (${hrefAttribute}).`);
                    if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                        sidebarVendas.classList.remove('sidebar-visible');
                        bodyVendas.classList.remove('sidebar-overlay-active');
                        menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
                    }
                    return;
                }
            }
            if (hrefAttribute && (hrefAttribute.startsWith('http://') || hrefAttribute.startsWith('https://') || hrefAttribute.startsWith('//'))) {
                console.log(`DEBUG VENDAS (TS Nav): Navegação para URL externa (${hrefAttribute}).`);
                return;
            }
            event.preventDefault();
            console.log(`DEBUG VENDAS (TS Nav): Navegação interna (HREF: '${hrefAttribute}').`);
            let sectionIdToDisplay = null;
            if (dataTargetSection) {
                sectionIdToDisplay = dataTargetSection;
            }
            else if (hrefAttribute && hrefAttribute.startsWith('#') && hrefAttribute.length > 1) {
                sectionIdToDisplay = `secao-${hrefAttribute.substring(1)}`;
            }
            else if (hrefAttribute === '#' || !hrefAttribute) {
                sectionIdToDisplay = 'secao-dashboard';
                console.log(`DEBUG VENDAS (TS Nav): Link com href='${hrefAttribute}', default para ${sectionIdToDisplay}.`);
            }
            if (sectionIdToDisplay) {
                console.log(`DEBUG VENDAS (TS Nav): Tentando exibir seção: ${sectionIdToDisplay}`);
                if (showSectionVendas(sectionIdToDisplay)) {
                    updateActiveLinkAndTitleVendas(currentAnchor);
                    const newHash = sectionIdToDisplay.startsWith('secao-') ? `#${sectionIdToDisplay.substring(6)}` : `#${sectionIdToDisplay}`;
                    if (window.location.hash !== newHash) {
                        if (newHash === '#undefined' || newHash === '#null') {
                            console.warn("DEBUG VENDAS (TS Nav): Tentativa de pushState com hash inválido.");
                        }
                        else {
                            history.pushState({ section: sectionIdToDisplay, page: window.location.pathname }, "", newHash);
                            console.log(`DEBUG VENDAS (TS Nav): Histórico URL atualizado para ${newHash}`);
                        }
                    }
                }
                else {
                    console.warn(`DEBUG VENDAS (TS Nav): showSectionVendas retornou false para ${sectionIdToDisplay}.`);
                }
            }
            else {
                console.warn(`DEBUG VENDAS (TS Nav): Link (${hrefAttribute}) não resultou em sectionIdToDisplay.`);
                updateActiveLinkAndTitleVendas(currentAnchor);
            }
            if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                sidebarVendas.classList.remove('sidebar-visible');
                bodyVendas.classList.remove('sidebar-overlay-active');
                menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
            }
        });
    });
    function handlePageLoadAndNavigationVendas() {
        console.log("DEBUG VENDAS (TS handlePageLoad): INICIADO. Hash:", location.hash, "Path:", window.location.pathname);
        const currentPathFilename = window.location.pathname.split('/').pop() || 'index.html';
        const hash = location.hash.substring(1);
        let activeLinkElement = null;
        let targetSectionIdFromLoad = '';
        if (currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html')) {
            if (hash) {
                activeLinkElement = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
                targetSectionIdFromLoad = (activeLinkElement === null || activeLinkElement === void 0 ? void 0 : activeLinkElement.dataset.target) || `secao-${hash}`;
            }
            else {
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
                targetSectionIdFromLoad = (activeLinkElement === null || activeLinkElement === void 0 ? void 0 : activeLinkElement.dataset.target) || 'secao-dashboard';
            }
            console.log(`DEBUG VENDAS (TS handlePageLoad): Em ${currentPathFilename}. targetSectionIdFromLoad: '${targetSectionIdFromLoad}'`);
            if (!targetSectionIdFromLoad && (activeLinkElement === null || activeLinkElement === void 0 ? void 0 : activeLinkElement.getAttribute('href')) === '#') {
                targetSectionIdFromLoad = 'secao-dashboard';
            }
            if (!showSectionVendas(targetSectionIdFromLoad)) {
                console.warn(`DEBUG VENDAS (TS handlePageLoad): Seção '${targetSectionIdFromLoad}' não encontrada. Fallback 'secao-dashboard'.`);
                if (showSectionVendas('secao-dashboard')) {
                    if (!activeLinkElement || (activeLinkElement && activeLinkElement.dataset.target !== 'secao-dashboard' && activeLinkElement.getAttribute('href') !== '#dashboard')) {
                        activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
                    }
                }
            }
        }
        else {
            activeLinkElement = document.querySelector(`.sidebar-nav a[href$="${currentPathFilename}"]`);
        }
        if (activeLinkElement) {
            updateActiveLinkAndTitleVendas(activeLinkElement);
        }
        else if ((currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html')) && !hash) {
            const dashboardLinkFallback = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
            if (dashboardLinkFallback)
                updateActiveLinkAndTitleVendas(dashboardLinkFallback);
        }
        else if (!activeLinkElement && hash && (currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html'))) {
            const fallbackLinkForHash = document.querySelector(`.sidebar-nav a[data-target="secao-${hash}"]`);
            if (fallbackLinkForHash)
                updateActiveLinkAndTitleVendas(fallbackLinkForHash);
        }
        else {
            console.log(`DEBUG VENDAS (TS handlePageLoad): Nenhum link ativo encontrado. Path: ${currentPathFilename}, Hash: ${hash}`);
        }
    }
    window.addEventListener('popstate', (event) => {
        console.log("DEBUG VENDAS (TS): Evento popstate disparado.", event.state);
        handlePageLoadAndNavigationVendas();
    });
    const mostrarMensagemVendas = (elemento, mensagem = '', mostrarSpinner = false) => {
        if (loadingMessageDivVendas && elemento !== loadingMessageDivVendas)
            loadingMessageDivVendas.style.display = 'none';
        if (errorMessageDivVendas && elemento !== errorMessageDivVendas)
            errorMessageDivVendas.style.display = 'none';
        if (noDataMessageDivVendas && elemento !== noDataMessageDivVendas)
            noDataMessageDivVendas.style.display = 'none';
        if (elemento) {
            elemento.innerHTML = '';
            if (mostrarSpinner) {
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                elemento.appendChild(spinner);
            }
            if (mensagem) {
                elemento.appendChild(document.createTextNode(mostrarSpinner ? ' ' + mensagem : mensagem));
            }
            elemento.style.display = 'flex';
        }
    };
    const processarCSVVendas = (textoCsv) => {
        const todasLinhasTexto = textoCsv.trim().split('\n');
        if (todasLinhasTexto.length === 0 || todasLinhasTexto[0].trim() === '') {
            console.warn("Vendas.ts (processarCSVVendas): CSV vazio.");
            return { cabecalhos: [], linhas: [] };
        }
        const cabecalhoLinha = todasLinhasTexto.shift();
        if (!cabecalhoLinha) {
            console.warn("Vendas.ts (processarCSVVendas): Cabeçalho CSV não encontrado.");
            return { cabecalhos: [], linhas: [] };
        }
        const cabecalhos = cabecalhoLinha.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        colunasDefinidasCSVVendas = cabecalhos;
        const linhasProcessadas = todasLinhasTexto.map((linhaTexto) => {
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
                    valores.push(valorAtual.trim().replace(/^"|"$/g, ''));
                    valorAtual = '';
                }
                else {
                    valorAtual += char;
                }
            }
            valores.push(valorAtual.trim().replace(/^"|"$/g, ''));
            const linhaObj = {};
            cabecalhos.forEach((cabecalho, index) => {
                linhaObj[cabecalho] = valores[index] !== undefined ? valores[index] : '';
            });
            return linhaObj;
        });
        return { cabecalhos, linhas: linhasProcessadas };
    };
    const formatarMoedaVendas = (valor) => {
        let numValor = typeof valor === 'string'
            ? parseFloat(valor.replace(/[R$. ]/g, '').replace(',', '.'))
            : Number(valor);
        if (typeof numValor !== 'number' || isNaN(numValor) || Math.abs(numValor) < 0.005) {
            return 'R$ 0,00';
        }
        return numValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    const calcularKPIsEVisualizacoesVendas = (dados) => {
        console.log("DEBUG VENDAS (TS calcularKPIs): INICIADO com dados.length:", dados.length);
        if (kpiTotalVendasEl)
            kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
        if (kpiNumTransacoesEl)
            kpiNumTransacoesEl.textContent = '0';
        if (kpiTicketMedioEl)
            kpiTicketMedioEl.textContent = formatarMoedaVendas(0);
        if (graficoCategoriaInstanceVendas) {
            graficoCategoriaInstanceVendas.destroy();
            graficoCategoriaInstanceVendas = null;
        }
        if (graficoTendenciaInstanceVendas) {
            graficoTendenciaInstanceVendas.destroy();
            graficoTendenciaInstanceVendas = null;
        }
        const clearCanvasMessage = (canvas) => {
            if (canvas && canvas.parentElement) {
                const existingMessages = canvas.parentElement.querySelectorAll('.chart-message, .chart-reload-message'); // Inclui possível classe da mensagem de recarregar
                existingMessages.forEach(msg => msg.remove());
            }
        };
        clearCanvasMessage(ctxCategoriaCanvas);
        clearCanvasMessage(ctxTendenciaCanvas);
        if (dados.length === 0) {
            console.log("DEBUG VENDAS (TS calcularKPIs): Sem dados, gráficos não renderizados.");
            const createMessageElement = (text) => {
                const p = document.createElement('p');
                p.textContent = text;
                p.className = 'chart-message';
                p.style.textAlign = 'center';
                p.style.padding = '20px';
                p.style.color = corTextoSecundarioDark;
                return p;
            };
            if (ctxCategoriaCanvas && ctxCategoriaCanvas.parentElement) {
                ctxCategoriaCanvas.parentElement.appendChild(createMessageElement('Sem dados de categoria.'));
            }
            if (ctxTendenciaCanvas && ctxTendenciaCanvas.parentElement) {
                ctxTendenciaCanvas.parentElement.appendChild(createMessageElement('Sem dados de tendência.'));
            }
            return;
        }
        let totalVendasNumerico = 0;
        const vendasPorCategoria = {};
        const vendasPorMes = {};
        dados.forEach((item) => {
            const valorVendaOriginal = String(item[NOME_COLUNA_VALOR_VENDA_VENDAS] || '0');
            const valorVendaStr = valorVendaOriginal.replace(/[R$. ]/g, '').replace(',', '.');
            const valorVendaNum = parseFloat(valorVendaStr);
            console.log(`Item Processado: Original='${valorVendaOriginal}', Limpo='${valorVendaStr}', Num='${valorVendaNum}', Cat='${String(item[NOME_COLUNA_CATEGORIA_VENDAS] || 'Outros')}'`);
            if (!isNaN(valorVendaNum)) {
                totalVendasNumerico += valorVendaNum;
                // Padroniza a categoria para "Outros" se for "undefined", vazia, ou "outros" (case-insensitive)
                let categoriaOriginalNome = String(item[NOME_COLUNA_CATEGORIA_VENDAS] || '').trim();
                let categoriaFinal;
                if (categoriaOriginalNome.toLowerCase() === 'undefined' || categoriaOriginalNome === '' || categoriaOriginalNome.toLowerCase() === 'outros') {
                    categoriaFinal = 'Outros'; // Padroniza para "Outros" com 'O' maiúsculo
                }
                else {
                    // Você pode adicionar outras normalizações aqui se precisar, ex: capitalizar outras categorias
                    // categoriaFinal = categoriaOriginalNome.charAt(0).toUpperCase() + categoriaOriginalNome.slice(1).toLowerCase();
                    categoriaFinal = categoriaOriginalNome; // Mantém o nome original para outras categorias
                }
                vendasPorCategoria[categoriaFinal] = (vendasPorCategoria[categoriaFinal] || 0) + valorVendaNum;
                const dataStr = String(item[NOME_COLUNA_DATA_VENDAS] || '').trim();
                if (dataStr) {
                    let dataObj = null;
                    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataStr)) {
                        const partes = dataStr.split('/');
                        dataObj = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0]));
                    }
                    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dataStr)) {
                        const partes = dataStr.split('-');
                        dataObj = new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
                    }
                    if (dataObj && !isNaN(dataObj.getTime())) {
                        const mes = dataObj.getMonth() + 1;
                        const ano = dataObj.getFullYear();
                        const chaveMesAno = `${ano}-${mes.toString().padStart(2, '0')}`;
                        if (!vendasPorMes[chaveMesAno]) {
                            vendasPorMes[chaveMesAno] = { total: 0, ano: ano, mes: mes };
                        }
                        vendasPorMes[chaveMesAno].total += valorVendaNum;
                    }
                }
            }
            else {
                console.warn(`AVISO VENDAS (TS calcularKPIs ITEM): Valor não numérico. Original='${valorVendaOriginal}', Limpo='${valorVendaStr}', Resultado parseFloat='${valorVendaNum}'`);
            }
        });
        const numTransacoes = dados.length;
        const ticketMedio = numTransacoes > 0 ? totalVendasNumerico / numTransacoes : 0;
        if (kpiTotalVendasEl)
            kpiTotalVendasEl.textContent = formatarMoedaVendas(totalVendasNumerico);
        if (kpiNumTransacoesEl)
            kpiNumTransacoesEl.textContent = numTransacoes.toString();
        if (kpiTicketMedioEl)
            kpiTicketMedioEl.textContent = formatarMoedaVendas(ticketMedio);
        console.log("DEBUG VENDAS (TS calcularKPIs): KPIs atualizados. Total Vendas Numerico:", totalVendasNumerico);
        // Gráfico de Categorias como PIZZA
        if (ctxCategoriaCanvas) {
            const ctx = ctxCategoriaCanvas.getContext('2d');
            if (ctx) {
                graficoCategoriaInstanceVendas = new Chart(ctx, {
                    type: 'pie', // ALTERADO PARA PIZZA
                    data: {
                        labels: Object.keys(vendasPorCategoria),
                        datasets: [{
                                label: 'Vendas por Categoria', // Adicionado um label para o dataset
                                data: Object.values(vendasPorCategoria),
                                backgroundColor: chartDatasetColorsDark,
                                borderColor: corFundoCardsDark,
                                borderWidth: 1
                            }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom', // Legenda embaixo para pizza também pode ser bom
                                labels: {
                                    color: corTextoSecundarioDark,
                                    padding: 15,
                                    font: { size: 11 }
                                }
                            },
                            tooltip: {
                                bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark,
                                backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10,
                                callbacks: {
                                    label: (context) => {
                                        const label = context.label || ''; // Usar context.label para pie/doughnut
                                        const value = context.raw;
                                        const percentage = context.chart.getDataVisibility(context.dataIndex) ? (context.raw / context.chart.getDatasetMeta(0).total * 100).toFixed(2) + '%' : '';
                                        return `${label}: ${formatarMoedaVendas(value)} (${percentage})`;
                                    }
                                }
                            },
                            datalabels: (typeof ChartDataLabels !== 'undefined' && ChartDataLabels) ? {
                                color: corTextoPrincipalDark,
                                font: { weight: 'bold', size: 10 },
                                formatter: (value, context) => {
                                    const percentage = (value / context.chart.getDatasetMeta(0).total * 100);
                                    return percentage > 5 ? percentage.toFixed(0) + '%' : ''; // Mostrar % se for > 5%
                                },
                                anchor: 'center',
                                align: 'center'
                            } : { display: false }
                        }
                    }
                });
                console.log("DEBUG VENDAS (TS calcularKPIs): Gráfico de categorias (PIZZA) renderizado.");
            }
        }
        // Gráfico de Tendência (legenda já ajustada)
        if (ctxTendenciaCanvas) {
            const ctx = ctxTendenciaCanvas.getContext('2d');
            if (ctx) {
                const chavesOrdenadas = Object.keys(vendasPorMes).sort();
                const labelsGrafico = chavesOrdenadas.map(chave => {
                    const { ano, mes } = vendasPorMes[chave];
                    return `${mes.toString().padStart(2, '0')}/${ano.toString().slice(-2)}`;
                });
                const valoresGrafico = chavesOrdenadas.map(chave => vendasPorMes[chave].total);
                graficoTendenciaInstanceVendas = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labelsGrafico,
                        datasets: [{
                                label: 'Tendência de Vendas Mensais',
                                data: valoresGrafico,
                                borderColor: corLinhaTendencia, backgroundColor: corAreaTendencia,
                                tension: 0.3, fill: true,
                                pointBackgroundColor: corLinhaTendencia, pointBorderColor: corTextoPrincipalDark,
                                pointHoverBackgroundColor: corTextoPrincipalDark, pointHoverBorderColor: corLinhaTendencia
                            }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, ticks: { callback: (value) => formatarMoedaVendas(value), color: corTextoSecundarioDark }, grid: { color: corBordasDark, drawBorder: false } },
                            x: { ticks: { color: corTextoSecundarioDark, maxRotation: 0, autoSkipPadding: 20 }, grid: { color: corBordasDark, display: false } }
                        },
                        plugins: {
                            legend: {
                                display: true,
                                position: 'bottom',
                                align: 'center',
                                labels: { color: corTextoSecundarioDark, padding: 15, font: { size: 11 }, boxWidth: 12, usePointStyle: true }
                            },
                            tooltip: {
                                bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark,
                                backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10,
                                callbacks: { label: (context) => `${context.dataset.label || 'Vendas'}: ${formatarMoedaVendas(context.raw)}` }
                            }
                        },
                        layout: { padding: { top: 5 } }
                    }
                });
                console.log("DEBUG VENDAS (TS calcularKPIs): Gráfico de tendência renderizado.");
            }
        }
    };
    const renderizarTabelaVendas = (dadosParaRenderizar) => {
        // ... (código da tabela permanece o mesmo) ...
        if (!corpoTabelaVendas || !cabecalhoTabelaVendasEl) {
            console.error("Vendas.ts: Elementos da tabela não encontrados.");
            return;
        }
        console.log("DEBUG VENDAS (TS renderizarTabela): INICIADO com dados.length:", dadosParaRenderizar.length);
        if (cabecalhoTabelaVendasEl.children.length === 0 && colunasDefinidasCSVVendas.length > 0) {
            cabecalhoTabelaVendasEl.innerHTML = '';
            colunasDefinidasCSVVendas.forEach(textoCabecalho => {
                const th = document.createElement('th');
                th.textContent = textoCabecalho;
                const thLower = textoCabecalho.toLowerCase();
                if (thLower.includes('valor') || thLower.includes('preço') || thLower.includes('total') ||
                    thLower.includes('qtd') || thLower.includes('quantidade') || thLower.includes('número') || thLower.includes('estoque')) {
                    th.classList.add('coluna-numero');
                }
                cabecalhoTabelaVendasEl.appendChild(th);
            });
        }
        corpoTabelaVendas.innerHTML = '';
        if (dadosParaRenderizar.length === 0) {
            const numColunas = colunasDefinidasCSVVendas.length || 1;
            corpoTabelaVendas.innerHTML = `<tr><td colspan="${numColunas}" style="text-align:center; padding: 20px;">${filtroGeralInputVendas && filtroGeralInputVendas.value ? 'Nenhuma venda encontrada para o filtro aplicado.' : 'Nenhum dado de vendas para exibir.'}</td></tr>`;
            if (noDataMessageDivVendas)
                noDataMessageDivVendas.style.display = 'none';
            return;
        }
        if (noDataMessageDivVendas)
            noDataMessageDivVendas.style.display = 'none';
        dadosParaRenderizar.forEach((linhaObj) => {
            const tr = document.createElement('tr');
            colunasDefinidasCSVVendas.forEach(cabecalho => {
                const td = document.createElement('td');
                let valor = String(linhaObj[cabecalho] !== undefined ? linhaObj[cabecalho] : '');
                const cabecalhoLower = cabecalho.toLowerCase();
                if (cabecalho.toLowerCase() === NOME_COLUNA_VALOR_VENDA_VENDAS.toLowerCase() || cabecalhoLower.includes('preço') || cabecalhoLower.includes('total')) {
                    td.textContent = formatarMoedaVendas(valor);
                    td.classList.add('coluna-numero', 'coluna-monetaria');
                }
                else if (cabecalhoLower.includes('qtd') || cabecalhoLower.includes('quantidade') || cabecalhoLower.includes('número') || cabecalhoLower.includes('estoque') || cabecalhoLower.includes('id ')) {
                    td.textContent = valor;
                    td.classList.add('coluna-numero');
                }
                else {
                    td.textContent = valor;
                }
                tr.appendChild(td);
            });
            corpoTabelaVendas.appendChild(tr);
        });
        console.log("DEBUG VENDAS (TS renderizarTabela): Tabela renderizada.");
    };
    const filtrarLinhaVendas = (linha, termoBusca) => {
        // ... (código permanece o mesmo) ...
        if (!termoBusca)
            return true;
        const termoLower = termoBusca.toLowerCase();
        return colunasDefinidasCSVVendas.some(cabecalho => String(linha[cabecalho]).toLowerCase().includes(termoLower));
    };
    const carregarDadosVendas = () => __awaiter(void 0, void 0, void 0, function* () {
        console.log("DEBUG VENDAS (TS carregarDadosVendas): INICIADO...");
        mostrarMensagemVendas(loadingMessageDivVendas, 'Carregando dados do dashboard...', true);
        if (!URL_PLANILHA_CSV_VENDAS || URL_PLANILHA_CSV_VENDAS.includes('COLE_AQUI') || URL_PLANILHA_CSV_VENDAS.length < 50) {
            mostrarMensagemVendas(errorMessageDivVendas, 'Erro: URL da planilha CSV de Vendas não configurada ou inválida.');
            colunasDefinidasCSVVendas = [];
            dadosCompletosVendas = [];
            if (loadingMessageDivVendas)
                loadingMessageDivVendas.style.display = 'none';
            handlePageLoadAndNavigationVendas();
            return;
        }
        try {
            const resposta = yield fetch(URL_PLANILHA_CSV_VENDAS, { cache: 'no-store' });
            console.log("DEBUG VENDAS (TS carregarDadosVendas): Resposta fetch:", resposta.status, resposta.statusText);
            if (!resposta.ok) {
                throw new Error(`Falha ao buscar CSV de Vendas: ${resposta.status} ${resposta.statusText}.`);
            }
            const textoCsv = yield resposta.text();
            if (!textoCsv || textoCsv.trim() === '') {
                throw new Error('O arquivo CSV de Vendas retornado está vazio ou é inválido.');
            }
            const { cabecalhos, linhas } = processarCSVVendas(textoCsv);
            dadosCompletosVendas = linhas;
            console.log("DEBUG VENDAS (TS carregarDadosVendas): dadosCompletosVendas populado. Comprimento:", dadosCompletosVendas.length);
            if (loadingMessageDivVendas)
                loadingMessageDivVendas.style.display = 'none';
            if (errorMessageDivVendas)
                errorMessageDivVendas.style.display = 'none';
            console.log("DEBUG VENDAS (TS carregarDadosVendas): Chamando handlePageLoad APÓS DADOS.");
            handlePageLoadAndNavigationVendas();
        }
        catch (erro) {
            console.error("DEBUG VENDAS (TS carregarDadosVendas): ERRO CRÍTICO:", erro);
            const mensagemErro = (erro instanceof Error) ? erro.message : 'Erro desconhecido ao carregar dados.';
            mostrarMensagemVendas(errorMessageDivVendas, `Erro ao carregar dados: ${mensagemErro}.`);
            dadosCompletosVendas = [];
            if (loadingMessageDivVendas)
                loadingMessageDivVendas.style.display = 'none';
            console.log("DEBUG VENDAS (TS carregarDadosVendas): Chamando handlePageLoad do CATCH.");
            handlePageLoadAndNavigationVendas();
        }
    });
    if (filtroGeralInputVendas) {
        filtroGeralInputVendas.addEventListener('input', (e) => {
            const target = e.target;
            const termoBusca = target.value.trim();
            const dashboardSection = document.getElementById('secao-dashboard');
            if (dashboardSection && (dashboardSection.style.display === 'block' || dashboardSection.classList.contains('active-section'))) {
                const dadosFiltrados = dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoBusca));
                renderizarTabelaVendas(dadosFiltrados);
            }
        });
    }
    carregarDadosVendas();
    const tabelaContainers = document.querySelectorAll('.tabela-responsiva-container');
    tabelaContainers.forEach(container => {
        function updateScrollShadows() {
            if (!container)
                return;
            const maxScrollLeft = container.scrollWidth - container.clientWidth;
            container.classList.toggle('is-scrolling-left', container.scrollLeft > 1);
            container.classList.toggle('is-scrolling-right', container.scrollLeft < maxScrollLeft - 1);
        }
        container.addEventListener('scroll', updateScrollShadows);
        window.addEventListener('resize', updateScrollShadows);
        setTimeout(updateScrollShadows, 200);
    });
});
//# sourceMappingURL=vendas.js.map