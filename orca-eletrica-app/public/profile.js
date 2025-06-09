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


// Obtém instâncias dos serviços que vamos usar
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage(); // Instância do Firebase Storage

// Elementos HTML
const profileForm = document.getElementById('profileForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const companyNameInput = document.getElementById('companyName');
const cnpjInput = document.getElementById('cnpj');
const companyAddressInput = document.getElementById('companyAddress');
const companyPhoneInput = document.getElementById('companyPhone');
const companyLogoInput = document.getElementById('companyLogo');
const logoPreview = document.getElementById('logoPreview');
const logoStatus = document.getElementById('logoStatus');
const defaultTermsInput = document.getElementById('defaultTerms');
const profileMessage = document.getElementById('profileMessage');
const backToDashboardBtn = document.getElementById('backToDashboard');

let currentUser = null; // Variável para armazenar o usuário logado

// --- Função para Redirecionar para o Login ---
function redirectToLogin() {
    window.location.href = '/index.html';
}

// --- Verificar Estado da Autenticação (Proteção da Rota) ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        console.log('Usuário logado no perfil:', user.email, user.uid);
        // Carregar dados do perfil
        await loadProfileData(user.uid);
    } else {
        // Usuário NÃO está logado, redirecionar para a página de login
        console.log('Nenhum usuário logado. Redirecionando para login.');
        redirectToLogin();
    }
});

// --- Carregar Dados do Perfil do Firestore ---
async function loadProfileData(uid) {
    try {
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            usernameInput.value = userData.username || '';
            emailInput.value = userData.email || ''; // Email é read-only
            companyNameInput.value = userData.companyName || '';
            cnpjInput.value = userData.cnpj || '';
            companyAddressInput.value = userData.companyAddress || '';
            companyPhoneInput.value = userData.companyPhone || '';
            defaultTermsInput.value = userData.defaultTerms || '';

            // Carregar logo da empresa se existir
            if (userData.logoUrl) {
                logoPreview.src = userData.logoUrl;
                logoStatus.textContent = 'Logo atual carregada.';
            } else {
                logoPreview.src = 'images/placeholder-logo.png'; // Imagem de placeholder
                logoStatus.textContent = 'Nenhuma logo enviada ainda.';
            }
        } else {
            console.log('Documento de usuário não encontrado no Firestore.');
        }
    } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
        profileMessage.textContent = 'Erro ao carregar dados do perfil.';
        profileMessage.classList.add('error');
    }
}

// --- Salvar Dados do Perfil ---
profileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) {
        profileMessage.textContent = 'Nenhum usuário logado para salvar o perfil.';
        profileMessage.classList.add('error');
        return;
    }

    profileMessage.className = 'message'; // Reseta classes de mensagem

    const dataToUpdate = {
        username: usernameInput.value,
        companyName: companyNameInput.value,
        cnpj: cnpjInput.value,
        companyAddress: companyAddressInput.value,
        companyPhone: companyPhoneInput.value,
        defaultTerms: defaultTermsInput.value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp() // Adiciona um timestamp de atualização
    };

    try {
        // 1. Upload da Logo (se um novo arquivo foi selecionado)
        if (companyLogoInput.files.length > 0) {
            const file = companyLogoInput.files[0];
            const maxFileSize = 2 * 1024 * 1024; // 2MB em bytes

            if (file.size > maxFileSize) {
                profileMessage.textContent = 'Erro: O arquivo da logo é muito grande (máx 2MB).';
                profileMessage.classList.add('error');
                return;
            }

            logoStatus.textContent = 'Fazendo upload da logo...';
            const storageRef = storage.ref(`user-logos/${currentUser.uid}/logo.png`); // Caminho no Storage
            const uploadTask = storageRef.put(file);

            // Monitore o progresso do upload (opcional)
            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    logoStatus.textContent = `Upload: ${progress.toFixed(0)}%`;
                }, 
                (error) => {
                    console.error('Erro no upload da logo:', error);
                    logoStatus.textContent = 'Erro no upload da logo.';
                    profileMessage.textContent = 'Erro ao fazer upload da logo.';
                    profileMessage.classList.add('error');
                }, 
                async () => {
                    // Upload completo, obter URL de download
                    const downloadURL = await storageRef.getDownloadURL();
                    dataToUpdate.logoUrl = downloadURL; // Armazenar URL no Firestore
                    logoPreview.src = downloadURL; // Atualizar preview
                    logoStatus.textContent = 'Logo enviada com sucesso!';
                    
                    // Salvar dados no Firestore após o upload
                    await db.collection('users').doc(currentUser.uid).update(dataToUpdate);
                    profileMessage.textContent = 'Perfil atualizado com sucesso!';
                    profileMessage.classList.add('success');
                }
            );
        } else {
            // Se nenhuma logo nova foi selecionada, apenas atualiza os outros campos
            await db.collection('users').doc(currentUser.uid).update(dataToUpdate);
            profileMessage.textContent = 'Perfil atualizado com sucesso!';
            profileMessage.classList.add('success');
        }

    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        profileMessage.textContent = 'Erro ao salvar perfil. Tente novamente.';
        profileMessage.classList.add('error');
    }
});

// --- Voltar para o Dashboard ---
backToDashboardBtn.addEventListener('click', () => {
    window.location.href = '/dashboard.html';
});