// public/profile.js

// **IMPORTANTE:** Cole a configuração REAL do seu projeto Firebase aqui!
const firebaseConfig = {
    apiKey: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI",// SUBSTITUA PELA SUA CHAVE API
    authDomain: "orca-eleltrica.firebaseapp.com",     // SUBSTITUA PELO SEU DOMÍNIO DE AUTENTICAÇÃO
    projectId: "orca-eleltrica",                      // SUBSTITUA PELO SEU ID DE PROJETO
    storageBucket: "orca-eleltrica.firebasestorage.app", // SUBSTITUA PELO SEU STORAGE BUCKET
    messagingSenderId: "48836864931",                 // SUBSTITUA PELO SEU SENDER ID
    appId: "1:48836864931:web:9b1dc4579ebd254b570816",   // SUBSTITUA PELO SEU APP ID
    measurementId: "G-1XXEHV4E69"                     // Opcional, se usar Analytics
};

// Inicializa o Firebase (garante que está inicializado, mesmo que dashboard.js já tenha feito)
firebase.initializeApp(firebaseConfig);

// Obtém instâncias dos serviços Firebase (inicializadas aqui para garantir acesso local ao script)
let auth = firebase.auth();
let db = firebase.firestore();
let storage = firebase.storage();

// --- Variáveis para Referências a Elementos HTML (serão atribuídas em initProfilePage) ---
// Declaradas aqui para que todas as funções auxiliares tenham acesso
let profileForm = null; let usernameInput = null; let emailInput = null; let companyNameInput = null;
let cnpjInput = null; let companyAddressInput = null; let companyPhoneInput = null;
let companyLogoInput = null; let logoPreview = null; let logoStatus = null;
let defaultTermsInput = null; let profileMessage = null; let backToDashboardBtn = null;
let loggedInEmailProfileSpan = null; let changePasswordLink = null;

let currentUser = null; // Variável para armazenar o usuário logado

// --- Funções Auxiliares Comuns (replicadas aqui para que profile.js funcione independentemente) ---
// Estas funções são tipicamente globais (definidas em dashboard.js ou um util.js)
// Mas são incluídas aqui para garantir que profile.js funcione mesmo se acessado diretamente.
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


/**
 * Ponto de entrada para inicializar a página de perfil quando carregada dinamicamente.
 * O dashboard.js chamará esta função.
 * @param {object} userObj O objeto de usuário autenticado.
 * @param {object} firestoreDb A instância do Firestore.
 * @param {object} firebaseAuth A instância do Auth.
 * @param {object} firebaseStorage A instância do Storage.
 */
window.initProfilePage = async function(userObj, firestoreDb, firebaseAuth, firebaseStorage) {
    // Reatribuir as instâncias do Firebase passadas pelo dashboard.js
    // Isso garante que este script use as mesmas instâncias do dashboard.js.
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

    // Carregar dados do perfil se o usuário estiver logado
    if (currentUser) {
        if (loggedInEmailProfileSpan) {
            loggedInEmailProfileSpan.textContent = currentUser.email;
        }
        await loadProfileData(currentUser.uid);
    } else {
        // Redirecionar se não houver usuário logado (redundante, pois loading.js já faria)
        console.log('Nenhum usuário logado na página de perfil. Redirecionando...');
        window.location.href = '/index.html'; // Redirecionamento de fallback
    }

    // --- Re-adicionar Event Listeners (CRÍTICO: Elementos são recriados a cada carga dinâmica) ---
    // Remover listeners antigos antes de adicionar novos para evitar duplicação.
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
                    // Se não tiver logo URL no Firestore, mas há uma imagem de placeholder padrão
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

// --- Salvar Dados do Perfil ---
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
            const maxFileSize = 2 * 1024 * 1024; // 2MB em bytes

            if (file.size > maxFileSize) {
                if (profileMessage) showMessage(profileMessage, 'Erro: O arquivo da logo é muito grande (máx 2MB).', 'error');
                return;
            }

            if (logoStatus) logoStatus.textContent = 'Fazendo upload da logo...';
            const storageRef = storage.ref(`user-logos/${currentUser.uid}/logo.png`); // Caminho no Storage
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

    // Remove listeners antigos para evitar duplicação
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

    // Carregar itens disponíveis (ambos predefinidos e do usuário)
    if (currentUser) {
        await loadPredefinedItemsForQuotation();
        await loadUserItemsForQuotation(currentUser.uid);
    }
    calculateTotal();
    renderQuotationItems();
};

