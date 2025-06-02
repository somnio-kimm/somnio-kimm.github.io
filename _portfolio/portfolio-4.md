---
title: "Antarctic Glacier Analysis"
excerpt: "Image prediction of glacier"
collection: portfolio
---

### 📌 Overview
---
This project focuses on developing a deep learning-based system to forecast monthly Antarctic glacier coverage using historical satellite imagery. By experimenting with various temporal models, the project aims to enhance the accuracy of glacier distribution predictions, contributing to climate change research and environmental monitoring.  
- Project Duration: April 28, 2025 – May 16, 2025
- Data Source: [National Snow and Ice Data Center (NSIDC)](https://nsidc.org/data/seaice_index/data-and-image-archive)  
- Repository: [GitHub - somnio-kimm/antarctic_glacier_analysis](https://github.com/somnio-kimm/antarctic_glacier_analysis)

### 🧰 Tools and Technologies
---
- Development Environment: VSCode, Jupyter Notebook  
- Version Control: Git, GitHub
- Languages: Python
- Frameworks: TensorFlow, Keras, PyTorch  
- Models:
    - SARIMAX
    - CNN
    - LSTM
    - Encoder-Only Transformer
    - ConvLSTM2D
    - AE + GRU
    - U-Net + GAN
- Web Application: Streamlit for interactive result visualization
 

### 🔍 Key Features
---
1. Data Preprocessing
- Processed historical satellite time series images.  
- Applied normalization and resizing techniques to standardize input data and boost training speed.
2. Model Development
- Applied windowing on 60 input images to predict 1 output image
- Developed and trained multiple deep learning models to capture temporal and spatial patterns in glacier coverage.  
3. Evaluation
- Visualised predictions versus actual glacier coverage to assess model accuracy.
- Evaluated model performance using metrics such as MSE, SSIM, and PSNR.  
- Developed an interactive Streamlit web application for real-time result exploration.  

### 📈 Sample Results
---
- Best Model: AE + GRU
- Performance Metrics
    - MSE: 0.004
    - SSIM: 0.9848
    - PSNR: 39.89

<p align="center">
    <img src="/images/portfolio/portfolio-4-1.png" alt="Glacier" width="100%">
</p>