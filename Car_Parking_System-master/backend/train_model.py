import pandas as pd
from sklearn.linear_model import LinearRegression
import pickle
import os

def train():
    # Load dataset
    dataset_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dataset', 'parking_data.csv')
    if not os.path.exists(dataset_path):
        print("Dataset not found. Please generate the data first.")
        return
        
    df = pd.read_csv(dataset_path)
    
    X = df[['hour', 'day_type']]
    y = df['vehicle_count']
    
    model = LinearRegression()
    model.fit(X, y)
    
    # Save the model
    model_path = os.path.join(os.path.dirname(__file__), 'parking_demand_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)
        
    print(f"Model trained and saved to {model_path}")

if __name__ == '__main__':
    train()
