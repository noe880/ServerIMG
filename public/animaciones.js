document.addEventListener('DOMContentLoaded', function() {
    uploadForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (fileInput.files.length > 0) {
        // Simular carga
        const uploadBtn = document.getElementById('uploadBtn');
        const originalText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo...';
        uploadBtn.disabled = true;
        
        // Simular retardo de red
        setTimeout(() => {
          uploadBtn.innerHTML = '<i class="fas fa-check"></i> ¡Subido!';
          
          // Restaurar después de 2 segundos
          setTimeout(() => {
            uploadBtn.innerHTML = originalText;
            uploadBtn.disabled = false;
          }, 2000);
        }, 1500);
      }
    });
  });