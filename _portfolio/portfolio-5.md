---
title: "TellingByfAIce"
excerpt: "Interactive expression recognition game powered by real-time emotion detection"
collection: portfolio
---

📌 Overview  
---  
This project presents an interactive expression-based game that detects players’ facial emotions in real time through webcam input. Players respond to short emotional scenarios by mimicking specific expressions, which are classified using deep learning models. The game blends computer vision with storytelling, enhancing emotional awareness and engagement through a gamified experience.  
- Project Duration: June 16, 2025 – July 10, 2025  
- Data Source: Custom-labeled dataset + [9 Facial Expressions for YOLO](https://www.kaggle.com/datasets/tanlikesmath/9-facial-expressions-for-yolo)  
- Repository: [GitHub - somnio-kimm/TellingByfAIce](https://github.com/somnio-kimm/TellingByfAIce)

🧰 Tools and Technologies  
---  
- Game Engine: Godot (v4.4)  
- Backend: FastAPI, Python  
- Languages: GDScript, Python  
- ML Libraries: PyTorch, torchvision, OpenCV  
- Model Architectures:
    - YOLOv8 (Face Detection)
    - EfficientNet-B3 (Expression Classification)
    - ViT (Vision Transformer, experiment)  
- WebCam Integration: OpenCV  
- Scenario Generation: LangChain + GPT-4

🔍 Key Features  
---  
1. Real-Time Emotion Detection  
- Face cropped from webcam input using YOLOv11n
- Expression classified using a fine-tuned EfficientNet-B3 model  
- Achieved sub-100ms inference per frame

2. Gameplay Mechanics  
- Player is shown a scenario and asked to express an emotion 
- If expression matches the target (e.g., “surprised”), player proceeds  
- Mismatches result in “heart” loss and eventual game over

3. Scenario and Feedback System  
- Dialogue and stage progression designed in JSON for flexibility  
- GPT-based scenario generation for emotional variety  

📈 Sample Results  
---  
- Best Model: EfficientNet-B3 (fine-tuned on 58,000 images)  
- Performance Metrics:  
    - F1 Score (Happy): 0.95  
    - F1 Score (Sad): 0.82  
    - F1 Score (Angry): 0.85  
    - F1 Score (Surprised): 0.78  
- Inference Speed: ~86ms/frame  

<p align="center">
    <video width="100%" controls>
        <source src="/images/portfolio/TellingByfAIce.mp4" type="video/mp4">
    </video>
</p>