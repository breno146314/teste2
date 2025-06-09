// public/dashboard.js

// **IMPORTANTE:** Cole a configuração REAL do seu projeto Firebase aqui!
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "orca-eleltrica.firebaseapp.com",
    projectId: "orca-eleltrica",
    storageBucket: "orca-eleltrica.firebasestorage.app",
    messagingSenderId: "48836864931",
    appId: "1:48836864931:web:9b1dc4579ebd254b570816",
    measurementId: "G-1XXEHV4E69"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém instâncias dos serviços Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// --- Elementos HTML do Dashboard ---
const loggedInUserEmail = document.getElementById('loggedInUserEmail'); // Email na sidebar (desktop)
const welcomeMessageNav = document.getElementById('welcomeMessageNav'); // Mensagem de boas-vindas na navbar superior
const logoutButtonNav = document.getElementById('logoutButtonNav'); // Botão de sair na navbar superior
const logoutButtonOffcanvas = document.getElementById('logoutButtonOffcanvas'); // Botão de sair no offcanvas (mobile)

const sidebarNavLinks = document.querySelectorAll('#sidebar-wrapper .list-group-item'); // Links de navegação da sidebar
const contentSections = document.querySelectorAll('#page-content-wrapper .content-section'); // Seções de conteúdo principal
const sidebarToggleBtn = document.getElementById('sidebarToggle'); // Botão de toggle da sidebar (mobile)
const wrapper = document.getElementById('wrapper'); // Elemento #wrapper para o toggle da sidebar

// Cards de atalho na Visão Geral (data-section para indicar qual seção carregar)
const dashboardQuickActionCards = document.querySelectorAll('#dashboardOverview [data-section]');

// --- Variáveis para Referências a Elementos das Páginas Carregadas Dinamicamente ---
// Estas variáveis serão reatribuídas dentro das funções de inicialização específicas de cada página (ex: initProfilePage).
// É essencial que elas estejam no escopo global para serem acessíveis a todos os handlers.
let profileForm = null; let usernameInput = null; let emailInput = null; let companyNameInput = null;
let cnpjInput = null; let companyAddressInput = null; let companyPhoneInput = null;
let companyLogoInput = null; let logoPreview = null; let logoStatus = null;
let defaultTermsInput = null; let profileMessage = null; let backToDashboardBtn = null;
let loggedInEmailProfileSpan = null; let changePasswordLink = null; // Renomeado para evitar conflito

let tabsContainer = null; let tabButtons = null; let tabContents = null;
let serviceForm = null; let serviceIdInput = null; let serviceNameInput = null;
let serviceDescriptionInput = null; let serviceUnitInput = null; let servicePriceInput = null;
let servicesList = null; let serviceMessage = null; let cancelServiceEditBtn = null;
let noServicesMessage = null;
let materialForm = null; let materialIdInput = null; let materialNameInput = null;
let materialDescriptionInput = null; let materialUnitInput = null; let materialPriceInput = null;
let materialsList = null; let materialMessage = null; let cancelMaterialEditBtn = null;
let noMaterialsMessage = null;
let predefinedItemSearchInput = null; let predefinedResultsDiv = null; let noPredefinedItemsMessage = null;
let allPredefinedItems = [];

let clientNameInput = null; let clientEmailInput = null; let clientPhoneInput = null;
let clientAddressInput = null; let itemSearchInput = null; let searchResultsDiv = null;
let manualItemNameInput = null; let manualItemDescriptionInput = null; let manualItemUnitInput = null;
let manualItemPriceInput = null; let manualItemQuantityInput = null;
let addManualItemBtn = null; let quotationItemsList = null; let subtotalDisplay = null;
let discountInput = null; let applyDiscountBtn = null; let totalDisplay = null;
let validityDaysInput = null; let paymentTermsInput = null; let observationsInput = null;
let generatePdfBtn = null; let saveDraftBtn = null; let clearQuotationBtn = null;
let quotationMessage = null;
let allAvailableItems = [];
let currentQuotationItems = [];


// --- Variáveis de Estado Global do Dashboard ---
let currentUser = null; // Usuário logado no momento
let authInitialized = false; // Flag para controlar o loop de redirecionamento


// --- Funções Auxiliares Comuns ---
function redirectToLogin() {
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 100);
}

function formatCurrency(value) {
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

function showMessage(element, msg, type) {
    if (element) {
        element.textContent = msg;
        // Use classes de alerta do Bootstrap para feedback visual
        element.className = `alert alert-${type} mt-3 text-center`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message mt-3 text-center'; // Reverte para a classe base
        }, 3000);
    }
}

/**
 * Exibe uma seção específica do dashboard e carrega seu conteúdo dinamicamente.
 * @param {string} sectionId O ID da seção a ser exibida (ex: 'dashboardOverview', 'accountSettingsSection').
 */
