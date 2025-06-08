// public/manage-services.js

// Cole a configuração do seu projeto Firebase aqui
const firebaseConfig = {
    apiKey: "AIzaSyBvFAdgyg9ns3qo4ENSR0TATy1QdMGfgCI", // SEU_API_KEY
    authDomain: "orca-eleltrica.firebaseapp.com",     // SEU_AUTH_DOMAIN
    projectId: "orca-eleltrica",                      // SEU_PROJECT_ID
    storageBucket: "orca-eleltrica.firebasestorage.app", // SEU_STORAGE_BUCKET
    messagingSenderId: "48836864931",                 // SEU_MESSAGING_SENDER_ID
    appId: "1:48836864931:web:9b1dc4579ebd254b570816",   // SEU_APP_ID
    measurementId: "G-1XXEHV4E69"                     // SEU_MEASUREMENT_ID (se habilitado)
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Obtém instâncias dos serviços
const auth = firebase.auth();
const db = firebase.firestore();

// --- Elementos HTML ---
const tabsContainer = document.querySelector('.tabs-container');
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

// Serviços
const serviceForm = document.getElementById('serviceForm');
const serviceIdInput = document.getElementById('serviceId');
const serviceNameInput = document.getElementById('serviceName');
const serviceDescriptionInput = document.getElementById('serviceDescription');
const serviceUnitInput = document.getElementById('serviceUnit');
const servicePriceInput = document.getElementById('servicePrice');
const servicesList = document.getElementById('servicesList');
const serviceMessage = document.getElementById('serviceMessage');
const cancelServiceEditBtn = document.getElementById('cancelServiceEdit');
const noServicesMessage = document.getElementById('noServicesMessage');

// Materiais
const materialForm = document.getElementById('materialForm');
const materialIdInput = document.getElementById('materialId');
const materialNameInput = document.getElementById('materialName');
const materialDescriptionInput = document.getElementById('materialDescription');
const materialUnitInput = document.getElementById('materialUnit');
const materialPriceInput = document.getElementById('materialPrice');
const materialsList = document.getElementById('materialsList');
const materialMessage = document.getElementById('materialMessage');
const cancelMaterialEditBtn = document.getElementById('cancelMaterialEdit');
const noMaterialsMessage = document.getElementById('noMaterialsMessage');

const backToDashboardBtn = document.getElementById('backToDashboard');

let currentUser = null; // Usuário logado

// --- Funções Auxiliares ---
function redirectToLogin() {
    window.location.href = '/index.html';
}

function showMessage(element, msg, type) {
    element.textContent = msg;
    element.className = `message ${type}`;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'message';
    }, 3000);
}

// --- Lógica de Abas ---
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
        // Recarrega a lista da aba ativa (se for o caso)
        if (currentUser) {
            if (tab === 'services') {
                loadServices(currentUser.uid);
            } else if (tab === 'materials') {
                loadMaterials(currentUser.uid);
            }
        }
    }
});

// --- Autenticação e Carregamento Inicial ---
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        console.log('Usuário logado em Gerenciar Serviços:', user.email, user.uid);
        // Carrega serviços e materiais ao entrar na página
        loadServices(currentUser.uid);
        loadMaterials(currentUser.uid);
    } else {
        console.log('Nenhum usuário logado. Redirecionando para login.');
        redirectToLogin();
    }
});

// --- Funções de Serviços (CRUD) ---
async function loadServices(uid) {
    servicesList.innerHTML = '<tr><td colspan="4">Carregando serviços...</td></tr>';
    noServicesMessage.style.display = 'none';
    try {
        const servicesSnapshot = await db.collection('users').doc(uid).collection('services').orderBy('name').get();
        servicesList.innerHTML = ''; // Limpa antes de adicionar
        if (servicesSnapshot.empty) {
            noServicesMessage.style.display = 'block';
            servicesList.innerHTML = ''; // Garante que a tabela esteja vazia
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

serviceForm.addEventListener('submit', async (e) => {
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
            // Edição
            await serviceRef.doc(id).update({
                name, description, unit, price,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showMessage(serviceMessage, 'Serviço atualizado com sucesso!', 'success');
        } else {
            // Adição
            await serviceRef.add({
                name, description, unit, price,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showMessage(serviceMessage, 'Serviço adicionado com sucesso!', 'success');
        }
        serviceForm.reset();
        serviceIdInput.value = ''; // Limpa o ID para nova adição
        cancelServiceEditBtn.style.display = 'none'; // Esconde botão de cancelar edição
        loadServices(currentUser.uid); // Recarrega a lista
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        showMessage(serviceMessage, 'Erro ao salvar serviço.', 'error');
    }
});

servicesList.addEventListener('click', async (e) => {
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
});

cancelServiceEditBtn.addEventListener('click', () => {
    serviceForm.reset();
    serviceIdInput.value = '';
    cancelServiceEditBtn.style.display = 'none';
    serviceMessage.textContent = ''; // Limpa a mensagem
});

// --- Funções de Materiais (CRUD) ---
async function loadMaterials(uid) {
    materialsList.innerHTML = '<tr><td colspan="4">Carregando materiais...</td></tr>';
    noMaterialsMessage.style.display = 'none';
    try {
        const materialsSnapshot = await db.collection('users').doc(uid).collection('materials').orderBy('name').get();
        materialsList.innerHTML = '';
        if (materialsSnapshot.empty) {
            noMaterialsMessage.style.display = 'block';
            materialsList.innerHTML = '';
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

materialForm.addEventListener('submit', async (e) => {
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
            // Edição
            await materialRef.doc(id).update({
                name, description, unit, price,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showMessage(materialMessage, 'Material atualizado com sucesso!', 'success');
        } else {
            // Adição
            await materialRef.add({
                name, description, unit, price,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
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
});

materialsList.addEventListener('click', async (e) => {
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
});

cancelMaterialEditBtn.addEventListener('click', () => {
    materialForm.reset();
    materialIdInput.value = '';
    cancelMaterialEditBtn.style.display = 'none';
    materialMessage.textContent = '';
});

// --- Voltar para o Dashboard ---
backToDashboardBtn.addEventListener('click', () => {
    window.location.href = '/dashboard.html';
});