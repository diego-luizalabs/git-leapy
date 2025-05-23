console.log("LOG INICIAL: js/vendas.ts foi lido pelo navegador.");

declare var Chart: any; // Para Chart.js
// ▼▼▼ ADICIONADO/MODIFICADO (SE USAR NPM/YARN) ▼▼▼
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Descomente se você instalou via npm

// Registra o plugin datalabels com Chart.js
// Se ChartDataLabels não estiver definido (ex: plugin carregado via <script>),
// Chart.js pode já tê-lo registrado ou você pode precisar registrá-lo de outra forma
// dependendo de como você carrega Chart.js e seus plugins.
// Para carregamento via <script>, geralmente não é necessário o import e o Chart.register aqui se o plugin se auto-registra.
// Mas se você importou, você DEVE registrar.
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}
// ▲▲▲ FIM DA ADIÇÃO/MODIFICAÇÃO ▲▲▲


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
                if (!activeLink.dataset.title) {
                    const iconSpan = activeLink.querySelector('.icon');
                    if (iconSpan && iconSpan.textContent) {
                        titulo = titulo.replace(iconSpan.textContent.trim(), '').trim();
                    }
                }
                const lowerCaseTitle = titulo.toLowerCase();
                if (lowerCaseTitle === 'dashboard' || lowerCaseTitle === 'dashboard principal' || lowerCaseTitle === 'visão geral das vendas') {
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
            console.warn("Vendas.ts: Nenhuma .dashboard-section encontrada.");
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
                    (card as HTMLElement).style.animation = 'none';
                    void (card as HTMLElement).offsetWidth;
                    (card as HTMLElement).style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                sectionFoundAndDisplayed = true;
                
                if (targetId === 'secao-dashboard') {
                    if (dadosCompletosVendas.length > 0) {
                        console.log("DEBUG VENDAS (showSection): DADOS PRESENTES. Renderizando KPIs e visualizações para secao-dashboard.");
                        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';
                        calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                        renderizarTabelaVendas(dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, filtroGeralInputVendas?.value || '')));
                    } else {
                        console.warn("DEBUG VENDAS (showSection): DADOS AUSENTES para secao-dashboard.");
                        if (graficoCategoriaInstanceVendas) graficoCategoriaInstanceVendas.destroy();
                        if (graficoTendenciaInstanceVendas) graficoTendenciaInstanceVendas.destroy();
                        if (corpoTabelaVendas) corpoTabelaVendas.innerHTML = ''; 
                        if (cabecalhoTabelaVendasEl) cabecalhoTabelaVendasEl.innerHTML = '';
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
        if (!sectionFoundAndDisplayed) {
             console.warn(`Vendas.ts: Nenhuma seção com ID '${targetId}' foi encontrada/exibida.`);
        }
        return sectionFoundAndDisplayed;
    }

    navLinksVendas.forEach(link => {
        link.addEventListener('click', function(event: MouseEvent) {
            const currentAnchor = this; 
            const hrefAttribute = currentAnchor.getAttribute('href');
            const dataTargetSection = currentAnchor.dataset.target;

            console.log(`DEBUG VENDAS (Nav): Link clicado! HREF: ${hrefAttribute}, DataTargetSection: ${dataTargetSection}`);

            if (hrefAttribute && hrefAttribute.includes('.html') && !hrefAttribute.startsWith('#')) {
                const targetUrl = new URL(hrefAttribute, window.location.origin);
                const currentPageUrl = new URL(window.location.href);
                if (targetUrl.pathname !== currentPageUrl.pathname) {
                    console.log(`DEBUG VENDAS (Nav): Navegação para OUTRA página HTML (${hrefAttribute}).`);
                    if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                        sidebarVendas.classList.remove('sidebar-visible');
                        bodyVendas.classList.remove('sidebar-overlay-active');
                        menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
                    }
                    return; 
                }
            }
            
            if (hrefAttribute && (hrefAttribute.startsWith('http://') || hrefAttribute.startsWith('https://') || hrefAttribute.startsWith('//'))) {
                console.log(`DEBUG VENDAS (Nav): Navegação para URL externa (${hrefAttribute}).`);
                return; 
            }
            
            event.preventDefault();
            console.log(`DEBUG VENDAS (Nav): Navegação interna (HREF: '${hrefAttribute}').`);
            
            let sectionIdToDisplay: string | null = null;

            if (dataTargetSection) { 
                sectionIdToDisplay = dataTargetSection;
            } else if (hrefAttribute && hrefAttribute.startsWith('#') && hrefAttribute.length > 1) { 
                sectionIdToDisplay = `secao-${hrefAttribute.substring(1)}`;
            } else if (hrefAttribute === '#' || !hrefAttribute) {
                sectionIdToDisplay = 'secao-dashboard'; 
                console.log(`DEBUG VENDAS (Nav): Link com href='${hrefAttribute}', default para ${sectionIdToDisplay}.`);
            }

            if (sectionIdToDisplay) {
                console.log(`DEBUG VENDAS (Nav): Tentando exibir seção: ${sectionIdToDisplay}`);
                if (showSectionVendas(sectionIdToDisplay)) {
                    updateActiveLinkAndTitleVendas(currentAnchor);
                    const newHash = sectionIdToDisplay.startsWith('secao-') ? `#${sectionIdToDisplay.substring(6)}` : `#${sectionIdToDisplay}`;
                    if (window.location.hash !== newHash) {
                        if (newHash === '#undefined' || newHash === '#null') {
                            console.warn("DEBUG VENDAS (Nav): Tentativa de pushState com hash inválido.");
                        } else {
                            history.pushState({ section: sectionIdToDisplay, page: window.location.pathname }, "", newHash);
                            console.log(`DEBUG VENDAS (Nav): Histórico URL atualizado para ${newHash}`);
                        }
                    }
                } else {
                     console.warn(`DEBUG VENDAS (Nav): showSectionVendas retornou false para ${sectionIdToDisplay}.`);
                }
            } else {
                console.warn(`DEBUG VENDAS (Nav): Link (${hrefAttribute}) não resultou em sectionIdToDisplay.`);
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
        const hash = location.hash.substring(1);
        let activeLinkElement: HTMLAnchorElement | null = null;
        let targetSectionIdFromLoad = '';

        if (currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html')) { 
            if (hash) {
                activeLinkElement = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || `secao-${hash}`;
            } else {
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || 'secao-dashboard';
            }
            console.log(`DEBUG VENDAS (handlePageLoad): Em ${currentPathFilename}. targetSectionIdFromLoad: '${targetSectionIdFromLoad}'`);
            
            if (!targetSectionIdFromLoad && activeLinkElement?.getAttribute('href') === '#') {
                targetSectionIdFromLoad = 'secao-dashboard';
                console.log(`DEBUG VENDAS (handlePageLoad): Link ativo href='#', default para '${targetSectionIdFromLoad}'.`);
            }
            
            if (!showSectionVendas(targetSectionIdFromLoad)) {
                console.warn(`DEBUG VENDAS (handlePageLoad): Seção '${targetSectionIdFromLoad}' não encontrada. Fallback 'secao-dashboard'.`);
                if (showSectionVendas('secao-dashboard')) { 
                    if (!activeLinkElement) {
                        activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
                    }
                }
            }
        } else {
            activeLinkElement = document.querySelector(`.sidebar-nav a[href$="${currentPathFilename}"]`);
            console.log(`DEBUG VENDAS (handlePageLoad): Não em vendas.html/dashboard.html. Link ativo por path:`, activeLinkElement);
        }
        
        if (activeLinkElement) {
            updateActiveLinkAndTitleVendas(activeLinkElement);
        } else if ((currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html')) && !hash) { 
            const dashboardLinkFallback = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]') as HTMLAnchorElement | null;
            if (dashboardLinkFallback) {
                updateActiveLinkAndTitleVendas(dashboardLinkFallback);
            } else {
                console.log("DEBUG VENDAS (handlePageLoad): Nenhum link ativo encontrado nesta página.");
            }
        } else if (!activeLinkElement && hash) {
            const fallbackLinkForHash = document.querySelector(`.sidebar-nav a[data-target="secao-${hash}"]`) as HTMLAnchorElement | null;
            if (fallbackLinkForHash) {
                updateActiveLinkAndTitleVendas(fallbackLinkForHash);
            } else {
                 console.log(`DEBUG VENDAS (handlePageLoad): activeLinkElement null. Hash: '${hash}'. Nenhum link destacado.`);
            }
        } else {
             console.log(`DEBUG VENDAS (handlePageLoad): activeLinkElement null. Hash: '${hash}'. Nenhum link destacado.`);
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

    const processarCSVVendas = (textoCsv: string): { cabecalhos: string[], linhas: LinhaPlanilhaVendas[] } => {
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

        const linhasProcessadas: LinhaPlanilhaVendas[] = todasLinhasTexto.map((linhaTexto) => {
            const valores: string[] = [];
            let dentroDeAspas = false;
            let valorAtual = '';
            for (let i = 0; i < linhaTexto.length; i++) {
                const char = linhaTexto[i];
                if (char === '"') {
                    if (dentroDeAspas && i + 1 < linhaTexto.length && linhaTexto[i+1] === '"') {
                        valorAtual += '"';
                        i++; 
                        continue;
                    }
                    dentroDeAspas = !dentroDeAspas;
                } else if (char === ',' && !dentroDeAspas) {
                    valores.push(valorAtual.trim().replace(/^"|"$/g, ''));
                    valorAtual = '';
                } else {
                    valorAtual += char;
                }
            }
            valores.push(valorAtual.trim().replace(/^"|"$/g, '')); 

            const linhaObj: LinhaPlanilhaVendas = {};
            cabecalhos.forEach((cabecalho, index) => {
                linhaObj[cabecalho] = valores[index] !== undefined ? valores[index] : '';
            });
            return linhaObj;
        });
        return { cabecalhos, linhas: linhasProcessadas };
    };

    const formatarMoedaVendas = (valor: number | string): string => {
        let numValor = typeof valor === 'string' 
            ? parseFloat(valor.replace(/[R$. ]/g, '').replace(',', '.')) 
            : valor;
        if (typeof numValor !== 'number' || isNaN(numValor)) {
            return 'R$ 0,00';
        }
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
            console.log("DEBUG VENDAS (calcularKPIs): Sem dados, gráficos destruídos.");
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
        });
    
        const numTransacoes = dados.length;
        const ticketMedio = numTransacoes > 0 ? totalVendasNumerico / numTransacoes : 0;
    
        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(totalVendasNumerico);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = numTransacoes.toString();
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(ticketMedio);
        console.log("DEBUG VENDAS (calcularKPIs): KPIs atualizados.");

        // ▼▼▼ GRÁFICO DE VENDAS POR CATEGORIA MODIFICADO ▼▼▼
        if (ctxCategoriaCanvas) { 
            const ctx = ctxCategoriaCanvas.getContext('2d');
            if (ctx) {
                if (graficoCategoriaInstanceVendas) graficoCategoriaInstanceVendas.destroy();
                graficoCategoriaInstanceVendas = new Chart(ctx, {
                    type: 'bar', // MUDADO para 'bar'
                    data: {
                        labels: Object.keys(vendasPorCategoria),
                        datasets: [{
                            // label: 'Vendas por Categoria', // Label do dataset pode ser omitido se usar datalabels
                            data: Object.values(vendasPorCategoria),
                            backgroundColor: chartDatasetColorsDark,
                            borderColor: corFundoCardsDark, 
                            borderWidth: 1 
                        }]
                    },
                    options: {
                        indexAxis: 'y', // Para barras horizontais
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            x: { 
                                beginAtZero: true,
                                ticks: { 
                                    color: corTextoSecundarioDark, 
                                    callback: (value: any) => formatarMoedaVendas(value) 
                                },
                                grid: { color: corBordasDark, drawBorder: false }
                            },
                            y: { 
                                ticks: { color: corTextoSecundarioDark, autoSkip: false }, // autoSkip: false para garantir que todos os rótulos sejam mostrados se couberem
                                grid: { display: false } 
                            }
                        },
                        plugins: {
                            legend: {
                                display: false // Legenda principal desabilitada, pois usaremos rótulos de dados
                            },
                            tooltip: {
                                bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark,
                                backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10,
                                callbacks: { 
                                    label: (context: any) => {
                                        // Para o tooltip, mostrar a categoria e o valor formatado
                                        const label = context.chart.data.labels[context.dataIndex] || '';
                                        const value = context.raw;
                                        return `${label}: ${formatarMoedaVendas(value)}`;
                                    }
                                }
                            },
                            datalabels: { // Configuração do chartjs-plugin-datalabels
                                anchor: 'end', // Ancora o rótulo ao final da barra
                                align: 'right',// Alinha o texto à direita da âncora (para barras horizontais, fora da barra)
                                offset: 4,     // Pequeno espaçamento da barra
                                clamp: true,   // IMPORTANTE: tenta manter o rótulo dentro da área do gráfico
                                color: corTextoSecundarioDark,
                                font: {
                                    size: 10, // Ajuste o tamanho conforme necessário
                                    // weight: 'bold' // opcional
                                },
                                formatter: (value: number, context: any) => {
                                    // Retorna o nome da categoria (label do eixo Y)
                                    return context.chart.data.labels[context.dataIndex];
                                }
                            }
                        },
                        // Garante espaço para os rótulos não saírem do painel
                        layout: {
                            padding: {
                                right: 40 // Adiciona um padding à direita do gráfico para dar espaço aos datalabels. Ajuste conforme necessário.
                                         // Se os seus rótulos de categoria ("Outros", etc.) forem muito longos, pode precisar de mais.
                            }
                        }
                    }
                });
                console.log("DEBUG VENDAS (calcularKPIs): Gráfico de categorias (BARRA HORIZONTAL) renderizado.");
            }
        }
        // ▲▲▲ FIM DA MODIFICAÇÃO DO GRÁFICO DE CATEGORIAS ▲▲▲

        // Gráfico de Tendência de Vendas
        if (ctxTendenciaCanvas) { 
            const ctx = ctxTendenciaCanvas.getContext('2d');
            if (ctx) {
                if (graficoTendenciaInstanceVendas) graficoTendenciaInstanceVendas.destroy();
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
                            label: 'Tendência de Vendas Mensais', // Este é o label que aparece na legenda
                            data: valoresGrafico,
                            borderColor: corLinhaTendencia,
                            backgroundColor: corAreaTendencia,
                            tension: 0.3,
                            fill: true,
                            pointBackgroundColor: corLinhaTendencia,
                            pointBorderColor: corTextoPrincipalDark,
                            pointHoverBackgroundColor: corTextoPrincipalDark,
                            pointHoverBorderColor: corLinhaTendencia
                        }]
                    },
                    options: {
                        responsive: true, maintainAspectRatio: false,
                        scales: {
                            y: { beginAtZero: true, ticks: { callback: (value: any) => formatarMoedaVendas(value), color: corTextoSecundarioDark }, grid: { color: corBordasDark, drawBorder: false } },
                            x: { ticks: { color: corTextoSecundarioDark, maxRotation: 0, autoSkipPadding: 20 }, grid: { color: corBordasDark, display: false } }
                        },
                        plugins: {
                            legend: { // Configuração da legenda para "Tendência de Vendas Mensais"
                                display: true, 
                                position: 'top', // Padrão é 'top'. Pode ser 'bottom' para mais espaço vertical.
                                align: 'center', // Padrão é 'center'. Pode ser 'start' ou 'end'.
                                labels: { 
                                    color: corTextoSecundarioDark, 
                                    padding: 15, // Espaçamento em volta da legenda
                                    font: {size: 11},
                                    boxWidth: 12, // Largura da caixinha de cor
                                    usePointStyle: true // Usa estilo de ponto para a legenda (bom para gráficos de linha)
                                } 
                            },
                            tooltip: {
                                bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark,
                                backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10,
                                callbacks: { label: (context: any) => `${context.dataset.label || 'Vendas'}: ${formatarMoedaVendas(context.raw)}` }
                            }
                        },
                        // Adicionar um pouco de padding se a legenda no topo estiver muito colada
                        layout: {
                            padding: {
                                top: 5 // Se a legenda for 'top', pode precisar de um pouco de espaço
                            }
                        }
                    }
                });
                console.log("DEBUG VENDAS (calcularKPIs): Gráfico de tendência renderizado.");
            }
        }
    };

    const renderizarTabelaVendas = (dadosParaRenderizar: LinhaPlanilhaVendas[]): void => {
        if (!corpoTabelaVendas || !cabecalhoTabelaVendasEl) {
            console.error("Vendas.ts: Elementos da tabela não encontrados.");
            return;
        }
        console.log("DEBUG VENDAS (renderizarTabela): INICIADO com dados.length:", dadosParaRenderizar.length);
        
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
        return colunasDefinidasCSVVendas.some(cabecalho => 
            String(linha[cabecalho]).toLowerCase().includes(termoLower)
        );
    };

    const carregarDadosVendas = async (): Promise<void> => {
        console.log("DEBUG VENDAS (carregarDadosVendas): INICIADO...");
        mostrarMensagemVendas(loadingMessageDivVendas, 'Carregando dados do dashboard...', true);
        
        if (!URL_PLANILHA_CSV_Vendas || URL_PLANILHA_CSV_VENDAS.includes('https://docs.google.com/spreadsheets/d/e/2PACX-1vRIfu_bkc8cu1dNbItO9zktGmn4JjNjQEoLAzGcG9rZDyfDyDp4ISEqpPKzIFTWFrMNVIz05V3NTpGT/pub?output=csv') || URL_PLANILHA_CSV_VENDAS.length < 50) {
            mostrarMensagemVendas(errorMessageDivVendas, 'Erro: URL da planilha CSV de Vendas não configurada ou inválida.');
            colunasDefinidasCSVVendas = []; 
            dadosCompletosVendas = []; 
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            console.log("DEBUG VENDAS (carregarDadosVendas): Chamando handlePageLoad (URL inválida).");
            handlePageLoadAndNavigationVendas();
            return;
        }

        try {
            const resposta = await fetch(URL_PLANILHA_CSV_VENDAS);
            console.log("DEBUG VENDAS (carregarDadosVendas): Resposta fetch:", resposta.status, resposta.statusText);
            if (!resposta.ok) {
                throw new Error(`Falha ao buscar CSV de Vendas: ${resposta.status} ${resposta.statusText}.`);
            }
            const textoCsv = await resposta.text();
            if (!textoCsv || textoCsv.trim() === '') {
                throw new Error('O arquivo CSV de Vendas retornado está vazio ou é inválido.');
            }
            
            const { cabecalhos, linhas } = processarCSVVendas(textoCsv);
            dadosCompletosVendas = linhas;
            console.log("DEBUG VENDAS (carregarDadosVendas): dadosCompletosVendas populado. Comprimento:", dadosCompletosVendas.length);
            
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            if (errorMessageDivVendas) errorMessageDivVendas.style.display = 'none';
            
            console.log("DEBUG VENDAS (carregarDadosVendas): Chamando handlePageLoadAndNavigationVendas APÓS DADOS.");
            handlePageLoadAndNavigationVendas(); 

        } catch (erro: any) {
            console.error("DEBUG VENDAS (carregarDadosVendas): ERRO CRÍTICO:", erro);
            mostrarMensagemVendas(errorMessageDivVendas, `Erro ao carregar dados: ${erro.message}.`);
            dadosCompletosVendas = [];
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            
            console.log("DEBUG VENDAS (carregarDadosVendas): Chamando handlePageLoadAndNavigationVendas do CATCH.");
            handlePageLoadAndNavigationVendas();
        }
    };

    if (filtroGeralInputVendas) {
        filtroGeralInputVendas.addEventListener('input', (e) => {
            const termoBusca = (e.target as HTMLInputElement).value.trim();
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
        const tableContainer = container as HTMLElement;
        function updateScrollShadows() {
            if (!tableContainer) return;
            const maxScrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
            tableContainer.classList.toggle('is-scrolling-left', tableContainer.scrollLeft > 1);
            tableContainer.classList.toggle('is-scrolling-right', tableContainer.scrollLeft < maxScrollLeft - 1);
        }
        tableContainer.addEventListener('scroll', updateScrollShadows);
        setTimeout(updateScrollShadows, 100); 
    });
});