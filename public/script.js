const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const uploadBtn = document.getElementById('uploadBtn');
const progressBar = document.getElementById('progressBar');
const progressContainer = document.getElementById('progressContainer');
const uploadingText = document.getElementById('uploadingText');

// Validación de archivos
fileInput.addEventListener('change', () => {
  const validTypes = [
    // Imágenes
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',

    // Videos
    'video/mp4', 'video/quicktime',

    // Documentos
    'application/pdf',                            // PDF
    'application/msword',                         // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
    'application/vnd.ms-excel',                   // XLS
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    'text/plain'                                  // TXT
  ];

  let errores = [];

  for (let file of fileInput.files) {
    if (!validTypes.includes(file.type)) {
      errores.push(`❌ "${file.name}" tiene un formato no permitido (${file.type})`);
    }
  }

  if (errores.length > 0) {
    alert("Errores en la selección de archivos:\n\n" + errores.join("\n"));
    fileInput.value = ''; // Limpiar selección
  }
});


// Subida con barra de progreso
uploadForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const formData = new FormData(this);

  uploadBtn.disabled = true;
  uploadBtn.textContent = 'Subiendo...';
  progressContainer.style.display = 'block';
  progressBar.style.width = '0%';
  uploadingText.textContent = 'Subiendo archivos...';

  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/upload');

  xhr.upload.addEventListener('progress', e => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      progressBar.style.width = `${percent.toFixed(2)}%`;
    }
  });

  xhr.onload = () => {
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Subir archivos';
    uploadingText.textContent = '';
  
    if (xhr.status === 200) {
      try {
        const data = JSON.parse(xhr.responseText);
        if (data.files) {
          iziToast.success({
            title: 'Éxito',
            message: 'Archivos subidos correctamente',
            position: 'topCenter'
          });
  
          uploadForm.reset();
          progressBar.style.width = '0%';
          progressContainer.style.display = 'none';
        } else {
          iziToast.error({
            title: 'Error',
            message: 'Error al subir los archivos',
            position: 'topCenter'
          });
        }
      } catch (err) {
        iziToast.error({
          title: 'Error',
          message: 'Error inesperado en la respuesta del servidor',
          position: 'topCenter'
        });
      }
    } else {
      iziToast.error({
        title: 'Error',
        message: 'Error al subir archivos (servidor)',
        position: 'topCenter'
      });
    }
  };
  
  xhr.onerror = () => {
    iziToast.error({
      title: 'Error',
      message: 'Fallo en la conexión con el servidor',
      position: 'topCenter'
    });
  
    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Subir archivos';
    progressContainer.style.display = 'none';
    uploadingText.textContent = '';
  };
  
  xhr.send(formData);
  

});

// Navegación por categorías
document.querySelectorAll('.category').forEach(item => {
  item.addEventListener('click', function () {
    const categoria = this.querySelector('.category-name').textContent.trim();
    window.location.href = `galeria.html?tipo=${encodeURIComponent(categoria)}`;
  });
});

document.addEventListener('DOMContentLoaded', async () => { 
  try {
    const res = await fetch('/archivos-peso');
    if (!res.ok) throw new Error('Error al obtener los archivos');

    const archivos = await res.json();

    if (archivos && archivos.length > 0) {
      const tipos = {
        documentos: ['pdf', 'doc', 'docx', 'txt'],
        imagenes: ['png', 'jpeg', 'jpg', 'gif'],
        videos: ['mp4', 'mov']
      };

      let sumaDocumentos = 0;
      let sumaImagenes = 0;
      let sumaVideos = 0;

      archivos.forEach(({ peso, identificador }) => {
        const ext = identificador.toLowerCase().split('.').pop();

        if (tipos.documentos.includes(ext)) {
          sumaDocumentos += parseInt(peso);
        } else if (tipos.imagenes.includes(ext)) {
          sumaImagenes += parseInt(peso);
        } else if (tipos.videos.includes(ext)) {
          sumaVideos += parseInt(peso);
        }
      });

      const sumaMedia = sumaImagenes + sumaVideos;
      const totalBytes = sumaDocumentos + sumaMedia;
      const totalGB = totalBytes / 1073741824;
      const totalMB = totalBytes / 1048576;
      const porcentaje = ((totalBytes / (10 * 1024 ** 4)) * 100).toFixed(2); // 10 TB

      const desc = document.querySelector('.storage-description');
      if (desc) {
        desc.textContent = totalGB >= 1
          ? `${totalGB.toFixed(2)} GB de 10 TB de almacenamiento`
          : `${totalMB.toFixed(2)} MB de 10 TB de almacenamiento`;
      }

      const porcentajeTexto = document.querySelector('.storage-percentage');
      if (porcentajeTexto) porcentajeTexto.textContent = `${porcentaje}% Used`;

      // Actualizar tarjetas
      const documentosCard = document.querySelector('.storage-card:nth-child(1) .card-value');
      if (documentosCard) {
        const docGB = sumaDocumentos / 1073741824;
        const docMB = sumaDocumentos / 1048576;
        documentosCard.textContent = docGB >= 1
          ? `${docGB.toFixed(2)} GB`
          : `${docMB.toFixed(2)} MB`;
      }

      const mediaCard = document.querySelector('.storage-card:nth-child(2) .card-value');
      if (mediaCard) {
        const mediaGB = sumaMedia / 1073741824;
        const mediaMB = sumaMedia / 1048576;
        mediaCard.textContent = mediaGB >= 1
          ? `${mediaGB.toFixed(2)} GB`
          : `${mediaMB.toFixed(2)} MB`;
      }

    }
  } catch (error) {
    console.error('Error al cargar archivos:', error);
  }
});

// Obtener el input de archivo y el label
const fileLabel = document.getElementById('fileLabel');
const uploadActions = document.getElementById('uploadActions');
const fileLabelText = document.querySelector('.file-label-text');
const fileLabelSubtext = document.querySelector('.file-label-subtext');

fileInput.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
        // Animación de confirmación
        fileLabel.classList.add('file-selected');
        
        // Mostrar información de los archivos seleccionados
        if (fileInput.files.length === 1) {
            fileLabelText.textContent = `1 archivo seleccionado`;
            fileLabelSubtext.textContent = fileInput.files[0].name;
        } else {
            fileLabelText.textContent = `${fileInput.files.length} archivos seleccionados`;
            fileLabelSubtext.textContent = `Tamaño total: ${formatFileSize(calculateTotalSize())}`;
        }
        
        // Mostrar acciones de subida
        uploadActions.style.display = 'block';
        
        setTimeout(() => {
            fileLabel.classList.remove('file-selected');
        }, 500);
    }
});

// Función para calcular tamaño total
function calculateTotalSize() {
    let totalSize = 0;
    for (let i = 0; i < fileInput.files.length; i++) {
        totalSize += fileInput.files[i].size;
    }
    return totalSize;
}

// Función para formatear el tamaño del archivo
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
