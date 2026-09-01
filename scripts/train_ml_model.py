#!/usr/bin/env python3
"""
EduSense ML Training Utility Script
Triggers model training, cross validation, benchmark generation, and saves the serialized model.
"""

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "ml-service"))
from ml_pipeline import pipeline_service

def main():
    print("=" * 60)
    print("EduSense AI - ML Model Training Pipeline")
    print("=" * 60)
    
    metadata = pipeline_service.train_and_evaluate()
    
    print("\nTraining Metrics Summary:")
    print(f"• Algorithm: {metadata['algorithm']}")
    print(f"• Total Samples: {metadata['total_samples']}")
    print(f"• Accuracy: {metadata['evaluation_metrics']['accuracy'] * 100:.2f}%")
    print(f"• High-Risk Recall: {metadata['evaluation_metrics']['high_risk_recall'] * 100:.2f}%")
    print(f"• Macro F1-Score: {metadata['evaluation_metrics']['f1_score'] * 100:.2f}%")
    
    print("\nCandidate Benchmark Comparison:")
    for name, bench in metadata["all_model_benchmarks"].items():
        print(f"  - {name:20s}: Acc={bench['accuracy']*100:.1f}%, HighRiskRecall={bench['high_risk_recall']*100:.1f}%, F1={bench['f1_score']*100:.1f}%")
        
    print("\nModel Artifacts Saved to: ml-service/models/")

if __name__ == "__main__":
    main()
