import { db } from './database.js';

document.addEventListener('DOMContentLoaded', async function() {
    const buttons = document.querySelectorAll('button');
    const formContainer = document.getElementById('formContainer');
    const addItemsContainer = document.getElementById('addItemsContainer');
    const pantryContainer = document.getElementById('pantryContainer');
    const shoppingListContainer = document.getElementById('shoppingListContainer');
    const mealForm = document.getElementById('mealForm');
    const addItemsForm = document.getElementById('addItemsForm');
    const pantryList = document.querySelector('#pantryContainer .items-list ul');
    const shoppingList = document.getElementById('shoppingListContainer').querySelector('ul');
    const undoContainer = document.getElementById('undoContainer');
    const undoButton = document.getElementById('undoButton');
    const prepareRecipeBtn = document.getElementById('prepareRecipeBtn');
    const ingredientInput = document.getElementById('ingredient');
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    const ingredientsList = document.getElementById('ingredientsList');
    const loginBtn = document.getElementById('loginBtn');
    let lastRemovedItem = null;
    let undoTimeout = null;
    let ingredients = [];
    
    // Inicializar dados do localStorage
    let items = [];
    let shoppingListItems = [];
    let currentUser = null;

    // Função para obter as chaves do localStorage específicas do usuário
    function getUserStorageKey(key) {
        return currentUser ? `${currentUser.id}_${key}` : null;
    }

    // Modificar loadItems para usar o banco de dados
    async function loadItems(location) {
        if (!currentUser) {
            if (location === 'pantry') {
                items = [];
                renderItems();
            } else {
                shoppingListItems = [];
                renderShoppingList();
            }
            return;
        }

        try {
            const storeName = location === 'pantry' ? 'pantryItems' : 'shoppingItems';
            const loadedItems = await db.getItemsByUserId(storeName, currentUser.id);
            
            if (location === 'pantry') {
                items = loadedItems;
                renderItems();
            } else {
                shoppingListItems = loadedItems;
                renderShoppingList();
            }
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
            alert('Erro ao carregar itens. Por favor, tente novamente.');
        }
    }

    // Função para limpar os dados quando não há usuário
    function clearUserData() {
        items = [];
        shoppingListItems = [];
        renderItems();
        renderShoppingList();
    }

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            if (!e.target.closest('form')) {
                if (this.classList.contains('active')) {
                    this.classList.remove('active');
                    formContainer.classList.add('hidden');
                    addItemsContainer.classList.add('hidden');
                    pantryContainer.classList.add('hidden');
                    shoppingListContainer.classList.add('hidden');
                    prepareRecipeBtn.classList.add('hidden');
                    return;
                }

                buttons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                if (this.id === 'specBtn') {
                    formContainer.classList.remove('hidden');
                    addItemsContainer.classList.add('hidden');
                    pantryContainer.classList.add('hidden');
                    shoppingListContainer.classList.add('hidden');
                    prepareRecipeBtn.classList.add('hidden'); // Oculta o botão ao trocar para a aba de especificações
                } else if (this.id === 'addBtn') {
                    addItemsContainer.classList.remove('hidden');
                    formContainer.classList.add('hidden');
                    pantryContainer.classList.add('hidden');
                    shoppingListContainer.classList.add('hidden');
                    prepareRecipeBtn.classList.add('hidden'); // Oculta o botão ao trocar para outras abas
                } else if (this.id === 'pantryBtn') {
                    pantryContainer.classList.remove('hidden');
                    formContainer.classList.add('hidden');
                    addItemsContainer.classList.add('hidden');
                    shoppingListContainer.classList.add('hidden');
                    loadItems('pantry'); // Atualizar a lista quando abrir a dispensa
                    prepareRecipeBtn.classList.add('hidden'); // Oculta o botão ao trocar para outras abas
                } else if (this.id === 'shoppingListBtn') {
                    shoppingListContainer.classList.remove('hidden');
                    formContainer.classList.add('hidden');
                    addItemsContainer.classList.add('hidden');
                    pantryContainer.classList.add('hidden');
                    loadItems('shopping_list');
                    prepareRecipeBtn.classList.add('hidden'); // Oculta o botão ao trocar para outras abas
                } else {
                    formContainer.classList.add('hidden');
                    addItemsContainer.classList.add('hidden');
                    pantryContainer.classList.add('hidden');
                    shoppingListContainer.classList.add('hidden');
                    prepareRecipeBtn.classList.add('hidden'); // Oculta o botão ao trocar para outras abas
                }
            }
        });
    });

    // Handle meal form submission
    mealForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            mealType: document.getElementById('mealType').value,
            maxCalories: document.getElementById('avgCalories').value,
            ingredients: ingredients
        };
        
        console.log('Dados do formulário:', formData);
        prepareRecipeBtn.classList.remove('hidden');
        // Removido a limpeza dos ingredientes
    });

    // Modificar o formulário de adicionar itens
    addItemsForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            alert('Por favor, faça login para adicionar itens.');
            return;
        }

        const itemName = document.getElementById('itemName').value.trim();
        const itemQuantity = parseInt(document.getElementById('itemQuantity').value);
        const itemUnit = document.getElementById('itemUnit').value;
        
        if (itemName && itemQuantity && itemUnit) {
            try {
                const newItem = {
                    id: Date.now(),
                    name: itemName.charAt(0).toUpperCase() + itemName.slice(1).toLowerCase(),
                    quantity: itemQuantity,
                    unit: itemUnit,
                    userId: currentUser.id
                };

                await db.addItem('pantryItems', newItem);
                await loadItems('pantry');
                addItemsForm.reset();
            } catch (error) {
                console.error('Erro ao adicionar item:', error);
                alert('Erro ao adicionar item. Por favor, tente novamente.');
            }
        }
    });

    // Função para renderizar os itens na lista
    function renderItems() {
        if (!document.getElementById('pantryBtn').classList.contains('active')) {
            return; // Não renderiza se não estiver na seção da dispensa
        }
        
        pantryList.innerHTML = '';
        
        // Só renderiza se houver usuário logado
        if (!currentUser) {
            pantryList.innerHTML = '<p>Faça login para ver seus itens</p>';
            return;
        }
        
        items.forEach((item, index) => {
            const unitLabel = getUnitLabel(item.unit);
            const li = document.createElement('li');
            li.innerHTML = `
                <span>
                    <strong>${item.name}</strong>
                    <div class="quantity">
                        <button class="quantity-btn" onclick="decrementItem(${index})">-</button>
                        ${item.quantity} ${unitLabel}
                        <button class="quantity-btn" onclick="incrementItem(${index})">+</button>
                    </div>
                </span>
                <button class="remove-btn" onclick="removeItem(${index})">×</button>
            `;
            pantryList.appendChild(li);
        });
    }

    function renderShoppingList() {
        shoppingList.innerHTML = '';
        
        // Só renderiza se houver usuário logado
        if (!currentUser) {
            shoppingList.innerHTML = '<p>Faça login para ver sua lista de compras</p>';
            return;
        }
        
        shoppingListItems.forEach((item, index) => {
            const unitLabel = getUnitLabel(item.unit);
            const shoppingItemHtml = `
                <span>
                    <strong>${item.name}</strong>
                    <div class="quantity">
                        <button class="quantity-btn" onclick="decrementShoppingItem(${index})">-</button>
                        ${item.quantity} ${unitLabel}
                        <button class="quantity-btn" onclick="incrementShoppingItem(${index})">+</button>
                    </div>
                </span>
                <button class="remove-btn" onclick="removeFromShoppingList(${index})">×</button>
            `;
            
            const shoppingLi = document.createElement('li');
            shoppingLi.innerHTML = shoppingItemHtml;
            shoppingList.appendChild(shoppingLi);
        });
    }

    // Função para obter o label correto da unidade
    function getUnitLabel(unit) {
        const units = {
            'unidade': 'unidade(s)',
            'kg': 'kg',
            'g': 'g',
            'l': 'L',
            'ml': 'ml',
            'pacote': 'pacote(s)',
            'caixa': 'caixa(s)'
        };
        return units[unit] || unit;
    }

    // Modificar removeItem
    window.removeItem = async function(index) {
        if (!currentUser || !document.getElementById('pantryBtn').classList.contains('active')) {
            return;
        }

        try {
            const item = items[index];
            // Adicionar à lista de compras
            const shoppingItem = { ...item, id: Date.now() };
            await db.addItem('shoppingItems', shoppingItem);
            
            // Remover da dispensa
            await db.removeItem('pantryItems', item.id);

            await loadItems('pantry');
            await loadItems('shopping_list');

            undoContainer.classList.remove('hidden');
            undoContainer.querySelector('span').textContent = 'Item movido para lista de compras!';
            undoContainer.classList.add('visible');

            lastRemovedItem = {
                item: item,
                index: index,
                fromShoppingList: false
            };

            if (undoTimeout) {
                clearTimeout(undoTimeout);
            }

            undoTimeout = setTimeout(() => {
                undoContainer.classList.remove('visible');
                undoContainer.classList.add('hidden');
                lastRemovedItem = null;
            }, 3000);
        } catch (error) {
            console.error('Erro ao mover item:', error);
            alert('Erro ao mover item. Por favor, tente novamente.');
        }
    };

    // Modificar removeFromShoppingList
    window.removeFromShoppingList = async function(index) {
        if (!currentUser) return;

        try {
            const item = shoppingListItems[index];
            await db.removeItem('shoppingItems', item.id);
            await loadItems('shopping_list');
        } catch (error) {
            console.error('Erro ao remover item:', error);
            alert('Erro ao remover item. Por favor, tente novamente.');
        }
    };

    // Adicionar evento de clique ao botão desfazer
    undoButton.addEventListener('click', function(e) {
        // Previne que o evento se propague para outros elementos
        e.preventDefault();
        e.stopPropagation();
        
        if (lastRemovedItem) {
            if (!lastRemovedItem.fromShoppingList) {
                items.splice(lastRemovedItem.index, 0, lastRemovedItem.item);
                localStorage.setItem(getUserStorageKey('pantryItems'), JSON.stringify(items));
                
                // Remover o item da lista de compras
                const index = shoppingListItems.findIndex(item => 
                    item.name === lastRemovedItem.item.name && 
                    item.unit === lastRemovedItem.item.unit
                );
                if (index !== -1) {
                    shoppingListItems.splice(index, 1);
                    localStorage.setItem(getUserStorageKey('shoppingListItems'), JSON.stringify(shoppingListItems));
                }
            }
            
            renderItems();
            renderShoppingList();

            // Esconde o container de desfazer
            undoContainer.classList.remove('visible');
            undoContainer.classList.add('hidden');

            // Limpa o timeout e o item removido
            clearTimeout(undoTimeout);
            lastRemovedItem = null;

            // Mantém o botão da dispensa ativo
            const pantryButton = document.getElementById('pantryBtn');
            if (pantryButton) {
                pantryButton.classList.add('active');
            }
            // Mantém a dispensa visível
            pantryContainer.classList.remove('hidden');
        }
    });

    // Modificar incrementItem
    window.incrementItem = async function(index) {
        if (!currentUser || !document.getElementById('pantryBtn').classList.contains('active')) {
            return;
        }

        try {
            const item = items[index];
            item.quantity += 1;
            await db.updateItem('pantryItems', item);
            await loadItems('pantry');
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            alert('Erro ao atualizar quantidade. Por favor, tente novamente.');
        }
    };

    // Modificar decrementItem
    window.decrementItem = async function(index) {
        if (!currentUser || !document.getElementById('pantryBtn').classList.contains('active')) {
            return;
        }

        try {
            if (items[index].quantity > 1) {
                items[index].quantity -= 1;
                await db.updateItem('pantryItems', items[index]);
                await loadItems('pantry');
            } else {
                await removeItem(index);
            }
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            alert('Erro ao atualizar quantidade. Por favor, tente novamente.');
        }
    };

    // Adicionar funções de incremento e decremento
    // Modificar incrementShoppingItem
    window.incrementShoppingItem = async function(index) {
        if (!currentUser) return;

        try {
            shoppingListItems[index].quantity += 1;
            await db.updateItem('shoppingItems', shoppingListItems[index]);
            await loadItems('shopping_list');
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            alert('Erro ao atualizar quantidade. Por favor, tente novamente.');
        }
    };

    // Modificar decrementShoppingItem
    window.decrementShoppingItem = async function(index) {
        if (!currentUser) return;

        try {
            if (shoppingListItems[index].quantity > 1) {
                shoppingListItems[index].quantity -= 1;
                await db.updateItem('shoppingItems', shoppingListItems[index]);
                await loadItems('shopping_list');
            } else {
                await removeFromShoppingList(index);
            }
        } catch (error) {
            console.error('Erro ao atualizar item:', error);
            alert('Erro ao atualizar quantidade. Por favor, tente novamente.');
        }
    };

    // Função para adicionar ingrediente
    function addIngredient(ingredient) {
        if (ingredient.trim() === '') return;
        
        ingredients.push(ingredient.trim());
        
        const div = document.createElement('div');
        div.className = 'ingredient-item';
        div.innerHTML = `
            ${ingredient}
            <button class="remove-ingredient" onclick="removeIngredient(${ingredients.length - 1})">×</button>
        `;
        
        ingredientsList.appendChild(div);
        ingredientInput.value = '';  // Mantemos este reset pois é para adicionar múltiplos ingredientes
        ingredientInput.focus();
    }

    // Adicionar ingrediente ao pressionar Enter
    ingredientInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addIngredient(this.value);
        }
    });

    // Adicionar ingrediente ao clicar no botão
    addIngredientBtn.addEventListener('click', function() {
        addIngredient(ingredientInput.value);
    });

    // Função global para remover ingrediente
    window.removeIngredient = function(index) {
        ingredients.splice(index, 1);
        renderIngredients();
    };

    // Renderizar lista de ingredientes
    function renderIngredients() {
        ingredientsList.innerHTML = '';
        ingredients.forEach((ingredient, index) => {
            const div = document.createElement('div');
            div.className = 'ingredient-item';
            div.innerHTML = `
                ${ingredient}
                <button class="remove-ingredient" onclick="removeIngredient(${index})">×</button>
            `;
            ingredientsList.appendChild(div);
        });
    }

    // Auth Elements
    const authModal = document.getElementById('authModal');
    const closeBtn = authModal.querySelector('.close');
    const loginView = document.getElementById('loginView');
    const signupView = document.getElementById('signupView');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignupBtn = document.getElementById('showSignupBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');

    // Close modal when clicking the close button or outside
    closeBtn.addEventListener('click', () => {
        authModal.classList.remove('show');
        authModal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('show');
            authModal.classList.add('hidden');
        }
    });

    // Switch between login and signup views
    showSignupBtn.addEventListener('click', () => {
        loginView.classList.add('hidden');
        signupView.classList.remove('hidden');
    });

    showLoginBtn.addEventListener('click', () => {
        signupView.classList.add('hidden');
        loginView.classList.remove('hidden');
    });

    // Modificar loginForm para converter o email para minúsculas
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.toLowerCase(); // Converter para minúsculas
        const password = document.getElementById('loginPassword').value;

        try {
            const user = await db.getUserByEmail(email);
            if (user) {
                // Em um ambiente real, você deve verificar a senha aqui
                handleLogin(user);
            } else {
                alert('Usuário não encontrado');
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            alert('Erro ao fazer login. Por favor, tente novamente.');
        }
    });

    // Modificar signupForm
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value.toLowerCase(); // Converter para minúsculas
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupPasswordConfirm').value;

        if (password !== confirmPassword) {
            document.getElementById('passwordMismatch').classList.remove('hidden');
            return;
        }

        try {
            const existingUser = await db.getUserByEmail(email);
            if (existingUser) {
                alert('Este email já está cadastrado');
                return;
            }

            const user = {
                id: Date.now(),
                name: name,
                email: email // Email já está em minúsculas
            };

            handleLogin(user);
        } catch (error) {
            console.error('Erro ao criar conta:', error);
            alert('Erro ao criar conta. Por favor, tente novamente.');
        }
    });

    // Modificar handleLogin
    async function handleLogin(user) {
        try {
            // Salvar/atualizar usuário no banco e no localStorage
            await db.addUser(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Atualizar estado da aplicação
            currentUser = user;
            updateLoginButton();
            authModal.classList.remove('show');
            authModal.classList.add('hidden');
            
            // Limpar formulários
            loginForm.reset();
            signupForm.reset();
            
            // Carregar itens do usuário
            await loadItems('pantry');
            await loadItems('shopping_list');
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            alert('Erro ao fazer login. Por favor, tente novamente.');
        }
    }

    // User Modal Elements
    const userModal = document.getElementById('userModal');
    const userEmail = document.getElementById('userEmail');
    const logoutBtn = document.getElementById('logoutBtn');
    const userModalClose = userModal.querySelector('.close');

    // Update login button based on auth state
    function updateLoginButton() {
        if (currentUser) {
            loginBtn.textContent = currentUser.name;
        } else {
            loginBtn.textContent = 'Login';
        }
    }

    // Show user modal
    function showUserModal() {
        if (currentUser) {
            userEmail.textContent = currentUser.email;
            userModal.classList.add('show');
            userModal.classList.remove('hidden');
        }
    }

    // Close user modal
    userModalClose.addEventListener('click', () => {
        userModal.classList.remove('show');
        userModal.classList.add('hidden');
    });

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === userModal) {
            userModal.classList.remove('show');
            userModal.classList.add('hidden');
        }
    });

    // Handle logout
    logoutBtn.addEventListener('click', () => {
        handleLogout();
        userModal.classList.remove('show');
        userModal.classList.add('hidden');
    });

    // Modificar handleLogout
    function handleLogout() {
        localStorage.removeItem('currentUser'); // Remover usuário do localStorage
        currentUser = null;
        updateLoginButton();
        clearUserData();

        // Garantir que todas as visualizações de itens estejam limpas
        const containers = ['pantryContainer', 'shoppingListContainer'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                const list = container.querySelector('.items-list ul');
                if (list) {
                    list.innerHTML = '<p>Faça login para ver seus itens</p>';
                }
            }
        });
    }

    // Modificar checkAuthState
    async function checkAuthState() {
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                currentUser = JSON.parse(userData);
                const user = await db.getUserByEmail(currentUser.email);
                if (!user) {
                    // Se o usuário não existir no banco, fazer logout
                    handleLogout();
                    return;
                }
                currentUser = user;
                updateLoginButton();
                await loadItems('pantry');
                await loadItems('shopping_list');
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
                handleLogout();
            }
        } else {
            // Garantir que os dados estejam limpos ao iniciar
            handleLogout();
        }
    }

    // Handle password change
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        // Reset error message
        passwordChangeError.classList.add('hidden');

        // Verificar se as senhas novas correspondem
        if (newPassword !== confirmNewPassword) {
            passwordChangeError.textContent = 'As senhas não correspondem';
            passwordChangeError.classList.remove('hidden');
            return;
        }

        try {
            // Em um ambiente real, você deve verificar a senha atual no backend
            // e fazer o hash da nova senha antes de salvá-la
            
            // Simular atualização de senha
            currentUser.passwordUpdatedAt = Date.now();
            await db.addUser(currentUser);
            
            // Limpar formulário e mostrar mensagem de sucesso
            changePasswordForm.reset();
            alert('Senha alterada com sucesso!');
            
            // Fechar modal
            userModal.classList.remove('show');
            userModal.classList.add('hidden');
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            passwordChangeError.textContent = 'Erro ao alterar senha. Por favor, tente novamente.';
            passwordChangeError.classList.remove('hidden');
        }
    });

    // Iniciar verificação de autenticação
    await checkAuthState();

    // Configurar evento de clique do botão de login
    loginBtn.addEventListener('click', () => {
        if (currentUser) {
            showUserModal();
        } else {
            authModal.classList.add('show');
            authModal.classList.remove('hidden');
            loginView.classList.remove('hidden');
            signupView.classList.add('hidden');
        }
    });

    // Elementos dos modais
    const changePasswordModal = document.getElementById('changePasswordModal');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordClose = changePasswordModal.querySelector('.close');

    // Mostrar modal de alteração de senha
    changePasswordBtn.addEventListener('click', () => {
        userModal.classList.remove('show');
        userModal.classList.add('hidden');
        changePasswordModal.classList.add('show');
        changePasswordModal.classList.remove('hidden');
    });

    // Fechar modal de alteração de senha
    changePasswordClose.addEventListener('click', () => {
        changePasswordModal.classList.remove('show');
        changePasswordModal.classList.add('hidden');
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target === userModal || e.target === changePasswordModal) {
            e.target.classList.remove('show');
            e.target.classList.add('hidden');
        }
    });
});