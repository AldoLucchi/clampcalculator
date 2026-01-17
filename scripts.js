let currentFile = null;
let convertedCSS = '';
let stats = {
    lines: 0,
    conversions: 0,
    originalSize: 0,
    startTime: 0
};

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
    
    if (tabId === 'upload') {
        document.getElementById('resultArea').style.display = 'none';
    }
}

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
        handleFileSelect({ target: { files: e.dataTransfer.files } });
    }
});

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    currentFile = file;
    document.getElementById('fileName').textContent = `📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
    
    if (file.name.includes('.css') || file.name.includes('.scss') || 
        file.name.includes('.sass') || file.name.includes('.less')) {
        previewFile();
    }
}

function previewFile() {
    if (!currentFile) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('cssText').value = e.target.result;
        showTab('paste');
    };
    reader.readAsText(currentFile);
}

function processUploadedFile() {
    if (!currentFile) {
        alert('⚠️ Primero selecciona un archivo');
        return;
    }
    
    processPastedCSS();
}

function processPastedCSS() {
    const cssText = document.getElementById('cssText').value.trim();
    if (!cssText) {
        alert('⚠️ No hay CSS para procesar');
        return;
    }
    
    stats.startTime = performance.now();
    stats.lines = cssText.split('\n').length;
    stats.originalSize = cssText.length;
    stats.conversions = 0;
    
    const baseRes = parseFloat(document.getElementById('pasteBaseRes').value || document.getElementById('baseRes').value);
    const baseFont = parseFloat(document.getElementById('pasteBaseFont').value || document.getElementById('baseFont').value);
    
    let processedCSS = cssText;
    
    processedCSS = processedCSS.replace(/(\d*\.?\d+)px/gi, function(match, value) {
        const x = parseFloat(value);
        if (x === 0) return match;
        
        stats.conversions++;
        return calcularTuFormula(x, baseRes, 'px', baseFont);
    });
    
    processedCSS = processedCSS.replace(/(\d*\.?\d+)rem/gi, function(match, value) {
        const x = parseFloat(value) * baseFont;
        if (x === 0) return match;
        
        stats.conversions++;
        return calcularTuFormula(x, baseRes, 'rem', baseFont);
    });
    
    processedCSS = processedCSS.replace(/(\d*\.?\d+)em/gi, function(match, value) {
        const x = parseFloat(value) * baseFont;
        if (x === 0) return match;
        
        stats.conversions++;
        return calcularTuFormula(x, baseRes, 'em', baseFont);
    });
    
    convertedCSS = processedCSS;
    
    const endTime = performance.now();
    const processingTime = ((endTime - stats.startTime) / 1000).toFixed(2);
    
    document.getElementById('outputCode').textContent = processedCSS;
    document.getElementById('resultArea').style.display = 'block';
    
    document.getElementById('statLines').textContent = stats.lines;
    document.getElementById('statConversions').textContent = stats.conversions;
    document.getElementById('statSavings').textContent = ((1 - (processedCSS.length / stats.originalSize)) * 100).toFixed(1) + '%';
    document.getElementById('statTime').textContent = processingTime + 's';
    
    document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth' });
}

function calcularTuFormula(x, y, unit, baseFont = 16) {
    const preMin = x - (x / 4);
    const min = preMin - (preMin / 3);
    const max = x + (x / 4);
    const vw = (x / y * 100).toFixed(7);
    
    if (unit === 'rem') {
        const remMin = (min / baseFont).toFixed(4);
        const remMax = (max / baseFont).toFixed(4);
        return `clamp(${remMin}rem, ${vw}vw, ${remMax}rem)`;
    } else if (unit === 'em') {
        const emMin = (min / baseFont).toFixed(4);
        const emMax = (max / baseFont).toFixed(4);
        return `clamp(${emMin}em, ${vw}vw, ${emMax}em)`;
    } else {
        return `clamp(${min.toFixed(3)}px, ${vw}vw, ${max.toFixed(3)}px)`;
    }
}

function processCSSConversion(css, baseRes, baseFont) {
    let result = css;
    
    result = result.replace(/(\d*\.?\d+)px/gi, (match, value) => {
        const x = parseFloat(value);
        if (x === 0) return match;
        
        stats.conversions++;
        const preMin = x - (x / 4);
        const min = preMin - (preMin / 3);
        const max = x + (x / 4);
        const vw = (x / baseRes * 100).toFixed(7);
        return `clamp(${min.toFixed(3)}px, ${vw}vw, ${max.toFixed(3)}px)`;
    });
    
    result = result.replace(/(\d*\.?\d+)rem/gi, (match, value) => {
        const x = parseFloat(value) * baseFont;
        if (x === 0) return match;
        
        stats.conversions++;
        const preMin = x - (x / 4);
        const min = preMin - (preMin / 3);
        const max = x + (x / 4);
        const vw = (x / baseRes * 100).toFixed(7);
        const remMin = (min / baseFont).toFixed(4);
        const remMax = (max / baseFont).toFixed(4);
        return `clamp(${remMin}rem, ${vw}vw, ${remMax}rem)`;
    });
    
    result = result.replace(/(\d*\.?\d+)em/gi, (match, value) => {
        const x = parseFloat(value) * baseFont;
        if (x === 0) return match;
        
        stats.conversions++;
        const preMin = x - (x / 4);
        const min = preMin - (preMin / 3);
        const max = x + (x / 4);
        const vw = (x / baseRes * 100).toFixed(7);
        const emMin = (min / baseFont).toFixed(4);
        const emMax = (max / baseFont).toFixed(4);
        return `clamp(${emMin}em, ${vw}vw, ${emMax}em)`;
    });
    
    return result;
}

function convertToClamp(value, unit, baseRes, baseFont) {
    const preMin = value - (value / 4);
    const min = preMin - (preMin / 3);
    const max = value + (value / 4);
    const vw = (value / baseRes * 100).toFixed(7);
    
    if (unit === 'rem') {
        const remMin = (min / baseFont).toFixed(4);
        const remMax = (max / baseFont).toFixed(4);
        return `clamp(${remMin}rem, ${vw}vw, ${remMax}rem)`;
    } else if (unit === 'em') {
        const emMin = (min / baseFont).toFixed(4);
        const emMax = (max / baseFont).toFixed(4);
        return `clamp(${emMin}em, ${vw}vw, ${emMax}em)`;
    } else {
        return `clamp(${min.toFixed(2)}px, ${vw}vw, ${max.toFixed(2)}px)`;
    }
}

function calculateSingle() {
    const value = parseFloat(document.getElementById('calcValue').value);
    const res = parseFloat(document.getElementById('calcRes').value);
    
    if (!value || !res) {
        alert('Ingresa valores válidos');
        return;
    }
    
    const preMin = value - (value / 4);
    const min = preMin - (preMin / 3);
    const max = value + (value / 4);
    const vw = (value / res * 100).toFixed(7);
    
    const result = `clamp(${min.toFixed(2)}px, ${vw}vw, ${max.toFixed(2)}px);`;
    
    document.getElementById('singleResult').textContent = result;
    document.getElementById('calcResult').style.display = 'block';
}

function copyAll() {
    if (!convertedCSS) {
        alert('No hay CSS para copiar');
        return;
    }
    
    navigator.clipboard.writeText(convertedCSS)
        .then(() => {
            const btn = event.target;
            const original = btn.innerHTML;
            btn.innerHTML = '✅ Copiado!';
            setTimeout(() => btn.innerHTML = original, 2000);
        })
        .catch(err => alert('Error al copiar: ' + err));
}

function downloadFile() {
    if (!convertedCSS) {
        alert('No hay CSS para descargar');
        return;
    }
    
    const blob = new Blob([convertedCSS], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const fileName = currentFile 
        ? `converted_${currentFile.name.replace(/\.[^/.]+$/, "")}.css`
        : 'css_converted_to_clamp.css';
    
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function previewConversion() {
    const cssText = document.getElementById('cssText').value.trim();
    if (!cssText) {
        if (currentFile) {
            previewFile();
        } else {
            alert('No hay CSS para previsualizar');
        }
        return;
    }
    
    const sample = cssText.split('\n').slice(0, 20).join('\n');
    const baseRes = parseFloat(document.getElementById('baseRes').value);
    const baseFont = parseFloat(document.getElementById('baseFont').value);
    
    let preview = processCSSConversion(sample, baseRes, baseFont);
    
    alert(`📋 Vista Previa (primeras 20 líneas):\n\n${preview}`);
}

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (document.getElementById('paste').classList.contains('active')) {
            processPastedCSS();
        } else if (document.getElementById('calculator').classList.contains('active')) {
            calculateSingle();
        }
    }
});