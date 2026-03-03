/**
 * ============================================================
 *  ARQUIVO: photo-handler.js
 *  DESCRIÇÃO: Módulo para captura, upload e compressão de fotos
 *
 *  FUNÇÃO: Gerencia todo o ciclo de vida das fotos de clientes e
 *          bicicletas no sistema:
 *          1. Upload de arquivo do computador/celular
 *          2. Captura via webcam (câmera do dispositivo)
 *          3. Compressão automática para reduzir o tamanho da imagem
 *          4. Validação de formato e tamanho
 *
 *  SOBRE A COMPRESSÃO:
 *  - As imagens são redimensionadas para no máximo 800x600 pixels.
 *  - A qualidade JPEG é ajustada automaticamente para manter o
 *    arquivo abaixo de 500KB (boa qualidade sem ocupar muito espaço).
 *  - Usa busca binária para encontrar a qualidade ótima rapidamente.
 *
 *  PARA INICIANTES:
 *  - Importe a classe: import { PhotoHandler } from './shared/photo-handler.js';
 *  - Crie uma instância: const photoHandler = new PhotoHandler();
 *  - Para upload: const base64 = await photoHandler.handleFileUpload(arquivo);
 *  - Para webcam:
 *      const stream = await photoHandler.startWebcam();
 *      videoElement.srcObject = stream;
 *      const foto = await photoHandler.captureFromVideo(videoElement);
 *      photoHandler.stopWebcam();
 * ============================================================
 */

export class PhotoHandler {

    /**
     * Cria o handler de fotos com as configurações padrão de compressão.
     *
     * Configurações:
     * - maxWidth:  Largura máxima da imagem final (pixels)
     * - maxHeight: Altura máxima da imagem final (pixels)
     * - quality:   Qualidade inicial do JPEG (0.0 a 1.0 → 0% a 100%)
     * - maxSizeKB: Tamanho máximo desejado da imagem final em KB
     * - stream:    Referência ao stream de vídeo da webcam (null quando não está ativa)
     */
    constructor() {
        this.maxWidth = 800;   // Largura máxima em pixels
        this.maxHeight = 600;   // Altura máxima em pixels
        this.quality = 0.85;  // Qualidade JPEG inicial (85%)
        this.maxSizeKB = 500;   // Tamanho máximo: 500 KB
        this.stream = null;  // Stream da webcam (null = câmera desligada)
    }

    /**
     * Processa um arquivo de imagem enviado pelo usuário (via input type="file").
     * Valida o tipo e tamanho antes de comprimir.
     *
     * Fluxo:
     *   1. Valida se é um arquivo de imagem (JPG, PNG, etc.)
     *   2. Valida se tem menos de 10MB (limite antes da compressão)
     *   3. Lê o arquivo como Base64 usando FileReader
     *   4. Comprime e retorna a imagem comprimida em Base64
     *
     * Exemplo de uso:
     *   const inputArquivo = document.getElementById('foto-input');
     *   const arquivo = inputArquivo.files[0];
     *   const base64 = await photoHandler.handleFileUpload(arquivo);
     *
     * @param {File} file - Arquivo de imagem do input HTML
     * @returns {Promise<string>} Data URL em Base64 da imagem comprimida
     * @throws {Error} Se o arquivo for inválido, muito grande ou houver erro de leitura
     */
    async handleFileUpload(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Nenhum arquivo selecionado'));
                return;
            }

            // Valida o tipo de arquivo: deve ser uma imagem (image/jpeg, image/png, etc.)
            if (!file.type.startsWith('image/')) {
                reject(new Error('Por favor, selecione um arquivo de imagem válido'));
                return;
            }

