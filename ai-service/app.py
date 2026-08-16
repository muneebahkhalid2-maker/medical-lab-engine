import streamlit as st
import json
import os
from PIL import Image

def load_data(doc_id):
    processed_path = os.path.join("processed", f"{doc_id}.json")
    if os.path.exists(processed_path):
        with open(processed_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def save_verified(doc_id, data):
    data["extraction_status"] = "verified"
    verified_dir = "verified"
    os.makedirs(verified_dir, exist_ok=True)
    verified_path = os.path.join(verified_dir, f"{doc_id}.json")
    
    # Mark all tests as verified
    for test in data.get("tests", []):
        test["verified"] = True
        if "needs_verification" in test:
            del test["needs_verification"]
        if "reason" in test:
            del test["reason"]

    with open(verified_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)
    st.success(f"Verified data saved to {verified_path}")

st.set_page_config(layout="wide")
st.title("Medical Document Extraction - Verification")

doc_id = st.text_input("Enter Document ID (e.g., sample_report):", "sample_report")

if doc_id:
    data = load_data(doc_id)
    if data:
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.subheader("Original Document")
            # In a real app, you'd map doc_id to the exact image file.
            # Here we just look for a .jpeg with that name in the original folder.
            # For this demo, let's assume the user passes the exact image name or we have a DB.
            # We'll just try to load a known image from LabReports for demonstration.
            image_path = os.path.join("..", "LabReports", f"{doc_id}.jpeg")
            if os.path.exists(image_path):
                img = Image.open(image_path)
                st.image(img, use_column_width=True)
            else:
                # Try .jpg
                image_path = os.path.join("..", "LabReports", f"{doc_id}.jpg")
                if os.path.exists(image_path):
                     img = Image.open(image_path)
                     st.image(img, use_column_width=True)
                else:
                    st.warning(f"Could not find original image for {doc_id} in LabReports folder.")
                
        with col2:
            st.subheader("Extracted Tests")
            
            if "extraction_status" in data and data["extraction_status"] == "needs_verification":
                st.error("Some fields require your attention!")
                
            for i, test in enumerate(data.get("tests", [])):
                st.markdown(f"**Test:** {test.get('test_name', test.get('test_name_raw', 'Unknown'))}")
                
                # Check for anomaly flag
                needs_verification = test.get("needs_verification", False)
                if needs_verification:
                    st.warning(f"Flagged: {test.get('reason')}")
                    
                st.write(f"**AI Result:** {test.get('result')} {test.get('unit', '')}")
                st.write(f"**Confidence:** {test.get('confidence', 0)*100:.1f}%")
                
                # Allow user to edit
                correct_val = st.text_input(f"Correct value for {test.get('test_name')}:", value=str(test.get('result', '')), key=f"test_{i}")
                
                if correct_val != str(test.get('result', '')):
                    test["ai_result"] = test["result"] # Save original AI result
                    test["result"] = correct_val # Update with human correction
                    
                st.markdown("---")
                
            if st.button("Save Verified JSON"):
                save_verified(doc_id, data)
                
    else:
        st.info("No processed data found for this document ID. Run the pipeline first.")
