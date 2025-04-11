from PIL import Image
import requests
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch

try:
    processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
    model = BlipForConditionalGeneration.from_pretrained(
        "Salesforce/blip-image-captioning-base",
        torch_dtype=torch.float32
    ).to("cpu")
except Exception as e:
    print("Error cargando modelo:", e)
    exit()

try:
    img_url = "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/cats.png"
    response = requests.get(img_url, stream=True)
    response.raise_for_status()
    raw_image = Image.open(response.raw).convert("RGB")
except Exception as e:
    print("Error cargando imagen:", e)
    exit()

try:
    inputs = processor(raw_image, return_tensors="pt").to("cpu")
    out = model.generate(**inputs)
    caption = processor.decode(out[0], skip_special_tokens=True)
    print("Caption generada:", caption)
except Exception as e:
    print("Error al generar caption:", e)
