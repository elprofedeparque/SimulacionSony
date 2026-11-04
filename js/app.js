document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gl-canvas');
  const imageInput = document.getElementById('image-input');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const downloadBtn = document.getElementById('download-btn');
  const renderer = new LUTRenderer(canvas);

  let currentImage = null;
  let currentLUTImage = new Image();

  // Cargar LUT por defecto
  currentLUTImage.src = 'assets/luts/portra400.png';

  // 1. Subir imagen del usuario
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      currentImage = new Image();
      currentImage.onload = () => {
        uploadPlaceholder.style.display = 'none';
        downloadBtn.disabled = false;
        applyFilter();
      };
      currentImage.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // 2. Selección de Preset en la galería inferior
  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', function() {
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      this.classList.add('active');

      const lutName = this.getAttribute('data-lut');
      currentLUTImage = new Image();
      currentLUTImage.onload = applyFilter;
      currentLUTImage.src = `assets/luts/${lutName}.png`;
    });
  });

  function applyFilter() {
    if (currentImage && currentLUTImage.complete) {
      renderer.render(currentImage, currentLUTImage);
    }
  }

  // 3. Descargar imagen final
  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'filmsim-photo.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  });
});
