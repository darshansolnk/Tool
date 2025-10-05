// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadArea = document.getElementById('uploadArea');
const uploadTitle = document.getElementById('uploadTitle');
const uploadDescription = document.getElementById('uploadDescription');

// Tool sections
const toolTabs = document.querySelectorAll('.tool-tab');
const toolSections = document.querySelectorAll('.tool-section');

// Resize tool elements
const resizeControls = document.getElementById('resizeControls');
const originalPreview = document.getElementById('originalPreview');
const resizedPreview = document.getElementById('resizedPreview');
const originalInfo = document.getElementById('originalInfo');
const resizedInfo = document.getElementById('resizedInfo');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const lockAspectRatio = document.getElementById('lockAspectRatio');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const qualityIndicator = document.getElementById('qualityIndicator');
const formatSelect = document.getElementById('format');
const resizeBtn = document.getElementById('resizeBtn');
const downloadResizedBtn = document.getElementById('downloadResizedBtn');
const resetResizeBtn = document.getElementById('resetResizeBtn');
const presetButtons = document.querySelectorAll('.preset-btn');

// PDF tool elements
const pdfControls = document.getElementById('pdfControls');
const imageList = document.getElementById('imageList');
const pdfInfo = document.getElementById('pdfInfo');
const pdfPreview = document.getElementById('pdfPreview');
const pdfPreviewInfo = document.getElementById('pdfPreviewInfo');
const pageSize = document.getElementById('pageSize');
const pageOrientation = document.getElementById('pageOrientation');
const imageLayout = document.getElementById('imageLayout');
const pdfQualityInput = document.getElementById('pdfQuality');
const pdfQualityValue = document.getElementById('pdfQualityValue');
const pdfQualityIndicator = document.getElementById('pdfQualityIndicator');
const reorderBtn = document.getElementById('reorderBtn');
const removeAllBtn = document.getElementById('removeAllBtn');
const createPdfBtn = document.getElementById('createPdfBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const resetPdfBtn = document.getElementById('resetPdfBtn');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// Global variables
let currentTool = 'resize';
let originalImage = null;
let resizedImageBlob = null;
let originalFile = null;
let originalWidth = 0;
let originalHeight = 0;
let aspectRatio = 1;

// PDF variables
let pdfImages = [];
let pdfDoc = null;
let isReordering = false;

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // File upload
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Tool tabs
    toolTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTool(tab.dataset.tool));
    });
    
    // Resize tool events
    widthInput.addEventListener('input', handleDimensionChange);
    heightInput.addEventListener('input', handleDimensionChange);
    qualityInput.addEventListener('input', updateQualityDisplay);
    
    resizeBtn.addEventListener('click', resizeImage);
    downloadResizedBtn.addEventListener('click', downloadResizedImage);
    resetResizeBtn.addEventListener('click', resetResizeTool);
    
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            const width = parseInt(button.dataset.width);
            const height = parseInt(button.dataset.height);
            widthInput.value = width;
            heightInput.value = height;
            resizeImage();
        });
    });
    
    // PDF tool events
    pdfQualityInput.addEventListener('input', updatePdfQualityDisplay);
    reorderBtn.addEventListener('click', toggleReorder);
    removeAllBtn.addEventListener('click', removeAllImages);
    createPdfBtn.addEventListener('click', createPDF);
    downloadPdfBtn.addEventListener('click', downloadPDF);
    resetPdfBtn.addEventListener('click', resetPdfTool);
    
    // Initialize displays
    updateQualityDisplay();
    updatePdfQualityDisplay();
    updateUploadText();
}

