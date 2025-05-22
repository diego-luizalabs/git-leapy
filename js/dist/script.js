"use strict";
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Script.ts: Completamente carregado e analisado.");
    const graphicColumn = document.querySelector('.login-graphic-column');
    if (graphicColumn) {
        console.log("DOM Script.ts: Coluna gráfica encontrada para efeito de códigos.");
        const createCodeChar = () => {
            const charElement = document.createElement('span');
            charElement.classList.add('code-char');
            const chars = '01{}[]<>/|\\!?@#$%^&*()_-+=~`abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            charElement.textContent = chars[Math.floor(Math.random() * chars.length)];
            charElement.style.left = `${Math.random() * 100}%`;
            const duration = Math.random() * 4 + 5;
            const delay = Math.random() * 7;
            charElement.style.animationDuration = `${duration}s`;
            charElement.style.animationDelay = `${delay}s`;
            graphicColumn.appendChild(charElement);
        };
        const charDensityFactor = 0.15;
        const numberOfChars = Math.floor(graphicColumn.offsetWidth * charDensityFactor);
        for (let i = 0; i < numberOfChars; i++) {
            createCodeChar();
        }
        console.log(`DOM Script.ts: ${numberOfChars} caracteres de código criados para animação (densidade dinâmica).`);
    }
    else {
        console.warn("DOM Script.ts: Elemento .login-graphic-column não encontrado para o efeito de códigos a cair.");
    }
    const formLogin = document.getElementById('form-login');
    const loginErrorMessage = document.getElementById('login-error-message');
    const loginButton = formLogin === null || formLogin === void 0 ? void 0 : formLogin.querySelector('.btn-login');
    const btnText = loginButton === null || loginButton === void 0 ? void 0 : loginButton.querySelector('.btn-text');
    const btnSpinner = loginButton === null || loginButton === void 0 ? void 0 : loginButton.querySelector('.btn-spinner');
    const toggleLoginButtonState = (isLoading) => {
        if (loginButton && btnText && btnSpinner) {
            btnText.style.display = isLoading ? 'none' : 'inline-block';
            btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
            loginButton.disabled = isLoading;
        }
    };
    if (formLogin) {
        formLogin.addEventListener('submit', (event) => {
            event.preventDefault();
            const emailInput = document.getElementById('email');
            const senhaInput = document.getElementById('senha');
            if (!emailInput || !senhaInput || !loginErrorMessage) {
                if (!emailInput)
                    console.error("DOM Script.ts: Campo de email não encontrado.");
                if (!senhaInput)
                    console.error("DOM Script.ts: Campo de senha não encontrado.");
                if (!loginErrorMessage)
                    console.error("DOM Script.ts: Elemento de mensagem de erro do login não encontrado.");
                toggleLoginButtonState(false);
                return;
            }
            toggleLoginButtonState(true);
            if (loginErrorMessage) {
                loginErrorMessage.style.display = 'none';
            }
            setTimeout(() => {
                const email = emailInput.value;
                const senha = senhaInput.value;
                const adminEmail = 'admin@admin.com';
                const adminSenha = '12345';
                if (email === adminEmail && senha === adminSenha) {
                    sessionStorage.setItem('isXuxuGlowAdminLoggedIn', 'true');
                    window.location.href = 'vendas.html';
                }
                else {
                    loginErrorMessage.textContent = 'Email ou senha inválidos. Tente novamente.';
                    loginErrorMessage.style.display = 'block';
                    senhaInput.value = '';
                    toggleLoginButtonState(false);
                }
            }, 1000);
        });
    }
    const updateFooterYear = (elementId) => {
        const yearSpan = document.getElementById(elementId);
        if (yearSpan) {
            yearSpan.textContent = new Date().getFullYear().toString();
        }
    };
    updateFooterYear('currentYear');
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const hrefAttribute = this.getAttribute('href');
            if (hrefAttribute && hrefAttribute.startsWith('#') && hrefAttribute.length > 1) {
                const isDashboardNavLink = this.closest('.sidebar-nav') || this.dataset.target;
                if (isDashboardNavLink) {
                    const targetId = hrefAttribute.substring(1);
                    const targetElement = document.getElementById(targetId);
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }
            }
        });
    });
});
//# sourceMappingURL=script.js.map