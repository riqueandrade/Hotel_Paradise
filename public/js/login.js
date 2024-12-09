document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const toggleSlider = document.querySelector('.toggle-slider');
    const errorMessage = document.getElementById('errorMessage');
    const passwordToggles = document.querySelectorAll('.toggle-password');

    // Toggle entre formulários
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const formType = this.dataset.form;
            
            // Atualiza botões
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Move o slider
            toggleSlider.style.transform = formType === 'register' ? 'translateX(100%)' : 'translateX(0)';

            // Alterna formulários com animação
            if (formType === 'login') {
                registerForm.classList.add('animate__fadeOut');
                setTimeout(() => {
                    registerForm.classList.add('d-none');
                    loginForm.classList.remove('d-none');
                    loginForm.classList.add('animate__fadeIn');
                    registerForm.classList.remove('animate__fadeOut');
                }, 300);
            } else {
                loginForm.classList.add('animate__fadeOut');
                setTimeout(() => {
                    loginForm.classList.add('d-none');
                    registerForm.classList.remove('d-none');
                    registerForm.classList.add('animate__fadeIn');
                    loginForm.classList.remove('animate__fadeOut');
                }, 300);
            }

            // Limpa mensagens de erro
            hideError();
        });
    });

    // Toggle de visibilidade da senha
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            // Alterna o ícone
            const icon = this.querySelector('i');
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        });
    });

    // Função para mostrar erro
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        errorMessage.classList.add('animate__animated', 'animate__shakeX');
        
        setTimeout(() => {
            errorMessage.classList.remove('animate__animated', 'animate__shakeX');
        }, 1000);
    }

    // Função para esconder erro
    function hideError() {
        errorMessage.classList.add('d-none');
    }

    // Login Form Submit
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!validateEmail(email)) {
            showError('Por favor, insira um email válido');
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, rememberMe })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                if (rememberMe) {
                    localStorage.setItem('userEmail', email);
                }
                
                submitBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Sucesso!';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-success');

                setTimeout(() => {
                    window.location.href = '/html/dashboard.html';
                }, 1000);
            } else {
                showError(data.message || 'Erro ao fazer login');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        } catch (error) {
            showError('Erro ao conectar com o servidor');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // Register Form Submit
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError();

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const termsAccepted = document.getElementById('termsCheck').checked;

        // Validações
        if (!name || !email || !password || !confirmPassword) {
            showError('Por favor, preencha todos os campos');
            return;
        }

        if (!validateEmail(email)) {
            showError('Por favor, insira um email válido');
            return;
        }

        if (password.length < 6) {
            showError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            showError('As senhas não coincidem');
            return;
        }

        if (!termsAccepted) {
            showError('Você precisa aceitar os termos de uso');
            return;
        }

        const submitBtn = this.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registrando...';

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                submitBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i>Registrado!';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-success');

                setTimeout(() => {
                    // Volta para o login
                    toggleBtns[0].click();
                    showSuccess('Conta criada com sucesso! Faça login para continuar.');
                }, 1000);
            } else {
                showError(data.message || 'Erro ao registrar');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        } catch (error) {
            showError('Erro ao conectar com o servidor');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // Google Login com efeito de ripple
    const googleBtn = document.getElementById('googleLogin');
    googleBtn.addEventListener('click', function(e) {
        // Cria o efeito de ripple
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        
        // Posiciona o ripple onde o usuário clicou
        const rect = this.getBoundingClientRect();
        ripple.style.left = e.clientX - rect.left + 'px';
        ripple.style.top = e.clientY - rect.top + 'px';
        
        this.appendChild(ripple);
        
        // Remove o ripple após a animação
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });

        // Adiciona classe de loading e desabilita o botão
        this.classList.add('loading');
        this.disabled = true;
        
        // Atualiza o conteúdo do botão
        const originalContent = this.innerHTML;
        this.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            <span>Conectando...</span>
        `;

        // Redireciona após um pequeno delay para mostrar a animação
        setTimeout(() => {
            window.location.href = '/api/auth/google';
        }, 500);
    });

    // Função para validar email
    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    // Função para mostrar mensagem de sucesso
    function showSuccess(message) {
        const successMessage = document.createElement('div');
        successMessage.className = 'alert alert-success animate__animated animate__fadeIn';
        successMessage.textContent = message;
        errorMessage.parentNode.insertBefore(successMessage, errorMessage);

        setTimeout(() => {
            successMessage.remove();
        }, 5000);
    }

    // Carrega email salvo
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
        document.getElementById('loginEmail').value = savedEmail;
        document.getElementById('rememberMe').checked = true;
    }
}); 