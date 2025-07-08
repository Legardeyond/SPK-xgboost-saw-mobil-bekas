Sistem Pendukung Keputusan Cerdas: Prediksi & Rekomendasi Mobil Bekas
Proyek ini adalah sebuah aplikasi web yang berfungsi sebagai Sistem Pendukung Keputusan (SPK) cerdas untuk pasar mobil bekas. Sistem ini memiliki dua fitur utama:

Prediksi Harga: Mengestimasi harga wajar sebuah mobil bekas menggunakan model machine learning XGBoost.

Rekomendasi Personal: Memberikan peringkat mobil bekas terbaik berdasarkan preferensi pengguna menggunakan metode Simple Additive Weighting (SAW) yang terintegrasi dengan hasil prediksi harga.


🏛️ Arsitektur Sistem
Sistem ini dibangun menggunakan arsitektur 3-lapis (3-Tier Architecture):

Frontend (Client-Side): Dibangun menggunakan HTML, CSS (Tailwind CSS), dan JavaScript. Bertanggung jawab untuk menampilkan antarmuka kepada pengguna dan berkomunikasi dengan backend.

Backend (Server-Side): Dibangun menggunakan Flask (Python). Berfungsi sebagai API yang menangani logika bisnis, termasuk:

Memuat model XGBoost yang sudah dilatih (.joblib).

Menjalankan perhitungan rekomendasi SAW.

Menyediakan data untuk dropdown dinamis.

Data Layer: Terdiri dari aset-aset statis yang digunakan oleh backend:

model_xgboost_final.joblib: File model machine learning yang sudah terlatih.

feature_columns.pkl: File yang menyimpan urutan fitur yang benar untuk model.

PakWheelsDataSet_Cleaned.csv: Dataset mobil bekas yang sudah dibersihkan sebagai sumber data untuk rekomendasi.


⚙️ Instalasi dan Cara Menjalankan
Untuk menjalankan proyek ini di lingkungan lokal, ikuti langkah-langkah berikut:

1. Persiapan Lingkungan
Pastikan sudah menginstal Python (disarankan versi 3.9+).

# Clone repositori ini
git clone [URL_REPOSITORY_INI]

# Masuk ke direktori backend
cd path/to/proyek_spk_backend/

# Instal semua pustaka yang diperlukan
pip install -r requirements.txt

2. Jalankan Backend Server
Pastikan berada di dalam direktori backend

python app.py

Server akan berjalan di http://127.0.0.1:5000. Biarkan terminal ini tetap terbuka.

3. Jalankan Frontend
Buka file index.html di web browser.
