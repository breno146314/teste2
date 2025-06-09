// public/dashboard.js

// Cole a configuração do seu projeto Firebase aqui
const firebaseConfig = {
    apiKey: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI", // EX: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI"
    authDomain: "orca-eleltrica.firebaseapp.com",     // EX: "orca-eleltrica.firebaseapp.com"
    projectId: "orca-eleltrica",                      // EX: "orca-eleltrica"
    storageBucket: "orca-eleltrica.firebasestorage.app", // EX: "orca-eleltrica.firebasestorage.app"
    messagingSenderId: "48836864931",                 // EX: "48836864931"
    appId: "1:48836864931:web:9b1dc4579ebd254b570816",   // EX: "1:48836864931:web:9b1dc4579ebd254b570816"
    measurementId: "G-1XXEHV4E69"                     // Opcional, se habilitado
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém instâncias dos serviços
const auth = firebase.auth();
const db = firebase.firestore();

// --- Elementos HTML do Dashboard ---
const welcomeMessage = document.getElementById('welcomeMessage');
const loggedInUserEmail = document.getElementById('loggedInUserEmail');
const logoutButton = document.getElementById('logoutButton');

const sidebarNavLinks = document.querySelectorAll('.sidebar-nav ul li a');
const contentSections = document.querySelectorAll('.main-content .content-section');

// Botões de ação rápida na Visão Geral
const quickCreateQuotationBtn = document.getElementById('quickCreateQuotation');
const quickViewQuotationsBtn = document.getElementById('quickViewQuotations');


let currentUser = null; // Variável para armazenar o usuário logado

// --- Funções Auxiliares ---
function redirectToLogin() {
    window.location.href = '/index.html';
}

function showSection(sectionId) {
    // Esconde todas as seções de conteúdo
    contentSections.forEach(section => {
        section.classList.remove('active');
    });

    // Remove a classe 'active' de todos os links da sidebar
    sidebarNavLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Mostra a seção desejada
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        // Ativa o link correspondente na sidebar
        document.querySelector(`.sidebar-nav ul li a[data-section="${sectionId}"]`).classList.add('active');
    }

    // Gerencia o carregamento de conteúdo externo (se for o caso)
    // Para simplificar, as páginas serão carregadas via window.location.href por enquanto
    // mas esta estrutura permitiria carregar HTML dinamicamente com fetch()
    if (sectionId === 'manageServicesSection') {
        window.location.href = '/manage-services.html';
    } else if (sectionId === 'createQuotationSection') {
        window.location.href = '/create-quotation.html';
    } else if (sectionId === 'myQuotationsSection') {
        // Futura página de listagem de orçamentos
        alert('Meus Orçamentos: Funcionalidade em construção!');
    } else if (sectionId === 'accountSettingsSection') {
        window.location.href = '/profile.html';
    }
}


// --- Autenticação e Carregamento Inicial ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        console.log('Usuário logado no dashboard (nova versão):', user.email, user.uid);
        loggedInUserEmail.textContent = user.email; // Exibe o email na sidebar

        // Tentar buscar o nome de usuário do Firestore para mensagem de boas-vindas
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                welcomeMessage.textContent = `Olá, ${userData.username || user.email}!`;
            } else {
                welcomeMessage.textContent = `Olá, ${user.email}!`;
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário no Firestore:', error);
            welcomeMessage.textContent = `Olá, ${user.email}!`; // Fallback para o email
        }
        
        // Exibir a seção de Visão Geral por padrão ao logar
        showSection('dashboardOverview');

    } else {
        // Usuário NÃO está logado, redirecionar para a página de login
        console.log('Nenhum usuário logado. Redirecionando para login.');
        redirectToLogin();
    }
});

// --- Lógica de Logout ---
logoutButton.addEventListener('click', async () => {
    try {
        await auth.signOut();
        // Redirecionar para a página de login após o logout
        redirectToLogin();
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao sair. Tente novamente.');
    }
});

// --- Event Listeners para Links da Sidebar ---
sidebarNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault(); // Impede o comportamento padrão do link
        const sectionId = e.target.dataset.section;
        showSection(sectionId);
    });
});

// --- Event Listeners para Botões de Ação Rápida no Dashboard (Visão Geral) ---
quickCreateQuotationBtn.addEventListener('click', () => {
    window.location.href = '/create-quotation.html'; // Redireciona para a página de criar orçamento
});

quickViewQuotationsBtn.addEventListener('click', () => {
    alert('Meus Orçamentos: Funcionalidade em construção!');
    // window.location.href = '/my-quotations.html'; // Futura página de listagem
});