            // Valida o tamanho antes de comprimir: máximo de 10 MB
            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('Arquivo muito grande. Por favor, selecione uma imagem menor que 10MB'));
                return;
            }

            // Lê o arquivo como URL Base64 (string de dados da imagem)
            const reader = new FileReader();

            reader.onload = async (e) => {
                try {
                    // Comprime a imagem lida e resolve a Promise com o resultado
                    const compressedImage = await this.compressImage(e.target.result);
                    resolve(compressedImage);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
            reader.readAsDataURL(file); // Converte o arquivo para Base64
        });
    }

    /**
     * Comprime e redimensiona uma imagem fornecida como Data URL (Base64).
     *
     * Algoritmo:
     * 1. Carrega a imagem em um elemento <img> para ler as dimensões reais.
     * 2. Calcula as novas dimensões respeitando maxWidth e maxHeight,
     *    mantendo a proporção original (aspect ratio).
     * 3. Desenha a imagem redimensionada em um <canvas>.
     * 4. Usa busca binária para encontrar a qualidade JPEG mínima que
     *    mantém o arquivo abaixo de maxSizeKB.
     *
     * Busca binária de qualidade:
     *   - Começa com 'quality' (ex: 0.85)
     *   - Se ainda muito grande: testa (0.1 + 0.85) / 2 = 0.475
     *   - Continua halvando até atingir o tamanho desejado
     *   - Máximo de 10 iterações para evitar loops infinitos
     *
     * @param {string} dataURL - Imagem em formato Data URL (Base64)
     * @returns {Promise<string>} Data URL da imagem comprimida
     * @throws {Error} Se houver falha ao carregar ou comprimir a imagem
     */
    async compressImage(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Redimensiona mantendo a proporção (aspect ratio)
                    // Verifica se a imagem é "mais larga" ou "mais alta"
                    if (width > height) {
                        // Imagem landscape (horizontal)
                        if (width > this.maxWidth) {
                            height *= this.maxWidth / width; // Ajusta altura proporcionalmente
                            width = this.maxWidth;
                        }
                    } else {
                        // Imagem portrait (vertical) ou quadrada
                        if (height > this.maxHeight) {
                            width *= this.maxHeight / height; // Ajusta largura proporcionalmente
                            height = this.maxHeight;
                        }
                    }

                    // Define o tamanho do canvas e desenha a imagem redimensionada
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // ── Busca binária de qualidade ────────────────────────────────
                    let quality = this.quality;    // Começa com qualidade máxima
                    let minQuality = 0.1;             // Qualidade mínima aceitável (10%)
                    let maxQuality = this.quality;    // Qualidade máxima atual
                    let maxIterations = 10;            // Limite de tentativas
                    let iteration = 0;

                    let compressedDataURL = canvas.toDataURL('image/jpeg', quality);

                    // Reduz a qualidade enquanto o arquivo for muito grande
                    while (
                        this.getDataURLSize(compressedDataURL) > this.maxSizeKB * 1024 &&
                        quality > minQuality &&
                        iteration < maxIterations
                    ) {
                        maxQuality = quality;
                        quality = (minQuality + maxQuality) / 2; // Ponto médio
                        compressedDataURL = canvas.toDataURL('image/jpeg', quality);
                        iteration++;
                    }

                    resolve(compressedDataURL);
                } catch (error) {
                    reject(new Error('Erro ao comprimir imagem'));
                }
            };

            img.onerror = () => reject(new Error('Erro ao carregar imagem para compressão'));
            img.src = dataURL; // Carrega a imagem para disparar o onload
        });
    }

    /**
     * Calcula o tamanho em bytes de uma imagem em formato Data URL (Base64).
     *
     * Como funciona o Base64:
     * - Cada 3 bytes de dados binários se tornam 4 caracteres Base64.
     * - Portanto: bytes_reais ≈ (length_base64 * 3) / 4
     * - Os caracteres '=' no final são padding (não representam dados reais).
     *
     * @param {string} dataURL - Data URL da imagem
     * @returns {number} Tamanho estimado em bytes
     */
    getDataURLSize(dataURL) {
        const base64 = dataURL.split(',')[1]; // Remove o prefixo "data:image/jpeg;base64,"
        if (!base64) return 0;

        // Conta os caracteres de padding para ajuste preciso
        const padding = (base64.match(/=/g) || []).length;
        return (base64.length * 3) / 4 - padding;
    }

    /**
     * Inicia o stream da webcam/câmera do dispositivo.
     * Pede permissão de acesso à câmera ao usuário (o navegador mostrará um popup).
     *
     * Configurações preferidas:
     * - Resolução: 1280x720 (HD) quando disponível
     * - Câmera: traseira em dispositivos móveis (environment), frontal em outros
     * - Sem áudio (apenas vídeo)
     *
     * Exemplo de uso:
     *   const stream = await photoHandler.startWebcam();
     *   videoElement.srcObject = stream; // Exibe o feed da câmera no <video>
     *
     * @returns {Promise<MediaStream>} Stream de vídeo da câmera
     * @throws {Error} Com mensagem amigável se a câmera não estiver disponível ou permissão negada
     */
    async startWebcam() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },      // Prefere HD
                    height: { ideal: 720 },
                    facingMode: 'environment'          // Câmera traseira em mobile
                },
                audio: false // Sem microfone
            });
            return this.stream;
        } catch (error) {
            // Mensagens de erro amigáveis para cada tipo de falha
            if (error.name === 'NotAllowedError') {
                throw new Error('Permissão para acessar a câmera foi negada. Por favor, permita o acesso à câmera nas configurações do navegador.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('Nenhuma câmera encontrada no dispositivo.');
            } else {
                throw new Error('Erro ao acessar a câmera: ' + error.message);
            }
        }
    }

    /**
     * Para o stream da webcam e libera o acesso à câmera.
     * Sempre chame este método quando terminar de usar a câmera para
     * apagar o indicador de câmera ativa (luz na câmera) e liberar recursos.
     */
    stopWebcam() {
        if (this.stream) {
            // Para cada trilha de mídia (vídeo) do stream
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null; // Limpa a referência
        }
    }

    /**
     * Captura um frame (foto estática) do feed de vídeo da webcam.
     * Desenha o frame atual do vídeo em um canvas e converte para Base64.
     * Em seguida, comprime a imagem capturada com o mesmo algoritmo do upload.
     *
     * Pré-requisito: startWebcam() deve ter sido chamado antes e o
     * stream deve estar sendo exibido no elemento <video> fornecido.
     *
     * Exemplo:
     *   const foto = await photoHandler.captureFromVideo(document.getElementById('camera-video'));
     *
     * @param {HTMLVideoElement} videoElement - Elemento <video> com o feed da câmera
     * @returns {Promise<string>} Data URL da foto capturada e comprimida
     * @throws {Error} Se houver falha ao capturar o frame do vídeo
     */
    async captureFromVideo(videoElement) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                // Usa as dimensões reais do vídeo (resolução atual da câmera)
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoElement, 0, 0); // Captura o frame atual

                // Converte para JPEG com qualidade inicial
                const dataURL = canvas.toDataURL('image/jpeg', this.quality);

                // Comprime a imagem capturada antes de retornar
                this.compressImage(dataURL).then(resolve).catch(reject);
            } catch (error) {
                reject(new Error('Erro ao capturar foto da câmera'));
            }
        });
    }

    /**
     * Verifica se uma string é uma Data URL de imagem válida.
     * Data URLs de imagem sempre começam com "data:image/".
     *
     * Exemplo:
     *   photoHandler.isValidDataURL('data:image/jpeg;base64,...') => true
     *   photoHandler.isValidDataURL('https://exemplo.com/foto.jpg') => false
     *   photoHandler.isValidDataURL(null) => false
     *
     * @param {string} dataURL - String a verificar
     * @returns {boolean} true se for uma Data URL de imagem válida
     */
    isValidDataURL(dataURL) {
        if (!dataURL || typeof dataURL !== 'string') return false;
        return dataURL.startsWith('data:image/');
    }
}
