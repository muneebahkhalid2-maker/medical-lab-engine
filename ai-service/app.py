import streamlit as st
import json
import os
from PIL import Image
from reference_range_system.engine import MedicalLabStatusEngine

def load_data(doc_id):
    processed_path = os.path.join("processed", f"{doc_id}.json")
    if os.path.exists(processed_path):
        with open(processed_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def save_verified(doc_id, data):
    data["extraction_status"] = "verified"
    data["extraction_verified"] = True
    
    # Re-run reference range status engine with verified = True
    status_engine = MedicalLabStatusEngine()
    data = status_engine.analyze_report(data)

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
st.title("Medical Document Extraction & Clinical Reference Range Engine")

doc_id = st.text_input("Enter Document ID (e.g., sample_report):", "sample_report")

if doc_id:
    data = load_data(doc_id)
    if data:
        col1, col2 = st.columns([1, 1])
        
        with col1:
            st.subheader("Original Document")
            image_path = os.path.join("..", "LabReports", f"{doc_id}.jpeg")
            if os.path.exists(image_path):
                img = Image.open(image_path)
                st.image(img, use_column_width=True)
            else:
                image_path = os.path.join("..", "LabReports", f"{doc_id}.jpg")
                if os.path.exists(image_path):
                     img = Image.open(image_path)
                     st.image(img, use_column_width=True)
                else:
                    st.warning(f"Could not find original image for {doc_id} in LabReports folder.")
                
        with col2:
            st.subheader("Extracted Tests & Status Evaluation")
            st.write(f"**Overall Report Status:** `{data.get('overall_status', 'UNKNOWN')}`")
            
            if data.get("extraction_status") == "unverified":
                st.info("Status shows NEEDS_REVIEW until human verification.")
                
            for i, test in enumerate(data.get("tests", [])):
                tname = test.get('testName') or test.get('test_name') or test.get('test_name_raw') or 'Unknown'
                st.markdown(f"### **Test:** {tname}")
                
                # Check for status
                tstatus = test.get("status", "UNKNOWN")
                ref_range = test.get("reference_range", "N/A")
                ref_src = test.get("reference_source", "N/A")
                
                if tstatus == "NORMAL":
                    st.success(f"Status: **NORMAL** | Ref Range: {ref_range} | Source: {ref_src}")
                elif tstatus in ["HIGH", "LOW"]:
                    st.error(f"Status: **{tstatus}** | Ref Range: {ref_range} | Source: {ref_src}")
                else:
                    st.warning(f"Status: **{tstatus}** | Reason: {test.get('status_reason', 'N/A')}")
                    
                st.write(f"**Result:** {test.get('result')} {test.get('unit', '')}")
                if "confidence" in test:
                    st.write(f"**Confidence:** {test.get('confidence', 0)*100:.1f}%")
                
                # Allow user to edit
                correct_val = st.text_input(f"Correct value for {tname}:", value=str(test.get('result', '')), key=f"test_{i}")
                
                if correct_val != str(test.get('result', '')):
                    test["ai_result"] = test["result"] # Save original AI result
                    test["result"] = correct_val # Update with human correction
                    
                st.markdown("---")
                
            if st.button("Save Verified JSON"):
                save_verified(doc_id, data)
                
    else:
        st.info("No processed data found for this document ID. Run the pipeline first.")
