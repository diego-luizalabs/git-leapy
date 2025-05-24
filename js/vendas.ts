// vendas.ts

console.log("LOG INICIAL: js/vendas.ts foi lido e está sendo processado.");

declare var Chart: any;
declare var ChartDataLabels: any;

try {
    if (typeof Chart !== 'undefined' && typeof Chart.register === 'function' &&
        typeof ChartDataLabels !== 'undefined' && ChartDataLabels) {
        Chart.register(ChartDataLabels);
        // console.log("DEBUG VENDAS (TS): chartjs-plugin-datalabels registrado (se disponível).");
    } else {
        if (typeof Chart === 'undefined' || typeof Chart.register !== 'function') {
            // console.warn("AVISO VENDAS (TS): Biblioteca Chart.js ou Chart.register não disponível.");
        }
        if (typeof ChartDataLabels === 'undefined' || !ChartDataLabels) {
            // console.info("INFO VENDAS (TS): Plugin ChartDataLabels não encontrado. Rótulos nos gráficos podem não aparecer.");
        }
    }
} catch (error) {
    console.error("ERRO VENDAS (TS): Falha ao tentar registrar ChartDataLabels:", error);
}

const URL_PLANILHA_CSV_VENDAS: string = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTc4Li4jKj5mCtp-LqMGZpZQ_YQftOHcYV-doFLokTgEcrRcsgR-N6GM7q4aPZid_lq6YKAJON_1IZO/pub?gid=896325874&single=true&output=csv';

interface LinhaPlanilhaVendas {
    [key: string]: string | number;
}

