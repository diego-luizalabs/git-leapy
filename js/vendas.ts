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
    const sectionsVendas = document.querySelectorAll<HTMLElement>('.dashboard-page-content > .dashboard-section'); // Ajustado para pegar seções filhas diretas
    const tituloSecaoHeaderVendas = document.getElementById('dashboard-titulo-secao') as HTMLElement | null; // Supondo que você tenha este ID no seu HTML do header

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
                // Remove o conteúdo do span do ícone do título, se não estiver usando data-title
                if (!activeLink.dataset.title) {
                    const iconSpan = activeLink.querySelector('.icon');
                    if (iconSpan && iconSpan.textContent) {
                         // Se o ícone for um SVG, iconSpan.textContent pode ser vazio.
                         // Se for um caractere de ícone, esta lógica pode funcionar.
                         // Para SVGs, o ideal é que o data-title já contenha o texto limpo.
                        titulo = titulo.replace(iconSpan.textContent.trim(), '').trim();
                    }
                }
                // Ajusta o título principal da página
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
            console.warn("Vendas.ts: Nenhuma .dashboard-section encontrada. Verifique o HTML da sua página de dashboard.");
            // Se o alvo era o dashboard principal e não há seções, ao menos atualiza o título.
            if (targetId === 'secao-dashboard' && tituloSecaoHeaderVendas) {
                tituloSecaoHeaderVendas.textContent = 'Visão Geral das Vendas';
            }
            return false; // Retorna false pois nenhuma seção foi encontrada/exibida
        }

        sectionsVendas.forEach(section => {
            const sectionEl = section as HTMLElement;
            if (sectionEl.id === targetId) {
                sectionEl.style.display = 'block';
                sectionEl.classList.add('active-section'); // Adiciona uma classe para a seção ativa, se necessário
                console.log(`DEBUG VENDAS (showSection): Seção ${targetId} ATIVADA e display=block.`);

                // Animação para cards dentro da seção ativada
                sectionEl.querySelectorAll('.kpi-card, .grafico-card, .card-secao, .secao-tabela-detalhada').forEach((card, index) => {
                    (card as HTMLElement).style.animation = 'none'; // Reseta animação
                    void (card as HTMLElement).offsetWidth; // Força reflow
                    (card as HTMLElement).style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                sectionFoundAndDisplayed = true;
                
                // Se a seção do dashboard principal está sendo exibida, renderiza os dados
                if (targetId === 'secao-dashboard') {
                    if (dadosCompletosVendas.length > 0) {
                        console.log("DEBUG VENDAS (showSection): DADOS PRESENTES. Renderizando KPIs e visualizações para secao-dashboard.");
                        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';
                        calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                        renderizarTabelaVendas(dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, filtroGeralInputVendas?.value || '')));
                    } else {
                        console.warn("DEBUG VENDAS (showSection): DADOS AUSENTES para secao-dashboard. KPIs/gráficos/tabela NÃO serão renderizados. Limpando área.");
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
                // Adicione 'else if' aqui para renderizar conteúdo específico de outras seções se necessário
                // Ex: else if (targetId === 'secao-clientes') { renderizarConteudoClientes(); }

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
            const hrefAttribute = currentAnchor.getAttribute('href'); // href pode ser "#hash" ou "pagina.html"
            const dataTargetSection = currentAnchor.dataset.target; // ex: "secao-dashboard"
            // const dataExternalPage = currentAnchor.dataset.externalPage; // Se você usar isso de produtos.ts

            console.log(`DEBUG VENDAS (Nav): Link clicado! HREF: ${hrefAttribute}, DataTargetSection: ${dataTargetSection}`);

            // Se for um link para outra página HTML (lógica simplificada de produtos.ts)
            if (hrefAttribute && hrefAttribute.includes('.html') && !hrefAttribute.startsWith('#')) {
                const targetUrl = new URL(hrefAttribute, window.location.origin);
                const currentPageUrl = new URL(window.location.href);
                if (targetUrl.pathname !== currentPageUrl.pathname) {
                    console.log(`DEBUG VENDAS (Nav): Navegação para OUTRA página HTML (${hrefAttribute}). Permitindo ação padrão.`);
                     // Lógica para fechar sidebar móvel antes de navegar
                    if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                        sidebarVendas.classList.remove('sidebar-visible');
                        bodyVendas.classList.remove('sidebar-overlay-active');
                        menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
                    }
                    return; // Permite a navegação padrão do navegador
                }
            }
            
            // Para links externos absolutos
            if (hrefAttribute && (hrefAttribute.startsWith('http://') || hrefAttribute.startsWith('https://') || hrefAttribute.startsWith('//'))) {
                console.log(`DEBUG VENDAS (Nav): Navegação para URL externa (${hrefAttribute}). Permitindo ação padrão.`);
                return; // Permite a navegação padrão do navegador
            }
            
            // Se chegou aqui, é navegação interna na mesma página (SPA-like)
            event.preventDefault();
            console.log(`DEBUG VENDAS (Nav): Navegação interna ou link especial (HREF: '${hrefAttribute}'). Prevenindo padrão.`);
            
            let sectionIdToDisplay: string | null = null;

            if (dataTargetSection) { 
                sectionIdToDisplay = dataTargetSection;
            } else if (hrefAttribute && hrefAttribute.startsWith('#') && hrefAttribute.length > 1) { 
                sectionIdToDisplay = `secao-${hrefAttribute.substring(1)}`; // Constrói ID da seção: secao-clientes, secao-dashboard
            } else if (hrefAttribute === '#' || !hrefAttribute) { // Link apenas "#" ou href vazio, default para dashboard
                sectionIdToDisplay = 'secao-dashboard'; 
                console.log(`DEBUG VENDAS (Nav): Link com href='${hrefAttribute}' ou vazio, default para ${sectionIdToDisplay}.`);
            }

            if (sectionIdToDisplay) {
                console.log(`DEBUG VENDAS (Nav): Tentando exibir seção via click: ${sectionIdToDisplay}`);
                if (showSectionVendas(sectionIdToDisplay)) {
                    updateActiveLinkAndTitleVendas(currentAnchor);
                    // Atualiza a URL com o hash para links internos
                    const newHash = sectionIdToDisplay.startsWith('secao-') ? `#${sectionIdToDisplay.substring(6)}` : `#${sectionIdToDisplay}`;
                    if (window.location.hash !== newHash) {
                         // Evita empurrar o mesmo estado ou estados problemáticos
                        if (newHash === '#undefined' || newHash === '#null') {
                            console.warn("DEBUG VENDAS (Nav): Tentativa de pushState com hash inválido, abortando.");
                        } else {
                            history.pushState({ section: sectionIdToDisplay, page: window.location.pathname }, "", newHash);
                            console.log(`DEBUG VENDAS (Nav): Histórico da URL atualizado para ${newHash}`);
                        }
                    }
                } else {
                     console.warn(`DEBUG VENDAS (Nav): showSectionVendas retornou false para ${sectionIdToDisplay}. A seção pode não existir.`);
                }
            } else {
                console.warn(`DEBUG VENDAS (Nav): Link (${hrefAttribute}) não resultou em um sectionIdToDisplay. Apenas atualizando estado ativo.`);
                updateActiveLinkAndTitleVendas(currentAnchor); 
            }

            // Fecha a sidebar em mobile após o clique
            if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                sidebarVendas.classList.remove('sidebar-visible');
                bodyVendas.classList.remove('sidebar-overlay-active');
                menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // ▼▼▼ FUNÇÃO MODIFICADA ▼▼▼
    function handlePageLoadAndNavigationVendas() {
        console.log("DEBUG VENDAS (handlePageLoad): INICIADO. Hash:", location.hash, "Path:", window.location.pathname);
        const currentPathFilename = window.location.pathname.split('/').pop() || 'index.html';
        const hash = location.hash.substring(1); // Ex: "clientes", "dashboard", ou vazio
        let activeLinkElement: HTMLAnchorElement | null = null;
        let targetSectionIdFromLoad = '';

        // MODIFICAÇÃO AQUI: Incluir 'dashboard.html' na condição
        if (currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html')) { 
            if (hash) {
                // Tenta encontrar o link da sidebar que corresponde ao hash
                activeLinkElement = document.querySelector(`.sidebar-nav a[href="#${hash}"]`);
                // Define a seção alvo. Usa activeLinkElement.dataset.target se existir, senão constrói como "secao-HASH"
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || `secao-${hash}`;
            } else {
                // Se não houver hash, o padrão é a seção principal do dashboard
                activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || 'secao-dashboard';
            }

            console.log(`DEBUG VENDAS (handlePageLoad): Em ${currentPathFilename}. targetSectionIdFromLoad: '${targetSectionIdFromLoad}', activeLinkElement:`, activeLinkElement);
            
            if (!targetSectionIdFromLoad && activeLinkElement?.getAttribute('href') === '#') {
                 // Se o link ativo encontrado tem href="#" e não tem data-target, default para secao-dashboard
                targetSectionIdFromLoad = 'secao-dashboard';
                 console.log(`DEBUG VENDAS (handlePageLoad): Link ativo tem href='#', default para '${targetSectionIdFromLoad}'.`);
            }
            
            // Tenta exibir a seção determinada.
            // Se não conseguir (ex: seção não existe), tenta exibir 'secao-dashboard' como fallback.
            if (!showSectionVendas(targetSectionIdFromLoad)) {
                console.warn(`DEBUG VENDAS (handlePageLoad): Seção '${targetSectionIdFromLoad}' (do hash/default) não encontrada/exibida. Tentando 'secao-dashboard' como fallback.`);
                if (showSectionVendas('secao-dashboard')) { 
                    if (!activeLinkElement) { // Se o link original para o hash não foi encontrado, tenta encontrar o link para 'secao-dashboard'
                        activeLinkElement = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
                    }
                }
            }
        } else {
            activeLinkElement = document.querySelector(`.sidebar-nav a[href$="${currentPathFilename}"]`);
            console.log(`DEBUG VENDAS (handlePageLoad): Não estamos em vendas.html ou dashboard.html. Tentando link ativo por path (${currentPathFilename}):`, activeLinkElement);
        }
        
        // Atualiza o título e o destaque do link na sidebar
        if (activeLinkElement) {
            updateActiveLinkAndTitleVendas(activeLinkElement);
        } else if ((currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html')) && !hash) { 
            const dashboardLinkFallback = document.querySelector('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]') as HTMLAnchorElement | null;
            if (dashboardLinkFallback) {
                updateActiveLinkAndTitleVendas(dashboardLinkFallback);
                console.log(`DEBUG VENDAS (handlePageLoad): Nenhum link ativo específico, usando fallback para link do dashboard em ${currentPathFilename}.`);
            } else {
                console.log("DEBUG VENDAS (handlePageLoad): Nenhum link ativo encontrado (nem fallback para #dashboard) para destacar nesta página.");
            }
        } else if (!activeLinkElement && hash) { // Se veio com hash mas não achou link, tenta um link com data-target="secao-HASH"
            const fallbackLinkForHash = document.querySelector(`.sidebar-nav a[data-target="secao-${hash}"]`) as HTMLAnchorElement | null;
            if (fallbackLinkForHash) {
                updateActiveLinkAndTitleVendas(fallbackLinkForHash);
                console.log(`DEBUG VENDAS (handlePageLoad): Nenhum link direto para #${hash}, mas encontrado fallback por data-target="secao-${hash}".`);
            } else {
                 console.log(`DEBUG VENDAS (handlePageLoad): activeLinkElement é null. Hash: '${hash}', Path: '${currentPathFilename}'. Nenhum link destacado.`);
            }
        } else {
             console.log(`DEBUG VENDAS (handlePageLoad): activeLinkElement é null e não se encaixa em outras condições. Hash: '${hash}', Path: '${currentPathFilename}'. Nenhum link destacado.`);
        }
    }
    // ▲▲▲ FUNÇÃO MODIFICADA ▲▲▲

    window.addEventListener('popstate', (event: PopStateEvent) => {
        console.log("DEBUG VENDAS: Evento popstate disparado.", event.state);
        // Chama handlePageLoadAndNavigationVendas para reavaliar a seção com base na nova URL/hash
        handlePageLoadAndNavigationVendas(); 
    });

    const mostrarMensagemVendas = (elemento: HTMLElement | null, mensagem: string = '', mostrarSpinner: boolean = false): void => {
        // Esconde outras mensagens de status
        if (loadingMessageDivVendas && elemento !== loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
        if (errorMessageDivVendas && elemento !== errorMessageDivVendas) errorMessageDivVendas.style.display = 'none';
        if (noDataMessageDivVendas && elemento !== noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';

        if (elemento) {
            elemento.innerHTML = ''; // Limpa conteúdo anterior
            if (mostrarSpinner) {
                const spinner = document.createElement('div');
                spinner.className = 'spinner'; // Assumindo que você tem uma classe CSS .spinner
                elemento.appendChild(spinner);
            }
            if (mensagem) {
                elemento.appendChild(document.createTextNode(mostrarSpinner ? ' ' + mensagem : mensagem));
            }
            elemento.style.display = 'flex'; // Para centralizar ou alinhar o conteúdo da mensagem
        }
    };

    const processarCSVVendas = (textoCsv: string): { cabecalhos: string[], linhas: LinhaPlanilhaVendas[] } => {
        const todasLinhasTexto = textoCsv.trim().split('\n');
        if (todasLinhasTexto.length === 0 || todasLinhasTexto[0].trim() === '') {
            console.warn("Vendas.ts (processarCSVVendas): CSV vazio ou apenas com linha de cabeçalho vazia.");
            return { cabecalhos: [], linhas: [] };
        }
        const cabecalhoLinha = todasLinhasTexto.shift(); // Remove e retorna a primeira linha (cabeçalho)
        if (!cabecalhoLinha) {
            console.warn("Vendas.ts (processarCSVVendas): Cabeçalho do CSV não encontrado.");
            return { cabecalhos: [], linhas: [] };
        }
        const cabecalhos = cabecalhoLinha.split(',').map(h => h.trim().replace(/^"|"$/g, '')); // Limpa espaços e aspas
        colunasDefinidasCSVVendas = cabecalhos; // Armazena globalmente as colunas definidas

        const linhasProcessadas: LinhaPlanilhaVendas[] = todasLinhasTexto.map((linhaTexto) => {
            const valores: string[] = [];
            let dentroDeAspas = false;
            let valorAtual = '';
            for (let i = 0; i < linhaTexto.length; i++) {
                const char = linhaTexto[i];
                if (char === '"') {
                    // Lida com aspas duplas escapadas dentro de um campo ("")
                    if (dentroDeAspas && i + 1 < linhaTexto.length && linhaTexto[i+1] === '"') {
                        valorAtual += '"';
                        i++; // Pula a próxima aspas
                        continue;
                    }
                    dentroDeAspas = !dentroDeAspas;
                } else if (char === ',' && !dentroDeAspas) {
                    valores.push(valorAtual.trim().replace(/^"|"$/g, '')); // Limpa aspas no final (se houver)
                    valorAtual = '';
                } else {
                    valorAtual += char;
                }
            }
            valores.push(valorAtual.trim().replace(/^"|"$/g, '')); // Adiciona o último valor

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
            // console.warn("Vendas.ts (formatarMoedaVendas): Valor inválido recebido:", valor);
            return 'R$ 0,00';
        }
        return numValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    };

    const calcularKPIsEVisualizacoesVendas = (dados: LinhaPlanilhaVendas[]): void => {
        console.log("DEBUG VENDAS (calcularKPIs): INICIADO com dados.length:", dados.length);
        // Zera os KPIs antes de recalcular
        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = '0';
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(0);

        if (dados.length === 0) {
            if (graficoCategoriaInstanceVendas) { graficoCategoriaInstanceVendas.destroy(); graficoCategoriaInstanceVendas = null; }
            if (graficoTendenciaInstanceVendas) { graficoTendenciaInstanceVendas.destroy(); graficoTendenciaInstanceVendas = null; }
            console.log("DEBUG VENDAS (calcularKPIs): Sem dados, gráficos destruídos (se existiam).");
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
                    // Tenta DD/MM/YYYY
                    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dataStr)) { 
                        const partes = dataStr.split('/'); 
                        dataObj = new Date(Number(partes[2]), Number(partes[1]) - 1, Number(partes[0])); 
                    } 
                    // Tenta YYYY-MM-DD
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
    
        const numTransacoes = dados.length; // Ou outra lógica se uma linha não for uma transação única
        const ticketMedio = numTransacoes > 0 ? totalVendasNumerico / numTransacoes : 0;
    
        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(totalVendasNumerico);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = numTransacoes.toString();
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(ticketMedio);
        console.log("DEBUG VENDAS (calcularKPIs): KPIs atualizados.");

        // Gráfico de Vendas por Categoria
        if (ctxCategoriaCanvas) { 
            const ctx = ctxCategoriaCanvas.getContext('2d');
            if (ctx) {
                if (graficoCategoriaInstanceVendas) graficoCategoriaInstanceVendas.destroy();
                graficoCategoriaInstanceVendas = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(vendasPorCategoria),
                        datasets: [{
                            label: 'Vendas por Categoria',
                            data: Object.values(vendasPorCategoria),
                            backgroundColor: chartDatasetColorsDark,
                            borderColor: corFundoCardsDark, // Cor de fundo do card para borda
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom', labels: { padding: 15, font: { size: 11 }, color: corTextoSecundarioDark } },
                            tooltip: {
                                bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark,
                                backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10,
                                callbacks: { label: (context: any) => `${context.label}: ${formatarMoedaVendas(context.raw)}` }
                            }
                        }
                    }
                });
                console.log("DEBUG VENDAS (calcularKPIs): Gráfico de categorias renderizado.");
            }
        }

        // Gráfico de Tendência de Vendas
        if (ctxTendenciaCanvas) { 
            const ctx = ctxTendenciaCanvas.getContext('2d');
            if (ctx) {
                if (graficoTendenciaInstanceVendas) graficoTendenciaInstanceVendas.destroy();
                const chavesOrdenadas = Object.keys(vendasPorMes).sort(); // Ordena as chaves (ano-mês)
                const labelsGrafico = chavesOrdenadas.map(chave => {
                    const { ano, mes } = vendasPorMes[chave];
                    return `${mes.toString().padStart(2, '0')}/${ano.toString().slice(-2)}`; // Formato MM/AA
                });
                const valoresGrafico = chavesOrdenadas.map(chave => vendasPorMes[chave].total);

                graficoTendenciaInstanceVendas = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: labelsGrafico,
                        datasets: [{
                            label: 'Tendência de Vendas Mensais',
                            data: valoresGrafico,
                            borderColor: corLinhaTendencia,
                            backgroundColor: corAreaTendencia,
                            tension: 0.3,
                            fill: true,
                            pointBackgroundColor: corLinhaTendencia,
                            pointBorderColor: corTextoPrincipalDark, // Cor para borda do ponto
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
                            legend: { display: true, labels: { color: corTextoSecundarioDark, padding: 15, font: {size: 11} } },
                            tooltip: {
                                bodyColor: corTextoPrincipalDark, titleColor: corTextoPrincipalDark,
                                backgroundColor: corFundoCardsDark, borderColor: corBordasDark, borderWidth: 1, padding: 10,
                                callbacks: { label: (context: any) => `${context.dataset.label || 'Vendas'}: ${formatarMoedaVendas(context.raw)}` }
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
            console.error("Vendas.ts: Elementos da tabela (corpoTabelaVendas ou cabecalhoTabelaVendasEl) não encontrados para renderizar.");
            return;
        }
        console.log("DEBUG VENDAS (renderizarTabela): INICIADO com dadosParaRenderizar.length:", dadosParaRenderizar.length);
        
        // Renderiza o cabeçalho apenas uma vez ou se as colunas mudarem (baseado em colunasDefinidasCSVVendas)
        if (cabecalhoTabelaVendasEl.children.length === 0 && colunasDefinidasCSVVendas.length > 0) {
            cabecalhoTabelaVendasEl.innerHTML = ''; // Limpa qualquer conteúdo anterior
            colunasDefinidasCSVVendas.forEach(textoCabecalho => {
                const th = document.createElement('th');
                th.textContent = textoCabecalho;
                const thLower = textoCabecalho.toLowerCase();
                // Adiciona classes para estilização de colunas numéricas/monetárias
                if (thLower.includes('valor') || thLower.includes('preço') || thLower.includes('total') || 
                    thLower.includes('qtd') || thLower.includes('quantidade') || thLower.includes('número') || thLower.includes('estoque')) {
                    th.classList.add('coluna-numero');
                }
                cabecalhoTabelaVendasEl.appendChild(th);
            });
        }

        corpoTabelaVendas.innerHTML = ''; // Limpa linhas anteriores da tabela
        if (dadosParaRenderizar.length === 0) {
            mostrarMensagemVendas(noDataMessageDivVendas, colunasDefinidasCSVVendas.length > 0 ? 'Nenhum dado encontrado para os filtros aplicados.' : 'Nenhum dado para exibir na tabela.');
            return;
        }
        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none'; // Esconde mensagem de "sem dados"

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
        if (!termoBusca) return true; // Se não há termo de busca, não filtra (mostra tudo)
        const termoLower = termoBusca.toLowerCase();
        return colunasDefinidasCSVVendas.some(cabecalho => 
            String(linha[cabecalho]).toLowerCase().includes(termoLower)
        );
    };

    const carregarDadosVendas = async (): Promise<void> => {
        console.log("DEBUG VENDAS (carregarDadosVendas): INICIADO...");
        mostrarMensagemVendas(loadingMessageDivVendas, 'Carregando dados do dashboard...', true);
        
        if (!URL_PLANILHA_CSV_VENDAS || URL_PLANILHA_CSV_VENDAS.includes('COLE_AQUI') || URL_PLANILHA_CSV_VENDAS.length < 50) {
            mostrarMensagemVendas(errorMessageDivVendas, 'Erro: URL da planilha CSV de Vendas não configurada ou inválida.');
            colunasDefinidasCSVVendas = []; // Limpa colunas
            dadosCompletosVendas = []; // Limpa dados
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            console.log("DEBUG VENDAS (carregarDadosVendas): Chamando handlePageLoad (URL inválida).");
            handlePageLoadAndNavigationVendas(); // Configura a UI base mesmo com erro de URL
            return;
        }

        try {
            const resposta = await fetch(URL_PLANILHA_CSV_VENDAS);
            console.log("DEBUG VENDAS (carregarDadosVendas): Resposta do fetch:", resposta.status, resposta.statusText);
            if (!resposta.ok) {
                throw new Error(`Falha ao buscar CSV de Vendas: ${resposta.status} ${resposta.statusText}. Verifique a URL da planilha e suas permissões de compartilhamento (deve estar publicada na web como CSV).`);
            }
            const textoCsv = await resposta.text();
            if (!textoCsv || textoCsv.trim() === '') {
                throw new Error('O arquivo CSV de Vendas retornado está vazio ou é inválido.');
            }
            
            const { cabecalhos, linhas } = processarCSVVendas(textoCsv);
            dadosCompletosVendas = linhas; // Armazena os dados processados
            console.log("DEBUG VENDAS (carregarDadosVendas): dadosCompletosVendas populado. Comprimento:", dadosCompletosVendas.length, "Cabeçalhos:", cabecalhos);
            
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            if (errorMessageDivVendas) errorMessageDivVendas.style.display = 'none'; // Esconde msg de erro se carregou bem
            
            // Chama a função para configurar a página e navegação APÓS os dados serem carregados
            console.log("DEBUG VENDAS (carregarDadosVendas): Chamando handlePageLoadAndNavigationVendas APÓS DADOS.");
            handlePageLoadAndNavigationVendas(); 

        } catch (erro: any) {
            console.error("DEBUG VENDAS (carregarDadosVendas): ERRO CRÍTICO no try/catch ao carregar ou processar dados:", erro);
            mostrarMensagemVendas(errorMessageDivVendas, `Erro ao carregar dados do dashboard: ${erro.message}. Verifique o console para mais detalhes.`);
            dadosCompletosVendas = []; // Garante que os dados estejam vazios em caso de erro crítico
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            
            // Mesmo com erro, tenta configurar a página para mostrar a mensagem de erro corretamente.
            console.log("DEBUG VENDAS (carregarDadosVendas): Chamando handlePageLoadAndNavigationVendas do CATCH para UI de erro.");
            handlePageLoadAndNavigationVendas();
        }
    };

    // Listener para o filtro geral da tabela de vendas
    if (filtroGeralInputVendas) {
        filtroGeralInputVendas.addEventListener('input', (e) => {
            const termoBusca = (e.target as HTMLInputElement).value.trim();
            // Verifica se a seção do dashboard (que contém a tabela) está visível
            const dashboardSection = document.getElementById('secao-dashboard');
            if (dashboardSection && (dashboardSection.style.display === 'block' || dashboardSection.classList.contains('active-section'))) {
                 const dadosFiltrados = dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoBusca));
                 renderizarTabelaVendas(dadosFiltrados);
            }
        });
    }
    
    // Inicializa o carregamento dos dados de vendas
    carregarDadosVendas();

    // Lógica para sombras de scroll em tabelas responsivas (se você tiver)
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
        // Chama uma vez no load para estado inicial correto
        // Pode ser necessário um pequeno delay se a tabela renderiza depois
        setTimeout(updateScrollShadows, 100); 
        // Se usar ResizeObserver para mudanças de tamanho:
        // new ResizeObserver(updateScrollShadows).observe(tableContainer);
    });
});