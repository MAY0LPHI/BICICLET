import { Utils } from '../shared/utils.js';
import { Storage } from '../shared/storage.js';
import { Auth } from '../shared/auth.js';
import { Modals } from '../shared/modals.js';
import { logAction } from '../shared/audit-logger.js';

export class BicicletasManager {
    constructor(app) {
        this.app = app;
        this.elements = {
            clientDetailsSection: document.getElementById('client-details-section'),
            clientDetailsPlaceholder: document.getElementById('client-details-placeholder'),
            addBikeModal: document.getElementById('add-bike-modal'),
            addBikeForm: document.getElementById('add-bike-form'),
            cancelAddBikeBtn: document.getElementById('cancel-add-bike'),
            cancelAddBikeBtn: document.getElementById('cancel-add-bike'),
            bikeClientIdInput: document.getElementById('bike-client-id'),

            // Edit Bike Elements (Restored)
            editBikeModal: document.getElementById('edit-bike-modal'),
            editBikeForm: document.getElementById('edit-bike-form'),
            editBikeClientId: document.getElementById('edit-bike-client-id'),
            editBikeId: document.getElementById('edit-bike-id'),
            editBikeModelo: document.getElementById('edit-bike-modelo'),
            editBikeMarca: document.getElementById('edit-bike-marca'),
            editBikeCor: document.getElementById('edit-bike-cor'),
            cancelEditBike: document.getElementById('cancel-edit-bike'),

            // Photo elements
            bikePhotoInput: document.getElementById('bike-photo-input'),
            btnStartCamera: document.getElementById('btn-start-camera'),
            cameraContainer: document.getElementById('camera-container'),
            cameraStream: document.getElementById('camera-stream'),
            cameraCanvas: document.getElementById('camera-canvas'),
            btnTakePhoto: document.getElementById('btn-take-photo'),
            btnStopCamera: document.getElementById('btn-stop-camera'),
            photoPreviewContainer: document.getElementById('photo-preview-container'),
            bikePhotoPreview: document.getElementById('bike-photo-preview'),
            btnRemovePhoto: document.getElementById('btn-remove-photo'),
            // Edit Photo elements
            editBikePhotoInput: document.getElementById('edit-bike-photo-input'),
            editBtnStartCamera: document.getElementById('edit-btn-start-camera'),
            editCameraContainer: document.getElementById('edit-camera-container'),
            editCameraStream: document.getElementById('edit-camera-stream'),
            editCameraCanvas: document.getElementById('edit-camera-canvas'),
            editBtnTakePhoto: document.getElementById('edit-btn-take-photo'),
            editBtnStopCamera: document.getElementById('edit-btn-stop-camera'),
            editPhotoPreviewContainer: document.getElementById('edit-photo-preview-container'),
            editBikePhotoPreview: document.getElementById('edit-bike-photo-preview'),
            editBtnRemovePhoto: document.getElementById('edit-btn-remove-photo'),
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        const bikeModelo = document.getElementById('bike-modelo');
        const bikeMarca = document.getElementById('bike-marca');
        const bikeCor = document.getElementById('bike-cor');

        this.elements.addBikeForm.addEventListener('submit', this.handleAddBike.bind(this));
        this.elements.cancelAddBikeBtn.addEventListener('click', () => {
            this.handleStopCamera();
            this.app.toggleModal('add-bike-modal', false);
        });

        // Photo handlers
        this.elements.bikePhotoInput?.addEventListener('change', (e) => this.handlePhotoSelect(e));
        this.elements.btnStartCamera?.addEventListener('click', () => this.handleStartCamera());
        this.elements.btnTakePhoto?.addEventListener('click', () => this.handleTakePhoto());
        this.elements.btnStopCamera?.addEventListener('click', () => this.handleStopCamera());
        this.elements.btnRemovePhoto?.addEventListener('click', () => this.handleRemovePhoto());

        if (bikeModelo) {
            bikeModelo.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        if (bikeMarca) {
            bikeMarca.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        if (bikeCor) {
            bikeCor.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }

        this.elements.editBikeForm.addEventListener('submit', this.handleEditBike.bind(this));
        this.elements.cancelEditBike.addEventListener('click', () => {
            this.handleEditStopCamera();
            this.app.toggleModal('edit-bike-modal', false);
        });

        // Edit Photo handlers
        this.elements.editBikePhotoInput?.addEventListener('change', (e) => this.handleEditPhotoSelect(e));
        this.elements.editBtnStartCamera?.addEventListener('click', () => this.handleEditStartCamera());
        this.elements.editBtnTakePhoto?.addEventListener('click', () => this.handleEditTakePhoto());
        this.elements.editBtnStopCamera?.addEventListener('click', () => this.handleEditStopCamera());
        this.elements.editBtnRemovePhoto?.addEventListener('click', () => this.handleEditRemovePhoto());

        this.elements.editBikeModelo.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        this.elements.editBikeMarca.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        this.elements.editBikeCor.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        // Photo Zoom Handlers
        this.elements.bikePhotoPreview?.addEventListener('click', () => {
            if (this.elements.bikePhotoPreview.src && this.elements.bikePhotoPreview.src !== window.location.href) {
                Modals.showImage(this.elements.bikePhotoPreview.src, 'Nova Bicicleta');
            }
        });

        this.elements.editBikePhotoPreview?.addEventListener('click', () => {
            if (this.elements.editBikePhotoPreview.src && this.elements.editBikePhotoPreview.src !== window.location.href) {
                const title = `${this.elements.editBikeModelo.value} (${this.elements.editBikeMarca.value})`;
                Modals.showImage(this.elements.editBikePhotoPreview.src, title);
            }
        });

        // Add cursor pointer
        if (this.elements.bikePhotoPreview) this.elements.bikePhotoPreview.classList.add('cursor-pointer');
        if (this.elements.editBikePhotoPreview) this.elements.editBikePhotoPreview.classList.add('cursor-pointer');
    }

    async handleAddBike(e) {
        e.preventDefault();

        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const clientId = this.elements.bikeClientIdInput.value;
        const modelo = document.getElementById('bike-modelo').value;
        const marca = document.getElementById('bike-marca').value;
        const cor = document.getElementById('bike-cor').value;

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (client) {
            let fotoUrl = null;
            if (this.currentPhotoBase64) {
                fotoUrl = await Storage.saveImage(this.currentPhotoBase64);
            }

            const newBike = {
                id: Utils.generateUUID(),
                modelo,
                marca,
                cor,
                foto: fotoUrl
            };
            client.bicicletas.push(newBike);
            await Storage.saveClient(client);

            logAction('create', 'bicicleta', newBike.id, {
                modelo,
                marca,
                cor,
                cliente: client.nome,
                clienteCpf: client.cpf
            });

            this.renderClientDetails();
            this.app.toggleModal('add-bike-modal', false);
        }
    }

    openAddBikeModal(clientId) {
        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        this.elements.addBikeForm.reset();
        this.handleRemovePhoto(); // Reset photo state
        this.elements.bikeClientIdInput.value = clientId;
        this.app.toggleModal('add-bike-modal', true);
    }

    renderClientDetails() {
        if (!this.app.data.selectedClientId) {
            this.elements.clientDetailsSection.classList.add('hidden');
            this.elements.clientDetailsPlaceholder.classList.remove('hidden');
            return;
        }

        const client = this.app.data.clients.find(c => c.id === this.app.data.selectedClientId);
        if (!client) return;

        this.elements.clientDetailsPlaceholder.classList.add('hidden');
        this.elements.clientDetailsSection.classList.remove('hidden');

        const canAddRegistros = Auth.hasPermission('registros', 'adicionar');
        const canEditClients = Auth.hasPermission('clientes', 'editar');

        const bikesHTML = client.bicicletas.length > 0 ? client.bicicletas.map(bike => `
            <div class="bg-slate-50 p-4 rounded-lg border border-slate-200 dark:bg-slate-700/40 dark:border-slate-700">
               <div class="flex justify-between items-start">
                    <div class="flex items-start gap-3 flex-1">
                        ${bike.foto ? `
                        <div class="relative w-16 h-16 flex-shrink-0 cursor-pointer group" onclick="Modals.showImage('${bike.foto}', '${bike.modelo} (${bike.marca})')">
                            <img src="${bike.foto}" class="w-full h-full object-cover rounded-md border border-slate-200 dark:border-slate-600">
                            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-md"></div>
                        </div>
                        ` : `
                        <div class="w-16 h-16 flex-shrink-0 bg-slate-200 dark:bg-slate-600 rounded-md flex items-center justify-center text-slate-400 dark:text-slate-300">
                            <i data-lucide="bike" class="w-8 h-8"></i>
                        </div>
                        `}
                        <div>
                            <p class="font-semibold text-slate-800 dark:text-slate-100">${bike.modelo} <span class="font-normal text-slate-600 dark:text-slate-300">(${bike.marca})</span></p>
                            <p class="text-sm text-slate-500 dark:text-slate-400">Cor: ${bike.cor}</p>
                        </div>
                        ${canEditClients ? `
                        <button class="edit-bike-btn text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" data-bike-id="${bike.id}" title="Editar bicicleta">
                            <i data-lucide="pencil" class="h-4 w-4"></i>
                        </button>
                        <button class="delete-bike-btn text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" data-bike-id="${bike.id}" title="Excluir bicicleta">
                            <i data-lucide="trash-2" class="h-4 w-4"></i>
                        </button>
                        ` : ''}
                    </div>
                    ${canAddRegistros ? `
                    <button class="add-registro-btn flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md shadow-sm transition-colors dark:bg-blue-500 dark:hover:bg-blue-600" data-bike-id="${bike.id}">
                        <i data-lucide="log-in" class="h-4 w-4 mr-1"></i>
                        Registrar Entrada
                    </button>
                    ` : ''}
               </div>
               <div class="mt-4">
                    <h4 class="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">Histórico de Movimentação</h4>
                    ${this.app.registrosManager.renderRegistrosTable(bike.id)}
               </div>
            </div>
        `).join('') : '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhuma bicicleta cadastrada.</p>';

        let comentarios = client.comentarios || [];
        if (typeof comentarios === 'string') {
            try {
                comentarios = JSON.parse(comentarios);
            } catch (e) {
                comentarios = [];
            }
        }
        if (!Array.isArray(comentarios)) {
            comentarios = [];
        }
        const currentSession = Auth.getCurrentSession();
        const currentUsername = currentSession?.username || '';
        const categoryBadge = client.categoria ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 ml-3">${client.categoria}</span>` : '';

        const commentsHTML = comentarios.length > 0 ? comentarios.map(comment => {
            const commentDate = new Date(comment.data);
            const isOwner = currentUsername && comment.usuario === currentUsername;
            const canDeleteComment = isOwner || canEditClients;
            return `
                <div class="flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <div class="flex-shrink-0">
                        <div class="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                            <i data-lucide="user" class="w-4 h-4 text-amber-600 dark:text-amber-400"></i>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between mb-1">
                            <p class="text-xs font-medium text-amber-900 dark:text-amber-200">${comment.usuario}</p>
                            <div class="flex items-center gap-2">
                                <p class="text-xs text-amber-600 dark:text-amber-400">${commentDate.toLocaleDateString('pt-BR')} ${commentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                ${canDeleteComment ? `
                                <button class="delete-comment-btn text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" data-comment-id="${comment.id}" title="Excluir comentário">
                                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                                </button>
                                ` : ''}
                            </div>
                        </div>
                        <p class="text-sm text-amber-900 dark:text-amber-100 break-words">${comment.texto}</p>
                    </div>
                </div>
            `;
        }).join('') : '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-3">Nenhum comentário adicionado</p>';

        this.elements.clientDetailsSection.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-start gap-2">
                    <div>
                        <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">${client.nome.replace(/^"|"$/g, '')}${categoryBadge}</h3>
                        <p class="text-slate-500 dark:text-slate-400">${Utils.formatCPF(client.cpf)}${client.telefone ? ' &bull; ' + Utils.formatTelefone(client.telefone) : ''}</p>
                    </div>
                    <div class="flex items-center gap-1">
                        ${Auth.hasPermission('clientes', 'editar') ? `
                        <button id="edit-client-btn" class="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" title="Editar dados do cliente">
                            <i data-lucide="pencil" class="h-5 w-5"></i>
                        </button>
                        ` : ''}
                        <button id="open-comments-btn" class="relative text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" title="Comentários do cliente">
                            <i data-lucide="message-circle" class="h-5 w-5"></i>
                            ${comentarios.length > 0 ? `
                            <span class="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-amber-500 rounded-full">${comentarios.length}</span>
                            ` : ''}
                        </button>
                    </div>
                </div>
                ${Auth.hasPermission('clientes', 'editar') ? `
                <button id="add-bike-to-client-btn" class="flex items-center text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md shadow-sm transition-colors dark:bg-blue-500 dark:hover:bg-blue-600">
                    <i data-lucide="plus" class="h-4 w-4 mr-1"></i>
                    Adicionar Bicicleta
                </button>
                ` : ''}
            </div>
            
            <div class="space-y-4 max-h-[85vh] overflow-y-auto pr-2 pb-32">
                ${bikesHTML}
            </div>
        `;

        lucide.createIcons();

        const addBikeBtn = document.getElementById('add-bike-to-client-btn');
        if (addBikeBtn) {
            addBikeBtn.addEventListener('click', () => this.openAddBikeModal(client.id));
        }

        const editClientBtn = document.getElementById('edit-client-btn');
        if (editClientBtn) {
            editClientBtn.addEventListener('click', () => this.app.clientesManager.openEditClientModal(client.id));
        }

        const openCommentsBtn = document.getElementById('open-comments-btn');
        if (openCommentsBtn) {
            openCommentsBtn.addEventListener('click', () => {
                this.app.openCommentsModal(client.id, () => this.renderClientDetails());
            });
        }

        this.elements.clientDetailsSection.querySelectorAll('.add-registro-btn').forEach(btn => {
            btn.addEventListener('click', () => this.app.registrosManager.openAddRegistroModal(client.id, btn.dataset.bikeId));
        });
        this.elements.clientDetailsSection.querySelectorAll('.edit-bike-btn').forEach(btn => {
            btn.addEventListener('click', () => this.openEditBikeModal(client.id, btn.dataset.bikeId));
        });
        this.elements.clientDetailsSection.querySelectorAll('.delete-bike-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleDeleteBike(client.id, btn.dataset.bikeId));
        });
    }

    openEditBikeModal(clientId, bikeId) {
        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return;

        const bike = client.bicicletas.find(b => b.id === bikeId);
        if (!bike) return;

        this.elements.editBikeClientId.value = clientId;
        this.elements.editBikeId.value = bikeId;
        this.elements.editBikeModelo.value = bike.modelo;
        this.elements.editBikeMarca.value = bike.marca;
        this.elements.editBikeModelo.value = bike.modelo;
        this.elements.editBikeMarca.value = bike.marca;
        this.elements.editBikeCor.value = bike.cor;

        // Setup Photo
        this.editCurrentPhotoBase64 = bike.foto || null;
        if (this.editCurrentPhotoBase64) {
            this.showEditPreview(this.editCurrentPhotoBase64);
        } else {
            this.handleEditRemovePhoto();
        }

        // Setup delete button in modal
        const deleteBtn = document.getElementById('delete-bike-from-modal');
        if (deleteBtn) {
            // Remove old event listener by cloning the button
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

            newDeleteBtn.addEventListener('click', async () => {
                this.app.toggleModal('edit-bike-modal', false);
                await this.handleDeleteBike(clientId, bikeId);
            });
        }

        this.app.toggleModal('edit-bike-modal', true);
    }

    async handleEditBike(e) {
        e.preventDefault();

        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const clientId = this.elements.editBikeClientId.value;
        const bikeId = this.elements.editBikeId.value;
        const modelo = this.elements.editBikeModelo.value;
        const marca = this.elements.editBikeMarca.value;
        const cor = this.elements.editBikeCor.value;

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return;

        const bike = client.bicicletas.find(b => b.id === bikeId);
        if (!bike) return;

        const oldData = { modelo: bike.modelo, marca: bike.marca, cor: bike.cor, foto: bike.foto };
        bike.modelo = modelo;
        bike.marca = marca;
        bike.cor = cor;

        if (this.editCurrentPhotoBase64) {
            // Check if it's a new base64 image (starts with data:) or existing url
            if (this.editCurrentPhotoBase64.startsWith('data:')) {
                bike.foto = await Storage.saveImage(this.editCurrentPhotoBase64);
            } else {
                bike.foto = this.editCurrentPhotoBase64;
            }
        } else {
            bike.foto = null;
        }

        await Storage.saveClient(client);

        logAction('edit', 'bicicleta', bikeId, {
            modelo,
            marca,
            cor,
            cliente: client.nome,
            clienteCpf: client.cpf,
            changes: { before: oldData, after: { modelo, marca, cor, foto: bike.foto } }
        });

        this.renderClientDetails();
        this.app.toggleModal('edit-bike-modal', false);
    }

    async handleDeleteBike(clientId, bikeId) {
        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return;

        const bikeIndex = client.bicicletas.findIndex(b => b.id === bikeId);
        if (bikeIndex === -1) return;

        const bike = client.bicicletas[bikeIndex];

        const confirmed = await Modals.showConfirm(
            'Você tem certeza que deseja excluir esta bicicleta? Esta ação não pode ser desfeita.',
            'Confirmar Exclusão'
        );

        if (!confirmed) return;

        try {
            client.bicicletas.splice(bikeIndex, 1);
            await Storage.saveClient(client);

            logAction('delete', 'bicicleta', bikeId, {
                modelo: bike.modelo,
                marca: bike.marca,
                cor: bike.cor,
                cliente: client.nome,
                clienteCpf: client.cpf
            });

            this.renderClientDetails();
            await Modals.alert('Bicicleta excluída com sucesso!', 'Sucesso');
        } catch (error) {
            console.error('Erro ao excluir bicicleta:', error);
            await Modals.alert(
                'Houve uma falha ao excluir a bicicleta. Por favor, tente novamente.',
                'Erro'
            );
        }
    }

    handlePhotoSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.compressImage(file);
        }
    }

    async handleStartCamera() {
        try {
            this.currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            this.elements.cameraStream.srcObject = this.currentStream;
            this.elements.cameraContainer.classList.remove('hidden');
            this.elements.photoPreviewContainer.classList.add('hidden');
        } catch (err) {
            console.error("Erro ao acessar câmera:", err);
            Modals.alert("Não foi possível acessar a câmera. Verifique as permissões.", "Erro");
        }
    }

    handleTakePhoto() {
        if (!this.currentStream) return;

        const video = this.elements.cameraStream;
        const canvas = this.elements.cameraCanvas;

        // Define canvas size to match video resolution (or limit it)
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Compress directly from canvas
        const quality = 0.7;
        const maxWidth = 800;

        let finalWidth = canvas.width;
        let finalHeight = canvas.height;

        if (finalWidth > maxWidth) {
            const scale = maxWidth / finalWidth;
            finalWidth = maxWidth;
            finalHeight = finalHeight * scale;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = finalWidth;
            tempCanvas.height = finalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
            this.currentPhotoBase64 = tempCanvas.toDataURL('image/jpeg', quality);
        } else {
            this.currentPhotoBase64 = canvas.toDataURL('image/jpeg', quality);
        }

        this.showPreview(this.currentPhotoBase64);
        this.handleStopCamera();
    }

    handleStopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        this.elements.cameraContainer.classList.add('hidden');
    }

    handleRemovePhoto() {
        this.currentPhotoBase64 = null;
        if (this.elements.bikePhotoInput) this.elements.bikePhotoInput.value = '';
        this.elements.photoPreviewContainer.classList.add('hidden');
        this.elements.bikePhotoPreview.src = '';
    }

    // Edit Modal Photo Handlers
    handleEditPhotoSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.compressImage(file, true); // true for edit mode
        }
    }

    async handleEditStartCamera() {
        try {
            this.currentStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            this.elements.editCameraStream.srcObject = this.currentStream;
            this.elements.editCameraContainer.classList.remove('hidden');
            this.elements.editPhotoPreviewContainer.classList.add('hidden');
        } catch (err) {
            console.error("Erro ao acessar câmera:", err);
            Modals.alert("Não foi possível acessar a câmera. Verifique as permissões.", "Erro");
        }
    }

    handleEditTakePhoto() {
        if (!this.currentStream) return;

        const video = this.elements.editCameraStream;
        const canvas = this.elements.editCameraCanvas;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const quality = 0.7;
        const maxWidth = 800;

        let finalWidth = canvas.width;
        let finalHeight = canvas.height;

        // Resize logic (could be extracted but duplicating for safety)
        if (finalWidth > maxWidth) {
            const scale = maxWidth / finalWidth;
            finalWidth = maxWidth;
            finalHeight = finalHeight * scale;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = finalWidth;
            tempCanvas.height = finalHeight;
            const tempCtx = tempCanvas.getContext('2d');
            tempCtx.drawImage(canvas, 0, 0, finalWidth, finalHeight);
            this.editCurrentPhotoBase64 = tempCanvas.toDataURL('image/jpeg', quality);
        } else {
            this.editCurrentPhotoBase64 = canvas.toDataURL('image/jpeg', quality);
        }

        this.showEditPreview(this.editCurrentPhotoBase64);
        this.handleEditStopCamera();
    }

    handleEditStopCamera() {
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }
        this.elements.editCameraContainer.classList.add('hidden');
    }

    handleEditRemovePhoto() {
        this.editCurrentPhotoBase64 = null;
        if (this.elements.editBikePhotoInput) this.elements.editBikePhotoInput.value = '';
        this.elements.editPhotoPreviewContainer.classList.add('hidden');
        this.elements.editBikePhotoPreview.src = '';
    }

    showEditPreview(base64) {
        this.elements.editBikePhotoPreview.src = base64;
        this.elements.editPhotoPreviewContainer.classList.remove('hidden');
    }

    // Updated helper to support edit mode target
    compressImage(file, isEdit = false) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const maxWidth = 800;
                const maxHeight = 600;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const base64 = canvas.toDataURL('image/jpeg', 0.7);
                if (isEdit) {
                    this.editCurrentPhotoBase64 = base64;
                    this.showEditPreview(base64);
                } else {
                    this.currentPhotoBase64 = base64;
                    this.showPreview(base64);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showPreview(base64) {
        this.elements.bikePhotoPreview.src = base64;
        this.elements.photoPreviewContainer.classList.remove('hidden');
    }

    applyPermissionsToUI() {
        const canEdit = Auth.hasPermission('clientes', 'editar');

        if (!canEdit) {
            document.querySelectorAll('.add-bike-btn').forEach(btn => {
                btn.style.display = 'none';
            });
            document.querySelectorAll('.edit-bike-btn').forEach(btn => {
                btn.style.display = 'none';
            });
        }
    }
}
