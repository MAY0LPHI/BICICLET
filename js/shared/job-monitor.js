export class JobMonitor {
    constructor() {
        this.jobs = new Map();
        this.lastKnownChanges = {
            clients: 0,
            registros: 0,
            usuarios: 0,
            categorias: 0
        };
        this.changeCallbacks = [];
        this.pollingInterval = null;
        this.changePollingInterval = null;
        this.container = null;
        this.isPolling = false;
        this.hasActiveJobs = false;
        
        this.init();
    }
    
    init() {
        this.createContainer();
        this.loadLastKnownChanges();
        this.startPolling();
    }
    
    createContainer() {
        if (document.getElementById('job-monitor-container')) {
            this.container = document.getElementById('job-monitor-container');
            return;
        }
        
        this.container = document.createElement('div');
        this.container.id = 'job-monitor-container';
        this.container.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm';
        document.body.appendChild(this.container);
    }
    
    loadLastKnownChanges() {
        try {
            const saved = localStorage.getItem('lastKnownChanges');
            if (saved) {
                this.lastKnownChanges = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Erro ao carregar lastKnownChanges:', e);
        }
    }
    
    saveLastKnownChanges() {
        try {
            localStorage.setItem('lastKnownChanges', JSON.stringify(this.lastKnownChanges));
        } catch (e) {
            console.warn('Erro ao salvar lastKnownChanges:', e);
        }
    }
    
    startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;
        
        this.scheduleJobPolling();
        this.changePollingInterval = setInterval(() => this.pollChanges(), 5000);
        
        this.pollJobs();
        this.pollChanges();
    }
    
    scheduleJobPolling() {
        if (this.pollingInterval) {
            clearTimeout(this.pollingInterval);
        }
        const interval = this.hasActiveJobs ? 1000 : 5000;
        this.pollingInterval = setTimeout(() => {
            this.pollJobs();
            this.scheduleJobPolling();
        }, interval);
    }
    
    stopPolling() {
        this.isPolling = false;
        if (this.pollingInterval) {
            clearTimeout(this.pollingInterval);
            this.pollingInterval = null;
        }
        if (this.changePollingInterval) {
            clearInterval(this.changePollingInterval);
            this.changePollingInterval = null;
        }
    }
    
    async pollJobs() {
        try {
            const response = await fetch('/api/jobs');
            if (!response.ok) return;
            
            const data = await response.json();
            const activeJobs = data.active || [];
            
            this.hasActiveJobs = activeJobs.length > 0;
            
            activeJobs.forEach(job => {
                this.updateJobCard(job);
            });
            
            this.jobs.forEach((_, jobId) => {
                const stillActive = activeJobs.find(j => j.id === jobId);
                if (!stillActive) {
                    this.fetchAndUpdateJob(jobId);
                }
            });
            
        } catch (e) {
            console.warn('Erro ao buscar jobs:', e);
        }
    }
    
    async fetchAndUpdateJob(jobId) {
        try {
            const response = await fetch(`/api/job/${jobId}`);
            if (!response.ok) return;
            
            const job = await response.json();
            this.updateJobCard(job);
            
        } catch (e) {
            console.warn('Erro ao buscar job:', e);
        }
    }
    
    async pollChanges() {
        try {
            const response = await fetch('/api/changes');
            if (!response.ok) return;
            
            const currentChanges = await response.json();
            
            const hasChanges = {
                clients: currentChanges.clients > this.lastKnownChanges.clients,
                registros: currentChanges.registros > this.lastKnownChanges.registros,
                usuarios: currentChanges.usuarios > this.lastKnownChanges.usuarios,
                categorias: currentChanges.categorias > this.lastKnownChanges.categorias
            };
            
            const anyChange = Object.values(hasChanges).some(v => v);
            
            if (anyChange) {
                this.lastKnownChanges = { ...currentChanges };
                this.saveLastKnownChanges();
                
                this.changeCallbacks.forEach(callback => {
                    try {
                        callback(hasChanges);
                    } catch (e) {
                        console.warn('Erro no callback de mudanças:', e);
                    }
                });
            }
            
        } catch (e) {
            console.warn('Erro ao verificar mudanças:', e);
        }
    }
    
    onChanges(callback) {
        this.changeCallbacks.push(callback);
    }
    
    removeChangeCallback(callback) {
        const index = this.changeCallbacks.indexOf(callback);
        if (index > -1) {
            this.changeCallbacks.splice(index, 1);
        }
    }
    
    updateJobCard(job) {
        let card = document.getElementById(`job-card-${job.id}`);
        
        if (!card) {
            card = this.createJobCard(job);
            this.jobs.set(job.id, card);
        }
        
        this.updateCardContent(card, job);
        
        if (job.status === 'completed' || job.status === 'failed') {
            setTimeout(() => {
                this.removeJobCard(job.id);
            }, 5000);
        }
    }
    
    createJobCard(job) {
        const card = document.createElement('div');
        card.id = `job-card-${job.id}`;
        card.className = 'bg-slate-800 border border-slate-700 rounded-lg shadow-lg p-4 animate-slide-in';
        this.container.appendChild(card);
        return card;
    }
    
    updateCardContent(card, job) {
        const typeIcons = {
            'import_clients': 'users',
            'import_registros': 'file-text',
            'import_system_backup': 'database'
        };
        
        const typeLabels = {
            'import_clients': 'Importando Clientes',
            'import_registros': 'Importando Registros',
            'import_system_backup': 'Importando Backup'
        };
        
        const statusColors = {
            'pending': 'text-yellow-400',
            'running': 'text-blue-400',
            'completed': 'text-green-400',
            'failed': 'text-red-400'
        };
        
        const progressColors = {
            'pending': 'bg-yellow-500',
            'running': 'bg-orange-500',
            'completed': 'bg-green-500',
            'failed': 'bg-red-500'
        };
        
        const icon = typeIcons[job.type] || 'loader';
        const label = typeLabels[job.type] || 'Processando';
        const statusColor = statusColors[job.status] || 'text-slate-400';
        const progressColor = progressColors[job.status] || 'bg-blue-500';
        
        card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                    <i data-lucide="${icon}" class="w-4 h-4 ${statusColor}"></i>
                    <span class="text-white font-medium text-sm">${label}</span>
                </div>
                <span class="text-orange-400 font-bold text-sm">${job.current}/${job.total}</span>
            </div>
            <div class="mb-2">
                <div class="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div class="${progressColor} h-2 rounded-full transition-all duration-300" style="width: ${job.progress}%"></div>
                </div>
            </div>
            <div class="flex items-center justify-between">
                <span class="text-slate-400 text-xs truncate max-w-[200px]">${job.message}</span>
                <span class="text-slate-500 text-xs">${job.progress}%</span>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ nodes: [card] });
        }
    }
    
    removeJobCard(jobId) {
        const card = document.getElementById(`job-card-${jobId}`);
        if (card) {
            card.classList.add('animate-slide-out');
            setTimeout(() => {
                card.remove();
                this.jobs.delete(jobId);
            }, 300);
        }
    }
    
    async startImportClients(clients) {
        try {
            const response = await fetch('/api/import/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients })
            });
            
            if (!response.ok) throw new Error('Falha ao iniciar importação');
            
            const data = await response.json();
            return data;
            
        } catch (e) {
            console.error('Erro ao iniciar importação de clientes:', e);
            throw e;
        }
    }
    
    async startImportRegistros(registros) {
        try {
            const response = await fetch('/api/import/registros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registros })
            });
            
            if (!response.ok) throw new Error('Falha ao iniciar importação');
            
            const data = await response.json();
            return data;
            
        } catch (e) {
            console.error('Erro ao iniciar importação de registros:', e);
            throw e;
        }
    }
    
    async startImportBackup(backupData) {
        try {
            const response = await fetch('/api/import/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(backupData)
            });
            
            if (!response.ok) throw new Error('Falha ao iniciar importação de backup');
            
            const data = await response.json();
            return data;
            
        } catch (e) {
            console.error('Erro ao iniciar importação de backup:', e);
            throw e;
        }
    }
    
    async notifyChange(type) {
        try {
            await fetch('/api/notify-change', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
        } catch (e) {
            console.warn('Erro ao notificar mudança:', e);
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `bg-slate-800 border rounded-lg shadow-lg p-3 animate-slide-in ${
            type === 'success' ? 'border-green-500' :
            type === 'error' ? 'border-red-500' :
            type === 'warning' ? 'border-yellow-500' :
            'border-blue-500'
        }`;
        
        const iconMap = {
            'success': 'check-circle',
            'error': 'x-circle',
            'warning': 'alert-triangle',
            'info': 'info'
        };
        
        const colorMap = {
            'success': 'text-green-400',
            'error': 'text-red-400',
            'warning': 'text-yellow-400',
            'info': 'text-blue-400'
        };
        
        toast.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="${iconMap[type]}" class="w-4 h-4 ${colorMap[type]}"></i>
                <span class="text-white text-sm">${message}</span>
            </div>
        `;
        
        this.container.appendChild(toast);
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ nodes: [toast] });
        }
        
        setTimeout(() => {
            toast.classList.add('animate-slide-out');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
}

let jobMonitorInstance = null;

export function getJobMonitor() {
    if (!jobMonitorInstance) {
        jobMonitorInstance = new JobMonitor();
    }
    return jobMonitorInstance;
}
