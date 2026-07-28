import pypdf
import sys

def main():
    reader = pypdf.PdfReader('apps/backend/uploads/7c6d7e7f-4c47-4ae5-a10a-b52fe75252cc.pdf')
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
    print(text)

if __name__ == '__main__':
    main()
