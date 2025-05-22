interface Produto {
    id: string;
    nome: string;
    categoria: string;
    preco: number;
    estoque: number;
    descricao?: string;
}

let dadosCompletosProdutos: Produto[] = [
    { id: "XG001", nome: "Vestido Floral Verão Elegante", categoria: "Vestidos", preco: 189.90, estoque: 25, descricao: "Lindo vestido floral para o verão, super confortável." },
    { id: "XG002", nome: "Calça Jeans Slim Fit Premium", categoria: "Calças", preco: 229.90, estoque: 40, descricao: "Calça jeans com corte moderno e tecido de alta qualidade." },
    { id: "XG003", nome: "Blusa de Seda Pura Toque Suave", categoria: "Blusas", preco: 159.00, estoque: 8, descricao: "Blusa elegante de seda, perfeita para ocasiões especiais." },
    { id: "XG004", nome: "Camiseta Básica Algodão Pima", categoria: "Blusas", preco: 89.90, estoque: 150, descricao: "Camiseta essencial para o dia a dia, conforto máximo." },
    { id: "XG005", nome: "Saia Midi Plissada Estampada", categoria: "Saias", preco: 179.50, estoque: 0, descricao: "Saia midi versátil e cheia de estilo." },
    { id: "XG006", nome: "Bolsa Transversal Couro Legítimo", categoria: "Acessorios", preco: 349.00, estoque: 12, descricao: "Bolsa prática e elegante para todas as horas." },
    { id: "XG007", nome: "Tênis Esportivo Performance Max", categoria: "Calcados", preco: 499.90, estoque: 30, descricao: "Tênis ideal para suas atividades físicas com máximo conforto." },
    { id: "XG008", nome: "Jaqueta Corta-Vento Impermeável", categoria: "Casacos", preco: 299.00, estoque: 5, descricao: "Jaqueta leve e resistente à água." },
];