// let graficoCategoriaInstanceVendas: any = null; // REMOVIDO COMPLETAMENTE
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

    const NOME_COLUNA_VALOR_VENDA: string = 'Total da Semana';
    // const NOME_COLUNA_CATEGORIA: string = 'Categoria'; // REMOVIDO COMPLETAMENTE
    const NOME_COLUNA_DATA: string = 'Data'; // Mantido, embora não usado ativamente nos gráficos atuais, pode ser útil para futuras expansões ou tabela.

    const COL_S1: string = 'Primeira Semana';
    const COL_S2: string = 'Segunda Semana';
    const COL_S3: string = 'Terceira Semana';
    const COL_S4: string = 'Quarta Semana';

    const computedStyles = getComputedStyle(document.documentElement);
    const corTextoPrincipalDark: string = computedStyles.getPropertyValue('--cor-texto-principal-dark').trim() || '#e5e7eb';
    const corTextoSecundarioDark: string = computedStyles.getPropertyValue('--cor-texto-secundario-dark').trim() || '#9ca3af';
    // const corBordasDark: string = computedStyles.getPropertyValue('--cor-bordas-dark').trim() || '#374151'; // Não usado diretamente no TS
    // const corFundoCardsDark: string = computedStyles.getPropertyValue('--cor-fundo-cards-dark').trim() || '#1f2937'; // Não usado diretamente no TS
    const chartDatasetColorsDark: string[] = [
        computedStyles.getPropertyValue('--cor-primaria-accent-dark').trim() || '#8B5CF6',
        computedStyles.getPropertyValue('--cor-secundaria-accent-dark').trim() || '#34d399', // Pode ser usado futuramente
        '#f43f5e', '#facc15', '#818cf8', '#a78bfa', '#f472b6', '#60a5fa',
        '#f97316', '#14b8a6', '#ec4899', '#0ea5e9'
    ];
    const corLinhaTendencia: string = chartDatasetColorsDark[0];
    const corAreaTendencia: string = `${corLinhaTendencia}4D`; // Ex: #8B5CF64D para transparência

    const kpiTotalVendasEl = document.getElementById('kpi-total-vendas') as HTMLElement | null;
    const kpiNumTransacoesEl = document.getElementById('kpi-num-transacoes') as HTMLElement | null;
    const kpiTicketMedioEl = document.getElementById('kpi-ticket-medio') as HTMLElement | null;
    // const ctxCategoriaCanvas = document.getElementById('grafico-vendas-categoria') as HTMLCanvasElement | null; // REMOVIDO COMPLETAMENTE
    const ctxTendenciaCanvas = document.getElementById('grafico-tendencia-vendas') as HTMLCanvasElement | null;
    const corpoTabelaVendas = document.getElementById('corpo-tabela-vendas') as HTMLTableSectionElement | null;
    const cabecalhoTabelaVendasEl = document.getElementById('cabecalho-tabela') as HTMLTableRowElement | null;
    const filtroGeralInputVendas = document.getElementById('filtro-geral') as HTMLInputElement | null;
    const loadingMessageDivVendas = document.getElementById('loading-message') as HTMLDivElement | null;
    const errorMessageDivVendas = document.getElementById('error-message') as HTMLDivElement | null;
    const noDataMessageDivVendas = document.getElementById('no-data-message') as HTMLDivElement | null;

    // --- SUA LÓGICA DE NAVEGAÇÃO E SIDEBAR (COMO VOCÊ FORNECEU) ---
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
                if (!activeLink.dataset.title) { // Tenta limpar o texto do ícone se não houver data-title
                    const iconSpan = activeLink.querySelector<HTMLElement>('.icon');
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

    function showSectionVendas(targetId: string): boolean {
        let sectionFoundAndDisplayed = false;
        if (!sectionsVendas || sectionsVendas.length === 0) { console.warn("showSectionVendas: Nenhuma seção encontrada."); return false; }
        sectionsVendas.forEach(section => {
            if (section.id === targetId) {
                section.style.display = 'block'; section.classList.add('active-section'); sectionFoundAndDisplayed = true;
                section.querySelectorAll<HTMLElement>('.kpi-card, .grafico-card, .card-secao, .secao-tabela-detalhada').forEach((card, index) => {
                    card.style.animation = 'none'; void card.offsetWidth; // Reinicia animação
                    card.style.animation = `fadeInUp 0.5s ${index * 0.07}s ease-out forwards`;
                });
                // Lógica específica para a seção de dashboard de vendas
                if (targetId === 'secao-dashboard') {
                    if (dadosCompletosVendas.length > 0) {
                        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';
                        calcularKPIsEVisualizacoesVendas(dadosCompletosVendas); // Recalcula e redesenha gráficos para esta seção
                        const termoFiltro = filtroGeralInputVendas?.value.toLowerCase() || '';
                        renderizarTabelaVendas(dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoFiltro)));
                    } else {
                        // Se não há dados, limpa e mostra mensagem apropriada
                        renderizarTabelaVendas([]);
                        calcularKPIsEVisualizacoesVendas([]); // Limpa gráficos
                        if (loadingMessageDivVendas?.style.display !== 'flex' && errorMessageDivVendas?.style.display !== 'flex') {
                           if(noDataMessageDivVendas) mostrarGlobalMessageVendas(noDataMessageDivVendas, 'Nenhum dado de vendas para exibir no dashboard no momento.');
                        }
                    }
                }
            } else {
                section.style.display = 'none'; section.classList.remove('active-section');
            }
        });
        if (!sectionFoundAndDisplayed) console.warn(`showSectionVendas: Seção com ID '${targetId}' não encontrada.`);
        return sectionFoundAndDisplayed;
    }

    navLinksVendas.forEach(link => {
        link.addEventListener('click', function(this: HTMLAnchorElement, event: MouseEvent) {
            const currentAnchor = this;
            const hrefAttribute = currentAnchor.getAttribute('href');
            const dataTargetSection = currentAnchor.dataset.target;

            // Ignora links externos ou para outras páginas .html
            if (hrefAttribute && hrefAttribute.includes('.html') && !hrefAttribute.startsWith('#')) { return; }
            if (hrefAttribute && (hrefAttribute.startsWith('http://') || hrefAttribute.startsWith('https://') || hrefAttribute.startsWith('//'))) { return; }

            event.preventDefault(); // Previne navegação padrão para hashes
            let sectionIdToDisplay: string = dataTargetSection ||
                (hrefAttribute && hrefAttribute.startsWith('#') && hrefAttribute.length > 1 ? `secao-${hrefAttribute.substring(1)}` : 'secao-dashboard');

            if (hrefAttribute === '#dashboard') sectionIdToDisplay = 'secao-dashboard'; // Garante que #dashboard sempre aponte para secao-dashboard

            if (showSectionVendas(sectionIdToDisplay)) {
                updateActiveLinkAndTitleVendas(currentAnchor);
                // Atualiza o hash na URL de forma mais limpa
                const newHash = sectionIdToDisplay === 'secao-dashboard' ? '#dashboard' : (sectionIdToDisplay.startsWith('secao-') ? `#${sectionIdToDisplay.substring(6)}` : `#${sectionIdToDisplay}`);
                if (window.location.hash !== newHash && newHash !== '#undefined' && newHash !== '#null') { // Evita hashes inválidos
                    history.pushState({ section: sectionIdToDisplay }, "", newHash);
                }
            }
            // Lógica para fechar sidebar em mobile após clique
            if (sidebarVendas && sidebarVendas.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnVendas) {
                sidebarVendas.classList.remove('sidebar-visible'); bodyVendas.classList.remove('sidebar-overlay-active'); menuToggleBtnVendas.setAttribute('aria-expanded', 'false');
            }
        });
    });

    function handlePageLoadAndNavigationVendas(): void {
        const currentPathFilename: string = window.location.pathname.split('/').pop() || 'index.html';
        const hash: string = location.hash.substring(1); // Remove o '#'
        let activeLinkElement: HTMLAnchorElement | null = null;
        let targetSectionIdFromLoad: string = 'secao-dashboard'; // Padrão

        // Verifica se estamos em uma página que deve exibir seções do dashboard (ex: index.html, vendas.html, dashboard.html)
        // Adapte os nomes de arquivo conforme sua estrutura
        if (currentPathFilename.endsWith('index.html') || currentPathFilename.endsWith('vendas.html') || currentPathFilename.endsWith('dashboard.html') || currentPathFilename === "") {
            if (hash) {
                activeLinkElement = document.querySelector<HTMLAnchorElement>(`.sidebar-nav a[href="#${hash}"]`);
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || `secao-${hash}`;
            } else { // Sem hash, carrega a seção padrão do dashboard
                activeLinkElement = document.querySelector<HTMLAnchorElement>('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
                targetSectionIdFromLoad = activeLinkElement?.dataset.target || 'secao-dashboard';
            }
        } else {
            // Para outras páginas (ex: produtos.html), apenas marca o link ativo, não tenta mostrar seção
            activeLinkElement = document.querySelector<HTMLAnchorElement>(`.sidebar-nav a[href$="${currentPathFilename}"]`);
            if (activeLinkElement) updateActiveLinkAndTitleVendas(activeLinkElement);
            return; // Não continua para mostrar seção se for outra página
        }

        if (!showSectionVendas(targetSectionIdFromLoad)) { // Se a seção do hash não for encontrada
            if (showSectionVendas('secao-dashboard')) { // Tenta mostrar a seção dashboard como fallback
                activeLinkElement = document.querySelector<HTMLAnchorElement>('.sidebar-nav a[href="#dashboard"], .sidebar-nav a[data-target="secao-dashboard"]');
            }
        }
        updateActiveLinkAndTitleVendas(activeLinkElement); // Atualiza o link ativo e o título da seção
    }
    window.addEventListener('popstate', () => handlePageLoadAndNavigationVendas());
    // --- Fim da Sua Lógica de Navegação ---

    function mostrarGlobalMessageVendas(elemento: HTMLElement | null, mensagem: string = '', mostrarSpinner: boolean = false): void {
        const todasMensagensGlobais = [loadingMessageDivVendas, errorMessageDivVendas, noDataMessageDivVendas];
        todasMensagensGlobais.forEach(msgEl => { if (msgEl && msgEl !== elemento) msgEl.style.display = 'none'; });
        if (elemento) {
            elemento.innerHTML = ''; // Limpa conteúdo anterior
            if (mostrarSpinner) { const spinner = document.createElement('div'); spinner.className = 'spinner'; elemento.appendChild(spinner); }
            if (mensagem) elemento.appendChild(document.createTextNode(mostrarSpinner ? ' ' + mensagem : mensagem)); // Adiciona espaço se tiver spinner
            elemento.style.display = 'flex'; // Usa flex para centralizar spinner e texto
        }
    }

    function processarCSVVendas(textoCsv: string): { cabecalhos: string[], linhas: LinhaPlanilhaVendas[] } {
        const todasLinhasTexto: string[] = textoCsv.trim().split(/\r\n|\n|\r/);
        if (todasLinhasTexto.length === 0) { return { cabecalhos: [], linhas: [] }; }
        const cabecalhoLinha: string | undefined = todasLinhasTexto.shift(); // Remove e retorna a primeira linha (cabeçalho)
        if (!cabecalhoLinha || cabecalhoLinha.trim() === '') { console.warn("processarCSVVendas: Cabeçalho vazio ou ausente."); return { cabecalhos: [], linhas: [] }; }

        const cabecalhos: string[] = cabecalhoLinha.split(',').map(h => h.trim().replace(/^"|"$/g, '')); // Limpa e remove aspas das bordas
        colunasDefinidasCSVVendas = cabecalhos; // Armazena globalmente

        const linhasProcessadas: LinhaPlanilhaVendas[] = todasLinhasTexto
            .filter(linhaTexto => linhaTexto.trim() !== '') // Ignora linhas completamente vazias
            .map((linhaTexto: string) => {
                const valores: string[] = []; let dentroDeAspas = false; let valorAtual = '';
                for (let i = 0; i < linhaTexto.length; i++) {
                    const char = linhaTexto[i];
                    if (char === '"') { // Aspas duplas
                        if (dentroDeAspas && i + 1 < linhaTexto.length && linhaTexto[i+1] === '"') { // Aspas duplas escapadas ("")
                            valorAtual += '"'; i++; continue;
                        }
                        dentroDeAspas = !dentroDeAspas; // Inverte o estado de estar dentro de aspas
                    } else if (char === ',' && !dentroDeAspas) { // Vírgula fora de aspas é um separador
                        valores.push(valorAtual.trim()); valorAtual = '';
                    } else { valorAtual += char; } // Acumula o caractere
                }
                valores.push(valorAtual.trim()); // Adiciona o último valor
                const linhaObj: LinhaPlanilhaVendas = {};
                cabecalhos.forEach((cabecalho: string, index: number) => {
                    let valorFinal = valores[index] !== undefined ? valores[index] : '';
                    // Remove aspas das bordas apenas se o valor inteiro estava entre aspas (já tratado pelo loop)
                    // A lógica de remover aspas duplas escapadas já foi feita.
                    linhaObj[cabecalho] = valorFinal;
                });
                return linhaObj;
            });
        // console.log(`Vendas.ts (processarCSVVendas): CSV Processado. Cabeçalhos: [${cabecalhos.join(', ')}]. Linhas: ${linhasProcessadas.length}`);
        return { cabecalhos, linhas: linhasProcessadas };
    }

    function formatarMoedaVendas(valor: number | string): string {
        let numValor: number = typeof valor === 'string' ? parseFloat(valor.replace("R$", "").replace(/\./g, '').replace(',', '.').trim()) : Number(valor);
        if (isNaN(numValor)) return 'R$ 0,00'; // Retorna R$ 0,00 se não for um número válido
        return numValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function calcularKPIsEVisualizacoesVendas(dados: LinhaPlanilhaVendas[]): void {
        console.log("DEBUG VENDAS (TS calcularKPIs): INICIADO com dados.length:", dados.length);

        // Reseta KPIs
        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(0);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = '0';
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(0);

        // Destruir instância de gráfico de tendência antigo
        if (graficoTendenciaInstanceVendas) { graficoTendenciaInstanceVendas.destroy(); graficoTendenciaInstanceVendas = null; }

        const clearCanvasMessage = (canvas: HTMLCanvasElement | null) => { // Limpa mensagens de "sem dados" dos canvases
            if (canvas && canvas.parentElement) {
                canvas.parentElement.querySelectorAll('.chart-message').forEach(msg => msg.remove());
            }
        };
        clearCanvasMessage(ctxTendenciaCanvas);

        const createMessageForCanvas = (canvas: HTMLCanvasElement | null, text: string) => { // Cria mensagem "sem dados"
            if (canvas && canvas.parentElement && !canvas.parentElement.querySelector('.chart-message')) {
                const p = document.createElement('p'); p.textContent = text; p.className = 'chart-message';
                p.style.textAlign = 'center'; p.style.padding = '20px'; p.style.color = corTextoSecundarioDark;
                canvas.parentElement.appendChild(p);
            }
        };

        if (dados.length === 0) {
            console.log("DEBUG VENDAS (TS calcularKPIs): Sem dados para KPIs e gráficos.");
            createMessageForCanvas(ctxTendenciaCanvas, 'Sem dados para o gráfico de tendência.');
            return;
        }

        let totalVendasNumericoGlobal: number = 0;
        let unidadesSemana1 = 0, unidadesSemana2 = 0, unidadesSemana3 = 0, unidadesSemana4 = 0;

        const nomeColunaValorRealKPI = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === NOME_COLUNA_VALOR_VENDA.toLowerCase());

        const colS1Real = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === COL_S1.toLowerCase());
        const colS2Real = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === COL_S2.toLowerCase());
        const colS3Real = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === COL_S3.toLowerCase());
        const colS4Real = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === COL_S4.toLowerCase());

        if (!nomeColunaValorRealKPI) {
            console.error(`ERRO KPI: Coluna de valor ('${NOME_COLUNA_VALOR_VENDA}') NÃO encontrada no CSV. Cabeçalhos: [${colunasDefinidasCSVVendas.join(', ')}]`);
        }

        dados.forEach((item: LinhaPlanilhaVendas) => {
            if (nomeColunaValorRealKPI) {
                const valorVendaOriginal = String(item[nomeColunaValorRealKPI] || '0');
                const valorVendaStr = valorVendaOriginal.replace("R$", "").replace(/\./g, '').replace(',', '.').trim();
                const valorItemNumerico = parseFloat(valorVendaStr);
                if (!isNaN(valorItemNumerico)) {
                    totalVendasNumericoGlobal += valorItemNumerico;
                }
            }

            if (colS1Real) unidadesSemana1 += parseInt(String(item[colS1Real] || '0')) || 0;
            if (colS2Real) unidadesSemana2 += parseInt(String(item[colS2Real] || '0')) || 0;
            if (colS3Real) unidadesSemana3 += parseInt(String(item[colS3Real] || '0')) || 0;
            if (colS4Real) unidadesSemana4 += parseInt(String(item[colS4Real] || '0')) || 0;
        });

        const numTransacoes: number = dados.length; // Cada linha é uma transação/item agregado
        const ticketMedio: number = numTransacoes > 0 && totalVendasNumericoGlobal > 0 ? totalVendasNumericoGlobal / numTransacoes : 0;

        if (kpiTotalVendasEl) kpiTotalVendasEl.textContent = formatarMoedaVendas(totalVendasNumericoGlobal);
        if (kpiNumTransacoesEl) kpiNumTransacoesEl.textContent = numTransacoes.toString();
        if (kpiTicketMedioEl) kpiTicketMedioEl.textContent = formatarMoedaVendas(ticketMedio);

        // --- GRÁFICO DE TENDÊNCIA DE VENDAS SEMANAIS (UNIDADES) ---
        if (colS1Real && colS2Real && colS3Real && colS4Real && ctxTendenciaCanvas && typeof Chart !== 'undefined') {
            const labelsSemanas = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
            const dadosSemanas = [unidadesSemana1, unidadesSemana2, unidadesSemana3, unidadesSemana4];
            if (graficoTendenciaInstanceVendas) graficoTendenciaInstanceVendas.destroy(); // Garante que a instância anterior seja destruída
            graficoTendenciaInstanceVendas = new Chart(ctxTendenciaCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: labelsSemanas,
                    datasets: [{
                        label: 'Unidades Vendidas por Semana', data: dadosSemanas,
                        borderColor: corLinhaTendencia, backgroundColor: corAreaTendencia, tension: 0.3, fill: true,
                        pointBackgroundColor: corLinhaTendencia, pointBorderColor: corTextoPrincipalDark, // Cor do ponto e borda
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: corTextoSecundarioDark, callback: (v:any) => Number.isInteger(v)?v:null /* Mostra apenas inteiros */ }},
                        x: { ticks: { color: corTextoSecundarioDark }, grid: {display:false} }
                    },
                    plugins: {
                        legend: { display: true, position: 'bottom', labels: { color: corTextoSecundarioDark } },
                        tooltip: { callbacks: { label: (c: any) => `${c.dataset.label || 'Unidades'}: ${c.raw}` }}
                        // Datalabels (se registrado e desejado)
                        // datalabels: {
                        //     anchor: 'end',
                        //     align: 'top',
                        //     color: corTextoSecundarioDark,
                        //     formatter: (value: number) => value > 0 ? value.toString() : null,
                        // }
                    }
                 }
            });
            // console.log("DEBUG VENDAS (TS): Gráfico de tendência SEMANAL (unidades) renderizado.");
        } else {
            console.warn("VENDAS.TS: Não foi possível renderizar o gráfico de tendência semanal. Verifique se as colunas semanais existem no CSV e se o canvas 'grafico-tendencia-vendas' está no HTML.");
            createMessageForCanvas(ctxTendenciaCanvas, 'Dados semanais de unidades não encontrados no CSV.');
        }

        // Log informativo sobre a remoção da lógica do gráfico de categoria
        console.log("INFO VENDAS (TS): Lógica do gráfico de Vendas por Categoria foi removida, pois o elemento HTML correspondente não foi encontrado.");
    }

    function renderizarTabelaVendas(dadosParaRenderizar: LinhaPlanilhaVendas[]): void {
        if (!cabecalhoTabelaVendasEl) { console.error("Vendas.ts FATAL: Elemento <tr> cabeçalho (ID: cabecalho-tabela) NÃO ENCONTRADO!"); return; }
        if (!corpoTabelaVendas) { console.error("Vendas.ts FATAL: Elemento <tbody> (ID: corpo-tabela-vendas) NÃO ENCONTRADO!"); return; }
        cabecalhoTabelaVendasEl.innerHTML = ''; corpoTabelaVendas.innerHTML = ''; // Limpa tabela

        if (colunasDefinidasCSVVendas.length > 0) {
            colunasDefinidasCSVVendas.forEach(textoCabecalho => {
                const th = document.createElement('th'); th.textContent = textoCabecalho;
                const thLower = textoCabecalho.toLowerCase();
                // Adiciona classe para alinhamento numérico
                if (thLower.includes('valor') || thLower.includes('preço') || thLower.includes('total') ||
                    thLower.includes('semana') || thLower.includes('unidades') ||
                    thLower.includes('qtd') || thLower.includes('quantidade') || thLower.includes('número') || thLower.includes('id')) {
                    th.classList.add('coluna-numero');
                }
                cabecalhoTabelaVendasEl.appendChild(th);
            });
        } else if (dadosParaRenderizar.length > 0) { // Fallback se colunasDefinidasCSVVendas estiver vazio mas houver dados
            Object.keys(dadosParaRenderizar[0]).forEach(key => {
                const th = document.createElement('th'); th.textContent = key; cabecalhoTabelaVendasEl.appendChild(th);
            });
        }

        if (dadosParaRenderizar.length === 0) {
            const numColunas = Math.max(colunasDefinidasCSVVendas.length, 1); // Evita colspan="0"
            const mensagem = filtroGeralInputVendas?.value.trim() !== ''
                ? 'Nenhuma venda encontrada para o filtro aplicado.'
                : 'Nenhum dado de vendas para exibir.';
            corpoTabelaVendas.innerHTML = `<tr><td colspan="${numColunas}" style="text-align:center; padding: 20px; color: ${corTextoSecundarioDark};">${mensagem}</td></tr>`;
            return;
        }

        dadosParaRenderizar.forEach((linhaObj: LinhaPlanilhaVendas) => {
            const tr = corpoTabelaVendas.insertRow();
            (colunasDefinidasCSVVendas.length > 0 ? colunasDefinidasCSVVendas : Object.keys(linhaObj)).forEach(cabecalho => {
                const td = tr.insertCell();
                let valor: string = String(linhaObj[cabecalho] !== undefined ? linhaObj[cabecalho] : '');
                const cabecalhoLower = cabecalho.toLowerCase();
                const nomeColunaValorRealCSV = colunasDefinidasCSVVendas.find(c => c.toLowerCase() === NOME_COLUNA_VALOR_VENDA.toLowerCase());

                // Formata como moeda ou alinha como número
                if ((nomeColunaValorRealCSV && cabecalho.toLowerCase() === nomeColunaValorRealCSV.toLowerCase()) ||
                    cabecalhoLower.includes('preço') || cabecalhoLower.includes('valor total')) {
                    td.textContent = formatarMoedaVendas(valor); td.classList.add('coluna-numero');
                } else if (cabecalhoLower.includes('semana') || cabecalhoLower.includes('unidades') ||
                           cabecalhoLower.includes('qtd') || cabecalhoLower.includes('id')) { // Adicionar mais termos numéricos se necessário
                     td.textContent = valor; td.classList.add('coluna-numero');
                } else {
                     td.textContent = valor;
                }
            });
        });
    }

    function filtrarLinhaVendas(linha: LinhaPlanilhaVendas, termoBusca: string): boolean {
        if (!termoBusca) return true; // Se não há termo de busca, todas as linhas passam
        const termoLower = termoBusca.toLowerCase();
        // Busca em todas as colunas definidas (ou todas as chaves do objeto se colunas não definidas)
        const colunasParaBusca = colunasDefinidasCSVVendas.length > 0 ? colunasDefinidasCSVVendas : Object.keys(linha);
        return colunasParaBusca.some(cabecalho => String(linha[cabecalho]).toLowerCase().includes(termoLower));
    }

    async function carregarDadosVendas(): Promise<void> {
        if (loadingMessageDivVendas) mostrarGlobalMessageVendas(loadingMessageDivVendas, 'Carregando dados...', true);
        if (errorMessageDivVendas) errorMessageDivVendas.style.display = 'none';
        if (noDataMessageDivVendas) noDataMessageDivVendas.style.display = 'none';

        // Limpa cabeçalho e corpo da tabela enquanto carrega
        if (cabecalhoTabelaVendasEl) cabecalhoTabelaVendasEl.innerHTML = '';
        if (corpoTabelaVendas) {
             const numCols = Math.max(colunasDefinidasCSVVendas.length, 1); // Pega o número de colunas já definidas ou 1
             corpoTabelaVendas.innerHTML = `<tr><td colspan="${numCols}" style="text-align:center; padding:20px; color:${corTextoSecundarioDark};">Carregando dados...</td></tr>`;
        }

        if (!URL_PLANILHA_CSV_VENDAS || URL_PLANILHA_CSV_VENDAS.length < 50) { // Validação básica da URL
             mostrarGlobalMessageVendas(errorMessageDivVendas, 'Erro: URL da planilha CSV inválida ou não configurada.');
             renderizarTabelaVendas([]); // Limpa tabela com mensagem de "sem dados"
             calcularKPIsEVisualizacoesVendas([]); // Limpa KPIs e gráficos
             return;
        }
        try {
            const resposta = await fetch(URL_PLANILHA_CSV_VENDAS, { cache: 'no-store' }); // no-store para sempre pegar a mais recente
            if (!resposta.ok) throw new Error(`Falha ao buscar CSV da planilha (${resposta.status} ${resposta.statusText}).`);
            const textoCsv = await resposta.text();
            if (!textoCsv || textoCsv.trim() === '') throw new Error('Arquivo CSV da planilha está vazio ou inválido.');

            const { linhas } = processarCSVVendas(textoCsv); // colunasDefinidasCSVVendas é setada dentro de processarCSVVendas

            dadosCompletosVendas = linhas;
            // console.log(`DEBUG VENDAS (TS carregarDadosVendas): CSV Processado. ${linhas.length} linhas.`);
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none'; // Esconde mensagem de carregando

            if (typeof handlePageLoadAndNavigationVendas === "function") {
                handlePageLoadAndNavigationVendas(); // Chama para exibir a seção correta e seus dados
            } else { // Fallback caso a função de navegação não esteja pronta/definida
                console.error("ERRO FATAL: handlePageLoadAndNavigationVendas não está definida ao final de carregarDadosVendas!");
                // Tenta renderizar o dashboard principal como fallback
                const dashboardSectionEl = document.getElementById('secao-dashboard');
                if (dashboardSectionEl) {
                    dashboardSectionEl.style.display = 'block'; dashboardSectionEl.classList.add('active-section');
                    if (tituloSecaoHeaderVendas) tituloSecaoHeaderVendas.textContent = 'Visão Geral das Vendas';
                    if (dadosCompletosVendas.length > 0) {
                        calcularKPIsEVisualizacoesVendas(dadosCompletosVendas);
                        renderizarTabelaVendas(dadosCompletosVendas);
                    } else {
                        renderizarTabelaVendas([]);
                        calcularKPIsEVisualizacoesVendas([]);
                        if(noDataMessageDivVendas) mostrarGlobalMessageVendas(noDataMessageDivVendas, 'Nenhum dado de vendas para exibir.');
                    }
                }
            }
        } catch (erro: any) {
            console.error("ERRO VENDAS (TS carregarDadosVendas):", erro);
            if (loadingMessageDivVendas) loadingMessageDivVendas.style.display = 'none';
            mostrarGlobalMessageVendas(errorMessageDivVendas, `Erro ao carregar dados: ${(erro instanceof Error ? erro.message : 'Erro desconhecido.')}`);
            renderizarTabelaVendas([]); // Limpa tabela
            calcularKPIsEVisualizacoesVendas([]); // Limpa KPIs e gráficos
        }
    }

    if (filtroGeralInputVendas) {
        filtroGeralInputVendas.addEventListener('input', () => {
            const termoBusca = filtroGeralInputVendas.value.trim().toLowerCase(); // Já converte para lowerCase aqui
            const dashboardSection = document.getElementById('secao-dashboard');
            // Só filtra e renderiza se a seção do dashboard estiver ativa
            if (dashboardSection?.style.display === 'block' || dashboardSection?.classList.contains('active-section')) {
                const dadosFiltrados = dadosCompletosVendas.filter(linha => filtrarLinhaVendas(linha, termoBusca));
                renderizarTabelaVendas(dadosFiltrados);
            }
         });
    }
    carregarDadosVendas();
    // console.log("DEBUG VENDAS (TS): Event listeners e carregamento inicial configurados.");
});