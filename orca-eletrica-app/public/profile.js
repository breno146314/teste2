// public/profile.js

// **IMPORTANTE:** Removida a declaração de firebaseConfig aqui.
// O Firebase já é inicializado globalmente por dashboard.js.

// Obtém instâncias dos serviços Firebase (serão reatribuídas pelas instâncias passadas de dashboard.js)
let auth = firebase.auth(); // Estas variáveis ainda são necessárias
let db = firebase.firestore();
let storage = firebase.storage();

// --- Variáveis para Referências a Elementos HTML (serão atribuídas em initProfilePage) ---
let profileForm = null; let usernameInput = null; let emailInput = null; let companyNameInput = null;
let cnpjInput = null; let companyAddressInput = null; let companyPhoneInput = null;
let companyLogoInput = null; let logoPreview = null; let logoStatus = null;
let defaultTermsInput = null; let profileMessage = null; let backToDashboardBtn = null;
let loggedInEmailProfileSpan = null; let changePasswordLink = null;

let currentUser = null; // Variável para armazenar o usuário logado

// --- Funções Auxiliares Comuns (replicadas aqui para que profile.js funcione independentemente) ---
// Estas funções são tipicamente globais (definidas em dashboard.js)
// Mas são incluídas aqui para garantir que profile.js funcione mesmo se acessado diretamente.
// Se `window.showMessage` e `window.formatCurrency` são garantidos, estas podem ser removidas.
// Por segurança, vamos mantê-las por enquanto, mas com a prioridade de usar as globais.
function showMessage(element, msg, type) {
    if (window.showMessage && typeof window.showMessage === 'function') {
        window.showMessage(element, msg, type); // Usa a função global se disponível
    } else if (element) {
        element.textContent = msg;
        element.className = `alert alert-${type} mt-3 text-center`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message mt-3 text-center';
        }, 3000);
    }
}


/**
 * Ponto de entrada para inicializar a página de perfil quando carregada dinamicamente.
 * O dashboard.js chamará esta função.
 * @param {object} userObj O objeto de usuário autenticado.
 * @param {object} firestoreDb A instância do Firestore.
 * @param {object} firebaseAuth A instância do Auth.
 * @param {object} firebaseStorage A instância do Storage.
 */
window.initProfilePage = async function(userObj, firestoreDb, firebaseAuth, firebaseStorage) {
    console.log("profile.js: initProfilePage chamada. Obtendo referências de elementos.");
    // Reatribuir as instâncias do Firebase passadas pelo dashboard.js
    currentUser = userObj;
    db = firestoreDb;
    auth = firebaseAuth;
    storage = firebaseStorage;

    // --- Obter Referências dos Elementos HTML (APÓS o HTML ser injetado) ---
    // É crucial re-obter referências a cada vez que a página é carregada dinamicamente
    profileForm = document.getElementById('profileForm');
    usernameInput = document.getElementById('username');
    emailInput = document.getElementById('email');
    companyNameInput = document.getElementById('companyName');
    cnpjInput = document.getElementById('cnpj');
    companyAddressInput = document.getElementById('companyAddress');
    companyPhoneInput = document.getElementById('companyPhone');
    companyLogoInput = document.getElementById('companyLogo');
    logoPreview = document.getElementById('logoPreview');
    logoStatus = document.getElementById('logoStatus');
    defaultTermsInput = document.getElementById('defaultTerms');
    profileMessage = document.getElementById('profileMessage');
    backToDashboardBtn = document.getElementById('backToDashboard');
    loggedInEmailProfileSpan = document.getElementById('loggedInEmailProfile');
    changePasswordLink = document.getElementById('changePasswordLink');

    // **DEBBUGING: Verificar se os elementos foram encontrados**
    if (!profileForm) console.error("profile.js: ERRO - profileForm não encontrado!");
    if (!usernameInput) console.error("profile.js: ERRO - usernameInput não encontrado!");
    if (!loggedInEmailProfileSpan) console.error("profile.js: ERRO - loggedInEmailProfileSpan não encontrado!");
    // ... adicione mais checks para outros elementos se precisar de depuração visual


    // Carregar dados do perfil se o usuário estiver logado
    if (currentUser) {
        if (loggedInEmailProfileSpan) {
            loggedInEmailProfileSpan.textContent = currentUser.email;
        }
        await loadProfileData(currentUser.uid);
    } else {
        console.log('profile.js: Nenhum usuário logado. Redirecionando para login.');
        window.location.href = '/index.html'; // Redirecionamento de fallback
    }

    // --- Re-adicionar Event Listeners (CRÍTICO: Elementos são recriados a cada carga dinâmica) ---
    // Remova listeners antigos antes de adicionar novos para evitar duplicação.
    if (profileForm) profileForm.removeEventListener('submit', handleProfileFormSubmit);
    if (companyLogoInput) companyLogoInput.removeEventListener('change', handleLogoInputChange);
    if (backToDashboardBtn) backToDashboardBtn.removeEventListener('click', () => window.showSection('dashboardOverview'));
    if (changePasswordLink) changePasswordLink.removeEventListener('click', handleChangePassword);

    // Adiciona os event listeners
    if (profileForm) profileForm.addEventListener('submit', handleProfileFormSubmit);
    if (companyLogoInput) companyLogoInput.addEventListener('change', handleLogoInputChange);
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => window.showSection('dashboardOverview'));
    if (changePasswordLink) changePasswordLink.addEventListener('click', handleChangePassword);
};

