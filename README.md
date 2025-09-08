# Antique Atlas

## Overview
This application is an experimental platform for estimating the value of items at auction 
It combines **AI-powered data normalization** with a **machine learning regression model** trained on historical auction data

The workflow is:
1. The user selects items to track via the client application
2. The backend collects item images and descriptions from auction listings
3. The data is sent to the **ChatGPT API**, which generates a normalized, structured representation of the item (materials, condition, dimensions, provenance, etc.).  
4. This structured data is passed into a **scikit-learn regression model** trained on past auction results
5. The model outputs an estimated value for the item
6. Results are returned to the client, where they can be explored in interactive reports and charts

> ⚠️ Note: This project is **a work in progress** and primarily intended as a learning exercise in machine learning, data science, and full-stack development. It is not yet production-ready

---

## Components
- **React Client**  
  Provides the user interface for selecting auction items and viewing results
  Includes reporting features and interactive charts to visualize model predictions and comparisons

- **Express Backend**  
  Handles client requests, communicates with the database, and manages communication with the AI service

- **MySQL Database**  
  Stores auction item data, user selections, and processed results

- **Python FastAPI Service**  
  Hosts the regression model. Exposes endpoints for value prediction using scikit-learn

---

## Technology Stack
- **Frontend**: React, TailwindCSS, Chart libraries
- **Backend**: Node.js (Express)  
- **Database**: MySQL  
- **AI/ML**: Python, FastAPI, scikit-learn, NumPy, Pandas
- **External Services**: OpenAI ChatGPT API

---

## Status
- ✅ Frontend form allows users to specify search criteria  
- ✅ Results page shows basic item information  
- ✅ Core backend API is implemented  
- ✅ Core ML model pipeline is implemented  
- 🚧 Integration between frontend, backend, and ML pipeline is still in progress  
- 🚧 Charting and reporting functionality not yet implemented  

---

## Goals
- Learn and demonstrate practical applications of:
  - **Machine learning** (data normalization, regression)  
  - **Data science** (feature engineering, model training, evaluation)  
  - **Full-stack engineering** (React, Express, FastAPI, MySQL)  
- Showcase ongoing learning and experimentation 
- Learn about and experiment with providing **clear, visual reporting** with charts that highlight estimated values, model confidence, and key item attributes 
- Build toward a system that can help identify undervalued auction items.

---

## Future Plans
- Improve the regression model with more diverse and high-quality training data
- Add richer reports (exportable PDFs/CSVs) and dashboards
- Expand charting to include time series trends, attribute contributions, and auction comparisons
- Experiment with alternative ML models and approaches  
- Enhance the client application with more detailed reporting and insights