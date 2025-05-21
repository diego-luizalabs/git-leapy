// TESTE DE FUMAÇA:
alert("js/produtos.ts INICIADO! (v3 com correção de href=null) Se você vir isso, o arquivo está sendo lido.");
console.log("LOG INICIAL: js/produtos.ts (v3) foi lido pelo navegador.");

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
        window.location.href = 'index.html';
        return;
    }
    console.log("DOM Produtos: Utilizador logado.");

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

    const sidebarProdutos = document.querySelector('.dashboard-sidebar') as HTMLElement | null;
    const menuToggleBtnProdutos = document.querySelector('.menu-toggle-btn') as HTMLButtonElement | null;
    const bodyProdutos = document.body;
    const navLinksProdutos = document.querySelectorAll('.sidebar-nav a');
    const tituloSecaoHeaderProdutos = document.getElementById('dashboard-titulo-secao') as HTMLElement | null;

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

    function updateActiveLinkAndTitleProdutos(activeLink: HTMLAnchorElement | null) {
        console.log("Produtos.ts: updateActiveLinkAndTitleProdutos chamado com link:", activeLink?.href);
        navLinksProdutos.forEach(navLink => navLink.classList.remove('active'));
        if (activeLink) {
            activeLink.classList.add('active');
            if (tituloSecaoHeaderProdutos) {
                tituloSecaoHeaderProdutos.textContent = "Gerenciamento de Produtos";
                console.log("Produtos.ts: Título da seção atualizado para 'Gerenciamento de Produtos'.");
            }
        }
    }
    
    navLinksProdutos.forEach(link => {
        (link as HTMLAnchorElement).addEventListener('click', function(event: MouseEvent) {
            const currentAnchor = this as HTMLAnchorElement;
            const href = currentAnchor.getAttribute('href');
            console.log(`Produtos.ts: Link da sidebar clicado! HREF: '${href}'`);

            // ** CORREÇÃO PARA O ERRO DE 'href' PODER SER NULL **
            if (!href) { 
                console.warn("Produtos.ts: Link clicado não possui um atributo href válido. Ação padrão prevenida.");
                event.preventDefault(); 
                return; 
            }

            const currentPageFilename = window.location.pathname.split('/').pop() || 'index.html';
            const targetUrl = new URL(href, window.location.origin); // Agora 'href' é garantidamente uma string
            const targetPageFilename = targetUrl.pathname.split('/').pop() || 'index.html';

            if (href.includes('.html') && targetPageFilename !== currentPageFilename) {
                console.log(`Produtos.ts: Navegação para OUTRA página HTML (${href}). Permitindo ação padrão do navegador.`);
                return;
            }

            console.log(`Produtos.ts: Link NÃO é para outra página HTML ou é um link especial para a página atual. Chamando event.preventDefault(). HREF: '${href}'`);
            event.preventDefault();

            if (targetPageFilename === currentPageFilename || href === '#') {
                 console.log("Produtos.ts: Link é para a página atual ou é um placeholder (#). Atualizando estado ativo.");
                 updateActiveLinkAndTitleProdutos(currentAnchor);
            } else {
                console.warn(`Produtos.ts: Clique em link (${href}) que não é para outra página e não tem tratamento específico em produtos.html.`);
            }

            if (sidebarProdutos && sidebarProdutos.classList.contains('sidebar-visible') && window.innerWidth < 992 && menuToggleBtnProdutos) {
                console.log("Produtos.ts: Fechando sidebar após clique em link (mobile).");
                sidebarProdutos.classList.remove('sidebar-visible');
                bodyProdutos.classList.remove('sidebar-overlay-active');
                menuToggleBtnProdutos.setAttribute('aria-expanded', 'false');
            }
        });
    });

    function handlePageLoadProdutos() {
        console.log("Produtos.ts: handlePageLoadProdutos chamado.");
        const productPageLink = document.querySelector('.sidebar-nav a[href="produtos.html"]') as HTMLAnchorElement | null;
        if (productPageLink) {
            updateActiveLinkAndTitleProdutos(productPageLink);
        } else if (tituloSecaoHeaderProdutos) {
            tituloSecaoHeaderProdutos.textContent = "Gerenciamento de Produtos";
        }
    }
    handlePageLoadProdutos();

    // --- Restante da Lógica de Produtos ---
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
            formProduto.reset();
            produtoIdModalInput.value = `XG${Math.floor(Math.random() * 9000) + 1000}`;
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
        preencherFormularioModal();
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
            id: idProduto || `XG${Date.now()}`, nome: produtoNomeModalInput.value, categoria: produtoCategoriaModalSelect.value,
            preco: parseFloat(produtoPrecoModalInput.value), estoque: parseInt(produtoEstoqueModalInput.value), descricao: produtoDescricaoModalTextarea.value
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
            console.log(`Produtos.ts: Produto ${produtoId} excluído.`);
            aplicarFiltrosEOrdenar();
        }
    }
    
    if (loadingProdutosMessageDiv) loadingProdutosMessageDiv.style.display = 'flex';
    setTimeout(() => {
        if (loadingProdutosMessageDiv) loadingProdutosMessageDiv.style.display = 'none';
        renderizarGridProdutos(todosOsProdutosParaFiltragem);
        console.log("Produtos.ts: Grid de produtos renderizado com dados mockados iniciais.");
    }, 200);
});