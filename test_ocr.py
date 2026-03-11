from PIL import Image
import pytesseract
import sys

def test_ocr():
    try:
        # Create a dummy image
        img = Image.new('RGB', (100, 30), color = (73, 109, 137))
        print("Tesseract Version:", pytesseract.get_tesseract_version())
        text = pytesseract.image_to_string(img, lang='sin')
        print("Test extraction success.")
    except Exception as e:
        print("Test extraction failed:", e)

if __name__ == "__main__":
    test_ocr()