async function showSection(sectionId) {
    // Esconde todas as seções de conteúdo
    contentSections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none'; // Garante que o Bootstrap não interfira com display: block
    });

    // Remove a classe 'active' de todos os links da sidebar
    sidebarNavLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Mostra a seção desejada e ativa o link correspondente na sidebar
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block'; // Garante que a seção apareça
        const activeLink = document.querySelector(`#sidebar-wrapper .list-group-item[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // --- Lógica para Carregar Conteúdo Dinamicamente ---
    if (sectionId !== 'dashboardOverview') { // Não limpa a seção de Visão Geral
        const sectionMap = {
            'manageServicesSection': { url: '/manage-services.html', script: 'manage-services.js', initFunc: 'initManageServicesPage' },
            'accountSettingsSection': { url: '/profile.html', script: 'profile.js', initFunc: 'initProfilePage' },
            'createQuotationSection': { url: '/create-quotation.html', script: 'create-quotation.js', initFunc: 'initCreateQuotationPage' },
            'myQuotationsSection': { url: '/my-quotations.html', script: 'my-quotations.js', initFunc: 'initMyQuotationsPage' }
        };

        const currentSectionInfo = sectionMap[sectionId];
        if (currentSectionInfo) {
            // Placeholder de carregamento
            targetSection.innerHTML = `
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    <p class="mt-3">Carregando conteúdo...</p>
                </div>
            `;
            await loadContentIntoSection(currentSectionInfo.url, targetSection, currentSectionInfo.script, currentSectionInfo.initFunc);
        } else {
            console.warn(`Seção '${sectionId}' não possui configuração de carregamento dinâmico.`);
            targetSection.innerHTML = `<div class="alert alert-warning">Conteúdo não encontrado para esta seção.</div>`;
        }
    }
}

/**
 * Carrega o conteúdo HTML de uma URL e injeta em uma seção,
 * então executa o script JS associado e uma função de inicialização.
 * @param {string} url O caminho para o arquivo HTML a ser carregado.
 * @param {HTMLElement} targetSection O elemento HTML onde o conteúdo será injetado.
 * @param {string} scriptToLoad O caminho para o arquivo JS a ser executado.
 * @param {string} initFunctionName O nome da função global no script carregado para inicializar.
 */
async function loadContentIntoSection(url, targetSection, scriptToLoad, initFunctionName) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const contentToInjectElement = doc.body.querySelector('.container') || doc.body;
        targetSection.innerHTML = contentToInjectElement.innerHTML;

        // Remove scripts previamente carregados para evitar duplicação ou conflito
        const oldScript = document.getElementById(`dynamic-script-${targetSection.id}`);
        if (oldScript) {
            oldScript.remove();
        }

        // Cria e anexa o novo script
        const scriptElement = document.createElement('script');
        scriptElement.src = scriptToLoad;
        scriptElement.id = `dynamic-script-${targetSection.id}`;
        scriptElement.onload = () => {
            console.log(`${scriptToLoad} carregado e executado.`);
            // Chama a função de inicialização específica do script carregado, se existir
            if (window[initFunctionName] && typeof window[initFunctionName] === 'function') {
                window[initFunctionName](currentUser, db, auth, storage); // Passa dependências Firebase
            } else {
                console.warn(`Função de inicialização '${initFunctionName}' não encontrada em ${scriptToLoad}.`);
            }
        };
        scriptElement.onerror = (e) => {
            console.error(`Erro ao carregar script ${scriptToLoad}:`, e);
            targetSection.innerHTML = `<div class="alert alert-danger">Erro ao carregar o conteúdo. Por favor, tente novamente.</div>`;
        };
        document.body.appendChild(scriptElement);

    } catch (error) {
        console.error(`Erro ao carregar conteúdo de ${url}:`, error);
        targetSection.innerHTML = `<div class="alert alert-danger">Erro ao carregar o conteúdo: ${error.message}. Por favor, tente novamente.</div>`;
    }
}


// --- Autenticação e Carregamento Inicial do Dashboard ---
auth.onAuthStateChanged(async (user) => {
    if (!authInitialized) {
        authInitialized = true;
    }

    if (user) {
        currentUser = user;
        console.log('Usuário logado no dashboard:', user.email, user.uid);
        loggedInUserEmail.textContent = user.email; // Exibe o email na sidebar
        
        // Tentar buscar o nome de usuário do Firestore para mensagem de boas-vindas na navbar
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                welcomeMessageNav.textContent = `Olá, ${userData.username || user.email}!`; // Mensagem na navbar
            } else {
                welcomeMessageNav.textContent = `Olá, ${user.email}!`;
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuário no Firestore:', error);
            welcomeMessageNav.textContent = `Olá, ${user.email}!`;
        }
        
        // Exibir a seção de Visão Geral por padrão ao logar
        if (!document.querySelector('.content-section.active')) {
            showSection('dashboardOverview');
        }

    } else {
        console.log('Nenhum usuário logado. Redirecionando para login.');
        if (authInitialized) {
            redirectToLogin();
        }
    }
});


// --- Lógica de Logout ---
// Botão de sair na navbar
if (logoutButtonNav) { // Verificação para garantir que o elemento existe
    logoutButtonNav.addEventListener('click', async () => {
        try {
            await auth.signOut();
            redirectToLogin();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            alert('Erro ao sair. Tente novamente.');
        }
    });
}

// Botão de sair no offcanvas (mobile)
if (logoutButtonOffcanvas) { // Verificação para garantir que o elemento existe
    logoutButtonOffcanvas.addEventListener('click', async () => {
        try {
            await auth.signOut();
            redirectToLogin();
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            alert('Erro ao sair. Tente novamente.');
        }
    });
}


// --- Event Listeners para Links da Sidebar ---
sidebarNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = e.target.dataset.section;
        showSection(sectionId);
        // Fecha o offcanvas automaticamente após clicar no link (apenas em mobile)
        const offcanvasElement = document.getElementById('sidebarOffcanvas'); // ID do offcanvas no HTML
        const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (offcanvas) {
            offcanvas.hide();
        }
    });
});

// --- Event Listener para o Toggle da Sidebar (para Mobile e Desktop) ---
// Este é o botão que aparece na navbar para abrir/fechar a sidebar
if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
        const offcanvasElement = document.getElementById('sidebarOffcanvas');
        const offcanvas = new bootstrap.Offcanvas(offcanvasElement); // Cria uma nova instância se não existir
        offcanvas.toggle();
    });
}


// --- Event Listeners para Cards de Ação Rápida no Dashboard (Visão Geral) ---
dashboardQuickActionCards.forEach(card => {
    card.addEventListener('click', (e) => {
        const sectionId = e.currentTarget.dataset.section;
        showSection(sectionId);
    });
});


// --- Funções de Inicialização para Páginas Carregadas Dinamicamente ---
// Estas funções são definidas como globais (window.funcao) para que o dashboard.js
// possa chamá-las após carregar o HTML e o script correspondente.

// --- Funções de Inicialização para public/profile.js ---
window.initProfilePage = async function(userObj, firestoreDb, firebaseAuth, firebaseStorage) {
    // Reatribuir as instâncias do Firebase passadas pelo dashboard.js
    currentUser = userObj;
    db = firestoreDb;
    auth = firebaseAuth;
    storage = firebaseStorage;

    // --- Obter Referências dos Elementos HTML (após o HTML ser injetado) ---
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
    loggedInEmailProfileSpan = document.getElementById('loggedInEmailProfile'); // ID atualizado no HTML do perfil
    changePasswordLink = document.getElementById('changePasswordLink');

    // Carregar dados do perfil se o usuário estiver logado
    if (currentUser) {
        if (loggedInEmailProfileSpan) {
            loggedInEmailProfileSpan.textContent = currentUser.email; // Exibe o email na seção de segurança
        }
        await loadProfileData(currentUser.uid);
    } else {
        // Redirecionar se não houver usuário logado (dashboard.js já faz, mas é uma segurança)
        console.log('Nenhum usuário logado na página de perfil. Redirecionando...');
        window.location.href = '/index.html'; // Usar redirecionamento direto aqui
    }

    // --- Re-adicionar Event Listeners (CRÍTICO: Elementos são recriados a cada carga dinâmica) ---
    if (profileForm) profileForm.addEventListener('submit', handleProfileFormSubmit);
    if (companyLogoInput) companyLogoInput.addEventListener('change', handleLogoInputChange);
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => showSection('dashboardOverview'));
    if (changePasswordLink) changePasswordLink.addEventListener('click', handleChangePassword);
};

// Funções auxiliares para profile.js
async function loadProfileData(uid) {
    if (profileMessage) showMessage(profileMessage, '', ''); // Limpa mensagens anteriores
    try {
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
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
                    logoPreview.src = 'images/placeholder-logo.png';
                    logoPreview.style.display = 'block';
                    const noLogoText = document.getElementById('noLogoText');
                    if (noLogoText) noLogoText.style.display = 'block';
                    if (logoStatus) logoStatus.textContent = 'Nenhuma logo enviada ainda.';
                }
            }
        } else { console.log('Documento de usuário não encontrado no Firestore.'); }
    } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
        if (profileMessage) showMessage(profileMessage, 'Erro ao carregar dados do perfil.', 'error');
    }
}

async function handleProfileFormSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
        if (profileMessage) showMessage(profileMessage, 'Nenhum usuário logado para salvar o perfil.', 'error');
        return;
    }
    if (profileMessage) showMessage(profileMessage, '', ''); // Reseta mensagens
    const dataToUpdate = {
        username: usernameInput.value, companyName: companyNameInput.value, cnpj: cnpjInput.value,
        companyAddress: companyAddressInput.value, companyPhone: companyPhoneInput.value,
        defaultTerms: defaultTermsInput.value, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    try {
        if (companyLogoInput && companyLogoInput.files.length > 0) {
            const file = companyLogoInput.files[0];
            const maxFileSize = 2 * 1024 * 1024;
            if (file.size > maxFileSize) {
                if (profileMessage) showMessage(profileMessage, 'Erro: O arquivo da logo é muito grande (máx 2MB).', 'error');
                return;
            }
            if (logoStatus) logoStatus.textContent = 'Fazendo upload da logo...';
            const storageRef = storage.ref(`user-logos/${currentUser.uid}/logo.png`);
            const uploadTask = storageRef.put(file);
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (logoStatus) logoStatus.textContent = `Upload: ${progress.toFixed(0)}%`;
                },
                (error) => {
                    console.error('Erro no upload da logo:', error);
                    if (logoStatus) logoStatus.textContent = 'Erro no upload da logo.';
                    if (profileMessage) showMessage(profileMessage, 'Erro ao fazer upload da logo.', 'error');
                },
                async () => {
                    const downloadURL = await storageRef.getDownloadURL();
                    dataToUpdate.logoUrl = downloadURL;
                    if (logoPreview) logoPreview.src = downloadURL;
                    if (logoStatus) logoStatus.textContent = 'Logo enviada com sucesso!';
                    await db.collection('users').doc(currentUser.uid).update(dataToUpdate);
                    if (profileMessage) showMessage(profileMessage, 'Perfil atualizado com sucesso!', 'success');
                }
            );
        } else {
            await db.collection('users').doc(currentUser.uid).update(dataToUpdate);
            if (profileMessage) showMessage(profileMessage, 'Perfil atualizado com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        if (profileMessage) showMessage(profileMessage, 'Erro ao salvar perfil. Tente novamente.', 'error');
    }
}

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
        if (currentUser && currentUser.uid) {
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
                console.error("Erro ao carregar logo existente:", e);
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

async function handleChangePassword(e) { // <<-- AGORA É ASYNC
    e.preventDefault();
    if (currentUser && currentUser.email) {
        try {
            await auth.sendPasswordResetEmail(currentUser.email);
            alert('Um e-mail de redefinição de senha foi enviado para ' + currentUser.email + '. Por favor, verifique sua caixa de entrada.');
        } catch (error) {
            console.error('Erro ao enviar e-mail de redefinição:', error);
            alert('Erro ao enviar e-mail de redefinição. Tente novamente mais tarde.');
        }
    } else {
        alert('Não foi possível enviar o e-mail de redefinição. Por favor, faça login novamente.');
    }
}


// --- Funções de Inicialização para public/manage-services.js ---
window.initManageServicesPage = async function(user, firestoreDb, firebaseAuth) {
    currentUser = user;
    db = firestoreDb;
    auth = firebaseAuth;

    tabsContainer = document.querySelector('.tabs-container');
    tabButtons = document.querySelectorAll('.tab-button');
    tabContents = document.querySelectorAll('.tab-content');

    serviceForm = document.getElementById('serviceForm');
    serviceIdInput = document.getElementById('serviceId');
    serviceNameInput = document.getElementById('serviceName');
    serviceDescriptionInput = document.getElementById('serviceDescription');
    serviceUnitInput = document.getElementById('serviceUnit');
    servicePriceInput = document.getElementById('servicePrice');
    servicesList = document.getElementById('servicesList');
    serviceMessage = document.getElementById('serviceMessage');
    cancelServiceEditBtn = document.getElementById('cancelServiceEdit');
    noServicesMessage = document.getElementById('noServicesMessage');

    materialForm = document.getElementById('materialForm');
    materialIdInput = document.getElementById('materialId');
    materialNameInput = document.getElementById('materialName');
    materialDescriptionInput = document.getElementById('materialDescription');
    materialUnitInput = document.getElementById('materialUnit');
    materialPriceInput = document.getElementById('materialPrice');
    materialsList = document.getElementById('materialsList');
    materialMessage = document.getElementById('materialMessage');
    cancelMaterialEditBtn = document.getElementById('cancelMaterialEdit');
    noMaterialsMessage = document.getElementById('noMaterialsMessage');

    backToDashboardBtn = document.getElementById('backToDashboard');

    predefinedItemSearchInput = document.getElementById('predefinedItemSearch');
    predefinedResultsDiv = document.getElementById('predefinedResults');
    noPredefinedItemsMessage = document.getElementById('noPredefinedItemsMessage');

    // Remove listeners antigos para evitar duplicação
    if (tabsContainer) tabButtons.forEach(button => button.removeEventListener('click', handleTabClick));
    if (serviceForm) serviceForm.removeEventListener('submit', handleServiceFormSubmit);
    if (servicesList) servicesList.removeEventListener('click', handleServiceListClick);
    if (cancelServiceEditBtn) cancelServiceEditBtn.removeEventListener('click', cancelServiceEdit);
    if (materialForm) materialForm.removeEventListener('submit', handleMaterialFormSubmit);
    if (materialsList) materialsList.removeEventListener('click', handleMaterialListClick);
    if (cancelMaterialEditBtn) cancelMaterialEditBtn.removeEventListener('click', cancelMaterialEdit);
    if (backToDashboardBtn) backToDashboardBtn.removeEventListener('click', handleBackToDashboard);
    if (predefinedItemSearchInput) predefinedItemSearchInput.removeEventListener('input', handlePredefinedItemSearchInput);
    if (predefinedResultsDiv) predefinedResultsDiv.removeEventListener('click', handlePredefinedResultsClick);
    document.removeEventListener('click', handleDocumentClickToHidePredefinedResults); 

    // Re-adicionar Event Listeners
    if (tabsContainer) tabsContainer.addEventListener('click', handleTabClick);
    if (serviceForm) serviceForm.addEventListener('submit', handleServiceFormSubmit);
    if (servicesList) servicesList.addEventListener('click', handleServiceListClick);
    if (cancelServiceEditBtn) cancelServiceEditBtn.addEventListener('click', cancelServiceEdit);
    if (materialForm) materialForm.addEventListener('submit', handleMaterialFormSubmit);
    if (materialsList) materialsList.addEventListener('click', handleMaterialListClick);
    if (cancelMaterialEditBtn) cancelMaterialEditBtn.addEventListener('click', cancelMaterialEdit);
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', handleBackToDashboard);
    if (predefinedItemSearchInput) predefinedItemSearchInput.addEventListener('input', handlePredefinedItemSearchInput);
    if (predefinedResultsDiv) predefinedResultsDiv.addEventListener('click', handlePredefinedResultsClick);
    document.addEventListener('click', handleDocumentClickToHidePredefinedResults);


    if (currentUser) {
        await loadPredefinedItems();
        const activeTabButton = document.querySelector('.tab-button.active');
        if (activeTabButton && activeTabButton.dataset.tab === 'services') {
            loadServices(currentUser.uid);
        } else {
            loadMaterials(currentUser.uid);
        }
    }
};

// Funções auxiliares para manage-services.js (todas marcadas como async se usam await)
async function loadServices(uid) {
    if (!servicesList) return;
    servicesList.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Carregando serviços...</td></tr>';
    if (noServicesMessage) noServicesMessage.style.display = 'none';

    try {
        const servicesSnapshot = await db.collection('users').doc(uid).collection('services').orderBy('name').get();
        servicesList.innerHTML = '';
        if (servicesSnapshot.empty) {
            if (noServicesMessage) noServicesMessage.style.display = 'block';
        } else {
            servicesSnapshot.forEach(doc => {
                const service = doc.data();
                const row = servicesList.insertRow();
                row.insertCell(0).textContent = service.name;
                row.insertCell(1).textContent = service.unit;
                row.insertCell(2).textContent = `R$ ${formatCurrency(service.price)}`;
                const actionsCell = row.insertCell(3);
                actionsCell.innerHTML = `
                    <button class="btn btn-secondary btn-sm edit-btn" data-id="${doc.id}" data-type="service"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${doc.id}" data-type="service"><i class="bi bi-trash"></i></button>
                `;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        if (serviceMessage) showMessage(serviceMessage, 'Erro ao carregar serviços.', 'error');
        servicesList.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Erro ao carregar.</td></tr>';
    }
}

async function handleServiceFormSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;
    const id = serviceIdInput.value;
    const name = serviceNameInput.value;
    const description = serviceDescriptionInput.value;
    const unit = serviceUnitInput.value;
    const price = parseFloat(servicePriceInput.value);
    if (isNaN(price) || price < 0) {
        if (serviceMessage) showMessage(serviceMessage, 'Preço inválido. Digite um número positivo.', 'error');
        return;
    }
    try {
        const serviceRef = db.collection('users').doc(currentUser.uid).collection('services');
        if (id) {
            await serviceRef.doc(id).update({ name, description, unit, price, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            if (serviceMessage) showMessage(serviceMessage, 'Serviço atualizado com sucesso!', 'success');
        } else {
            await serviceRef.add({ name, description, unit, price, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            if (serviceMessage) showMessage(serviceMessage, 'Serviço adicionado com sucesso!', 'success');
        }
        serviceForm.reset(); serviceIdInput.value = ''; cancelServiceEditBtn.style.display = 'none';
        loadServices(currentUser.uid);
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        if (serviceMessage) showMessage(serviceMessage, 'Erro ao salvar serviço.', 'error');
    }
}

async function handleServiceListClick(e) {
    if (e.target.matches('.edit-btn') || e.target.closest('.edit-btn')) {
        const btn = e.target.closest('.edit-btn');
        const id = btn.dataset.id;
        const serviceDoc = await db.collection('users').doc(currentUser.uid).collection('services').doc(id).get();
        if (serviceDoc.exists) {
            const service = serviceDoc.data();
            serviceIdInput.value = id; serviceNameInput.value = service.name;
            serviceDescriptionInput.value = service.description; serviceUnitInput.value = service.unit;
            servicePriceInput.value = service.price; cancelServiceEditBtn.style.display = 'inline-block';
            if (serviceMessage) showMessage(serviceMessage, 'Editando serviço...', 'info');
        }
    } else if (e.target.matches('.delete-btn') || e.target.closest('.delete-btn')) {
        const btn = e.target.closest('.delete-btn');
        const id = btn.dataset.id;
        if (confirm('Tem certeza que deseja excluir este serviço?')) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('services').doc(id).delete();
                if (serviceMessage) showMessage(serviceMessage, 'Serviço excluído com sucesso!', 'success');
                loadServices(currentUser.uid);
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
                if (serviceMessage) showMessage(serviceMessage, 'Erro ao excluir serviço.', 'error');
            }
        }
    }
}

async function loadMaterials(uid) {
    if (!materialsList) return;
    materialsList.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Carregando materiais...</td></tr>';
    if (noMaterialsMessage) noMaterialsMessage.style.display = 'none';
    try {
        const materialsSnapshot = await db.collection('users').doc(uid).collection('materials').orderBy('name').get();
        materialsList.innerHTML = '';
        if (materialsSnapshot.empty) {
            if (noMaterialsMessage) noMaterialsMessage.style.display = 'block';
        } else {
            materialsSnapshot.forEach(doc => {
                const material = doc.data();
                const row = materialsList.insertRow();
                row.insertCell(0).textContent = material.name;
                row.insertCell(1).textContent = material.unit;
                row.insertCell(2).textContent = `R$ ${formatCurrency(material.price)}`;
                const actionsCell = row.insertCell(3);
                actionsCell.innerHTML = `
                    <button class="btn btn-secondary btn-sm edit-btn" data-id="${doc.id}" data-type="material"><i class="bi bi-pencil-square"></i></button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${doc.id}" data-type="material"><i class="bi bi-trash"></i></button>
                `;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
        if (materialMessage) showMessage(materialMessage, 'Erro ao carregar materiais.', 'error');
        materialsList.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Erro ao carregar.</td></tr>';
    }
}

async function handleMaterialFormSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;
    const id = materialIdInput.value;
    const name = materialNameInput.value;
    const description = materialDescriptionInput.value;
    const unit = materialUnitInput.value;
    const price = parseFloat(materialPriceInput.value);
    if (isNaN(price) || price < 0) {
        if (materialMessage) showMessage(materialMessage, 'Preço inválido. Digite um número positivo.', 'error');
        return;
    }
    try {
        const materialRef = db.collection('users').doc(currentUser.uid).collection('materials');
        if (id) {
            await materialRef.doc(id).update({ name, description, unit, price, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            if (materialMessage) showMessage(materialMessage, 'Material atualizado com sucesso!', 'success');
        } else {
            await materialRef.add({ name, description, unit, price, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            if (materialMessage) showMessage(materialMessage, 'Material adicionado com sucesso!', 'success');
        }
        materialForm.reset(); materialIdInput.value = ''; cancelMaterialEditBtn.style.display = 'none';
        loadMaterials(currentUser.uid);
    } catch (error) {
        console.error('Erro ao salvar material:', error);
        if (materialMessage) showMessage(materialMessage, 'Erro ao salvar material.', 'error');
    }
}

async function handleMaterialListClick(e) {
    if (e.target.matches('.edit-btn') || e.target.closest('.edit-btn')) {
        const btn = e.target.closest('.edit-btn');
        const id = btn.dataset.id;
        const materialDoc = await db.collection('users').doc(currentUser.uid).collection('materials').doc(id).get();
        if (materialDoc.exists) {
            const material = materialDoc.data();
            materialIdInput.value = id; materialNameInput.value = material.name;
            materialDescriptionInput.value = material.description; materialUnitInput.value = material.unit;
            materialPriceInput.value = material.price; cancelMaterialEditBtn.style.display = 'inline-block';
            if (materialMessage) showMessage(materialMessage, 'Editando material...', 'info');
        }
    } else if (e.target.matches('.delete-btn') || e.target.closest('.delete-btn')) {
        const btn = e.target.closest('.delete-btn');
        const id = btn.dataset.id;
        if (confirm('Tem certeza que deseja excluir este material?')) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('materials').doc(id).delete();
                if (materialMessage) showMessage(materialMessage, 'Material excluído com sucesso!', 'success');
                loadMaterials(currentUser.uid);
            } catch (error) {
                console.error('Erro ao excluir material:', error);
                if (materialMessage) showMessage(materialMessage, 'Erro ao excluir material.', 'error');
            }
        }
    }
}

function cancelMaterialEdit() {
    materialForm.reset(); materialIdInput.value = ''; cancelMaterialEditBtn.style.display = 'none';
    if (materialMessage) materialMessage.textContent = '';
}


// --- Funções de Inicialização para public/create-quotation.js ---
window.initCreateQuotationPage = async function(user, firestoreDb, firebaseAuth, firebaseStorage) {
    currentUser = user;
    db = firestoreDb;
    auth = firebaseAuth;
    storage = firebaseStorage;

    clientNameInput = document.getElementById('clientName');
    clientEmailInput = document.getElementById('clientEmail');
    clientPhoneInput = document.getElementById('clientPhone');
    clientAddressInput = document.getElementById('clientAddress');

    itemSearchInput = document.getElementById('itemSearch');
    searchResultsDiv = document.getElementById('searchResults');

    manualItemNameInput = document.getElementById('manualItemName');
    manualItemDescriptionInput = document.getElementById('manualItemDescription');
    manualItemUnitInput = document.getElementById('manualItemUnit');
    manualItemPriceInput = document.getElementById('manualItemPrice');
    manualItemQuantityInput = document.getElementById('manualItemQuantity');
    addManualItemBtn = document.getElementById('addManualItemBtn');

    quotationItemsList = document.getElementById('quotationItemsList');
    subtotalDisplay = document.getElementById('subtotalDisplay');
    discountInput = document.getElementById('discount');
    applyDiscountBtn = document.getElementById('applyDiscountBtn');
    totalDisplay = document.getElementById('totalDisplay');

    validityDaysInput = document.getElementById('validityDays');
    paymentTermsInput = document.getElementById('paymentTerms');
    observationsInput = document.getElementById('observations');

    generatePdfBtn = document.getElementById('generatePdfBtn');
    saveDraftBtn = document.getElementById('saveDraftBtn');
    clearQuotationBtn = document.getElementById('clearQuotationBtn');
    backToDashboardBtn = document.getElementById('backToDashboardBtn');

    quotationMessage = document.getElementById('quotationMessage');

    currentQuotationItems = []; // Reinicia os itens do orçamento

    if (currentUser) {
        await loadUserItems(currentUser.uid);
    }
    calculateTotal();
    renderQuotationItems();

    // Remove listeners antigos para evitar duplicação
    if (itemSearchInput) itemSearchInput.removeEventListener('input', handleItemSearchInput);
    if (searchResultsDiv) searchResultsDiv.removeEventListener('click', handleSearchResultsClick);
    document.removeEventListener('click', handleDocumentClickToHideSearchResults);
    if (addManualItemBtn) addManualItemBtn.removeEventListener('click', handleAddManualItem);
    if (quotationItemsList) {
        quotationItemsList.removeEventListener('change', handleQuotationItemsChange);
        quotationItemsList.removeEventListener('click', handleQuotationItemsClick);
    }
    if (applyDiscountBtn) applyDiscountBtn.removeEventListener('click', calculateTotal);
    if (discountInput) discountInput.removeEventListener('change', calculateTotal);
    if (generatePdfBtn) generatePdfBtn.removeEventListener('click', handleGeneratePdf);
    if (saveDraftBtn) saveDraftBtn.removeEventListener('click', handleSaveDraft);
    if (clearQuotationBtn) clearQuotationBtn.removeEventListener('click', handleClearQuotation);
    if (backToDashboardBtn) backToDashboardBtn.removeEventListener('click', () => window.showSection('dashboardOverview'));


    // Re-adicionar Event Listeners
    if (itemSearchInput) itemSearchInput.addEventListener('input', handleItemSearchInput);
    if (searchResultsDiv) searchResultsDiv.addEventListener('click', handleSearchResultsClick);
    document.addEventListener('click', handleDocumentClickToHideSearchResults);
    if (addManualItemBtn) addManualItemBtn.addEventListener('click', handleAddManualItem);

    if (quotationItemsList) {
        quotationItemsList.addEventListener('change', handleQuotationItemsChange);
        quotationItemsList.addEventListener('click', handleQuotationItemsClick);
    }

    if (applyDiscountBtn) applyDiscountBtn.addEventListener('click', calculateTotal);
    if (discountInput) discountInput.addEventListener('change', calculateTotal);

    if (generatePdfBtn) generatePdfBtn.addEventListener('click', handleGeneratePdf);
    if (saveDraftBtn) saveDraftBtn.addEventListener('click', handleSaveDraft);
    if (clearQuotationBtn) clearQuotationBtn.addEventListener('click', handleClearQuotation);
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => window.showSection('dashboardOverview'));
};

// Funções auxiliares para create-quotation.js (todas marcadas como async se usam await)
async function loadUserItems(uid) {
    allAvailableItems = [];
    try {
        const servicesSnapshot = await db.collection('users').doc(uid).collection('services').get();
        servicesSnapshot.forEach(doc => { allAvailableItems.push({ id: doc.id, type: 'service', ...doc.data() }); });
        const materialsSnapshot = await db.collection('users').doc(uid).collection('materials').get();
        materialsSnapshot.forEach(doc => { allAvailableItems.push({ id: doc.id, type: 'material', ...doc.data() }); });
    } catch (error) {
        console.error('Erro ao carregar serviços/materiais do usuário para orçamento:', error);
        if (quotationMessage) showMessage(quotationMessage, 'Erro ao carregar itens para busca.', 'error');
    }
}

function handleItemSearchInput(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (searchResultsDiv) searchResultsDiv.innerHTML = '';
    if (searchTerm.length < 2) { if (searchResultsDiv) searchResultsDiv.classList.remove('active'); return; }
    const filteredItems = allAvailableItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm))
    );
    if (filteredItems.length === 0) {
        if (searchResultsDiv) searchResultsDiv.innerHTML = '<div class="list-group-item text-center text-muted">Nenhum resultado encontrado.</div>';
        if (searchResultsDiv) searchResultsDiv.classList.add('active'); return;
    }
    filteredItems.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'justify-content-between', 'align-items-center');
        resultItem.innerHTML = `
            <div>
                <strong>${item.name}</strong> (${item.unit}) <br>
                <small class="text-muted">R$ ${formatCurrency(item.price)} ${item.description ? `- ${item.description}` : ''}</small>
            </div>
            <button class="btn btn-sm btn-outline-primary" data-id="${item.id}" data-type="${item.type}">Add</button>
        `;
        if (searchResultsDiv) searchResultsDiv.appendChild(resultItem);
    });
    if (searchResultsDiv) searchResultsDiv.classList.add('active');
}

function handleDocumentClickToHideSearchResults(e) {
    if (itemSearchInput && searchResultsDiv && !itemSearchInput.contains(e.target) && !searchResultsDiv.contains(e.target)) {
        searchResultsDiv.classList.remove('active');
    }
}

function handleSearchResultsClick(e) {
    if (e.target.matches('.add-to-quotation-btn') || e.target.closest('.add-to-quotation-btn')) {
        const btn = e.target.closest('.add-to-quotation-btn');
        const itemId = btn.dataset.id;
        const itemType = btn.dataset.type;
        const item = allAvailableItems.find(i => i.id === itemId && i.type === itemType);
        if (item) {
            addItemToQuotation(item.name, item.description, item.unit, item.price, 1);
            if (itemSearchInput) itemSearchInput.value = '';
            if (searchResultsDiv) searchResultsDiv.classList.remove('active');
        }
    }
}

function handleAddManualItem() {
    const name = manualItemNameInput.value;
    const description = manualItemDescriptionInput.value;
    const unit = manualItemUnitInput.value;
    const price = parseFloat(manualItemPriceInput.value);
    const quantity = parseInt(manualItemQuantityInput.value);

    if (!name || isNaN(price) || price < 0 || isNaN(quantity) || quantity <= 0) {
        if (quotationMessage) showMessage(quotationMessage, 'Preencha todos os campos obrigatórios do item manual (Nome, Preço, Qtd.).', 'error');
        return;
    }
    addItemToQuotation(name, description, unit, price, quantity);
    manualItemNameInput.value = ''; manualItemDescriptionInput.value = ''; manualItemUnitInput.value = '';
    manualItemPriceInput.value = ''; manualItemQuantityInput.value = '1';
    if (quotationMessage) showMessage(quotationMessage, 'Item manual adicionado!', 'success');
}

function addItemToQuotation(name, description, unit, price, quantity) {
    const item = { id: Date.now(), name, description: description || '', unit, price, quantity, total: price * quantity };
    currentQuotationItems.push(item);
    renderQuotationItems();
    calculateTotal();
}

function renderQuotationItems() {
    if (!quotationItemsList) return;
    quotationItemsList.innerHTML = '';
    if (currentQuotationItems.length === 0) {
        quotationItemsList.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum item adicionado ainda.</td></tr>';
        return;
    }
    currentQuotationItems.forEach(item => {
        const row = quotationItemsList.insertRow();
        row.dataset.id = item.id;
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.description}</td>
            <td>${item.unit}</td>
            <td><input type="number" class="form-control form-control-sm item-quantity-input" value="${item.quantity}" min="1" data-id="${item.id}" style="width: 70px;"></td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.total)}</td>
            <td><button class="btn btn-danger btn-sm remove-item-btn" data-id="${item.id}"><i class="bi bi-trash"></i></button></td>
        `;
    });
}

