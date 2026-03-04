import zipfile
import xml.etree.ElementTree as ET
import sys
import os

def extract_docx(file_path):
    try:
        with zipfile.ZipFile(file_path) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.XML(xml_content)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            text = []
            for paragraph in tree.findall('.//w:p', ns):
                texts = [node.text for node in paragraph.findall('.//w:t', ns) if node.text]
                if texts:
                    text.append(''.join(texts))
            return '\n'.join(text)
    except Exception as e:
        return f"Error: {e}"

def extract_xlsx(file_path):
    try:
        with zipfile.ZipFile(file_path) as xlsx:
            # We can extract sharedStrings.xml and sheet*.xml
            # This is simpler: just grab all text from sharedStrings if we want a dump,
            # but to actually read the table we need to parse sheet1.xml and sharedStrings.
            pass # We will implement this if needed, let's just do docx first.
    except Exception as e:
        return f"Error: {e}"

if __name__ == '__main__':
    if not os.path.exists(sys.argv[1]):
        print(f"File not found: {sys.argv[1]}")
    else:
        text = extract_docx(sys.argv[1])
        # Print first 2000 chars and last 2000 chars or paginate to avoid overwhelming, 
        # or just save to a txt file.
        out_path = sys.argv[1] + ".txt"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extracted to {out_path}, length: {len(text)}")
