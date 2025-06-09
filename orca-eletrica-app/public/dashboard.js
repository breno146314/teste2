// Cole a configuração do seu projeto Firebase aqui
// Mesma configuração usada em script.js
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

// Obtém instâncias dos serviços que vamos usar
const auth = firebase.auth();
const db = firebase.firestore();

// Elementos HTML
const welcomeMessage = document.getElementById('welcomeMessage');
const logoutButton = document.getElementById('logoutButton');

// --- Função para Redirecionar para o Login ---
function redirectToLogin() {
    window.location.href = '/index.html';
}

// --- Verificar Estado da Autenticação (Proteção da Rota) ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Usuário está logado
        console.log('Usuário logado no dashboard:', user.email, user.uid);
        
        // Tentar buscar o nome de usuário do Firestore
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
        
    } else {
        // Usuário NÃO está logado, redirecionar para a página de login
        console.log('Nenhum usuário logado. Redirecionando para login.');
        redirectToLogin();
    }
});
// --- Event Listeners para os Novos Cards de Navegação ---
manageServicesCard.addEventListener('click', () => {
    window.location.href = '/manage-services.html'; // PÁGINA CRIADA AGORA!
});

createQuotationCard.addEventListener('click', () => {
    alert('Funcionalidade de Criar Novo Orçamento em construção!');
    // window.location.href = '/create-quotation.html'; // Futura página
});

viewQuotationsCard.addEventListener('click', () => {
    alert('Funcionalidade de Meus Orçamentos em construção!');
    // window.location.href = '/view-quotations.html'; // Futura página
});

accountSettingsCard.addEventListener('click', () => {
    window.location.href = '/profile.html'; // Já criada no passo anterior
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

// Futuramente, adicionaremos lógicas para os botões de navegação
document.getElementById('manageServicesBtn').addEventListener('click', () => {
    alert('Funcionalidade de Gerenciar Serviços/Materiais em construção!');
});
document.getElementById('createQuotationBtn').addEventListener('click', () => {
    alert('Funcionalidade de Criar Novo Orçamento em construção!');
});
document.getElementById('viewQuotationsBtn').addEventListener('click', () => {
    alert('Funcionalidade de Meus Orçamentos em construção!');
});