function handleQuotationItemsChange(e) {
    if (e.target.matches('.item-quantity-input')) {
        const itemId = parseInt(e.target.dataset.id);
        const newQuantity = parseInt(e.target.value);
        const itemIndex = currentQuotationItems.findIndex(item => item.id === itemId);
        if (itemIndex !== -1 && !isNaN(newQuantity) && newQuantity > 0) {
            currentQuotationItems[itemIndex].quantity = newQuantity;
            currentQuotationItems[itemIndex].total = currentQuotationItems[itemIndex].price * newQuantity;
            renderQuotationItems();
            calculateTotal();
        } else { e.target.value = currentQuotationItems[itemIndex].quantity; }
    }
}

function handleQuotationItemsClick(e) {
    if (e.target.matches('.remove-item-btn') || e.target.closest('.remove-item-btn')) {
        const btn = e.target.closest('.remove-item-btn');
        const itemId = parseInt(btn.dataset.id);
        if (confirm('Tem certeza que deseja remover este item do orçamento?')) {
            currentQuotationItems = currentQuotationItems.filter(item => item.id !== itemId);
            renderQuotationItems();
            calculateTotal();
            if (quotationMessage) showMessage(quotationMessage, 'Item removido!', 'info');
        }
    }
}

function calculateTotal() {
    let subtotal = currentQuotationItems.reduce((sum, item) => sum + item.total, 0);
    let total = subtotal;
    const discountValue = discountInput.value;
    if (discountValue) {
        let discountAmount = 0;
        if (discountValue.includes('%')) {
            const percentage = parseFloat(discountValue.replace('%', '')) / 100;
            if (!isNaN(percentage)) { discountAmount = subtotal * percentage; }
        } else { discountAmount = parseFloat(discountValue); }
        if (!isNaN(discountAmount)) {
            total = subtotal - discountAmount;
            if (total < 0) total = 0;
        }
    }
    subtotalDisplay.textContent = formatCurrency(subtotal);
    totalDisplay.textContent = formatCurrency(total);
}

