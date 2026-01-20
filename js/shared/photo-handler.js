/**
 * Photo Handler Module
 * Handles photo upload, webcam capture, compression and validation for bicycle photos
 */

export class PhotoHandler {
    constructor() {
        this.maxWidth = 800;
        this.maxHeight = 600;
        this.quality = 0.85;
        this.maxSizeKB = 500; // Max 500KB per image
        this.stream = null;
    }

    /**
     * Handle file upload from input
     * @param {File} file - The uploaded file
     * @returns {Promise<string>} - Base64 encoded image data URL
     */
    async handleFileUpload(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Nenhum arquivo selecionado'));
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                reject(new Error('Por favor, selecione um arquivo de imagem válido'));
                return;
            }

            // Check file size (10MB max before compression)
            if (file.size > 10 * 1024 * 1024) {
                reject(new Error('Arquivo muito grande. Por favor, selecione uma imagem menor que 10MB'));
                return;
            }

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const compressedImage = await this.compressImage(e.target.result);
                    resolve(compressedImage);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Compress and resize image
     * @param {string} dataURL - The image data URL
     * @returns {Promise<string>} - Compressed image data URL
     */
    async compressImage(dataURL) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > height) {
                        if (width > this.maxWidth) {
                            height *= this.maxWidth / width;
                            width = this.maxWidth;
                        }
                    } else {
                        if (height > this.maxHeight) {
                            width *= this.maxHeight / height;
                            height = this.maxHeight;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Try different quality levels to meet size requirement
                    let quality = this.quality;
                    let compressedDataURL = canvas.toDataURL('image/jpeg', quality);
                    
                    // Use binary search to find optimal quality level
                    let maxIterations = 10; // Prevent infinite loops
                    let iteration = 0;
                    let minQuality = 0.1;
                    let maxQuality = this.quality;
                    
                    while (this.getDataURLSize(compressedDataURL) > this.maxSizeKB * 1024 && 
                           quality > minQuality && 
                           iteration < maxIterations) {
                        maxQuality = quality;
                        quality = (minQuality + maxQuality) / 2;
                        compressedDataURL = canvas.toDataURL('image/jpeg', quality);
                        iteration++;
                    }

                    resolve(compressedDataURL);
                } catch (error) {
                    reject(new Error('Erro ao comprimir imagem'));
                }
            };
            img.onerror = () => reject(new Error('Erro ao carregar imagem'));
            img.src = dataURL;
        });
    }

    /**
     * Get size of data URL in bytes
     * @param {string} dataURL - The data URL
     * @returns {number} - Size in bytes
     */
    getDataURLSize(dataURL) {
        const base64 = dataURL.split(',')[1];
        if (!base64) return 0;
        // Account for padding characters for accurate byte count
        const padding = (base64.match(/=/g) || []).length;
        return (base64.length * 3) / 4 - padding;
    }

    /**
     * Start webcam stream
     * @returns {Promise<MediaStream>} - The media stream
     */
    async startWebcam() {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment' // Prefer back camera on mobile
                },
                audio: false
            });
            return this.stream;
        } catch (error) {
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
     * Stop webcam stream
     */
    stopWebcam() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    /**
     * Capture photo from video element
     * @param {HTMLVideoElement} videoElement - The video element
     * @returns {Promise<string>} - Captured image data URL
     */
    async captureFromVideo(videoElement) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(videoElement, 0, 0);

                const dataURL = canvas.toDataURL('image/jpeg', this.quality);
                
                // Compress the captured image
                this.compressImage(dataURL).then(resolve).catch(reject);
            } catch (error) {
                reject(new Error('Erro ao capturar foto'));
            }
        });
    }

    /**
     * Validate if a string is a valid data URL
     * @param {string} dataURL - The data URL to validate
     * @returns {boolean} - True if valid
     */
    isValidDataURL(dataURL) {
        if (!dataURL || typeof dataURL !== 'string') return false;
        return dataURL.startsWith('data:image/');
    }
}
