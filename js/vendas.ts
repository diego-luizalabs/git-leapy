// TESTE DE FUMAÇA: 
// alert("js/vendas.ts INICIADO! Se você vir isso, o arquivo está sendo lido."); 
console.log("LOG INICIAL: js/vendas.ts foi lido pelo navegador.");

declare var Chart: any; // Para Chart.js

const URL_PLANILHA_CSV_VENDAS: string = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIfu_bkc8cu1dNbItO9zktGmn4JjNjQEoLAzGcG9rZDyfDyDp4ISEqpPKzIFTWFrMNVIz05V3NTpGT/pub?output=csv';

interface LinhaPlanilhaVendas {
    [key: string]: string | number;
}

let graficoCategoriaInstanceVendas: any = null;
let graficoTendenciaInstanceVendas: any = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Vendas: Conteúdo do DOM completamente carregado e analisado.");

    if (sessionStorage.getItem('isXuxuGlowAdminLoggedIn') !== 'true') {
        console.warn("DOM Vendas: Usuário não logado. Redirecionando para a página de login.");
        window.location.href = 'index.html'; 
        return; 
    }
    console.log("DOM Vendas: Usuário logado.");

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
        // ... (resto das suas cores)
        '#f43f5e', '#facc15', '#818cf8', '#a78bfa', '#f472b6', '#60a5fa'
    ];
    const corLinhaTendencia = chartDatasetColorsDark[0];
    const corAreaTendencia = `${corLinhaTendencia}4D`;

    const kpiTotalVendasEl = document.getElementById('kpi-total-vendas') as HTMLElement | null;
    const kpiNumTransacoesEl = document.getElementById('kpi-num-transacoes') as HTMLElement | null;
    const kpiTicketMedioEl = document.getElementById('kpi-ticket-medio') as HTMLElement | null;
    const ctxCategoriaCanvas = document.getElementById('grafico-vendas-categoria') as HTMLCanvasElement | null;
    const ctxTendenciaCanvas = document.getElementById('grafico-tendencia-vendas') as HTMLCanvasElement | null;
    const corpoTabelaVendas = document.getElementById('corpo-tabela-vendas') as HTMLTableSectionElement | null;
    const cabecalhoTabelaVendasEl = document.getElementById('cabecalho-tabela') as HTMLTableRowElement | null;
    const filtroGeralInputVendas = document.getElementById('filtro-geral') as HTMLInputElement | null;
    const loadingMessageDivVendas = document.getElementById('loading-message') as HTMLDivElement | null;
    const errorMessageDivVendas = document.getElementById('error-message') as HTMLDivElement | null;
    const noDataMessageDivVendas = document.getElementById('no-data-message') as HTMLDivElement | null;

    let dadosCompletosVendas: LinhaPlanilhaVendas[] = [];
    let colunasDefinidasCSVVendas: string[] = [];

    const sidebarVendas = document.querySelector('.dashboard-sidebar') as HTMLElement | null;
    const menuToggleBtnVendas = document.querySelector('.menu-toggle-btn') as HTMLButtonElement | null;
    const bodyVendas = document.body;
    const navLinksVendas = document.querySelectorAll<HTMLAnchorElement>('.sidebar-nav a'); // Tipado como HTMLAnchorElement
    const sectionsVendas = document.querySelectorAll<HTMLElement>('.dashboard-page-content > .dashboard-section'); // Tipado como HTMLElement
    const tituloSecaoHeaderVendas = document.getElementById('dashboard-titulo-secao') as HTMLElement | null;

    if (sidebarVendas && menuToggleBtnVendas) {
        // ... (Sua lógica de abrir/fechar sidebar existente) ...
        menuToggleBtnVendas.addEventListener('click', () => {
            console.log("Vendas.ts: Botão de menu da sidebar clicado.");
            const isVisible = sidebarVendas.classList.toggle('sidebar-visible');
            bodyVendas.classList.toggle('sidebar-overlay-active', isVisible);
            menuToggleBtnVendas.setAttribute('aria-expanded', isVisible.toString());
        });
        bodyVendas.addEventListener('click', (event) => {
            if (bodyVendas.classList.contains('sidebar-overlay-active') && sidebarVendas.classList.contains('sidebar-visible')) {
                const target = event.target as HTMLElement;
                if (!sidebarVendas.contains(target) && !menuToggleBtnVendas.contains(target)) {
                    console.log("Vendas.ts: Clique fora da sidebar, fechando sidebar.");
                    sidebarVendas.classList.remove('sidebar-visible');
                    bodyVendas.classList.remove('sidebar-overlay-active');
                    menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    function updateActiveLinkAndTitleVendas(activeLink: HTMLAnchorElement | null) {
        console.log("Vendas.ts: updateActiveLinkAndTitleVendas chamado com link:", activeLink?.href);
        navLinksVendas.forEach(navLink => navLink.classList.remove('active'));
        if (activeLink) {
            activeLink.classList.add('active');
            if (tituloSecaoHeaderVendas) {
                // Tenta usar data-title, se não, usa textContent limpo
                let titulo = activeLink.dataset.title || activeLink.textContent?.trim() || 'Dashboard';
                if (!activeLink.dataset.title) { // Limpa o ícone do textContent apenas se data-title não foi usado
                    const iconSpan = activeLink.querySelector('.icon');
                    if (iconSpan && iconSpan.textContent) {
                        titulo = titulo.replace(iconSpan.textContent.trim(), '').trim();
                    }
                }
                // Ajuste específico para o título do dashboard principal, se necessário
                // A linha abaixo já faz isso no seu código original, mantendo:
                 tituloSecaoHeaderVendas.textContent = (titulo.toLowerCase() === 'dashboard' || titulo.toLowerCase() === 'visão geral das vendas') ? 'Visão Geral das Vendas' : titulo;
                console.log(`Vendas.ts: Título da seção atualizado para '${tituloSecaoHeaderVendas.textContent}'.`);
            }
        }
    }

    function showSectionVendas(targetId: string): boolean {
        console.log(`Vendas.ts: Tentando exibir seção: ${targetId}`);
        let sectionFoundAndDisplayed = false;
        if (!sectionsVendas || sectionsVendas.length === 0) {
            console.warn("Vendas.ts: Nenhuma .dashboard-section encontrada. Verifique o HTML de vendas.html.");
            if (targetId === 'secao-dashboard' && tituloSecaoHeaderVendas) {
                tituloSecaoHeaderVendas.textContent = 'Visão Geral das Vendas'; // Fallback de título
            }
            return false;
        }
        sectionsVendas.forEach(section => {
            const sectionEl = section as HTMLElement;
            if (sectionEl.id === targetId) {
                sectionEl.style.display = 'block';
                sectionEl.classList.add('active-section');
                console.log(`Vendas.ts: Seção ${targetId} ATIVADA.`);
                // Sua lógica de animação de cards
                sectionEl.querySelectorAll('.kpi-card, .grafico-card, .card-secao, .secao-tabela-detalhada').forEach((card, index) => {
                    (card as HTMLElement).style.animation = 'none'; void (card as HTMLElement).offsetWidth;
                    (card as HTMLElement).style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                sectionFoundAndDisplayed = true;
                // Renderiza dados apenas para a seção do dashboard e se os dados estiverem carregados
                if (targetId === 'secao-dashboard' && dadosCompletosVendas.length > 0) {
                    console.log("Vendas.ts: Renderizando KPIs e visualizações para secao-dashboard.");
                    calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                    renderizarTabelaVendas(dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, filtroGeralInputVendas?.value || '')));
                } else if (targetId === 'secao-dashboard' && dadosCompletosVendas.length === 0) {
                    console.log("Vendas.ts: Seção dashboard ativa, mas sem dados carregados ainda para KPIs/gráficos.");
                     // Pode querer mostrar uma mensagem específica ou aguardar o carregarDadosVendas
                }
            } else {
                sectionEl.style.display = 'none';
                sectionEl.classList.remove('active-section');
            }
        });
        if (!sectionFoundAndDisplayed) console.warn(`Vendas.ts: Nenhuma seção com ID '${targetId}' foi encontrada/exibida.`);
        return sectionFoundAndDisplayed;
    }

    // ***** INÍCIO DA SEÇÃO DE NAVEGAÇÃO DA SIDEBAR MODIFICADA *****
    navLinksVendas.forEach(link => {
        link.addEventListener('click', function(event: MouseEvent) {
            const currentAnchor = this; // 'this' já é HTMLAnchorElement aqui
            const href = currentAnchor.getAttribute('href');
            const dataTarget = currentAnchor.dataset.target;

            console.log(`Vendas.ts (Nav Modificada): Link clicado! HREF: ${href}, DataTarget: ${dataTarget}`);

            if (!href) { 
                event.preventDefault();
                console.warn("Vendas.ts (Nav Modificada): Link sem href.");
                return; 
            }

            const targetUrl = new URL(href, window.location.origin);
            const currentPageUrl = new URL(window.location.href);

            // Caso 1: Navegação para uma PÁGINA HTML DIFERENTE (ex: produtos.html)
            if (targetUrl.pathname !== currentPageUrl.pathname && href.includes('.html')) {
                console.log(`Vendas.ts (Nav Modificada): Navegação para OUTRA página HTML (${href}). Permitindo ação padrão.`);
                // Não chama preventDefault(), deixa o navegador fazer a transição
                return; 
            }
            
            // Caso 2: É um link externo completo (http://, https://, //)
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                console.log(`Vendas.ts (Nav Modificada): Navegação para URL externa (${href}). Permitindo ação padrão.`);
                // Não chama preventDefault()
                return;
            }

            // Se chegou aqui, é uma navegação interna na página atual (SPA) ou um link que deve ser tratado
            event.preventDefault();
            console.log(`Vendas.ts (Nav Modificada): Navegação interna ou link especial (HREF: '${href}'). Prevenindo padrão.`);
            
            let sectionIdToDisplay: string | null = null;

            if (dataTarget) { // Prioriza data-target para o ID da seção
                sectionIdToDisplay = dataTarget;
            } else if (targetUrl.hash && targetUrl.hash !== '#') { // Se não houver data-target, usa o hash
                sectionIdToDisplay = `secao-${targetUrl.hash.substring(1)}`; // Sua convenção: #nome -> secao-nome
            } else if (href === '#' || (targetUrl.pathname === currentPageUrl.pathname && !targetUrl.hash && !dataTarget)) {
                 // Link é apenas "#" ou aponta para a própria página sem hash/target específico
                 // Se for o link do "Dashboard" principal com href="#dashboard", ele será pego pelo dataTarget
                sectionIdToDisplay = 'secao-dashboard'; // Default para dashboard se for um link ambíguo na mesma página
                console.log(`Vendas.ts (Nav Modificada): Link para página atual sem target/hash claro, default para ${sectionIdToDisplay}.`);
            }

            if (sectionIdToDisplay) {
                if (showSectionVendas(sectionIdToDisplay)) {
                    updateActiveLinkAndTitleVendas(currentAnchor);
                    // Atualiza a URL com o hash se ele existir no link original e for diferente do hash atual
                    if (targetUrl.hash && targetUrl.hash !== currentPageUrl.hash) {
                        history.pushState({ section: sectionIdToDisplay, page: currentPageUrl.pathname }, "", targetUrl.href); // Usa o href original que contém o hash
                        console.log(`Vendas.ts (Nav Modificada): Histórico da URL atualizado para ${targetUrl.hash}`);
                    } else if (!targetUrl.hash && sectionIdToDisplay === 'secao-dashboard' && currentPageUrl.hash && currentPageUrl.hash !== '#') {
                        // Se está indo para o dashboard (que pode não ter hash no link) e havia um hash, limpa o hash.
                        history.pushState({ section: sectionIdToDisplay, page: currentPageUrl.pathname }, "", currentPageUrl.pathname);
                        console.log(`Vendas.ts (Nav Modificada): Histórico da URL atualizado para ${currentPageUrl.pathname} (hash limpo).`);
                    }
                }
            } else {
                console.warn(`Vendas.ts (Nav Modificada): Link (${href}) não resultou em um sectionIdToDisplay. Verifique data-target e href. Apenas atualizando estado ativo.`);
                updateActiveLinkAndTitleVendas(currentAnchor); 
            }

            // Lógica para fechar a sidebar em dispositivos móveis
            if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                sidebarVendas.classList.remove('sidebar-visible');
                bodyVendas.classList.remove('sidebar-overlay-active');
                menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
            }
        });
    });
    // ***** FIM DA SEÇÃO DE NAVEGAÇÃO DA SIDEBAR MODIFICADA *****


    function handlePageLoadAndNavigationVendas() {
        console.log("Vendas.ts: handlePageLoadAndNavigationVendas chamado. Hash atual:", location.hash);
        const currentPath = window.location.pathname.split('/').pop() || 'index.html'; // Ex: "vendas.html"
        const hash = location.hash.substring(1); // Ex: "dashboard" ou "clientes"
        let activeLinkElement: HTMLAnchorElement | null = null;
        let targetSectionId = '';

        // Verifica se estamos na página correta para esta lógica de seção (ex: vendas.html)
        // Adapte 'vendas.html' se o nome do seu arquivo principal do dashboard for outro
        if (currentPath.endsWith('vendas.html')) { 
            if (hash) {
                // Tenta encontrar link pelo hash. Links internos devem ser href="#hash_da_secao"
                activeLinkElement = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
                if (activeLinkElement) {
                    targetSectionId = activeLinkElement.dataset.target || `secao-${hash}`; // Usa data-target se existir
                } else {
                    targetSectionId = `secao-${hash}`; // Fallback para convenção se link não for encontrado
                }
            } else {
                // Se não houver hash, carrega a seção padrão do dashboard
                targetSectionId = 'secao-dashboard';
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"]');
            }

            console.log(`Vendas.ts: Tentando mostrar seção inicial (em vendas.html): ${targetSectionId}`);
            if (!showSectionVendas(targetSectionId)) {
                 // Se a seção do hash não foi encontrada, tenta mostrar 'secao-dashboard' como padrão.
                console.warn(`Vendas.ts: Seção para hash '${hash}' (${targetSectionId}) não encontrada ou não exibida, mostrando 'secao-dashboard' como padrão.`);
                showSectionVendas('secao-dashboard');
                // Tenta encontrar o link do dashboard para ativar
                if (!activeLinkElement) { // Se o link para o hash não foi encontrado antes
                    activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"]');
                }
            }
        } else {
            // Se não estiver em vendas.html, apenas tenta marcar o link ativo correspondente à página atual.
            activeLinkElement = document.querySelector(`.sidebar-nav a[href$="${currentPath}"]`);
            console.log(`Vendas.ts: Não estamos em vendas.html. Link ativo por path:`, activeLinkElement);
        }
        
        // Atualiza o link ativo e o título
        if (activeLinkElement) {
            updateActiveLinkAndTitleVendas(activeLinkElement);
        } else if (currentPath.endsWith('vendas.html') && !hash) { 
            // Se estamos em vendas.html, sem hash, e não achamos link específico, garante que o link do dashboard fique ativo
            const dashboardLinkFallback = document.querySelector('.sidebar-nav a[href="#dashboard"]') as HTMLAnchorElement | null;
            if (dashboardLinkFallback) updateActiveLinkAndTitleVendas(dashboardLinkFallback);
        } else {
            console.log("Vendas.ts: Nenhum link ativo encontrado por URL/hash para destacar.");
        }
    }

    window.addEventListener('popstate', (event: PopStateEvent) => {
        console.log("Vendas.ts: Evento popstate disparado.", event.state);
        handlePageLoadAndNavigationVendas(); // Recarrega a seção baseada na nova URL (hash)
    });

    // --- Suas funções de dados, KPIs, gráficos e tabela (mantidas como estavam) ---
    const mostrarMensagemVendas = (elemento: HTMLElement | null, mensagem: string = '', mostrarSpinner: boolean = false): void => {
        if (loadingMessageDivVendas && elemento !== loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
        if (errorMessageDivVendas && elemento !== errorMessageDivVendas) errorMessageDivVendas.style.display = 'none';
        if (noDataMessageDivVendas && elemento !== noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';
        if (elemento) {
            elemento.innerHTML = '';
            if (mostrarSpinner) {
                const spinner = document.createElement('div'); spinner.className = 'spinner'; elemento.appendChild(spinner);
            }
            if (mensagem) elemento.appendChild(document.createTextNode(mostrarSpinner ? ' ' + mensagem : mensagem));
            elemento.style.display = 'flex';
        }
    };

    const processarCSVVendas = (textoCsv: string): { cabecalhos: string[], linhas: LinhaPlanilhaVendas[] } => {
        const todasLinhasTexto = textoCsv.trim().split('\n');
        if (todasLinhasTexto.length === 0 || todasLinhasTexto[0].trim() === '') return { cabecalhos: [], linhas: [] };
        const cabecalhoLinha = todasLinhasTexto.shift();
        if (!cabecalhoLinha) return { cabecalhos: [], linhas: [] };
        const cabecalhos = cabecalhoLinha.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        colunasDefinidasCSVVendas = cabecalhos; // Define as colunas globalmente
        const linhasProcessadas: LinhaPlanilhaVendas[] = todasLinhasTexto.map((linhaTexto) => {
            const valores: string[] = []; let dentroDeAspas = false; let valorAtual = '';
            for (let i = 0; i < linhaTexto.length; i++) {
                const char = linhaTexto[i];
                if (char === '"') { if (dentroDeAspas && i + 1 < linhaTexto.length && linhaTexto[i+1] === '"') { valorAtual += '"'; i++; continue; } dentroDeAspas = !dentroDeAspas; }
                else if (char === ',' && !dentroDeAspas) { valores.push(valorAtual.trim().replace(/^"|"$/g, '')); valorAtual = ''; }
                else { valorAtual += char; }
            }
            valores.push(valorAtual.trim().replace(/^"|"$/g, ''));
            const linhaObj: LinhaPlanilhaVendas = {};
            cabecalhos.forEach((cabecalho, index) => { linhaObj[cabecalho] = valores[index] !== undefined ? valores[index] : ''; });
            return linhaObj;
        });
        return { cabecalhos, linhas: linhasProcessadas };
    };

    const formatarMoedaVendas = (valor: number | string): string => {
        let numValor = typeof valor === 'string' ? parseFloat(valor.replace(/[R$. ]/g, '').replace(',', '.')) : valor;
        if (typeof numValor !== 'number' || isNaN(numValor)) return 'R$ 0,00';
        return numValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const calcularKPIsEVisualizacoesVendas = (dados: LinhaPlanilhaVendas[]): void => {
        console.log("Vendas.ts: Calculando KPIs e Visualizações com", dados.length, "linhas de dados.");
        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = '0';
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(0);

        if (dados.length === 0) {
            if (graficoCategoriaInstanceVendas) graficoCategoriaInstanceVendas.destroy();
            if (graficoTendenciaInstanceVendas) graficoTendenciaInstanceVendas.destroy();
            console.log("Vendas.ts: Nenhum dado para KPIs ou gráficos.");
            return;
        }
        let totalVendasNumerico = 0;
        const vendasPorCategoria: { [categoria: string]: number } = {};
        const vendasPorMes: { [mesAno: string]: { total: number, ano: number, mes: number } } = {};
        dados.forEach((item) => {
            const valorVendaStr = String(item[NOME_COLUNA_VALOR_VENDA_VENDAS] || '0').replace(/[R$. ]/g, '').replace(',', '.');
            const valorVendaNum = parseFloat(valorVendaStr);
            if (!isNaN(valorVendaNum)) {
                totalVendasNumerico += valorVendaNum;
                const categoria = String(item[NOME_COLUNA_CATEGORIA_VENDAS] || 'Outros').trim();
                vendasPorCategoria[categoria] = (vendasPorCategoria[categoria] || 0) + valorVendaNum;
                const dataStr = String(item[NOME_COLUNA_DATA_VENDAS] || '').trim();
                if (dataStr) {
                    let dataObj: Date | null = null;
                    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataStr)) { const p = dataStr.split('/'); dataObj = new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])); }
                    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(dataStr)) { const p = dataStr.split('-'); dataObj = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])); }
                    if (dataObj && !isNaN(dataObj.getTime())) {
                        const m = dataObj.getMonth() + 1; const a = dataObj.getFullYear(); const k = `${a}-${m.toString().padStart(2, '0')}`;
                        if (!vendasPorMes[k]) vendasPorMes[k] = { total: 0, ano: a, mes: m };
                        vendasPorMes[k].total += valorVendaNum;
                    }
                }
            }
        });
        const numTransacoes = dados.length;
        const ticketMedio = numTransacoes > 0 ? totalVendasNumerico / numTransacoes : 0;
        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(totalVendasNumerico);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = numTransacoes.toString();
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(ticketMedio);

        if (ctxCategoriaCanvas) { /* ... seu código de gráfico de categoria ... */ 
            const ctx = ctxCategoriaCanvas.getContext('2d');
            if (ctx) {
                if (graficoCategoriaInstanceVendas) graficoCategoriaInstanceVendas.destroy();
                graficoCategoriaInstanceVendas = new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(vendasPorCategoria), datasets: [{ label: 'Vendas por Categoria', data: Object.values(vendasPorCategoria), backgroundColor: chartDatasetColorsDark, borderColor: corFundoCardsDark, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 }, color: corTextoSecundarioDark } }, tooltip: { bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark, backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10, callbacks: { label: (c: any) => `${c.label}: ${formatarMoedaVendas(c.raw)}` } } } } });
            }
        }
        if (ctxTendenciaCanvas) { /* ... seu código de gráfico de tendência ... */ 
            const ctx = ctxTendenciaCanvas.getContext('2d');
            if (ctx) {
                if (graficoTendenciaInstanceVendas) graficoTendenciaInstanceVendas.destroy();
                const chaves = Object.keys(vendasPorMes).sort();
                const labels = chaves.map(k => { const { ano, mes } = vendasPorMes[k]; return `${mes.toString().padStart(2, '0')}/${ano.toString().slice(-2)}`; }); // Ajuste para ano com 2 dígitos
                const valores = chaves.map(k => vendasPorMes[k].total);
                graficoTendenciaInstanceVendas = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Tendência de Vendas Mensais', data: valores, borderColor: corLinhaTendencia, backgroundColor: corAreaTendencia, tension: 0.3, fill: true, pointBackgroundColor: corLinhaTendencia, pointBorderColor: corTextoPrincipalDark, pointHoverBackgroundColor: corTextoPrincipalDark, pointHoverBorderColor: corLinhaTendencia }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => formatarMoedaVendas(v), color: corTextoSecundarioDark }, grid: { color: corBordasDark, drawBorder: false } }, x: { ticks: { color: corTextoSecundarioDark, maxRotation: 0, autoSkipPadding: 20 }, grid: { color: corBordasDark, display: false } } }, plugins: { legend: { display: true, labels: { color: corTextoSecundarioDark, padding: 15, font: {size: 11} } }, tooltip: { bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark, backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10, callbacks: { label: (c: any) => `${c.dataset.label || 'Vendas'}: ${formatarMoedaVendas(c.raw)}` } } } } });
            }
        }
    };

    const renderizarTabelaVendas = (dadosParaRenderizar: LinhaPlanilhaVendas[]): void => {
        if (!corpoTabelaVendas || !cabecalhoTabelaVendasEl) { console.error("Vendas.ts: Elementos da tabela não encontrados."); return; }
        
        if (cabecalhoTabelaVendasEl.children.length === 0 && colunasDefinidasCSVVendas.length > 0) {
            cabecalhoTabelaVendasEl.innerHTML = ''; // Limpa cabeçalhos existentes
            colunasDefinidasCSVVendas.forEach(textoCabecalho => {
                const th = document.createElement('th'); th.textContent = textoCabecalho;
                const thLower = textoCabecalho.toLowerCase();
                if (thLower.includes('valor') || thLower.includes('preço') || thLower.includes('total') || thLower.includes('qtd') || thLower.includes('quantidade') || thLower.includes('número') || thLower.includes('estoque')) {
                    th.classList.add('coluna-numero');
                }
                cabecalhoTabelaVendasEl.appendChild(th);
            });
        }
        corpoTabelaVendas.innerHTML = ''; // Limpa o corpo da tabela
        if (dadosParaRenderizar.length === 0) {
            mostrarMensagemVendas(noDataMessageDivVendas, colunasDefinidasCSVVendas.length > 0 ? 'Nenhum dado encontrado para os filtros aplicados.' : 'Nenhum dado para exibir na tabela.');
            return;
        }
        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';

        dadosParaRenderizar.forEach((linhaObj) => {
            const tr = document.createElement('tr');
            colunasDefinidasCSVVendas.forEach(cabecalho => {
                const td = document.createElement('td');
                let valor = linhaObj[cabecalho] !== undefined ? String(linhaObj[cabecalho]) : '';
                const cabecalhoLower = cabecalho.toLowerCase();
                 if (cabecalho.toLowerCase() === NOME_COLUNA_VALOR_VENDA_VENDAS.toLowerCase() || cabecalhoLower.includes('preço') || cabecalhoLower.includes('total')) {
                    td.textContent = formatarMoedaVendas(valor); // Mostra R$
                    td.classList.add('coluna-numero', 'coluna-monetaria'); 
                } else if (cabecalhoLower.includes('qtd') || cabecalhoLower.includes('quantidade') || cabecalhoLower.includes('número') || cabecalhoLower.includes('estoque') || cabecalhoLower.includes('id ')) {
                     td.textContent = valor;
                     td.classList.add('coluna-numero');
                } else { 
                    td.textContent = valor; 
                }
                tr.appendChild(td);
            });
            corpoTabelaVendas.appendChild(tr);
        });
    };

    const filtrarLinhaVendas = (linha: LinhaPlanilhaVendas, termoBusca: string): boolean => {
        if (!termoBusca) return true;
        const termoLower = termoBusca.toLowerCase();
        return colunasDefinidasCSVVendas.some(cabecalho => String(linha[cabecalho]).toLowerCase().includes(termoLower));
    };

    const carregarDadosVendas = async (): Promise<void> => {
        console.log("Vendas.ts: Iniciando carregarDadosVendas()...");
        mostrarMensagemVendas(loadingMessageDivVendas, 'Carregando dados do dashboard...', true);
        if (!URL_PLANILHA_CSV_VENDAS || URL_PLANILHA_CSV_VENDAS.includes('COLE_AQUI') || URL_PLANILHA_CSV_VENDAS.length < 50) {
            mostrarMensagemVendas(errorMessageDivVendas, 'Erro: URL da planilha CSV de Vendas não configurada ou inválida.');
            colunasDefinidasCSVVendas = []; dadosCompletosVendas = []; renderizarTabelaVendas([]); calcularKPIsEVisualizacoesVendas([]); 
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none'; // Esconde loading em caso de erro de URL
            return;
        }
        try {
            const resposta = await fetch(URL_PLANILHA_CSV_VENDAS);
            if (!resposta.ok) { throw new Error(`Falha ao buscar CSV de Vendas: ${resposta.status} ${resposta.statusText}. Verifique URL e permissões.`); }
            const textoCsv = await resposta.text();
            if (!textoCsv || textoCsv.trim() === '') { throw new Error('CSV de Vendas vazio ou inválido.'); }
            
            const { cabecalhos, linhas } = processarCSVVendas(textoCsv);
            dadosCompletosVendas = linhas;
            
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            
            // Chama handlePageLoadAndNavigationVendas DEPOIS que os dados são carregados e processados.
            // Isso garante que showSectionVendas tenha dados para renderizar se a seção do dashboard for a ativa.
            handlePageLoadAndNavigationVendas(); 

            // Se a seção do dashboard estiver ativa E não houver dados (após o processamento), mostra mensagem.
            if (dadosCompletosVendas.length === 0 && document.getElementById('secao-dashboard')?.style.display !== 'none') {
                mostrarMensagemVendas(noDataMessageDivVendas, colunasDefinidasCSVVendas.length > 0 ? 'Nenhum dado encontrado na planilha.' : 'Verifique o formato da planilha.');
            }
        } catch (erro: any) {
            console.error("DOM Vendas: Erro detalhado ao carregar/processar dados de Vendas:", erro);
            mostrarMensagemVendas(errorMessageDivVendas, `Erro ao carregar dados: ${erro.message}`);
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none'; // Garante que loading desapareça em erro
             // Chama para configurar a página mesmo em erro, para que a navegação ainda funcione
            handlePageLoadAndNavigationVendas();
        }
    };

    if (filtroGeralInputVendas) {
        filtroGeralInputVendas.addEventListener('input', (e) => {
            const termoBusca = (e.target as HTMLInputElement).value.trim();
            if (document.getElementById('secao-dashboard')?.style.display !== 'none') { // Só filtra se a seção do dashboard estiver visível
                 const dadosFiltrados = dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoBusca));
                 renderizarTabelaVendas(dadosFiltrados);
            }
        });
    }
    
    carregarDadosVendas();

    const tabelaContainers = document.querySelectorAll('.tabela-responsiva-container');
    tabelaContainers.forEach(container => { /* ... sua lógica de sombra de scroll ... */ 
        const tableContainer = container as HTMLElement;
        function updateScrollShadows() {
            const maxScrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
            tableContainer.classList.toggle('is-scrolling-left', tableContainer.scrollLeft > 1);
            tableContainer.classList.toggle('is-scrolling-right', tableContainer.scrollLeft < maxScrollLeft - 1);
        }
        tableContainer.addEventListener('scroll', updateScrollShadows);
        updateScrollShadows(); // Chamada inicial
    });
});