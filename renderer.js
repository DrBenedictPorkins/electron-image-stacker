document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop_zone');
    const imageStack = document.getElementById('image_stack');
    const widthSlider = document.getElementById('widthSlider');
    const widthDisplay = document.getElementById('widthDisplay');
    const useSeparatorCheckbox = document.getElementById('useSeparator');
    let firstImageWidth = null;
    let selectedImage = null;
    let separatorImages = [];  // Track separator images
    let resizeTimeout = null;  // For debouncing slider updates

    const defaultWidth = 500;
    widthSlider.value = defaultWidth;
    widthDisplay.textContent = defaultWidth;

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
        
        // Calculate center area for text that we'll keep clear
        const textWidth = separatorCanvas.width * 0.6; // 60% of width for text
        const textHeight = 20; // Height of text area
        const textLeft = (separatorCanvas.width - textWidth) / 2;
        const textRight = textLeft + textWidth;
        const textTop = (separatorCanvas.height - textHeight) / 2;
        const textBottom = textTop + textHeight;
        
        // Draw tribal-like patterns across the separator (avoiding text area)
        ctx.strokeStyle = '#f9cb9c'; // Light orange for contrast
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        
        // Draw abstract patterns
        for (let x = 0; x < separatorCanvas.width; x += 50) {
            // Zigzag pattern - avoid the center text area
            const startX = x + Math.random() * 30;
            
            // Only draw patterns if they're not in the text area
            const isInTextAreaX = (startX > textLeft - 30 && startX < textRight + 30);
            
            if (!isInTextAreaX) {
                ctx.beginPath();
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
        }
        
        // Create background for text
        const textBgGradient = ctx.createLinearGradient(
            textLeft, separatorCanvas.height/2, 
            textRight, separatorCanvas.height/2
        );
        textBgGradient.addColorStop(0, 'rgba(141, 44, 20, 0.8)');  // Same as background but with alpha
        textBgGradient.addColorStop(0.5, 'rgba(141, 44, 20, 0.9)'); // Darker in center
        textBgGradient.addColorStop(1, 'rgba(141, 44, 20, 0.8)');
        
        ctx.fillStyle = textBgGradient;
        ctx.fillRect(textLeft, textTop - 3, textWidth, textHeight + 6);
        
        // Add "A Few Moments Later" text with shadow for better visibility
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
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
    // forceRecreate: if true, will recreate all separators even if they already exist
    function updateSeparators(forceRecreate = false) {
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
        
        // Get current width for separators - always use the exact current width
        const currentWidth = firstImageWidth || parseInt(widthSlider.value, 10) || defaultWidth;
        
        // Add separators between images
        for (let i = 0; i < images.length - 1; i++) {
            // Always generate a fresh separator at the current width
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
                    // Set initial width based on slider value
                    if (firstImageWidth === null) {
                        // Always use exactly what's in the slider to avoid jerky motion later
                        firstImageWidth = parseInt(widthSlider.value, 10);
                        imageStack.style.width = `${firstImageWidth}px`;
                    }
                    
                    // Make the image responsive within its container
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    img.style.maxWidth = '100%';
                    
                    img.addEventListener('click', () => selectImage(img));
                    imageStack.appendChild(img);
                    
                    // Display the image stack container if this is the first image
                    if (imageStack.style.display === 'none') {
                        imageStack.style.display = 'flex';
                        imageStack.style.border = '5px solid #888';
                    }
                    
                    updateSeparators(); // Update separators after adding a new image
                    scrollToBottom();
                    updateExportButtonVisibility();
                };
            };
            reader.readAsDataURL(file);
        });
    });

    // These functions are now handled inline for better control of the initial state

    function scrollToBottom() {
        // More reliable way to scroll to the bottom
        window.scrollTo({
            top: document.body.scrollHeight + 1000, // Add extra to ensure we get to the bottom
            behavior: 'smooth' // Smooth scrolling
        });
        
        // As a backup, try another method after a small delay
        setTimeout(() => {
            const imageStack = document.getElementById('image_stack');
            if (imageStack) {
                const lastImage = imageStack.lastElementChild;
                if (lastImage) {
                    lastImage.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            }
        }, 100);
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
            
            // Hide the image stack if all images are removed
            if (imageStack.children.length === 0) {
                imageStack.style.display = 'none';
                imageStack.style.border = '5px solid transparent';
            }
            
            updateExportButtonVisibility();
        }
    });

    // Function to handle width changes from the slider
    function updateWidth(width, instant = false) {
        // Ensure width is within boundaries (should be handled by slider min/max, but just in case)
        const minWidth = 300;
        const maxWidth = 4096;
        width = Math.min(Math.max(width, minWidth), maxWidth);
        
        // Update displayed width value
        widthDisplay.textContent = width;
        
        // Set the first image width if needed
        firstImageWidth = width;
        
        // Apply width with smooth transition (unless instant is requested)
        if (!instant) {
            imageStack.style.transition = 'width 0.2s ease-out';
        } else {
            imageStack.style.transition = 'none';
        }
        
        imageStack.style.width = `${width}px`;
        
        // Reset all images to be responsive within the container
        Array.from(imageStack.children).forEach(img => {
            img.style.width = '100%';
            img.style.maxWidth = '100%';
            img.style.height = img.classList.contains('separator-image') ? '25px' : 'auto';
        });
        
        // Force recreation of the separator images with the new width
        updateSeparators(true); // true flag to force recreation
        
        // Remove transition after width change completes
        if (!instant) {
            setTimeout(() => {
                imageStack.style.transition = 'none';
            }, 200);
        }
    }
    
    // Add event listener for the slider with debouncing for smoother experience
    widthSlider.addEventListener('input', () => {
        // Update display immediately for responsiveness
        widthDisplay.textContent = widthSlider.value;
        
        // Debounce the actual resizing for better performance
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        resizeTimeout = setTimeout(() => {
            updateWidth(parseInt(widthSlider.value, 10));
            resizeTimeout = null;
        }, 10); // Small delay for smoother performance
    });
    
    // For external access (needed for resetAll function)
    window.updateWidth = updateWidth;

    // Set initial state - hide the image stack until images are added
    imageStack.style.display = 'none';
    imageStack.style.border = '5px solid transparent';
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
    const widthSlider = document.getElementById('widthSlider');

    if (!allStackElements.length) {
        alert("No images to export.");
        return;
    }

    // Get the specified width from the slider (the width the user is seeing in the UI)
    const specifiedWidth = parseInt(widthSlider.value, 10);
    
    // Calculate total height and draw all elements based on the specified width
    let totalHeight = 0;
    
    // First calculate the total height based on the specified width
    allStackElements.forEach(img => {
        // For separator images, use their fixed height
        if (img.classList.contains('separator-image')) {
            totalHeight += 25; // Fixed height for separators
        } else {
            // For regular images, calculate height based on aspect ratio and specified width
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            totalHeight += Math.round(specifiedWidth / aspectRatio);
        }
    });
    
    // Set canvas dimensions - use the specified width from the slider
    canvas.width = specifiedWidth;
    canvas.height = totalHeight;
    
    // Set high quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw all elements at the specified width
    let yOffset = 0;
    
    for (const img of allStackElements) {
        if (img.classList.contains('separator-image')) {
            // Draw separator at specified width with fixed height
            ctx.drawImage(img, 0, yOffset, specifiedWidth, 25);
            yOffset += 25;
        } else {
            // Calculate height based on aspect ratio and specified width
            const aspectRatio = img.naturalWidth / img.naturalHeight;
            const scaledHeight = Math.round(specifiedWidth / aspectRatio);
            
            // Draw image at specified width maintaining aspect ratio
            ctx.drawImage(img, 0, yOffset, specifiedWidth, scaledHeight);
            yOffset += scaledHeight;
        }
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
    const widthSlider = document.getElementById('widthSlider');
    widthSlider.value = defaultWidth;
    
    // Reset first image width to null (as if app just started)
    window.firstImageWidth = null;
    
    // Update width display
    const widthDisplay = document.getElementById('widthDisplay');
    widthDisplay.textContent = defaultWidth;
    
    // Reset image stack styles to initial state
    imageStack.style.width = ''; // Remove fixed width
    imageStack.style.display = 'none'; // Hide the container completely
    imageStack.style.border = '5px solid transparent'; // Reset border to be invisible
    
    // Reset selection
    if (window.selectedImage) {
        window.selectedImage = null;
    }

    // Update UI states (mostly for the export button)
    updateExportButtonVisibility();
};
