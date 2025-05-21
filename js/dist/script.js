"use strict";
// Ficheiro: /Users/diegosantos/projeto-leapy/js/script.ts
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Script.ts: Completamente carregado e analisado.");
    // --- INÍCIO DO EFEITO DE CÓDIGOS A CAIR (para a coluna gráfica em index.html) ---
    const graphicColumn = document.querySelector('.login-graphic-column');
    if (graphicColumn) {
        console.log("DOM Script.ts: Coluna gráfica encontrada para efeito de códigos.");
        const createCodeChar = () => {
            const charElement = document.createElement('span'); // Alterado para charElement para clareza
            charElement.classList.add('code-char');
            const chars = '01{}[]<>/|\\!?@#$%^&*()_-+=~`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            charElement.textContent = chars[Math.floor(Math.random() * chars.length)];
            charElement.style.left = `${Math.random() * 100}%`; // Posição horizontal aleatória
            // Duração da animação e delay aleatórios
            const duration = Math.random() * 4 + 5; // Duração entre 5s e 9s
            const delay = Math.random() * 7; // Delay inicial até 7s
            // MODIFICAÇÃO: Aplica apenas duration e delay.
            // Assumindo que .code-char no CSS já tem:
            // animation-name: codeLinesFall;
            // animation-timing-function: linear;
            // animation-iteration-count: infinite;
            charElement.style.animationDuration = `${duration}s`;
            charElement.style.animationDelay = `${delay}s`;
            // Se as outras propriedades não estiverem na classe .code-char,
            // você pode adicioná-las aqui ou, preferencialmente, no CSS.
            // Ex: charElement.style.animationName = 'codeLinesFall'; 
            //     charElement.style.animationTimingFunction = 'linear';
            //     charElement.style.animationIterationCount = 'infinite';
            graphicColumn.appendChild(charElement);
        };
        // MODIFICAÇÃO: Densidade dinâmica dos caracteres baseada na largura da coluna
        const charDensityFactor = 0.15; // Ajuste este fator (0.05 = menos denso, 0.25 = mais denso)
        const numberOfChars = Math.floor(graphicColumn.offsetWidth * charDensityFactor);
        for (let i = 0; i < numberOfChars; i++) {
            createCodeChar();
        }
        console.log(`DOM Script.ts: ${numberOfChars} caracteres de código criados para animação (densidade dinâmica).`);
        // Lembrete: A animação @keyframes codeLinesFall deve estar definida no seu CSS, por exemplo:
        /*
        .code-char { // Adicione ao seu CSS se ainda não estiver completo
            position: absolute;
            font-family: 'Monaco', 'Courier New', Courier, monospace;
            color: var(--cor-codigo-caindo);
            user-select: none;
            text-shadow: 0 0 8px var(--cor-codigo-brilho);
            opacity: 0;
            will-change: transform, opacity;
            top: -40px;
            // Propriedades da animação que são constantes:
            animation-name: codeLinesFall;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
        }

        @keyframes codeLinesFall {
            0% { transform: translateY(-40px); opacity: 0; } // Inicia acima e invisível
            5%, 10% { opacity: 0.9; }
            90%, 95% { opacity: 0.7; } // Começa a desaparecer
            100% { transform: translateY(102vh); opacity: 0; } // Termina bem abaixo e invisível
        }
        */
    }
    else {
        console.warn("DOM Script.ts: Elemento .login-graphic-column não encontrado para o efeito de códigos a cair.");
    }
    // --- FIM DO EFEITO DE CÓDIGOS A CAIR ---
    // --- INÍCIO DA LÓGICA DO FORMULÁRIO DE LOGIN (para index.html) ---
    const formLogin = document.getElementById('form-login');
    const loginErrorMessage = document.getElementById('login-error-message');
    // Adicionado para o spinner do botão
    const loginButton = formLogin === null || formLogin === void 0 ? void 0 : formLogin.querySelector('.btn-login');
    const btnText = loginButton === null || loginButton === void 0 ? void 0 : loginButton.querySelector('.btn-text');
    const btnSpinner = loginButton === null || loginButton === void 0 ? void 0 : loginButton.querySelector('.btn-spinner');
    if (formLogin) {
        formLogin.addEventListener('submit', (event) => {
            event.preventDefault();
            const emailInput = document.getElementById('email');
            const senhaInput = document.getElementById('senha');
            // Feedback de loading no botão
            if (loginButton && btnText && btnSpinner) {
                btnText.style.display = 'none';
                btnSpinner.style.display = 'inline-block';
                loginButton.disabled = true;
            }
            if (loginErrorMessage) { // Esconde mensagem de erro anterior
                loginErrorMessage.style.display = 'none';
            }
            // Simulação de delay da API
            setTimeout(() => {
                if (emailInput && senhaInput && loginErrorMessage) {
                    const email = emailInput.value;
                    const senha = senhaInput.value;
                    // ATENÇÃO: Esta é uma validação apenas no lado do cliente e insegura para produção.
                    // Em uma aplicação real, a validação deve ser feita no servidor.
                    const adminEmail = 'admin@xuxuglow.com';
                    const adminSenha = 'password123';
                    if (email === adminEmail && senha === adminSenha) {
                        sessionStorage.setItem('isXuxuGlowAdminLoggedIn', 'true');
                        window.location.href = 'vendas.html';
                        // Não precisa reverter o spinner aqui, pois haverá redirecionamento
                    }
                    else {
                        loginErrorMessage.textContent = 'Email ou senha inválidos. Tente novamente.';
                        loginErrorMessage.style.display = 'block';
                        if (senhaInput)
                            senhaInput.value = ''; // Limpa apenas a senha
                        // Reverte o estado do botão em caso de erro
                        if (loginButton && btnText && btnSpinner) {
                            btnText.style.display = 'inline-block'; // Ou 'flex' dependendo do seu CSS
                            btnSpinner.style.display = 'none';
                            loginButton.disabled = false;
                        }
                    }
                }
                else {
                    if (!emailInput)
                        console.error("DOM Script.ts: Campo de email não encontrado.");
                    if (!senhaInput)
                        console.error("DOM Script.ts: Campo de senha não encontrado.");
                    if (!loginErrorMessage)
                        console.error("DOM Script.ts: Elemento de mensagem de erro do login não encontrado.");
                    // Reverte o estado do botão se os campos não forem encontrados
                    if (loginButton && btnText && btnSpinner) {
                        btnText.style.display = 'inline-block';
                        btnSpinner.style.display = 'none';
                        loginButton.disabled = false;
                    }
                }
            }, 1000); // Simula 1 segundo de delay
        });
    }
    // --- FIM DA LÓGICA DO FORMULÁRIO DE LOGIN ---
    // --- INÍCIO DA LÓGICA GLOBAL ---
    const updateFooterYear = (elementId) => {
        const yearSpan = document.getElementById(elementId);
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear().toString();
        }
    };
    updateFooterYear('currentYear'); // Certifique-se que existe um elemento com id="currentYear" no seu HTML global
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const hrefAttribute = this.getAttribute('href');
            if (hrefAttribute && hrefAttribute.startsWith('#') && hrefAttribute.length > 1) { // Garante que não é só "#"
                // Verifica se o link é para uma seção do dashboard (evita conflito com outros usos de #)
                // Esta é uma suposição, ajuste se seus data-targets forem diferentes ou se não houver data-target
                const isDashboardNavLink = this.closest('.sidebar-nav') || this.dataset.target;
                if (isDashboardNavLink) { // Só aplica scroll suave para links de navegação internos da página
                    const targetId = hrefAttribute.substring(1);
                    // Para a navegação de seções do dashboard, a lógica já está em vendas.ts
                    // Esta parte seria para outros links de âncora na página, se houver.
                    // Se for um link de navegação do dashboard, a lógica em vendas.ts já o manipulará.
                    // Para evitar duplo scroll ou comportamento inesperado, pode ser necessário
                    // diferenciar os links de scroll suave dos links de navegação de seção.
                    // Por enquanto, mantemos genérico.
                    if (targetId) {
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                            e.preventDefault();
                            targetElement.scrollIntoView({
                                behavior: 'smooth'
                            });
                        }
                    }
                }
            }
        });
    });
    // --- FIM DA LÓGICA GLOBAL ---
});
//# sourceMappingURL=script.js.map