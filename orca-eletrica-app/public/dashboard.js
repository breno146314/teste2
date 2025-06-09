// public/dashboard.js

// **IMPORTANTE:** Cole a configuração REAL do seu projeto Firebase aqui!
// Exemplo (substitua pelos SEUS valores):
const firebaseConfig = {
    apiKey: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI",
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
const welcomeMessage = document.getElementById('welcomeMessage'); // Mensagem de boas-vindas principal
const logoutButton = document.getElementById('logoutButton'); // Botão de sair na sidebar
const sidebarNavLinks = document.querySelectorAll('#sidebar-wrapper .list-group-item'); // Links de navegação da sidebar
const contentSections = document.querySelectorAll('#page-content-wrapper .content-section'); // Seções de conteúdo principal
const sidebarToggleBtn = document.getElementById('sidebarToggle'); // Botão de toggle da sidebar (mobile)
const wrapper = document.getElementById('wrapper'); // Elemento #wrapper para o toggle da sidebar

// Itens específicos do dashboard de visão geral (cards de atalho)
const quickCreateQuotationBtn = document.getElementById('quickCreateQuotation');
const quickViewQuotationsBtn = document.getElementById('quickViewQuotations');

// --- Variáveis para Referências a Elementos das Páginas Carregadas Dinamicamente ---
// Estas variáveis serão reatribuídas dentro da função showSection
// para garantir que os event listeners sejam anexados aos elementos corretos.
let profileForm = null;
let usernameInput = null;
let emailInput = null;
let companyNameInput = null;
let cnpjInput = null;
let companyAddressInput = null;
let companyPhoneInput = null;
let companyLogoInput = null;
let logoPreview = null;
let logoStatus = null;
let defaultTermsInput = null;
let profileMessage = null;
let backToDashboardBtn = null; // Botão de voltar para o dashboard da página de perfil

let serviceForm = null; // Formulário de serviço
let serviceIdInput = null;
let serviceNameInput = null;
let serviceDescriptionInput = null;
let serviceUnitInput = null;
let servicePriceInput = null;
let servicesList = null; // Tabela de serviços
let serviceMessage = null;
let cancelServiceEditBtn = null;
let noServicesMessage = null;

let materialForm = null; // Formulário de material
let materialIdInput = null;
let materialNameInput = null;
let materialDescriptionInput = null;
let materialUnitInput = null;
let materialPriceInput = null;
let materialsList = null; // Tabela de materiais
let materialMessage = null;
let cancelMaterialEditBtn = null;
let noMaterialsMessage = null;

let quotationMessage = null; // Mensagem de feedback da página de orçamento
let clientNameInput = null; // Campos da página de orçamento
let clientEmailInput = null;
let clientPhoneInput = null;
let clientAddressInput = null;
let itemSearchInput = null;
let searchResultsDiv = null;
let manualItemNameInput = null;
let manualItemDescriptionInput = null;
let manualItemUnitInput = null;
let manualItemPriceInput = null;
let manualItemQuantityInput = null;
let addManualItemBtn = null;
let quotationItemsList = null;
let subtotalDisplay = null;
let discountInput = null;
let applyDiscountBtn = null;
let totalDisplay = null;
let validityDaysInput = null;
let paymentTermsInput = null;
let observationsInput = null;
let generatePdfBtn = null;
let saveDraftBtn = null;
let clearQuotationBtn = null;

let allAvailableItems = []; // Itens (serviços e materiais) do usuário
let currentQuotationItems = []; // Itens atualmente no orçamento

// --- Variáveis de Estado Global ---
let currentUser = null; // Usuário logado no momento
let authInitialized = false; // Flag para controlar o loop de redirecionamento


// --- Funções Auxiliares ---
function redirectToLogin() {
    // Adiciona um pequeno atraso para evitar redirecionamentos muito rápidos
    // que podem ser capturados pela navegação do histórico do navegador.
    setTimeout(() => {
        window.location.href = '/index.html';
    }, 100);
}

/**
 * Exibe uma seção específica do dashboard e carrega seu conteúdo dinamicamente.
 * @param {string} sectionId O ID da seção a ser exibida (ex: 'dashboardOverview', 'accountSettingsSection').
 */
async function showSection(sectionId) {
    // Esconde todas as seções de conteúdo e remove a classe 'active'
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
    // Limpa o conteúdo das seções dinâmicas antes de carregar o novo
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

        // Extrai o conteúdo relevante do HTML do fragmento
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
                // Passa as dependências do Firebase como argumentos
                window[initFunctionName](currentUser, db, auth, storage);
            } else {
                console.warn(`Função de inicialização '${initFunctionName}' não encontrada em ${scriptToLoad}.`);
            }
        };
        scriptElement.onerror = (e) => {
            console.error(`Erro ao carregar script ${scriptToLoad}:`, e);
            targetSection.innerHTML = `<div class="alert alert-danger">Erro ao carregar o conteúdo. Por favor, tente novamente.</div>`;
        };
        document.body.appendChild(scriptElement); // Anexa o script ao body

    } catch (error) {
        console.error(`Erro ao carregar conteúdo de ${url}:`, error);
        targetSection.innerHTML = `<div class="alert alert-danger">Erro ao carregar o conteúdo: ${error.message}. Por favor, tente novamente.</div>`;
    }
}


