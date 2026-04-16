const fileInput = document.getElementById('image-picker');
const previewImage = document.getElementById('preview-image');
const imagePlaceholder = document.getElementById('image-placeholder');
const statusMessage = document.getElementById('status-message');
const clickTarget = document.getElementById('click-target');
const colorSample = document.getElementById('color-sample');
const hexValue = document.getElementById('hex-value');
const rgbValue = document.getElementById('rgb-value');
const hslValue = document.getElementById('hsl-value');
const canvas = document.getElementById('color-canvas');
const ctx = canvas.getContext('2d');
const clearButton = document.getElementById('clear-button');
const copyButtons = document.querySelectorAll('.button-copy');

let currentColor = { r: 0, g: 0, b: 0 };

function rgbToHex(r, g, b) {
    const toHex = value => value.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (delta !== 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
        switch (max) {
            case r:
                h = ((g - b) / delta + (g < b ? 6 : 0));
                break;
            case g:
                h = (b - r) / delta + 2;
                break;
            case b:
                h = (r - g) / delta + 4;
                break;
        }
        h = Math.round(h * 60);
    }

    return `hsl(${h}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

function updateColorDisplay(r, g, b) {
    const hex = rgbToHex(r, g, b);
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const hsl = rgbToHsl(r, g, b);

    hexValue.textContent = hex;
    rgbValue.textContent = rgb;
    hslValue.textContent = hsl;
    colorSample.querySelector('span').style.background = hex;
    colorSample.querySelector('span').style.boxShadow = `0 0 0 1px rgba(15, 23, 42, 0.08), inset 0 0 0 2px rgba(255,255,255,0.6)`;
    statusMessage.textContent = 'Clique na imagem para capturar a cor.';
    currentColor = { r, g, b };
}

function setFeedback(button, message = 'Copiado!') {
    const originalText = button.textContent;
    button.textContent = message;
    button.disabled = true;
    setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
    }, 1400);
}

function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    try {
        document.execCommand('copy');
    } catch (error) {
        console.warn('Fallback copy failed', error);
    }
    document.body.removeChild(textarea);
}

function copyText(value, button) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(() => setFeedback(button)).catch(() => {
            fallbackCopyText(value);
            setFeedback(button);
        });
    } else {
        fallbackCopyText(value);
        setFeedback(button);
    }
}

function drawImageOnCanvas(image) {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
}

function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        statusMessage.textContent = 'Selecione um arquivo de imagem válido.';
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        previewImage.src = reader.result;
        previewImage.hidden = false;
        previewImage.style.display = 'block';
        imagePlaceholder.hidden = true;
        statusMessage.textContent = 'Imagem carregada. Clique sobre ela para capturar uma cor.';
    };
    reader.readAsDataURL(file);
}

function resetTool() {
    previewImage.src = '';
    previewImage.hidden = true;
    previewImage.style.display = 'none';
    imagePlaceholder.hidden = false;
    clickTarget.classList.remove('active');
    clickTarget.style.left = '0';
    clickTarget.style.top = '0';
    hexValue.textContent = '#000000';
    rgbValue.textContent = 'rgb(0, 0, 0)';
    hslValue.textContent = 'hsl(0, 0%, 0%)';
    colorSample.querySelector('span').style.background = '#000000';
    statusMessage.textContent = 'Nenhuma imagem carregada.';
    canvas.width = 0;
    canvas.height = 0;
}

fileInput.addEventListener('change', (event) => {
    const [file] = event.target.files;
    handleImageUpload(file);
});

previewImage.addEventListener('load', () => {
    if (previewImage.naturalWidth && previewImage.naturalHeight) {
        drawImageOnCanvas(previewImage);
    }
});

document.getElementById('image-frame').addEventListener('click', (event) => {
    if (previewImage.hidden) {
        statusMessage.textContent = 'Envie uma imagem antes de clicar na área de seleção.';
        return;
    }

    const rect = previewImage.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) * (previewImage.naturalWidth / rect.width));
    const y = Math.floor((event.clientY - rect.top) * (previewImage.naturalHeight / rect.height));

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
        statusMessage.textContent = 'Clique dentro da imagem para capturar a cor.';
        return;
    }

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3] === 0) {
        statusMessage.textContent = 'O ponto clicado é transparente. Escolha outra área.';
        return;
    }

    updateColorDisplay(pixel[0], pixel[1], pixel[2]);
    clickTarget.style.left = `${event.clientX - rect.left}px`;
    clickTarget.style.top = `${event.clientY - rect.top}px`;
    clickTarget.classList.add('active');
});

copyButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const targetId = button.dataset.copyTarget;
        const value = document.getElementById(targetId).textContent;
        copyText(value, button);
    });
});

clearButton.addEventListener('click', resetTool);

window.addEventListener('DOMContentLoaded', () => {
    resetTool();
});
