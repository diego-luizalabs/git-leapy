// vendas.ts

console.log("LOG INICIAL: js/vendas.ts foi lido e está sendo processado.");

declare var Chart: any;
declare var ChartDataLabels: any;

try {
    if (typeof Chart !== 'undefined' && typeof Chart.register === 'function' && 
        typeof ChartDataLabels !== 'undefined' && ChartDataLabels) {
        Chart.register(ChartDataLabels);
        console.log("DEBUG VENDAS (TS): chartjs-plugin-datalabels registrado.");
    } else {
        if (typeof Chart === 'undefined' || typeof Chart.register !== 'function') {
            // console.warn("AVISO VENDAS (TS): Biblioteca Chart principal não está definida ou Chart.register não é uma função.");
        }
        if (typeof ChartDataLabels === 'undefined' || !ChartDataLabels) {
            // console.info("INFO VENDAS (TS): ChartDataLabels não está definido. O plugin DataLabels não será registrado.");
        }
    }
} catch (error) {
    console.error("ERRO VENDAS (TS): Falha ao registrar ChartDataLabels:", error);
}

const URL_PLANILHA_CSV_VENDAS: string = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTc4Li4jKj5mCtp-LqMGZpZQ_YQftOHcYV-doFLokTgEcrRcsgR-N6GM7q4aPZid_lq6YKAJON_1IZO/pub?gid=896325874&single=true&output=csv';

interface LinhaPlanilhaVendas {
    [key: string]: string | number;
}

let graficoCategoriaInstanceVendas: any = null;
let graficoTendenciaInstanceVendas: any = null;
let dadosCompletosVendas: LinhaPlanilhaVendas[] = [];
let colunasDefinidasCSVVendas: string[] = [];