// --- Autenticação e Carregamento Inicial do Dashboard ---
auth.onAuthStateChanged(async (user) => {
    // A flag `authInitialized` garante que só redirecionamos para o login
    // depois que o Firebase Auth tiver uma resposta definitiva sobre o usuário.
    if (!authInitialized) {
        authInitialized = true;
    }

    if (user) {
        currentUser = user;
        console.log('Usuário logado no dashboard:', user.email, user.uid);
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
        
        // Exibir a seção de Visão Geral por padrão ao logar, se nenhuma seção estiver ativa
        if (!document.querySelector('.content-section.active')) {
            showSection('dashboardOverview');
        }

    } else {
        // Usuário NÃO está logado
        console.log('Nenhum usuário logado. Redirecionando para login.');
        // SOMENTE redireciona se o Firebase Auth já tiver tido tempo de inicializar e determinar
        // que o usuário NÃO está logado de forma definitiva.
        if (authInitialized) {
            redirectToLogin();
        }
    }
});


// --- Lógica de Logout ---
logoutButton.addEventListener('click', async () => {
    try {
        await auth.signOut();
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
        // Fechar o offcanvas automaticamente após clicar no link (apenas em mobile)
        // Isso usa o JS do Bootstrap, que é carregado via bootstrap.bundle.min.js
        const offcanvasElement = document.getElementById('sidebar-wrapper');
        const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
        if (offcanvas) {
            offcanvas.hide();
        }
    });
});

// --- Event Listener para o Toggle da Sidebar (para Mobile) ---
// Este é o botão que aparece na navbar em telas pequenas
const sidebarToggle = document.getElementById('sidebarToggle');
if (sidebarToggle) { // Garante que o botão existe
    sidebarToggle.addEventListener('click', () => {
        const offcanvasElement = document.getElementById('sidebar-wrapper');
        const offcanvas = new bootstrap.Offcanvas(offcanvasElement); // Cria uma nova instância se não existir
        offcanvas.toggle();
    });
}


// --- Event Listeners para Cards de Ação Rápida no Dashboard (Visão Geral) ---
// Para os cards da visão geral do dashboard
if (quickCreateQuotationBtn) {
    quickCreateQuotationBtn.addEventListener('click', () => {
        showSection('createQuotationSection');
    });
}

if (quickViewQuotationsBtn) {
    quickViewQuotationsBtn.addEventListener('click', () => {
        alert('Meus Orçamentos: Funcionalidade em construção!');
        // showSection('myQuotationsSection');
    });
}


// --- Funções de Inicialização para Páginas Carregadas Dinamicamente ---
// Estas funções serão chamadas pelo dashboard.js após injetar o HTML e o script.
// Elas precisam obter as referências dos elementos NOVAMENTE e anexar os listeners.

