import { Utils } from '../shared/utils.js';
import { Storage } from '../shared/storage.js';
import { Auth } from '../shared/auth.js';
import { Modals } from '../shared/modals.js';
import { logAction } from '../shared/audit-logger.js';
import { PhotoHandler } from '../shared/photo-handler.js';

export class BicicletasManager {
    constructor(app) {
        this.app = app;
        this.photoHandler = new PhotoHandler();
        this.elements = {
            clientDetailsSection: document.getElementById('client-details-section'),
            clientDetailsPlaceholder: document.getElementById('client-details-placeholder'),
            addBikeModal: document.getElementById('add-bike-modal'),
            addBikeForm: document.getElementById('add-bike-form'),
            cancelAddBikeBtn: document.getElementById('cancel-add-bike'),
            bikeClientIdInput: document.getElementById('bike-client-id'),
            bikeFotoData: document.getElementById('bike-foto-data'),
            bikePhotoPreview: document.getElementById('bike-photo-preview'),
            bikePhotoPreviewImg: document.getElementById('bike-photo-preview-img'),
            bikePhotoRemove: document.getElementById('bike-photo-remove'),
            bikePhotoUploadBtn: document.getElementById('bike-photo-upload-btn'),
            bikePhotoCameraBtn: document.getElementById('bike-photo-camera-btn'),
            bikePhotoFileInput: document.getElementById('bike-photo-file-input'),
            webcamModal: document.getElementById('webcam-capture-modal'),
            webcamVideo: document.getElementById('webcam-video'),
            webcamCanvas: document.getElementById('webcam-canvas'),
            webcamLoading: document.getElementById('webcam-loading'),
            webcamCloseBtn: document.getElementById('webcam-close-btn'),
            webcamCancelBtn: document.getElementById('webcam-cancel-btn'),
            webcamCaptureBtn: document.getElementById('webcam-capture-btn'),
            webcamRetakeBtn: document.getElementById('webcam-retake-btn'),
            webcamUseBtn: document.getElementById('webcam-use-btn'),
            editBikeModal: document.getElementById('edit-bike-modal'),
            editBikeForm: document.getElementById('edit-bike-form'),
            editBikeClientId: document.getElementById('edit-bike-client-id'),
            editBikeId: document.getElementById('edit-bike-id'),
            editBikeModelo: document.getElementById('edit-bike-modelo'),
            editBikeMarca: document.getElementById('edit-bike-marca'),
            editBikeCor: document.getElementById('edit-bike-cor'),
            cancelEditBike: document.getElementById('cancel-edit-bike'),
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        const bikeModelo = document.getElementById('bike-modelo');
        const bikeMarca = document.getElementById('bike-marca');
        const bikeCor = document.getElementById('bike-cor');
        
        this.elements.addBikeForm.addEventListener('submit', this.handleAddBike.bind(this));
        this.elements.cancelAddBikeBtn.addEventListener('click', () => this.closeAddBikeModal());
        
        // Photo upload and capture listeners
        this.elements.bikePhotoUploadBtn.addEventListener('click', () => {
            this.elements.bikePhotoFileInput.click();
        });
        
        this.elements.bikePhotoFileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.handlePhotoUpload(file);
            }
        });
        
        this.elements.bikePhotoCameraBtn.addEventListener('click', () => {
            this.openWebcamModal();
        });
        
        this.elements.bikePhotoRemove.addEventListener('click', () => {
            this.clearPhoto();
        });
        
        // Webcam modal listeners
        this.elements.webcamCloseBtn.addEventListener('click', () => {
            this.closeWebcamModal();
        });
        
        this.elements.webcamCancelBtn.addEventListener('click', () => {
            this.closeWebcamModal();
        });
        
        this.elements.webcamCaptureBtn.addEventListener('click', async () => {
            await this.capturePhoto();
        });
        
        this.elements.webcamRetakeBtn.addEventListener('click', () => {
            this.retakePhoto();
        });
        
        this.elements.webcamUseBtn.addEventListener('click', () => {
            this.useWebcamPhoto();
        });
        
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
        this.elements.cancelEditBike.addEventListener('click', () => this.app.toggleModal('edit-bike-modal', false));
        
        this.elements.editBikeModelo.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        this.elements.editBikeMarca.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        this.elements.editBikeCor.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    async handlePhotoUpload(file) {
        try {
            const photoData = await this.photoHandler.handleFileUpload(file);
            this.setPhotoPreview(photoData);
        } catch (error) {
            await Modals.alert(error.message, 'Erro ao Carregar Foto');
        }
    }

    setPhotoPreview(photoData) {
        this.elements.bikeFotoData.value = photoData;
        this.elements.bikePhotoPreviewImg.src = photoData;
        this.elements.bikePhotoPreview.classList.remove('hidden');
        lucide.createIcons();
    }

    clearPhoto() {
        this.elements.bikeFotoData.value = '';
        this.elements.bikePhotoPreviewImg.src = '';
        this.elements.bikePhotoPreview.classList.add('hidden');
        this.elements.bikePhotoFileInput.value = '';
    }

    async openWebcamModal() {
        this.app.toggleModal('webcam-capture-modal', true);
        this.elements.webcamLoading.classList.remove('hidden');
        this.elements.webcamVideo.classList.add('hidden');
        this.elements.webcamCanvas.classList.add('hidden');
        
        try {
            const stream = await this.photoHandler.startWebcam();
            this.elements.webcamVideo.srcObject = stream;
            this.elements.webcamVideo.classList.remove('hidden');
            this.elements.webcamLoading.classList.add('hidden');
            lucide.createIcons();
        } catch (error) {
            this.closeWebcamModal();
            await Modals.alert(error.message, 'Erro ao Acessar Câmera');
        }
    }

    closeWebcamModal() {
        this.photoHandler.stopWebcam();
        this.elements.webcamVideo.srcObject = null;
        this.elements.webcamVideo.classList.add('hidden');
        this.elements.webcamCanvas.classList.add('hidden');
        this.elements.webcamLoading.classList.remove('hidden');
        this.elements.webcamCaptureBtn.classList.remove('hidden');
        this.elements.webcamRetakeBtn.classList.add('hidden');
        this.elements.webcamUseBtn.classList.add('hidden');
        // Clean up temporary photo data to prevent memory leaks
        this.tempCapturedPhoto = null;
        this.app.toggleModal('webcam-capture-modal', false);
    }

    async capturePhoto() {
        try {
            const photoData = await this.photoHandler.captureFromVideo(this.elements.webcamVideo);
            
            // Display captured photo on canvas with aspect ratio preservation
            const ctx = this.elements.webcamCanvas.getContext('2d');
            const img = new Image();
            img.onload = () => {
                // Calculate canvas size to maintain aspect ratio
                const containerWidth = this.elements.webcamCanvas.parentElement.clientWidth;
                const containerHeight = this.elements.webcamCanvas.parentElement.clientHeight;
                const imgAspect = img.width / img.height;
                const containerAspect = containerWidth / containerHeight;
                
                let canvasWidth, canvasHeight;
                if (imgAspect > containerAspect) {
                    canvasWidth = containerWidth;
                    canvasHeight = containerWidth / imgAspect;
                } else {
                    canvasHeight = containerHeight;
                    canvasWidth = containerHeight * imgAspect;
                }
                
                this.elements.webcamCanvas.width = canvasWidth;
                this.elements.webcamCanvas.height = canvasHeight;
                ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
                
                // Show canvas, hide video
                this.elements.webcamVideo.classList.add('hidden');
                this.elements.webcamCanvas.classList.remove('hidden');
                
                // Update button visibility
                this.elements.webcamCaptureBtn.classList.add('hidden');
                this.elements.webcamRetakeBtn.classList.remove('hidden');
                this.elements.webcamUseBtn.classList.remove('hidden');
                
                lucide.createIcons();
            };
            img.src = photoData;
            
            // Store captured photo temporarily
            this.tempCapturedPhoto = photoData;
        } catch (error) {
            await Modals.alert(error.message, 'Erro ao Capturar Foto');
        }
    }

    retakePhoto() {
        // Clean up temporary photo data
        this.tempCapturedPhoto = null;
        this.elements.webcamCanvas.classList.add('hidden');
        this.elements.webcamVideo.classList.remove('hidden');
        this.elements.webcamCaptureBtn.classList.remove('hidden');
        this.elements.webcamRetakeBtn.classList.add('hidden');
        this.elements.webcamUseBtn.classList.add('hidden');
    }

    useWebcamPhoto() {
        if (this.tempCapturedPhoto) {
            this.setPhotoPreview(this.tempCapturedPhoto);
            this.tempCapturedPhoto = null;
        }
        this.closeWebcamModal();
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
        const foto = this.elements.bikeFotoData.value || null;

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (client) {
            const newBike = { id: Utils.generateUUID(), modelo, marca, cor, foto };
            client.bicicletas.push(newBike);
            await Storage.saveClient(client);
            
            logAction('create', 'bicicleta', newBike.id, { 
                modelo, 
                marca, 
                cor,
                temFoto: !!foto,
                cliente: client.nome,
                clienteCpf: client.cpf
            });
            
            this.renderClientDetails();
            this.closeAddBikeModal();
        }
    }

    closeAddBikeModal() {
        this.clearPhoto();
        this.app.toggleModal('add-bike-modal', false);
    }

    openAddBikeModal(clientId) {
        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        this.elements.addBikeForm.reset();
        this.clearPhoto();
        this.elements.bikeClientIdInput.value = clientId;
        this.app.toggleModal('add-bike-modal', true);
        lucide.createIcons();
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
               <div class="flex justify-between items-start gap-3">
                    ${bike.foto ? `
                    <div class="flex-shrink-0">
                        <img src="${bike.foto}" alt="${bike.modelo}" class="w-24 h-24 object-cover rounded-md border border-slate-300 dark:border-slate-600">
                    </div>
                    ` : ''}
                    <div class="flex items-start gap-2 flex-1">
                        <div class="flex-1">
                            <p class="font-semibold text-slate-800 dark:text-slate-100">${bike.modelo} <span class="font-normal text-slate-600 dark:text-slate-300">(${bike.marca})</span></p>
                            <p class="text-sm text-slate-500 dark:text-slate-400">Cor: ${bike.cor}</p>
                            ${bike.foto ? `<p class="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1"><i data-lucide="camera" class="h-3 w-3"></i> Com foto</p>` : ''}
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
                                <p class="text-xs text-amber-600 dark:text-amber-400">${commentDate.toLocaleDateString('pt-BR')} ${commentDate.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
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
            
            <div class="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
        this.elements.editBikeCor.value = bike.cor;

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

        const oldData = { modelo: bike.modelo, marca: bike.marca, cor: bike.cor };
        bike.modelo = modelo;
        bike.marca = marca;
        bike.cor = cor;

        await Storage.saveClient(client);
        
        logAction('edit', 'bicicleta', bikeId, {
            modelo,
            marca,
            cor,
            cliente: client.nome,
            clienteCpf: client.cpf,
            changes: { before: oldData, after: { modelo, marca, cor } }
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
