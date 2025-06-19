// public/loading.js

// **IMPORTANTE:** Cole a configuração REAL do seu projeto Firebase aqui!
// Esta é a mesma configuração que está em script.js e dashboard.js
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

// Obtém instância do Auth
const auth = firebase.auth();

// O ponto crucial: verificar o estado de autenticação APENAS UMA VEZ
auth.onAuthStateChanged(user => {
    if (user) {
        // Usuário está logado, redireciona para o dashboard
        console.log('loading.js: Usuário logado. Redirecionando para dashboard.');
        window.location.href = '/dashboard.html';
    } else {
        // Usuário NÃO está logado, redireciona para a landing page
        console.log('loading.js: Nenhum usuário logado. Redirecionando para landing page.');
        window.location.href = '/index.html';
    }
});