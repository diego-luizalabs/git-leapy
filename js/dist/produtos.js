"use strict";
let dadosCompletosProdutos = [
    { id: "XG001", nome: "Vestido Floral Verão Elegante", categoria: "Vestidos", preco: 189.90, estoque: 25, descricao: "Lindo vestido floral para o verão, super confortável." },
    { id: "XG002", nome: "Calça Jeans Slim Fit Premium", categoria: "Calças", preco: 229.90, estoque: 40, descricao: "Calça jeans com corte moderno e tecido de alta qualidade." },
    { id: "XG003", nome: "Blusa de Seda Pura Toque Suave", categoria: "Blusas", preco: 159.00, estoque: 8, descricao: "Blusa elegante de seda, perfeita para ocasiões especiais." },
    { id: "XG004", nome: "Camiseta Básica Algodão Pima", categoria: "Blusas", preco: 89.90, estoque: 150, descricao: "Camiseta essencial para o dia a dia, conforto máximo." },
    { id: "XG005", nome: "Saia Midi Plissada Estampada", categoria: "Saias", preco: 179.50, estoque: 0, descricao: "Saia midi versátil e cheia de estilo." },
    { id: "XG006", nome: "Bolsa Transversal Couro Legítimo", categoria: "Acessorios", preco: 349.00, estoque: 12, descricao: "Bolsa prática e elegante para todas as horas." },
    { id: "XG007", nome: "Tênis Esportivo Performance Max", categoria: "Calcados", preco: 499.90, estoque: 30, descricao: "Tênis ideal para suas atividades físicas com máximo conforto." },
    { id: "XG008", nome: "Jaqueta Corta-Vento Impermeável", categoria: "Casacos", preco: 299.00, estoque: 5, descricao: "Jaqueta leve e resistente à água." },
];
let todosOsProdutosParaFiltragem = [...dadosCompletosProdutos];
document.addEventListener('DOMContentLoaded', () => {
    console.log("PRODUTOS.TS: DOMContentLoaded INICIADO.");
    if (sessionStorage.getItem('isXuxuGlowAdminLoggedIn') !== 'true') {
        console.warn("PRODUTOS.TS: Utilizador não logado. Redirecionando para login.");
        window.location.href = 'index.html';
        return;
    }
    console.log("PRODUTOS.TS: Utilizador logado.");
    const produtosGridContainer = document.getElementById('produtos-grid-container');
    const filtroBuscaProdutoInput = document.getElementById('filtro-busca-produto');
    const filtroCategoriaSelect = document.getElementById('filtro-categoria-produto');
    const filtroEstoqueSelect = document.getElementById('filtro-estoque-produto');
    const ordenarProdutosSelect = document.getElementById('ordenar-produtos');
    const noProductsMessageDiv = document.getElementById('no-products-message');
    const loadingProdutosMessageDiv = document.getElementById('loading-produtos-message');
    const modalProduto = document.getElementById('modal-produto');
    const modalTituloProduto = document.getElementById('modal-titulo-produto');
    const formProduto = document.getElementById('form-produto');
    const btnAbrirModalProduto = document.getElementById('btn-abrir-modal-produto');
    const btnCloseModalProduto = modalProduto === null || modalProduto === void 0 ? void 0 : modalProduto.querySelector('.modal-close-btn');
    const btnCancelarModalProduto = document.getElementById('btn-cancelar-modal-produto');
    const produtoIdModalInput = document.getElementById('produto-id-modal');
    const produtoNomeModalInput = document.getElementById('produto-nome-modal');
    const produtoCategoriaModalSelect = document.getElementById('produto-categoria-modal');
    const produtoPrecoModalInput = document.getElementById('produto-preco-modal');
    const produtoEstoqueModalInput = document.getElementById('produto-estoque-modal');
    const produtoDescricaoModalTextarea = document.getElementById('produto-descricao-modal');
    const sidebar = document.querySelector('.dashboard-sidebar');
    const menuToggleBtn = document.querySelector('.menu-toggle-btn');
    const pageBody = document.body;
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const tituloSecaoElement = document.getElementById('main-section-title');
    const allInternalContentSections = document.querySelectorAll('.content-section');
    if (sidebar && menuToggleBtn) {
        menuToggleBtn.addEventListener('click', () => {
            const isVisible = sidebar.classList.toggle('sidebar-visible');
            pageBody.classList.toggle('sidebar-overlay-active', isVisible);
            menuToggleBtn.setAttribute('aria-expanded', isVisible.toString());
        });
        pageBody.addEventListener('click', (event) => {
            if (pageBody.classList.contains('sidebar-overlay-active') && sidebar.classList.contains('sidebar-visible')) {
                const target = event.target;
                if (!sidebar.contains(target) && !menuToggleBtn.contains(target)) {
                    sidebar.classList.remove('sidebar-visible');
                    pageBody.classList.remove('sidebar-overlay-active');
                    menuToggleBtn.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }
    function updateActiveLinkAndTitleProdutos(activeLink) {
        const titleToUse = (activeLink === null || activeLink === void 0 ? void 0 : activeLink.dataset.title) || "Gerenciamento de Produtos";
        console.log(`DEBUG PRODUTOS.TS (UpdateLink): Link: ${activeLink === null || activeLink === void 0 ? void 0 : activeLink.href}, Título: "${titleToUse}"`);
        navLinks.forEach(navLink => navLink.classList.remove('active'));
        if (activeLink) {
            activeLink.classList.add('active');
            if (tituloSecaoElement) {
                tituloSecaoElement.textContent = titleToUse;
            }
        }
    }
    function displayInternalSectionProdutos(sectionIdToShow, clickedLink) {
        console.log(`DEBUG PRODUTOS.TS (DisplayInternal): Tentando exibir seção interna: ${sectionIdToShow}`);
        let sectionFound = false;
        allInternalContentSections.forEach(section => {
            if (section.id === sectionIdToShow) {
                section.style.display = 'block';
                section.classList.add('active');
                sectionFound = true;
                console.log(`DEBUG PRODUTOS.TS (DisplayInternal): Exibida ${section.id}`);
                if (section.id === 'produtos-content') {
                    if (loadingProdutosMessageDiv && produtosGridContainer) {
                        loadingProdutosMessageDiv.style.display = 'flex';
                        produtosGridContainer.style.display = 'none';
                        setTimeout(() => {
                            if (loadingProdutosMessageDiv)
                                loadingProdutosMessageDiv.style.display = 'none';
                            renderizarGridProdutos(todosOsProdutosParaFiltragem);
                            if (produtosGridContainer)
                                produtosGridContainer.style.display = 'block';
                        }, 50);
                    }
                    else {
                        renderizarGridProdutos(todosOsProdutosParaFiltragem);
                    }
                }
                else if (section.id === 'dash-interno-content') {
                    console.log("PRODUTOS.TS (DisplayInternal): Mostrando #dash-interno-content.");
                    const dashInternoMain = document.getElementById('secao-dash-interno-principal');
                    if (dashInternoMain) {
                        dashInternoMain.innerHTML = `<h3>Painel Interno (Produtos)</h3> <p>Conteúdo do painel interno da página de produtos.</p>`;
                    }
                }
            }
            else {
                section.style.display = 'none';
                section.classList.remove('active');
            }
        });
        updateActiveLinkAndTitleProdutos(clickedLink);
        if (!sectionFound && sectionIdToShow) {
            console.warn(`DEBUG PRODUTOS.TS (DisplayInternal): Seção interna ${sectionIdToShow} não encontrada. Default para produtos-content.`);
            const produtosContentDiv = document.getElementById('produtos-content');
            if (produtosContentDiv) {
                allInternalContentSections.forEach(s => s.style.display = s.id === 'produtos-content' ? 'block' : 'none');
                if (produtosContentDiv)
                    produtosContentDiv.classList.add('active');
                updateActiveLinkAndTitleProdutos(document.querySelector('.sidebar-nav a[data-target-section="produtos-content"], .sidebar-nav a[href="#produtos"]'));
            }
        }
    }
    console.log("PRODUTOS.TS: Configurando listeners de navegação. Links encontrados:", navLinks.length);
    navLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            var _a;
            const currentAnchor = this;
            const href = currentAnchor.getAttribute('href');
            const externalPageTarget = currentAnchor.dataset.externalPage;
            const internalSectionTarget = currentAnchor.dataset.targetSection;
            console.log(`DEBUG PRODUTOS.TS (Nav Main): Link clicado! HREF: '${href}', Data-External: '${externalPageTarget}', Data-Internal: '${internalSectionTarget}'`);
            if (externalPageTarget) {
                console.log(`DEBUG PRODUTOS.TS (Nav Main): ***DECISÃO: Navegando para data-external-page: '${externalPageTarget}'.***`);
                event.preventDefault();
                window.location.href = externalPageTarget;
                return;
            }
            if (href && (href.includes('.html') || href.startsWith('http:') || href.startsWith('https:') || href.startsWith('//'))) {
                let targetUrl, currentPageUrl;
                try {
                    targetUrl = new URL(href, window.location.origin);
                    currentPageUrl = new URL(window.location.href);
                    console.log(`DEBUG PRODUTOS.TS (Nav Main) - Checando href para .html: Path atual: ${currentPageUrl.pathname}, Path alvo: ${targetUrl.pathname}`);
                    if (targetUrl.pathname !== currentPageUrl.pathname && href.includes('.html')) {
                        console.log(`DEBUG PRODUTOS.TS (Nav Main): ***DECISÃO: Permitindo navegação padrão para OUTRA página HTML via href (${href}).***`);
                        return;
                    }
                    if (href.startsWith('http:') || href.startsWith('https:') || href.startsWith('//')) {
                        console.log(`DEBUG PRODUTOS.TS (Nav Main): ***DECISÃO: Permitindo navegação padrão para URL externa via href (${href}).***`);
                        return;
                    }
                }
                catch (e) {
                    console.error(`DEBUG PRODUTOS.TS (Nav Main): Erro ao parsear URL para href '${href}'.`, e);
                    if (!href.startsWith('#')) {
                        event.preventDefault();
                        return;
                    }
                }
            }
            console.log(`DEBUG PRODUTOS.TS (Nav Main): ***DECISÃO: Prevenindo Navegação Padrão*** e tratando como SPA interna para HREF: '${href}', Data-Internal: '${internalSectionTarget}'.`);
            event.preventDefault();
            let sectionIdToShow = null;
            if (internalSectionTarget) {
                sectionIdToShow = internalSectionTarget;
            }
            else if (href && href.startsWith('#') && href.length > 1) {
                const hashValue = href.substring(1);
                sectionIdToShow = ((_a = document.getElementById(hashValue)) === null || _a === void 0 ? void 0 : _a.classList.contains('content-section')) ? hashValue : hashValue + "-content";
            }
            if (sectionIdToShow) {
                console.log(`DEBUG PRODUTOS.TS (Nav Main): SPA targetSectionId: '${sectionIdToShow}'`);
                displayInternalSectionProdutos(sectionIdToShow, currentAnchor);
                if (href && href.startsWith('#') && window.location.hash !== href) {
                    history.pushState({ section: sectionIdToShow }, "", href);
                }
            }
            else {
                console.warn(`DEBUG PRODUTOS.TS (Nav Main): SPA Link (${href}) sem um alvo interno claro. Verifique href, data-target-section, e IDs.`);
                updateActiveLinkAndTitleProdutos(currentAnchor);
            }
            if (sidebar && sidebar.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtn) {
                sidebar.classList.remove('sidebar-visible');
                pageBody.classList.remove('sidebar-overlay-active');
                menuToggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    });
    function handleProductPageLoad() {
        var _a;
        console.log("DEBUG PRODUTOS.TS (handlePageLoad): INICIADO. Hash:", location.hash);
        let initialSectionId = "produtos-content";
        let initialLink = document.querySelector(`.sidebar-nav a[data-target-section="produtos-content"], .sidebar-nav a[href="#produtos"]`);
        if (window.location.hash && window.location.hash !== "#") {
            const hashValue = window.location.hash.substring(1);
            const linkForHash = document.querySelector(`.sidebar-nav a[href="${window.location.hash}"]`);
            let potentialSectionIdFromHash = linkForHash === null || linkForHash === void 0 ? void 0 : linkForHash.dataset.targetSection;
            if (!potentialSectionIdFromHash) {
                potentialSectionIdFromHash = ((_a = document.getElementById(hashValue)) === null || _a === void 0 ? void 0 : _a.classList.contains('content-section'))
                    ? hashValue
                    : hashValue + "-content";
            }
            const sectionElement = document.getElementById(potentialSectionIdFromHash);
            if (sectionElement && sectionElement.classList.contains('content-section')) {
                initialSectionId = potentialSectionIdFromHash;
                initialLink = linkForHash || document.querySelector(`.sidebar-nav a[data-target-section="${initialSectionId}"]`);
                console.log(`DEBUG PRODUTOS.TS (handlePageLoad): Carregando seção interna pelo hash: ${initialSectionId}`);
            }
            else {
                console.log(`DEBUG PRODUTOS.TS (handlePageLoad): Hash '${window.location.hash}' não corresponde a uma seção interna 'content-section' válida. Carregando default (${initialSectionId}).`);
            }
        }
        console.log(`DEBUG PRODUTOS.TS (handlePageLoad): Seção inicial a ser exibida: ${initialSectionId}`);
        if (!initialLink && initialSectionId === "produtos-content") {
            initialLink = document.querySelector('.sidebar-nav a[href="#produtos"], .sidebar-nav a[data-target-section="produtos-content"]');
        }
        displayInternalSectionProdutos(initialSectionId, initialLink);
    }
    // --- Suas funções de produto (COPIADAS DO SEU ARQUIVO DAS 08:03) ---
    function getIconeParaCategoria(categoria) {
        const catLower = categoria.toLowerCase();
        if (catLower.includes('vestido'))
            return `<svg class="icone-produto categoria-vestido" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.36,8.89,18.7,7.48,19.05,5.2H4.95L5.3,7.48,3.64,8.89C3.25,9.21,3,9.67,3,10.17V20a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1V10.17C21,9.67,20.75,9.21,20.36,8.89ZM8,18H6V13a2,2,0,0,1,4,0v5H8Zm4,0H10V11h4v7Zm4,0H16V13a2,2,0,0,1,4,0v5h-2ZM6.95,3.05,12,6.1,17.05,3.05A1,1,0,0,0,16.32,2H7.68A1,1,0,0,0,6.95,3.05Z"/></svg>`;
        if (catLower.includes('calça') || catLower.includes('calcas'))
            return `<svg class="icone-produto categoria-calca" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16,2H8A2,2,0,0,0,6,4V20a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V4A2,2,0,0,0,16,2ZM8,4h8V7H14.76L12,9.06,9.24,7H8Zm8,16H8V14.15L12,16.6l4-2.45Zm0-7.85L12,13.4l-4-2.45V8h1.6L12,9.94,14.4,8H16Z"/></svg>`;
        if (catLower.includes('blusa') || catLower.includes('camiseta'))
            return `<svg class="icone-produto categoria-blusa" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.36,8.89,18.7,7.48,19.05,5.2H4.95L5.3,7.48,3.64,8.89A2,2,0,0,0,3,10.17V20a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1V10.17A2,2,0,0,0,20.36,8.89ZM12,19a2,2,0,0,1-2-2,1,1,0,0,0-2,0,4,4,0,0,0,8,0,1,1,0,0,0-2,0A2,2,0,0,1,12,19ZM15,14H9a1,1,0,0,1,0-2h6a1,1,0,0,1,0,2Z"/></svg>`;
        if (catLower.includes('acessorio') || catLower.includes('acessorios') || catLower.includes('bolsa'))
            return `<svg class="icone-produto categoria-acessorio" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19,6H17A5,5,0,0,0,7,6H5A2,2,0,0,0,3,8V19a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2V8A2,2,0,0,0,19,6ZM9,6a3,3,0,0,1,6,0H9Zm10,13H5V8H7V9A1,1,0,0,0,8,10h8a1,1,0,0,0,1-1V8h2Z"/></svg>`;
        if (catLower.includes('saia'))
            return `<svg class="icone-produto categoria-saia" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12,2C8.69,2,6,4.69,6,8v1H18V8C18,4.69,15.31,2,12,2ZM6,10v10a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V10H6Z"/></svg>`;
        if (catLower.includes('calcado') || catLower.includes('calcados') || catLower.includes('tênis'))
            return `<svg class="icone-produto categoria-calcado" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.8,6.93l-2.2-2.2a2.2,2.2,0,0,0-3.11,0L4.36,15.84A1,1,0,0,0,4,16.55V20a1,1,0,0,0,1,1H8.45a1,1,0,0,0,.71-.29l11.09-11.1A2.2,2.2,0,0,0,20.8,6.93ZM7.74,19H6V17.26l8.48-8.49,1.74,1.74Zm8.17-9.9-1.73-1.73L15.5,6,18,8.5Z"/></svg>`;
        return `<svg class="icone-produto categoria-default" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12,2A10,10,0,0,0,2,12A10,10,0,0,0,12,22A10,10,0,0,0,22,12A10,10,0,0,0,12,2M8,17.5A1.5,1.5,0,1,1,9.5,16A1.5,1.5,0,0,1,8,17.5m0-5A1.5,1.5,0,1,1,9.5,11A1.5,1.5,0,0,1,8,12.5m0-5A1.5,1.5,0,1,1,9.5,6A1.5,1.5,0,0,1,8,7.5m8,10A1.5,1.5,0,1,1,17.5,16A1.5,1.5,0,0,1,16,17.5m0-5A1.5,1.5,0,1,1,17.5,11A1.5,1.5,0,0,1,16,12.5m0-5A1.5,1.5,0,1,1,17.5,6A1.5,1.5,0,0,1,16,7.5Z"/></svg>`;
    }
    function renderizarGridProdutos(produtos) {
        if (!produtosGridContainer) {
            console.error("PRODUTOS.TS: produtosGridContainer é null em renderizarGridProdutos");
            return;
        }
        produtosGridContainer.innerHTML = '';
        if (produtos.length === 0) {
            if (noProductsMessageDiv)
                noProductsMessageDiv.style.display = 'flex';
            return;
        }
        if (noProductsMessageDiv)
            noProductsMessageDiv.style.display = 'none';
        produtos.forEach((produto, index) => {
            var _a, _b;
            const card = document.createElement('article');
            card.classList.add('produto-card');
            card.dataset.categoria = produto.categoria;
            card.style.animationDelay = `${index * 0.05}s`;
            let estoqueStatus = 'em-estoque';
            if (produto.estoque === 0)
                estoqueStatus = 'esgotado';
            else if (produto.estoque < 10)
                estoqueStatus = 'baixo-estoque';
            card.innerHTML = `
                <div class="produto-card-icone-wrapper">${getIconeParaCategoria(produto.categoria)}</div>
                <div class="produto-card-info">
                    <h4 class="produto-nome">${produto.nome}</h4>
                    <p class="produto-categoria">${produto.categoria}</p>
                    <p class="produto-id">ID: ${produto.id}</p>
                    <p class="produto-preco">R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
                    <p class="produto-estoque">Estoque: <span class="estoque-valor ${estoqueStatus}">${produto.estoque}</span></p>
                </div>
                <div class="produto-card-acoes">
                    <button class="btn btn-acao-editar" title="Editar Produto" data-id-produto="${produto.id}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg></button> 
                    <button class="btn btn-acao-excluir" title="Excluir Produto" data-id-produto="${produto.id}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg></button>
                </div>`;
            produtosGridContainer.appendChild(card);
            (_a = card.querySelector('.btn-acao-editar')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => abrirModalParaEdicao(produto.id));
            (_b = card.querySelector('.btn-acao-excluir')) === null || _b === void 0 ? void 0 : _b.addEventListener('click', () => excluirProduto(produto.id));
        });
    }
    function aplicarFiltrosEOrdenar() {
        let produtosFiltrados = [...dadosCompletosProdutos];
        const termoBusca = (filtroBuscaProdutoInput === null || filtroBuscaProdutoInput === void 0 ? void 0 : filtroBuscaProdutoInput.value.toLowerCase()) || '';
        const categoriaSelecionada = (filtroCategoriaSelect === null || filtroCategoriaSelect === void 0 ? void 0 : filtroCategoriaSelect.value) || '';
        const estoqueSelecionado = (filtroEstoqueSelect === null || filtroEstoqueSelect === void 0 ? void 0 : filtroEstoqueSelect.value) || '';
        const ordenacaoSelecionada = (ordenarProdutosSelect === null || ordenarProdutosSelect === void 0 ? void 0 : ordenarProdutosSelect.value) || 'nome-asc';
        if (termoBusca)
            produtosFiltrados = produtosFiltrados.filter(p => p.nome.toLowerCase().includes(termoBusca) || p.id.toLowerCase().includes(termoBusca));
        if (categoriaSelecionada)
            produtosFiltrados = produtosFiltrados.filter(p => p.categoria === categoriaSelecionada);
        if (estoqueSelecionado) {
            produtosFiltrados = produtosFiltrados.filter(p => {
                if (estoqueSelecionado === 'em-estoque')
                    return p.estoque >= 10;
                if (estoqueSelecionado === 'baixo-estoque')
                    return p.estoque > 0 && p.estoque < 10;
                if (estoqueSelecionado === 'esgotado')
                    return p.estoque === 0;
                return true;
            });
        }
        switch (ordenacaoSelecionada) {
            case 'nome-asc':
                produtosFiltrados.sort((a, b) => a.nome.localeCompare(b.nome));
                break;
            case 'nome-desc':
                produtosFiltrados.sort((a, b) => b.nome.localeCompare(a.nome));
                break;
            case 'preco-asc':
                produtosFiltrados.sort((a, b) => a.preco - b.preco);
                break;
            case 'preco-desc':
                produtosFiltrados.sort((a, b) => b.preco - a.preco);
                break;
            case 'estoque-asc':
                produtosFiltrados.sort((a, b) => a.estoque - b.estoque);
                break;
            case 'estoque-desc':
                produtosFiltrados.sort((a, b) => b.estoque - a.estoque);
                break;
            case 'id-asc':
                produtosFiltrados.sort((a, b) => a.id.localeCompare(b.id));
                break;
        }
        todosOsProdutosParaFiltragem = produtosFiltrados;
        renderizarGridProdutos(todosOsProdutosParaFiltragem);
    }
    filtroBuscaProdutoInput === null || filtroBuscaProdutoInput === void 0 ? void 0 : filtroBuscaProdutoInput.addEventListener('input', aplicarFiltrosEOrdenar);
    filtroCategoriaSelect === null || filtroCategoriaSelect === void 0 ? void 0 : filtroCategoriaSelect.addEventListener('change', aplicarFiltrosEOrdenar);
    filtroEstoqueSelect === null || filtroEstoqueSelect === void 0 ? void 0 : filtroEstoqueSelect.addEventListener('change', aplicarFiltrosEOrdenar);
    ordenarProdutosSelect === null || ordenarProdutosSelect === void 0 ? void 0 : ordenarProdutosSelect.addEventListener('change', aplicarFiltrosEOrdenar);
    function preencherFormularioModal(produto) {
        if (!formProduto || !produtoIdModalInput || !produtoNomeModalInput || !produtoCategoriaModalSelect || !produtoPrecoModalInput || !produtoEstoqueModalInput || !produtoDescricaoModalTextarea || !modalTituloProduto) {
            console.error("PRODUTOS.TS: Elementos do formulário do modal não encontrados.");
            return;
        }
        if (produto) {
            modalTituloProduto.textContent = `Editar Produto: ${produto.nome}`;
            produtoIdModalInput.value = produto.id;
            produtoNomeModalInput.value = produto.nome;
            produtoCategoriaModalSelect.value = produto.categoria;
            produtoPrecoModalInput.value = produto.preco.toString();
            produtoEstoqueModalInput.value = produto.estoque.toString();
            produtoDescricaoModalTextarea.value = produto.descricao || '';
        }
        else {
            modalTituloProduto.textContent = 'Adicionar Novo Produto';
            formProduto.reset();
            produtoIdModalInput.value = `XG${Math.floor(Math.random() * 8999) + 1000}`;
        }
    }
    function abrirModalParaEdicao(produtoId) {
        const produtoParaEditar = dadosCompletosProdutos.find(p => p.id === produtoId);
        if (produtoParaEditar) {
            preencherFormularioModal(produtoParaEditar);
            if (modalProduto)
                modalProduto.classList.add('modal-visible');
        }
        else {
            console.error(`PRODUTOS.TS: Produto com ID ${produtoId} não encontrado para edição.`);
        }
    }
    function abrirModalParaAdicionar() {
        preencherFormularioModal();
        if (modalProduto)
            modalProduto.classList.add('modal-visible');
    }
    function fecharModalProduto() {
        if (modalProduto)
            modalProduto.classList.remove('modal-visible');
    }
    if (btnAbrirModalProduto)
        btnAbrirModalProduto.addEventListener('click', abrirModalParaAdicionar);
    if (btnCloseModalProduto)
        btnCloseModalProduto.addEventListener('click', fecharModalProduto);
    if (btnCancelarModalProduto)
        btnCancelarModalProduto.addEventListener('click', fecharModalProduto);
    modalProduto === null || modalProduto === void 0 ? void 0 : modalProduto.addEventListener('click', (event) => { if (event.target === modalProduto)
        fecharModalProduto(); });
    formProduto === null || formProduto === void 0 ? void 0 : formProduto.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!produtoNomeModalInput || !produtoCategoriaModalSelect || !produtoPrecoModalInput || !produtoEstoqueModalInput || !produtoIdModalInput || !produtoDescricaoModalTextarea) {
            console.error("PRODUTOS.TS: Erro ao salvar: Campos do formulário do modal não encontrados.");
            return;
        }
        const idProduto = produtoIdModalInput.value;
        const precoValor = produtoPrecoModalInput.value.replace(',', '.');
        const novoProduto = {
            id: idProduto,
            nome: produtoNomeModalInput.value,
            categoria: produtoCategoriaModalSelect.value,
            preco: parseFloat(precoValor),
            estoque: parseInt(produtoEstoqueModalInput.value),
            descricao: produtoDescricaoModalTextarea.value
        };
        const indiceProdutoOriginal = dadosCompletosProdutos.findIndex(p => p.id === idProduto);
        if (indiceProdutoOriginal > -1) {
            dadosCompletosProdutos[indiceProdutoOriginal] = novoProduto;
        }
        else {
            dadosCompletosProdutos.unshift(novoProduto);
        }
        todosOsProdutosParaFiltragem = [...dadosCompletosProdutos];
        aplicarFiltrosEOrdenar();
        fecharModalProduto();
    });
    function excluirProduto(produtoId) {
        if (confirm(`Tem certeza que deseja excluir o produto com ID ${produtoId}?`)) {
            dadosCompletosProdutos = dadosCompletosProdutos.filter(p => p.id !== produtoId);
            todosOsProdutosParaFiltragem = [...dadosCompletosProdutos];
            aplicarFiltrosEOrdenar();
        }
    }
    handleProductPageLoad();
});
//# sourceMappingURL=produtos.js.map