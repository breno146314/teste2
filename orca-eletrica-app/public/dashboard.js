// public/dashboard.js

// Cole a configuração do seu projeto Firebase aqui
const firebaseConfig = {
    apiKey: "SUA_API_KEY", // EX: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI"
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
const storage = firebase.storage(); // Adicionado para ser usado na seção de perfil

// --- Elementos HTML do Dashboard ---
const welcomeMessage = document.getElementById('welcomeMessage');
const loggedInUserEmail = document.getElementById('loggedInUserEmail');
const logoutButton = document.getElementById('logoutButton');

const sidebarNavLinks = document.querySelectorAll('.sidebar-nav ul li a');
const contentSections = document.querySelectorAll('.main-content .content-section');

// Referências às seções de conteúdo que serão carregadas dinamicamente
const dashboardOverviewSection = document.getElementById('dashboardOverview');
const manageServicesSection = document.getElementById('manageServicesSection');
const createQuotationSection = document.getElementById('createQuotationSection');
const myQuotationsSection = document.getElementById('myQuotationsSection');
const accountSettingsSection = document.getElementById('accountSettingsSection');

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

    // Mostra a seção desejada e ativa o link correspondente na sidebar
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        document.querySelector(`.sidebar-nav ul li a[data-section="${sectionId}"]`).classList.add('active');
    }

    // --- Lógica para Carregar Conteúdo Dinamicamente ---
    // Remove o conteúdo das seções dinâmicas antes de carregar o novo
    manageServicesSection.innerHTML = `<h1>Gerenciar Serviços e Materiais</h1><p>Carregando...</p>`;
    accountSettingsSection.innerHTML = `<h1>Minha Conta e Perfil da Empresa</h1><p>Carregando...</p>`;
    createQuotationSection.innerHTML = `<h1>Criar Novo Orçamento</h1><p>Carregando...</p>`; // Adiciona carregamento para esta também

    if (sectionId === 'manageServicesSection') {
        loadContentIntoSection('/manage-services.html', manageServicesSection, 'manage-services.js');
    } else if (sectionId === 'accountSettingsSection') {
        loadContentIntoSection('/profile.html', accountSettingsSection, 'profile.js');
    } else if (sectionId === 'createQuotationSection') {
        loadContentIntoSection('/create-quotation.html', createQuotationSection, 'create-quotation.js');
    } else if (sectionId === 'myQuotationsSection') {
        alert('Meus Orçamentos: Funcionalidade em construção!');
        // Aqui você carregaria o conteúdo de 'my-quotations.html'
    }
}

/**
 * Carrega o conteúdo HTML de uma URL e injeta em uma seção,
 * então executa o script JS associado.
 * @param {string} url O caminho para o arquivo HTML a ser carregado.
 * @param {HTMLElement} targetSection O elemento HTML onde o conteúdo será injetado.
 * @param {string} scriptToLoad O caminho para o arquivo JS a ser executado após a injeção do HTML.
 */
async function loadContentIntoSection(url, targetSection, scriptToLoad) {
    try {
        // Fetch o HTML
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();

        // Extrai apenas o conteúdo do <body> (ou a parte que nos interessa)
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const contentToInject = doc.body.querySelector('.container') ? doc.body.querySelector('.container').innerHTML : doc.body.innerHTML;

        targetSection.innerHTML = contentToInject; // Injeta o HTML

        // Remove scripts previamente carregados para evitar duplicação ou conflito
        const oldScript = document.getElementById(`dynamic-script-${targetSection.id}`);
        if (oldScript) {
            oldScript.remove();
        }

        // Cria e anexa o novo script, garantindo que ele execute
        const scriptElement = document.createElement('script');
        scriptElement.src = scriptToLoad;
        scriptElement.id = `dynamic-script-${targetSection.id}`; // Adiciona um ID único
        scriptElement.onload = () => {
            console.log(`${scriptToLoad} carregado e executado.`);
            // Para scripts que dependem de eventos DOMContentLoaded, dispará-lo manualmente
            const event = new Event('DOMContentLoaded', {
                bubbles: true,
                cancelable: true,
            });
            targetSection.dispatchEvent(event); // Dispara o evento na seção carregada
        };
        scriptElement.onerror = (e) => {
            console.error(`Erro ao carregar script ${scriptToLoad}:`, e);
            targetSection.innerHTML = `<p class="message error">Erro ao carregar o conteúdo. Por favor, tente novamente.</p>`;
        };
        document.body.appendChild(scriptElement); // Adiciona o script ao body

    } catch (error) {
        console.error(`Erro ao carregar conteúdo de ${url}:`, error);
        targetSection.innerHTML = `<p class="message error">Erro ao carregar o conteúdo. Por favor, tente novamente.</p>`;
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
    // Agora ele mostra a seção interna, não redireciona
    showSection('createQuotationSection'); 
});

quickViewQuotationsBtn.addEventListener('click', () => {
    alert('Meus Orçamentos: Funcionalidade em construção!');
    // showSection('myQuotationsSection'); // Se você tivesse conteúdo pronto para esta seção
});