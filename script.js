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
    
    // Atualizar conteúdo se necessário
    if (screenId === 'dashboard-screen') {
        updateDashboard();
        displayReviews();
    }
}

// Selecionar usuário
function selectUser(user) {
    currentUser = user;
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
        gelateria: 'Gelateria',
        restaurante: 'Restaurante',
        filme: 'Filme'
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
        <div class="stars-container" data-rating="${key}" data-value="0">
            ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}">★</span>`).join('')}
        </div>
    `;
    
    // Adicionar eventos de clique nas estrelas
    const starsContainer = div.querySelector('.stars-container');
    const stars = div.querySelectorAll('.star');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = index + 1;
            starsContainer.dataset.value = rating;
            
            // Atualizar visual das estrelas
            updateStarsVisual(stars, rating);
        });
        
        star.addEventListener('mouseenter', () => {
            const rating = index + 1;
            updateStarsVisual(stars, rating, true);
        });
    });
    
    starsContainer.addEventListener('mouseleave', () => {
        const currentRating = parseInt(starsContainer.dataset.value) || 0;
        updateStarsVisual(stars, currentRating);
    });
    
    return div;
}

// Atualizar visual das estrelas
function updateStarsVisual(stars, rating, isHover = false) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('filled');
            star.style.color = isHover ? '#F26C4F' : '#FFB085';
        } else {
            star.classList.remove('filled');
            star.style.color = '#ddd';
        }
    });
}

// Salvar avaliação
document.getElementById('rating-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const placeName = document.getElementById('place-name').value;
    const visitDate = document.getElementById('visit-date').value;
    const city = document.getElementById('city').value;
    
    // Validar se todas as avaliações foram preenchidas
    const ratingContainers = document.querySelectorAll('.stars-container');
    const ratings = {};
    let allRated = true;
    
    ratingContainers.forEach(container => {
        const criterionKey = container.dataset.rating;
        const rating = parseInt(container.dataset.value) || 0;
        
        if (rating === 0) {
            allRated = false;
        }
        
        ratings[criterionKey] = rating;
    });
    
    if (!allRated) {
        alert('Por favor, avalie todos os critérios!');
        return;
    }
    
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
        const stars = container.querySelectorAll('.star');
        updateStarsVisual(stars, 0);
    });
    
    // Voltar ao dashboard
    showScreen('dashboard-screen');
    
    // Feedback visual
    showNotification(`✨ Avaliação salva!\n${placeName} - ${average}⭐`);
});

// Atualizar dashboard com estatísticas
function updateDashboard() {
    const stats = {
        gelateria: reviews.filter(r => r.category === 'gelateria').length,
        restaurante: reviews.filter(r => r.category === 'restaurante').length,
        filme: reviews.filter(r => r.category === 'filme').length
    };
    
    document.getElementById('gelateria-count').textContent = stats.gelateria;
    document.getElementById('restaurante-count').textContent = stats.restaurante;
    document.getElementById('filme-count').textContent = stats.filme;
}

// Filtrar reviews
let currentFilter = 'all';

function filterReviews(filter) {
    currentFilter = filter;
    
    // Atualizar botões ativos
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    displayReviews();
}

// Exibir reviews
function displayReviews() {
    const reviewsList = document.getElementById('reviews-list');
    
    let filteredReviews = reviews;
    
    if (currentFilter !== 'all') {
        filteredReviews = reviews.filter(review => review.user === currentFilter);
    }
    
    if (filteredReviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="empty-state">
                <p>Nenhum registro ainda!</p>
                <p>Que tal adicionar o primeiro? ✨</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    reviewsList.innerHTML = filteredReviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-name">${review.name}</div>
                <div class="review-date">${formatDate(review.date)}</div>
            </div>
            <div class="review-user">${review.user === 'livia' ? 'Lívia' : 'Camila'}</div>
            <div class="review-location">📍 ${review.city}</div>
            <div class="review-rating">
                <span class="rating-average">${review.average}⭐</span>
                <span style="color: #999; font-size: 14px;">${getCategoryIcon(review.category)} ${getCategoryName(review.category)}</span>
            </div>
        </div>
    `).join('');
}

// Funções auxiliares
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit',
        year: '2-digit'
    });
}

function getCategoryIcon(category) {
    const icons = {
        gelateria: '🍨',
        restaurante: '🍽️',
        filme: '🎬'
    };
    return icons[category] || '';
}

function getCategoryName(category) {
    const names = {
        gelateria: 'Gelateria',
        restaurante: 'Restaurante',
        filme: 'Filme'
    };
    return names[category] || category;
}

// Notificação
function showNotification(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #F26C4F;
        color: #F5F5F5;
        padding: 16px 20px;
        border-radius: 12px;
        font-family: 'Outfit', sans-serif;
        font-weight: 600;
        box-shadow: 0 8px 20px rgba(242, 108, 79, 0.3);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        white-space: pre-line;
        text-align: center;
        max-width: 250px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animação de entrada
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Definir data de hoje por padrão
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('visit-date');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Atualizar dashboard
    updateDashboard();
    
    // Definir primeiro filtro ativo
    const firstTab = document.querySelector('.filter-tab');
    if (firstTab) {
        firstTab.classList.add('active');
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
    
    showNotification('📁 Backup exportado com sucesso!');
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
            displayReviews();
            showNotification('📥 Dados importados com sucesso!');
        } catch (error) {
            showNotification('❌ Erro ao importar dados!\nVerifique o arquivo.');
        }
    };
    reader.readAsText(file);
}