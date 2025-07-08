// Menunggu hingga seluruh konten HTML di halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {

    // --- NAVIGASI TAB ---
    const navContainer = document.querySelector('nav > div');
    if (navContainer) {
        navContainer.addEventListener('click', (event) => {
            const clickedTab = event.target.closest('.tab-button');
            if (!clickedTab) return;
            document.querySelectorAll('.tab-button').forEach(item => item.classList.remove('active'));
            clickedTab.classList.add('active');
            const targetId = clickedTab.getAttribute('data-tab');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
                if (content.id === targetId) content.classList.remove('hidden');
            });
        });
    }

    // --- DROPDOWN DINAMIS ---
    const brandSelect = document.getElementById('Make');
    const modelSelect = document.getElementById('Model');
    let carData = {};

    async function initializeDropdowns() {
        if (!brandSelect || !modelSelect) return;
        try {
            const response = await fetch('http://127.0.0.1:5000/get_car_data');
            if (!response.ok) throw new Error('Gagal memuat data mobil.');
            carData = await response.json();
            populateBrands();
            updateModels();
        } catch (error) {
            console.error("Error inisialisasi dropdown:", error);
            brandSelect.innerHTML = '<option value="">Gagal Memuat</option>';
        }
    }

    function populateBrands() {
        brandSelect.innerHTML = '';
        for (const brand in carData) {
            brandSelect.add(new Option(brand, brand));
        }
    }

    function updateModels() {
        const selectedBrand = brandSelect.value;
        modelSelect.innerHTML = '';
        if (carData[selectedBrand]) {
            carData[selectedBrand].forEach(model => modelSelect.add(new Option(model, model)));
        }
    }

    if (brandSelect) {
        brandSelect.addEventListener('change', updateModels);
    }
    
    initializeDropdowns();


    // --- PREDIKSI HARGA ---
    const predictionForm = document.getElementById('prediction-form');
    if (predictionForm) {
        predictionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const container = document.getElementById('prediction-result-container');
            const loader = document.getElementById('loader');
            const output = document.getElementById('prediction-output');
            const priceEl = document.getElementById('predicted-price');
            
            container.classList.remove('hidden');
            loader.classList.remove('hidden');
            output.classList.add('hidden');

            // Validasi input
            const formData = {
                'Make': document.getElementById('Make').value,
                'Model': document.getElementById('Model').value,
                'Year': parseInt(document.getElementById('Year').value),
                'Mileage(kms)': parseInt(document.getElementById('Mileage(kms)').value), 
                'Engine Type': document.getElementById('Engine Type').value, 
                'Engine Capacity(CC)': parseInt(document.getElementById('Engine Capacity(CC)').value),
                'Transmission': document.getElementById('Transmission').value
            };

            try {
                const response = await fetch('http://127.0.0.1:5000/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
                if (!response.ok) { const err = await response.json(); throw new Error(err.error); }
                const result = await response.json();
                priceEl.textContent = `Rp ${Math.round(result.predicted_price_idr).toLocaleString('id-ID')}`;
            } catch (error) {
                console.error('Error saat prediksi:', error);
                priceEl.textContent = `Gagal: ${error.message}`;
            } finally {
                loader.classList.add('hidden');
                output.classList.remove('hidden');
            }
        });
    }

    // --- Rekomendasi SAW ---
    const sawControlsContainer = document.getElementById('saw-controls');
    if (sawControlsContainer) {
        const sawControls = sawControlsContainer.querySelectorAll('input[type="range"]');
        const weightLabels = { 1: "Tidak Penting", 2: "Kurang", 3: "Cukup", 4: "Penting", 5: "Sangat Penting" };
        
        function updateSawLabel(control) {
            const labelEl = document.getElementById(control.id.replace('w-', 'val-'));
            if (labelEl) labelEl.textContent = `${weightLabels[control.value]} (${control.value})`;
        }
        
        sawControls.forEach(control => {
            updateSawLabel(control);
            control.addEventListener('input', () => updateSawLabel(control));
        });

        const recommendationBtn = document.getElementById('get-recommendation-btn');
        if (recommendationBtn) {
            recommendationBtn.addEventListener('click', async () => {
                const container = document.getElementById('recommendation-results-container');
                const loader = document.getElementById('recommendation-loader');
                const output = document.getElementById('recommendation-output');
                const tableBody = document.getElementById('saw-table-body');
                
                container.classList.remove('hidden');
                loader.classList.remove('hidden');
                output.classList.add('hidden');

                const weights = {
                    'price': parseInt(document.getElementById('w-price').value),
                    'Year': parseInt(document.getElementById('w-Year').value),
                    'Mileage': parseInt(document.getElementById('w-Mileage').value),
                    'Engine': parseInt(document.getElementById('w-Engine').value)
                };
                
                const requestBody = { weights: weights };

                try {
                    const response = await fetch('http://127.0.0.1:5000/recommend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) });
                    if (!response.ok) { const err = await response.json(); throw new Error(err.error); }
                    const recommendations = await response.json();
                    
                    tableBody.innerHTML = '';
                    if (!recommendations || recommendations.length === 0) {
                        tableBody.innerHTML = '<tr><td colspan="4" class="text-center p-4">Tidak ada mobil yang cocok ditemukan.</td></tr>';
                    } else {
                        recommendations.forEach((car, index) => {
                            const row = `
                                <tr class="${index === 0 ? 'bg-indigo-50' : ''}">
                                    <td class="px-6 py-4"><span class="inline-flex items-center justify-center h-8 w-8 rounded-full ${index === 0 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'} font-bold">${index + 1}</span></td>
                                    <td class="px-6 py-4"><div class="font-medium text-gray-900">${car.brand} ${car.model}</div><div class="text-sm text-gray-500">${car.year} | ${car.mileage.toLocaleString('id-ID')} km</div></td>
                                    <td class="px-6 py-4 font-semibold text-gray-800">Rp ${car.predicted_price_idr.toLocaleString('id-ID')}</td>
                                    <td class="px-6 py-4 font-bold text-indigo-700">${car.saw_score}</td>
                                </tr>`;
                            tableBody.innerHTML += row;
                        });
                    }
                } catch (error) {
                    console.error('Error saat rekomendasi:', error);
                    tableBody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-red-600">Terjadi kesalahan: ${error.message}</td></tr>`;
                } finally {
                    loader.classList.add('hidden');
                    output.classList.remove('hidden');
                }
            });
        }
    }
});
