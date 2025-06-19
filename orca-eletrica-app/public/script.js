// public/script.js

// **IMPORTANTE:** Cole a configuração REAL do seu projeto Firebase aqui!
// Esta é a mesma configuração que está no seu dashboard.js e profile.js
const firebaseConfig = {
    apiKey: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI", // SUBSTITUA PELA SUA CHAVE API
    authDomain: "orca-eleltrica.firebaseapp.com",     // SUBSTITUA PELO SEU DOMÍNIO DE AUTENTICAÇÃO
    projectId: "orca-eleltrica",                      // SUBSTITUA PELO SEU ID DE PROJETO
    storageBucket: "orca-eleltrica.firebasestorage.app", // SUBSTITUA PELO SEU STORAGE BUCKET
    messagingSenderId: "48836864931",                 // SUBSTITUA PELO SEU SENDER ID
    appId: "1:48836864931:web:9b1dc4579ebd254b570816",   // SUBSTITUA PELO SEU APP ID
    measurementId: "G-1XXEHV4E69"                     // Opcional, se usar Analytics
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém instâncias dos serviços Firebase
const auth = firebase.auth();
const db = firebase.firestore();

// --- Elementos HTML dos Modais ---
const loginModalElement = document.getElementById('loginModal');
const registerModalElement = document.getElementById('registerModal');

// Instâncias de modal do Bootstrap (essencial para controlar via JS)
const loginModal = new bootstrap.Modal(loginModalElement);
const registerModal = new bootstrap.Modal(registerModalElement);

// Formulários dentro dos modais
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

// Elementos para mensagens de feedback
const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');

// Botões da Landing Page que podem acionar modais (não precisam de addEventListener para abrir se usam data-bs-toggle)
const heroDemoBtn = document.getElementById('heroDemoBtn');
const ctaRegisterBtnPro = document.getElementById('ctaRegisterBtnPro'); // Botão "Quero o Plano Pro!"

// --- Funções Auxiliares Comuns ---
// Replicadas aqui para garantir que script.js funcione independentemente.
// Se estas forem globais em um arquivo 'utils.js' futuro, elas podem ser removidas daqui.
function showMessage(element, msg, type) {
    if (element) {
        element.textContent = msg;
        // Use classes de alerta do Bootstrap para feedback visual
        element.className = `alert alert-${type} mt-3 text-center`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message text-center mt-3'; // Reverte para a classe base
        }, 3000);
    }
}

// --- Lógica de Cadastro de Usuário (dentro do modal) ---
registerForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    showMessage(registerMessage, '', ''); // Limpa mensagens anteriores

    if (password !== confirmPassword) {
        showMessage(registerMessage, 'As senhas não coincidem!', 'danger'); // type 'danger' para erro Bootstrap
        return;
    }
    if (password.length < 8) {
        showMessage(registerMessage, 'A senha deve ter no mínimo 8 caracteres.', 'danger');
        return;
    }

    try {
        // 1. Criar usuário com e-mail e senha no Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // 2. Armazenar dados adicionais (username) no Cloud Firestore
        // Use user.uid como ID do documento para vincular ao Auth
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        showMessage(registerMessage, 'Cadastro realizado com sucesso! Redirecionando...', 'success');
        
        registerForm.reset();
        setTimeout(() => {
            registerModal.hide(); // Fecha o modal Bootstrap de cadastro
            window.location.href = '/dashboard.html'; // Redireciona para o dashboard
        }, 1500); // Um pouco mais de tempo para a mensagem ser lida

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
        showMessage(registerMessage, errorMessage, 'danger');
    }
});

// --- Lógica de Login de Usuário (dentro do modal) ---
loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    showMessage(loginMessage, '', ''); // Limpa mensagens anteriores

    try {
        // 1. Realiza o login com e-mail e senha no Firebase Authentication
        await auth.signInWithEmailAndPassword(email, password);

        showMessage(loginMessage, 'Login realizado com sucesso! Redirecionando...', 'success');
        
        loginForm.reset();
        setTimeout(() => {
            loginModal.hide(); // Fecha o modal Bootstrap de login
            window.location.href = '/dashboard.html'; // Redireciona para o dashboard
        }, 1500); // Um pouco mais de tempo para a mensagem ser lida

    } catch (error) {
        console.error('Erro no login:', error.code, error.message);
        let errorMessage = 'Erro ao fazer login. Verifique seu e-mail e senha.';
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            errorMessage = 'E-mail ou senha inválidos.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'O formato do e-mail é inválido.';
        }
        showMessage(loginMessage, errorMessage, 'danger');
    }
});


// --- Lógica de Proteção de Rota (para a Landing Page) ---
// Se o usuário já estiver logado e tentar acessar a LP, redireciona para o dashboard
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('Usuário logado na Landing Page:', user.email, user.uid);
        // Só redireciona se a URL atual for a raiz ou index.html
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
             window.location.href = '/dashboard.html';
        }
    } else {
        console.log('Nenhum usuário logado na Landing Page.');
        // Nenhuma ação aqui, apenas o console.log.
        // A Landing Page deve ser visível para usuários não logados.
    }
});

// --- Event Listeners para Botões Adicionais da LP ---
// Os botões que usam data-bs-toggle="modal" não precisam de um addEventListener aqui para ABRIR o modal,
// o Bootstrap faz isso automaticamente. Estes listeners são para outras ações além de abrir o modal.

// Botão "Ver Demonstração"
if (heroDemoBtn) { // Verifica se o elemento existe no DOM
    heroDemoBtn.addEventListener('click', () => {
        alert('A demonstração interativa está em construção! Fique ligado.');
    });
}

// Botão "Quero o Plano Pro!"
if (ctaRegisterBtnPro) { // Verifica se o elemento existe no DOM
    ctaRegisterBtnPro.addEventListener('click', () => {
        alert('Funcionalidade de Plano Pro em construção! Por enquanto, cadastre-se no plano Grátis.');
        registerModal.show(); // Abre o modal de cadastro via JS se for o caso de não ter data-bs-toggle
    });
}


// --- Scroll Suave (com Bootstrap) ---
// Para links de navegação da navbar que apontam para seções da página.
// O Bootstrap já tem um comportamento de scrollspy, mas este JS garante o scroll suave.
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault(); // Impede o comportamento padrão do link
        const targetId = this.getAttribute('href'); // Obtém o ID da seção alvo (ex: "#hero-section")
        const targetElement = document.querySelector(targetId); // Encontra o elemento alvo no DOM

        if (targetElement) { // Se o elemento alvo for encontrado
            const navbarHeight = document.querySelector('.navbar').offsetHeight; // Altura da navbar fixa
            window.scrollTo({
                top: targetElement.offsetTop - navbarHeight, // Ajusta a posição para considerar a navbar fixa
                behavior: 'smooth' // Anima o scroll
            });
        }
    });
});