document.addEventListener('DOMContentLoaded', () => {
    console.log("DEBUG VENDAS (TS): DOMContentLoaded INICIADO.");

    if (sessionStorage.getItem('isXuxuGlowAdminLoggedIn') !== 'true') {
        console.warn("DOM Vendas (TS): Usuário não logado. Redirecionando.");
        window.location.href = 'index.html';
        return;
    }
    console.log("DOM Vendas (TS): Usuário logado.");

    const NOME_COLUNA_VALOR_VENDA_VENDAS: string = 'Total da Semana'; 
    const NOME_COLUNA_CATEGORIA_VENDAS: string = 'Categoria'; 
    const NOME_COLUNA_DATA_VENDAS: string = 'Data';

    const computedStyles = getComputedStyle(document.documentElement);
    const corTextoPrincipalDark: string = computedStyles.getPropertyValue('--cor-texto-principal-dark').trim() || '#e5e7eb';
    const corTextoSecundarioDark: string = computedStyles.getPropertyValue('--cor-texto-secundario-dark').trim() || '#9ca3af';
    // ... (outras constantes de cores)

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
    const mensagemStatusTabelaVendas = document.getElementById('tabela-vendas-mensagem-status') as HTMLParagraphElement | null;

    // =======================================================================================
    // COLE AQUI A SUA LÓGICA DE NAVEGAÇÃO COMPLETA (sidebar, menu, seções, etc.)
    // (O código que você forneceu anteriormente para esta seção será usado aqui)
    const sidebarVendas = document.querySelector<HTMLElement>('.dashboard-sidebar');
    const menuToggleBtnVendas = document.querySelector<HTMLButtonElement>('.menu-toggle-btn');
    const bodyVendas = document.body;
    const navLinksVendas = document.querySelectorAll<HTMLAnchorElement>('.sidebar-nav a'); 
    const sectionsVendas = document.querySelectorAll<HTMLElement>('.dashboard-page-content > .dashboard-section');
    const tituloSecaoHeaderVendas = document.getElementById('dashboard-titulo-secao') as HTMLElement | null;

    if (sidebarVendas && menuToggleBtnVendas) {
        menuToggleBtnVendas.addEventListener('click', () => {
            const isVisible = sidebarVendas.classList.toggle('sidebar-visible');
            bodyVendas.classList.toggle('sidebar-overlay-active', isVisible);
            menuToggleBtnVendas.setAttribute('aria-expanded', isVisible.toString());
        });
        bodyVendas.addEventListener('click', (event: MouseEvent) => { 
            if (bodyVendas.classList.contains('sidebar-overlay-active') && sidebarVendas.classList.contains('sidebar-visible')) {
                const target = event.target as Node; 
                if (!sidebarVendas.contains(target) && !menuToggleBtnVendas.contains(target)) {
                    sidebarVendas.classList.remove('sidebar-visible');
                    bodyVendas.classList.remove('sidebar-overlay-active');
                    menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    function updateActiveLinkAndTitleVendas(activeLink: HTMLAnchorElement | null): void {
        navLinksVendas.forEach(navLink => navLink.classList.remove('active'));
        if (activeLink) {
            activeLink.classList.add('active');
            if (tituloSecaoHeaderVendas) {
                let titulo: string = activeLink.dataset.title || (activeLink.textContent || '').trim() || 'Dashboard';
                if (!activeLink.dataset.title) {
                    const iconSpan = activeLink.querySelector<HTMLElement>('.icon');
                    if (iconSpan && iconSpan.textContent) {
                        titulo = titulo.replace(iconSpan.textContent.trim(), '').trim();
                    }
                }
                tituloSecaoHeaderVendas.textContent = (titulo.toLowerCase() === 'dashboard' || titulo.toLowerCase() === 'visão geral das vendas') ? 'Visão Geral das Vendas' : titulo;
            }
        }
    }

    function showSectionVendas(targetId: string): boolean {
        // console.log(`DEBUG VENDAS (TS showSection): Exibindo '${targetId}'. Dados carregados: ${dadosCompletosVendas.length}`);
        let sectionFoundAndDisplayed = false;
        if (!sectionsVendas || sectionsVendas.length === 0) { return false; }
        sectionsVendas.forEach(section => { 
            if (section.id === targetId) {
                section.style.display = 'block'; section.classList.add('active-section'); sectionFoundAndDisplayed = true;
                section.querySelectorAll<HTMLElement>('.kpi-card, .grafico-card, .card-secao, .secao-tabela-detalhada').forEach((card, index) => {
                    card.style.animation = 'none'; void card.offsetWidth; 
                    card.style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                if (targetId === 'secao-dashboard') {
                    if (dadosCompletosVendas.length > 0) {
                        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';
                        if (mensagemStatusTabelaVendas) mensagemStatusTabelaVendas.style.display = 'none';
                        calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                        const termoFiltro = filtroGeralInputVendas ? filtroGeralInputVendas.value : '';
                        renderizarTabelaVendas(dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoFiltro)));
                    } else {
                        if (graficoCategoriaInstanceVendas) { graficoCategoriaInstanceVendas.destroy(); graficoCategoriaInstanceVendas = null; }
                        if (graficoTendenciaInstanceVendas) { graficoTendenciaInstanceVendas.destroy(); graficoTendenciaInstanceVendas = null; }
                        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
                        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = '0';
                        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(0);
                        renderizarTabelaVendas([]);
                    }
                }
            } else {
                section.style.display = 'none'; section.classList.remove('active-section');
            }
        });
        return sectionFoundAndDisplayed;
    }

    navLinksVendas.forEach(link => {
        link.addEventListener('click', function(this: HTMLAnchorElement, event: MouseEvent) {
            const currentAnchor = this; 
            const hrefAttribute = currentAnchor.getAttribute('href');
            const dataTargetSection = currentAnchor.dataset.target;
            if (hrefAttribute && hrefAttribute.includes('.html') && !hrefAttribute.startsWith('#')) return;
            if (hrefAttribute && (hrefAttribute.startsWith('http://') || hrefAttribute.startsWith('https://') || hrefAttribute.startsWith('//'))) return;
            event.preventDefault();
            let sectionIdToDisplay: string | null = dataTargetSection || 
                (hrefAttribute && hrefAttribute.startsWith('#') && hrefAttribute.length > 1 ? `secao-${hrefAttribute.substring(1)}` : null) || 
                'secao-dashboard';
            if (showSectionVendas(sectionIdToDisplay)) {
                updateActiveLinkAndTitleVendas(currentAnchor);
                const newHash = sectionIdToDisplay === 'secao-dashboard' ? '#dashboard' : (sectionIdToDisplay.startsWith('secao-') ? `#${sectionIdToDisplay.substring(6)}` : `#${sectionIdToDisplay}`);
                if (window.location.hash !== newHash && newHash !== '#undefined' && newHash !== '#null') {
                    history.pushState({ section: sectionIdToDisplay }, "", newHash);
                }
            }
            if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                sidebarVendas.classList.remove('sidebar-visible'); bodyVendas.classList.remove('sidebar-overlay-active'); menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
            }
        });
    });

    function handlePageLoadAndNavigationVendas(): void {
        // console.log("DEBUG VENDAS (TS handlePageLoad): INICIADO. Hash:", location.hash);
        const currentPathFilename: string = window.location.pathname.split('/').pop() || 'index.html';
        const hash: string = location.hash.substring(1);
        let activeLinkElement: HTMLAnchorElement | null = null;
        let targetSectionIdFromLoad: string = 'secao-dashboard';
        if (currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html') || currentPathFilename === "" ) {
            if (hash) {
                activeLinkElement = document.querySelector<HTMLAnchorElement>(`.sidebar-nav a[href="#${hash}"]`);
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || `secao-${hash}`;
            } else {
                activeLinkElement = document.querySelector<HTMLAnchorElement>('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || 'secao-dashboard';
            }
        } else {
            activeLinkElement = document.querySelector<HTMLAnchorElement>(`.sidebar-nav a[href$="${currentPathFilename}"]`);
            if (activeLinkElement) updateActiveLinkAndTitleVendas(activeLinkElement);
            return; 
        }
        if (!showSectionVendas(targetSectionIdFromLoad)) {
            if (showSectionVendas('secao-dashboard')) {
                activeLinkElement = document.querySelector<HTMLAnchorElement>('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
            }
        }
        updateActiveLinkAndTitleVendas(activeLinkElement);
    }
    window.addEventListener('popstate', () => handlePageLoadAndNavigationVendas());
    // =======================================================================================

    function mostrarGlobalMessageVendas(elemento: HTMLElement | null, mensagem: string = '', mostrarSpinner: boolean = false): void {
        const todasMensagensGlobais = [loadingMessageDivVendas, errorMessageDivVendas, noDataMessageDivVendas];
        todasMensagensGlobais.forEach(msgEl => {
            if (msgEl && msgEl !== elemento) msgEl.style.display = 'none';
        });
        if (elemento) {
            elemento.innerHTML = '';
            if (mostrarSpinner) {
                const spinner = document.createElement('div'); spinner.className = 'spinner'; elemento.appendChild(spinner);
            }
            if (mensagem) elemento.appendChild(document.createTextNode(mostrarSpinner ? ' ' + mensagem : mensagem));
            elemento.style.display = 'flex';
        }
    }

    // CORREÇÃO APLICADA AQUI: Adicionado o parâmetro mostrarSpinner
    function mostrarMensagemStatusTabela(mensagem: string, tipo: 'loading' | 'error' | 'info' | 'none' = 'info', mostrarSpinner: boolean = false) {
        if (mensagemStatusTabelaVendas) {
            mensagemStatusTabelaVendas.innerHTML = '';
            if (tipo === 'none') {
                mensagemStatusTabelaVendas.style.display = 'none';
                return;
            }
            if (mostrarSpinner && tipo === 'loading') { // Adiciona spinner se tipo for 'loading' e mostrarSpinner for true
                const spinner = document.createElement('div');
                spinner.className = 'spinner'; // Use sua classe CSS para o spinner
                mensagemStatusTabelaVendas.appendChild(spinner);
                mensagemStatusTabelaVendas.appendChild(document.createTextNode(' ' + mensagem));
            } else {
                mensagemStatusTabelaVendas.textContent = mensagem;
            }
            mensagemStatusTabelaVendas.style.display = 'block';
            mensagemStatusTabelaVendas.style.color = tipo === 'error' ? '#f87171' : corTextoSecundarioDark;
        } else if (corpoTabelaVendas && tipo !== 'none') {
            const numColunas = Math.max(colunasDefinidasCSVVendas.length, cabecalhoTabelaVendasEl?.children.length || 1);
            corpoTabelaVendas.innerHTML = `<tr><td colspan="${numColunas}" style="text-align:center; padding: 20px;">${mensagem}</td></tr>`;
        }
    }
    
    function processarCSVVendas(textoCsv: string): { cabecalhos: string[], linhas: LinhaPlanilhaVendas[] } {
        // ... (Sua função processarCSVVendas mantida) ...
        const todasLinhasTexto: string[] = textoCsv.trim().split(/\r\n|\n|\r/);
        if (todasLinhasTexto.length === 0) { return { cabecalhos: [], linhas: [] }; }
        const cabecalhoLinha: string | undefined = todasLinhasTexto.shift();
        if (!cabecalhoLinha || cabecalhoLinha.trim() === '') { return { cabecalhos: [], linhas: [] }; }
        const cabecalhos: string[] = cabecalhoLinha.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        colunasDefinidasCSVVendas = cabecalhos;
        const linhasProcessadas: LinhaPlanilhaVendas[] = todasLinhasTexto
            .filter(linhaTexto => linhaTexto.trim() !== '')
            .map((linhaTexto: string) => {
                const valores: string[] = [];
                let dentroDeAspas = false; let valorAtual = '';
                for (let i = 0; i < linhaTexto.length; i++) {
                    const char = linhaTexto[i];
                    if (char === '"') {
                        if (dentroDeAspas && i + 1 < linhaTexto.length && linhaTexto[i+1] === '"') {
                            valorAtual += '"'; i++; continue;
                        }
                        dentroDeAspas = !dentroDeAspas;
                    } else if (char === ',' && !dentroDeAspas) {
                        valores.push(valorAtual.trim()); valorAtual = '';
                    } else { valorAtual += char; }
                }
                valores.push(valorAtual.trim());
                const linhaObj: LinhaPlanilhaVendas = {};
                cabecalhos.forEach((cabecalho: string, index: number) => {
                    let valorFinal = valores[index] !== undefined ? valores[index] : '';
                    if (valorFinal.startsWith('"') && valorFinal.endsWith('"')) {
                        valorFinal = valorFinal.substring(1, valorFinal.length - 1).replace(/""/g, '"');
                    }
                    linhaObj[cabecalho] = valorFinal;
                });
                return linhaObj;
            });
        console.log(`Vendas.ts (processarCSVVendas): CSV Processado. Cabeçalhos: [${cabecalhos.join(', ')}]. Linhas: ${linhasProcessadas.length}`);
        if (linhasProcessadas.length > 0) console.log("VENDAS.TS: Primeira linha de dados processada do CSV:", linhasProcessadas[0]);
        return { cabecalhos, linhas: linhasProcessadas };
    }

    function formatarMoedaVendas(valor: number | string): string {
        // ... (Sua função formatarMoedaVendas mantida) ...
        let numValor: number = typeof valor === 'string'
            ? parseFloat(valor.replace("R$", "").replace(/\./g, '').replace(',', '.').trim())
            : Number(valor);
        if (isNaN(numValor)) return 'R$ 0,00';
        return numValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }
    
    function calcularKPIsEVisualizacoesVendas(dados: LinhaPlanilhaVendas[]): void {
        // ... (Sua função calcularKPIsEVisualizacoesVendas - cole sua lógica completa de gráficos aqui) ...
        console.log("DEBUG VENDAS (TS calcularKPIs): INICIADO com dados.length:", dados.length);
        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = '0';
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(0);
        if (graficoCategoriaInstanceVendas) { graficoCategoriaInstanceVendas.destroy(); graficoCategoriaInstanceVendas = null; }
        if (graficoTendenciaInstanceVendas) { graficoTendenciaInstanceVendas.destroy(); graficoTendenciaInstanceVendas = null; }
        if (dados.length === 0) { return; }
        let totalVendasNumerico: number = 0;
        const nomeColunaValorReal = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === NOME_COLUNA_VALOR_VENDA_VENDAS.toLowerCase());
        if (!nomeColunaValorReal) {
            console.error(`ERRO VENDAS (TS calcularKPIs): Coluna para valor ('${NOME_COLUNA_VALOR_VENDA_VENDAS}') NÃO encontrada. CSV Headers: [${colunasDefinidasCSVVendas.join(', ')}]`);
            return; 
        }
        dados.forEach((item: LinhaPlanilhaVendas) => {
            const valorVendaOriginal = String(item[nomeColunaValorReal!] || '0');
            const valorVendaStr = valorVendaOriginal.replace("R$", "").replace(/\./g, '').replace(',', '.').trim();
            const valorVendaNum = parseFloat(valorVendaStr);
            if (!isNaN(valorVendaNum)) totalVendasNumerico += valorVendaNum;
        });
        const numTransacoes: number = dados.length; 
        const ticketMedio: number = numTransacoes > 0 ? totalVendasNumerico / numTransacoes : 0;
        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(totalVendasNumerico);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = numTransacoes.toString();
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(ticketMedio);
        console.warn("VENDAS.TS: Lógica de renderização de gráficos precisa ser inserida em calcularKPIsEVisualizacoesVendas.");
    }

    function renderizarTabelaVendas(dadosParaRenderizar: LinhaPlanilhaVendas[]): void {
        if (!cabecalhoTabelaVendasEl) {
            console.error("Vendas.ts FATAL: Elemento <tr> do cabeçalho (ID: cabecalho-tabela) NÃO ENCONTRADO!");
            return;
        }
        if (!corpoTabelaVendas) {
            console.error("Vendas.ts FATAL: Elemento <tbody> (ID: corpo-tabela-vendas) NÃO ENCONTRADO!");
            return;
        }
        cabecalhoTabelaVendasEl.innerHTML = ''; 
        corpoTabelaVendas.innerHTML = '';   
        if (mensagemStatusTabelaVendas) mensagemStatusTabelaVendas.style.display = 'none';

        if (colunasDefinidasCSVVendas.length > 0) {
            colunasDefinidasCSVVendas.forEach(textoCabecalho => {
                const th = document.createElement('th');
                th.textContent = textoCabecalho;
                // ... (sua lógica de classe .coluna-numero para th)
                cabecalhoTabelaVendasEl.appendChild(th);
            });
        } else if (dadosParaRenderizar.length > 0) {
            Object.keys(dadosParaRenderizar[0]).forEach(key => { // Fallback
                const th = document.createElement('th'); th.textContent = key; cabecalhoTabelaVendasEl.appendChild(th);
            });
        }
        
        if (dadosParaRenderizar.length === 0) {
            const numColunas = Math.max(colunasDefinidasCSVVendas.length, 1);
            const mensagem = filtroGeralInputVendas && filtroGeralInputVendas.value.trim() !== ''
                ? 'Nenhuma venda encontrada para o filtro aplicado.'
                : 'Nenhum dado de vendas para exibir.';
            corpoTabelaVendas.innerHTML = `<tr><td colspan="${numColunas}" style="text-align:center; padding: 20px;">${mensagem}</td></tr>`;
            return;
        }
       
        dadosParaRenderizar.forEach((linhaObj: LinhaPlanilhaVendas) => {
            const tr = corpoTabelaVendas.insertRow();
            colunasDefinidasCSVVendas.forEach(cabecalho => {
                const td = tr.insertCell();
                // ... (sua lógica de preenchimento de td e formatação de moeda/número) ...
                 let valor: string = String(linhaObj[cabecalho] !== undefined ? linhaObj[cabecalho] : '');
                const cabecalhoLower = cabecalho.toLowerCase();
                const nomeColunaValorReal = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === NOME_COLUNA_VALOR_VENDA_VENDAS.toLowerCase());

                if ((nomeColunaValorReal && cabecalho.toLowerCase() === nomeColunaValorReal.toLowerCase()) || 
                    cabecalhoLower.includes('preço') || cabecalhoLower.includes('valor total')) {
                    td.textContent = formatarMoedaVendas(valor);
                    td.classList.add('coluna-numero');
                } else if (cabecalhoLower.includes('semana') || cabecalhoLower.includes('unidades') || 
                           cabecalhoLower.includes('qtd') || cabecalhoLower.includes('id')) {
                     td.textContent = valor;
                     td.classList.add('coluna-numero');
                } else {
                     td.textContent = valor;
                }
            });
        });
    }

    function filtrarLinhaVendas(linha: LinhaPlanilhaVendas, termoBusca: string): boolean {
        // ... (Sua função filtrarLinhaVendas mantida) ...
        if (!termoBusca) return true;
        const termoLower = termoBusca.toLowerCase();
        return colunasDefinidasCSVVendas.some(cabecalho =>
            String(linha[cabecalho]).toLowerCase().includes(termoLower)
        );
    }

    async function carregarDadosVendas(): Promise<void> {
        // console.log("DEBUG VENDAS (TS carregarDadosVendas): INICIADO...");
        if (loadingMessageDivVendas) mostrarGlobalMessageVendas(loadingMessageDivVendas, 'Carregando dados...', true);
        else if (mensagemStatusTabelaVendas) mostrarMensagemStatusTabela('Carregando dados...', 'loading', true);
        
        if (errorMessageDivVendas) errorMessageDivVendas.style.display = 'none';
        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';
        
        if (cabecalhoTabelaVendasEl) cabecalhoTabelaVendasEl.innerHTML = ''; 
        if (corpoTabelaVendas) { 
             const numCols = cabecalhoTabelaVendasEl?.children.length || Math.max(colunasDefinidasCSVVendas.length, 1);
             corpoTabelaVendas.innerHTML = `<tr><td colspan="${numCols}" style="text-align:center; padding:20px;">Carregando...</td></tr>`;
        }

        if (!URL_PLANILHA_CSV_VENDAS || URL_PLANILHA_CSV_VENDAS.length < 50) {
            // ... (tratamento de erro de URL mantido)
            const msgErroUrl = 'Erro: URL da planilha CSV de Vendas não configurada ou é inválida.';
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            mostrarGlobalMessageVendas(errorMessageDivVendas, msgErroUrl);
            renderizarTabelaVendas([]); 
            return;
        }

        try {
            const resposta = await fetch(URL_PLANILHA_CSV_VENDAS, { cache: 'no-store' });
            if (!resposta.ok) throw new Error(`Falha ao buscar CSV (${resposta.status}).`);
            const textoCsv = await resposta.text();
            if (!textoCsv || textoCsv.trim() === '') throw new Error('Arquivo CSV da planilha está vazio.');

            const { cabecalhos, linhas } = processarCSVVendas(textoCsv);
            dadosCompletosVendas = linhas; 
            // colunasDefinidasCSVVendas é setado em processarCSVVendas
            console.log(`DEBUG VENDAS (TS carregarDadosVendas): CSV Processado. ${linhas.length} linhas. Cabeçalhos: [${colunasDefinidasCSVVendas.join(', ')}]`);
            
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            if (errorMessageDivVendas) errorMessageDivVendas.style.display = 'none';
            if (mensagemStatusTabelaVendas) mostrarMensagemStatusTabela('', 'none');
            
            if (typeof handlePageLoadAndNavigationVendas === "function") {
                handlePageLoadAndNavigationVendas(); 
            } else {
                const secaoDashboard = document.getElementById('secao-dashboard');
                if (secaoDashboard?.style.display === 'block' || secaoDashboard?.classList.contains('active-section')) {
                    if (dadosCompletosVendas.length > 0) {
                         if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';
                         calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                         renderizarTabelaVendas(dadosCompletosVendas);
                    } else {
                        renderizarTabelaVendas([]);
                    }
                }
            }
        } catch (erro: any) {
            // ... (tratamento de erro mantido)
            const mensagemErro = (erro instanceof Error) ? erro.message : 'Erro desconhecido.';
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            mostrarGlobalMessageVendas(errorMessageDivVendas, `Erro: ${mensagemErro}`);
            dadosCompletosVendas = []; colunasDefinidasCSVVendas = [];
            renderizarTabelaVendas([]); 
        }
    }

    if (filtroGeralInputVendas) {
        filtroGeralInputVendas.addEventListener('input', () => { /* ... (seu filtro) ... */ });
    }
    carregarDadosVendas();
    // ... (sua lógica de updateScrollShadows)
});