// Para public/profile.js
window.initProfilePage = async function(user, firestoreDb, firebaseAuth, firebaseStorage) {
    currentUser = user; // Garante que o currentUser esteja atualizado
    db = firestoreDb;
    auth = firebaseAuth;
    storage = firebaseStorage;

    // Obter referências dos elementos HTML da página de perfil
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
    const loggedInEmailSpan = document.getElementById('loggedInEmail'); // Para a seção de segurança da conta
    const changePasswordLink = document.getElementById('changePasswordLink');

    if (loggedInEmailSpan) {
        loggedInEmailSpan.textContent = currentUser.email;
    }

    // Carregar dados do perfil
    if (currentUser) {
        await loadProfileData(currentUser.uid);
    }

    // Adicionar Event Listeners (importante refazer, pois o HTML é recriado)
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileFormSubmit);
    }
    if (companyLogoInput) {
        companyLogoInput.addEventListener('change', handleLogoInputChange);
    }
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => showSection('dashboardOverview'));
    }
    if (changePasswordLink) {
        changePasswordLink.addEventListener('click', async (e) => {
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
        });
    }
};

// Funções de CRUD e upload para profile.js (mantê-las separadas para clareza)
// As funções `loadProfileData`, `handleProfileFormSubmit`, `handleLogoInputChange`
// devem estar definidas *dentro* do `profile.js` e não como globais,
// ou definidas globalmente se você preferir. Por simplicidade, vamos defini-las
// diretamente no escopo global de `profile.js` para serem chamadas pela `initProfilePage`.

async function loadProfileData(uid) {
    profileMessage.textContent = ''; // Limpa mensagens anteriores
    profileMessage.className = 'message';
    try {
        const userDocRef = db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            usernameInput.value = userData.username || '';
            emailInput.value = userData.email || '';
            companyNameInput.value = userData.companyName || '';
            cnpjInput.value = userData.cnpj || '';
            companyAddressInput.value = userData.companyAddress || '';
            companyPhoneInput.value = userData.companyPhone || '';
            defaultTermsInput.value = userData.defaultTerms || '';

            if (userData.logoUrl) {
                logoPreview.src = userData.logoUrl;
                logoPreview.style.display = 'block';
                const noLogoText = document.getElementById('noLogoText'); // Se você tiver este elemento no HTML
                if (noLogoText) noLogoText.style.display = 'none';
                logoStatus.textContent = 'Logo atual carregada.';
            } else {
                logoPreview.src = 'images/placeholder-logo.png';
                logoPreview.style.display = 'block';
                const noLogoText = document.getElementById('noLogoText');
                if (noLogoText) noLogoText.style.display = 'block';
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

async function handleProfileFormSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
        profileMessage.textContent = 'Nenhum usuário logado para salvar o perfil.';
        profileMessage.classList.add('error');
        return;
    }

    profileMessage.className = 'message';

    const dataToUpdate = {
        username: usernameInput.value,
        companyName: companyNameInput.value,
        cnpj: cnpjInput.value,
        companyAddress: companyAddressInput.value,
        companyPhone: companyPhoneInput.value,
        defaultTerms: defaultTermsInput.value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (companyLogoInput.files.length > 0) {
            const file = companyLogoInput.files[0];
            const maxFileSize = 2 * 1024 * 1024;

            if (file.size > maxFileSize) {
                profileMessage.textContent = 'Erro: O arquivo da logo é muito grande (máx 2MB).';
                profileMessage.classList.add('error');
                return;
            }

            logoStatus.textContent = 'Fazendo upload da logo...';
            const storageRef = storage.ref(`user-logos/${currentUser.uid}/logo.png`);
            const uploadTask = storageRef.put(file);

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
                    const downloadURL = await storageRef.getDownloadURL();
                    dataToUpdate.logoUrl = downloadURL;
                    logoPreview.src = downloadURL;
                    logoStatus.textContent = 'Logo enviada com sucesso!';
                    
                    await db.collection('users').doc(currentUser.uid).update(dataToUpdate);
                    profileMessage.textContent = 'Perfil atualizado com sucesso!';
                    profileMessage.classList.add('success');
                }
            );
        } else {
            await db.collection('users').doc(currentUser.uid).update(dataToUpdate);
            profileMessage.textContent = 'Perfil atualizado com sucesso!';
            profileMessage.classList.add('success');
        }

    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        profileMessage.textContent = 'Erro ao salvar perfil. Tente novamente.';
        profileMessage.classList.add('error');
    }
}

function handleLogoInputChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoPreview.src = e.target.result;
            logoPreview.style.display = 'block';
            const noLogoText = document.getElementById('noLogoText');
            if (noLogoText) noLogoText.style.display = 'none';
        };
        reader.readAsDataURL(file);
    } else {
        // Se o usuário desselecionar o arquivo, reverte para a logo salva ou placeholder
        if (currentUser && currentUser.uid) {
            db.collection('users').doc(currentUser.uid).get().then(doc => {
                const userData = doc.data();
                if (userData && userData.logoUrl) {
                    logoPreview.src = userData.logoUrl;
                    logoStatus.textContent = 'Logo atual carregada.';
                } else {
                    logoPreview.src = 'images/placeholder-logo.png';
                    logoStatus.textContent = 'Nenhuma logo enviada ainda.';
                }
            }).catch(e => {
                console.error("Erro ao carregar logo existente:", e);
                logoPreview.src = 'images/placeholder-logo.png';
                logoStatus.textContent = 'Nenhuma logo enviada ainda.';
            });
        } else {
            logoPreview.src = 'images/placeholder-logo.png';
            logoStatus.textContent = 'Nenhuma logo enviada ainda.';
        }
        logoPreview.style.display = 'block';
        const noLogoText = document.getElementById('noLogoText');
        if (noLogoText) noLogoText.style.display = 'block';
    }
}


// --- Funções de Inicialização para manage-services.js ---
window.initManageServicesPage = async function(user, firestoreDb, firebaseAuth) {
    currentUser = user;
    db = firestoreDb;
    auth = firebaseAuth;

    // Obter referências dos elementos HTML da página de serviços/materiais
    // Serviços
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

    // Materiais
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

    // Abas
    const tabsContainer = document.querySelector('.tabs-container');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Voltar para o Dashboard
    backToDashboardBtn = document.getElementById('backToDashboard');

    // Re-adicionar Event Listeners (crucial, pois elementos são recriados)
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (e) => {
            if (e.target.matches('.tab-button')) {
                const tab = e.target.dataset.tab;

                tabButtons.forEach(button => button.classList.remove('active'));
                e.target.classList.add('active');

                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tab}Tab`) {
                        content.classList.add('active');
                    }
                });
                if (currentUser) {
                    if (tab === 'services') {
                        loadServices(currentUser.uid);
                    } else if (tab === 'materials') {
                        loadMaterials(currentUser.uid);
                    }
                }
            }
        });
    }

    if (serviceForm) {
        serviceForm.addEventListener('submit', handleServiceFormSubmit);
    }
    if (servicesList) {
        servicesList.addEventListener('click', handleServiceListClick);
    }
    if (cancelServiceEditBtn) {
        cancelServiceEditBtn.addEventListener('click', cancelServiceEdit);
    }

    if (materialForm) {
        materialForm.addEventListener('submit', handleMaterialFormSubmit);
    }
    if (materialsList) {
        materialsList.addEventListener('click', handleMaterialListClick);
    }
    if (cancelMaterialEditBtn) {
        cancelMaterialEditBtn.addEventListener('click', cancelMaterialEdit);
    }
    
    if (backToDashboardBtn) {
        backToDashboardBtn.addEventListener('click', () => showSection('dashboardOverview'));
    }

    // Carregar a aba ativa inicialmente
    const activeTabButton = document.querySelector('.tab-button.active');
    if (activeTabButton && currentUser) {
        if (activeTabButton.dataset.tab === 'services') {
            loadServices(currentUser.uid);
        } else if (activeTabButton.dataset.tab === 'materials') {
            loadMaterials(currentUser.uid);
        }
    }
};

// Funções de CRUD para manage-services.js (definidas globalmente para serem chamadas)
function showMessage(element, msg, type) {
    element.textContent = msg;
    element.className = `message ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 3000);
}

