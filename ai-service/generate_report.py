import os
import glob
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_report():
    processed_dir = os.path.join(BASE_DIR, "processed")
    output_file = os.path.join(BASE_DIR, "master_report.json")
    
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
        json.dump(master_data, f, indent=2)
        
    print(f"Successfully generated master report at: {output_file}")
    print(f"Total reports aggregated: {len(master_data)}")

if __name__ == "__main__":
    generate_report()
