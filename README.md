# Electron Image Stacker

A lightweight desktop application for stacking multiple images vertically with customizable SpongeBob-style "A Few Moments Later" separators.

## Demo

![Electron Image Stacker Demo](./assets/demo.gif)

## Features

- 🖼️ Simple drag-and-drop interface for adding images
- 📏 Adjustable width slider (300px to 4096px)
- 🧽 Optional SpongeBob-style "A Few Moments Later" separators
- 💾 One-click export as high-quality PNG
- 🔄 Automatic image resizing to match chosen width while preserving aspect ratios
- 🗑️ Select and delete images with a click and Backspace key
- 🔁 "Reset All" button to start over
- ✨ Smooth transitions and responsive design
- 🖱️ Hover effects for better visual feedback

## System Requirements

- Electron v25.9.8 or later
- Node.js (recent version recommended)
- Compatible with Windows, macOS, and Linux

## Installation

```bash
# Clone the repository
git clone https://github.com/DrBenedictPorkins/electron-image-stacker.git

# Navigate to the project directory
cd electron-image-stacker

# Install dependencies
npm install

# Start the application
npm start
```

## Usage

1. Drag and drop images onto the application window
2. Adjust the output width using the slider control (300px to 4096px)
3. Toggle the "Separator image" checkbox to add SpongeBob-style dividers between images
4. Select any image by clicking on it (selected images have a highlight)
5. Remove selected images with the Backspace key
6. Use "Reset All" button to clear all images (with confirmation)
7. Click the "Export as Image" button to save your stacked creation as a PNG file

## Technical Details

- Images maintain their aspect ratios when resized
- High-quality image processing and export (maximum quality PNG)
- Dynamic generation of SpongeBob-style separators using Canvas API
- Security-focused implementation with Node integration disabled and context isolation
- Responsive design that adapts to different screen sizes
- Fixed-position interface elements for improved usability

## Troubleshooting

- The app only accepts image files (non-image files are silently ignored)
- Export button remains disabled until at least one image is added
- If the slider causes unwanted page scrolling, click directly on the slider handle first
- For any other issues, try restarting the application

## Project Structure

- `main.js`: Electron main process
- `preload.js`: Bridge between renderer and main processes
- `renderer.js`: UI and image processing logic
- `styles.css`: Application styling
- `index.html`: Main UI structure

## License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/licenses/MIT) file for details.

Copyright (c) 2025 DrBenedictPorkins