let todosOsProdutosParaFiltragem: Produto[] = [...dadosCompletosProdutos];

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Produtos: Completamente carregado e analisado.");

    if (sessionStorage.getItem('isXuxuGlowAdminLoggedIn') !== 'true') {
        console.warn("DOM Produtos: Utilizador não logado. Redirecionando para a página de login.");
        window.location.href = 'index.html'; // Assumindo que index.html é sua página de login
        return;
    }
    console.log("DOM Produtos: Utilizador logado.");

    // --- Seletores de DOM para Produtos (mantenha os seus) ---
    const produtosGridContainer = document.getElementById('produtos-grid-container') as HTMLDivElement | null;
    const filtroBuscaProdutoInput = document.getElementById('filtro-busca-produto') as HTMLInputElement | null;
    const filtroCategoriaSelect = document.getElementById('filtro-categoria-produto') as HTMLSelectElement | null;
    const filtroEstoqueSelect = document.getElementById('filtro-estoque-produto') as HTMLSelectElement | null;
    const ordenarProdutosSelect = document.getElementById('ordenar-produtos') as HTMLSelectElement | null;
    
    const noProductsMessageDiv = document.getElementById('no-products-message') as HTMLDivElement | null;
    const loadingProdutosMessageDiv = document.getElementById('loading-produtos-message') as HTMLDivElement | null;

    const modalProduto = document.getElementById('modal-produto') as HTMLDivElement | null;
    const modalTituloProduto = document.getElementById('modal-titulo-produto') as HTMLElement | null;
    const formProduto = document.getElementById('form-produto') as HTMLFormElement | null;
    const btnAbrirModalProduto = document.getElementById('btn-abrir-modal-produto') as HTMLButtonElement | null;
    const btnCloseModalProduto = modalProduto?.querySelector('.modal-close-btn') as HTMLButtonElement | null;
    const btnCancelarModalProduto = document.getElementById('btn-cancelar-modal-produto') as HTMLButtonElement | null;
    
    const produtoIdModalInput = document.getElementById('produto-id-modal') as HTMLInputElement | null;
    const produtoNomeModalInput = document.getElementById('produto-nome-modal') as HTMLInputElement | null;
    const produtoCategoriaModalSelect = document.getElementById('produto-categoria-modal') as HTMLSelectElement | null;
    const produtoPrecoModalInput = document.getElementById('produto-preco-modal') as HTMLInputElement | null;
    const produtoEstoqueModalInput = document.getElementById('produto-estoque-modal') as HTMLInputElement | null;
    const produtoDescricaoModalTextarea = document.getElementById('produto-descricao-modal') as HTMLTextAreaElement | null;

    // --- Seletores de DOM para Navegação e Sidebar ---
    const sidebarProdutos = document.querySelector('.dashboard-sidebar') as HTMLElement | null; // Mantido
    const menuToggleBtnProdutos = document.querySelector('.menu-toggle-btn') as HTMLButtonElement | null; // Mantido
    const bodyProdutos = document.body; // Mantido
    const navLinks = document.querySelectorAll<HTMLAnchorElement>('.sidebar-nav a'); // MODIFICADO: Nome mais genérico
    const tituloSecaoElement = document.getElementById('dashboard-titulo-secao') as HTMLElement | null; // MODIFICADO: Nome mais genérico
    
    // NOVO: Seletor para todas as seções de conteúdo principal
    const allContentSections = document.querySelectorAll<HTMLElement>('.content-section');

    // --- Lógica da Sidebar (Abrir/Fechar) - Mantida como estava ---
    if (sidebarProdutos && menuToggleBtnProdutos) {
        menuToggleBtnProdutos.addEventListener('click', () => {
            console.log("Produtos.ts: Botão de menu da sidebar clicado.");
            const isVisible = sidebarProdutos.classList.toggle('sidebar-visible');
            bodyProdutos.classList.toggle('sidebar-overlay-active', isVisible);
            menuToggleBtnProdutos.setAttribute('aria-expanded', isVisible.toString());
        });
        bodyProdutos.addEventListener('click', (event) => {
            if (bodyProdutos.classList.contains('sidebar-overlay-active') && sidebarProdutos.classList.contains('sidebar-visible')) {
                const target = event.target as HTMLElement;
                if (!sidebarProdutos.contains(target) && !menuToggleBtnProdutos.contains(target)) {
                    console.log("Produtos.ts: Clique fora da sidebar, fechando sidebar.");
                    sidebarProdutos.classList.remove('sidebar-visible');
                    bodyProdutos.classList.remove('sidebar-overlay-active');
                    menuToggleBtnProdutos.setAttribute('aria-expanded', 'false');
                }
            }
        });
    }

    // --- NOVAS Funções de Navegação SPA ---
    function updateActiveLinkAndTitle(activeLink: HTMLAnchorElement | null, newTitle?: string) {
        console.log("SPA Nav: updateActiveLinkAndTitle chamado com link:", activeLink?.href, "Novo Título:", newTitle);
        navLinks.forEach(navLink => navLink.classList.remove('active'));

        if (activeLink) {
            activeLink.classList.add('active');
            const titleFromData = activeLink.dataset.title;
            if (tituloSecaoElement) {
                tituloSecaoElement.textContent = newTitle || titleFromData || "Dashboard"; // Título fallback
                console.log("SPA Nav: Título da seção atualizado para:", tituloSecaoElement.textContent);
            }
        }
    }

    function displaySection(sectionIdToShow: string, clickedLink: HTMLAnchorElement | null) {
        console.log(`SPA Nav: Tentando exibir a seção: ${sectionIdToShow}`);
        let sectionFound = false;
        allContentSections.forEach(section => {
            if (section.id === sectionIdToShow) {
                section.style.display = 'block';
                sectionFound = true;
                console.log(`SPA Nav: Exibindo ${section.id}`);

                if (section.id === 'produtos-content') {
                    if (loadingProdutosMessageDiv && produtosGridContainer) {
                        loadingProdutosMessageDiv.style.display = 'flex';
                        produtosGridContainer.style.display = 'none';
                        setTimeout(() => {
                            if(loadingProdutosMessageDiv) loadingProdutosMessageDiv.style.display = 'none';
                            renderizarGridProdutos(todosOsProdutosParaFiltragem);
                            if(produtosGridContainer) produtosGridContainer.style.display = 'block'; // Ou o display que seu grid usa
                            console.log("SPA Nav: Grid de produtos renderizado para seção de produtos.");
                        }, 50);
                    } else {
                         console.warn("SPA Nav: Divs de loading/grid de produtos não encontradas ao tentar mostrar seção de produtos.");
                         // Tenta renderizar diretamente se as divs não forem críticas para o loading
                         renderizarGridProdutos(todosOsProdutosParaFiltragem);
                    }
                }
            } else {
                section.style.display = 'none';
            }
        });

        if (!sectionFound) {
            console.warn(`SPA Nav: Nenhuma seção encontrada com o ID: ${sectionIdToShow}. Verifique os IDs no HTML e a convenção de nomes (ex: #produtos -> produtos-content).`);
            // Fallback: mostrar a primeira seção ou uma seção padrão se a desejada não for encontrada
            const defaultSection = document.getElementById('produtos-content') || document.querySelector<HTMLElement>('.content-section');
            if (defaultSection) {
                 defaultSection.style.display = 'block';
                 const defaultLink = document.querySelector<HTMLAnchorElement>('.sidebar-nav a[href="#produtos"]'); // Tenta encontrar link de produtos
                 updateActiveLinkAndTitle(defaultLink || (clickedLink?.href === `#${defaultSection.id.replace('-content', '')}` ? clickedLink : null) , defaultLink?.dataset.title || defaultSection.dataset.defaultTitle || "Página Inicial");

            }
        } else if (clickedLink) {
             updateActiveLinkAndTitle(clickedLink, clickedLink.dataset.title);
        }
    }
    
    // --- MODIFICADO: Event Listener para Navegação da Sidebar ---
    navLinks.forEach(link => {
        link.addEventListener('click', function(event: MouseEvent) {
            const currentAnchor = this;
            const href = currentAnchor.getAttribute('href');
            console.log(`SPA Nav: Link da sidebar clicado! HREF: '${href}'`);
    
            if (!href) { 
                console.warn("SPA Nav: Link clicado não possui um atributo href válido.");
                event.preventDefault(); 
                return; 
            }
    
            const currentPagePath = window.location.pathname;
            const isExternalOrDifferentPage = href.includes('.html') || href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//');

            if (isExternalOrDifferentPage) {
                let targetUrl;
                try {
                    targetUrl = new URL(href, window.location.origin);
                     // Se for um path diferente de um arquivo .html, permita a navegação padrão
                    if (targetUrl.pathname !== currentPagePath && href.includes('.html')) {
                        console.log(`SPA Nav: Navegação para OUTRA página HTML (${href}). Permitindo ação padrão.`);
                        return; // Deixa o navegador lidar com isso
                    }
                    // Se for um link externo absoluto, também permita
                    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
                         console.log(`SPA Nav: Navegação para URL externa (${href}). Permitindo ação padrão.`);
                        return;
                    }

                } catch (e) {
                    console.error(`SPA Nav: Erro ao parsear URL para href '${href}'.`, e);
                    event.preventDefault(); // Previne comportamento inesperado
                    return;
                }
            }
            
            // Se chegou aqui, é uma navegação interna (SPA) ou um link que não deve navegar
            event.preventDefault();
            console.log(`SPA Nav: Navegação interna ou link especial (HREF: '${href}'). Prevenindo padrão.`);
    
            let targetSectionId = '';
            if (href.startsWith('#') && href.length > 1) {
                targetSectionId = href.substring(1) + "-content"; // Convenção: #nome -> nome-content
                displaySection(targetSectionId, currentAnchor);
            } else {
                console.warn(`SPA Nav: Href '${href}' não é um formato esperado para navegação de seção (ex: #nomedasecao). Nenhuma ação de display tomada.`);
                // Apenas atualiza o link ativo se não souber qual seção mostrar
                updateActiveLinkAndTitle(currentAnchor, currentAnchor.dataset.title);
            }
    
            // Lógica para fechar a sidebar em dispositivos móveis
            if (sidebarProdutos && sidebarProdutos.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnProdutos) {
                console.log("SPA Nav: Fechando sidebar após clique em link (mobile).");
                sidebarProdutos.classList.remove('sidebar-visible');
                bodyProdutos.classList.remove('sidebar-overlay-active');
                menuToggleBtnProdutos.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // --- MODIFICADO: Função para Lidar com Carregamento Inicial da Página ---
    function handlePageLoad() {
        console.log("SPA Nav: handlePageLoad chamado.");
        let initialSectionHref = window.location.hash || "#produtos"; // Padrão para #produtos se não houver hash
    
        // Garante que o href comece com #
        if (!initialSectionHref.startsWith('#')) {
            initialSectionHref = "#" + initialSectionHref;
        }
        // Se for apenas "#", defina como #produtos (ou sua seção padrão)
        if (initialSectionHref === "#") {
            initialSectionHref = "#produtos";
        }

        const initialLink = document.querySelector(`.sidebar-nav a[href="${initialSectionHref}"]`) as HTMLAnchorElement | null;
        const sectionId = initialSectionHref.substring(1) + "-content";
    
        if (initialLink) {
            displaySection(sectionId, initialLink);
        } else {
            console.warn(`SPA Nav: Não foi possível encontrar o link inicial para href="${initialSectionHref}". Tentando carregar seção diretamente ou fallback.`);
            // Tenta carregar a seção de produtos como fallback se o link específico não for encontrado
            const fallbackLinkProdutos = document.querySelector('.sidebar-nav a[href="#produtos"]') as HTMLAnchorElement | null;
            if (fallbackLinkProdutos) {
                displaySection("produtos-content", fallbackLinkProdutos);
            } else {
                console.error("SPA Nav: Link de fallback para #produtos também não encontrado. Verifique a sidebar.");
                // Último recurso: tenta exibir a primeira seção de conteúdo
                const firstContentSection = document.querySelector<HTMLElement>('.content-section');
                if (firstContentSection) {
                    // Tenta encontrar um link que corresponda à primeira seção ou usa null
                    const correspondingLink = document.querySelector<HTMLAnchorElement>(`.sidebar-nav a[href="#${firstContentSection.id.replace('-content','')}"]`);
                    displaySection(firstContentSection.id, correspondingLink);
                }
            }
        }
    }
    

    // --- Lógica Específica de Produtos (funções como getIconeParaCategoria, renderizarGridProdutos, etc. - MANTIDAS COMO ESTAVAM) ---
    function getIconeParaCategoria(categoria: string): string {
        const catLower = categoria.toLowerCase();
        if (catLower.includes('vestido')) return `<svg class="icone-produto categoria-vestido" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.36,8.89,18.7,7.48,19.05,5.2H4.95L5.3,7.48,3.64,8.89C3.25,9.21,3,9.67,3,10.17V20a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1V10.17C21,9.67,20.75,9.21,20.36,8.89ZM8,18H6V13a2,2,0,0,1,4,0v5H8Zm4,0H10V11h4v7Zm4,0H16V13a2,2,0,0,1,4,0v5h-2ZM6.95,3.05,12,6.1,17.05,3.05A1,1,0,0,0,16.32,2H7.68A1,1,0,0,0,6.95,3.05Z"/></svg>`;
        if (catLower.includes('calça') || catLower.includes('calcas')) return `<svg class="icone-produto categoria-calca" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16,2H8A2,2,0,0,0,6,4V20a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V4A2,2,0,0,0,16,2ZM8,4h8V7H14.76L12,9.06,9.24,7H8Zm8,16H8V14.15L12,16.6l4-2.45Zm0-7.85L12,13.4l-4-2.45V8h1.6L12,9.94,14.4,8H16Z"/></svg>`;
        if (catLower.includes('blusa') || catLower.includes('camiseta')) return `<svg class="icone-produto categoria-blusa" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.36,8.89,18.7,7.48,19.05,5.2H4.95L5.3,7.48,3.64,8.89A2,2,0,0,0,3,10.17V20a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1V10.17A2,2,0,0,0,20.36,8.89ZM12,19a2,2,0,0,1-2-2,1,1,0,0,0-2,0,4,4,0,0,0,8,0,1,1,0,0,0-2,0A2,2,0,0,1,12,19ZM15,14H9a1,1,0,0,1,0-2h6a1,1,0,0,1,0,2Z"/></svg>`;
        if (catLower.includes('acessorio') || catLower.includes('acessorios') || catLower.includes('bolsa')) return `<svg class="icone-produto categoria-acessorio" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M19,6H17A5,5,0,0,0,7,6H5A2,2,0,0,0,3,8V19a2,2,0,0,0,2,2H19a2,2,0,0,0,2-2V8A2,2,0,0,0,19,6ZM9,6a3,3,0,0,1,6,0H9Zm10,13H5V8H7V9A1,1,0,0,0,8,10h8a1,1,0,0,0,1-1V8h2Z"/></svg>`;
        if (catLower.includes('saia')) return `<svg class="icone-produto categoria-saia" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12,2C8.69,2,6,4.69,6,8v1H18V8C18,4.69,15.31,2,12,2ZM6,10v10a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2V10H6Z"/></svg>`;
        if (catLower.includes('calcado') || catLower.includes('calcados') || catLower.includes('tênis')) return `<svg class="icone-produto categoria-calcado" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.8,6.93l-2.2-2.2a2.2,2.2,0,0,0-3.11,0L4.36,15.84A1,1,0,0,0,4,16.55V20a1,1,0,0,0,1,1H8.45a1,1,0,0,0,.71-.29l11.09-11.1A2.2,2.2,0,0,0,20.8,6.93ZM7.74,19H6V17.26l8.48-8.49,1.74,1.74Zm8.17-9.9-1.73-1.73L15.5,6,18,8.5Z"/></svg>`;
        return `<svg class="icone-produto categoria-default" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12,2A10,10,0,0,0,2,12A10,10,0,0,0,12,22A10,10,0,0,0,22,12A10,10,0,0,0,12,2M8,17.5A1.5,1.5,0,1,1,9.5,16A1.5,1.5,0,0,1,8,17.5m0-5A1.5,1.5,0,1,1,9.5,11A1.5,1.5,0,0,1,8,12.5m0-5A1.5,1.5,0,1,1,9.5,6A1.5,1.5,0,0,1,8,7.5m8,10A1.5,1.5,0,1,1,17.5,16A1.5,1.5,0,0,1,16,17.5m0-5A1.5,1.5,0,1,1,17.5,11A1.5,1.5,0,0,1,16,12.5m0-5A1.5,1.5,0,1,1,17.5,6A1.5,1.5,0,0,1,16,7.5Z"/></svg>`;
    }

    function renderizarGridProdutos(produtos: Produto[]): void {
        if (!produtosGridContainer) { console.error("Container do grid de produtos não encontrado!"); return; }
        produtosGridContainer.innerHTML = ''; 
        if (produtos.length === 0) {
            if (noProductsMessageDiv) noProductsMessageDiv.style.display = 'flex';
            return;
        }
        if (noProductsMessageDiv) noProductsMessageDiv.style.display = 'none';
        produtos.forEach((produto, index) => {
            const card = document.createElement('article');
            card.classList.add('produto-card');
            card.dataset.categoria = produto.categoria;
            card.style.animationDelay = `${index * 0.05}s`;
            let estoqueStatus = 'em-estoque';
            if (produto.estoque === 0) estoqueStatus = 'esgotado';
            else if (produto.estoque < 10) estoqueStatus = 'baixo-estoque';
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
            card.querySelector('.btn-acao-editar')?.addEventListener('click', () => abrirModalParaEdicao(produto.id));
            card.querySelector('.btn-acao-excluir')?.addEventListener('click', () => excluirProduto(produto.id));
        });
    }

    function aplicarFiltrosEOrdenar(): void {
        let produtosFiltrados = [...todosOsProdutosParaFiltragem];
        const termoBusca = filtroBuscaProdutoInput?.value.toLowerCase() || '';
        const categoriaSelecionada = filtroCategoriaSelect?.value || '';
        const estoqueSelecionado = filtroEstoqueSelect?.value || '';
        const ordenacaoSelecionada = ordenarProdutosSelect?.value || 'nome-asc';
        if (termoBusca) produtosFiltrados = produtosFiltrados.filter(p => p.nome.toLowerCase().includes(termoBusca) || p.id.toLowerCase().includes(termoBusca));
        if (categoriaSelecionada) produtosFiltrados = produtosFiltrados.filter(p => p.categoria === categoriaSelecionada);
        if (estoqueSelecionado) {
            produtosFiltrados = produtosFiltrados.filter(p => {
                if (estoqueSelecionado === 'em-estoque') return p.estoque >= 10;
                if (estoqueSelecionado === 'baixo-estoque') return p.estoque > 0 && p.estoque < 10;
                if (estoqueSelecionado === 'esgotado') return p.estoque === 0;
                return true;
            });
        }
        switch (ordenacaoSelecionada) {
            case 'nome-asc': produtosFiltrados.sort((a, b) => a.nome.localeCompare(b.nome)); break;
            case 'nome-desc': produtosFiltrados.sort((a, b) => b.nome.localeCompare(a.nome)); break;
            case 'preco-asc': produtosFiltrados.sort((a, b) => a.preco - b.preco); break;
            case 'preco-desc': produtosFiltrados.sort((a, b) => b.preco - a.preco); break;
            case 'estoque-asc': produtosFiltrados.sort((a, b) => a.estoque - b.estoque); break;
            case 'estoque-desc': produtosFiltrados.sort((a, b) => b.estoque - a.estoque); break;
            case 'id-asc': produtosFiltrados.sort((a, b) => a.id.localeCompare(b.id)); break;
        }
        renderizarGridProdutos(produtosFiltrados);
    }
    
    filtroBuscaProdutoInput?.addEventListener('input', aplicarFiltrosEOrdenar);
    filtroCategoriaSelect?.addEventListener('change', aplicarFiltrosEOrdenar);
    filtroEstoqueSelect?.addEventListener('change', aplicarFiltrosEOrdenar);
    ordenarProdutosSelect?.addEventListener('change', aplicarFiltrosEOrdenar);

    function preencherFormularioModal(produto?: Produto) {
        if (!formProduto || !produtoIdModalInput || !produtoNomeModalInput || !produtoCategoriaModalSelect || !produtoPrecoModalInput || !produtoEstoqueModalInput || !produtoDescricaoModalTextarea || !modalTituloProduto) {
            console.error("Erro: Um ou mais elementos do formulário do modal não foram encontrados no DOM."); return;
        }
        if (produto) {
            modalTituloProduto.textContent = `Editar Produto: ${produto.nome}`;
            produtoIdModalInput.value = produto.id;
            produtoNomeModalInput.value = produto.nome;
            produtoCategoriaModalSelect.value = produto.categoria;
            produtoPrecoModalInput.value = produto.preco.toString();
            produtoEstoqueModalInput.value = produto.estoque.toString();
            produtoDescricaoModalTextarea.value = produto.descricao || '';
        } else {
            modalTituloProduto.textContent = 'Adicionar Novo Produto';
            formProduto.reset(); // Limpa o formulário
             // Gera um ID simples para novo produto (pode ser melhorado para garantir unicidade)
            produtoIdModalInput.value = `XG${Math.floor(Math.random() * 8999) + 1000}`;
        }
    }

    function abrirModalParaEdicao(produtoId: string) {
        console.log(`Produtos.ts: Tentando abrir modal para editar produto ID: ${produtoId}`);
        const produtoParaEditar = todosOsProdutosParaFiltragem.find(p => p.id === produtoId);
        if (produtoParaEditar) {
            preencherFormularioModal(produtoParaEditar);
            if (modalProduto) modalProduto.classList.add('modal-visible');
            else console.error("Produtos.ts: Elemento modalProduto não encontrado ao tentar editar.");
        } else { console.error(`Produtos.ts: Produto com ID ${produtoId} não encontrado para edição.`); }
    }
    
    function abrirModalParaAdicionar() {
        console.log("Produtos.ts: Tentando abrir modal para adicionar novo produto...");
        preencherFormularioModal(); // Chama sem produto para resetar e configurar para adição
        if (modalProduto) {
            modalProduto.classList.add('modal-visible');
            console.log("Produtos.ts: Classe 'modal-visible' adicionada ao modalProduto.");
        } else { console.error("Produtos.ts: Elemento modalProduto não encontrado ao tentar adicionar."); }
    }

    function fecharModalProduto() {
        console.log("Produtos.ts: Tentando fechar modalProduto.");
        if (modalProduto) modalProduto.classList.remove('modal-visible');
    }

    if(btnAbrirModalProduto) btnAbrirModalProduto.addEventListener('click', abrirModalParaAdicionar);
    else console.error("Produtos.ts: Botão 'btn-abrir-modal-produto' não encontrado.");
    
    if(btnCloseModalProduto) btnCloseModalProduto.addEventListener('click', fecharModalProduto);
    else console.warn("Produtos.ts: Botão 'modal-close-btn' não encontrado dentro do modalProduto.");
    
    if(btnCancelarModalProduto) btnCancelarModalProduto.addEventListener('click', fecharModalProduto);
    else console.warn("Produtos.ts: Botão 'btn-cancelar-modal-produto' não encontrado.");
    
    modalProduto?.addEventListener('click', (event) => { if (event.target === modalProduto) fecharModalProduto(); });

    formProduto?.addEventListener('submit', (event) => {
        event.preventDefault();
        console.log("Produtos.ts: Formulário do modal submetido.");
        if (!produtoNomeModalInput || !produtoCategoriaModalSelect || !produtoPrecoModalInput || !produtoEstoqueModalInput || !produtoIdModalInput || !produtoDescricaoModalTextarea ) {
             console.error("Produtos.ts: Erro ao salvar: Campos do formulário do modal não encontrados."); return;
        }
        const idProduto = produtoIdModalInput.value;
        const novoProduto: Produto = {
            id: idProduto, // ID já deve estar preenchido (seja existente ou novo gerado)
            nome: produtoNomeModalInput.value, 
            categoria: produtoCategoriaModalSelect.value,
            preco: parseFloat(produtoPrecoModalInput.value.replace(',', '.')), // Trata vírgula no preço
            estoque: parseInt(produtoEstoqueModalInput.value), 
            descricao: produtoDescricaoModalTextarea.value
        };
        const indiceProdutoExistente = todosOsProdutosParaFiltragem.findIndex(p => p.id === idProduto);
        if (indiceProdutoExistente > -1) {
            todosOsProdutosParaFiltragem[indiceProdutoExistente] = novoProduto; console.log('Produtos.ts: Produto editado:', novoProduto);
        } else { todosOsProdutosParaFiltragem.unshift(novoProduto); console.log('Produtos.ts: Novo produto adicionado:', novoProduto); }
        aplicarFiltrosEOrdenar(); fecharModalProduto();
    });

    function excluirProduto(produtoId: string) {
        if (confirm(`Tem certeza que deseja excluir o produto com ID ${produtoId}?`)) {
            todosOsProdutosParaFiltragem = todosOsProdutosParaFiltragem.filter(p => p.id !== produtoId);
            // Também remova de dadosCompletosProdutos se for sua fonte original principal
            dadosCompletosProdutos = dadosCompletosProdutos.filter(p => p.id !== produtoId);
            console.log(`Produtos.ts: Produto ${produtoId} excluído.`);
            aplicarFiltrosEOrdenar();
        }
    }
    
    // --- CHAMADA INICIAL PARA CARREGAR A PÁGINA/SEÇÃO ---
    handlePageLoad(); // NOVO: Chama a função de carregamento de página que decide qual seção mostrar

});