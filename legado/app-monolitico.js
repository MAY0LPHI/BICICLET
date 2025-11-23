document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const app = {
        data: {
            clients: [],
            registros: [],
            selectedClientId: null,
            activeTab: 'clientes',
            currentDailyRecords: [],
        },
        elements: {
            addClientForm: document.getElementById('add-client-form'),
            cpfInput: document.getElementById('cpf'),
            cpfError: document.getElementById('cpf-error'),
            telefoneInput: document.getElementById('telefone'),
            searchInput: document.getElementById('search'),
            clientList: document.getElementById('client-list'),
            clientDetailsSection: document.getElementById('client-details-section'),
            clientDetailsPlaceholder: document.getElementById('client-details-placeholder'),
            addBikeModal: document.getElementById('add-bike-modal'),
            addBikeForm: document.getElementById('add-bike-form'),
            cancelAddBikeBtn: document.getElementById('cancel-add-bike'),
            bikeClientIdInput: document.getElementById('bike-client-id'),
            addRegistroModal: document.getElementById('add-registro-modal'),
            addRegistroForm: document.getElementById('add-registro-form'),
            cancelAddRegistroBtn: document.getElementById('cancel-add-registro'),
            registroClientIdInput: document.getElementById('registro-client-id'),
            registroBikeIdInput: document.getElementById('registro-bike-id'),
            registroClientName: document.getElementById('registro-client-name'),
            registroBikeInfo: document.getElementById('registro-bike-info'),
            clientesTab: document.getElementById('clientes-tab'),
            registrosDiariosTab: document.getElementById('registros-diarios-tab'),
            clientesTabContent: document.getElementById('clientes-tab-content'),
            registrosDiariosTabContent: document.getElementById('registros-diarios-tab-content'),
            dailyRecordsDateInput: document.getElementById('daily-records-date'),
            dailyRecordsSearchInput: document.getElementById('daily-records-search'),
            dailyRecordsList: document.getElementById('daily-records-list'),
            exportBtn: document.getElementById('export-btn'),
            exportOptions: document.getElementById('export-options'),
            exportCsvBtn: document.getElementById('export-csv'),
            exportPdfBtn: document.getElementById('export-pdf'),
            theme: {
                toggleBtn: document.getElementById('theme-toggle'),
                icons: {
                    light: document.getElementById('theme-icon-light'),
                    dark: document.getElementById('theme-icon-dark'),
                }
            },
        },

        init() {
            this.loadTheme();
            this.loadData();
            this.renderClientList();
            this.addEventListeners();
            this.elements.dailyRecordsDateInput.value = new Date().toISOString().split('T')[0];
            this.renderDailyRecords();
        },

        addEventListeners() {
            this.elements.addClientForm.addEventListener('submit', this.handleAddClient.bind(this));
            this.elements.searchInput.addEventListener('input', (e) => this.renderClientList(e.target.value));
            this.elements.addBikeForm.addEventListener('submit', this.handleAddBike.bind(this));
            this.elements.cancelAddBikeBtn.addEventListener('click', () => this.toggleModal('add-bike-modal', false));
            this.elements.addRegistroForm.addEventListener('submit', this.handleAddRegistro.bind(this));
            this.elements.cancelAddRegistroBtn.addEventListener('click', () => this.toggleModal('add-registro-modal', false));
            
            this.elements.cpfInput.addEventListener('input', this.formatCPF.bind(this));
            this.elements.telefoneInput.addEventListener('input', this.formatTelefone.bind(this));

            this.elements.clientesTab.addEventListener('click', () => this.switchTab('clientes'));
            this.elements.registrosDiariosTab.addEventListener('click', () => this.switchTab('registros-diarios'));
            this.elements.dailyRecordsDateInput.addEventListener('change', this.renderDailyRecords.bind(this));
            this.elements.dailyRecordsSearchInput.addEventListener('input', this.renderDailyRecords.bind(this));
            this.elements.dailyRecordsList.addEventListener('click', this.handleRegisterSaida.bind(this));
            this.elements.theme.toggleBtn.addEventListener('click', this.toggleTheme.bind(this));

            this.elements.exportBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleExportMenu();
            });
            this.elements.exportCsvBtn.addEventListener('click', () => this.exportToCSV());
            this.elements.exportPdfBtn.addEventListener('click', () => this.exportToPDF());
            window.addEventListener('click', () => this.toggleExportMenu(false));
        },
        
        loadTheme() {
            const theme = localStorage.getItem('theme');
            if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
                if (this.elements.theme.icons.dark) this.elements.theme.icons.dark.classList.remove('hidden');
                if (this.elements.theme.icons.light) this.elements.theme.icons.light.classList.add('hidden');
            } else {
                document.documentElement.classList.remove('dark');
                if (this.elements.theme.icons.dark) this.elements.theme.icons.dark.classList.add('hidden');
                if (this.elements.theme.icons.light) this.elements.theme.icons.light.classList.remove('hidden');
            }
        },

        toggleTheme() {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            if (isDark) {
                this.elements.theme.icons.dark.classList.remove('hidden');
                this.elements.theme.icons.light.classList.add('hidden');
            } else {
                this.elements.theme.icons.dark.classList.add('hidden');
                this.elements.theme.icons.light.classList.remove('hidden');
            }
        },

        switchTab(tabName) {
            this.data.activeTab = tabName;
            
            const tabs = {
                clientes: { btn: this.elements.clientesTab, content: this.elements.clientesTabContent },
                'registros-diarios': { btn: this.elements.registrosDiariosTab, content: this.elements.registrosDiariosTabContent },
            };

            Object.values(tabs).forEach(tab => {
                tab.btn.classList.remove('border-blue-500', 'text-blue-600', 'dark:text-blue-400', 'dark:border-blue-400');
                tab.btn.classList.add('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
                tab.content.classList.add('hidden');
            });

            const active = tabs[tabName];
            active.btn.classList.add('border-blue-500', 'text-blue-600', 'dark:text-blue-400', 'dark:border-blue-400');
            active.btn.classList.remove('border-transparent', 'text-slate-500', 'hover:text-slate-700', 'hover:border-slate-300');
            active.content.classList.remove('hidden');

            if (tabName === 'registros-diarios') {
                this.renderDailyRecords();
            }
        },

        generateUUID() {
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(new RegExp('[018]', 'g'), c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            );
        },

        migrateData() {
            const oldData = localStorage.getItem('bicicletarioData');
            if (oldData && !localStorage.getItem('bicicletario_clients')) {
                try {
                    const clientsWithRecords = JSON.parse(oldData);
                    const newClients = [];
                    const newRegistros = [];

                    clientsWithRecords.forEach(client => {
                        const newClient = { ...client, bicicletas: [] };
                        (client.bicicletas || []).forEach(bike => {
                            const newBike = { ...bike };
                            if (bike.registros && Array.isArray(bike.registros)) {
                                bike.registros.forEach(registro => {
                                    newRegistros.push({
                                        ...registro,
                                        clientId: client.id,
                                        bikeId: bike.id
                                    });
                                });
                            }
                            delete newBike.registros;
                            newClient.bicicletas.push(newBike);
                        });
                        newClients.push(newClient);
                    });

                    this.data.clients = newClients;
                    this.data.registros = newRegistros;

                    this.saveClients();
                    this.saveRegistros();
                    
                    localStorage.removeItem('bicicletarioData');
                } catch (error) {
                    localStorage.removeItem('bicicletarioData');
                }
                return true;
            }
            return false;
        },

        loadData() {
            if (this.migrateData()) {
                return;
            }
            
            const clientsData = localStorage.getItem('bicicletario_clients');
            if (clientsData) {
                this.data.clients = JSON.parse(clientsData);
            }

            const registrosData = localStorage.getItem('bicicletario_registros');
            if (registrosData) {
                this.data.registros = JSON.parse(registrosData);
            }
        },

        saveClients() {
            localStorage.setItem('bicicletario_clients', JSON.stringify(this.data.clients));
        },

        saveRegistros() {
            localStorage.setItem('bicicletario_registros', JSON.stringify(this.data.registros));
        },
        
        formatCPF(event) {
            let value = event.target.value.replace(new RegExp('\\\\D', 'g'), '');
            value = value.slice(0, 11);

            value = value.replace(new RegExp('(\\\\d{3})(\\\\d)'), '$1.$2');
            value = value.replace(new RegExp('(\\\\d{3})\\\\.(\\\\d{3})(\\\\d)'), '$1.$2.$3');
            value = value.replace(new RegExp('(\\\\d{3})\\\\.(\\\\d{3})\\\\.(\\\\d{3})(\\\\d{1,2})'), '$1.$2.$3-$4');
            
            event.target.value = value;
        },
        
        formatTelefone(event) {
            let value = event.target.value.replace(new RegExp('\\\\D', 'g'), '');
            value = value.slice(0, 11);
            value = value.replace(new RegExp('^(\\\\d{2})(\\\\d)'), '($1) $2');
            value = value.replace(new RegExp('(\\\\d{5})(\\\\d)'), '$1-$2');
            event.target.value = value;
        },

        validateCPF(cpfStr) {
            const cpf = String(cpfStr).replace(new RegExp('[.-]', 'g'), '');
            if (cpf.length !== 11 || new RegExp('^(\\\\d)\\\\1{10}$').test(cpf)) return false;
            let sum = 0;
            for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
            let firstDigit = 11 - (sum % 11);
            if (firstDigit >= 10) firstDigit = 0;
            if (firstDigit !== parseInt(cpf.charAt(9))) return false;
            sum = 0;
            for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
            let secondDigit = 11 - (sum % 11);
            if (secondDigit >= 10) secondDigit = 0;
            if (secondDigit !== parseInt(cpf.charAt(10))) return false;
            return true;
        },

        renderClientList(filter = '') {
            const lowercasedFilter = filter.toLowerCase();
            const filteredClients = this.data.clients.filter(client =>
                client.nome.toLowerCase().includes(lowercasedFilter) ||
                client.cpf.includes(filter)
            ).sort((a,b) => a.nome.localeCompare(b.nome));

            if (filteredClients.length === 0) {
                this.elements.clientList.innerHTML = `<p class=\"text-sm text-slate-500 dark:text-slate-400 text-center py-4\">Nenhum cliente encontrado.</p>`;
                return;
            }
            
            this.elements.clientList.innerHTML = filteredClients.map(client => `
                <div class=\"client-item p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-400 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-700/50 dark:hover:border-blue-500 ${this.data.selectedClientId === client.id ? 'bg-blue-100 border-blue-400 dark:bg-blue-900/50 dark:border-blue-500' : ''}\" data-id=\"${client.id}\">
                    <p class=\"font-semibold text-slate-800 dark:text-slate-100\">${client.nome}</p>
                    <p class=\"text-sm text-slate-500 dark:text-slate-400\">${client.cpf}</p>
                </div>
            `).join('');

            this.elements.clientList.querySelectorAll('.client-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.data.selectedClientId = item.dataset.id;
                    this.renderClientDetails();
                    this.renderClientList(this.elements.searchInput.value);
                });
            });
        },
        
        renderClientDetails() {
            if (!this.data.selectedClientId) {
                this.elements.clientDetailsSection.classList.add('hidden');
                this.elements.clientDetailsPlaceholder.classList.remove('hidden');
                return;
            }
            
            const client = this.data.clients.find(c => c.id === this.data.selectedClientId);
            if (!client) return;

            this.elements.clientDetailsPlaceholder.classList.add('hidden');
            this.elements.clientDetailsSection.classList.remove('hidden');

            const bikesHTML = client.bicicletas.length > 0 ? client.bicicletas.map(bike => `
                <div class=\"bg-slate-50 p-4 rounded-lg border border-slate-200 dark:bg-slate-700/40 dark:border-slate-700\">
                   <div class=\"flex justify-between items-start\">\
                        <div>
                            <p class=\"font-semibold text-slate-800 dark:text-slate-100\">${bike.modelo} <span class=\"font-normal text-slate-600 dark:text-slate-300\">(${bike.marca})</span></p>
                            <p class=\"text-sm text-slate-500 dark:text-slate-400\">Cor: ${bike.cor}</p>
                        </div>
                        <button class=\"add-registro-btn flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md shadow-sm transition-colors dark:bg-blue-500 dark:hover:bg-blue-600\" data-bike-id=\"${bike.id}\">
                            <i data-lucide=\"log-in\" class=\"h-4 w-4 mr-1\"></i>
                            Registrar Entrada
                        </button>
                   </div>
                   <div class=\"mt-4\">
                        <h4 class=\"text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2\">Histórico de Movimentação</h4>
                        ${this.renderRegistrosTable(bike.id)}
                   </div>
                </div>
            `).join('') : '<p class=\"text-sm text-slate-500 dark:text-slate-400 text-center py-4\">Nenhuma bicicleta cadastrada.</p>';

            this.elements.clientDetailsSection.innerHTML = `
                <div class=\"flex justify-between items-center mb-6\">
                    <div>
                        <h3 class=\"text-xl font-bold text-slate-800 dark:text-slate-100\">${client.nome}</h3>
                        <p class=\"text-slate-500 dark:text-slate-400\">${client.cpf} &bull; ${client.telefone}</p>
                    </div>
                    <button id=\"add-bike-to-client-btn\" class=\"flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow-sm transition-colors dark:bg-blue-500 dark:hover:bg-blue-600\">\
                        <i data-lucide=\"plus\" class=\"h-4 w-4 mr-1\"></i>
                        Adicionar Bicicleta
                    </button>
                </div>
                <div class=\"space-y-4 max-h-[70vh] overflow-y-auto pr-2\">
                    ${bikesHTML}
                </div>
            `;

            lucide.createIcons();
            
            document.getElementById('add-bike-to-client-btn').addEventListener('click', () => this.openAddBikeModal(client.id));
            this.elements.clientDetailsSection.querySelectorAll('.add-registro-btn').forEach(btn => {
                btn.addEventListener('click', () => this.openAddRegistroModal(client.id, btn.dataset.bikeId));
            });
        },
        
        renderRegistrosTable(bikeId) {
            const bikeRegistros = this.data.registros.filter(r => r.bikeId === bikeId);
            if (!bikeRegistros || bikeRegistros.length === 0) {
                return '<p class=\"text-xs text-slate-500 dark:text-slate-400\">Nenhum registro encontrado.</p>';
            }
            
            const sortedRegistros = [...bikeRegistros].sort((a, b) => new Date(b.dataHoraEntrada) - new Date(a.dataHoraEntrada));

            return `
                <div class=\"overflow-x-auto\">
                    <table class=\"w-full text-sm\">
                        <thead class=\"text-left\">
                            <tr class=\"border-b border-slate-200 dark:border-slate-700\">
                                <th class=\"font-medium text-slate-500 dark:text-slate-400 py-2 pr-2\">Entrada</th>
                                <th class=\"font-medium text-slate-500 dark:text-slate-400 py-2 px-2\">Saída</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sortedRegistros.map(reg => `
                                <tr class=\"border-b border-slate-100 dark:border-slate-700/50\">
                                    <td class=\"py-2 pr-2 text-slate-600 dark:text-slate-300\">${new Date(reg.dataHoraEntrada).toLocaleString('pt-BR')}</td>
                                    <td class=\"py-2 px-2 text-slate-600 dark:text-slate-300\">
                                        ${reg.dataHoraSaida ? new Date(reg.dataHoraSaida).toLocaleString('pt-BR') : '<span class=\"text-xs font-medium text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/50 px-2 py-1 rounded-full\">Em aberto</span>'}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        },

        handleAddClient(e) {
            e.preventDefault();
            const formData = new FormData(this.elements.addClientForm);
            const nome = formData.get('nome');
            const cpf = formData.get('cpf');
            const telefone = formData.get('telefone');
            
            this.elements.cpfError.classList.add('hidden');
            this.elements.cpfInput.classList.remove('border-red-500');

            if (!this.validateCPF(cpf)) {
                this.elements.cpfError.textContent = 'CPF inválido.';
                this.elements.cpfError.classList.remove('hidden');
                this.elements.cpfInput.classList.add('border-red-500');
                return;
            }

            if(this.data.clients.some(c => c.cpf === cpf)) {
                this.elements.cpfError.textContent = 'CPF já cadastrado.';
                this.elements.cpfError.classList.remove('hidden');
                this.elements.cpfInput.classList.add('border-red-500');
                return;
            }

            const newClient = { id: this.generateUUID(), nome, cpf, telefone, bicicletas: [] };
            this.data.clients.push(newClient);
            this.saveClients();
            this.renderClientList();
            this.elements.addClientForm.reset();
        },

        handleAddBike(e) {
            e.preventDefault();
            const clientId = this.elements.bikeClientIdInput.value;
            const modelo = document.getElementById('bike-modelo').value;
            const marca = document.getElementById('bike-marca').value;
            const cor = document.getElementById('bike-cor').value;

            const client = this.data.clients.find(c => c.id === clientId);
            if (client) {
                const newBike = { id: this.generateUUID(), modelo, marca, cor };
                client.bicicletas.push(newBike);
                this.saveClients();
                this.renderClientDetails();
                this.toggleModal('add-bike-modal', false);
            }
        },
        
        handleAddRegistro(e) {
            e.preventDefault();
            const clientId = this.elements.registroClientIdInput.value;
            const bikeId = this.elements.registroBikeIdInput.value;
            const client = this.data.clients.find(c => c.id === clientId);
            const bike = client?.bicicletas.find(b => b.id === bikeId);
            
            if(bike) {
                const newRegistro = { 
                    id: this.generateUUID(), 
                    dataHoraEntrada: new Date().toISOString(), 
                    dataHoraSaida: null,
                    clientId: clientId,
                    bikeId: bikeId,
                };
                this.data.registros.push(newRegistro);
                this.saveRegistros();
                
                this.renderClientDetails();
                if (this.data.activeTab === 'registros-diarios') {
                    this.renderDailyRecords();
                }
                this.toggleModal('add-registro-modal', false);
            }
        },
        
        openAddBikeModal(clientId) {
            this.elements.addBikeForm.reset();
            this.elements.bikeClientIdInput.value = clientId;
            this.toggleModal('add-bike-modal', true);
        },

        openAddRegistroModal(clientId, bikeId) {
            const client = this.data.clients.find(c => c.id === clientId);
            const bike = client?.bicicletas.find(b => b.id === bikeId);

            if (client && bike) {
                this.elements.addRegistroForm.reset();
                this.elements.registroClientIdInput.value = clientId;
                this.elements.registroBikeIdInput.value = bikeId;
                this.elements.registroClientName.textContent = client.nome;
                this.elements.registroBikeInfo.textContent = `${bike.modelo} (${bike.marca} - ${bike.cor})`;
                this.toggleModal('add-registro-modal', true);
            }
        },
        
        toggleModal(modalId, show) {
            const modal = document.getElementById(modalId);
            const modalContent = modal.querySelector('.modal-content');
            if (show) {
                modal.classList.remove('hidden');
                setTimeout(() => {
                    modal.classList.add('opacity-100');
                    modalContent.classList.replace('scale-95', 'scale-100');
                }, 10);
            } else {
                modal.classList.remove('opacity-100');
                modalContent.classList.replace('scale-100', 'scale-95');
                setTimeout(() => { modal.classList.add('hidden'); }, 300);
            }
        },

        toggleExportMenu(show) {
            const isHidden = this.elements.exportOptions.classList.contains('hidden');
            if (show === undefined) {
                this.elements.exportOptions.classList.toggle('hidden');
            } else if (show && isHidden) {
                this.elements.exportOptions.classList.remove('hidden');
            } else if (!show && !isHidden) {
                this.elements.exportOptions.classList.add('hidden');
            }
        },

        exportToCSV() {
            this.toggleExportMenu(false);
            if (this.data.currentDailyRecords.length === 0) {
                alert('Não há dados para exportar.');
                return;
            }

            const headers = ['Cliente', 'CPF', 'Bicicleta', 'Marca', 'Cor', 'Entrada', 'Saída'];
            const escapeCsv = (field) => {
                if (field === null || field === undefined) return '';
                let str = String(field);
                if (str.includes(',') || str.includes('\"') || str.includes('\\n')) {
                    str = '\"' + str.replace(new RegExp('\"', 'g'), '\"\"') + '\"';
                }
                return str;
            };

            const rows = this.data.currentDailyRecords.map(({ client, bike, registro }) => [
                escapeCsv(client.nome),
                escapeCsv(client.cpf),
                escapeCsv(bike.modelo),
                escapeCsv(bike.marca),
                escapeCsv(bike.cor),
                escapeCsv(new Date(registro.dataHoraEntrada).toLocaleString('pt-BR')),
                escapeCsv(registro.dataHoraSaida ? new Date(registro.dataHoraSaida).toLocaleString('pt-BR') : 'Em aberto')
            ]);

            let csvContent = headers.join(",") + "\r\n" + rows.map(e => e.join(",")).join("\r\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            const selectedDateStr = this.elements.dailyRecordsDateInput.value;
            link.setAttribute("download", `registros_${selectedDateStr || 'data_selecionada'}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        },

        exportToPDF() {
            this.toggleExportMenu(false);
            if (this.data.currentDailyRecords.length === 0) {
                alert('Não há dados para exportar.');
                return;
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const head = [['Cliente', 'Bicicleta', 'Entrada', 'Saída']];
            const body = this.data.currentDailyRecords.map(({ client, bike, registro }) => [
                `${client.nome}\n(${client.cpf})`,
                `${bike.modelo}\n(${bike.marca} - ${bike.cor})`,
                new Date(registro.dataHoraEntrada).toLocaleString('pt-BR'),
                registro.dataHoraSaida ? new Date(registro.dataHoraSaida).toLocaleString('pt-BR') : 'Em aberto'
            ]);
            
            const selectedDateStr = this.elements.dailyRecordsDateInput.value;
            const selectedDate = new Date(selectedDateStr);
            const formattedDate = selectedDate.toLocaleDateString('pt-BR', {timeZone: 'UTC'});
    
            doc.text(`Registros do dia: ${formattedDate}`, 14, 15);
            doc.autoTable({
                startY: 20,
                head: head,
                body: body,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
            });
    
            doc.save(`registros_${selectedDateStr}.pdf`);
        },

        renderDailyRecords() {
            const selectedDateStr = this.elements.dailyRecordsDateInput.value;
            if (!selectedDateStr) {
                this.elements.dailyRecordsList.innerHTML = `<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Selecione uma data para ver os registros.</p>`;
                this.data.currentDailyRecords = [];
                return;
            }
            
            const dailyRecordsRaw = this.data.registros.filter(registro => 
                registro.dataHoraEntrada.startsWith(selectedDateStr)
            );

            let dailyRecords = dailyRecordsRaw.map(registro => {
                const client = this.data.clients.find(c => c.id === registro.clientId);
                if (!client) return null;
                const bike = client.bicicletas.find(b => b.id === registro.bikeId);
                if (!bike) return null;
                return { client, bike, registro };
            }).filter(Boolean);


            const searchTerm = this.elements.dailyRecordsSearchInput.value.toLowerCase();
            if (searchTerm) {
                dailyRecords = dailyRecords.filter(({ client, bike }) => 
                    client.nome.toLowerCase().includes(searchTerm) ||
                    client.cpf.includes(searchTerm) ||
                    bike.modelo.toLowerCase().includes(searchTerm) ||
                    bike.marca.toLowerCase().includes(searchTerm) ||
                    bike.cor.toLowerCase().includes(searchTerm)
                );
            }

            dailyRecords.sort((a,b) => new Date(a.registro.dataHoraEntrada) - new Date(b.registro.dataHoraEntrada));
            this.data.currentDailyRecords = dailyRecords;

            if (this.data.currentDailyRecords.length === 0) {
                this.elements.dailyRecordsList.innerHTML = `<p class=\"text-sm text-slate-500 dark:text-slate-400 text-center py-4\">Nenhum registro encontrado para esta data${searchTerm ? ' com o filtro aplicado' : ''}.</p>`;
                return;
            }

            this.elements.dailyRecordsList.innerHTML = `
                <table class=\"w-full text-sm\">
                    <thead class=\"text-left bg-slate-50 dark:bg-slate-700/40\">
                        <tr class=\"border-b border-slate-200 dark:border-slate-700\">
                            <th class=\"font-semibold text-slate-600 dark:text-slate-300 p-3\">Cliente</th>
                            <th class=\"font-semibold text-slate-600 dark:text-slate-300 p-3\">Bicicleta</th>
                            <th class=\"font-semibold text-slate-600 dark:text-slate-300 p-3\">Entrada</th>
                            <th class=\"font-semibold text-slate-600 dark:text-slate-300 p-3\">Saída</th>
                            <th class=\"font-semibold text-slate-600 dark:text-slate-300 p-3\">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.data.currentDailyRecords.map(({client, bike, registro}) => `
                            <tr class=\"border-b border-slate-100 dark:border-slate-700\">
                                <td class=\"p-3 align-top\">
                                    <p class=\"font-medium text-slate-800 dark:text-slate-100\">${client.nome}</p>
                                    <p class=\"text-xs text-slate-500 dark:text-slate-400\">${client.cpf}</p>
                                </td>
                                <td class=\"p-3 align-top\">
                                    <p class=\"font-medium text-slate-800 dark:text-slate-100\">${bike.modelo}</p>
                                    <p class=\"text-xs text-slate-500 dark:text-slate-400\">${bike.marca} - ${bike.cor}</p>
                                </td>
                                <td class=\"p-3 align-top text-slate-600 dark:text-slate-300\">${new Date(registro.dataHoraEntrada).toLocaleString('pt-BR')}</td>
                                <td class=\"p-3 align-top text-slate-600 dark:text-slate-300\">${registro.dataHoraSaida ? new Date(registro.dataHoraSaida).toLocaleString('pt-BR') : ''}</td>
                                <td class=\"p-3 align-top\">
                                    ${!registro.dataHoraSaida ? `
                                        <button class=\"register-saida-btn flex items-center text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md shadow-sm transition-colors\" data-client-id=\"${client.id}\" data-bike-id=\"${bike.id}\" data-registro-id=\"${registro.id}\">
                                            <i data-lucide=\"log-out\" class=\"h-4 w-4 mr-1\"></i>
                                            Registrar Saída
                                        </button>
                                    ` : '<span class=\"text-xs font-medium text-green-800 bg-green-100 dark:text-green-400 dark:bg-green-900/50 px-2 py-1 rounded-full\">Finalizado</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            lucide.createIcons();
        },

        handleRegisterSaida(e) {
            const btn = e.target.closest('.register-saida-btn');
            if (!btn) return;

            const { registroId } = btn.dataset;
            const registro = this.data.registros.find(r => r.id === registroId);

            if (registro) {
                registro.dataHoraSaida = new Date().toISOString();
                this.saveRegistros();
                this.renderDailyRecords();
                if (this.data.selectedClientId === registro.clientId) {
                    this.renderClientDetails();
                }
            }
        }
    };

    app.init();
});
