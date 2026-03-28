/**
 * ============================================================
 *  ARQUIVO: modals.js
 *  DESCRIÇÃO: Sistema de Modais Customizados (Alertas e Confirmações)
 *
 *  FUNÇÃO:
 *  Substitui os dialogs nativos do navegador (alert, confirm, prompt)
 *  por janelas modais estilizadas que seguem o tema do sistema.
 *  Todos os métodos retornam Promises, permitindo uso com async/await.
 *
 *  MÉTODOS PRINCIPAIS:
 *  ┌───────────────────────────────────────────────────────────────┐
 *  │ Modals.showConfirm(msg, titulo)   → Promise<boolean>          │
 *  │   Abre janela de confirmação com Sim/Não.                     │
 *  │   Resolve true se confirmado, false se cancelado.             │
 *  │                                                               │
 *  │ Modals.showAlert(msg, titulo)     → Promise<void>             │
 *  │   Exibe alerta com botão OK. Resolve quando fechado.          │
 *  │                                                               │
 *  │ Modals.showInputPrompt(msg)       → Promise<string|null>      │
 *  │   Exibe campo de texto. Resolve com o valor digitado.         │
 *  │                                                               │
 *  │ Modals.showImage(url, titulo)     → void                      │
 *  │   Abre visualizador de imagem com zoom e arrasto.             │
 *  │                                                               │
 *  │ Modals.show(titulo, html)         → void                      │
 *  │   Abre modal genérico com HTML customizado no corpo.           │
 *  └───────────────────────────────────────────────────────────────┘
 *
 *  REQUISITOS HTML (devem existir no index.html):
 *  - #custom-confirm-modal: modal de confirmação (Sim/Não)
 *  - #custom-alert-modal:   modal de alerta (OK)
 *  - #confirm-title, #confirm-message, #confirm-ok-btn, #confirm-cancel-btn
 *  - #alert-title, #alert-message, #alert-ok-btn
 *
 *  PARA INICIANTES:
 *  // Usar confirmação:
 *  const ok = await Modals.showConfirm('Deseja excluir?', 'Confirmar');
 *  if (ok) { ... }
 *
 *  // Usar alerta:
 *  await Modals.showAlert('Operação concluída!');
 *
 *  ATALHOS DE TECLADO:
 *  - Enter: confirma (equivale a clicar em OK/Sim)
 *  - Escape: cancela/fecha o modal
 *
 *  NOTA: window.Modals é exportado globalmente para uso em
 *  arquivos não-módulo (ex: onclick="Modals.close()").
 * ============================================================
 */
