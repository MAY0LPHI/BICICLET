export const Modals = {
    currentModal: null,

    show(title, content) {
        this.close();
        
        const modalHtml = `
            <div id="dynamic-modal" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 opacity-0 transition-opacity duration-300">
                <div class="modal-content bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform scale-95 transition-transform duration-300">
                    <div class="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
                        <h2 class="text-xl font-semibold text-slate-800 dark:text-slate-200">${title}</h2>
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
        if (this.currentModal) {
            this.currentModal.classList.add('opacity-0');
            this.currentModal.querySelector('.modal-content').classList.remove('scale-100');
            this.currentModal.querySelector('.modal-content').classList.add('scale-95');
            
            setTimeout(() => {
                this.currentModal.remove();
                this.currentModal = null;
            }, 300);
        }
    },

    async alert(message, title = 'Aviso') {
        return this.showAlert(message, title);
    },

    showConfirm(message, title = 'Confirmação') {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const titleEl = document.getElementById('confirm-title');
            const messageEl = document.getElementById('confirm-message');
            const okBtn = document.getElementById('confirm-ok-btn');
            const cancelBtn = document.getElementById('confirm-cancel-btn');

            titleEl.textContent = title;
            messageEl.textContent = message;

            const handleOk = () => {
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                modal.querySelector('.modal-content').classList.remove('scale-100');
                modal.querySelector('.modal-content').classList.add('scale-95');
                modal.classList.remove('show');
                
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
                
                okBtn.removeEventListener('click', handleOk);
                cancelBtn.removeEventListener('click', handleCancel);
            };

            okBtn.addEventListener('click', handleOk);
            cancelBtn.addEventListener('click', handleCancel);

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('show');
                modal.querySelector('.modal-content').classList.remove('scale-95');
                modal.querySelector('.modal-content').classList.add('scale-100');
            }, 10);
        });
    },

    showAlert(message, title = 'Aviso') {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-alert-modal');
            const titleEl = document.getElementById('alert-title');
            const messageEl = document.getElementById('alert-message');
            const okBtn = document.getElementById('alert-ok-btn');

            titleEl.textContent = title;
            messageEl.textContent = message;

            const handleOk = () => {
                cleanup();
                resolve();
            };

            const cleanup = () => {
                modal.querySelector('.modal-content').classList.remove('scale-100');
                modal.querySelector('.modal-content').classList.add('scale-95');
                modal.classList.remove('show');
                
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
                
                okBtn.removeEventListener('click', handleOk);
            };

            okBtn.addEventListener('click', handleOk);

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('show');
                modal.querySelector('.modal-content').classList.remove('scale-95');
                modal.querySelector('.modal-content').classList.add('scale-100');
            }, 10);
        });
    },

    confirm(message, title = 'Confirmação', onConfirm) {
        this.showConfirm(message, title).then((confirmed) => {
            if (confirmed && typeof onConfirm === 'function') {
                onConfirm();
            }
        });
    }
};

window.Modals = Modals;