async function handleGeneratePdf() {
    if (currentQuotationItems.length === 0) {
        if (quotationMessage) showMessage(quotationMessage, 'Adicione pelo menos um item ao orçamento antes de gerar o PDF.', 'error');
        return;
    }
    if (!clientNameInput.value) {
        if (quotationMessage) showMessage(quotationMessage, 'Preencha o nome do cliente antes de gerar o PDF.', 'error');
        return;
    }
    if (quotationMessage) showMessage(quotationMessage, 'Gerando orçamento em PDF... Aguarde!', 'info');

    const quotationData = {
        client: {
            name: clientNameInput.value, email: clientEmailInput.value,
            phone: clientPhoneInput.value, address: clientAddressInput.value,
        },
        items: currentQuotationItems,
        subtotal: parseFloat(subtotalDisplay.textContent.replace('R$', '').replace(',', '.')),
        discount: parseFloat(discountInput.value.replace('%', '').replace(',', '.')) || 0,
        total: parseFloat(totalDisplay.textContent.replace('R$', '').replace(',', '.')),
        validityDays: parseInt(validityDaysInput.value),
        paymentTerms: paymentTermsInput.value,
        observations: observationsInput.value,
    };
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            quotationData.companyInfo = userDoc.data();
        } else {
            if (quotationMessage) showMessage(quotationMessage, 'Erro: Dados da empresa não encontrados. Por favor, atualize seu perfil.', 'error');
            return;
        }
        
        const response = await fetch('SUA_URL_DA_CLOUD_FUNCTION_GERAR_PDF', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
            },
            body: JSON.stringify(quotationData)
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Orcamento_${quotationData.client.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            if (quotationMessage) showMessage(quotationMessage, 'Orçamento PDF gerado e baixado com sucesso!', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro desconhecido ao gerar PDF.');
        }
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        if (quotationMessage) showMessage(quotationMessage, `Erro ao gerar PDF: ${error.message}`, 'error');
    }
}

function handleSaveDraft() {
    if (quotationMessage) showMessage(quotationMessage, 'Funcionalidade de Salvar Rascunho em construção!', 'info');
}

function handleClearQuotation() {
    if (confirm('Tem certeza que deseja limpar todo o orçamento atual?')) {
        currentQuotationItems = [];
        renderQuotationItems();
        calculateTotal();
        if (clientNameInput) clientNameInput.value = '';
        if (clientEmailInput) clientEmailInput.value = '';
        if (clientPhoneInput) clientPhoneInput.value = '';
        if (clientAddressInput) clientAddressInput.value = '';
        if (discountInput) discountInput.value = '0';
        if (validityDaysInput) validityDaysInput.value = '30';
        if (paymentTermsInput) paymentTermsInput.value = '';
        if (observationsInput) observationsInput.value = '';
        if (quotationMessage) showMessage(quotationMessage, 'Orçamento limpo!', 'info');
    }
}

// --- Funções de Inicialização para public/my-quotations.js (Futuro) ---
window.initMyQuotationsPage = async function(user, firestoreDb, firebaseAuth) {
    currentUser = user;
    db = firestoreDb;
    auth = firebaseAuth;
    console.log('Página de Meus Orçamentos inicializada.');
};