export const Modals = {
    currentModal: null,

    show(title, content) {
        this.showWithIcon(title, content, null);
    },

    showWithIcon(title, content, iconName = null) {
        this.close();

        const iconHtml = iconName
            ? `<i data-lucide="${iconName}" class="w-6 h-6 text-blue-600 dark:text-blue-400 mr-2"></i>`
            : '';

        const modalHtml = `
            <div id="dynamic-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 opacity-0 transition-opacity duration-300">
                <div class="modal-content bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-300">
                    <div class="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
                        <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">${iconHtml}${title}</h2>
                        <button onclick="Modals.close()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>
                    <div class="p-6">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        this.currentModal = document.getElementById('dynamic-modal');

        lucide.createIcons();

        setTimeout(() => {
            this.currentModal.classList.remove('opacity-0');
            this.currentModal.querySelector('.modal-content').classList.remove('scale-95');
            this.currentModal.querySelector('.modal-content').classList.add('scale-100');
        }, 10);
    },

    close() {
        if (this.cleanup) {
            this.cleanup();
            this.cleanup = null;
        }

        const modal = this.currentModal;
        if (modal) {
            modal.classList.add('opacity-0');

            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.classList.remove('scale-100');
                modalContent.classList.add('scale-95');
            }

            setTimeout(() => {
                modal.remove();
                if (this.currentModal === modal) {
                    this.currentModal = null;
                }
            }, 300);
        }
    },

    async alert(message, title = 'Aviso', iconName = null) {
        return this.showAlert(message, title, iconName);
    },

    showConfirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const MODAL_ANIMATION_DURATION = 300;
            const MODAL_CLOSE_BUFFER = 50; // Margem extra de segurança

            // Aguardar se o modal ainda estiver visível (fechando)
            const waitForClose = () => {
                return new Promise((res) => {
                    if (modal.classList.contains('hidden')) {
                        res();
                    } else {
                        // Aguardar a animação de fechamento terminar
                        setTimeout(() => res(), MODAL_ANIMATION_DURATION + MODAL_CLOSE_BUFFER);
                    }
                });
            };

            waitForClose().then(() => {
                const titleEl = document.getElementById('confirm-title');
                const messageEl = document.getElementById('confirm-message');
                const oldOkBtn = document.getElementById('confirm-ok-btn');
                const oldCancelBtn = document.getElementById('confirm-cancel-btn');

                // Clona os botões para remover todos os listeners antigos e evitar duplicação
                const okBtn = oldOkBtn.cloneNode(true);
                const cancelBtn = oldCancelBtn.cloneNode(true);
                oldOkBtn.parentNode.replaceChild(okBtn, oldOkBtn);
                oldCancelBtn.parentNode.replaceChild(cancelBtn, oldCancelBtn);

                // Desabilitar botões inicialmente
                okBtn.disabled = true;
                cancelBtn.disabled = true;

                titleEl.textContent = title;
                messageEl.textContent = message;

                let isProcessing = false;
                let buttonsEnabled = false;

                const handleOk = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    if (isProcessing || !buttonsEnabled) return;
                    isProcessing = true;
                    cleanup().then(() => resolve(true));
                };

                const handleCancel = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    if (isProcessing || !buttonsEnabled) return;
                    isProcessing = true;
                    cleanup().then(() => resolve(false));
                };

                const cleanup = () => {
                    return new Promise((res) => {
                        document.removeEventListener('keydown', handleKeyDown);
                        const modalContent = modal.querySelector('.modal-content');
                        if (modalContent) {
                            modalContent.classList.remove('scale-100');
                            modalContent.classList.add('scale-95');
                        }
                        modal.classList.remove('show');

                        setTimeout(() => {
                            modal.classList.add('hidden');
                            modal.removeEventListener('click', handleBackdropClick);
                            res();
                        }, MODAL_ANIMATION_DURATION);
                    });
                };

                const handleKeyDown = (e) => {
                    if (isProcessing || !buttonsEnabled) return;
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        isProcessing = true;
                        cleanup().then(() => resolve(true));
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        isProcessing = true;
                        cleanup().then(() => resolve(false));
                    }
                };

                // Prevenir cliques no backdrop
                const handleBackdropClick = (e) => {
                    if (e.target === modal && !isProcessing && buttonsEnabled) {
                        // Não fazer nada - forçar uso dos botões
                        e.preventDefault();
                        e.stopPropagation();
                    }
                };

                okBtn.addEventListener('click', handleOk, { once: true, capture: true });
                cancelBtn.addEventListener('click', handleCancel, { once: true, capture: true });
                modal.addEventListener('click', handleBackdropClick);
                document.addEventListener('keydown', handleKeyDown);

                modal.classList.remove('hidden');

                // Delay maior antes de mostrar e habilitar botões
                setTimeout(() => {
                    modal.classList.add('show');
                    const modalContent = modal.querySelector('.modal-content');
                    if (modalContent) {
                        modalContent.classList.remove('scale-95');
                        modalContent.classList.add('scale-100');
                    }

                    // Habilitar botões após animação completa
                    setTimeout(() => {
                        okBtn.disabled = false;
                        cancelBtn.disabled = false;
                        buttonsEnabled = true;
                    }, 150);
                }, 50);
            });
        });
    },

    showAlert(message, title = 'Aviso', iconName = null) {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-alert-modal');
            const titleEl = document.getElementById('alert-title');
            const messageEl = document.getElementById('alert-message');
            const oldOkBtn = document.getElementById('alert-ok-btn');
            const iconContainer = document.getElementById('alert-icon-container');

            // Clona o botão para remover listeners antigos e evitar duplicação
            const okBtn = oldOkBtn.cloneNode(true);
            oldOkBtn.parentNode.replaceChild(okBtn, oldOkBtn);

            // Tratar ícone
            if (iconContainer) {
                if (iconName) {
                    iconContainer.innerHTML = `<i data-lucide="${iconName}" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i>`;
                    iconContainer.classList.remove('hidden');
                } else {
                    iconContainer.innerHTML = '';
                    iconContainer.classList.add('hidden');
                }
            }

            const titleTextEl = document.getElementById('alert-title-text');
            if (titleTextEl) {
                titleTextEl.textContent = title;
            } else {
                titleEl.textContent = title;
            }
            messageEl.textContent = message;

            if (iconName) {
                lucide.createIcons();
            }

            let isProcessing = false;

            const handleOk = (e) => {
                e.stopPropagation();
                if (isProcessing) return;
                isProcessing = true;
                cleanup();
                resolve();
            };

            const cleanup = () => {
                document.removeEventListener('keydown', handleKeyDown);
                modal.querySelector('.modal-content').classList.remove('scale-100');
                modal.querySelector('.modal-content').classList.add('scale-95');
                modal.classList.remove('show');

                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
            };

            const handleKeyDown = (e) => {
                if (isProcessing) return;
                if (e.key === 'Enter' || e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    isProcessing = true;
                    cleanup();
                    resolve();
                }
            };

            // Usa { once: true } para garantir que o listener execute apenas uma vez
            okBtn.addEventListener('click', handleOk, { once: true });
            document.addEventListener('keydown', handleKeyDown);

            modal.classList.remove('hidden');

            // Pequeno atraso antes de exibir o modal para evitar cliques acidentais
            setTimeout(() => {
                modal.classList.add('show');
                modal.querySelector('.modal-content').classList.remove('scale-95');
                modal.querySelector('.modal-content').classList.add('scale-100');
            }, 50);
        });
    },

    confirm(message, title = 'Confirmação', onConfirm) {
        const promise = this.showConfirm(message, title);

        if (typeof onConfirm === 'function') {
            promise.then((confirmed) => {
                if (confirmed) {
                    onConfirm();
                }
            });
        }

        return promise;
    },

    showInputPrompt(message, title = 'Entrada') {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-alert-modal');
            const titleEl = document.getElementById('alert-title');
            const messageEl = document.getElementById('alert-message');
            const oldOkBtn = document.getElementById('alert-ok-btn');

            // Clona o botão para remover listeners antigos
            const okBtn = oldOkBtn.cloneNode(true);
            oldOkBtn.parentNode.replaceChild(okBtn, oldOkBtn);

            titleEl.textContent = title;

            const inputHtml = `
                <p class="text-slate-600 dark:text-slate-400 mb-4">${message}</p>
                <input type="text" id="modal-input-field" class="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Digite aqui..." />
            `;
            messageEl.innerHTML = inputHtml;

            const inputField = document.getElementById('modal-input-field');

            let isProcessing = false;

            const handleOk = (e) => {
                if (e) e.stopPropagation();
                if (isProcessing) return;
                isProcessing = true;
                cleanup();
                resolve(inputField.value || null);
            };

            const handleKeyPress = (e) => {
                if (e.key === 'Enter') {
                    handleOk(e);
                    inputField.removeEventListener('keypress', handleKeyPress);
                }
            };

            const cleanup = () => {
                document.removeEventListener('keydown', handleEscapeKey);
                modal.querySelector('.modal-content').classList.remove('scale-100');
                modal.querySelector('.modal-content').classList.add('scale-95');
                modal.classList.remove('show');

                setTimeout(() => {
                    modal.classList.add('hidden');
                    okBtn.textContent = 'OK';
                }, 300);

                inputField.removeEventListener('keypress', handleKeyPress);
            };

            const handleEscapeKey = (e) => {
                if (isProcessing) return;
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    isProcessing = true;
                    cleanup();
                    resolve(null);
                }
            };

            // Usa { once: true } para garantir que o listener execute apenas uma vez
            okBtn.addEventListener('click', handleOk, { once: true });
            inputField.addEventListener('keypress', handleKeyPress);
            document.addEventListener('keydown', handleEscapeKey);
            okBtn.textContent = 'Confirmar';

            modal.classList.remove('hidden');

            // Pequeno atraso antes de exibir o modal para evitar cliques acidentais
            setTimeout(() => {
                modal.classList.add('show');
                modal.querySelector('.modal-content').classList.remove('scale-95');
                modal.querySelector('.modal-content').classList.add('scale-100');
                inputField.focus();
            }, 50);
        });
    },

    showImage(imageUrl, title = 'Visualizar Imagem') {
        // NÃO fechar modais anteriores. Queremos empilhar por cima.
        // this.close(); 

        const modalHtml = `
            <div id="image-modal" class="fixed inset-0 z-[10020] bg-black/90 backdrop-blur-md flex items-center justify-center opacity-0 transition-opacity duration-300">
                <div class="relative w-full h-full flex flex-col">
                    <!-- Header -->
                    <div class="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-4 bg-gradient-to-b from-black/50 to-transparent">
                        <h2 class="text-white font-medium text-lg drop-shadow-md">${title}</h2>
                        <button id="close-image-modal-btn" class="text-white/80 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-2 transition-colors backdrop-blur-sm">
                            <i data-lucide="x" class="w-6 h-6"></i>
                        </button>
                    </div>

                    <!-- Image Container -->
                    <div class="flex-1 overflow-hidden flex items-center justify-center p-4" id="image-zoom-container">
                        <img src="${imageUrl}" id="modal-image" class="max-w-full max-h-full object-contain transition-transform duration-200 cursor-grab active:cursor-grabbing" draggable="false" alt="Visualização">
                    </div>

                    <!-- Controls -->
                    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-xl z-10 select-none">
                        <button id="zoom-out-btn" class="text-white/80 hover:text-white hover:scale-110 transition-all p-1" title="Diminuir Zoom">
                            <i data-lucide="minus" class="w-6 h-6"></i>
                        </button>
                        <span id="zoom-level" class="text-white font-mono text-sm min-w-[3rem] text-center">100%</span>
                        <button id="zoom-in-btn" class="text-white/80 hover:text-white hover:scale-110 transition-all p-1" title="Aumentar Zoom">
                            <i data-lucide="plus" class="w-6 h-6"></i>
                        </button>
                        <div class="w-px h-6 bg-white/20 mx-1"></div>
                        <button id="reset-zoom-btn" class="text-white/80 hover:text-white hover:scale-110 transition-all p-1" title="Resetar">
                            <i data-lucide="maximize" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const imageModal = document.getElementById('image-modal');

        // Se havia um modal dinâmico anterior, mantemos referência para não perdê-la 
        // mas o sistema de Modals é simples. Vamos rastrear este modal de imagem localmente 
        // ou temporariamente sobrescrever currentModal se quisermos o comportamento padrão.
        // Por segurança, vamos tratar como uma sobreposição independente.

        lucide.createIcons();

        const img = document.getElementById('modal-image');
        const container = document.getElementById('image-zoom-container');
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const resetBtn = document.getElementById('reset-zoom-btn');
        const closeBtn = document.getElementById('close-image-modal-btn');
        const zoomLevelDisplay = document.getElementById('zoom-level');

        let scale = 1;
        let isDragging = false;
        let startX, startY;
        let translateX = 0, translateY = 0;

        const updateTransform = () => {
            if (!img) return; // Verificação de segurança — elemento pode não existir
            img.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
            if (zoomLevelDisplay) zoomLevelDisplay.textContent = `${Math.round(scale * 100)}%`;
        };

        const setZoom = (newScale) => {
            scale = Math.min(Math.max(0.1, newScale), 5); // Limitar zoom entre 0.1x e 5x
            updateTransform();
        };

        const handleZoomIn = () => setZoom(scale + 0.25);
        const handleZoomOut = () => setZoom(scale - 0.25);
        const handleReset = () => {
            scale = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
        };

        const cleanupListeners = () => {
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };

        const closeImageModal = () => {
            cleanupListeners();
            imageModal.classList.add('opacity-0');
            setTimeout(() => {
                imageModal.remove();
            }, 300);
        };

        zoomInBtn?.addEventListener('click', handleZoomIn);
        zoomOutBtn?.addEventListener('click', handleZoomOut);
        resetBtn?.addEventListener('click', handleReset);
        closeBtn?.addEventListener('click', closeImageModal);

        // Zoom com roda do mouse
        const handleWheel = (e) => {
            e.preventDefault();
            const delta = e.deltaY * -0.001;
            setZoom(scale + delta);
        };
        container?.addEventListener('wheel', handleWheel, { passive: false });

        const handleMouseDown = (e) => {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            img.classList.add('cursor-grabbing');
            img.classList.remove('cursor-grab');
        };
        img?.addEventListener('mousedown', handleMouseDown);

        const handleMouseUp = () => {
            isDragging = false;
            if (img) {
                img.classList.remove('cursor-grabbing');
                img.classList.add('cursor-grab');
            }
        };
        window.addEventListener('mouseup', handleMouseUp);

        const handleMouseMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            updateTransform();
        };
        window.addEventListener('mousemove', handleMouseMove);

        // Duplo clique para resetar
        const handleDblClick = () => {
            if (scale === 1) {
                setZoom(2);
            } else {
                scale = 1;
                translateX = 0;
                translateY = 0;
                updateTransform();
            }
        };
        img?.addEventListener('dblclick', handleDblClick);

        setTimeout(() => {
            if (imageModal) {
                imageModal.classList.remove('opacity-0');
            }
        }, 10);
    }
};

window.Modals = Modals;
