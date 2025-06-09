// public/script.js

// Cole a configuração do seu projeto Firebase aqui
// Certifique-se de que é a mesma que você usou em dashboard.js
// Exemplo de como ficaria a linha 1 do seu script.js (ou outro arquivo JS do frontend)
const firebaseConfig = {
  apiKey: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI",
  authDomain: "orca-eleltrica.firebaseapp.com",
  projectId: "orca-eleltrica",
  storageBucket: "orca-eleltrica.firebasestorage.app",
  messagingSenderId: "48836864931",
  appId: "1:48836864931:web:9b1dc4579ebd254b570816",
  measurementId: "G-1XXEHV4E69",
};
// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém instâncias dos serviços
const auth = firebase.auth();
const db = firebase.firestore();

// --- Elementos HTML dos Modais ---
const loginModalElement = document.getElementById('loginModal');
const registerModalElement = document.getElementById('registerModal');

// Instâncias de modal do Bootstrap (essencial para controlar via JS)
const loginModal = new bootstrap.Modal(loginModalElement);
const registerModal = new bootstrap.Modal(registerModalElement);

// Formulários
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');

// Botões da Landing Page que abrem modais
const ctaRegisterBtnPro = document.getElementById('ctaRegisterBtnPro');
const heroDemoBtn = document.getElementById('heroDemoBtn'); // Para uma futura demo

// --- Lógica de Cadastro de Usuário ---
registerForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    registerMessage.className = 'message text-center mt-3'; // Reseta classes de mensagem

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
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        await db.collection('users').doc(user.uid).set({
            username: username,
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

        registerMessage.textContent = 'Cadastro realizado com sucesso! Redirecionando...';
        registerMessage.classList.add('success');
        
        registerForm.reset();
        setTimeout(() => {
            registerModal.hide(); // Fecha o modal Bootstrap
            window.location.href = '/dashboard.html'; // Redireciona
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

    loginMessage.className = 'message text-center mt-3'; // Reseta classes de mensagem

    try {
        await auth.signInWithEmailAndPassword(email, password);

        loginMessage.textContent = 'Login realizado com sucesso! Redirecionando...';
        loginMessage.classList.add('success');
        
        loginForm.reset();
        setTimeout(() => {
            loginModal.hide(); // Fecha o modal Bootstrap
            window.location.href = '/dashboard.html'; // Redireciona
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
auth.onAuthStateChanged(user => {
    if (user) {
        console.log('Usuário logado na Landing Page:', user.email, user.uid);
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
             window.location.href = '/dashboard.html';
        }
    } else {
        console.log('Nenhum usuário logado na Landing Page.');
    }
});

// --- Event Listeners para Botões Adicionais da LP ---
ctaRegisterBtnPro.addEventListener('click', () => {
    alert('Funcionalidade de Plano Pro em construção! Por enquanto, cadastre-se no plano Grátis.');
    registerModal.show(); // Abre o modal de cadastro
});

heroDemoBtn.addEventListener('click', () => {
    alert('A demonstração interativa está em construção! Fique ligado.');
});

// --- Scroll Suave (Bootstrap lida com isso se os links tiverem data-bs-target para collapse/scrollspy) ---
// Para links simples de scroll, pode usar a função JS abaixo se preferir ou se o Bootstrap não lidar
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - (document.querySelector('.navbar').offsetHeight), // Ajuste para a altura da navbar fixa
                behavior: 'smooth'
            });
        }
    });
});