async function loadServices(uid) {
    if (!servicesList) return; // Garante que o elemento existe
    servicesList.innerHTML = '<tr><td colspan="4">Carregando serviços...</td></tr>';
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
                row.insertCell(2).textContent = `R$ ${parseFloat(service.price).toFixed(2).replace('.', ',')}`;
                const actionsCell = row.insertCell(3);
                actionsCell.innerHTML = `
                    <button class="btn btn-secondary btn-small edit-btn" data-id="${doc.id}" data-type="service">Editar</button>
                    <button class="btn btn-danger btn-small delete-btn" data-id="${doc.id}" data-type="service">Excluir</button>
                `;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
        showMessage(serviceMessage, 'Erro ao carregar serviços.', 'error');
        servicesList.innerHTML = '<tr><td colspan="4">Erro ao carregar.</td></tr>';
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
        showMessage(serviceMessage, 'Preço inválido. Digite um número positivo.', 'error');
        return;
    }

    try {
        const serviceRef = db.collection('users').doc(currentUser.uid).collection('services');
        if (id) {
            await serviceRef.doc(id).update({ name, description, unit, price, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            showMessage(serviceMessage, 'Serviço atualizado com sucesso!', 'success');
        } else {
            await serviceRef.add({ name, description, unit, price, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            showMessage(serviceMessage, 'Serviço adicionado com sucesso!', 'success');
        }
        serviceForm.reset();
        serviceIdInput.value = '';
        cancelServiceEditBtn.style.display = 'none';
        loadServices(currentUser.uid);
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        showMessage(serviceMessage, 'Erro ao salvar serviço.', 'error');
    }
}

async function handleServiceListClick(e) {
    if (e.target.matches('.edit-btn')) {
        const id = e.target.dataset.id;
        const serviceDoc = await db.collection('users').doc(currentUser.uid).collection('services').doc(id).get();
        if (serviceDoc.exists) {
            const service = serviceDoc.data();
            serviceIdInput.value = id;
            serviceNameInput.value = service.name;
            serviceDescriptionInput.value = service.description;
            serviceUnitInput.value = service.unit;
            servicePriceInput.value = service.price;
            cancelServiceEditBtn.style.display = 'inline-block';
            showMessage(serviceMessage, 'Editando serviço...', 'info');
        }
    } else if (e.target.matches('.delete-btn')) {
        const id = e.target.dataset.id;
        if (confirm('Tem certeza que deseja excluir este serviço?')) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('services').doc(id).delete();
                showMessage(serviceMessage, 'Serviço excluído com sucesso!', 'success');
                loadServices(currentUser.uid);
            } catch (error) {
                console.error('Erro ao excluir serviço:', error);
                showMessage(serviceMessage, 'Erro ao excluir serviço.', 'error');
            }
        }
    }
}

function cancelServiceEdit() {
    serviceForm.reset();
    serviceIdInput.value = '';
    cancelServiceEditBtn.style.display = 'none';
    serviceMessage.textContent = '';
}

async function loadMaterials(uid) {
    if (!materialsList) return; // Garante que o elemento existe
    materialsList.innerHTML = '<tr><td colspan="4">Carregando materiais...</td></tr>';
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
                row.insertCell(2).textContent = `R$ ${parseFloat(material.price).toFixed(2).replace('.', ',')}`;
                const actionsCell = row.insertCell(3);
                actionsCell.innerHTML = `
                    <button class="btn btn-secondary btn-small edit-btn" data-id="${doc.id}" data-type="material">Editar</button>
                    <button class="btn btn-danger btn-small delete-btn" data-id="${doc.id}" data-type="material">Excluir</button>
                `;
            });
        }
    } catch (error) {
        console.error('Erro ao carregar materiais:', error);
        showMessage(materialMessage, 'Erro ao carregar materiais.', 'error');
        materialsList.innerHTML = '<tr><td colspan="4">Erro ao carregar.</td></tr>';
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
        showMessage(materialMessage, 'Preço inválido. Digite um número positivo.', 'error');
        return;
    }

    try {
        const materialRef = db.collection('users').doc(currentUser.uid).collection('materials');
        if (id) {
            await materialRef.doc(id).update({ name, description, unit, price, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            showMessage(materialMessage, 'Material atualizado com sucesso!', 'success');
        } else {
            await materialRef.add({ name, description, unit, price, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            showMessage(materialMessage, 'Material adicionado com sucesso!', 'success');
        }
        materialForm.reset();
        materialIdInput.value = '';
        cancelMaterialEditBtn.style.display = 'none';
        loadMaterials(currentUser.uid);
    } catch (error) {
        console.error('Erro ao salvar material:', error);
        showMessage(materialMessage, 'Erro ao salvar material.', 'error');
    }
}

async function handleMaterialListClick(e) {
    if (e.target.matches('.edit-btn')) {
        const id = e.target.dataset.id;
        const materialDoc = await db.collection('users').doc(currentUser.uid).collection('materials').doc(id).get();
        if (materialDoc.exists) {
            const material = materialDoc.data();
            materialIdInput.value = id;
            materialNameInput.value = material.name;
            materialDescriptionInput.value = material.description;
            materialUnitInput.value = material.unit;
            materialPriceInput.value = material.price;
            cancelMaterialEditBtn.style.display = 'inline-block';
            showMessage(materialMessage, 'Editando material...', 'info');
        }
    } else if (e.target.matches('.delete-btn')) {
        const id = e.target.dataset.id;
        if (confirm('Tem certeza que deseja excluir este material?')) {
            try {
                await db.collection('users').doc(currentUser.uid).collection('materials').doc(id).delete();
                showMessage(materialMessage, 'Material excluído com sucesso!', 'success');
                loadMaterials(currentUser.uid);
            } catch (error) {
                console.error('Erro ao excluir material:', error);
                showMessage(materialMessage, 'Erro ao excluir material.', 'error');
            }
        }
    }
}

function cancelMaterialEdit() {
    materialForm.reset();
    materialIdInput.value = '';
    cancelMaterialEditBtn.style.display = 'none';
    materialMessage.textContent = '';
}


// --- Funções de Inicialização para create-quotation.js ---
function formatCurrency(value) {
    return `R$ ${parseFloat(value).toFixed(2).replace('.', ',')}`;
}

window.initCreateQuotationPage = async function(user, firestoreDb, firebaseAuth, firebaseStorage) {
    currentUser = user;
    db = firestoreDb;
    auth = firebaseAuth;
    storage = firebaseStorage;

    // Obter referências dos elementos HTML da página de criação de orçamento
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

    // Carregar itens disponíveis e calcular total inicial
    if (currentUser) {
        await loadUserItems(currentUser.uid);
    }
    calculateTotal();
    renderQuotationItems(); // Garante que a tabela esteja limpa ou preenchida

    // Re-adicionar Event Listeners
    if (itemSearchInput) itemSearchInput.addEventListener('input', handleItemSearchInput);
    if (searchResultsDiv) searchResultsDiv.addEventListener('click', handleSearchResultsClick);
    document.addEventListener('click', handleDocumentClickToHideSearchResults); // Document listener
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
    if (backToDashboardBtn) backToDashboardBtn.addEventListener('click', () => showSection('dashboardOverview'));
};

// Funções do create-quotation.js (definidas globalmente)
async function loadUserItems(uid) {
    allAvailableItems = [];
    try {
        const servicesSnapshot = await db.collection('users').doc(uid).collection('services').get();
        servicesSnapshot.forEach(doc => { allAvailableItems.push({ id: doc.id, type: 'service', ...doc.data() }); });
        const materialsSnapshot = await db.collection('users').doc(uid).collection('materials').get();
        materialsSnapshot.forEach(doc => { allAvailableItems.push({ id: doc.id, type: 'material', ...doc.data() }); });
    } catch (error) {
        console.error('Erro ao carregar serviços/materiais do usuário:', error);
        showMessage(quotationMessage, 'Erro ao carregar itens para busca.', 'error');
    }
}

function handleItemSearchInput(e) {
    const searchTerm = e.target.value.toLowerCase();
    searchResultsDiv.innerHTML = '';
    if (searchTerm.length < 2) { searchResultsDiv.classList.remove('active'); return; }
    const filteredItems = allAvailableItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm))
    );
    if (filteredItems.length === 0) {
        searchResultsDiv.innerHTML = '<div class="search-result-item">Nenhum resultado encontrado.</div>';
        searchResultsDiv.classList.add('active'); return;
    }
    filteredItems.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('search-result-item');
        resultItem.innerHTML = `
            <div class="item-info">
                <strong>${item.name}</strong> (${item.unit}) <br>
                <span>${formatCurrency(item.price)}</span>
                ${item.description ? ` - <span>${item.description}</span>` : ''}
            </div>
            <button class="add-to-quotation-btn btn btn-sm btn-outline-primary" data-id="${item.id}" data-type="${item.type}">Add</button>
        `;
        searchResultsDiv.appendChild(resultItem);
    });
    searchResultsDiv.classList.add('active');
}

