// public/script.js

// Cole a configuração do seu projeto Firebase aqui
// Certifique-se de que é a mesma que você usou em dashboard.js
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

// Obtém instâncias dos serviços
const auth = firebase.auth();
const db = firebase.firestore();
// --- Elementos HTML (reatribuições serão feitas em initCreateQuotationPage) ---
let clientNameInput = null; let clientEmailInput = null; let clientPhoneInput = null;
let clientAddressInput = null;

// Para itens predefinidos (NOVO)
let predefinedQuoteItemSearchInput = null; let predefinedQuoteResultsDiv = null; let noPredefinedQuoteItemsMessage = null;
let allPredefinedQuoteItems = []; // Itens predefinidos carregados do Firestore para esta página

// Para itens do usuário (pessoal)
let userItemSearchInput = null; // Renomeado de itemSearchInput para clareza
let userSearchResultsDiv = null; // Renomeado de searchResultsDiv para clareza
let allAvailableUserItems = []; // Renomeado de allAvailableItems para clareza

// Para itens manuais
let manualItemNameInput = null; let manualItemDescriptionInput = null; let manualItemUnitInput = null;
let manualItemPriceInput = null; let manualItemQuantityInput = null; let addManualItemBtn = null;

// Tabela de itens do orçamento
let quotationItemsList = null;

// Resumo
let subtotalDisplay = null; let discountInput = null; let applyDiscountBtn = null; let totalDisplay = null;

// Detalhes finais
let validityDaysInput = null; let paymentTermsInput = null; let observationsInput = null;

// Botões de ação
let generatePdfBtn = null; let saveDraftBtn = null; let clearQuotationBtn = null; let backToDashboardBtn = null;

let quotationMessage = null; // Mensagem de feedback

let currentUser = null;
let currentQuotationItems = []; // Itens atualmente no orçamento

// --- Funções Auxiliares (assumindo que são globais via dashboard.js) ---
// showMessage e formatCurrency devem ser globais no dashboard.js
// Se não, você pode incluí-las aqui ou em um arquivo util.js separado
// function showMessage(element, msg, type) { ... }
// function formatCurrency(value) { ... }

// --- Funções de Inicialização (Chamada pelo dashboard.js) ---
window.initCreateQuotationPage = async function(user, firestoreDb, firebaseAuth, firebaseStorage) {
    currentUser = user;
    db = firestoreDb;
    auth = firebaseAuth;
    storage = firebaseStorage;

    // --- Obter Referências dos Elementos HTML (após o HTML ser injetado) ---
    clientNameInput = document.getElementById('clientName');
    clientEmailInput = document.getElementById('clientEmail');
    clientPhoneInput = document.getElementById('clientPhone');
    clientAddressInput = document.getElementById('clientAddress');

    predefinedQuoteItemSearchInput = document.getElementById('predefinedQuoteItemSearch');
    predefinedQuoteResultsDiv = document.getElementById('predefinedQuoteResults');
    noPredefinedQuoteItemsMessage = document.getElementById('noPredefinedQuoteItemsMessage');

    userItemSearchInput = document.getElementById('userItemSearch'); // Renomeado
    userSearchResultsDiv = document.getElementById('userSearchResults'); // Renomeado

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

    currentQuotationItems = []; // Reinicia os itens do orçamento a cada carga de página

    // --- Remover Listeners Antigos (CRÍTICO para carregamento dinâmico) ---
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


    // --- Re-adicionar Event Listeners ---
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
        await loadPredefinedItemsForQuotation(); // Nova função para carregar predefinidos
        await loadUserItemsForQuotation(currentUser.uid); // Função existente para itens do usuário
    }
    calculateTotal();
    renderQuotationItems(); // Garante que a tabela esteja limpa ou preenchida inicialmente
};


// --- Funções Específicas para create-quotation.js ---

