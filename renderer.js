document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop_zone');
    const imageStack = document.getElementById('image_stack');
    const presetWidthInput = document.getElementById('presetWidth');
    const useSeparatorCheckbox = document.getElementById('useSeparator');
    let firstImageWidth = null;
    let selectedImage = null;
    let separatorImages = [];  // Track separator images

    const defaultWidth = 500;
    presetWidthInput.value = defaultWidth;

    // Create a live separator image for preview
    function createLiveSeparator(width) {
        const separatorCanvas = document.createElement('canvas');
        const ctx = separatorCanvas.getContext('2d');
        
        // Set canvas dimensions
        separatorCanvas.width = width || firstImageWidth || defaultWidth;
        separatorCanvas.height = 25; // Thinner separator height
        
        // Create a textured background inspired by SpongeBob's "A Few Moments Later" screen
        // Deep orange/red background with subtle texture
        const bgColor = '#8d2c14'; // Deep reddish color
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, separatorCanvas.width, separatorCanvas.height);
        
        // Add textured pattern noise
        const addNoise = () => {
            const imageData = ctx.getImageData(0, 0, separatorCanvas.width, separatorCanvas.height);
            const data = imageData.data;
            
            for (let i = 0; i < data.length; i += 4) {
                // Random variance for texture
                const noise = Math.random() * 20 - 10;
                
                // Apply noise to R, G, B channels
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise * 0.8));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise * 0.5));
            }
            
            ctx.putImageData(imageData, 0, 0);
        };
        
        addNoise();
        
        // Draw tribal-like patterns across the separator
        ctx.strokeStyle = '#f9cb9c'; // Light orange for contrast
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        // Draw abstract patterns
        for (let x = 0; x < separatorCanvas.width; x += 50) {
            // Zigzag pattern
            ctx.beginPath();
            const startX = x + Math.random() * 30;
            ctx.moveTo(startX, 5);
            
            for (let i = 0; i < 3; i++) {
                const nextX = startX + 15 + Math.random() * 10;
                const nextY = i % 2 === 0 ? 20 : 5;
                ctx.lineTo(nextX, nextY);
            }
            
            ctx.stroke();
            
            // Add small circles/dots (like flowers or tribal markings)
            const circleX = x + 25 + Math.random() * 20;
            const circleY = 7 + Math.random() * 11;
            const radius = 1 + Math.random() * 2;
            
            ctx.beginPath();
            ctx.arc(circleX, circleY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#f9cb9c';
            ctx.fill();
        }
        
        // Add "A Few Moments Later" text with shadow for better visibility
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillText('A Few Moments Later...', separatorCanvas.width / 2 + 1, separatorCanvas.height / 2 + 1);
        
        // Actual text
        ctx.fillStyle = '#ffde9e'; // Light yellow/orange color
        ctx.fillText('A Few Moments Later...', separatorCanvas.width / 2, separatorCanvas.height / 2);
        
        // Create an img element with the canvas content
        const separatorImg = new Image();
        separatorImg.src = separatorCanvas.toDataURL('image/png');
        separatorImg.classList.add('separator-image');
        separatorImg.style.width = '100%';
        separatorImg.addEventListener('click', () => selectImage(separatorImg));
        
        return separatorImg;
    }

    // Function to update separators based on checkbox state
    function updateSeparators() {
        const useSeparators = useSeparatorCheckbox.checked;
        const images = Array.from(imageStack.querySelectorAll('img:not(.separator-image)'));
        
        // First remove existing separators
        separatorImages.forEach(sep => {
            if (sep.parentNode === imageStack) {
                imageStack.removeChild(sep);
            }
        });
        separatorImages = [];
        
        // Skip if we don't need separators or have less than 2 images
        if (!useSeparators || images.length < 2) {
            return;
        }
        
        // Get current width for separators
        const currentWidth = firstImageWidth || parseInt(presetWidthInput.value, 10) || defaultWidth;
        
        // Add separators between images
        for (let i = 0; i < images.length - 1; i++) {
            const separator = createLiveSeparator(currentWidth);
            separatorImages.push(separator);
            
            // Insert after the current image
            if (images[i].nextSibling) {
                imageStack.insertBefore(separator, images[i].nextSibling);
            } else {
                imageStack.appendChild(separator);
            }
        }
        
        scrollToBottom();
    }

    // Add event listener to the checkbox
    useSeparatorCheckbox.addEventListener('change', updateSeparators);

    dropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.stopPropagation();
        event.dataTransfer.dropEffect = 'copy';
    });

    dropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const files = Array.from(event.dataTransfer.files);
        files.forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.src = e.target.result;
                img.onload = () => {
                    // Set initial width based on preset or use a sensible default
                    if (firstImageWidth === null) {
                        firstImageWidth = parseInt(presetWidthInput.value, 10);
                        
                        // If the image is very wide or very narrow, adjust width to something reasonable
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        if (aspectRatio > 3) { // Very wide image
                            firstImageWidth = Math.min(4096, Math.max(firstImageWidth, 800));
                        } else if (aspectRatio < 0.3) { // Very tall/narrow image
                            firstImageWidth = Math.min(firstImageWidth, 600);
                        }
                        
                        imageStack.style.width = `${firstImageWidth}px`;
                        presetWidthInput.value = firstImageWidth;
                    }
                    
                    // Make the image responsive within its container
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.maxWidth = '100%';
                    
                    img.addEventListener('click', () => selectImage(img));
                    imageStack.appendChild(img);
                    updateImageStackVisibility();
                    updateImageStackBorder();
                    updateSeparators(); // Update separators after adding a new image
                    scrollToBottom();
                    updateExportButtonVisibility();
                };
            };
            reader.readAsDataURL(file);
        });
    });

    function updateImageStackVisibility() {
        imageStack.style.display = imageStack.children.length > 0 ? 'block' : 'none';
    }

    function updateImageStackBorder() {
        imageStack.style.border = imageStack.children.length > 0 ? '5px solid #888' : '5px solid transparent';
    }

    function scrollToBottom() {
        window.scrollTo(0, document.body.scrollHeight);
    }

    function selectImage(img) {
        if (selectedImage) {
            selectedImage.classList.remove('selected');
        }
        selectedImage = img;
        selectedImage.classList.add('selected');
    }

    document.addEventListener('keydown', (event) => {
        console.info("Key down: " + event.key);
        // Check if the active element is an input field
        if (event.target.tagName === 'INPUT') {
            return; // Don't handle Backspace if we're in an input field
        }

        if (event.key === 'Backspace' && selectedImage) {
            // Check if the selected image is a separator
            const isSeparator = selectedImage.classList.contains('separator-image');
            
            // Remove the image from the DOM
            imageStack.removeChild(selectedImage);
            
            // Update separator array if needed
            if (isSeparator) {
                separatorImages = separatorImages.filter(img => img !== selectedImage);
            }
            
            selectedImage = null;
            
            // Update separators if a regular image was removed
            if (!isSeparator) {
                updateSeparators();
            }
            
            updateImageStackVisibility();
            updateImageStackBorder();
            updateExportButtonVisibility();
        }
    });

    window.applyWidth = function() {
        let width = parseInt(presetWidthInput.value, 10);
        // Validate the width
        if (isNaN(width)) {
            alert("Please enter a valid number");
            presetWidthInput.value = defaultWidth;
            return;
        }

        const minWidth = 300; // Increased minimum for better visibility
        const maxWidth = 4096; // Increased maximum to support high-resolution images

        if (width < minWidth) {
            alert(`Width cannot be less than ${minWidth}px for better visibility`);
            presetWidthInput.value = minWidth;
            width = minWidth;
        } else if (width > maxWidth) {
            alert(`Width cannot exceed ${maxWidth}px for technical limitations`);
            presetWidthInput.value = maxWidth;
            width = maxWidth;
        }

        firstImageWidth = width;
        
        // Apply width with smooth transition
        imageStack.style.transition = 'width 0.3s ease-in-out';
        imageStack.style.width = `${firstImageWidth}px`;
        
        // Reset all images to be responsive within the container
        Array.from(imageStack.children).forEach(img => {
            img.style.width = '100%';
            img.style.maxWidth = '100%';
            img.style.height = img.classList.contains('separator-image') ? '25px' : 'auto';
        });
        
        updateImageStackVisibility();
        
        // Recreate separators with the new width
        updateSeparators();
        
        // Scroll back to where the user was viewing after width change
        // (helps maintain context when changing width)
        setTimeout(() => {
            // Remove transition after width change completes
            imageStack.style.transition = 'none';
        }, 300);
    };

    // Initial check in case the script loads after images were dynamically added (if applicable)
    updateImageStackVisibility();
    updateExportButtonVisibility();
});

