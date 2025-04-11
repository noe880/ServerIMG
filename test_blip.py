from PIL import Image
import requests
from transformers import BlipProcessor, BlipForConditionalGeneration
import torch  # Missing import

processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base", torch_dtype=torch.float16).to("cpu")  # Changed float30 to float16

# Descargar una imagen de ejemplo
img_url = "https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/cats.png"
raw_image = Image.open(requests.get(img_url, stream=True).raw).convert("RGB")

# Generar un pie de foto
inputs = processor(raw_image, return_tensors="pt").to("cpu")  # Added .to("cpu") to move inputs to CPU
out = model.generate(**inputs)
print(processor.decode(out[0], skip_special_tokens=True))