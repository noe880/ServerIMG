document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('mediaContainer');
    const params = new URLSearchParams(window.location.search);
    const tipo = params.get('tipo'); // Obtenemos ?tipo= de la URL si existe

    try {
        const res = await fetch(`/archivos${tipo ? `?tipo=${encodeURIComponent(tipo)}` : ''}`);
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }

        const archivos = await res.json();
        if (archivos && archivos.length > 0) {
            archivos.forEach(archivo => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('gallery-item-container');

                const link = document.createElement('a');
                link.href = `img.html?nombre=${encodeURIComponent(archivo.nombre)}`;

                const extension = archivo.nombre.split('.').pop().toLowerCase();
                if (['mp4', 'webm', 'ogg'].includes(extension)) {
                    const video = document.createElement('video');
                    video.src = archivo.url;
                    video.classList.add('gallery-item', 'gallery-video');
                    video.controls = false;
                    video.autoplay = false;
                    video.muted = true;
                    video.loop = false;

                    link.appendChild(video);
                } else {
                    const img = document.createElement('img');
                    img.src = archivo.url;
                    img.alt = archivo.nombre;
                    img.classList.add('gallery-item');

                    img.onerror = () => {
                        console.error(`Error al cargar la imagen: ${archivo.url}`);
                        wrapper.style.display = 'none';
                    };

                    link.appendChild(img);
                }

                wrapper.appendChild(link);
                container.appendChild(wrapper);
            });
        } else {
            console.warn('No se encontraron archivos para mostrar');
            container.innerHTML = '<p>No hay imágenes ni videos disponibles</p>';
        }
    } catch (error) {
        console.error('Error al cargar archivos:', error);
        container.innerHTML = `<p>Error al cargar los archivos: ${error.message}</p>`;
    }
});
