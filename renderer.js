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
    // dontScroll: if true, will not automatically scroll after updating separators
    function updateSeparators(forceRecreate = false, dontScroll = false) {
        console.log("---- SEPARATOR UPDATE TRIGGERED ----");
        
        // Save starting height for animation
        const startingHeight = calculateCurrentHeight();
        console.log(`Starting height: ${startingHeight}px`);
        previousHeight = startingHeight;
        
        // Get and clear all existing information
        const useSeparators = useSeparatorCheckbox.checked;
        const images = Array.from(imageStack.querySelectorAll('img:not(.separator-image)'));
        
        console.log(`Separator checkbox is: ${useSeparators ? 'CHECKED' : 'UNCHECKED'}`);
        console.log(`Found ${images.length} regular images`);
        
        // Remove ALL existing separators completely (important!)
        const existingSeparators = imageStack.querySelectorAll('.separator-image');
        console.log(`Removing ${existingSeparators.length} existing separators`);
        
        existingSeparators.forEach(sep => {
            imageStack.removeChild(sep);
        });
        
        // Reset the separators array completely
        separatorImages = [];
        
        // Only add new separators if checkbox is checked AND we have at least 2 images
        if (useSeparators && images.length >= 2) {
            console.log(`Adding ${images.length - 1} new separators`);
            
            // Get current width for separators
            const currentWidth = firstImageWidth || parseInt(widthSlider.value, 10) || defaultWidth;
            
            // Reorder images to make sure we have them in DOM order
            images.sort((a, b) => {
                const allNodes = Array.from(imageStack.children);
                return allNodes.indexOf(a) - allNodes.indexOf(b);
            });
            
            // Add separators between images
            for (let i = 0; i < images.length - 1; i++) {
                // Create a fresh separator
                const separator = createLiveSeparator(currentWidth);
                separatorImages.push(separator);
                
                // Insert after the current image
                if (images[i].nextSibling) {
                    imageStack.insertBefore(separator, images[i].nextSibling);
                } else {
                    imageStack.appendChild(separator);
                }
            }
        } else {
            console.log("Not adding any separators");
        }
        
        // Scroll down if needed
        if (!dontScroll) {
            scrollToBottom();
        }
        
        // Calculate final height after all DOM changes are finished
        requestAnimationFrame(() => {
            const finalHeight = calculateCurrentHeight();
            console.log(`Final height after changes: ${finalHeight}px`);
            
            // Display with the proper animation
            displayToast(`Height: ${finalHeight}px`);
        });
    }
    
    // Helper function to calculate current height directly
    function calculateCurrentHeight() {
        const images = Array.from(imageStack.querySelectorAll('img:not(.separator-image)'));
        const separators = Array.from(imageStack.querySelectorAll('.separator-image'));
        const specifiedWidth = parseInt(widthSlider.value, 10);
        
        console.log(`calculateCurrentHeight: Using width ${specifiedWidth}px for calculations`);
        
        let height = 0;
        let imageHeights = [];
        
        // Calculate regular image heights
        images.forEach((img, index) => {
            if (img.naturalWidth && img.naturalHeight) {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                const imgHeight = Math.round(specifiedWidth / aspectRatio);
                imageHeights.push({index, type: 'image', originalSize: `${img.naturalWidth}x${img.naturalHeight}`, calculatedHeight: imgHeight});
                height += imgHeight;
            } else {
                const imgHeight = img.offsetHeight || 100;
                imageHeights.push({index, type: 'image', note: 'dimensions not available', calculatedHeight: imgHeight});
                height += imgHeight;
            }
        });
        
        // Add separator heights (fixed 25px each)
        const separatorHeight = separators.length * 25;
        height += separatorHeight;
        
        if (separators.length > 0) {
            imageHeights.push({type: 'separators', count: separators.length, totalHeight: separatorHeight});
        }
        
        console.log('Height calculation details:', imageHeights);
        console.log(`Total calculated height: ${height}px with width ${specifiedWidth}px`);
        
        return height;
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
                    
                    // Create a new pre-sized image that will display correctly immediately
                    const aspectRatio = img.naturalWidth / img.naturalHeight;
                    const targetWidth = firstImageWidth;
                    const targetHeight = Math.round(targetWidth / aspectRatio);
                    
                    // Create a canvas to resize the image
                    const canvas = document.createElement('canvas');
                    canvas.width = targetWidth;
                    canvas.height = targetHeight;
                    const ctx = canvas.getContext('2d');
                    
                    // Use high quality scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Draw the image at the target size
                    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                    
                    // Create a new image with the correctly sized data
                    const resizedImg = new Image();
                    
                    // Setup click handler and styles before setting src to avoid flash of wrong size
                    resizedImg.style.width = '100%';
                    resizedImg.style.height = 'auto'; 
                    resizedImg.style.maxWidth = '100%';
                    resizedImg.addEventListener('click', () => selectImage(resizedImg));
                    
                    // Set the source to the resized image data
                    resizedImg.src = canvas.toDataURL('image/png');
                    
                    // Add to DOM
                    imageStack.appendChild(resizedImg);
                    
                    // Calculate height directly after image is added
                    requestAnimationFrame(() => {
                        const finalHeight = calculateCurrentHeight();
                        console.log(`New image added, height: ${finalHeight}px`);
                        displayToast(`Height: ${finalHeight}px`);
                    });
                    
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
        // Delay the scroll slightly to ensure DOM updates are complete
        setTimeout(() => {
            // Scroll to the bottom with smooth animation
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
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
        
        console.log(`Width changing to: ${width}px`);
        
        // Save current scroll position before changing width
        const scrollPos = window.scrollY;
        
        // First get the current height for animation purposes
        const startingHeight = calculateCurrentHeight();
        previousHeight = startingHeight; // Save for animation
        console.log(`Width change - starting height: ${startingHeight}px`);
        
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
        // Use the dontScroll parameter to prevent scrolling
        updateSeparators(true, true); // true for force recreation, true for dontScroll
        
        // Restore original scroll position
        window.scrollTo({
            top: scrollPos,
            behavior: 'auto' // Use 'auto' to avoid smooth scrolling conflicts
        });
        
        // Remove transition after width change completes
        if (!instant) {
            setTimeout(() => {
                imageStack.style.transition = 'none';
            }, 200);
        }
        
        // Show updated height after all DOM changes complete
        // Use requestAnimationFrame for better timing and more accurate results
        requestAnimationFrame(() => {
            // Recalculate with the new width
            const finalHeight = calculateCurrentHeight();
            console.log(`Width change to ${width}px - final height: ${finalHeight}px`);
            
            // Animate the height change
            if (finalHeight !== startingHeight) {
                animateHeightChange(startingHeight, finalHeight, document.getElementById('size-toast'));
            }
        });
    }
    
    // Add event listener for the slider with debouncing for smoother experience
    widthSlider.addEventListener('input', (event) => {
        // Update display immediately for responsiveness
        widthDisplay.textContent = widthSlider.value;
        
        // Prevent scrolling while dragging slider
        event.preventDefault();
        
        // Debounce the actual resizing for better performance
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        // Update height display while dragging, with minimal performance impact
        if (!animationInProgress) {
            // Show a temporary preview of what the height will be
            const previewHeight = calculateHeightForWidth(parseInt(widthSlider.value, 10));
            const sizeToast = document.getElementById('size-toast');
            sizeToast.textContent = `Height: ~${previewHeight}px`;
            sizeToast.style.opacity = '0.7'; // Indicate this is a preview
        }
        
        // Debounce the actual resizing and final height calculation
        resizeTimeout = setTimeout(() => {
            // Do the actual resize operation
            updateWidth(parseInt(widthSlider.value, 10));
            
            // Reset opacity after we get the real value
            document.getElementById('size-toast').style.opacity = '1';
            
            resizeTimeout = null;
        }, 50); // Small delay for smoother performance
    });
    
    // Helper function to quickly calculate height for preview without DOM updates
    function calculateHeightForWidth(width) {
        const images = Array.from(imageStack.querySelectorAll('img:not(.separator-image)'));
        const separators = Array.from(imageStack.querySelectorAll('.separator-image'));
        let height = 0;
        
        // Calculate image heights based on aspect ratios
        images.forEach(img => {
            if (img.naturalWidth && img.naturalHeight) {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                height += Math.round(width / aspectRatio);
            } else {
                height += img.offsetHeight || 100;
            }
        });
        
        // Add separator heights
        height += separators.length * 25;
        
        return height;
    }
    
    // Prevent scrolling when using the slider
    widthSlider.addEventListener('mousedown', (event) => {
        // Stop propagation to prevent other handlers from triggering
        event.stopPropagation();
        
        // Temporarily disable page scrolling while slider is being dragged
        document.body.style.overflow = 'hidden';
        
        // Save current scroll position
        const scrollPos = window.scrollY;
        
        // Add mouseup listener to restore scrolling when done
        const enableScrolling = () => {
            // Restore body overflow
            document.body.style.overflow = '';
            
            // Restore original scroll position after a short delay
            setTimeout(() => {
                window.scrollTo({
                    top: scrollPos,
                    behavior: 'auto'
                });
            }, 50);
            
            // Remove listeners
            document.removeEventListener('mouseup', enableScrolling);
            document.removeEventListener('mouseleave', enableScrolling);
        };
        
        document.addEventListener('mouseup', enableScrolling);
        document.addEventListener('mouseleave', enableScrolling);
    });
    
    // Additional handlers to prevent scroll issues with the slider
    widthSlider.addEventListener('wheel', (event) => {
        // Prevent wheel scrolling when over slider
        event.preventDefault();
    }, { passive: false });
    
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

// Calculate and display the total height of stacked images - completely revised
function showTotalHeight() {
    const height = calculateCurrentHeight();
    
    // Now display the calculated height
    console.log(`showTotalHeight calculated: ${height}px`);
    
    // If no height, show zero
    if (height === 0) {
        displayToast('Height: 0px');
    } else {
        displayToast(`Height: ${height}px`);
    }
}

// Previous height value to track changes
let previousHeight = 0;

// Flag to prevent animation conflicts when toggling separators
let animationInProgress = false;

// Helper function to display toast with animated text
function displayToast(text) {
    const sizeToast = document.getElementById('size-toast');
    const currentHeightMatch = text.match(/Height: (\d+)px/);
    
    if (currentHeightMatch) {
        const currentHeight = parseInt(currentHeightMatch[1], 10);
        
        // If height has changed, add animation
        if (currentHeight !== previousHeight) {
            // Store old height for animation
            const oldHeight = previousHeight;
            previousHeight = currentHeight;
            
            // Animate any height change except initialization from zero
            if (oldHeight > 0 || currentHeight > 0) {
                // Create animation for any change, not just increases
                animateHeightChange(oldHeight, currentHeight, sizeToast);
            } else {
                // For initial zero state just set the text
                sizeToast.textContent = text;
            }
        }
    } else {
        // If not a height value, just set the text directly
        sizeToast.textContent = text;
    }
}

// Animate the height change with counting effect
function animateHeightChange(from, to, element) {
    // Set flag to prevent overlapping animations
    if (animationInProgress) {
        // If already animating, just update the text immediately
        element.textContent = `Height: ${to}px`;
        return;
    }
    
    animationInProgress = true;
    
    console.log(`Animating from ${from}px to ${to}px`);
    
    // Add animation class for visual effect
    element.classList.add('animating');
    
    // Add decreasing class if height is going down (e.g., removing images or separators)
    if (to < from) {
        element.classList.add('decreasing');
    } else {
        element.classList.remove('decreasing');
    }
    
    // Remove animation classes after animation completes
    setTimeout(() => {
        element.classList.remove('animating');
        element.classList.remove('decreasing');
        animationInProgress = false;
    }, 1000);
    
    // Calculate animation duration based on the difference
    const diff = Math.abs(to - from); // Use absolute difference
    const duration = Math.min(1000, Math.max(500, diff * 5)); // between 500ms and 1000ms
    const startTime = performance.now();
    
    // Animation function
    function animate(currentTime) {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        
        // Easing function for smooth counting
        const easing = t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1; // cubic easing
        const easedProgress = easing(progress);
        
        // Calculate current value
        const currentValue = Math.floor(from + diff * easedProgress);
        
        // Update element text
        element.textContent = `Height: ${currentValue}px`;
        
        // Continue animation if not complete
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    // Start animation
    requestAnimationFrame(animate);
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
    
    console.log("EXPORT: Using width value for export:", specifiedWidth);
    
    // Calculate total height and draw all elements based on the specified width
    let totalHeight = 0;
    
    // First calculate the total height based on the specified width
    // Create an array to track images and their heights for when we draw them
    const imagesToDraw = [];
    
    // Pre-load all images to ensure we have correct dimensions
    const loadPromises = Array.from(allStackElements).map(img => {
        return new Promise(resolve => {
            if (img.complete && img.naturalWidth > 0) {
                // Image already loaded
                if (img.classList.contains('separator-image')) {
                    totalHeight += 25; // Fixed height for separators
                    imagesToDraw.push({ img, height: 25, isSeparator: true });
                } else {
                    // For regular images, calculate height based on aspect ratio
                    let aspectRatio = img.naturalWidth / img.naturalHeight;
                    // Safeguard against invalid aspect ratios
                    if (!aspectRatio || isNaN(aspectRatio) || !isFinite(aspectRatio)) {
                        aspectRatio = 1; // Fallback to square if we can't determine ratio
                    }
                    const height = Math.round(specifiedWidth / aspectRatio);
                    totalHeight += height;
                    imagesToDraw.push({ img, height, isSeparator: false });
                }
                resolve();
            } else {
                // Create a new image to ensure it's fully loaded
                const imgToLoad = new Image();
                imgToLoad.onload = () => {
                    if (img.classList.contains('separator-image')) {
                        totalHeight += 25; // Fixed height for separators
                        imagesToDraw.push({ img: imgToLoad, height: 25, isSeparator: true });
                    } else {
                        // For regular images, calculate height based on aspect ratio
                        let aspectRatio = imgToLoad.naturalWidth / imgToLoad.naturalHeight;
                        // Safeguard against invalid aspect ratios
                        if (!aspectRatio || isNaN(aspectRatio) || !isFinite(aspectRatio)) {
                            aspectRatio = 1; // Fallback to square if we can't determine ratio
                        }
                        const height = Math.round(specifiedWidth / aspectRatio);
                        totalHeight += height;
                        imagesToDraw.push({ img: imgToLoad, height, isSeparator: false });
                    }
                    resolve();
                };
                imgToLoad.onerror = () => {
                    // If image fails to load, add a placeholder
                    const height = 100; // Default height for broken images
                    totalHeight += height;
                    imagesToDraw.push({ img, height, isSeparator: false, broken: true });
                    resolve();
                };
                imgToLoad.src = img.src;
            }
        });
    });
    
    // Once all images are processed, create the canvas and draw
    Promise.all(loadPromises).then(() => {
        // Set canvas dimensions - use the specified width from the slider
        canvas.width = specifiedWidth;
        canvas.height = totalHeight;
        
        console.log(`EXPORT: Canvas dimensions set to ${canvas.width} x ${canvas.height}`);
        
        // Set high quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw all elements at the specified width
        let yOffset = 0;
        
        // Use the pre-calculated image data to draw each image
        for (const item of imagesToDraw) {
            if (item.broken) {
                // Draw a placeholder for broken images
                ctx.fillStyle = '#f0f0f0';
                ctx.fillRect(0, yOffset, specifiedWidth, item.height);
                ctx.fillStyle = '#888';
                ctx.font = '16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Image Error', specifiedWidth/2, yOffset + item.height/2);
                yOffset += item.height;
            } else if (item.isSeparator) {
                // Draw separator at specified width with fixed height
                ctx.drawImage(item.img, 0, yOffset, specifiedWidth, 25);
                yOffset += 25;
            } else {
                // Draw image at specified width maintaining aspect ratio
                ctx.drawImage(item.img, 0, yOffset, specifiedWidth, item.height);
                yOffset += item.height;
            }
        }
        
        // Export with maximum quality
        // Create a verification URL to confirm final image dimensions
        const imageDataURL = canvas.toDataURL('image/png', 1.0);
        
        // Verify dimensions by creating a temporary image
        const verifyImg = new Image();
        verifyImg.onload = () => {
            console.log(`EXPORT: Verification - Final image dimensions: ${verifyImg.width} x ${verifyImg.height}`);
        };
        verifyImg.src = imageDataURL;
        
        // Continue with export
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            // Verify blob size
            console.log(`EXPORT: Blob size: ${blob.size} bytes`);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'stacked-images.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png', 1.0); // Use maximum quality for PNG
    });
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
    
    // Update the size toast to show 0px with animation
    // Force previous height to something so animation will run
    const oldHeight = previousHeight;
    previousHeight = 0;
    
    // Directly show animation from old height to 0
    if (oldHeight > 0) {
        animateHeightChange(oldHeight, 0, document.getElementById('size-toast'));
    } else {
        displayToast('Height: 0px');
    }
};
