from PIL import Image
import requests
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch

# Cargar modelo y procesador
try:
    processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base").to("cpu")
except Exception as e:
    print(f"Error cargando modelo o procesador: {e}")
    exit()

# Descargar imagen
try:
    img_url = "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/cats.png"
    raw_image = Image.open(requests.get(img_url, stream=True).raw).convert("RGB")
except Exception as e:
    print(f"Error al descargar o abrir la imagen: {e}")
    exit()

# Generar descripción
try:
    inputs = processor(raw_image, return_tensors="pt").to("cpu")
    out = model.generate(**inputs)
    caption = processor.decode(out[0], skip_special_tokens=True)
    print(caption)
except Exception as e:
    print(f"Error al generar el pie de foto: {e}")