// --- Carregar Dados do Perfil do Firestore ---
async function loadProfileData(uid) {
    if (profileMessage) showMessage(profileMessage, '', ''); // Limpa mensagens anteriores
    console.log("profile.js: Tentando carregar dados do usuário UID:", uid);
    try {
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get(); // <<-- ATENÇÃO: ERROS DE PERMISSÃO AQUI PODEM CAUSAR FALHA SILENCIOSA -->>
        
        if (userDoc.exists) {
            console.log("profile.js: Documento do usuário encontrado. Preenchendo campos.");
            const userData = userDoc.data();
            if (usernameInput) usernameInput.value = userData.username || '';
            if (emailInput) emailInput.value = userData.email || '';
            if (companyNameInput) companyNameInput.value = userData.companyName || '';
            if (cnpjInput) cnpjInput.value = userData.cnpj || '';
            if (companyAddressInput) companyAddressInput.value = userData.companyAddress || '';
            if (companyPhoneInput) companyPhoneInput.value = userData.companyPhone || '';
            if (defaultTermsInput) defaultTermsInput.value = userData.defaultTerms || '';

            if (logoPreview) { // Carregar logo da empresa se existir
                if (userData.logoUrl) {
                    logoPreview.src = userData.logoUrl;
                    logoPreview.style.display = 'block';
                    const noLogoText = document.getElementById('noLogoText');
                    if (noLogoText) noLogoText.style.display = 'none';
                    if (logoStatus) logoStatus.textContent = 'Logo atual carregada.';
                } else {
                    // Se não tiver logo URL no Firestore, mas há uma imagem de placeholder padrão
                    logoPreview.src = 'images/placeholder-logo.png';
                    logoPreview.style.display = 'block';
                    const noLogoText = document.getElementById('noLogoText');
                    if (noLogoText) noLogoText.style.display = 'block';
                    if (logoStatus) logoStatus.textContent = 'Nenhuma logo enviada ainda.';
                }
            }
        } else { 
            console.log('profile.js: Documento de usuário não encontrado no Firestore. Iniciando com campos vazios.');
            // Se o documento não existe (ex: primeiro login após cadastro), campos ficam vazios.
            // Garante que o preview da logo mostra o placeholder.
            if (logoPreview) logoPreview.src = 'images/placeholder-logo.png';
            const noLogoText = document.getElementById('noLogoText');
            if (noLogoText) noLogoText.style.display = 'block';
            if (logoStatus) logoStatus.textContent = 'Nenhuma logo enviada ainda.';
        }
    } catch (error) {
        console.error('profile.js: ERRO AO CARREGAR DADOS DO PERFIL - POSSÍVELMENTE REGRAS DO FIRESTORE!', error);
        if (profileMessage) showMessage(profileMessage, 'Erro ao carregar dados do perfil. Verifique as regras do Firestore.', 'danger');
    }
}