// Tool Switching
function switchTool(tool) {
    currentTool = tool;
    
    // Update active tab
    toolTabs.forEach(tab => {
        if (tab.dataset.tool === tool) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update active section
    toolSections.forEach(section => {
        if (section.id === `${tool}Tool`) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
    
    // Update upload area text
    updateUploadText();
    
    // Reset file input
    fileInput.value = '';
    
    // Show appropriate controls if files are already loaded
    if (tool === 'resize' && originalFile) {
        resizeControls.style.display = 'block';
    } else if (tool === 'pdf' && pdfImages.length > 0) {
        pdfControls.style.display = 'block';
    } else {
        resizeControls.style.display = 'none';
        pdfControls.style.display = 'none';
    }
}

function updateUploadText() {
    if (currentTool === 'pdf') {
        uploadTitle.textContent = 'Upload Images for PDF';
        uploadDescription.textContent = 'Drag & drop your images here or click to browse (multiple images supported)';
        fileInput.setAttribute('multiple', 'true');
    } else {
        uploadTitle.textContent = 'Upload an Image';
        uploadDescription.textContent = 'Drag & drop your image here or click to browse';
        fileInput.removeAttribute('multiple');
    }
}

// File Handling
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.style.borderColor = 'var(--primary)';
    uploadArea.style.backgroundColor = '#f0f4ff';
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.style.borderColor = '#ccc';
    uploadArea.style.backgroundColor = 'transparent';
    
    if (e.dataTransfer.files.length) {
        if (currentTool === 'pdf') {
            handlePdfFiles(Array.from(e.dataTransfer.files));
        } else {
            handleFile(e.dataTransfer.files[0]);
        }
    }
}

function handleFileSelect(e) {
    if (e.target.files.length) {
        if (currentTool === 'pdf') {
            handlePdfFiles(Array.from(e.target.files));
        } else {
            handleFile(e.target.files[0]);
        }
    }
}

function handleFile(file) {
    if (!file.type.match('image.*')) {
        showToast('Please select a valid image file', 'error');
        return;
    }
    
    originalFile = file;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        originalImage = new Image();
        originalImage.onload = function() {
            // Set original dimensions
            originalWidth = originalImage.width;
            originalHeight = originalImage.height;
            aspectRatio = originalWidth / originalHeight;
            
            // Set initial dimensions in inputs
            widthInput.value = originalWidth;
            heightInput.value = originalHeight;
            
            // Display original image
            displayOriginalImage();
            
            // Show resize controls
            resizeControls.style.display = 'block';
            
            showToast('Image loaded successfully');
        };
        originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function handlePdfFiles(files) {
    const validFiles = files.filter(file => file.type.match('image.*'));
    
    if (validFiles.length === 0) {
        showToast('Please select valid image files', 'error');
        return;
    }
    
    // Add files to PDF images array
    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                pdfImages.push({
                    file: file,
                    dataUrl: e.target.result,
                    image: img,
                    name: file.name,
                    size: file.size
                });
                
                updateImageList();
                
                if (pdfImages.length === validFiles.length) {
                    pdfControls.style.display = 'block';
                    showToast(`${pdfImages.length} images loaded successfully`);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Resize Tool Functions
function displayOriginalImage() {
    originalPreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = originalImage.src;
    originalPreview.appendChild(img);
    
    // Display file info
    const fileSize = formatFileSize(originalFile.size);
    const dimensions = `${originalImage.width} × ${originalImage.height}`;
    originalInfo.textContent = `${fileSize} • ${dimensions}`;
}

function displayResizedImage(blob) {
    resizedPreview.innerHTML = '';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    resizedPreview.appendChild(img);
    
    // Display file info
    const fileSize = formatFileSize(blob.size);
    const dimensions = `${widthInput.value} × ${heightInput.value}`;
    const savings = Math.round((1 - blob.size / originalFile.size) * 100);
    resizedInfo.textContent = `${fileSize} • ${dimensions} • ${savings}% smaller`;
}

function handleDimensionChange(e) {
    if (!lockAspectRatio.checked || !originalImage) return;
    
    if (e.target.id === 'width') {
        const newWidth = parseInt(e.target.value);
        const newHeight = Math.round(newWidth / aspectRatio);
        heightInput.value = newHeight;
    } else if (e.target.id === 'height') {
        const newHeight = parseInt(e.target.value);
        const newWidth = Math.round(newHeight * aspectRatio);
        widthInput.value = newWidth;
    }
}

function updateQualityDisplay() {
    const value = qualityInput.value;
    qualityValue.textContent = `${value}%`;
    
    // Update quality indicator
    if (value >= 90) {
        qualityIndicator.textContent = 'Excellent Quality';
        qualityIndicator.style.color = '#4bb543';
    } else if (value >= 70) {
        qualityIndicator.textContent = 'Good Quality';
        qualityIndicator.style.color = '#ffa500';
    } else if (value >= 50) {
        qualityIndicator.textContent = 'Medium Quality';
        qualityIndicator.style.color = '#ff8c00';
    } else {
        qualityIndicator.textContent = 'Low Quality';
        qualityIndicator.style.color = '#ff4500';
    }
}

function resizeImage() {
    if (!originalImage) return;
    
    resizeBtn.disabled = true;
    resizeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resizing...';
    
    // Get resize settings
    const newWidth = parseInt(widthInput.value);
    const newHeight = parseInt(heightInput.value);
    const quality = parseInt(qualityInput.value) / 100;
    const format = formatSelect.value;
    
    // Create canvas for resizing
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw image on canvas with new dimensions
    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);
    
    // Determine output format
    let mimeType = 'image/jpeg';
    if (format === 'png') {
        mimeType = 'image/png';
    } else if (format === 'webp') {
        mimeType = 'image/webp';
    }
    
    // Convert to blob with specified quality
    canvas.toBlob(function(blob) {
        resizedImageBlob = blob;
        
        // Display resized image
        displayResizedImage(blob);
        
        // Enable download button
        downloadResizedBtn.disabled = false;
        resizeBtn.disabled = false;
        resizeBtn.innerHTML = '<i class="fas fa-compress"></i> Resize Image';
        
        showToast('Image resized successfully');
    }, mimeType, quality);
}

function downloadResizedImage() {
    if (!resizedImageBlob) return;
    
    const format = formatSelect.value;
    const url = URL.createObjectURL(resizedImageBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resized-image.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Image downloaded successfully');
}

function resetResizeTool() {
    // Reset all inputs
    fileInput.value = '';
    widthInput.value = 800;
    heightInput.value = 600;
    qualityInput.value = 85;
    formatSelect.value = 'jpeg';
    
    // Reset displays
    originalPreview.innerHTML = '';
    resizedPreview.innerHTML = '';
    originalInfo.textContent = '';
    resizedInfo.textContent = '';
    
    // Hide controls section
    resizeControls.style.display = 'none';
    
    // Reset global variables
    originalImage = null;
    resizedImageBlob = null;
    originalFile = null;
    
    // Update quality display
    updateQualityDisplay();
    
    // Disable download button
    downloadResizedBtn.disabled = true;
    
    showToast('Resize tool reset successfully');
}

// PDF Tool Functions
function updateImageList() {
    imageList.innerHTML = '';
    
    pdfImages.forEach((image, index) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.draggable = isReordering;
        imageItem.dataset.index = index;
        
        imageItem.innerHTML = `
            <img src="${image.dataUrl}" alt="${image.name}">
            <div class="image-item-info">
                <div class="image-item-name">${image.name}</div>
                <div class="image-item-size">${formatFileSize(image.size)} • ${image.image.width}×${image.image.height}</div>
            </div>
            <button class="image-item-remove" data-index="${index}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add drag events if reordering is enabled
        if (isReordering) {
            imageItem.addEventListener('dragstart', handleDragStart);
            imageItem.addEventListener('dragover', handleDragOverPdf);
            imageItem.addEventListener('drop', handleDropPdf);
            imageItem.addEventListener('dragend', handleDragEnd);
        }
        
        // Add remove event
        const removeBtn = imageItem.querySelector('.image-item-remove');
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeImage(index);
        });
        
        imageList.appendChild(imageItem);
    });
    
    // Update PDF info
    pdfInfo.textContent = `${pdfImages.length} image(s) selected • Total size: ${formatFileSize(pdfImages.reduce((total, img) => total + img.size, 0))}`;
    
    // Enable/disable PDF creation button
    createPdfBtn.disabled = pdfImages.length === 0;
    downloadPdfBtn.disabled = true;
}

function removeImage(index) {
    pdfImages.splice(index, 1);
    updateImageList();
    showToast('Image removed');
}

function removeAllImages() {
    pdfImages = [];
    updateImageList();
    pdfPreview.innerHTML = '<i class="fas fa-file-pdf"></i><p>PDF will be generated here</p>';
    pdfPreviewInfo.textContent = '';
    showToast('All images removed');
}

function toggleReorder() {
    isReordering = !isReordering;
    reorderBtn.innerHTML = isReordering ? 
        '<i class="fas fa-check"></i> Done Reordering' : 
        '<i class="fas fa-sort"></i> Reorder Images';
    reorderBtn.classList.toggle('btn-primary', isReordering);
    reorderBtn.classList.toggle('btn-outline', !isReordering);
    updateImageList();
}

// PDF Drag and Drop Reordering
function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.index);
    e.target.classList.add('dragging');
}

function handleDragOverPdf(e) {
    e.preventDefault();
}

function handleDropPdf(e) {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const toIndex = parseInt(e.target.closest('.image-item').dataset.index);
    
    if (fromIndex !== toIndex) {
        // Reorder the array
        const [movedItem] = pdfImages.splice(fromIndex, 1);
        pdfImages.splice(toIndex, 0, movedItem);
        updateImageList();
    }
    
    e.target.classList.remove('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function updatePdfQualityDisplay() {
    const value = pdfQualityInput.value;
    pdfQualityValue.textContent = `${value}%`;
    
    // Update quality indicator
    if (value >= 90) {
        pdfQualityIndicator.textContent = 'High Quality';
        pdfQualityIndicator.style.color = '#4bb543';
    } else if (value >= 70) {
        pdfQualityIndicator.textContent = 'Good Quality';
        pdfQualityIndicator.style.color = '#ffa500';
    } else if (value >= 50) {
        pdfQualityIndicator.textContent = 'Medium Quality';
        pdfQualityIndicator.style.color = '#ff8c00';
    } else {
        pdfQualityIndicator.textContent = 'Low Quality';
        pdfQualityIndicator.style.color = '#ff4500';
    }
}

function createPDF() {
    if (pdfImages.length === 0) return;
    
    createPdfBtn.disabled = true;
    createPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating PDF...';
    
    // Use jsPDF to create PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: pageOrientation.value,
        unit: 'mm',
        format: pageSize.value
    });
    
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const quality = parseInt(pdfQualityInput.value) / 100;
    
    // Process each image
    let processNextImage = (index) => {
        if (index >= pdfImages.length) {
            // All images processed
            pdfDoc = doc;
            displayPdfPreview(doc);
            createPdfBtn.disabled = false;
            createPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Create PDF';
            downloadPdfBtn.disabled = false;
            showToast('PDF created successfully');
            return;
        }
        
        const image = pdfImages[index];
        const img = image.image;
        
        // Calculate dimensions based on layout
        let imgWidth, imgHeight, x, y;
        
        switch (imageLayout.value) {
            case 'fit':
                // Fit image to page while maintaining aspect ratio
                const ratio = Math.min(pdfWidth / img.width, pdfHeight / img.height);
                imgWidth = img.width * ratio;
                imgHeight = img.height * ratio;
                x = (pdfWidth - imgWidth) / 2;
                y = (pdfHeight - imgHeight) / 2;
                break;
                
            case 'full':
                // Use original dimensions (might be cropped)
                imgWidth = pdfWidth;
                imgHeight = (img.height * pdfWidth) / img.width;
                x = 0;
                y = 0;
                break;
                
            case 'multiple':
                // Place multiple images per page (simplified)
                imgWidth = pdfWidth / 2 - 10;
                imgHeight = (img.height * imgWidth) / img.width;
                x = (index % 2) * (pdfWidth / 2) + 5;
                y = (Math.floor(index / 2) % 2) * (pdfHeight / 2) + 5;
                break;
        }
        
        // Add new page if not the first image
        if (index > 0) {
            doc.addPage();
        }
        
        // Add image to PDF
        doc.addImage(img, 'JPEG', x, y, imgWidth, imgHeight, `image${index}`, 'FAST');
        
        // Process next image
        setTimeout(() => processNextImage(index + 1), 100);
    };
    
    // Start processing
    processNextImage(0);
}

function displayPdfPreview(doc) {
    pdfPreview.innerHTML = '';
    
    // Create a simple preview (in a real app, you might use pdf.js for better preview)
    const previewText = document.createElement('div');
    previewText.style.padding = '2rem';
    previewText.style.textAlign = 'center';
    previewText.innerHTML = `
        <i class="fas fa-file-pdf" style="font-size: 3rem; color: #e63946; margin-bottom: 1rem;"></i>
        <h4>PDF Preview</h4>
        <p>${pdfImages.length} page(s) • ${pageSize.value.toUpperCase()} • ${pageOrientation.value}</p>
        <p style="font-size: 0.9rem; color: #666; margin-top: 1rem;">Click "Download PDF" to save the file</p>
    `;
    pdfPreview.appendChild(previewText);
    
    // Update PDF info
    pdfPreviewInfo.textContent = `PDF ready • ${pdfImages.length} page(s) • ${pageSize.value.toUpperCase()} ${pageOrientation.value}`;
}

function downloadPDF() {
    if (!pdfDoc) return;
    
    pdfDoc.save('converted-images.pdf');
    showToast('PDF downloaded successfully');
}

function resetPdfTool() {
    // Reset all inputs
    fileInput.value = '';
    pageSize.value = 'a4';
    pageOrientation.value = 'portrait';
    imageLayout.value = 'fit';
    pdfQualityInput.value = '90';
    
    // Reset PDF data
    pdfImages = [];
    pdfDoc = null;
    
    // Reset displays
    imageList.innerHTML = '';
    pdfInfo.textContent = '';
    pdfPreview.innerHTML = '<i class="fas fa-file-pdf"></i><p>PDF will be generated here</p>';
    pdfPreviewInfo.textContent = '';
    
    // Hide controls section
    pdfControls.style.display = 'none';
    
    // Update quality display
    updatePdfQualityDisplay();
    
    // Disable buttons
    createPdfBtn.disabled = true;
    downloadPdfBtn.disabled = true;
    isReordering = false;
    reorderBtn.innerHTML = '<i class="fas fa-sort"></i> Reorder Images';
    reorderBtn.classList.remove('btn-primary');
    reorderBtn.classList.add('btn-outline');
    
    showToast('PDF tool reset successfully');
}

// Utility Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showToast(message, type = 'success') {
    toastMessage.textContent = message;
    
    // Set color based on type
    if (type === 'error') {
        toast.style.background = 'var(--danger)';
        toast.className = 'toast error show';
    } else {
        toast.style.background = 'var(--success)';
        toast.className = 'toast show';
    }
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}