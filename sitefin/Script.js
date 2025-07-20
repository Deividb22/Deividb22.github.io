// SUBSTITUA PELA URL QUE VOCÊ OBTEVE DO GOOGLE APPS SCRIPT
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwEscDtKY0_0cCCMmrRB1QUrpzxNEDCewJzM-N_jGNARPWU8gvJkev_LIz5TshQ0-79/exec'; 

document.addEventListener('DOMContentLoaded', () => {
    // Elementos da aba de Movimentações
    const expenseForm = document.getElementById('expenseForm');
    const messageDiv = document.getElementById('message');
    const expenseTableBody = document.querySelector('#expenseTable tbody');
    const monthlyIncomeSpan = document.getElementById('monthlyIncome');
    const monthlyExpenseSpan = document.getElementById('monthlyExpense');
    const monthlyBalanceSpan = document.getElementById('monthlyBalance');

    // Elementos da aba de Recorrentes
    const recurringExpenseForm = document.getElementById('recurringExpenseForm');
    const recurringMessageDiv = document.getElementById('recurringMessage');
    const recurringTableBody = document.querySelector('#recurringTable tbody');
    const addRecurrentsToSheetButton = document.getElementById('addRecurrentsToSheet');

    // Elementos das Abas (Tabs)
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // --- Lógica das Abas ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove a classe 'active' de todos os botões e conteúdos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Adiciona a classe 'active' ao botão clicado e ao conteúdo correspondente
            const targetTab = button.dataset.tab;
            document.getElementById(targetTab).classList.add('active');
            button.classList.add('active');

            // Recarregar dados quando a aba de movimentações é ativada
            if (targetTab === 'movimentacoes') {
                loadRecords();
            } else if (targetTab === 'recorrentes') {
                loadRecurringRecords();
            }
        });
    });

    // --- Funções Auxiliares ---
    function showMessage(msg, type, targetDiv = messageDiv) {
        targetDiv.textContent = msg;
        targetDiv.className = `message ${type}`;
        setTimeout(() => {
            targetDiv.textContent = '';
            targetDiv.className = 'message';
        }, 3000); // Mensagem desaparece após 3 segundos
    }

    // --- Lógica da aba de Movimentações ---

    // Função para adicionar uma nova movimentação
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Impede o envio padrão do formulário

        const data = document.getElementById('data').value;
        const descricao = document.getElementById('descricao').value;
        const tipo = document.getElementById('tipo').value;
        const valor = parseFloat(document.getElementById('valor').value).toFixed(2);
        const categoria = document.getElementById('categoria').value;

        // Validação simples
        if (!data || !descricao || isNaN(valor) || !categoria) {
            showMessage('Por favor, preencha todos os campos corretamente.', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'addRecord');
            formData.append('data', data);
            formData.append('descricao', descricao);
            formData.append('tipo', tipo);
            formData.append('valor', valor);
            formData.append('categoria', categoria);

            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                showMessage('Movimentação adicionada com sucesso!', 'success');
                expenseForm.reset(); // Limpa o formulário
                loadRecords(); // Recarrega a tabela de movimentações
            } else {
                showMessage('Erro ao adicionar movimentação. Tente novamente.', 'error');
            }

        } catch (error) {
            console.error('Erro:', error);
            showMessage('Ocorreu um erro na comunicação. Verifique sua conexão.', 'error');
        }
    });

    // Função para carregar as movimentações da planilha e calcular o saldo
    async function loadRecords() {
        try {
            const response = await fetch(`${WEB_APP_URL}?action=getRecords`);
            if (response.ok) {
                const records = await response.json();
                expenseTableBody.innerHTML = ''; // Limpa a tabela
                
                let totalIncome = 0;
                let totalExpense = 0;
                const today = new Date();
                const currentMonth = today.getMonth(); // Mês atual (0-11)
                const currentYear = today.getFullYear();

                // Filtra e calcula para o mês atual
                records.forEach(record => {
                    const recordDate = new Date(record[0].split('/').reverse().join('-')); // Converte dd/MM/yyyy para yyyy-MM-dd
                    const recordMonth = recordDate.getMonth();
                    const recordYear = recordDate.getFullYear();
                    const value = parseFloat(record[3]); // Valor é o índice 3 agora
                    const type = record[2]; // Tipo é o índice 2 agora

                    if (recordMonth === currentMonth && recordYear === currentYear) {
                        if (type === 'Receita') {
                            totalIncome += value;
                        } else if (type === 'Despesa') {
                            totalExpense += value;
                        }
                    }
                });

                monthlyIncomeSpan.textContent = totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                monthlyExpenseSpan.textContent = totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                monthlyBalanceSpan.textContent = (totalIncome - totalExpense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                // Limita a exibição aos últimos 10 registros na tabela
                const lastTenRecords = records.slice(Math.max(records.length - 10, 0));

                lastTenRecords.reverse().forEach(record => { // Exibe os mais recentes primeiro
                    const row = expenseTableBody.insertRow();
                    row.insertCell().textContent = record[0]; // Data
                    row.insertCell().textContent = record[1]; // Descrição
                    row.insertCell().textContent = record[2]; // Tipo
                    row.insertCell().textContent = parseFloat(record[3]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); // Valor formatado
                    row.insertCell().textContent = record[4]; // Categoria
                });
            } else {
                showMessage('Erro ao carregar movimentações.', 'error');
            }
        } catch (error) {
            console.error('Erro ao carregar registros:', error);
            showMessage('Erro ao carregar dados. Verifique a URL do Apps Script.', 'error');
        }
    }

    // --- Lógica da aba de Recorrentes ---

    // Função para adicionar uma nova movimentação recorrente
    recurringExpenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const descricao = document.getElementById('recorrente-descricao').value;
        const tipo = document.getElementById('recorrente-tipo').value;
        const valor = parseFloat(document.getElementById('recorrente-valor').value).toFixed(2);
        const categoria = document.getElementById('recorrente-categoria').value;
        const diaDoMes = parseInt(document.getElementById('recorrente-dia').value);

        if (!descricao || isNaN(valor) || !categoria || isNaN(diaDoMes) || diaDoMes < 1 || diaDoMes > 31) {
            showMessage('Por favor, preencha todos os campos da movimentação recorrente corretamente.', 'error', recurringMessageDiv);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'addRecurringRecord');
            formData.append('descricao', descricao);
            formData.append('tipo', tipo);
            formData.append('valor', valor);
            formData.append('categoria', categoria);
            formData.append('diaDoMes', diaDoMes);

            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                showMessage('Movimentação recorrente adicionada!', 'success', recurringMessageDiv);
                recurringExpenseForm.reset();
                loadRecurringRecords();
            } else {
                showMessage('Erro ao adicionar recorrente. Tente novamente.', 'error', recurringMessageDiv);
            }

        } catch (error) {
            console.error('Erro:', error);
            showMessage('Ocorreu um erro na comunicação com o script recorrente.', 'error', recurringMessageDiv);
        }
    });

    // Função para carregar as movimentações recorrentes
    async function loadRecurringRecords() {
        try {
            const response = await fetch(`${WEB_APP_URL}?action=getRecurringRecords`);
            if (response.ok) {
                const records = await response.json();
                recurringTableBody.innerHTML = '';
                records.forEach((record, index) => {
                    const row = recurringTableBody.insertRow();
                    row.insertCell().textContent = record[0]; // Descrição
                    row.insertCell().textContent = record[1]; // Tipo
                    row.insertCell().textContent = parseFloat(record[2]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); // Valor
                    row.insertCell().textContent = record[3]; // Categoria
                    row.insertCell().textContent = record[4]; // Dia do Mês

                    const actionCell = row.insertCell();
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Excluir';
                    deleteButton.classList.add('delete-button'); // Adiciona classe para estilização
                    deleteButton.addEventListener('click', () => deleteRecurringRecord(index, record[0])); // Passa o índice original e descrição
                    actionCell.appendChild(deleteButton);
                });
            } else {
                showMessage('Erro ao carregar movimentações recorrentes.', 'error', recurringMessageDiv);
            }
        } catch (error) {
            console.error('Erro ao carregar registros recorrentes:', error);
            showMessage('Erro ao carregar dados recorrentes. Verifique a URL.', 'error', recurringMessageDiv);
        }
    }

    // Função para excluir uma movimentação recorrente
    async function deleteRecurringRecord(index, description) {
        if (!confirm(`Tem certeza que deseja excluir "${description}"?`)) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'deleteRecurringRecord');
            formData.append('rowIndex', index); // O Apps Script precisa do índice da linha na planilha

            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                showMessage('Registro excluído com sucesso!', 'success', recurringMessageDiv);
                loadRecurringRecords(); // Recarrega a tabela
            } else {
                showMessage('Erro ao excluir registro. Tente novamente.', 'error', recurringMessageDiv);
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            showMessage('Erro na comunicação ao tentar excluir.', 'error', recurringMessageDiv);
        }
    }


    // Função para adicionar movimentações recorrentes do mês atual à planilha principal
    addRecurrentsToSheetButton.addEventListener('click', async () => {
        if (!confirm('Deseja adicionar as movimentações recorrentes deste mês à sua planilha principal?')) {
            return;
        }

        try {
            const formData = new FormData();
            formData.append('action', 'addRecurrentsToMainSheet');

            const response = await fetch(WEB_APP_URL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.text(); // O script retorna um texto
                showMessage(result, 'success', recurringMessageDiv);
                loadRecords(); // Recarrega a tabela de movimentações para mostrar os novos dados
            } else {
                showMessage('Erro ao adicionar recorrentes à planilha principal.', 'error', recurringMessageDiv);
            }
        } catch (error) {
            console.error('Erro ao adicionar recorrentes:', error);
            showMessage('Ocorreu um erro na comunicação.', 'error', recurringMessageDiv);
        }
    });


    // Carrega as movimentações quando a página é carregada
    loadRecords(); // Carrega a aba padrão
});