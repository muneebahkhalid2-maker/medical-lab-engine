import os
import glob
import json

def generate_report():
    processed_dir = r"C:\Users\hashi\medaDoc\medical_extraction\python-engine\processed"
    output_file = r"C:\Users\hashi\medaDoc\medical_extraction\python-engine\master_report.txt"
    
    json_files = glob.glob(os.path.join(processed_dir, "*.json"))
    
    master_data = []
    for file_path in json_files:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                master_data.append(data)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
            
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(master_data, f, indent=4)
        
    print(f"Successfully generated master report at: {output_file}")
    print(f"Total reports aggregated: {len(master_data)}")

if __name__ == "__main__":
    generate_report()
