import pandas as pd
import joblib
import pickle
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- KONFIGURASI BARU ---
PKR_TO_IDR_RATE = 58 
MODEL_PATH = 'model_xgboost_final.joblib'
DATASET_PATH = 'PakWheelsDataSet_Cleaned.csv'
COLUMNS_PATH = 'feature_columns.pkl'

# --- MEMUAT ASET-ASET UTAMA ---
try:
    model = joblib.load(MODEL_PATH)
    print("✅ Model berhasil dimuat.")
except FileNotFoundError:
    model = None

try:
    with open(COLUMNS_PATH, 'rb') as f:
        feature_columns = pickle.load(f)
    print("✅ Urutan kolom fitur berhasil dimuat.")
except FileNotFoundError:
    feature_columns = None

try:
    full_dataset = pd.read_csv(DATASET_PATH)
    print(f"✅ Dataset bersih berhasil dimuat dengan {len(full_dataset)} baris.")
except FileNotFoundError:
    full_dataset = None

# --- ENDPOINT OTOMATIS UNTUK DROPDOWN ---
@app.route('/get_car_data', methods=['GET'])
def get_car_data():
    if full_dataset is None:
        return jsonify({"error": "Dataset tidak dapat dimuat"}), 500
    try:
        car_data_dict = {}
        brands = sorted(full_dataset['Make'].unique())
        for brand in brands:
            models = sorted(full_dataset[full_dataset['Make'] == brand]['Model'].unique())
            car_data_dict[brand] = list(models)
        return jsonify(car_data_dict)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- ENDPOINT PREDIKSI HARGA ---
@app.route('/predict', methods=['POST'])
def predict():
    if model is None or feature_columns is None:
        return jsonify({'error': 'Model atau konfigurasi kolom tidak dapat dimuat'}), 500
    try:
        data = request.get_json()
        input_df = pd.DataFrame([data])
        input_df_reordered = input_df[feature_columns]
        prediction_pkr = model.predict(input_df_reordered)[0]
        prediction_idr = prediction_pkr * PKR_TO_IDR_RATE
        return jsonify({'predicted_price_idr': float(prediction_idr)})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# --- ENDPOINT REKOMENDASI SAW ---
@app.route('/recommend', methods=['POST'])
def recommend():
    if model is None or full_dataset is None or feature_columns is None:
        return jsonify({'error': 'Model atau Dataset tidak dapat dimuat'}), 500
    try:
        prefs = request.get_json()
        weights = prefs['weights']

        sample_size = min(len(full_dataset), 1000)
        cars_to_recommend = full_dataset.sample(n=sample_size, random_state=42).copy()
        
        features_for_prediction = cars_to_recommend[feature_columns]
        predicted_prices_pkr = model.predict(features_for_prediction)
        cars_to_recommend['predicted_price'] = predicted_prices_pkr

        criteria = {
            'predicted_price': 'cost',
            'Year': 'benefit',
            'Mileage(kms)': 'cost',
            'Engine Capacity(CC)': 'benefit'
        }
        
        min_vals = {col: cars_to_recommend[col].min(skipna=True) for col in criteria}
        max_vals = {col: cars_to_recommend[col].max(skipna=True) for col in criteria}
        
        normalized_data = cars_to_recommend.copy()
        for col, kind in criteria.items():
            range_val = max_vals[col] - min_vals[col]
            if range_val == 0:
                normalized_data[col] = 1.0 # Beri skor sempurna jika semua nilai sama
                continue

            # --- NORMALISASI MIN-MAX SCALING ---
            if kind == 'benefit':
                normalized_data[col] = (normalized_data[col] - min_vals[col]) / range_val
            else: # cost
                normalized_data[col] = (max_vals[col] - normalized_data[col]) / range_val

        final_scores = pd.Series(0.0, index=normalized_data.index)
        for col, kind in criteria.items():
            weight_key = col.replace('(kms)', '').replace('(CC)','').replace('predicted_','').replace(' ', '')
            weight = weights.get(weight_key, 0)
            final_scores += normalized_data[col] * weight
        
        cars_to_recommend['saw_score'] = final_scores
        
        sorted_cars = cars_to_recommend.sort_values(by='saw_score', ascending=False)
        unique_cars = sorted_cars.drop_duplicates(subset='Model', keep='first')
        top_cars = unique_cars.head(10)
        
        result = []
        for _, row in top_cars.iterrows():
            result.append({
                'brand': row['Make'],
                'model': row['Model'],
                'year': int(row['Year']),
                'mileage': int(row['Mileage(kms)']),
                'predicted_price_idr': int(row['predicted_price'] * PKR_TO_IDR_RATE),
                'saw_score': round(row['saw_score'], 4)
            })
            
        return jsonify(result)
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 400



if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
