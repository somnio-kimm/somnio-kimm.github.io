---
title: "Energy Consumption Analysis"
excerpt: "Energy consumption prediction using weather"
collection: portfolio
---

### 📌 Overview
---
This project aims to build and evaluate machine learning pipelines to forecast electricity consumption using real-world data provided by Korea Electric Power Corporation (KEPCO). It integrates multiple regression models, including ensemble techniques like stacking, and incorporates feature importance analysis to enhance interpretability.  
- Project Duration: March 31, 2025 – April 10, 2025
- Data Source: [Korea Electric Power Corporation (KEPCO)](https://bigdata.kepco.co.kr/cmsmain.do?scode=S01&pcode=000171&redirect=Y)  
- Repository: [GitHub - somnio-kimm/energy_consumption_analysis](https://github.com/somnio-kimm/energy_consumption_analysis)
---

### 🧰 Tools and Technologies
---
- Development Environment: VSCode, Jupyter Notebook 
- Version Control: Git, GitHub
- Languages: Python
- Framework: scikit-learn, Keras
- Models:
    - Linear Regression
    - ElasticNet
    - SVR
    - Decision Tree
    - Random Forest
    - AdaBoost
    - XGBoost
    - Stacking
    - Simple Neural Network
    - SARIMAX
---

### 🔍 Key Features
---
1. Data Preprocessing
- Cleaned missing values and removed outliers to improve model quality.  
- Performed feature engineering and normalization to optimize model performance.  
- Implemented safe train-test split pipelines to prevent data leakage.
- Found best features by applying step-wise selection and other various methods.
2. Model Development
- Built baseline models including Linear Regression, Random Forest, etc.  
- Applied hyperparameter tuning using GridSearchCV to improve model accuracy.  
- Combined the best-performing models using a stacking ensemble approach.  
3. Evaluation
- Assessed models with metrics like MAE, RMSE, R², and Adjusted R².  
- Conducted residual analysis and visualized feature importances for interpretability.  
- Identified key predictors of energy consumption such as temperature.  
---

### 📈 Sample Results
---
- Best Model: XGBoost 
- Performance: RMSE: 10.89, Adjusted R² = 0.9  
---
