document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('gl-canvas');
  const imageInput = document.getElementById('image-input');
  const uploadPlaceholder = document.getElementById('upload-placeholder');
  const downloadBtn = document.getElementById('download-btn');
  const renderer = new CubeLUTRenderer(canvas);

  // Cargar LUT inicial por defecto
  await renderer.loadCubeLUT('assets/luts/portra400.cube');

  // 1. Subir imagen
  imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        uploadPlaceholder.style.display = 'none';
        downloadBtn.disabled = false;
        renderer.setImage(img);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // 2. Cambio de LUT desde los botones
  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', async function() {
      document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
      this.classList.add('active');

      const lutName = this.getAttribute('data-lut');
      await renderer.loadCubeLUT(`assets/luts/${lutName}.cube`);
    });
  });

  // 3. Descargar resultado
  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'filmsim-photo.jpg';
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  });
});
