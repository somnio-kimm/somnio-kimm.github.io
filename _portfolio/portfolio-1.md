---
title: "Energy Consumption Analysis"
excerpt: "Energy consumption prediction using weather"
collection: portfolio
---

### 📌 Overview

This project aims to build and evaluate machine learning pipelines to forecast electricity consumption using real-world data provided by Korea Electric Power Corporation (KEPCO). It integrates multiple regression models, including ensemble techniques like stacking, and incorporates feature importance analysis to enhance interpretability.  
• Project Duration: March 31, 2025 – April 10, 2025   
• Data Source: Korea Electric Power Corporation (KEPCO)  
• Repository: [GitHub - somnio-kimm/energy_consumption_analysis](https://github.com/somnio-kimm/energy_consumption_analysis)

### 🧰 Tools and Technologies

• Languages: Python  
• Libraries: pandas, NumPy, scikit-learn, XGBoost, matplotlib, seaborn  
• Development Environment: Jupyter Notebook, VSCode  
• Version Control: Git, GitHub  

### 🔍 Key Features

1. Data Preprocessing
- • Cleaned missing values and removed outliers to improve model quality.  
- • Performed feature engineering and normalization to optimize model performance.  
- • Implemented safe train-test split pipelines to prevent data leakage.  
2. Model Building
- • Built baseline models including Linear Regression, Random Forest, and Gradient Boosting.  
- • Applied hyperparameter tuning using GridSearchCV to improve model accuracy.  
- • Combined the best-performing models using a stacking ensemble approach.  
3. Evaluation & Interpretability
- • Assessed models with metrics like MAE, RMSE, R², and Adjusted R².  
- • Conducted residual analysis and visualized feature importances for interpretability.  
- • Identified key predictors of energy consumption such as temperature and time-of-day.  

### 📈 Sample Results

- •Best Model: Stacked Ensemble (XGBoost + LightGBM + Linear Regression)  
- •Performance: RMSE = 1.47, R² = 0.91 (example values, update with real metrics)  
