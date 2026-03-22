// Verifica se tem sessão ao carregar a nova página
        const session = localStorage.getItem('academicflow_session');
        if (session) {
            const user = JSON.parse(session);
            // Exibe o nome do usuário no header (se tiver header)
            // Exemplo simples:
            // document.getElementById('user-name').textContent = user.name;
        }

        // Função de Logout
        function fazerLogout() {
            localStorage.removeItem('academicflow_session');
            localStorage.removeItem('academicflow_users'); // Opcional: limpa usuários também
             window.location.href = 'index.html'; // Volta para a página inicial
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            const timerDisplay = document.getElementById('timer-display');
            const btnStart = document.getElementById('btn-start');
            const btnPause = document.getElementById('btn-pause');
            const timerRing = document.querySelector('.timer-ring');
            
            let timeLeft = 1500; // 25 minutos em segundos
            let timerInterval = null;
            let isRunning = false;

            function updateDisplay() {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            function startTimer() {
                if (isRunning) return;
                isRunning = true;
                timerRing.style.animationPlayState = 'running';
                timerRing.style.animation = 'spin 4s linear infinite'; // Reinicia animação visual
                
                timerInterval = setInterval(() => {
                    if (timeLeft > 0) {
                        timeLeft--;
                        updateDisplay();
                    } else {
                        clearInterval(timerInterval);
                        isRunning = false;
                        timerRing.style.animation = 'none';
                        alert('Tempo esgotado!');
                    }
                }, 1000);
            }

            function pauseTimer() {
                clearInterval(timerInterval);
                isRunning = false;
                timerRing.style.animationPlayState = 'paused';
            }

            btnStart.addEventListener('click', startTimer);
            btnPause.addEventListener('click', pauseTimer);
        });

        // --- Gerenciamento de Autenticação ---
        document.addEventListener('DOMContentLoaded', () => {
            const modal = document.getElementById('auth-modal');
            const overlay = document.getElementById('auth-overlay');
            const closeBtn = document.getElementById('close-modal');
            const tabLogin = document.getElementById('tab-login');
            const tabSignup = document.getElementById('tab-signup');
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            const loginError = document.getElementById('login-error');
            const signupError = document.getElementById('signup-error');

            // --- Função para Abrir Modal ---
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('btn-open-auth')) {
                    e.preventDefault();
                    modal.style.display = 'block';
                    overlay.style.display = 'block';

                    if (e.target.getAttribute('data-type') === 'signup') {
                        tabSignup.click();
                    } else {
                        tabLogin.click();
                    }
                }
            });

            // --- Fechar Modal ---
            const closeModal = () => {
                modal.style.display = 'none';
                overlay.style.display = 'none';
            };
            closeBtn.addEventListener('click', closeModal);
            overlay.addEventListener('click', closeModal);

            // --- Alternar Abas ---
            tabLogin.addEventListener('click', () => {
                tabLogin.classList.add('active');
                tabSignup.classList.remove('active');
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
                loginError.style.display = 'none';
                signupError.style.display = 'none';
            });

            tabSignup.addEventListener('click', () => {
                tabSignup.classList.add('active');
                tabLogin.classList.remove('active');
                signupForm.style.display = 'block';
                loginForm.style.display = 'none';
                loginError.style.display = 'none';
                signupError.style.display = 'none';
            });

            // --- Lógica de Login ---
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // CORREÇÃO: Selecionar os elementos do DOM corretamente
                const loginEmailInput = document.getElementById('login-email');
                const loginPasswordInput = document.getElementById('login-password');
                
                const email = loginEmailInput.value;
                const password = loginPasswordInput.value;
                
                const users = JSON.parse(localStorage.getItem('academicflow_users') || '[]');
                const user = users.find(u => u.email === email && u.password === password);

                if (user) {
                    localStorage.setItem('academicflow_session', JSON.stringify(user));
                    // Redirecionamento
                    window.location.href = "./index2.html";
                } else {
                    loginError.textContent = 'E-mail ou senha incorretos.';
                    loginError.style.display = 'block';
                }
            });

            // --- Lógica de Cadastro ---
            signupForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // CORREÇÃO: Selecionar os elementos do DOM corretamente
                const signupNameInput = document.getElementById('signup-name');
                const signupEmailInput = document.getElementById('signup-email');
                const signupPasswordInput = document.getElementById('signup-password');

                const name = signupNameInput.value;
                const email = signupEmailInput.value;
                const password = signupPasswordInput.value;

                const users = JSON.parse(localStorage.getItem('academicflow_users') || '[]');
                
                if (users.find(u => u.email === email)) {
                    signupError.textContent = 'E-mail já cadastrado.';
                    signupError.style.display = 'block';
                    return;
                }

                const newUser = { name, email, password };
                users.push(newUser);
                
                localStorage.setItem('academicflow_users', JSON.stringify(users));
                localStorage.setItem('academicflow_session', JSON.stringify(newUser));

                // Redirecionamento
                window.location.href = "./index2.html";
            });

            // --- Logout ---
            function fazerLogout() {
                localStorage.removeItem('academicflow_session');
                updateUIForLogout();
                // Opcional: voltar para a home após logout
                // window.location.href = "index.html";
            }

            // --- Atualizar UI para Login ---
            function updateUIForLogin(user) {
                const navContainer = document.querySelector('.nav-container');
                const loginBtn = navContainer.querySelector('.btn-login');
                const novaPagina = "./index2.html"; 

                loginBtn.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <a href="${novaPagina}" style="text-decoration: none; color: inherit; display: flex; align-items: center; gap: 10px;">
                            <span class="user-avatar">${user.name.charAt(0).toUpperCase()}</span>
                            <span>${user.name}</span>
                        </a>
                        <button id="btn-logout" class="btn-logout" style="margin-left: 10px;">Sair</button>
                    </div>
                `;

                document.getElementById('btn-logout').addEventListener('click', (e) => {
                    e.preventDefault();
                    fazerLogout();
                });
            }

            // --- Atualizar UI para Logout ---
            function updateUIForLogout() {
                const navContainer = document.querySelector('.nav-container');
                const loginBtn = navContainer.querySelector('.btn-login');
                
                loginBtn.innerHTML = 'Entrar';
                loginBtn.style.cursor = 'pointer';
                loginBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.style.display = 'block';
                    overlay.style.display = 'block';
                });
            }

            // --- Verificar Sessão ao Carregar ---
            function checkSession() {
                const session = localStorage.getItem('academicflow_session');
                if (session) {
                    const user = JSON.parse(session);
                    updateUIForLogin(user);
                }
            }
            
            // Iniciar verificação
            checkSession();
        });

        // --- Timer Pomodoro ---
        document.addEventListener('DOMContentLoaded', () => {
            const timerDisplay = document.getElementById('timer-display');
            const btnStart = document.getElementById('btn-start');
            const btnPause = document.getElementById('btn-pause');
            const timerRing = document.querySelector('.timer-ring');
            
            let timeLeft = 1500; // 25 minutos em segundos
            let timerInterval = null;
            let isRunning = false;

            function updateDisplay() {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            function startTimer() {
                if (isRunning) return;
                isRunning = true;
                timerRing.style.animationPlayState = 'running';
                timerRing.style.animation = 'spin 4s linear infinite';
                
                timerInterval = setInterval(() => {
                    if (timeLeft > 0) {
                        timeLeft--;
                        updateDisplay();
                    } else {
                        clearInterval(timerInterval);
                        isRunning = false;
                        timerRing.style.animation = 'none';
                        alert('Tempo esgotado!');
                    }
                }, 1000);
            }

            function pauseTimer() {
                clearInterval(timerInterval);
                isRunning = false;
                timerRing.style.animationPlayState = 'paused';
            }

            if(btnStart) btnStart.addEventListener('click', startTimer);
            if(btnPause) btnPause.addEventListener('click', pauseTimer);
        });

        // --- Chat Widget ---
        document.addEventListener('DOMContentLoaded', () => {
            const chatWidget = document.getElementById('chat-widget');
            const chatTrigger = document.getElementById('chat-trigger');
            const closeChat = document.getElementById('close-chat');
            const openChatSupport = document.getElementById('open-chat-support');
            const chatInput = document.getElementById('chat-input');
            const sendChat = document.getElementById('send-chat');
            const chatMessages = document.getElementById('chat-messages');

            const toggleChat = (e) => {
                if(e) e.preventDefault();
                const isVisible = chatWidget.style.display === 'block';
                chatWidget.style.display = isVisible ? 'none' : 'block';
                chatTrigger.style.display = isVisible ? 'flex' : 'none';
            };

            if(chatTrigger) chatTrigger.addEventListener('click', toggleChat);
            if(closeChat) closeChat.addEventListener('click', toggleChat);
            if(openChatSupport) openChatSupport.addEventListener('click', toggleChat);

            if(sendChat) sendChat.addEventListener('click', () => {
                const text = chatInput.value.trim();
                if (!text) return;

                appendMessage(text, 'user');
                chatInput.value = '';

                setTimeout(() => {
                    const botResponse = "Recebi sua dúvida! No momento estou em treinamento, mas você pode conferir nossa aba 'Recursos' ou 'Sobre' para entender mais sobre o AcademicFlow.";
                    appendMessage(botResponse, 'bot');
                }, 800);
            });

            function appendMessage(text, side) {
                const msg = document.createElement('div');
                msg.style.padding = '8px';
                msg.style.borderRadius = '8px';
                msg.style.maxWidth = '80%';
                msg.style.marginBottom = '5px';
                
                if (side === 'user') {
                    msg.style.background = 'var(--accent-color)';
                    msg.style.color = 'var(--bg-primary)';
                    msg.style.alignSelf = 'flex-end';
                } else {
                    msg.style.background = 'rgba(255,255,255,0.05)';
                    msg.style.color = 'var(--text-primary)';
                    msg.style.alignSelf = 'flex-start';
                }
                
                msg.textContent = text;
                chatMessages.appendChild(msg);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });