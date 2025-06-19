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

// Botoes de Sair: AGORA COM OS IDs CORRETOS
const logoutButtonNav = document.getElementById('logoutButtonNav'); // Botao Sair da Navbar (desktop)
const logoutButtonOffcanvas = document.getElementById('logoutButtonOffcanvas'); // Botao Sair do Offcanvas (mobile)

const sidebarNavLinks = document.querySelectorAll('#sidebar-wrapper .list-group-item'); // Links de navegacao da sidebar
const contentSections = document.querySelectorAll('#page-content-wrapper .content-section'); // Seções de conteudo principal
const sidebarToggleBtn = document.getElementById('sidebarToggle'); // Botao de toggle da sidebar (mobile e desktop)
const wrapper = document.getElementById('wrapper'); // Elemento #wrapper para o toggle da sidebar

// Cards de atalho na Visao Geral (data-section para indicar qual secao carregar)
const dashboardQuickActionCards = document.querySelectorAll('#dashboardOverview [data-section]');

// --- Variáveis para Referências a Elementos das Páginas Carregadas Dinamicamente ---
// Estas variáveis serao reatribuidas dentro das funcoes de inicializacao específicas de cada página.
// É essencial que elas estejam no escopo global para serem acessíveis a todos os handlers.
let profileForm = null; let usernameInput = null; let emailInput = null; let companyNameInput = null;
let cnpjInput = null; let companyAddressInput = null; let companyPhoneInput = null;
let companyLogoInput = null; let logoPreview = null; let logoStatus = null;
let defaultTermsInput = null; let profileMessage = null; let backToDashboardBtn = null;
let loggedInEmailProfileSpan = null; let changePasswordLink = null;

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
let currentUser = null;
let authInitialized = false;


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
        element.className = `alert alert-${type} mt-3 text-center`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message mt-3 text-center`; // Retorna para a classe base
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
        section.style.display = 'none'; // Garante que o Bootstrap nao interfira com display: block
    });

    // Remove a classe 'active' de todos os links da sidebar
    sidebarNavLinks.forEach(link => {
        link.classList.remove('active');
    });

    // Mostra a seção desejada e ativa o link correspondente na sidebar
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block'; // Garante que a secao apareca
        const activeLink = document.querySelector(`#sidebar-wrapper .list-group-item[data-section="${sectionId}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // --- Lógica para Carregar Conteúdo Dinamicamente ---
    if (sectionId !== 'dashboardOverview') { // Nao limpa a secao de Visao Geral
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
                    <p class="mt-3">Carregando conteudo...</p>
                </div>
            `;
            await loadContentIntoSection(currentSectionInfo.url, targetSection, currentSectionInfo.script, currentSectionInfo.initFunc);
        } else {
            console.warn(`Seção '${sectionId}' não possui configuração de carregamento dinamico.`);
            targetSection.innerHTML = `<div class="alert alert-warning">Conteudo nao encontrado para esta secao.</div>`;
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

        // Remove scripts previamente carregados para evitar duplicacao ou conflito
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
                window[initFunctionName](currentUser, db, auth, storage); // Passa dependencias Firebase
            } else {
                console.warn(`Funcao de inicializacao '${initFunctionName}' nao encontrada em ${scriptToLoad}.`);
            }
        };
        scriptElement.onerror = (e) => {
            console.error(`Erro ao carregar script ${scriptToLoad}:`, e);
            targetSection.innerHTML = `<div class="alert alert-danger">Erro ao carregar o conteudo. Por favor, tente novamente.</div>`;
        };
        document.body.appendChild(scriptElement);

    } catch (error) {
        console.error(`Erro ao carregar conteudo de ${url}:`, error);
        targetSection.innerHTML = `<div class="alert alert-danger">Erro ao carregar o conteudo: ${error.message}. Por favor, tente novamente.</div>`;
    }
}


// --- Autenticacao e Carregamento Inicial do Dashboard ---
auth.onAuthStateChanged(async (user) => {
    if (!authInitialized) {
        authInitialized = true;
    }

    if (user) {
        currentUser = user;
        console.log('Usuario logado no dashboard:', user.email, user.uid);
        if (loggedInUserEmail) loggedInUserEmail.textContent = user.email; // Exibe o email na sidebar
        
        // Tentar buscar o nome de usuario do Firestore para mensagem de boas-vindas na navbar
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                if (welcomeMessageNav) welcomeMessageNav.textContent = `Ola, ${userData.username || user.email}!`; // Mensagem na navbar
            } else {
                if (welcomeMessageNav) welcomeMessageNav.textContent = `Ola, ${user.email}!`;
            }
        } catch (error) {
            console.error('Erro ao buscar dados do usuario no Firestore:', error);
            if (welcomeMessageNav) welcomeMessageNav.textContent = `Ola, ${user.email}!`;
        }
        
        // Exibir a secao de Visao Geral por padrao ao logar
        if (!document.querySelector('.content-section.active')) {
            showSection('dashboardOverview');
        }

    } else {
        console.log('Nenhum usuario logado. Redirecionando para login.');
        if (authInitialized) {
            redirectToLogin();
        }
    }
});


// --- Logica de Logout ---
// Botao de sair na navbar
if (logoutButtonNav) { // Verificacao para garantir que o elemento existe
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

// Botao de sair no offcanvas (mobile)
if (logoutButtonOffcanvas) { // Verificacao para garantir que o elemento existe
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
        // Fecha o offcanvas automaticamente apos clicar no link (apenas em mobile)
        const offcanvasElement = document.getElementById('sidebarOffcanvas'); // ID do offcanvas no HTML
        const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (offcanvas) {
            offcanvas.hide();
        }
    });
});

// --- Event Listener para o Toggle da Sidebar (para Mobile e Desktop) ---
if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
        const offcanvasElement = document.getElementById('sidebarOffcanvas');
        // A instancia do offcanvas já pode existir se foi aberta antes
        let offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (!offcanvas) { // Se nao existe, cria uma nova
            offcanvas = new bootstrap.Offcanvas(offcanvasElement);
        }
        offcanvas.toggle();
    });
}


// --- Event Listeners para Cards de Acao Rapida no Dashboard (Visao Geral) ---
dashboardQuickActionCards.forEach(card => {
    card.addEventListener('click', (e) => {
        const sectionId = e.currentTarget.dataset.section;
        showSection(sectionId);
    });
});


// --- Funções de Inicialização para Páginas Carregadas Dinamicamente ---
// Estas funcoes sao definidas como globais (window.funcao) para que o dashboard.js
// possa chamá-las apos carregar o HTML e o script correspondente.

// Funcoes Auxiliares Gerais (usadas por varias paginas)
function formatCurrency(value) {
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

function showMessage(element, msg, type) {
    if (element) {
        element.textContent = msg;
        element.className = `alert alert-${type} mt-3 text-center`;
        setTimeout(() => {
            element.textContent = '';
            element.className = 'message mt-3 text-center';
        }, 3000);
    }
}


// --- Funções de Inicialização para public/profile.js ---
window.initProfilePage = async function(userObj, firestoreDb, firebaseAuth, firebaseStorage) {
    // Reatribuir as instancias do Firebase passadas pelo dashboard.js
    currentUser = userObj;
    db = firestoreDb;
    auth = firebaseAuth;
    storage = firebaseStorage;

    // --- Obter Referencias dos Elementos HTML (apos o HTML ser injetado) ---
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

    // Carregar dados do perfil se o usuario estiver logado
    if (currentUser) {
        if (loggedInEmailProfileSpan) {
            loggedInEmailProfileSpan.textContent = currentUser.email;
        }
        await loadProfileData(currentUser.uid);
    } else {
        console.log('Nenhum usuario logado na pagina de perfil. Redirecionando...');
        window.location.href = '/index.html';
    }

    // --- Re-adicionar Event Listeners (CRITICO: Elementos sao recriados a cada carga dinamica) ---
    if (profileForm) profileForm.addEventListener('submit', handleProfileFormSubmit);
    if (companyLogoInput) companyLogoInput.addEventListener('change', handleLogoInputChange);
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => window.showSection('dashboardOverview'));
    if (changePasswordLink) changePasswordLink.addEventListener('click', handleChangePassword);
};

// Funcoes auxiliares para profile.js
async function loadProfileData(uid) {
    if (profileMessage) showMessage(profileMessage, '', '');
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

            if (logoPreview) {
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
        } else { console.log('Documento de usuario nao encontrado no Firestore.'); }
    } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
        if (profileMessage) showMessage(profileMessage, 'Erro ao carregar dados do perfil.', 'error');
    }
}

async function handleProfileFormSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
        if (profileMessage) showMessage(profileMessage, 'Nenhum usuario logado para salvar o perfil.', 'error');
        return;
    }
    if (profileMessage) showMessage(profileMessage, '', '');
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
                if (profileMessage) showMessage(profileMessage, 'Erro: O arquivo da logo é muito grande (max 2MB).', 'error');
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

async function handleChangePassword(e) {
    e.preventDefault();
    if (currentUser && currentUser.email) {
        try {
            await auth.sendPasswordResetEmail(currentUser.email);
            alert('Um e-mail de redefinicao de senha foi enviado para ' + currentUser.email + '. Por favor, verifique sua caixa de entrada.');
        } catch (error) {
            console.error('Erro ao enviar e-mail de redefinicao:', error);
            alert('Erro ao enviar e-mail de redefinicao. Tente novamente mais tarde.');
        }
    } else {
        alert('Nao foi possivel enviar o e-mail de redefinicao. Por favor, faca login novamente.');
    }
}


// --- Funcoes de Inicializacao para public/manage-services.js ---
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

    // Remove listeners antigos para evitar duplicacao
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

// Funcoes auxiliares para manage-services.js (todas marcadas como async se usam await)
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
        if (serviceMessage) showMessage(serviceMessage, 'Preco invalido. Digite um numero positivo.', 'error');
        return;
    }
    try {
        const serviceRef = db.collection('users').doc(currentUser.uid).collection('services');
        if (id) {
            await serviceRef.doc(id).update({ name, description, unit, price, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            if (serviceMessage) showMessage(serviceMessage, 'Servico atualizado com sucesso!', 'success');
        } else {
            await serviceRef.add({ name, description, unit, price, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            if (serviceMessage) showMessage(serviceMessage, 'Servico adicionado com sucesso!', 'success');
        }
        serviceForm.reset(); serviceIdInput.value = ''; cancelServiceEditBtn.style.display = 'none';
        loadServices(currentUser.uid);
    } catch (error) {
        console.error('Erro ao salvar servico:', error);
        if (serviceMessage) showMessage(serviceMessage, 'Erro ao salvar servico.', 'error');
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
            if (serviceMessage) showMessage(serviceMessage, 'Editando servico...', 'info');
        }
    } else if (e.target.matches('.delete-btn') || e.target.closest('.delete-btn')) {
        const btn = e.target.closest('.delete-btn');
        const id = btn.dataset.id;
        if (confirm('Tem certeza que deseja excluir este servico?')) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('services').doc(id).delete();
                if (serviceMessage) showMessage(serviceMessage, 'Servico excluido com sucesso!', 'success');
                loadServices(currentUser.uid);
            } catch (error) {
                console.error('Erro ao excluir servico:', error);
                if (serviceMessage) showMessage(serviceMessage, 'Erro ao excluir servico.', 'error');
            }
        }
    }
}

function cancelServiceEdit() {
    serviceForm.reset(); serviceIdInput.value = ''; cancelServiceEditBtn.style.display = 'none';
    if (serviceMessage) serviceMessage.textContent = '';
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
        if (materialMessage) showMessage(materialMessage, 'Preco invalido. Digite um numero positivo.', 'error');
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

    predefinedQuoteItemSearchInput = document.getElementById('predefinedQuoteItemSearch');
    predefinedQuoteResultsDiv = document.getElementById('predefinedQuoteResults');
    noPredefinedQuoteItemsMessage = document.getElementById('noPredefinedQuoteItemsMessage');

    userItemSearchInput = document.getElementById('userItemSearch');
    userSearchResultsDiv = document.getElementById('userSearchResults');

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

    // Remove listeners antigos
    if (predefinedQuoteItemSearchInput) predefinedQuoteItemSearchInput.removeEventListener('input', handlePredefinedQuoteItemSearchInput);
    if (predefinedQuoteResultsDiv) predefinedQuoteResultsDiv.removeEventListener('click', handlePredefinedQuoteResultsClick);
    document.removeEventListener('click', handleDocumentClickToHidePredefinedQuoteResults); 

    if (userItemSearchInput) userItemSearchInput.removeEventListener('input', handleUserItemSearchInput);
    if (userSearchResultsDiv) userSearchResultsDiv.removeEventListener('click', handleUserSearchResultsClick);
    document.removeEventListener('click', handleDocumentClickToHideUserSearchResults); 

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
    if (backToDashboardBtn) backToDashboardBtn.removeEventListener('click', handleBackToDashboard);


    // Re-adicionar Event Listeners
    if (predefinedQuoteItemSearchInput) predefinedQuoteItemSearchInput.addEventListener('input', handlePredefinedQuoteItemSearchInput);
    if (predefinedQuoteResultsDiv) predefinedQuoteResultsDiv.addEventListener('click', handlePredefinedQuoteResultsClick);
    document.addEventListener('click', handleDocumentClickToHidePredefinedQuoteResults);

    if (userItemSearchInput) userItemSearchInput.addEventListener('input', handleUserItemSearchInput);
    if (userSearchResultsDiv) userSearchResultsDiv.addEventListener('click', handleUserSearchResultsClick);
    document.addEventListener('click', handleDocumentClickToHideUserSearchResults);

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
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', handleBackToDashboard);

    // Carregar itens disponiveis (ambos predefinidos e do usuario)
    if (currentUser) {
        await loadPredefinedItemsForQuotation(); // Nova funcao para carregar predefinidos
        await loadUserItemsForQuotation(currentUser.uid); // Funcao existente para itens do usuario
    }
    calculateTotal();
    renderQuotationItems();
};

// Funcoes auxiliares para create-quotation.js
async function loadPredefinedItemsForQuotation() {
    allPredefinedQuoteItems = [];
    try {
        const predefinedSnapshot = await db.collection('predefinedServices').get();
        predefinedSnapshot.forEach(doc => { allPredefinedQuoteItems.push({ id: doc.id, ...doc.data() }); });
        console.log('Itens predefinidos para orcamento carregados:', allPredefinedQuoteItems.length);
        renderPredefinedQuoteItems(allPredefinedQuoteItems);
    } catch (error) {
        console.error('Erro ao carregar itens predefinidos para orcamento:', error);
        if (predefinedQuoteResultsDiv) {
            predefinedQuoteResultsDiv.innerHTML = '<div class="alert alert-danger text-center">Erro ao carregar sugestoes.</div>';
            predefinedQuoteResultsDiv.style.display = 'block';
        }
    }
}

function renderPredefinedQuoteItems(itemsToRender) {
    if (!predefinedQuoteResultsDiv) return;
    predefinedQuoteResultsDiv.innerHTML = '';
    if (itemsToRender.length === 0) {
        if (noPredefinedQuoteItemsMessage) noPredefinedQuoteItemsMessage.style.display = 'block';
        predefinedQuoteResultsDiv.style.display = 'none';
        return;
    }
    if (noPredefinedQuoteItemsMessage) noPredefinedQuoteItemsMessage.style.display = 'none';

    itemsToRender.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'justify-content-between', 'align-items-center');
        itemElement.innerHTML = `
            <div>
                <strong>${item.name}</strong> (${item.unit}) <br>
                <small class="text-muted">R$ ${formatCurrency(item.price)} ${item.description ? `- ${item.description}` : ''}</small>
            </div>
            <button class="btn btn-sm btn-outline-primary add-to-quotation-btn"
                    data-name="${item.name}"
                    data-description="${item.description || ''}"
                    data-unit="${item.unit}"
                    data-price="${item.price}"
                    data-source="predefined">
                Add
            </button>
        `;
        predefinedQuoteResultsDiv.appendChild(itemElement);
    });
    predefinedQuoteResultsDiv.style.display = 'block';
}

function handlePredefinedQuoteItemSearchInput(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (searchTerm.length < 2 && searchTerm.length > 0) {
        renderPredefinedQuoteItems(allPredefinedQuoteItems);
        return;
    }
    const filteredItems = allPredefinedQuoteItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm)) ||
        item.unit.toLowerCase().includes(searchTerm)
    );
    renderPredefinedQuoteItems(filteredItems);
}

function handlePredefinedQuoteResultsClick(e) {
    if (e.target.matches('.add-to-quotation-btn') || e.target.closest('.add-to-quotation-btn')) {
        const btn = e.target.closest('.add-to-quotation-btn');
        const name = btn.dataset.name;
        const description = btn.dataset.description;
        const unit = btn.dataset.unit;
        const price = parseFloat(btn.dataset.price);
        addItemToQuotation(name, description, unit, price, 1); // Quantidade padrao 1
        if (predefinedQuoteItemSearchInput) predefinedQuoteItemSearchInput.value = '';
        if (predefinedQuoteResultsDiv) predefinedQuoteResultsDiv.classList.remove('active');
        if (quotationMessage) showMessage(quotationMessage, `${name} adicionado do item padrao!`, 'success');
    }
}

function handleDocumentClickToHidePredefinedQuoteResults(e) {
    if (predefinedQuoteItemSearchInput && predefinedQuoteResultsDiv && !predefinedQuoteItemSearchInput.contains(e.target) && !predefinedQuoteResultsDiv.contains(e.target)) {
        predefinedQuoteResultsDiv.style.display = 'none';
    }
}

async function loadUserItemsForQuotation(uid) {
    allAvailableUserItems = [];
    try {
        const servicesSnapshot = await db.collection('users').doc(uid).collection('services').get();
        servicesSnapshot.forEach(doc => { allAvailableUserItems.push({ id: doc.id, type: 'service', ...doc.data() }); });
        const materialsSnapshot = await db.collection('users').doc(uid).collection('materials').get();
        materialsSnapshot.forEach(doc => { allAvailableUserItems.push({ id: doc.id, type: 'material', ...doc.data() }); });
    } catch (error) {
        console.error('Erro ao carregar servicos/materiais do usuario para orcamento:', error);
        if (quotationMessage) showMessage(quotationMessage, 'Erro ao carregar itens para busca.', 'error');
    }
}

function handleUserItemSearchInput(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (userSearchResultsDiv) userSearchResultsDiv.innerHTML = '';
    if (searchTerm.length < 2) { if (userSearchResultsDiv) userSearchResultsDiv.classList.remove('active'); return; }
    const filteredItems = allAvailableUserItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm))
    );
    if (filteredItems.length === 0) {
        if (userSearchResultsDiv) userSearchResultsDiv.innerHTML = '<div class="list-group-item text-center text-muted">Nenhum resultado encontrado.</div>';
        if (userSearchResultsDiv) userSearchResultsDiv.classList.