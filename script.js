// Estado da aplicação
let currentUser = null;
let currentCategory = null;
let reviews = JSON.parse(localStorage.getItem('adcReviews')) || [];

// Critérios de avaliação por categoria
const ratingCriteria = {
    gelateria: [
        { key: 'sabor', label: 'Sabor' },
        { key: 'textura', label: 'Textura' },
        { key: 'equilibrio', label: 'Equilíbrio' },
        { key: 'casquinha', label: 'Casquinha' }
    ],
    restaurante: [
        { key: 'sabor', label: 'Sabor' },
        { key: 'atendimento', label: 'Atendimento' },
        { key: 'custoBeneficio', label: 'Custo-Benefício' },
        { key: 'ambiente', label: 'Ambiente' }
    ],
    filme: [
        { key: 'geral', label: 'Avaliação Geral' }
    ]
};

// Navegação entre telas
function showScreen(screenId) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar tela atual
    document.getElementById(screenId).classList.add('active');
}

// Login inicial
function login() {
    showScreen('dashboard-screen');
    updateDashboard();
}

// Selecionar usuário
function selectUser(user) {
    currentUser = user;
    document.getElementById('user-name').textContent = user === 'livia' ? 'Lívia' : 'Camila';
    showScreen('categories-screen');
}

// Selecionar categoria
function selectCategory(category) {
    currentCategory = category;
    setupForm(category);
    showScreen('form-screen');
}

// Configurar formulário baseado na categoria
function setupForm(category) {
    const formTitle = document.getElementById('form-title');
    const ratingFields = document.getElementById('rating-fields');
    
    // Atualizar título
    const titles = {
        gelateria: '🍨 Gelateria',
        restaurante: '🍽️ Restaurante',
        filme: '🎬 Filme'
    };
    formTitle.textContent = titles[category];
    
    // Limpar campos de avaliação existentes
    ratingFields.innerHTML = '';
    
    // Adicionar campos de avaliação específicos
    const criteria = ratingCriteria[category];
    criteria.forEach(criterion => {
        const ratingGroup = createRatingGroup(criterion.key, criterion.label);
        ratingFields.appendChild(ratingGroup);
    });
    
    // Definir data de hoje
    document.getElementById('visit-date').value = new Date().toISOString().split('T')[0];
}

// Criar grupo de avaliação por estrelas
function createRatingGroup(key, label) {
    const div = document.createElement('div');
    div.className = 'form-group rating-group';
    
    div.innerHTML = `
        <label class="form-label">${label}</label>
        <div class="stars-container" data-rating="${key}">
            ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}">⭐</span>`).join('')}
        </div>
    `;
    
    // Adicionar eventos de clique nas estrelas
    const stars = div.querySelectorAll('.star');
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = index + 1;
            const container = star.parentElement;
            container.dataset.value = rating;
            
            // Atualizar visual das estrelas
            stars.forEach((s, i) => {
                s.classList.toggle('filled', i < rating);
            });
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = index + 1;
            stars.forEach((s, i) => {
                s.style.color = i < rating ? '#D52800' : '#ddd';
            });
        });
        
        star.addEventListener('mouseleave', () => {
            const currentRating = parseInt(star.parentElement.dataset.value) || 0;
            stars.forEach((s, i) => {
                if (i < currentRating) {
                    s.style.color = '#FD9954';
                    s.classList.add('filled');
                } else {
                    s.style.color = '#ddd';
                    s.classList.remove('filled');
                }
            });
        });
    });
    
    return div;
}

// Salvar avaliação
document.getElementById('rating-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const placeName = document.getElementById('place-name').value;
    const visitDate = document.getElementById('visit-date').value;
    const city = document.getElementById('city').value;
    
    // Coletar ratings
    const ratings = {};
    document.querySelectorAll('.stars-container').forEach(container => {
        const criterionKey = container.dataset.rating;
        const rating = parseInt(container.dataset.value) || 0;
        ratings[criterionKey] = rating;
    });
    
    // Calcular média
    const ratingValues = Object.values(ratings);
    const average = ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length;
    
    // Criar nova avaliação
    const newReview = {
        id: Date.now(),
        user: currentUser,
        category: currentCategory,
        name: placeName,
        city: city,
        date: visitDate,
        ratings: ratings,
        average: Math.round(average * 10) / 10,
        timestamp: new Date().toISOString()
    };
    
    // Salvar
    reviews.push(newReview);
    localStorage.setItem('adcReviews', JSON.stringify(reviews));
    
    // Resetar formulário
    document.getElementById('rating-form').reset();
    document.querySelectorAll('.stars-container').forEach(container => {
        container.dataset.value = '0';
        container.querySelectorAll('.star').forEach(star => {
            star.classList.remove('filled');
            star.style.color = '#ddd';
        });
    });
    
    // Voltar ao dashboard
    showScreen('dashboard-screen');
    updateDashboard();
    
    // Feedback visual
    alert(`✅ Avaliação salva com sucesso!\n${placeName} - ${average}⭐`);
});

// Atualizar dashboard com estatísticas
function updateDashboard() {
    if (!currentUser) return;
    
    const userReviews = reviews.filter(review => review.user === currentUser);
    
    const stats = {
        gelateria: userReviews.filter(r => r.category === 'gelateria').length,
        restaurante: userReviews.filter(r => r.category === 'restaurante').length,
        filme: userReviews.filter(r => r.category === 'filme').length
    };
    
    const statCards = document.querySelectorAll('.stat-card');
    const categories = ['gelateria', 'restaurante', 'filme'];
    
    statCards.forEach((card, index) => {
        const category = categories[index];
        const numberElement = card.querySelector('.stat-number');
        numberElement.textContent = stats[category];
    });
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Definir data de hoje por padrão
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('visit-date');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Atualizar dashboard se já houver um usuário selecionado
    if (currentUser) {
        updateDashboard();
    }
});

// Função para exportar dados (backup)
function exportData() {
    const data = JSON.stringify(reviews, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adc-registro-backup.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Função para importar dados
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedReviews = JSON.parse(e.target.result);
            reviews = importedReviews;
            localStorage.setItem('adcReviews', JSON.stringify(reviews));
            updateDashboard();
            alert('✅ Dados importados com sucesso!');
        } catch (error) {
            alert('❌ Erro ao importar dados. Verifique se o arquivo está correto.');
        }
    };
    reader.readAsText(file);
}