// NOVO: Carregar Itens Predefinidos para a Página de Orçamento
async function loadPredefinedItemsForQuotation() {
    allPredefinedQuoteItems = [];
    try {
        const predefinedSnapshot = await db.collection('predefinedServices').get();
        predefinedSnapshot.forEach(doc => { allPredefinedQuoteItems.push({ id: doc.id, ...doc.data() }); });
        console.log('Itens predefinidos para orçamento carregados:', allPredefinedQuoteItems.length);
        renderPredefinedQuoteItems(allPredefinedQuoteItems); // Renderiza todos inicialmente
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
    predefinedQuoteResultsDiv.style.display = 'block'; // Mostra a lista de resultados
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
        addItemToQuotation(name, description, unit, price, 1); // Quantidade padrão 1
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

// Funções existentes, renomeadas para clareza em create-quotation.js
async function loadUserItemsForQuotation(uid) { // Renomeada de loadUserItems
    allAvailableUserItems = []; // Renomeada de allAvailableItems
    try {
        const servicesSnapshot = await db.collection('users').doc(uid).collection('services').get();
        servicesSnapshot.forEach(doc => { allAvailableUserItems.push({ id: doc.id, type: 'service', ...doc.data() }); });
        const materialsSnapshot = await db.collection('users').doc(uid).collection('materials').get();
        materialsSnapshot.forEach(doc => { allAvailableUserItems.push({ id: doc.id, type: 'material', ...doc.data() }); });
    } catch (error) {
        console.error('Erro ao carregar serviços/materiais do usuário para orçamento:', error);
        if (quotationMessage) showMessage(quotationMessage, 'Erro ao carregar itens para busca.', 'error');
    }
}

function handleUserItemSearchInput(e) { // Renomeada de handleItemSearchInput
    const searchTerm = e.target.value.toLowerCase();
    if (userSearchResultsDiv) userSearchResultsDiv.innerHTML = '';
    if (searchTerm.length < 2) { if (userSearchResultsDiv) userSearchResultsDiv.classList.remove('active'); return; }
    const filteredItems = allAvailableUserItems.filter(item => // Usando allAvailableUserItems
        item.name.toLowerCase().includes(searchTerm) || (item.description && item.description.toLowerCase().includes(searchTerm))
    );
    if (filteredItems.length === 0) {
        if (userSearchResultsDiv) userSearchResultsDiv.innerHTML = '<div class="list-group-item text-center text-muted">Nenhum resultado encontrado.</div>';
        if (userSearchResultsDiv) userSearchResultsDiv.classList.add('active'); return;
    }
    filteredItems.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('list-group-item', 'list-group-item-action', 'd-flex', 'justify-content-between', 'align-items-center');
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

function handleDocumentClickToHideUserSearchResults(e) { // Renomeada de handleDocumentClickToHideSearchResults
    if (userItemSearchInput && userSearchResultsDiv && !userItemSearchInput.contains(e.target) && !userSearchResultsDiv.contains(e.target)) {
        userSearchResultsDiv.classList.remove('active');
    }
}

function handleUserSearchResultsClick(e) { // Renomeada de handleSearchResultsClick
    if (e.target.matches('.add-to-quotation-btn') || e.target.closest('.add-to-quotation-btn')) {
        const btn = e.target.closest('.add-to-quotation-btn');
        const name = btn.dataset.name;
        const description = btn.dataset.description;
        const unit = btn.dataset.unit;
        const price = parseFloat(btn.dataset.price);
        addItemToQuotation(name, description, unit, price, 1); // Quantidade padrão 1
        if (userItemSearchInput) userItemSearchInput.value = '';
        if (userSearchResultsDiv) userSearchResultsDiv.classList.remove('active');
        if (quotationMessage) showMessage(quotationMessage, `${name} adicionado da sua lista!`, 'success');
    }
}

function handleBackToDashboard() { // Renomeada de backToDashboardBtn.addEventListener
    window.showSection('dashboardOverview');
}