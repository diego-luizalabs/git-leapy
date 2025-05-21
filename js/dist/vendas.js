"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const URL_PLANILHA_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIfu_bkc8cu1dNbItO9zktGmn4JjNjQEoLAzGcG9rZDyfDyDp4ISEqpPKzIFTWFrMNVIz05V3NTpGT/pub?output=csv';
let graficoCategoriaInstance = null;
let graficoTendenciaInstance = null;
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Vendas: Completamente carregado e analisado.");
    const NOME_COLUNA_VALOR_VENDA = 'Valor Total';
    const NOME_COLUNA_CATEGORIA = 'Categoria';
    const NOME_COLUNA_DATA = 'Data';
    const computedStyles = getComputedStyle(document.documentElement);
    const corTextoPrincipalDark = computedStyles.getPropertyValue('--cor-texto-principal-dark').trim() || '#e5e7eb';
    const corTextoSecundarioDark = computedStyles.getPropertyValue('--cor-texto-secundario-dark').trim() || '#9ca3af';
    const corBordasDark = computedStyles.getPropertyValue('--cor-bordas-dark').trim() || '#374151';
    const corFundoCardsDark = computedStyles.getPropertyValue('--cor-fundo-cards-dark').trim() || '#1f2937';
    const chartDatasetColorsDark = [
        computedStyles.getPropertyValue('--cor-primaria-accent-dark').trim() || '#8B5CF6', // Roxo como primário
        computedStyles.getPropertyValue('--cor-secundaria-accent-dark').trim() || '#34d399',
        computedStyles.getPropertyValue('--cor-destaque-accent-dark').trim() || '#f43f5e',
        computedStyles.getPropertyValue('--cor-kpi-icon-bg-favorites').trim() || '#facc15',
        '#818cf8',
        '#a78bfa',
        '#f472b6',
        '#60a5fa'
    ];
    const corLinhaTendencia = chartDatasetColorsDark[0];
    const corAreaTendencia = `${corLinhaTendencia}4D`;
    const kpiTotalVendasEl = document.getElementById('kpi-total-vendas');
    const kpiNumTransacoesEl = document.getElementById('kpi-num-transacoes');
    const kpiTicketMedioEl = document.getElementById('kpi-ticket-medio');
    const ctxCategoriaCanvas = document.getElementById('grafico-vendas-categoria');
    const ctxTendenciaCanvas = document.getElementById('grafico-tendencia-vendas');
    const corpoTabela = document.getElementById('corpo-tabela-vendas');
    const cabecalhoTabelaEl = document.getElementById('cabecalho-tabela');
    const filtroGeralInput = document.getElementById('filtro-geral');
    const loadingMessageDiv = document.getElementById('loading-message');
    const errorMessageDiv = document.getElementById('error-message');
    const noDataMessageDiv = document.getElementById('no-data-message');
    let dadosCompletos = [];
    let colunasDefinidasCSV = [];
    const sidebar = document.querySelector('.dashboard-sidebar');
    const menuToggleButton = document.querySelector('.menu-toggle-btn');
    if (sidebar && menuToggleButton) {
        menuToggleButton.addEventListener('click', () => {
            const isVisible = sidebar.classList.toggle('sidebar-visible');
            document.body.classList.toggle('sidebar-overlay-active', isVisible);
            menuToggleButton.setAttribute('aria-expanded', isVisible.toString());
        });
        document.body.addEventListener('click', (event) => {
            if (document.body.classList.contains('sidebar-overlay-active') && sidebar.classList.contains('sidebar-visible')) {
                const target = event.target;
                if (!sidebar.contains(target) && !menuToggleButton.contains(target)) {
                    sidebar.classList.remove('sidebar-visible');
                    document.body.classList.remove('sidebar-overlay-active');
                    menuToggleButton.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
    // ----- INÍCIO DA LÓGICA DE NAVEGAÇÃO DA SIDEBAR UNIFICADA -----
    const navLinksGlobal = document.querySelectorAll('.sidebar-nav a'); // Seleciona TODOS os links <a>
    const sectionsGlobal = document.querySelectorAll('.dashboard-page-content .dashboard-section');
    const tituloSecaoHeaderEl = document.getElementById('dashboard-titulo-secao');
    function updateActiveLinkAndTitleGlobal(activeLink) {
        var _a;
        navLinksGlobal.forEach(navLink => navLink.classList.remove('active'));
        if (activeLink) {
            activeLink.classList.add('active');
            if (tituloSecaoHeaderEl) {
                let titulo = ((_a = activeLink.textContent) === null || _a === void 0 ? void 0 : _a.trim()) || 'Dashboard';
                const iconSpan = activeLink.querySelector('.icon');
                if (iconSpan && iconSpan.textContent) {
                    titulo = titulo.replace(iconSpan.textContent.trim(), '').trim();
                }
                const currentPagePath = window.location.pathname.split('/').pop() || 'index.html';
                if (currentPagePath.includes('produtos.html')) {
                    tituloSecaoHeaderEl.textContent = "Gerenciamento de Produtos";
                }
                else { // Para vendas.html e suas seções
                    tituloSecaoHeaderEl.textContent = (titulo.toLowerCase() === 'dashboard') ? 'Visão Geral das Vendas' : titulo;
                }
            }
        }
    }
    function showSectionGlobal(targetId) {
        let sectionFoundAndDisplayed = false;
        sectionsGlobal.forEach(section => {
            const sectionEl = section;
            if (sectionEl.id === targetId) {
                sectionEl.style.display = 'block';
                sectionEl.classList.add('active-section');
                sectionEl.querySelectorAll('.kpi-card, .grafico-card, .card-secao, .secao-tabela-detalhada').forEach((card, index) => {
                    card.style.animation = 'none';
                    void card.offsetWidth;
                    card.style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                sectionFoundAndDisplayed = true;
                if (targetId === 'secao-dashboard' && dadosCompletos.length > 0) {
                    calcularKPIsEVisualizacoes(dadosCompletos);
                    renderizarTabela(dadosCompletos.filter(linha => filtrarLinha(linha, (filtroGeralInput === null || filtroGeralInput === void 0 ? void 0 : filtroGeralInput.value) || '')));
                }
            }
            else {
                sectionEl.style.display = 'none';
                sectionEl.classList.remove('active-section');
            }
        });
        return sectionFoundAndDisplayed;
    }
    navLinksGlobal.forEach(link => {
        link.addEventListener('click', function (event) {
            const currentAnchor = this;
            const href = currentAnchor.getAttribute('href');
            // Se o href é para um arquivo .html diferente (e não apenas um hash para a página atual)
            if (href && !href.startsWith('#') && href.endsWith('.html')) {
                // Não chama event.preventDefault(), permite a navegação para a nova página.
                console.log(`VENDAS.TS: Navegando para página: ${href}`);
                // A classe 'active' será tratada pela página de destino no seu respectivo JS/DOMContentLoaded.
                return;
            }
            // Para links de âncora (#) ou outros casos que não sejam navegação de página completa
            event.preventDefault();
            const dataTarget = currentAnchor.dataset.target; // ex: "secao-dashboard"
            if (dataTarget) { // Navegação interna na página atual
                if (showSectionGlobal(dataTarget)) {
                    updateActiveLinkAndTitleGlobal(currentAnchor);
                    if (history.pushState && href && href.startsWith('#')) {
                        const hashBase = href.substring(1);
                        if (location.hash !== href) { // Evita empurrar o mesmo estado
                            history.pushState({ section: dataTarget, page: window.location.pathname }, "", href);
                        }
                    }
                }
            }
            if (sidebar && sidebar.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleButton) {
                sidebar.classList.remove('sidebar-visible');
                document.body.classList.remove('sidebar-overlay-active');
                menuToggleButton.setAttribute('aria-expanded', 'false');
            }
        });
    });
    function handlePageLoadAndNavigationGlobal() {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const hash = location.hash.substring(1);
        let activeLinkElement = null;
        let targetSectionIdForCurrentPage = '';
        if (currentPath.endsWith('produtos.html')) {
            activeLinkElement = document.querySelector('.sidebar-nav a[href="produtos.html"]');
            if (tituloSecaoHeaderEl)
                tituloSecaoHeaderEl.textContent = "Gerenciamento de Produtos";
            // A página produtos.html gerenciará suas próprias seções, se houver.
        }
        else { // Assumindo vendas.html ou index.html (dashboard principal)
            if (hash) {
                targetSectionIdForCurrentPage = `secao-${hash}`;
                activeLinkElement = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
            }
            else {
                targetSectionIdForCurrentPage = 'secao-dashboard';
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"]');
            }
            if (targetSectionIdForCurrentPage) {
                if (!showSectionGlobal(targetSectionIdForCurrentPage) && sectionsGlobal.length > 0) {
                    const defaultDashboardSection = 'secao-dashboard'; // Fallback para dashboard
                    showSectionGlobal(defaultDashboardSection);
                    activeLinkElement = document.querySelector(`.sidebar-nav a[data-target="${defaultDashboardSection}"]`);
                }
            }
        }
        if (activeLinkElement) {
            updateActiveLinkAndTitleGlobal(activeLinkElement);
        }
        else { // Tenta encontrar um link ativo pela URL se nenhum hash/seção correspondeu
            const pageLink = document.querySelector(`.sidebar-nav a[href$="${currentPath}"]`);
            if (pageLink)
                updateActiveLinkAndTitleGlobal(pageLink);
        }
    }
    window.addEventListener('popstate', (event) => {
        handlePageLoadAndNavigationGlobal();
    });
    // ----- FIM DA SEÇÃO DE NAVEGAÇÃO DA SIDEBAR UNIFICADA -----
    const mostrarMensagem = (elemento, mensagem = '', mostrarSpinner = false) => {
        if (loadingMessageDiv && elemento !== loadingMessageDiv)
            loadingMessageDiv.style.display = 'none';
        if (errorMessageDiv && elemento !== errorMessageDiv)
            errorMessageDiv.style.display = 'none';
        if (noDataMessageDiv && elemento !== noDataMessageDiv)
            noDataMessageDiv.style.display = 'none';
        if (elemento) {
            elemento.innerHTML = '';
            if (mostrarSpinner) {
                const spinner = document.createElement('div');
                spinner.className = 'spinner';
                elemento.appendChild(spinner);
            }
            if (mensagem) {
                const textoNode = document.createTextNode(mostrarSpinner ? ' ' + mensagem : mensagem);
                elemento.appendChild(textoNode);
            }
            elemento.style.display = 'flex';
        }
    };
    const processarCSV = (textoCsv) => {
        const todasLinhasTexto = textoCsv.trim().split('\n');
        if (todasLinhasTexto.length === 0 || todasLinhasTexto[0].trim() === '') {
            return { cabecalhos: [], linhas: [] };
        }
        const cabecalhoLinha = todasLinhasTexto.shift();
        if (!cabecalhoLinha)
            return { cabecalhos: [], linhas: [] };
        const cabecalhos = cabecalhoLinha.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        colunasDefinidasCSV = cabecalhos;
        const linhasProcessadas = todasLinhasTexto.map((linhaTexto, indiceLinha) => {
            const valores = [];
            let dentroDeAspas = false;
            let valorAtual = '';
            for (let i = 0; i < linhaTexto.length; i++) {
                const char = linhaTexto[i];
                if (char === '"') {
                    if (dentroDeAspas && linhaTexto[i + 1] === '"') {
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
            if (valores.length !== cabecalhos.length) {
                // console.warn(`DOM Vendas: Aviso CSV Linha ${indiceLinha + 2}: Colunas (${valores.length}) != Cabeçalhos (${cabecalhos.length}). Linha: "${linhaTexto}"`);
            }
            return linhaObj;
        });
        return { cabecalhos, linhas: linhasProcessadas };
    };
    const formatarMoeda = (valor) => {
        let numValor = typeof valor === 'string' ? parseFloat(valor.replace(/[R$. ]/g, '').replace(',', '.')) : valor;
        if (typeof numValor !== 'number' || isNaN(numValor)) {
            return 'R$ 0,00';
        }
        return numValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };
    const calcularKPIsEVisualizacoes = (dados) => {
        if (kpiTotalVendasEl)
            kpiTotalVendasEl.textContent = formatarMoeda(0);
        if (kpiNumTransacoesEl)
            kpiNumTransacoesEl.textContent = '0';
        if (kpiTicketMedioEl)
            kpiTicketMedioEl.textContent = formatarMoeda(0);
        if (dados.length === 0) {
            if (graficoCategoriaInstance)
                graficoCategoriaInstance.destroy();
            if (graficoTendenciaInstance)
                graficoTendenciaInstance.destroy();
            return;
        }
        let totalVendasNumerico = 0;
        const vendasPorCategoria = {};
        const vendasPorMes = {};
        dados.forEach((item) => {
            const valorVendaStr = String(item[NOME_COLUNA_VALOR_VENDA] || '0').replace(/[R$. ]/g, '').replace(',', '.');
            const valorVendaNum = parseFloat(valorVendaStr);
            if (!isNaN(valorVendaNum)) {
                totalVendasNumerico += valorVendaNum;
                const categoria = String(item[NOME_COLUNA_CATEGORIA] || 'Outros').trim();
                vendasPorCategoria[categoria] = (vendasPorCategoria[categoria] || 0) + valorVendaNum;
                const dataStr = String(item[NOME_COLUNA_DATA] || '').trim();
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
                        const mesNum = dataObj.getMonth() + 1;
                        const ano = dataObj.getFullYear();
                        const mesAnoChave = `${ano}-${mesNum.toString().padStart(2, '0')}`;
                        if (!vendasPorMes[mesAnoChave]) {
                            vendasPorMes[mesAnoChave] = { total: 0, ano: ano, mes: mesNum };
                        }
                        vendasPorMes[mesAnoChave].total += valorVendaNum;
                    }
                }
            }
            else {
                // if (item[NOME_COLUNA_VALOR_VENDA] && String(item[NOME_COLUNA_VALOR_VENDA]).trim() !== '' && String(item[NOME_COLUNA_VALOR_VENDA]).trim() !== '0') {
                //     console.warn(`DOM Vendas: Valor CSV inválido para '${NOME_COLUNA_VALOR_VENDA}' no item:`, item);
                // }
            }
        });
        const numTransacoes = dados.length;
        const ticketMedio = numTransacoes > 0 ? totalVendasNumerico / numTransacoes : 0;
        if (kpiTotalVendasEl)
            kpiTotalVendasEl.textContent = formatarMoeda(totalVendasNumerico);
        if (kpiNumTransacoesEl)
            kpiNumTransacoesEl.textContent = numTransacoes.toString();
        if (kpiTicketMedioEl)
            kpiTicketMedioEl.textContent = formatarMoeda(ticketMedio);
        if (ctxCategoriaCanvas) {
            const ctxCategoria = ctxCategoriaCanvas.getContext('2d');
            if (ctxCategoria) {
                if (graficoCategoriaInstance)
                    graficoCategoriaInstance.destroy();
                graficoCategoriaInstance = new Chart(ctxCategoria, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(vendasPorCategoria),
                        datasets: [{
                                label: 'Vendas por Categoria',
                                data: Object.values(vendasPorCategoria),
                                backgroundColor: chartDatasetColorsDark,
                                borderColor: corFundoCardsDark,
                                borderWidth: 2
                            }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 }, color: corTextoSecundarioDark } },
                            tooltip: { bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark, backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10, callbacks: { label: (context) => `${context.label}: ${formatarMoeda(context.raw)}` } }
                        }
                    }
                });
            }
        }
        if (ctxTendenciaCanvas) {
            const ctxTendencia = ctxTendenciaCanvas.getContext('2d');
            if (ctxTendencia) {
                if (graficoTendenciaInstance)
                    graficoTendenciaInstance.destroy();
                const mesesOrdenadosChaves = Object.keys(vendasPorMes).sort();
                const labelsMesesFormatados = mesesOrdenadosChaves.map(chave => {
                    const { ano, mes } = vendasPorMes[chave];
                    return `${mes.toString().padStart(2, '0')}/${ano}`;
                });
                const valoresMesesOrdenados = mesesOrdenadosChaves.map(chave => vendasPorMes[chave].total);
                graficoTendenciaInstance = new Chart(ctxTendencia, {
                    type: 'line',
                    data: {
                        labels: labelsMesesFormatados,
                        datasets: [{ label: 'Tendência de Vendas Mensais', data: valoresMesesOrdenados, borderColor: corLinhaTendencia, backgroundColor: corAreaTendencia, tension: 0.3, fill: true, pointBackgroundColor: corLinhaTendencia, pointBorderColor: corTextoPrincipalDark, pointHoverBackgroundColor: corTextoPrincipalDark, pointHoverBorderColor: corLinhaTendencia }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, ticks: { callback: (value) => formatarMoeda(value), color: corTextoSecundarioDark }, grid: { color: corBordasDark, drawBorder: false } },
                            x: { ticks: { color: corTextoSecundarioDark, maxRotation: 0, autoSkipPadding: 20 }, grid: { color: corBordasDark, display: false } }
                        },
                        plugins: {
                            legend: { display: true, labels: { color: corTextoSecundarioDark, padding: 15, font: { size: 11 } } },
                            tooltip: { bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark, backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10, callbacks: { label: (context) => `${context.dataset.label || 'Vendas'}: ${formatarMoeda(context.raw)}` } }
                        }
                    }
                });
            }
        }
    };
    const renderizarTabela = (dadosParaRenderizar) => {
        if (!corpoTabela || !cabecalhoTabelaEl) {
            return;
        }
        if (cabecalhoTabelaEl.children.length === 0 && colunasDefinidasCSV.length > 0) {
            cabecalhoTabelaEl.innerHTML = '';
            colunasDefinidasCSV.forEach(textoCabecalho => {
                const th = document.createElement('th');
                th.textContent = textoCabecalho;
                const thLower = textoCabecalho.toLowerCase();
                if (thLower.includes('valor') || thLower.includes('preço') || thLower.includes('total') ||
                    thLower.includes('qtd') || thLower.includes('quantidade') || thLower.includes('número') || thLower.includes('estoque')) {
                    th.classList.add('coluna-numero');
                }
                cabecalhoTabelaEl.appendChild(th);
            });
        }
        corpoTabela.innerHTML = '';
        if (dadosParaRenderizar.length === 0) {
            if (colunasDefinidasCSV.length > 0) {
                mostrarMensagem(noDataMessageDiv, 'Nenhum dado encontrado para os filtros aplicados.');
            }
            else {
                mostrarMensagem(noDataMessageDiv, 'Nenhum dado para exibir na tabela.');
            }
            return;
        }
        if (noDataMessageDiv)
            noDataMessageDiv.style.display = 'none';
        dadosParaRenderizar.forEach((linhaObj) => {
            const tr = document.createElement('tr');
            colunasDefinidasCSV.forEach(cabecalho => {
                const td = document.createElement('td');
                let valor = linhaObj[cabecalho] !== undefined ? String(linhaObj[cabecalho]) : '';
                const cabecalhoLower = cabecalho.toLowerCase();
                if (cabecalho.toLowerCase() === NOME_COLUNA_VALOR_VENDA.toLowerCase() ||
                    cabecalhoLower.includes('preço') || cabecalhoLower.includes('total')) {
                    td.textContent = formatarMoeda(valor).replace('R$ ', '');
                    td.classList.add('coluna-numero', 'coluna-monetaria');
                }
                else if (cabecalhoLower.includes('qtd') || cabecalhoLower.includes('quantidade') ||
                    cabecalhoLower.includes('número') || cabecalhoLower.includes('estoque') || cabecalhoLower.includes('id ')) {
                    td.textContent = valor;
                    td.classList.add('coluna-numero');
                }
                else {
                    td.textContent = valor;
                }
                tr.appendChild(td);
            });
            corpoTabela.appendChild(tr);
        });
    };
    const filtrarLinha = (linha, termoBusca) => {
        if (!termoBusca)
            return true;
        return colunasDefinidasCSV.some(cabecalho => String(linha[cabecalho]).toLowerCase().includes(termoBusca));
    };
    const carregarDados = () => __awaiter(void 0, void 0, void 0, function* () {
        mostrarMensagem(loadingMessageDiv, 'Carregando dados do dashboard...', true);
        if (!URL_PLANILHA_CSV || URL_PLANILHA_CSV.includes('COLE_AQUI') || URL_PLANILHA_CSV.length < 50) {
            mostrarMensagem(errorMessageDiv, 'Erro: URL da planilha CSV não configurada ou inválida.');
            colunasDefinidasCSV = [];
            dadosCompletos = [];
            renderizarTabela([]);
            calcularKPIsEVisualizacoes([]);
            return;
        }
        try {
            const resposta = yield fetch(URL_PLANILHA_CSV);
            if (!resposta.ok) {
                throw new Error(`Falha ao buscar dados CSV: ${resposta.status} ${resposta.statusText}. Verifique a URL e as permissões da planilha.`);
            }
            const textoCsv = yield resposta.text();
            if (!textoCsv || textoCsv.trim() === '') {
                mostrarMensagem(errorMessageDiv, 'Arquivo CSV recebido está vazio ou é inválido.');
                colunasDefinidasCSV = [];
                dadosCompletos = [];
                renderizarTabela([]);
                calcularKPIsEVisualizacoes([]);
                return;
            }
            const { linhas } = processarCSV(textoCsv);
            if (colunasDefinidasCSV.length === 0 && linhas.length === 0 && textoCsv.trim() !== '') {
                mostrarMensagem(errorMessageDiv, 'Não foi possível processar os cabeçalhos ou linhas do CSV. Verifique o formato do arquivo.');
                return;
            }
            dadosCompletos = linhas;
            if (loadingMessageDiv)
                loadingMessageDiv.style.display = 'none';
            handlePageLoadAndNavigationGlobal(); // Chama para definir a seção correta e renderizar se necessário
            if (dadosCompletos.length === 0) {
                if (colunasDefinidasCSV.length > 0) {
                    mostrarMensagem(noDataMessageDiv, 'Nenhum dado encontrado na planilha após o processamento.');
                }
                else {
                    mostrarMensagem(noDataMessageDiv, 'Nenhum dado para exibir. Verifique o formato da planilha de origem.');
                }
            }
        }
        catch (erro) {
            console.error("DOM Vendas: Erro ao carregar ou processar dados:", erro);
            const mensagemErro = erro instanceof Error ? erro.message : String(erro);
            mostrarMensagem(errorMessageDiv, `Erro ao carregar dados: ${mensagemErro}. Verifique o console.`);
        }
    });
    if (filtroGeralInput) {
        filtroGeralInput.addEventListener('input', (e) => {
            var _a;
            const termoBusca = e.target.value.toLowerCase().trim();
            if ((_a = document.getElementById('secao-dashboard')) === null || _a === void 0 ? void 0 : _a.classList.contains('active-section')) {
                const dadosFiltrados = dadosCompletos.filter(linha => filtrarLinha(linha, termoBusca));
                renderizarTabela(dadosFiltrados);
            }
        });
    }
    const currentYearVendasSpan = document.getElementById('currentYearVendas');
    if (currentYearVendasSpan) {
        currentYearVendasSpan.textContent = new Date().getFullYear().toString();
    }
    if (sessionStorage.getItem('isXuxuGlowAdminLoggedIn') !== 'true') {
        console.warn("DOM Vendas: Utilizador não logado. Redirecionando para a página de login.");
        window.location.href = 'index.html';
        return;
    }
    console.log("DOM Vendas: Utilizador logado.");
    carregarDados();
    // Lógica para sombras na tabela responsiva
    const tabelaContainers = document.querySelectorAll('.tabela-responsiva-container');
    tabelaContainers.forEach(container => {
        function updateScrollShadows() {
            if (!container)
                return;
            const maxScrollLeft = container.scrollWidth - container.clientWidth;
            container.classList.toggle('is-scrolling-left', container.scrollLeft > 1); // Pequena tolerância
            container.classList.toggle('is-scrolling-right', container.scrollLeft < maxScrollLeft - 1); // Pequena tolerância
        }
        container.addEventListener('scroll', updateScrollShadows);
        updateScrollShadows(); // Checa no load
        // Poderia adicionar um ResizeObserver para recalcular em caso de redimensionamento
    });
});
//# sourceMappingURL=vendas.js.map