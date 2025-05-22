console.log("LOG INICIAL: js/vendas.ts foi lido pelo navegador.");

declare var Chart: any; // Para Chart.js

// URL DA SUA PLANILHA PUBLICADA COMO CSV PARA VENDAS
const URL_PLANILHA_CSV_VENDAS: string = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIfu_bkc8cu1dNbItO9zktGmn4JjNjQEoLAzGcG9rZDyfDyDp4ISEqpPKzIFTWFrMNVIz05V3NTpGT/pub?output=csv';

interface LinhaPlanilhaVendas {
    [key: string]: string | number;
}

let graficoCategoriaInstanceVendas: any = null;
let graficoTendenciaInstanceVendas: any = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG VENDAS: DOMContentLoaded INICIADO. Tentando executar o script.");

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
        computedStyles.getPropertyValue('--cor-destaque-accent-dark').trim() || '#f43f5e',
        computedStyles.getPropertyValue('--cor-kpi-icon-bg-favorites').trim() || '#facc15',
        '#818cf8', '#a78bfa', '#f472b6', '#60a5fa'
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
    const navLinksVendas = document.querySelectorAll<HTMLAnchorElement>('.sidebar-nav a');
    const sectionsVendas = document.querySelectorAll<HTMLElement>('.dashboard-page-content > .dashboard-section');
    const tituloSecaoHeaderVendas = document.getElementById('dashboard-titulo-secao') as HTMLElement | null;

    if (sidebarVendas && menuToggleBtnVendas) {
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
                let titulo = activeLink.dataset.title || activeLink.textContent?.trim() || 'Dashboard';
                if (!activeLink.dataset.title) { // Só limpa ícone se não usou data-title
                    const iconSpan = activeLink.querySelector('.icon');
                    if (iconSpan && iconSpan.textContent) {
                        titulo = titulo.replace(iconSpan.textContent.trim(), '').trim();
                    }
                }
                // Ajusta o título se for "Dashboard" para algo mais específico se desejado
                const lowerCaseTitle = titulo.toLowerCase();
                if (lowerCaseTitle === 'dashboard' || lowerCaseTitle === 'visão geral das vendas') {
                    tituloSecaoHeaderVendas.textContent = 'Visão Geral das Vendas';
                } else {
                    tituloSecaoHeaderVendas.textContent = titulo;
                }
                console.log(`Vendas.ts: Título da seção atualizado para '${tituloSecaoHeaderVendas.textContent}'.`);
            }
        }
    }

    function showSectionVendas(targetId: string): boolean {
        console.log(`DEBUG VENDAS (showSection): INICIADO para targetId: '${targetId}'. Comprimento de dadosCompletosVendas: ${dadosCompletosVendas.length}`);

        let sectionFoundAndDisplayed = false;
        if (!sectionsVendas || sectionsVendas.length === 0) {
            console.warn("Vendas.ts: Nenhuma .dashboard-section encontrada. Verifique o HTML de vendas.html.");
            if (targetId === 'secao-dashboard' && tituloSecaoHeaderVendas) {
                tituloSecaoHeaderVendas.textContent = 'Visão Geral das Vendas';
            }
            return false;
        }
        sectionsVendas.forEach(section => {
            const sectionEl = section as HTMLElement;
            if (sectionEl.id === targetId) {
                sectionEl.style.display = 'block';
                sectionEl.classList.add('active-section');
                console.log(`DEBUG VENDAS (showSection): Seção ${targetId} ATIVADA e display=block.`);

                sectionEl.querySelectorAll('.kpi-card, .grafico-card, .card-secao, .secao-tabela-detalhada').forEach((card, index) => {
                    (card as HTMLElement).style.animation = 'none'; void (card as HTMLElement).offsetWidth;
                    (card as HTMLElement).style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                sectionFoundAndDisplayed = true;
                
                if (targetId === 'secao-dashboard') {
                    if (dadosCompletosVendas.length > 0) {
                        console.log("DEBUG VENDAS (showSection): DADOS PRESENTES. Renderizando KPIs e visualizações para secao-dashboard.");
                        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none'; // Esconde msg "sem dados"
                        calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                        renderizarTabelaVendas(dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, filtroGeralInputVendas?.value || '')));
                    } else {
                        console.warn("DEBUG VENDAS (showSection): DADOS AUSENTES para secao-dashboard. KPIs/gráficos/tabela NÃO serão renderizados. Limpando área.");
                        if (graficoCategoriaInstanceVendas) graficoCategoriaInstanceVendas.destroy();
                        if (graficoTendenciaInstanceVendas) graficoTendenciaInstanceVendas.destroy();
                        if (corpoTabelaVendas) corpoTabelaVendas.innerHTML = ''; 
                        if (cabecalhoTabelaVendasEl) cabecalhoTabelaVendasEl.innerHTML = ''; // Limpa cabeçalho também
                        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
                        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = '0';
                        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(0);
                        mostrarMensagemVendas(noDataMessageDivVendas, 'Nenhum dado de vendas para exibir no dashboard no momento.');
                    }
                }
            } else {
                sectionEl.style.display = 'none';
                sectionEl.classList.remove('active-section');
            }
        });
        if (!sectionFoundAndDisplayed) console.warn(`Vendas.ts: Nenhuma seção com ID '${targetId}' foi encontrada/exibida.`);
        return sectionFoundAndDisplayed;
    }

    navLinksVendas.forEach(link => {
        link.addEventListener('click', function(event: MouseEvent) {
            const currentAnchor = this; 
            const href = currentAnchor.getAttribute('href');
            const dataTarget = currentAnchor.dataset.target;

            console.log(`DEBUG VENDAS (Nav): Link clicado! HREF: ${href}, DataTarget: ${dataTarget}`);

            if (!href) { 
                event.preventDefault();
                console.warn("DEBUG VENDAS (Nav): Link sem href.");
                return; 
            }

            const targetUrl = new URL(href, window.location.origin);
            const currentPageUrl = new URL(window.location.href);

            if (targetUrl.pathname !== currentPageUrl.pathname && href.includes('.html')) {
                console.log(`DEBUG VENDAS (Nav): Navegação para OUTRA página HTML (${href}). Permitindo ação padrão.`);
                if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                    sidebarVendas.classList.remove('sidebar-visible');
                    bodyVendas.classList.remove('sidebar-overlay-active');
                    menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
                }
                return; 
            }
            
            if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                console.log(`DEBUG VENDAS (Nav): Navegação para URL externa (${href}). Permitindo ação padrão.`);
                return;
            }

            event.preventDefault();
            console.log(`DEBUG VENDAS (Nav): Navegação interna ou link especial (HREF: '${href}'). Prevenindo padrão.`);
            
            let sectionIdToDisplay: string | null = null;

            if (dataTarget) { 
                sectionIdToDisplay = dataTarget;
            } else if (targetUrl.hash && targetUrl.hash !== '#') { 
                sectionIdToDisplay = `secao-${targetUrl.hash.substring(1)}`; 
            } else if (href === '#' || (targetUrl.pathname === currentPageUrl.pathname && !targetUrl.hash && !dataTarget)) {
                sectionIdToDisplay = 'secao-dashboard'; 
                console.log(`DEBUG VENDAS (Nav): Link para página atual sem target/hash claro, default para ${sectionIdToDisplay}.`);
            }

            if (sectionIdToDisplay) {
                console.log(`DEBUG VENDAS (Nav): Tentando exibir seção via click: ${sectionIdToDisplay}`);
                if (showSectionVendas(sectionIdToDisplay)) {
                    updateActiveLinkAndTitleVendas(currentAnchor);
                    if (targetUrl.hash && targetUrl.hash !== currentPageUrl.hash) {
                        history.pushState({ section: sectionIdToDisplay, page: currentPageUrl.pathname }, "", targetUrl.href);
                        console.log(`DEBUG VENDAS (Nav): Histórico da URL atualizado para ${targetUrl.href}`);
                    } else if (!targetUrl.hash && sectionIdToDisplay === 'secao-dashboard' && currentPageUrl.hash && currentPageUrl.hash !== '#') {
                        history.pushState({ section: sectionIdToDisplay, page: currentPageUrl.pathname }, "", currentPageUrl.pathname);
                        console.log(`DEBUG VENDAS (Nav): Histórico da URL atualizado para ${currentPageUrl.pathname} (hash limpo).`);
                    }
                } else {
                     console.warn(`DEBUG VENDAS (Nav): showSectionVendas retornou false para ${sectionIdToDisplay}. A seção pode não existir.`);
                }
            } else {
                console.warn(`DEBUG VENDAS (Nav): Link (${href}) não resultou em um sectionIdToDisplay. Apenas atualizando estado ativo.`);
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
        console.log("DEBUG VENDAS (handlePageLoad): INICIADO. Hash:", location.hash, "Path:", window.location.pathname);
        const currentPathFilename = window.location.pathname.split('/').pop() || 'index.html';
        const hash = location.hash.substring(1); // "dashboard", "clientes", etc.
        let activeLinkElement: HTMLAnchorElement | null = null;
        let targetSectionIdFromLoad = '';

        // Adapte 'vendas.html' se o nome do seu arquivo principal do dashboard for outro.
        // Esta lógica é para quando a página vendas.html é carregada/recarregada.
        if (currentPathFilename.endsWith('vendas.html')) { 
            if (hash) {
                activeLinkElement = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || `secao-${hash}`;
            } else {
                // Default para #dashboard se não houver hash em vendas.html
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"]');
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || 'secao-dashboard';
            }

            console.log(`DEBUG VENDAS (handlePageLoad): Em vendas.html. targetSectionIdFromLoad: '${targetSectionIdFromLoad}', activeLinkElement:`, activeLinkElement);
            
            if (!showSectionVendas(targetSectionIdFromLoad)) {
                console.warn(`DEBUG VENDAS (handlePageLoad): Seção '${targetSectionIdFromLoad}' (do hash/default) não encontrada/exibida. Tentando 'secao-dashboard'.`);
                showSectionVendas('secao-dashboard'); // Tenta mostrar dashboard como fallback máximo
                if (!activeLinkElement) { // Se o link para o hash não existia, pega o do dashboard
                    activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"]');
                }
            }
        } else {
            // Se não estiver em vendas.html, apenas tenta marcar o link ativo correspondente à página atual (ex: produtos.html)
            // Esta parte pode não ser necessária se cada página HTML gerencia seu próprio link ativo.
            activeLinkElement = document.querySelector(`.sidebar-nav a[href$="${currentPathFilename}"]`);
            console.log(`DEBUG VENDAS (handlePageLoad): Não estamos em vendas.html. Link ativo por path:`, activeLinkElement);
        }
        
        if (activeLinkElement) {
            updateActiveLinkAndTitleVendas(activeLinkElement);
        } else if (currentPathFilename.endsWith('vendas.html') && !hash) { 
            const dashboardLinkFallback = document.querySelector('.sidebar-nav a[href="#dashboard"]') as HTMLAnchorElement | null;
            if (dashboardLinkFallback) updateActiveLinkAndTitleVendas(dashboardLinkFallback);
             console.log("DEBUG VENDAS (handlePageLoad): Nenhum link ativo específico, usando fallback para link do dashboard em vendas.html.");
        } else {
            console.log("DEBUG VENDAS (handlePageLoad): Nenhum link ativo encontrado por URL/hash para destacar nesta página.");
        }
    }

    window.addEventListener('popstate', (event: PopStateEvent) => {
        console.log("DEBUG VENDAS: Evento popstate disparado.", event.state);
        handlePageLoadAndNavigationVendas(); 
    });

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
            elemento.style.display = 'flex'; // Alterado para flex para centralizar spinner/texto se necessário
        }
    };

    const processarCSVVendas = (textoCsv: string): { cabecalhos: string[], linhas: LinhaPlanilhaVendas[] } => {
        const todasLinhasTexto = textoCsv.trim().split('\n');
        if (todasLinhasTexto.length === 0 || todasLinhasTexto[0].trim() === '') return { cabecalhos: [], linhas: [] };
        const cabecalhoLinha = todasLinhasTexto.shift();
        if (!cabecalhoLinha) return { cabecalhos: [], linhas: [] };
        const cabecalhos = cabecalhoLinha.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        colunasDefinidasCSVVendas = cabecalhos;
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
        console.log("DEBUG VENDAS (calcularKPIs): INICIADO com dados.length:", dados.length);
        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = '0';
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(0);

        if (dados.length === 0) {
            if (graficoCategoriaInstanceVendas) { graficoCategoriaInstanceVendas.destroy(); graficoCategoriaInstanceVendas = null; }
            if (graficoTendenciaInstanceVendas) { graficoTendenciaInstanceVendas.destroy(); graficoTendenciaInstanceVendas = null; }
            console.log("DEBUG VENDAS (calcularKPIs): Sem dados, gráficos destruídos (se existiam).");
            return;
        }
        // ... (resto da sua lógica de cálculo de KPIs e criação de gráficos) ...
        // Certifique-se que o código abaixo é o seu original e funcional:
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
        console.log("DEBUG VENDAS (calcularKPIs): KPIs atualizados.");

        if (ctxCategoriaCanvas) { 
            const ctx = ctxCategoriaCanvas.getContext('2d');
            if (ctx) {
                if (graficoCategoriaInstanceVendas) graficoCategoriaInstanceVendas.destroy();
                graficoCategoriaInstanceVendas = new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(vendasPorCategoria), datasets: [{ label: 'Vendas por Categoria', data: Object.values(vendasPorCategoria), backgroundColor: chartDatasetColorsDark, borderColor: corFundoCardsDark, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 }, color: corTextoSecundarioDark } }, tooltip: { bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark, backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10, callbacks: { label: (c: any) => `${c.label}: ${formatarMoedaVendas(c.raw)}` } } } } });
                console.log("DEBUG VENDAS (calcularKPIs): Gráfico de categorias renderizado.");
            }
        }
        if (ctxTendenciaCanvas) { 
            const ctx = ctxTendenciaCanvas.getContext('2d');
            if (ctx) {
                if (graficoTendenciaInstanceVendas) graficoTendenciaInstanceVendas.destroy();
                const chaves = Object.keys(vendasPorMes).sort();
                const labels = chaves.map(k => { const { ano, mes } = vendasPorMes[k]; return `${mes.toString().padStart(2, '0')}/${ano.toString().slice(-2)}`; });
                const valores = chaves.map(k => vendasPorMes[k].total);
                graficoTendenciaInstanceVendas = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Tendência de Vendas Mensais', data: valores, borderColor: corLinhaTendencia, backgroundColor: corAreaTendencia, tension: 0.3, fill: true, pointBackgroundColor: corLinhaTendencia, pointBorderColor: corTextoPrincipalDark, pointHoverBackgroundColor: corTextoPrincipalDark, pointHoverBorderColor: corLinhaTendencia }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => formatarMoedaVendas(v), color: corTextoSecundarioDark }, grid: { color: corBordasDark, drawBorder: false } }, x: { ticks: { color: corTextoSecundarioDark, maxRotation: 0, autoSkipPadding: 20 }, grid: { color: corBordasDark, display: false } } }, plugins: { legend: { display: true, labels: { color: corTextoSecundarioDark, padding: 15, font: {size: 11} } }, tooltip: { bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark, backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10, callbacks: { label: (c: any) => `${c.dataset.label || 'Vendas'}: ${formatarMoedaVendas(c.raw)}` } } } } });
                console.log("DEBUG VENDAS (calcularKPIs): Gráfico de tendência renderizado.");
            }
        }
    };

    const renderizarTabelaVendas = (dadosParaRenderizar: LinhaPlanilhaVendas[]): void => {
        if (!corpoTabelaVendas || !cabecalhoTabelaVendasEl) { console.error("Vendas.ts: Elementos da tabela não encontrados para renderizar."); return; }
        console.log("DEBUG VENDAS (renderizarTabela): INICIADO com dadosParaRenderizar.length:", dadosParaRenderizar.length);
        
        if (cabecalhoTabelaVendasEl.children.length === 0 && colunasDefinidasCSVVendas.length > 0) {
            cabecalhoTabelaVendasEl.innerHTML = ''; 
            colunasDefinidasCSVVendas.forEach(textoCabecalho => {
                const th = document.createElement('th'); th.textContent = textoCabecalho;
                const thLower = textoCabecalho.toLowerCase();
                if (thLower.includes('valor') || thLower.includes('preço') || thLower.includes('total') || thLower.includes('qtd') || thLower.includes('quantidade') || thLower.includes('número') || thLower.includes('estoque')) {
                    th.classList.add('coluna-numero');
                }
                cabecalhoTabelaVendasEl.appendChild(th);
            });
        }
        corpoTabelaVendas.innerHTML = ''; 
        if (dadosParaRenderizar.length === 0) {
            mostrarMensagemVendas(noDataMessageDivVendas, colunasDefinidasCSVVendas.length > 0 ? 'Nenhum dado encontrado para os filtros aplicados.' : 'Nenhum dado para exibir na tabela.');
            return;
        }
        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';

        dadosParaRenderizar.forEach((linhaObj) => { /* ... sua lógica de renderizar linhas da tabela ... */ 
            const tr = document.createElement('tr');
            colunasDefinidasCSVVendas.forEach(cabecalho => {
                const td = document.createElement('td');
                let valor = linhaObj[cabecalho] !== undefined ? String(linhaObj[cabecalho]) : '';
                const cabecalhoLower = cabecalho.toLowerCase();
                 if (cabecalho.toLowerCase() === NOME_COLUNA_VALOR_VENDA_VENDAS.toLowerCase() || cabecalhoLower.includes('preço') || cabecalhoLower.includes('total')) {
                    td.textContent = formatarMoedaVendas(valor); 
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
        console.log("DEBUG VENDAS (renderizarTabela): Tabela renderizada.");
    };

    const filtrarLinhaVendas = (linha: LinhaPlanilhaVendas, termoBusca: string): boolean => {
        if (!termoBusca) return true;
        const termoLower = termoBusca.toLowerCase();
        return colunasDefinidasCSVVendas.some(cabecalho => String(linha[cabecalho]).toLowerCase().includes(termoLower));
    };

    const carregarDadosVendas = async (): Promise<void> => {
        console.log("DEBUG VENDAS (carregarDadosVendas): INICIADO...");
        mostrarMensagemVendas(loadingMessageDivVendas, 'Carregando dados do dashboard...', true);
        if (!URL_PLANILHA_CSV_VENDAS || URL_PLANILHA_CSV_VENDAS.includes('COLE_AQUI') || URL_PLANILHA_CSV_VENDAS.length < 50) {
            mostrarMensagemVendas(errorMessageDivVendas, 'Erro: URL da planilha CSV de Vendas não configurada ou inválida.');
            colunasDefinidasCSVVendas = []; dadosCompletosVendas = []; 
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            console.log("DEBUG VENDAS (carregarDadosVendas): Chamando handlePageLoad (URL inválida).");
            handlePageLoadAndNavigationVendas(); // Configura a UI base mesmo com erro de URL
            return;
        }
        try {
            const resposta = await fetch(URL_PLANILHA_CSV_VENDAS);
            console.log("DEBUG VENDAS (carregarDadosVendas): Resposta do fetch:", resposta.status, resposta.statusText);
            if (!resposta.ok) { throw new Error(`Falha ao buscar CSV: ${resposta.status} ${resposta.statusText}. Verifique URL e permissões.`); }
            const textoCsv = await resposta.text();
            if (!textoCsv || textoCsv.trim() === '') { throw new Error('CSV de Vendas vazio ou inválido.'); }
            
            const { cabecalhos, linhas } = processarCSVVendas(textoCsv);
            dadosCompletosVendas = linhas;
            console.log("DEBUG VENDAS (carregarDadosVendas): dadosCompletosVendas populado. Comprimento:", dadosCompletosVendas.length);
            
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            
            console.log("DEBUG VENDAS (carregarDadosVendas): Chamando handlePageLoadAndNavigationVendas APÓS DADOS.");
            handlePageLoadAndNavigationVendas(); 

            // A lógica de "no data" é melhor tratada dentro de showSectionVendas agora
        } catch (erro: any) {
            console.error("DEBUG VENDAS (carregarDadosVendas): ERRO no try/catch:", erro);
            mostrarMensagemVendas(errorMessageDivVendas, `Erro ao carregar dados: ${erro.message}`);
            dadosCompletosVendas = []; // Garante que dados estejam vazios em caso de erro
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            console.log("DEBUG VENDAS (carregarDadosVendas): Chamando handlePageLoadAndNavigationVendas do CATCH.");
            handlePageLoadAndNavigationVendas();
        }
    };

    if (filtroGeralInputVendas) {
        filtroGeralInputVendas.addEventListener('input', (e) => {
            const termoBusca = (e.target as HTMLInputElement).value.trim();
            // Verifica se a seção do dashboard está visível antes de filtrar e re-renderizar
            const dashboardSection = document.getElementById('secao-dashboard');
            if (dashboardSection && dashboardSection.style.display !== 'none') {
                 const dadosFiltrados = dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoBusca));
                 renderizarTabelaVendas(dadosFiltrados);
            }
        });
    }
    
    carregarDadosVendas();

    const tabelaContainers = document.querySelectorAll('.tabela-responsiva-container');
    tabelaContainers.forEach(container => { 
        const tableContainer = container as HTMLElement;
        function updateScrollShadows() {
            const maxScrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
            tableContainer.classList.toggle('is-scrolling-left', tableContainer.scrollLeft > 1);
            tableContainer.classList.toggle('is-scrolling-right', tableContainer.scrollLeft < maxScrollLeft - 1);
        }
        tableContainer.addEventListener('scroll', updateScrollShadows);
        updateScrollShadows(); 
    });
});