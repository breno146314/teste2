// Cole a configuração do seu projeto Firebase aqui
// Você encontra isso no console do Firebase:
// Configurações do Projeto (ícone de engrenagem) -> Geral -> "Seus apps" (Web)

//import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
   apiKey: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI",
  authDomain: "orca-eleltrica.firebaseapp.com",
  projectId: "orca-eleltrica",
  storageBucket: "orca-eleltrica.firebasestorage.app",
  messagingSenderId: "48836864931",
  appId: "1:48836864931:web:9b1dc4579ebd254b570816",
  measurementId: "G-1XXEHV4E69"
  //measurementId: "SEU_MEASUREMENT_ID" // Opcional, se usar Analytics
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém instâncias dos serviços que vamos usar
const auth = firebase.auth();
const db = firebase.firestore();
// Initialize Firebase
//const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);

// --- Elementos HTML ---
const showRegisterBtn = document.getElementById('showRegister');
const showLoginBtn = document.getElementById('showLogin');
const registerSection = document.getElementById('registerSection');
const loginSection = document.getElementById('loginSection');

const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');

// --- Funções de UI (Alternar entre Cadastro e Login) ---
function showSection(sectionToShow, activeBtn) {
    // Esconde todas as seções e remove a classe 'active' de todos os botões
    document.querySelectorAll('.auth-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.toggle-buttons button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostra a seção desejada e ativa o botão correspondente
    sectionToShow.classList.add('active');
    activeBtn.classList.add('active');

    // Limpa mensagens e formulários ao alternar
    registerMessage.textContent = '';
    loginMessage.textContent = '';
    registerMessage.className = 'message';
    loginMessage.className = 'message';
    registerForm.reset();
    loginForm.reset();
}

// Event Listeners para os botões de alternância
showRegisterBtn.addEventListener('click', () => showSection(registerSection, showRegisterBtn));
showLoginBtn.addEventListener('click', () => showSection(loginSection, showLoginBtn));

// Inicialmente, mostra a seção de cadastro
showSection(registerSection, showRegisterBtn);

// --- Lógica de Cadastro de Usuário ---
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
        // O UID do usuário do Authentication é usado como ID do documento no Firestore
        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(), // Timestamp do servidor
            // Adicione outros campos padrão se precisar, ex: roles: ['user']
        });

        registerMessage.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
        registerMessage.classList.add('success');
        
        // Limpa o formulário e redireciona após um pequeno atraso
        registerForm.reset();
        setTimeout(() => {
            // Após o cadastro, idealmente redirecionar para uma página de dashboard
            window.location.href = '/dashboard.html';
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

// --- Lógica de Login de Usuário ---
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
            // Após o login, redirecionar para a página de dashboard
            window.location.href = '/dashboard.html';
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


// --- Lógica de Verificação de Estado de Autenticação (Para proteger rotas) ---
// É importante ter uma forma de verificar se o usuário está logado ao carregar qualquer página.
// No seu dashboard.html (que vamos criar) você faria algo parecido.
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário está logado (ex: redirecionar para dashboard se estiver na página de login/cadastro)
        console.log('Usuário logado:', user.email, user.uid);
        // Se a página atual for index.html (login/cadastro) e o usuário estiver logado,
        // pode ser interessante redirecioná-lo para o dashboard automaticamente.
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
             // window.location.href = '/dashboard.html'; // Descomente para ativar o redirecionamento automático
        }
    } else {
        // Usuário não está logado
        console.log('Nenhum usuário logado.');
        // Se a página atual for uma página protegida (ex: dashboard) e o usuário não estiver logado,
        // você deve redirecioná-lo para a página de login.
        if (window.location.pathname === '/dashboard.html') {
            // window.location.href = '/index.html'; // Descomente para ativar o redirecionamento de volta ao login
        }
    }
});