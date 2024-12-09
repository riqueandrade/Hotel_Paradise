// Verifica se o usuário está autenticado
document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    
    if (token) {
        try {
            // Verifica se o token é válido fazendo uma requisição para a API
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                // Se o token não for válido, remove-o do localStorage
                localStorage.removeItem('token');
                return;
            }

            // Se o token for válido, redireciona para o dashboard
            window.location.href = '/html/dashboard.html';
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            localStorage.removeItem('token');
        }
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scroll para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Animação dos cards ao scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__animated', 'animate__fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observa os cards de serviços
    document.querySelectorAll('.card').forEach(card => {
        observer.observe(card);
    });

    // Formulário de contato
    const contactForm = document.querySelector('#contato form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Aqui você pode adicionar a lógica para enviar o formulário
            const formData = {
                nome: this.querySelector('#nome').value,
                email: this.querySelector('#email').value,
                mensagem: this.querySelector('#mensagem').value
            };

            // Exemplo de feedback visual
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

            // Simula envio (substitua por sua lógica real)
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Mensagem Enviada!';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-success');
                this.reset();

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.remove('btn-success');
                    submitBtn.classList.add('btn-primary');
                }, 3000);
            }, 1500);
        });
    }

    // Atualiza o ano no footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Newsletter form
    const newsletterForm = document.querySelector('.footer-newsletter form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = this.querySelector('input[type="email"]');
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            if (!emailInput.value) {
                emailInput.classList.add('is-invalid');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Inscrevendo...';

            // Simula envio (substitua por sua lógica real)
            setTimeout(() => {
                submitBtn.innerHTML = '<i class="bi bi-check-circle me-2"></i>Inscrito!';
                submitBtn.classList.remove('btn-primary');
                submitBtn.classList.add('btn-success');
                emailInput.value = '';

                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    submitBtn.classList.remove('btn-success');
                    submitBtn.classList.add('btn-primary');
                }, 3000);
            }, 1500);
        });
    }
}); 