// Funções auxiliares para create-quotation.js
async function loadPredefinedItemsForQuotation() {
    allPredefinedQuoteItems = [];
    try {
        const predefinedSnapshot = await db.collection('predefinedServices').get();
        predefinedSnapshot.forEach(doc => { allPredefinedQuoteItems.push({ id: doc.id, ...doc.data() }); });
        console.log('Itens predefinidos para orçamento carregados:', allPredefinedQuoteItems.length);
        renderPredefinedQuoteItems(allPredefinedQuoteItems);
    } catch (error) {
        console.error('Erro ao carregar itens predefinidos para orçamento:', error);
        if (predefinedQuoteResultsDiv) {
            predefinedQuoteResultsDiv.innerHTML = '<div class="alert alert-danger text-center">Erro ao carregar sugestões.</div>';
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
        addItemToQuotation(name, description, unit, price, 1);
        if (predefinedQuoteItemSearchInput) predefinedQuoteItemSearchInput.value = '';
        if (predefinedQuoteResultsDiv) predefinedQuoteResultsDiv.classList.remove('active');
        if (quotationMessage) showMessage(quotationMessage, `${name} adicionado do item padrão!`, 'success');
    }
}

function handleDocumentClickToHidePredefinedQuoteResults(e) {
    if (predefinedQuoteItemSearchInput && predefinedQuoteResultsDiv && !predefinedQuoteItemSearchInput.contains(e.target) && !predefinedQuoteResultsDiv.contains(e.target)) {
        predefinedQuoteResultsDiv.style.display = 'none';
    }
}

async function loadUserItemsForQuotation(uid) {
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

function handleUserItemSearchInput(e) {
    const searchTerm = e.target.value.toLowerCase();
    if (userSearchResultsDiv) userSearchResultsDiv.innerHTML = '';
    if (searchTerm.length < 2) { if (userSearchResultsDiv) userSearchResultsDiv.classList.remove('active'); return; }
    const filteredItems = allAvailableItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm))
    );
    if (filteredItems.length === 0) {
        if (userSearchResultsDiv) userSearchResultsDiv.innerHTML = '<div class="list-group-item text-center text-muted">Nenhum resultado encontrado.</div>';
        if (userSearchResultsDiv) userSearchResultsDiv.classList.add('active'); return;
    }
    filteredItems.forEach(item => {
        const resultItem = document.createElement('div');
        itemElement.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'justify-content-between', 'align-items-center');
        resultItem.innerHTML = `
            <div>
                <strong>${item.name}</strong> (${item.unit}) <br>
                <small class="text-muted">R$ ${formatCurrency(item.price)} ${item.description ? `- ${item.description}` : ''}</small>
            </div>
            <button class="btn btn-sm btn-outline-primary add-to-quotation-btn"
                    data-name="${item.name}"
                    data-description="${item.description || ''}"
                    data-unit="${item.unit}"
                    data-price="${item.price}"
                    data-source="user">
                Add
            </button>
        `;
        if (userSearchResultsDiv) userSearchResultsDiv.appendChild(resultItem);
    });
    if (userSearchResultsDiv) userSearchResultsDiv.classList.add('active');
}

function handleDocumentClickToHideUserSearchResults(e) {
    if (userItemSearchInput && userSearchResultsDiv && !userItemSearchInput.contains(e.target) && !userSearchResultsDiv.contains(e.target)) {
        userSearchResultsDiv.classList.remove('active');
    }
}

function handleUserSearchResultsClick(e) {
    if (e.target.matches('.add-to-quotation-btn') || e.target.closest('.add-to-quotation-btn')) {
        const btn = e.target.closest('.add-to-quotation-btn');
        const name = btn.dataset.name;
        const description = btn.dataset.description;
        const unit = btn.dataset.unit;
        const price = parseFloat(btn.dataset.price);
        addItemToQuotation(name, description, unit, price, 1);
        if (userItemSearchInput) userItemSearchInput.value = '';
        if (userSearchResultsDiv) userSearchResultsDiv.classList.remove('active');
        if (quotationMessage) showMessage(quotationMessage, `${name} adicionado da sua lista!`, 'success');
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
            if (quotationMessage) showMessage(quotationMessage, 'Orcamento PDF gerado e baixado com sucesso!', 'success');
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