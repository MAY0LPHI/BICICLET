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
            bikeClientIdInput: document.getElementById('bike-client-id'),
            editBikeModal: document.getElementById('edit-bike-modal'),
            editBikeForm: document.getElementById('edit-bike-form'),
            editBikeClientId: document.getElementById('edit-bike-client-id'),
            editBikeId: document.getElementById('edit-bike-id'),
            editBikeModelo: document.getElementById('edit-bike-modelo'),
            editBikeMarca: document.getElementById('edit-bike-marca'),
            editBikeCor: document.getElementById('edit-bike-cor'),
            cancelEditBike: document.getElementById('cancel-edit-bike'),
        };
        this.webcamStream = null;
        this.setupEventListeners();
        this.setupPhotoUpload('add');
        this.setupPhotoUpload('edit');
    }

    setupEventListeners() {
        const bikeModelo = document.getElementById('bike-modelo');
        const bikeMarca = document.getElementById('bike-marca');
        const bikeCor = document.getElementById('bike-cor');
        
        this.elements.addBikeForm.addEventListener('submit', this.handleAddBike.bind(this));
        this.elements.cancelAddBikeBtn.addEventListener('click', () => this.app.toggleModal('add-bike-modal', false));
        
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

    setupPhotoUpload(mode) {
        const prefix = mode === 'add' ? 'add-bike' : 'edit-bike';
        
        const fileInput = document.getElementById(`${prefix}-photo-file`);
        const dropzone = document.getElementById(`${prefix}-photo-dropzone`);
        const captureBtn = document.getElementById(`${prefix}-capture-photo`);
        const removeBtn = document.getElementById(`${prefix}-remove-photo`);
        const takePhotoBtn = document.getElementById(`${prefix}-take-photo`);
        const cancelWebcamBtn = document.getElementById(`${prefix}-cancel-webcam`);

        // File input
        if (fileInput && dropzone) {
            dropzone.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.handlePhotoFile(file, mode);
                }
            });

            // Drag and drop
            dropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('drag-over');
            });

            dropzone.addEventListener('dragleave', () => {
                dropzone.classList.remove('drag-over');
            });

            dropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.handlePhotoFile(file, mode);
                }
            });
        }

        // Webcam capture
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.startWebcam(mode));
        }

        if (takePhotoBtn) {
            takePhotoBtn.addEventListener('click', () => this.capturePhoto(mode));
        }

        if (cancelWebcamBtn) {
            cancelWebcamBtn.addEventListener('click', () => this.stopWebcam(mode));
        }

        // Remove photo
        if (removeBtn) {
            removeBtn.addEventListener('click', () => this.removePhoto(mode));
        }
    }

    handlePhotoFile(file, mode) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            Modals.alert('Por favor, selecione apenas arquivos de imagem.', 'Tipo de arquivo inválido');
            return;
        }
        
        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            Modals.alert('A imagem deve ter no máximo 5MB.', 'Arquivo muito grande');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            this.resizeAndSetPhoto(e.target.result, mode);
        };
        reader.readAsDataURL(file);
    }
    
    resizeAndSetPhoto(dataUrl, mode) {
        const img = new Image();
        img.onload = () => {
            // Resize image to max 800px width while maintaining aspect ratio
            const maxWidth = 800;
            const maxHeight = 800;
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to JPEG with 80% quality for compression
            const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            this.setPhoto(resizedDataUrl, mode);
        };
        img.src = dataUrl;
    }

    setPhoto(dataUrl, mode) {
        const prefix = mode === 'add' ? 'add-bike' : 'edit-bike';
        const photoData = document.getElementById(`${prefix}-photo-data`);
        const photoPreview = document.getElementById(`${prefix}-photo-preview`);
        const photoImg = document.getElementById(`${prefix}-photo-img`);
        const photoUpload = document.getElementById(`${prefix}-photo-upload`);

        if (photoData) photoData.value = dataUrl;
        if (photoImg) photoImg.src = dataUrl;
        if (photoPreview) photoPreview.classList.remove('hidden');
        if (photoUpload) photoUpload.classList.add('hidden');
        
        // Refresh icons
        lucide.createIcons();
    }

    removePhoto(mode) {
        const prefix = mode === 'add' ? 'add-bike' : 'edit-bike';
        const photoData = document.getElementById(`${prefix}-photo-data`);
        const photoPreview = document.getElementById(`${prefix}-photo-preview`);
        const photoImg = document.getElementById(`${prefix}-photo-img`);
        const photoUpload = document.getElementById(`${prefix}-photo-upload`);
        const fileInput = document.getElementById(`${prefix}-photo-file`);

        if (photoData) photoData.value = '';
        if (photoImg) photoImg.src = '';
        if (photoPreview) photoPreview.classList.add('hidden');
        if (photoUpload) photoUpload.classList.remove('hidden');
        if (fileInput) fileInput.value = '';
    }

    async startWebcam(mode) {
        const prefix = mode === 'add' ? 'add-bike' : 'edit-bike';
        const videoElem = document.getElementById(`${prefix}-webcam-video`);
        const webcamContainer = document.getElementById(`${prefix}-webcam-container`);
        const photoUpload = document.getElementById(`${prefix}-photo-upload`);

        try {
            // Try with environment-facing camera first
            try {
                this.webcamStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    } 
                });
            } catch (envError) {
                // Fallback to any available camera if environment-facing not available
                this.webcamStream = await navigator.mediaDevices.getUserMedia({ 
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
            }
            
            if (videoElem) {
                videoElem.srcObject = this.webcamStream;
            }
            if (webcamContainer) webcamContainer.classList.remove('hidden');
            if (photoUpload) photoUpload.classList.add('hidden');
        } catch (error) {
            console.error('Error accessing webcam:', error);
            let errorMessage = 'Não foi possível acessar a webcam.';
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                errorMessage = 'Permissão para acessar a webcam foi negada. Por favor, verifique as configurações do navegador.';
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
                errorMessage = 'Nenhuma webcam foi encontrada neste dispositivo.';
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
                errorMessage = 'A webcam está sendo usada por outro aplicativo.';
            }
            
            Modals.alert(errorMessage, 'Erro ao acessar webcam');
        }
    }
    
    getPhotoData(mode) {
        const prefix = mode === 'add' ? 'add-bike' : 'edit-bike';
        const photoDataElement = document.getElementById(`${prefix}-photo-data`);
        return photoDataElement ? photoDataElement.value : '';
    }

    capturePhoto(mode) {
        const prefix = mode === 'add' ? 'add-bike' : 'edit-bike';
        const videoElem = document.getElementById(`${prefix}-webcam-video`);
        
        if (videoElem) {
            const canvas = document.createElement('canvas');
            
            // Limit capture resolution to avoid huge file sizes
            const maxWidth = 800;
            const maxHeight = 800;
            let width = videoElem.videoWidth;
            let height = videoElem.videoHeight;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = width * ratio;
                height = height * ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(videoElem, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            this.setPhoto(dataUrl, mode);
            this.stopWebcam(mode);
        }
    }

    stopWebcam(mode) {
        const prefix = mode === 'add' ? 'add-bike' : 'edit-bike';
        const webcamContainer = document.getElementById(`${prefix}-webcam-container`);
        const photoUpload = document.getElementById(`${prefix}-photo-upload`);
        const videoElem = document.getElementById(`${prefix}-webcam-video`);

        if (this.webcamStream) {
            this.webcamStream.getTracks().forEach(track => track.stop());
            this.webcamStream = null;
        }
        if (videoElem) videoElem.srcObject = null;
        if (webcamContainer) webcamContainer.classList.add('hidden');
        if (photoUpload) photoUpload.classList.remove('hidden');
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
        const photoData = this.getPhotoData('add');

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (client) {
            const newBike = { id: Utils.generateUUID(), modelo, marca, cor };
            if (photoData) {
                newBike.foto = photoData;
            }
            client.bicicletas.push(newBike);
            await Storage.saveClient(client);
            
            logAction('create', 'bicicleta', newBike.id, { 
                modelo, 
                marca, 
                cor,
                temFoto: !!photoData,
                cliente: client.nome,
                clienteCpf: client.cpf
            });
            
            this.renderClientDetails();
            this.app.toggleModal('add-bike-modal', false);
            this.removePhoto('add');
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
        this.elements.bikeClientIdInput.value = clientId;
        this.removePhoto('add');
        this.app.toggleModal('add-bike-modal', true);
        
        // Refresh icons after modal is shown
        setTimeout(() => lucide.createIcons(), 100);
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
                    <div class="flex items-start gap-3 flex-1">
                        ${bike.foto ? `
                        <div class="flex-shrink-0">
                            <img src="${bike.foto}" alt="Foto da bicicleta" class="w-20 h-20 object-cover rounded-md border border-slate-200 dark:border-slate-600">
                        </div>
                        ` : ''}
                        <div class="flex-1">
                            <div class="flex items-start gap-2">
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
                        </div>
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

        // Load existing photo if available
        if (bike.foto) {
            this.setPhoto(bike.foto, 'edit');
        } else {
            this.removePhoto('edit');
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
        
        // Refresh icons after modal is shown
        setTimeout(() => lucide.createIcons(), 100);
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
        const photoData = this.getPhotoData('edit');

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return;

        const bike = client.bicicletas.find(b => b.id === bikeId);
        if (!bike) return;

        const oldData = { modelo: bike.modelo, marca: bike.marca, cor: bike.cor, temFoto: !!bike.foto };
        bike.modelo = modelo;
        bike.marca = marca;
        bike.cor = cor;
        
        if (photoData) {
            bike.foto = photoData;
        } else {
            delete bike.foto;
        }

        await Storage.saveClient(client);
        
        logAction('edit', 'bicicleta', bikeId, {
            modelo,
            marca,
            cor,
            temFoto: !!photoData,
            cliente: client.nome,
            clienteCpf: client.cpf,
            changes: { before: oldData, after: { modelo, marca, cor, temFoto: !!photoData } }
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