// --- Salvar Dados do Perfil ---
async function handleProfileFormSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
        if (profileMessage) showMessage(profileMessage, 'Nenhum usuário logado para salvar o perfil.', 'danger');
        return;
    }
    if (profileMessage) showMessage(profileMessage, '', ''); // Reseta mensagens
    console.log("profile.js: Tentando salvar dados do perfil.");

    const dataToUpdate = {
        username: usernameInput.value, companyName: companyNameInput.value, cnpj: cnpjInput.value,
        companyAddress: companyAddressInput.value, companyPhone: companyPhoneInput.value,
        defaultTerms: defaultTermsInput.value, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // 1. Upload da Logo (se um novo arquivo foi selecionado)
        if (companyLogoInput && companyLogoInput.files.length > 0) {
            const file = companyLogoInput.files[0];
            const maxFileSize = 2 * 1024 * 1024; // 2MB em bytes

            if (file.size > maxFileSize) {
                if (profileMessage) showMessage(profileMessage, 'Erro: O arquivo da logo é muito grande (máx 2MB).', 'danger');
                return;
            }

            if (logoStatus) logoStatus.textContent = 'Fazendo upload da logo...';
            console.log("profile.js: Iniciando upload da logo.");
            const storageRef = storage.ref(`user-logos/${currentUser.uid}/logo.png`); // Caminho no Storage
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed', 
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (logoStatus) logoStatus.textContent = `Upload: ${progress.toFixed(0)}%`;
                }, 
                (error) => {
                    console.error('profile.js: ERRO NO UPLOAD DA LOGO - POSSÍVELMENTE REGRAS DO STORAGE!', error);
                    if (logoStatus) logoStatus.textContent = 'Erro no upload da logo.';
                    if (profileMessage) showMessage(profileMessage, 'Erro ao fazer upload da logo. Verifique as regras do Storage.', 'danger');
                }, 
                async () => {
                    console.log("profile.js: Upload da logo concluído. Obtendo URL.");
                    const downloadURL = await storageRef.getDownloadURL();
                    dataToUpdate.logoUrl = downloadURL; // Armazenar URL no Firestore
                    if (logoPreview) logoPreview.src = downloadURL; // Atualizar preview
                    if (logoStatus) logoStatus.textContent = 'Logo enviada com sucesso!';
                    
                    // Salvar dados no Firestore após o upload
                    console.log("profile.js: Atualizando documento de usuário no Firestore após upload.");
                    await db.collection('users').doc(currentUser.uid).update(dataToUpdate); // <<-- ERRO DE PERMISSÃO AQUI? -->>
                    if (profileMessage) showMessage(profileMessage, 'Perfil atualizado com sucesso!', 'success');
                }
            );
        } else {
            // Se nenhuma logo nova foi selecionada, apenas atualiza os outros campos
            console.log("profile.js: Nenhuma logo nova. Apenas atualizando documento de usuário no Firestore.");
            await db.collection('users').doc(currentUser.uid).update(dataToUpdate); // <<-- ERRO DE PERMISSÃO AQUI? -->>
            if (profileMessage) showMessage(profileMessage, 'Perfil atualizado com sucesso!', 'success');
        }

    } catch (error) {
        console.error('profile.js: ERRO AO SALVAR PERFIL - POSSÍVELMENTE REGRAS DO FIRESTORE!', error);
        if (profileMessage) showMessage(profileMessage, 'Erro ao salvar perfil. Tente novamente. Verifique as regras do Firestore.', 'danger');
    }
}

// Handler para pré-visualização da logo
function handleLogoInputChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (logoPreview) logoPreview.src = e.target.result;
            if (logoPreview) logoPreview.style.display = 'block';
            const noLogoText = document.getElementById('noLogoText');
            if (noLogoText) noLogoText.style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        // Se o usuário desselecionar o arquivo, reverte para a logo salva ou placeholder
        // Tenta carregar a logo do Firestore novamente se existir
        if (currentUser && currentUser.uid && db) { // Verifica se db está disponível
            db.collection('users').doc(currentUser.uid).get().then(doc => {
                const userData = doc.data();
                if (userData && userData.logoUrl) {
                    if (logoPreview) logoPreview.src = userData.logoUrl;
                    if (logoStatus) logoStatus.textContent = 'Logo atual carregada.';
                } else {
                    if (logoPreview) logoPreview.src = 'images/placeholder-logo.png';
                    if (logoStatus) logoStatus.textContent = 'Nenhuma logo enviada ainda.';
                }
            }).catch(e => {
                console.error("profile.js: Erro ao carregar logo existente (fallback):", e);
                if (logoPreview) logoPreview.src = 'images/placeholder-logo.png';
                if (logoStatus) logoStatus.textContent = 'Nenhuma logo enviada ainda.';
            });
        } else {
            // Se não há usuário ou db não está disponível, mostra placeholder
            if (logoPreview) logoPreview.src = 'images/placeholder-logo.png';
            if (logoStatus) logoStatus.textContent = 'Nenhuma logo enviada ainda.';
        }
        if (logoPreview) logoPreview.style.display = 'block';
        const noLogoText = document.getElementById('noLogoText');
        if (noLogoText) noLogoText.style.display = 'block';
    }
}

async function handleChangePassword(e) {
    e.preventDefault();
    if (currentUser && currentUser.email) {
        try {
            await auth.sendPasswordResetEmail(currentUser.email);
            alert('Um e-mail de redefinição de senha foi enviado para ' + currentUser.email + '. Por favor, verifique sua caixa de entrada.');
        } catch (error) {
            console.error('profile.js: Erro ao enviar e-mail de redefinição:', error);
            alert('Erro ao enviar e-mail de redefinição. Tente novamente mais tarde.');
        }
    } else {
        alert('Não foi possível enviar o e-mail de redefinição. Por favor, faça login novamente.');
    }
}