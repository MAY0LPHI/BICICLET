
        import { Auth } from './js/shared/auth.js';
        import { Storage } from './js/shared/storage.js';
        import { Utils } from './js/shared/utils.js';
        import { notificationManager } from './js/shared/notifications.js';
        import { Modals } from './js/shared/modals.js';
        import { TicketConfig } from './js/shared/ticket-config.js';
        import { TicketPrinter } from './js/shared/ticket-printer.js';

        // -------------------------
        // Application State & Logic
        // -------------------------
        class DashboardApp {
            constructor() {
                this.userData = null;
                this.allClients = [];
                this.allRegistros = [];
                this.activeRegistros = [];
                this.selectedClient = null; // Added for checkin modal
            }

            async init() {
                // 1. Validate Authentication
                if (!Auth.isLoggedIn()) {
                    window.location.href = '/login.html';
                    return;
                }
                this.userData = Auth.getCurrentSession();
                document.getElementById('userName').textContent = `${this.userData.nome} (${this.userData.tipo})`;

                // 2. Initialize Subsystems
                lucide.createIcons();
                this.setupTheme();
                this.setupModals(); // This will now handle checkin/checkout modal setup
                this.setupLogout();

                // 3. Load Data & Render
                await this.refreshData();
                // this.setupCheckinSearch(); // Removed, now part of setupModals
                this.setupCheckoutSearch();
            }

            setupTheme() {
                // Use the global theme setting from localStorage if available
                const savedTheme = localStorage.getItem('biciclet_theme');
                if (savedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (savedTheme === 'light') {
                    document.documentElement.classList.remove('dark');
                } else {
                    // System preference config
                    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                        document.documentElement.classList.add('dark');
                    }
                }
            }

            async refreshData() {
                // Fetch data from real storage structure
                this.allClients = await Storage.loadClients();
                this.allRegistros = (await Storage.loadRegistros()) || [];

                // Filter what is currently parked (in pÃ¡tio)
                this.activeRegistros = this.allRegistros.filter(r => !r.dataHoraSaida && !r.acessoRemovido);

                this.renderStatus();
                this.renderActivityFeed();
            }

            renderStatus() {
                const countDisplay = document.getElementById('ocupacaoCount');
                countDisplay.textContent = this.activeRegistros.length;
            }

            renderActivityFeed() {
                const feedContainer = document.getElementById('activityList');

                // Get latest 10 actions (combining entries and exits)
                let activities = [];

                this.allRegistros.forEach(r => {
                    const client = this.allClients.find(c => c.id === r.clientId) || { nome: 'Desconhecido', cpf: '000.000' };

                    // Add entry
                    activities.push({
                        type: 'entrada',
                        time: new Date(r.dataHoraEntrada),
                        record: r,
                        client: client
                    });

                    // Add exit if exists
                    if (r.dataHoraSaida) {
                        activities.push({
                            type: 'saida',
                            time: new Date(r.dataHoraSaida),
                            record: r,
                            client: client
                        });
                    }
                });

                // Sort descending by time
                activities.sort((a, b) => b.time - a.time);
                activities = activities.slice(0, 8); // Display top 8 recent

                // Render
                if (activities.length === 0) {
                    feedContainer.innerHTML = '<div class="p-6 text-center text-slate-500 dark:text-slate-400">Nenhuma movimentaÃ§Ã£o hoje.</div>';
                    return;
                }

                feedContainer.innerHTML = activities.map(act => {
                    const isEntry = act.type === 'entrada';
                    const iconColor = isEntry ? 'text-green-500 bg-green-50 dark:bg-green-500/10' : 'text-blue-500 bg-blue-50 dark:bg-blue-500/10';
                    const iconName = isEntry ? 'arrow-down-to-line' : 'arrow-up-from-line';
                    const timeStr = act.time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const bikeDesc = act.record.bikeSnapshot ? `${act.record.bikeSnapshot.modelo} (${act.record.bikeSnapshot.marca})` : 'Bicicleta nÃ£o detalhada';

                    const senhaBadge = act.record.senha ? `<span class="inline-block bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs ml-2 font-mono font-bold tracking-wider">#${act.record.senha}</span>` : '';

                    return `
                        <div class="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconColor}">
                                <i data-lucide="${iconName}" class="w-5 h-5"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate flex items-center">${act.client.nome} ${senhaBadge}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    <i data-lucide="bike" class="w-3 h-3 inline mr-0.5"></i> ${bikeDesc}
                                </p>
                            </div>
                            <div class="text-right shrink-0">
                                <p class="text-xs font-semibold ${isEntry ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'} uppercase tracking-wider mb-0.5">
                                    ${isEntry ? 'Entrada' : 'SaÃ­da'}
                                </p>
                                <p class="text-xs text-slate-400">${timeStr}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                lucide.createIcons();
            }

            // -------------------------
            // Modal Logics & UI
            // -------------------------
            setupModals() {
                // Check-in
                const btnCheckin = document.getElementById('btnCheckin');
                const modalCheckin = document.getElementById('modalCheckin');
                const contentCheckin = document.getElementById('modalCheckinContent');
                const searchInput = document.getElementById('searchClientInput');
                const listContainer = document.getElementById('clientsSelectList');
                const clearBtn = document.getElementById('clearSelectionBtn');
                const form = document.getElementById('formCheckin');
                const btnConfirmCheckin = document.getElementById('btnConfirmCheckin');

                // Ticket Config elements
                const ticketContainer = document.getElementById('checkin-ticket-container');
                const ticketInput = document.getElementById('checkin-ticket-number');
                const ticketRequiredMark = document.getElementById('checkin-ticket-required-mark');
                const ticketHelp = document.getElementById('checkin-ticket-help');
                const checkinCategoriaInput = document.getElementById('checkin-categoria');

                if (TicketConfig.isManualMode()) {
                    ticketContainer.classList.remove('hidden');
                    if (TicketConfig.isManualRequired()) {
                        ticketRequiredMark.classList.remove('hidden');
                        ticketInput.required = true;
                        ticketHelp.innerHTML = "A digitaÃ§Ã£o do <strong>CartÃ£o FÃ­sico</strong> Ã© obrigatÃ³ria para registrar a entrada.";
                        ticketHelp.classList.add('text-amber-600', 'dark:text-amber-400');
                    }
                }

                btnCheckin.addEventListener('click', () => {
                    this.openModal(modalCheckin, contentCheckin);
                    searchInput.value = '';
                    this.renderClientsSearch('');
                    this.clearCheckinSelection(); // Ensure clean state
                    setTimeout(() => searchInput.focus(), 100);
                });

                searchInput.addEventListener('focus', () => {
                    listContainer.classList.remove('hidden');
                    this.renderClientsSearch(searchInput.value);
                });

                searchInput.addEventListener('input', (e) => {
                    listContainer.classList.remove('hidden');
                    this.renderClientsSearch(e.target.value);
                });

                document.addEventListener('click', (e) => {
                    if (!searchInput.contains(e.target) && !listContainer.contains(e.target)) {
                        listContainer.classList.add('hidden');
                    }
                });

                clearBtn.addEventListener('click', () => {
                    this.clearCheckinSelection();
                    searchInput.focus();
                });

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    if (!this.selectedClient) return;

                    const bikeId = document.getElementById('entryBikeId').value;
                    if (!bikeId) return;

                    const bike = this.selectedClient.bicicletas.find(b => b.id === bikeId);
                    if (!bike) return;

                    let numeroSenha = ticketInput.value.trim();
                    if (TicketConfig.isManualMode() && !numeroSenha && TicketConfig.isManualRequired()) {
                        notificationManager.showNotification('Erro', 'NÃºmero da ficha Ã© obrigatÃ³rio.', 'error');
                        return;
                    }
                    if (!TicketConfig.isManualMode() || (TicketConfig.isManualMode() && !numeroSenha)) {
                        numeroSenha = await Storage.getNextTicketNumber();
                    }


                    const newRegistro = {
                        id: Utils.generateUUID(),
                        dataHoraEntrada: Utils.getLocalISOString(),
                        dataHoraSaida: null,
                        clientId: this.selectedClient.id,
                        bikeId: bikeId,
                        categoria: checkinCategoriaInput.value || this.selectedClient.categoria,
                        senha: numeroSenha,
                        bikeSnapshot: {
                            modelo: bike.modelo,
                            marca: bike.marca,
                            cor: bike.cor
                        },
                        origem: 'dashboard'
                    };

                    this.allRegistros.push(newRegistro);
                    await Storage.saveRegistros(this.allRegistros);
                    notificationManager.onClientActivity();

                    // logAction('register_entry', 'registro', newRegistro.id, {
                    //      cliente: this.selectedClient.nome,
                    //      senha: numeroSenha
                    // }); // Assuming logAction is defined elsewhere or removed

                    this.closeModal(modalCheckin, contentCheckin);
                    this.clearCheckinSelection();
                    await this.refreshData();

                    // Exibir modal GIGANTE com opÃ§Ã£o de imprimir se ativo
                    Modals.show('Entrada Confirmada', `
                        <div class="text-center py-6">
                            <p class="text-slate-600 dark:text-slate-300 mb-6 text-lg">A bicicleta de <strong>${this.selectedClient.nome}</strong> entrou com sucesso.</p>

                            <div class="inline-block bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-2xl p-8 min-w-[280px] shadow-sm relative overflow-hidden">
                                <div class="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                                <p class="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-2 font-medium">NÂº Ficha / Ticket</p>
                                <p class="text-7xl font-black text-blue-700 dark:text-blue-300 tracking-tighter" style="font-family: monospace;">${numeroSenha}</p>
                            </div>

                            <div class="mt-8 flex justify-center gap-3">
                                ${TicketConfig.isPrintEnabled() ? `<button id="btn-print-huge-ticket" class="px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                                     <i class="lucide-printer w-5 h-5"></i> Imprimir Recibo
                                </button>` : ''}
                                <button onclick="Modals.close()" class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm">
                                    Concluir
                                </button>
                            </div>
                        </div>
                    `);

                    // Hook botÃ£o de Imprimir no modal gigante se existir
                    setTimeout(() => {
                        const icon = document.querySelector('.lucide-printer');
                        if (icon) {
                            if (window.lucide) window.lucide.createIcons();
                            else { /* fallback icon SVG */
                                icon.outerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>';
                            }
                        }

                        const printBtn = document.getElementById('btn-print-huge-ticket');
                        if (printBtn) {
                            printBtn.addEventListener('click', () => {
                                TicketPrinter.print(newRegistro, this.selectedClient, bike);
                                printBtn.innerHTML = '<i class="lucide-check w-5 h-5"></i> Imprimindo...';
                                printBtn.classList.replace('bg-slate-200', 'bg-emerald-100');
                                printBtn.classList.replace('text-slate-800', 'text-emerald-700');
                                setTimeout(() => { Modals.close(); }, 3000);
                            });
                        }
                    }, 50);
                });


                // Check-out
                const btnCheckout = document.getElementById('btnCheckout');
                const modalCheckout = document.getElementById('modalCheckout');
                const contentCheckout = document.getElementById('modalCheckoutContent');

                btnCheckout.addEventListener('click', () => {
                    this.openModal(modalCheckout, contentCheckout);
                    document.getElementById('searchParkedInput').value = '';
                    this.renderParkedSearch('');
                    setTimeout(() => document.getElementById('searchParkedInput').focus(), 100);
                });

                // Universal Close buttons
                document.querySelectorAll('.modal-close').forEach(btn => {
                    btn.addEventListener('click', () => {
                        this.closeModal(modalCheckin, contentCheckin);
                        this.closeModal(modalCheckout, contentCheckout);

                        // Reset forms
                        this.clearCheckinSelection();
                        document.getElementById('btnConfirmCheckout').disabled = true;

                    });
                });
            }

            openModal(modalBg, modalContent) {
                modalBg.classList.remove('hidden');
                // reflow helper
                void modalBg.offsetWidth;
                modalBg.classList.add('opacity-100');
                modalBg.classList.remove('opacity-0');

                modalContent.classList.add('scale-100', 'opacity-100');
                modalContent.classList.remove('scale-95', 'opacity-0');
            }

            closeModal(modalBg, modalContent) {
                modalBg.classList.add('opacity-0');
                modalBg.classList.remove('opacity-100');

                modalContent.classList.add('scale-95', 'opacity-0');
                modalContent.classList.remove('scale-100', 'opacity-100');

                setTimeout(() => {
                    modalBg.classList.add('hidden');
                }, 300);
            }

            // -------------------------
            // ENTRY (Dar Entrada) Logic
            // -------------------------
            setupCheckinSearch() {
                // This function is now largely integrated into setupModals and the form submit listener.
                // Keeping it as a placeholder if specific search-only logic is needed outside the modal setup.
            }

            renderClientsSearch(query) {
                const listContainer = document.getElementById('clientsSelectList');
                const queryTerm = (query || '').trim();

                if (!queryTerm) {
                    listContainer.classList.add('hidden');
                    return;
                }

                listContainer.classList.remove('hidden');
                const searchTerm = queryTerm.toLowerCase();

                // Flat map all clients with their bikes
                let actionableItems = [];
                this.allClients.forEach(client => {
                    if (client.bicicletas && client.bicicletas.length > 0) {
                        client.bicicletas.forEach(bike => {
                            actionableItems.push({ client, bike });
                        });
                    }
                });

                // Filter
                let filtered = actionableItems.filter(item => {
                    const cName = item.client.nome.toLowerCase();
                    const cCpf = (item.client.cpf || '').toLowerCase();
                    const bModel = item.bike.modelo.toLowerCase();
                    return cName.includes(searchTerm) || cCpf.includes(searchTerm) || bModel.includes(searchTerm);
                });

                // Limit results
                filtered = filtered.slice(0, 15);

                if (filtered.length === 0) {
                    listContainer.innerHTML = '<div class="p-4 text-center text-sm text-slate-500">Nenhum cliente/bicicleta encontrado.</div>';
                    return;
                }

                listContainer.innerHTML = filtered.map(item => {
                    return `
                        <div class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center transition-colors"
                             onclick="window.app.selectCheckinItem('${item.client.id}', '${item.bike.id}')">
                            <div>
                                <p class="text-sm font-bold text-slate-800 dark:text-white">${item.client.nome}</p>
                                <p class="text-xs text-slate-500"><i data-lucide="bike" class="w-3 h-3 inline"></i> ${item.bike.modelo} - ${item.bike.cor}</p>
                            </div>
                        </div>
                    `;
                }).join('');
                lucide.createIcons();
            }

            selectCheckinItem(clientId, bikeId) {
                const client = this.allClients.find(c => c.id === clientId);
                const bike = client.bicicletas.find(b => b.id === bikeId);

                this.selectedClient = client; // Store selected client

                // Set Hidden values
                document.getElementById('entryClientId').value = clientId;
                document.getElementById('entryBikeId').value = bikeId;
                document.getElementById('entryClientCat').value = client.categoria || '';
                document.getElementById('entryBikeModel').value = bike.modelo || '';
                document.getElementById('entryBikeBrand').value = bike.marca || '';
                document.getElementById('entryBikeColor').value = bike.cor || '';
                document.getElementById('checkin-categoria').value = client.categoria || '';


                // UI Flip
                document.getElementById('searchClientInput').classList.add('hidden');
                document.getElementById('clientsSelectList').classList.add('hidden');

                const displayArea = document.getElementById('selectedClientDisplay');
                document.getElementById('selectedClientName').textContent = client.nome;
                document.getElementById('selectedBikeDesc').textContent = `${bike.modelo} (${bike.marca} - ${bike.cor})`;

                displayArea.classList.remove('hidden');

                // Enable button
                document.getElementById('btnConfirmCheckin').disabled = false;
            }

            clearCheckinSelection() {
                this.selectedClient = null;
                document.getElementById('entryClientId').value = '';
                document.getElementById('entryBikeId').value = '';
                document.getElementById('entryClientCat').value = '';
                document.getElementById('entryBikeModel').value = '';
                document.getElementById('entryBikeBrand').value = '';
                document.getElementById('entryBikeColor').value = '';
                document.getElementById('checkin-categoria').value = '';
                document.getElementById('checkin-ticket-number').value = '';

                document.getElementById('searchClientInput').value = '';
                document.getElementById('searchClientInput').classList.remove('hidden');
                document.getElementById('selectedClientDisplay').classList.add('hidden');
                document.getElementById('btnConfirmCheckin').disabled = true;
            }

            // processCheckin() is now integrated into the form submit listener in setupModals


            // -------------------------
            // EXIT (Finalizar Uso) Logic
            // -------------------------
            setupCheckoutSearch() {
                const searchInput = document.getElementById('searchParkedInput');
                const listContainer = document.getElementById('parkedSelectList');
                const form = document.getElementById('formCheckout');

                searchInput.addEventListener('input', (e) => {
                    this.renderParkedSearch(e.target.value);
                });

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await this.processCheckout();
                });
            }

            renderParkedSearch(query) {
                const listContainer = document.getElementById('parkedSelectList');
                const queryTerm = (query || '').trim();

                // Always show the list container when searching
                listContainer.classList.remove('hidden');

                const searchTerm = queryTerm.toLowerCase();

                let filtered = this.activeRegistros.filter(r => {
                    const client = this.allClients.find(c => c.id === r.clientId) || { nome: '', cpf: '' };
                    const cName = client.nome.toLowerCase();
                    const bModel = r.bikeSnapshot ? r.bikeSnapshot.modelo.toLowerCase() : '';
                    const ticketMatch = r.senha && r.senha.includes(searchTerm.replace('#', ''));
                    return cName.includes(searchTerm) || bModel.includes(searchTerm) || ticketMatch;
                });

                if (filtered.length === 0) {
                    listContainer.innerHTML = '<div class="p-4 text-center text-sm text-slate-500">Nenhuma bicicleta estacionada corresponde.</div>';
                    return;
                }

                // Render as radio buttons natively
                listContainer.innerHTML = filtered.map(r => {
                    const client = this.allClients.find(c => c.id === r.clientId) || { nome: 'Desconhecido', cpf: '' };
                    const timeIn = new Date(r.dataHoraEntrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const bikeDesc = r.bikeSnapshot ? `${r.bikeSnapshot.modelo} (${r.bikeSnapshot.cor})` : 'Bike';
                    const senhaBadge = r.senha ? `<span class="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs px-2 py-0.5 rounded font-mono font-bold tracking-wider">#${r.senha}</span>` : '';

                    return `
                        <label class="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 flex items-center gap-3 transition-colors">
                            <input type="radio" name="checkoutRecord" value="${r.id}" class="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700" onchange="window.app.activateCheckoutBtn()">
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-bold text-slate-800 dark:text-white truncate flex items-center justify-between">
                                    <span class="truncate pr-2">${client.nome}</span>
                                    ${senhaBadge}
                                </p>
                                <div class="flex justify-between items-center mt-0.5">
                                    <p class="text-xs text-slate-500 truncate"><i data-lucide="bike" class="w-3 h-3 inline"></i> ${bikeDesc}</p>
                                    <span class="text-xs font-medium text-amber-500">ðŸ“¥ Ã s ${timeIn}</span>
                                </div>
                            </div>
                        </label>
                    `;
                }).join('');
                lucide.createIcons();
            }

            activateCheckoutBtn() {
                document.getElementById('btnConfirmCheckout').disabled = false;
            }

            async processCheckout() {
                const selectedRadio = document.querySelector('input[name="checkoutRecord"]:checked');
                if (!selectedRadio) return;

                const registroId = selectedRadio.value;
                const recordIndex = this.allRegistros.findIndex(r => r.id === registroId);

                if (recordIndex !== -1) {
                    this.allRegistros[recordIndex].dataHoraSaida = Utils.getLocalISOString();
                    await Storage.saveRegistros(this.allRegistros);

                    notificationManager.onClientActivity();
                }

                // UI Reset
                this.closeModal(document.getElementById('modalCheckout'), document.getElementById('modalCheckoutContent'));
                document.getElementById('btnConfirmCheckout').disabled = true;

                await this.refreshData();
            }


            // -------------------------
            // Session Tools
            // -------------------------
            setupLogout() {
                document.getElementById('btnLogout').addEventListener('click', () => {
                    Auth.logout();
                    window.location.href = '/login.html';
                });
            }
        }

        // Initialize App and bind to window for inline HTML handlers
        window.app = new DashboardApp();
        document.addEventListener('DOMContentLoaded', () => {
            window.app.init();
        });

    
