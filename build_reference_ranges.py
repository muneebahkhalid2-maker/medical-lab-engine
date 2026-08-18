import json
import pandas as pd
import kagglehub
from pathlib import Path

def main():
    print("Downloading Kaggle Dataset 'pinuto/laboratory-test-results-anonymized-dataset'...")
    dataset_dir = kagglehub.dataset_download('pinuto/laboratory-test-results-anonymized-dataset')
    csv_path = Path(dataset_dir) / "lab_test_results_public.csv"

    print(f"Loading CSV from {csv_path}...")
    df = pd.read_csv(csv_path, encoding='utf-8')

    out_path = Path(__file__).parent / "research_fallback_ranges.json"
    research_ranges = {}

    for _, row in df.iterrows():
        test_name = str(row.get('Test_Name', '')).strip()
        min_ref = row.get('Min_Reference')
        max_ref = row.get('Max_Reference')
        unit = str(row.get('Unit', '')).strip()

        if not test_name or test_name.lower() == 'nan' or pd.isna(min_ref) or pd.isna(max_ref):
            continue

        try:
            min_val = float(min_ref)
            max_val = float(max_ref)
        except (ValueError, TypeError):
            continue

        clean_unit = unit if unit and unit.lower() != 'nan' else "N/A"

        if test_name not in research_ranges:
            research_ranges[test_name] = {
                "unit": clean_unit,
                "ranges": {
                    "general": {
                        "min": min_val,
                        "max": max_val
                    }
                }
            }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(research_ranges, f, indent=2, ensure_ascii=False)

    print(f"Created Tier 4 Research Fallback Database at {out_path} with {len(research_ranges)} tests!")

if __name__ == "__main__":
    main()