function handleDocumentClickToHideSearchResults(e) {
    if (itemSearchInput && searchResultsDiv && !itemSearchInput.contains(e.target) && !searchResultsDiv.contains(e.target)) {
        searchResultsDiv.classList.remove('active');
    }
}

function handleSearchResultsClick(e) {
    if (e.target.matches('.add-to-quotation-btn')) {
        const itemId = e.target.dataset.id;
        const itemType = e.target.dataset.type;
        const item = allAvailableItems.find(i => i.id === itemId && i.type === itemType);
        if (item) {
            addItemToQuotation(item.name, item.description, item.unit, item.price, 1);
            itemSearchInput.value = '';
            searchResultsDiv.classList.remove('active');
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
        showMessage(quotationMessage, 'Preencha todos os campos obrigatórios do item manual (Nome, Preço, Qtd.).', 'error');
        return;
    }
    addItemToQuotation(name, description, unit, price, quantity);
    manualItemNameInput.value = ''; manualItemDescriptionInput.value = ''; manualItemUnitInput.value = '';
    manualItemPriceInput.value = ''; manualItemQuantityInput.value = '1';
    showMessage(quotationMessage, 'Item manual adicionado!', 'success');
}

function addItemToQuotation(name, description, unit, price, quantity) {
    const item = { id: Date.now(), name, description: description || '', unit, price, quantity, total: price * quantity };
    currentQuotationItems.push(item);
    renderQuotationItems();
    calculateTotal();
}

function renderQuotationItems() {
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
            showMessage(quotationMessage, 'Item removido!', 'info');
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
        showMessage(quotationMessage, 'Adicione pelo menos um item ao orçamento antes de gerar o PDF.', 'error');
        return;
    }
    if (!clientNameInput.value) {
        showMessage(quotationMessage, 'Preencha o nome do cliente antes de gerar o PDF.', 'error');
        return;
    }
    showMessage(quotationMessage, 'Gerando orçamento em PDF... Aguarde!', 'info');

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
        // Obter dados da empresa do usuário (logo, nome, cnpj, etc.) do Firestore
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            quotationData.companyInfo = userDoc.data();
        } else {
            showMessage(quotationMessage, 'Erro: Dados da empresa não encontrados. Por favor, atualize seu perfil.', 'error');
            return;
        }
        
        // **IMPORTANTE**: Substitua pela URL REAL da sua Cloud Function de geração de PDF!
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
            showMessage(quotationMessage, 'Orçamento PDF gerado e baixado com sucesso!', 'success');
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro desconhecido ao gerar PDF.');
        }
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showMessage(quotationMessage, `Erro ao gerar PDF: ${error.message}`, 'error');
    }
}

function handleSaveDraft() {
    showMessage(quotationMessage, 'Funcionalidade de Salvar Rascunho em construção!', 'info');
}

function handleClearQuotation() {
    if (confirm('Tem certeza que deseja limpar todo o orçamento atual?')) {
        currentQuotationItems = [];
        renderQuotationItems();
        calculateTotal();
        clientNameInput.value = ''; clientEmailInput.value = ''; clientPhoneInput.value = '';
        clientAddressInput.value = ''; discountInput.value = '0'; validityDaysInput.value = '30';
        paymentTermsInput.value = ''; observationsInput.value = '';
        showMessage(quotationMessage, 'Orçamento limpo!', 'info');
    }
}


// --- Funções de Inicialização para my-quotations.js (Futuro) ---
window.initMyQuotationsPage = async function(user, firestoreDb, firebaseAuth) {
    currentUser = user;
    db = firestoreDb;
    auth = firebaseAuth;
    // Aqui você obterá elementos da página de listagem de orçamentos e anexará listeners
    console.log('Página de Meus Orçamentos inicializada.');
    // Exemplo: Carregar lista de orçamentos do usuário
    // await db.collection('users').doc(currentUser.uid).collection('quotations').get();
};