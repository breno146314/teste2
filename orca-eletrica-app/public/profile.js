// public/profile.js

// **IMPORTANTE:** Removida a declaração de firebaseConfig aqui (já foi feita antes).
// **IMPORTANTE:** Removidas as declarações de instâncias Firebase aqui (já foi feita antes).
// O Firebase e suas instâncias (auth, db, storage) já são inicializados e acessíveis globalmente
// ou passados via window.initProfilePage.

// --- Variáveis para Referências a Elementos HTML (serão atribuídas APENAS EM initProfilePage) ---
// **CORREÇÃO:** Estas variáveis agora SÃO DECLARADAS SEM VALOR INICIAL GLOBALMENTE.
// Serão atribuídas com document.getElementById() DENTRO de initProfilePage.
// REMOVA AS DECLARAÇÕES 'let elemento = null;' DO TOPO SE EXISTIREM
// Elas serão apenas:
let profileForm; let usernameInput; let emailInput; let companyNameInput;
let cnpjInput; let companyAddressInput; let companyPhoneInput;
let companyLogoInput; let logoPreview; let logoStatus;
let defaultTermsInput; let profileMessage; let backToDashboardBtn;
let loggedInEmailProfileSpan; let changePasswordLink;

let currentUser = null; // Variável para armazenar o usuário logado (manter global)


// --- Funções Auxiliares Comuns (replicadas aqui para que profile.js funcione independentemente) ---
// Estas funções são tipicamente globais (definidas em dashboard.js ou um util.js)
// Mas são incluídas aqui para garantir que profile.js funcione mesmo se acessado diretamente.
// Usamos a verificação `window.showMessage` e `window.formatCurrency` para usar as globais se existirem.
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
    db = firestoreDb; // <<-- db é a instância passada
    auth = firebaseAuth; // <<-- auth é a instância passada
    storage = firebaseStorage; // <<-- storage é a instância passada

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
// Note que 'db' e 'profileMessage' são acessados aqui e são globais agora (ou passados)
async function loadProfileData(uid) {
    if (profileMessage) showMessage(profileMessage, '', '');
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
// Note que 'db', 'currentUser', 'profileMessage' são acessados aqui e são globais
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
                    dataToUpdate.logoUrl = downloadURL;
                    if (logoPreview) logoPreview.src = downloadURL;
                    if (logoStatus) logoStatus.textContent = 'Logo enviada com sucesso!';
                    
                    console.log("profile.js: Atualizando documento de usuário no Firestore após upload.");
                    await db.collection('users').doc(currentUser.uid).update(dataToUpdate);
                    if (profileMessage) showMessage(profileMessage, 'Perfil atualizado com sucesso!', 'success');
                }
            );
        } else {
            console.log("profile.js: Nenhuma logo nova. Apenas atualizando documento de usuário no Firestore.");
            await db.collection('users').doc(currentUser.uid).update(dataToUpdate);
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
        if (currentUser && currentUser.uid && db) {
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