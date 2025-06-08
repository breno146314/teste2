// public/script.js

// Cole a configuração do seu projeto Firebase aqui
// Certifique-se de que é a mesma que você usou em dashboard.js
const firebaseConfig = {
    apiKey: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI", // SEU_API_KEY
    authDomain: "orca-eleltrica.firebaseapp.com",     // SEU_AUTH_DOMAIN
    projectId: "orca-eleltrica",                      // SEU_PROJECT_ID
    storageBucket: "orca-eleltrica.firebasestorage.app", // SEU_STORAGE_BUCKET
    messagingSenderId: "48836864931",                 // SEU_MESSAGING_SENDER_ID
    appId: "1:48836864931:web:9b1dc4579ebd254b570816",   // SEU_APP_ID
    measurementId: "G-1XXEHV4E69"                     // SEU_MEASUREMENT_ID (se habilitado)
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém instâncias dos serviços que vamos usar
const auth = firebase.auth();
const db = firebase.firestore();

// --- Elementos HTML da Landing Page e Modais ---
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');

const openLoginModalBtn = document.getElementById('openLoginModal');
const openRegisterModalBtn = document.getElementById('openRegisterModal');
const heroRegisterBtn = document.getElementById('heroRegisterBtn');
const ctaRegisterBtnFree = document.getElementById('ctaRegisterBtnFree');
const ctaRegisterBtnPro = document.getElementById('ctaRegisterBtnPro');
const heroDemoBtn = document.getElementById('heroDemoBtn'); // Para uma futura demo

const closeButtons = document.querySelectorAll('.close-button'); // Botões de fechar dos modais

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');

// --- Funções de UI (Modais) ---
function openModal(modal) { // Antes de abrir, garanta que qualquer outro modal esteja fechado
    if (modal === loginModal) {
        closeModal(registerModal); // Se for abrir o login, feche o cadastro
    } else if (modal === registerModal) {
        closeModal(loginModal); // Se for abrir o cadastro, feche o login
    }

    modal.style.display = 'flex'; // Exibe o modal (usando flex para centralizar)
    document.body.style.overflow = 'hidden'; // Evita scroll do body por baixo

}

function closeModal(modal) {
    if (modal) { // Verifica se o modal existe antes de tentar fechar
        modal.style.display = 'none'; // Esconde o modal
        // Somente restaura o scroll se nenhum outro modal estiver aberto
        if (loginModal.style.display === 'none' && registerModal.style.display === 'none') {
            document.body.style.overflow = '';
        }
        // Limpa mensagens e formulários ao fechar
        registerMessage.textContent = '';
        loginMessage.textContent = '';
        registerMessage.className = 'message';
        loginMessage.className = 'message';
        registerForm.reset();
        loginForm.reset();
    }
}

// Event Listeners para abrir modais
openLoginModalBtn.addEventListener('click', () => openModal(loginModal));
openRegisterModalBtn.addEventListener('click', () => openModal(registerModal));
heroRegisterBtn.addEventListener('click', () => openModal(registerModal));
ctaRegisterBtnFree.addEventListener('click', () => openModal(registerModal));
ctaRegisterBtnPro.addEventListener('click', () => {
    alert('Funcionalidade de Plano Pro em construção! Por enquanto, cadastre-se no plano Grátis.');
    openModal(registerModal);
});

// Event Listeners para fechar modais (botão X e clique fora)
closeButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        closeModal(event.target.closest('.modal'));
    });
});

window.addEventListener('click', (event) => {
    if (event.target == loginModal) {
        closeModal(loginModal);
    }
    if (event.target == registerModal) {
        closeModal(registerModal);
    }
});

// --- Lógica de Cadastro de Usuário (dentro do modal) ---
registerForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    registerMessage.className = 'message'; // Reseta classes de mensagem

    if (password !== confirmPassword) {
        registerMessage.textContent = 'As senhas não coincidem!';
        registerMessage.classList.add('error');
        return;
    }
    if (password.length < 8) {
        registerMessage.textContent = 'A senha deve ter no mínimo 8 caracteres.';
        registerMessage.classList.add('error');
        return;
    }

    try {
        // 1. Criar usuário com e-mail e senha no Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 2. Armazenar dados adicionais (username) no Cloud Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        registerMessage.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
        registerMessage.classList.add('success');
        
        // Limpa o formulário e redireciona após um pequeno atraso
        registerForm.reset();
        setTimeout(() => {
            closeModal(registerModal); // Fecha o modal
            window.location.href = '/dashboard.html'; // Redireciona para o dashboard
        }, 2000);

    } catch (error) {
        console.error('Erro no cadastro:', error.code, error.message);
        let errorMessage = 'Erro ao cadastrar. Tente novamente.';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = 'Este e-mail já está em uso.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'A senha é muito fraca. Escolha uma senha mais forte.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'O formato do e-mail é inválido.';
        }
        registerMessage.textContent = errorMessage;
        registerMessage.classList.add('error');
    }
});

// --- Lógica de Login de Usuário (dentro do modal) ---
loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    loginMessage.className = 'message'; // Reseta classes de mensagem

    try {
        // Realiza o login com e-mail e senha no Firebase Authentication
        await auth.signInWithEmailAndPassword(email, password);

        loginMessage.textContent = 'Login realizado com sucesso! Redirecionando...';
        loginMessage.classList.add('success');
        
        // Limpa o formulário e redireciona após um pequeno atraso
        loginForm.reset();
        setTimeout(() => {
            closeModal(loginModal); // Fecha o modal
            window.location.href = '/dashboard.html'; // Redireciona para o dashboard
        }, 2000);

    } catch (error) {
        console.error('Erro no login:', error.code, error.message);
        let errorMessage = 'Erro ao fazer login. Verifique seu e-mail e senha.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'E-mail ou senha inválidos.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'O formato do e-mail é inválido.';
        }
        loginMessage.textContent = errorMessage;
        loginMessage.classList.add('error');
    }
});

// --- Lógica de Proteção de Rota (para a Landing Page) ---
// Se o usuário já estiver logado e tentar acessar a LP, redireciona para o dashboard
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('Usuário logado na Landing Page:', user.email, user.uid);
        // Redireciona para o dashboard se já estiver logado e não for o dashboard
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
             window.location.href = '/dashboard.html';
        }
    } else {
        console.log('Nenhum usuário logado na Landing Page.');
        // Se estiver no dashboard sem login, o dashboard.js vai redirecionar
    }
});

// --- Smooth Scrolling para Links de Navegação ---
document.querySelectorAll('.scroll-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Ajuste para o header fixo
                behavior: 'smooth'
            });
        }
    });
});

// --- Placeholder para botão de demonstração (futuramente) ---
heroDemoBtn.addEventListener('click', () => {
    alert('A demonstração interativa está em construção! Fique ligado.');
});