function updateExportButtonVisibility() {
    const images = document.querySelectorAll('#image_stack img');
    const exportButton = document.getElementById('exportButton');
    if (images.length > 0) {
        exportButton.removeAttribute('disabled');
        exportButton.classList.remove('disabled');
    } else {
        exportButton.setAttribute('disabled', 'true');
        exportButton.classList.add('disabled');
    }
}

function exportImagesAsFile() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // Get all elements in image stack (includes both original images and separators)
    const allStackElements = document.querySelectorAll('#image_stack img');

    if (!allStackElements.length) {
        alert("No images to export.");
        return;
    }

    // Calculate dimensions based on the first image's natural width
    const firstImage = allStackElements[0];
    const baseWidth = firstImage.naturalWidth; // Use original width
    
    // Calculate total height and draw all elements
    let totalHeight = 0;
    
    // First calculate the total height
    allStackElements.forEach(img => {
        totalHeight += img.naturalHeight * (baseWidth / img.naturalWidth);
    });
    
    // Set canvas to full resolution dimensions
    canvas.width = baseWidth;
    canvas.height = totalHeight;
    
    // Set high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw all elements at full resolution
    let yOffset = 0;
    
    for (const img of allStackElements) {
        const scaledHeight = img.naturalHeight * (baseWidth / img.naturalWidth);
        ctx.drawImage(img, 0, yOffset, baseWidth, scaledHeight);
        yOffset += scaledHeight;
    }
    
    // Export with maximum quality
    canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'stacked-images.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 'image/png', 1.0); // Use maximum quality for PNG
}

// Ensure event listeners are correctly set up
document.getElementById('exportButton').addEventListener('click', exportImagesAsFile);


window.resetAll = function() {
    // Ask for confirmation
    const confirmed = window.confirm('Are you sure you want to reset? This will remove all images and reset the width.');
    if (!confirmed) return;

    // Clear all images
    const imageStack = document.getElementById('image_stack');
    while (imageStack.firstChild) {
        imageStack.removeChild(imageStack.firstChild);
    }

    // Reset separator images array
    window.separatorImages = [];

    // Reset width to default
    const defaultWidth = 500;
    const presetWidthInput = document.getElementById('presetWidth');
    presetWidthInput.value = defaultWidth;

    // Apply the default width
    imageStack.style.width = `${defaultWidth}px`;

    // Reset selection
    if (window.selectedImage) {
        window.selectedImage = null;
    }

    // Reset first image width
    window.firstImageWidth = null;

    // Update UI states
    updateImageStackVisibility();
    updateImageStackBorder();
    updateExportButtonVisibility();
};
