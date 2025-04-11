from PIL import Image
import requests
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch  # Añadido import de torch

# Intenta manejar errores al descargar y abrir la imagen
try:
    # Descargar una imagen de ejemplo
    img_url = "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/cats.png"
    raw_image = Image.open(requests.get(img_url, stream=True).raw).convert("RGB")
except Exception as e:
    print(f"Error al descargar o abrir la imagen: {e}")
    raw_image = None

# Verifica si la imagen se cargó correctamente antes de continuar
if raw_image:
    try:
        processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base", torch_dtype=torch.float32).to("cpu")  # Corregido de float30 a float16

        # Generar un pie de foto
        inputs = processor(raw_image, return_tensors="pt").to("cpu")
        out = model.generate(**inputs)
        print(processor.decode(out[0], skip_special_tokens=True))
    except Exception as e:
        print(f"Error al procesar la imagen: {e}")
else:
    print("La imagen no se cargó correctamente.")
