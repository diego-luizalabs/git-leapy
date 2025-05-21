// TESTE DE FUMAÇA: Se este alert não aparecer, o script não está sendo carregado/executado.
// alert("js/vendas.ts INICIADO! Se você vir isso, o arquivo está sendo lido."); // Remova ou comente após confirmar
console.log("LOG INICIAL: js/vendas.ts foi lido pelo navegador.");

declare var Chart: any; // Para Chart.js

// URL DA SUA PLANILHA PUBLICADA COMO CSV PARA VENDAS
const URL_PLANILHA_CSV_VENDAS: string = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRIfu_bkc8cu1dNbItO9zktGmn4JjNjQEoLAzGcG9rZDyfDyDp4ISEqpPKzIFTWFrMNVIz05V3NTpGT/pub?output=csv';
//                                     CONFIRMADO: Seu link está aqui.

interface LinhaPlanilhaVendas {
    [key: string]: string | number;
}

let graficoCategoriaInstanceVendas: any = null;
let graficoTendenciaInstanceVendas: any = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Vendas: Conteúdo do DOM completamente carregado e analisado.");

    // VERIFICAÇÃO DE LOGIN
    if (sessionStorage.getItem('isXuxuGlowAdminLoggedIn') !== 'true') {
        console.warn("DOM Vendas: Usuário não logado. Redirecionando para a página de login.");
        window.location.href = 'index.html'; // Ou o nome da sua página de login
        return; // Interrompe a execução do restante do script
    }
    console.log("DOM Vendas: Usuário logado.");

    // Constantes para nomes de colunas do CSV de Vendas (VERIFIQUE SE CORRESPONDEM EXATAMENTE AO SEU CSV)
    const NOME_COLUNA_VALOR_VENDA_VENDAS = 'Valor Total';
    const NOME_COLUNA_CATEGORIA_VENDAS = 'Categoria';
    const NOME_COLUNA_DATA_VENDAS = 'Data';

    // Cores (obtidas de variáveis CSS)
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

    // Seleção de Elementos do DOM para Vendas
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

    // --- LÓGICA DA SIDEBAR E NAVEGAÇÃO ---
    const sidebarVendas = document.querySelector('.dashboard-sidebar') as HTMLElement | null;
    const menuToggleBtnVendas = document.querySelector('.menu-toggle-btn') as HTMLButtonElement | null;
    const bodyVendas = document.body;
    const navLinksVendas = document.querySelectorAll('.sidebar-nav a');
    const sectionsVendas = document.querySelectorAll('.dashboard-page-content > .dashboard-section');
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
                let titulo = activeLink.textContent?.trim() || 'Dashboard';
                const iconSpan = activeLink.querySelector('.icon');
                if (iconSpan && iconSpan.textContent) {
                    titulo = titulo.replace(iconSpan.textContent.trim(), '').trim();
                }
                tituloSecaoHeaderVendas.textContent = (titulo.toLowerCase() === 'dashboard') ? 'Visão Geral das Vendas' : titulo;
                console.log(`Vendas.ts: Título da seção atualizado para '${tituloSecaoHeaderVendas.textContent}'.`);
            }
        }
    }

    function showSectionVendas(targetId: string): boolean {
        console.log(`Vendas.ts: Tentando exibir seção: ${targetId}`);
        let sectionFoundAndDisplayed = false;
        if (!sectionsVendas || sectionsVendas.length === 0) {
            console.warn("Vendas.ts: Nenhuma seção encontrada na página para 'showSectionVendas'. Verifique o HTML de vendas.html.");
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
                console.log(`Vendas.ts: Seção ${targetId} ATIVADA.`);
                sectionEl.querySelectorAll('.kpi-card, .grafico-card, .card-secao, .secao-tabela-detalhada').forEach((card, index) => {
                    (card as HTMLElement).style.animation = 'none'; void (card as HTMLElement).offsetWidth;
                    (card as HTMLElement).style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                sectionFoundAndDisplayed = true;
                if (targetId === 'secao-dashboard' && dadosCompletosVendas.length > 0) {
                    console.log("Vendas.ts: Renderizando KPIs e visualizações para secao-dashboard.");
                    calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                    renderizarTabelaVendas(dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, filtroGeralInputVendas?.value || '')));
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
        (link as HTMLAnchorElement).addEventListener('click', function(event: MouseEvent) {
            const currentAnchor = this as HTMLAnchorElement;
            const href = currentAnchor.getAttribute('href');
            const dataTarget = currentAnchor.dataset.target;

            console.log(`Vendas.ts: Link da sidebar clicado! HREF: ${href}, DataTarget: ${dataTarget}`);

            if (href && !href.startsWith('#') && href.endsWith('.html')) {
                console.log(`Vendas.ts: Navegação para outra página HTML (${href}). Permitindo ação padrão do navegador.`);
                return; 
            }
            
            console.log(`Vendas.ts: Link é para âncora na mesma página ou não termina com .html. Chamando event.preventDefault().`);
            event.preventDefault();
            
            if (dataTarget) {
                if (showSectionVendas(dataTarget)) {
                    updateActiveLinkAndTitleVendas(currentAnchor);
                    if (history.pushState && href && href.startsWith('#')) {
                        if (location.hash !== href) {
                            history.pushState({ section: dataTarget, page: window.location.pathname }, "", href);
                            console.log(`Vendas.ts: Histórico da URL atualizado para ${href}`);
                        }
                    }
                }
            } else {
                console.warn(`Vendas.ts: Link clicado (${href}) não tem data-target e não é para outra página .html. Nenhuma ação de navegação interna tomada.`);
            }

            if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                console.log("Vendas.ts: Fechando sidebar após clique em link (mobile).");
                sidebarVendas.classList.remove('sidebar-visible');
                bodyVendas.classList.remove('sidebar-overlay-active');
                menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
            }
        });
    });

    function handlePageLoadAndNavigationVendas() {
        console.log("Vendas.ts: handlePageLoadAndNavigationVendas chamado. Hash atual:", location.hash);
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const hash = location.hash.substring(1);
        let activeLinkElement: HTMLAnchorElement | null = null;
        let targetSectionId = '';

        if (currentPath.endsWith('vendas.html') || currentPath === '' || currentPath === 'index.html') {
            if (hash) {
                targetSectionId = `secao-${hash}`;
                activeLinkElement = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
            } else {
                targetSectionId = 'secao-dashboard';
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"]');
            }
            console.log(`Vendas.ts: Tentando mostrar seção inicial: ${targetSectionId}`);
            if (!showSectionVendas(targetSectionId) && sectionsVendas && sectionsVendas.length > 0) {
                console.warn(`Vendas.ts: Seção para hash '${hash}' não encontrada, mostrando 'secao-dashboard' como padrão.`);
                showSectionVendas('secao-dashboard');
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"]');
            }
        } else {
            activeLinkElement = document.querySelector(`.sidebar-nav a[href$="${currentPath}"]`);
        }
        
        if (activeLinkElement) {
            updateActiveLinkAndTitleVendas(activeLinkElement);
        } else {
            const dashboardLink = document.querySelector('.sidebar-nav a[href="#dashboard"]') as HTMLAnchorElement | null;
            if (dashboardLink && (currentPath.endsWith('vendas.html') || currentPath === '' || currentPath === 'index.html') ) {
                 updateActiveLinkAndTitleVendas(dashboardLink);
                 if (!hash) showSectionVendas('secao-dashboard');
            }
            console.log("Vendas.ts: Nenhum link ativo encontrado por URL/hash, ou não estamos em vendas.html para navegação por seção.");
        }
    }

    window.addEventListener('popstate', (event: PopStateEvent) => {
        console.log("Vendas.ts: Evento popstate disparado.", event.state);
        handlePageLoadAndNavigationVendas();
    });
    // --- FIM DA SEÇÃO DE NAVEGAÇÃO ---

    const mostrarMensagemVendas = (elemento: HTMLElement | null, mensagem: string = '', mostrarSpinner: boolean = false): void => {
        // ... (código da função mostrarMensagem como antes)
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
        // ... (código da função processarCSV como antes, usando colunasDefinidasCSVVendas)
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
        // ... (código da função formatarMoeda como antes)
        let numValor = typeof valor === 'string' ? parseFloat(valor.replace(/[R$. ]/g, '').replace(',', '.')) : valor;
        if (typeof numValor !== 'number' || isNaN(numValor)) return 'R$ 0,00';
        return numValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const calcularKPIsEVisualizacoesVendas = (dados: LinhaPlanilhaVendas[]): void => {
        // ... (código da função calcularKPIsEVisualizacoes como antes, usando NOME_COLUNA...VENDAS, formatarMoedaVendas, grafico...InstanceVendas)
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
        console.log("Vendas.ts: KPIs atualizados - Total:", totalVendasNumerico, "Transações:", numTransacoes);

        if (ctxCategoriaCanvas) {
            const ctx = ctxCategoriaCanvas.getContext('2d');
            if (ctx) {
                if (graficoCategoriaInstanceVendas) graficoCategoriaInstanceVendas.destroy();
                graficoCategoriaInstanceVendas = new Chart(ctx, { type: 'doughnut', data: { labels: Object.keys(vendasPorCategoria), datasets: [{ label: 'Vendas por Categoria', data: Object.values(vendasPorCategoria), backgroundColor: chartDatasetColorsDark, borderColor: corFundoCardsDark, borderWidth: 2 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 }, color: corTextoSecundarioDark } }, tooltip: { bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark, backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10, callbacks: { label: (c: any) => `${c.label}: ${formatarMoedaVendas(c.raw)}` } } } } });
                console.log("Vendas.ts: Gráfico de categorias renderizado.");
            }
        }
        if (ctxTendenciaCanvas) {
            const ctx = ctxTendenciaCanvas.getContext('2d');
            if (ctx) {
                if (graficoTendenciaInstanceVendas) graficoTendenciaInstanceVendas.destroy();
                const chaves = Object.keys(vendasPorMes).sort();
                const labels = chaves.map(k => { const { ano, mes } = vendasPorMes[k]; return `${mes.toString().padStart(2, '0')}/${ano}`; });
                const valores = chaves.map(k => vendasPorMes[k].total);
                graficoTendenciaInstanceVendas = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'Tendência de Vendas Mensais', data: valores, borderColor: corLinhaTendencia, backgroundColor: corAreaTendencia, tension: 0.3, fill: true, pointBackgroundColor: corLinhaTendencia, pointBorderColor: corTextoPrincipalDark, pointHoverBackgroundColor: corTextoPrincipalDark, pointHoverBorderColor: corLinhaTendencia }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => formatarMoedaVendas(v), color: corTextoSecundarioDark }, grid: { color: corBordasDark, drawBorder: false } }, x: { ticks: { color: corTextoSecundarioDark, maxRotation: 0, autoSkipPadding: 20 }, grid: { color: corBordasDark, display: false } } }, plugins: { legend: { display: true, labels: { color: corTextoSecundarioDark, padding: 15, font: {size: 11} } }, tooltip: { bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark, backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10, callbacks: { label: (c: any) => `${c.dataset.label || 'Vendas'}: ${formatarMoedaVendas(c.raw)}` } } } } });
                console.log("Vendas.ts: Gráfico de tendência renderizado.");
            }
        }
    };

    const renderizarTabelaVendas = (dadosParaRenderizar: LinhaPlanilhaVendas[]): void => {
        // ... (código da função renderizarTabela como antes, usando corpoTabelaVendas, cabecalhoTabelaVendasEl, colunasDefinidasCSVVendas, NOME_COLUNA_VALOR_VENDA_VENDAS, formatarMoedaVendas)
        if (!corpoTabelaVendas || !cabecalhoTabelaVendasEl) { console.error("Vendas.ts: Elementos da tabela não encontrados."); return; }
        console.log("Vendas.ts: Renderizando tabela com", dadosParaRenderizar.length, "linhas.");
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

        dadosParaRenderizar.forEach((linhaObj) => {
            const tr = document.createElement('tr');
            colunasDefinidasCSVVendas.forEach(cabecalho => {
                const td = document.createElement('td');
                let valor = linhaObj[cabecalho] !== undefined ? String(linhaObj[cabecalho]) : '';
                const cabecalhoLower = cabecalho.toLowerCase();
                 if (cabecalho.toLowerCase() === NOME_COLUNA_VALOR_VENDA_VENDAS.toLowerCase() || cabecalhoLower.includes('preço') || cabecalhoLower.includes('total')) {
                    td.textContent = formatarMoedaVendas(valor).replace(/^R\$\s*/, ''); 
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
         console.log("Vendas.ts: Tabela renderizada.");
    };

    const filtrarLinhaVendas = (linha: LinhaPlanilhaVendas, termoBusca: string): boolean => {
        // ... (código da função filtrarLinha como antes, usando colunasDefinidasCSVVendas)
        if (!termoBusca) return true;
        const termoLower = termoBusca.toLowerCase();
        return colunasDefinidasCSVVendas.some(cabecalho => String(linha[cabecalho]).toLowerCase().includes(termoLower));
    };

    const carregarDadosVendas = async (): Promise<void> => {
        // ... (código da função carregarDados como antes, usando URL_PLANILHA_CSV_VENDAS, mostrarMensagemVendas, processarCSVVendas, etc.)
        console.log("Vendas.ts: Iniciando carregarDadosVendas()...");
        mostrarMensagemVendas(loadingMessageDivVendas, 'Carregando dados do dashboard...', true);
        if (!URL_PLANILHA_CSV_VENDAS || URL_PLANILHA_CSV_VENDAS.includes('COLE_AQUI') || URL_PLANILHA_CSV_VENDAS.length < 50) {
            mostrarMensagemVendas(errorMessageDivVendas, 'Erro: URL da planilha CSV de Vendas não configurada ou inválida.');
            colunasDefinidasCSVVendas = []; dadosCompletosVendas = []; renderizarTabelaVendas([]); calcularKPIsEVisualizacoesVendas([]); return;
        }
        try {
            const resposta = await fetch(URL_PLANILHA_CSV_VENDAS);
            console.log("Vendas.ts: Resposta do fetch para CSV de Vendas:", resposta.status, resposta.statusText);
            if (!resposta.ok) { throw new Error(`Falha ao buscar CSV de Vendas: ${resposta.status} ${resposta.statusText}. Verifique URL e permissões (deve estar publicada na web como CSV).`); }
            const textoCsv = await resposta.text();
            console.log("Vendas.ts: Início do texto CSV de Vendas recebido (primeiros 500 caracteres):", textoCsv.substring(0, 500));
            if (!textoCsv || textoCsv.trim() === '') { mostrarMensagemVendas(errorMessageDivVendas, 'CSV de Vendas vazio ou inválido.'); colunasDefinidasCSVVendas = []; dadosCompletosVendas = []; renderizarTabelaVendas([]); calcularKPIsEVisualizacoesVendas([]); return; }
            
            const { cabecalhos, linhas } = processarCSVVendas(textoCsv);
            console.log("Vendas.ts: Cabeçalhos do CSV de Vendas (colunasDefinidasCSVVendas):", colunasDefinidasCSVVendas);
            console.log("Vendas.ts: Linhas processadas do CSV de Vendas:", linhas.length);
            if (linhas.length > 0) console.log("Vendas.ts: Primeira linha de Vendas:", linhas[0]);
            
            dadosCompletosVendas = linhas;
            console.log("Vendas.ts: dadosCompletosVendas.length após atribuição:", dadosCompletosVendas.length);
            
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            
            handlePageLoadAndNavigationVendas(); 

            if (dadosCompletosVendas.length === 0 && document.getElementById('secao-dashboard')?.classList.contains('active-section')) {
                mostrarMensagemVendas(noDataMessageDivVendas, colunasDefinidasCSVVendas.length > 0 ? 'Nenhum dado encontrado na planilha após o processamento.' : 'Verifique o formato da planilha de origem e se os cabeçalhos estão corretos.');
            }
        } catch (erro: any) {
            console.error("DOM Vendas: Erro detalhado ao carregar/processar dados de Vendas:", erro);
            mostrarMensagemVendas(errorMessageDivVendas, `Erro ao carregar dados de Vendas: ${erro.message}. Verifique o console para mais detalhes.`);
        }
    };

    if (filtroGeralInputVendas) {
        filtroGeralInputVendas.addEventListener('input', (e) => {
            const termoBusca = (e.target as HTMLInputElement).value.trim();
            // Apenas filtra e re-renderiza a tabela se a seção do dashboard (que contém a tabela) estiver ativa
            if (document.getElementById('secao-dashboard')?.classList.contains('active-section')) {
                 const dadosFiltrados = dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoBusca));
                 renderizarTabelaVendas(dadosFiltrados);
            }
        });
    }
    
    // Chamada inicial para carregar os dados de vendas e configurar a página
    carregarDadosVendas();

    // Lógica para sombras na tabela responsiva
    const tabelaContainers = document.querySelectorAll('.tabela-responsiva-container');
    tabelaContainers.forEach(container => {
        const tableContainer = container as HTMLElement;
        function updateScrollShadows() {
            const maxScrollLeft = tableContainer.scrollWidth - tableContainer.clientWidth;
            tableContainer.classList.toggle('is-scrolling-left', tableContainer.scrollLeft > 1);
            tableContainer.classList.toggle('is-scrolling-right', tableContainer.scrollLeft < maxScrollLeft - 1);
        }
        tableContainer.addEventListener('scroll', updateScrollShadows);
        // new ResizeObserver(updateScrollShadows).observe(tableContainer); // Descomente se precisar de recalculo em redimensionamento
        updateScrollShadows();
    });
});