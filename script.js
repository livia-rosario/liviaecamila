// Configuração do Supabase
const supabaseUrl = 'https://riscuqhqbkzlzsqzmtaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2N1cWhxYmt6bHpzcXptdGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTYzNTgsImV4cCI6MjA3Mzk5MjM1OH0.llaXtLrm1IfF4m3y8Hc_vL8_Yzrczk8nPwL5G-q5-Q4';

// Inicializar Supabase (versão CDN para não precisar de build)
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Estado da aplicação
let currentUser = null;
let currentCategory = null;
let currentReviewId = null;
let reviews = [];

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

// Função para carregar reviews do Supabase
async function loadReviews() {
    try {
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .order('timestamp', { ascending: false });
        
        if (error) {
            console.error('Erro ao carregar reviews:', error);
            showNotification('Erro ao carregar dados!');
            return;
        }
        
        reviews = data || [];
        updateDashboard();
        displayReviews();
    } catch (error) {
        console.error('Erro na conexão:', error);
        showNotification('Erro de conexão!');
    }
}

// Função para salvar review no Supabase
async function saveReview(reviewData) {
    try {
        const { data, error } = await supabaseClient
            .from('reviews')
            .insert([{
                id: reviewData.id,
                user_name: reviewData.user,
                category: reviewData.category,
                name: reviewData.name,
                city: reviewData.city,
                visit_date: reviewData.date,
                ratings: reviewData.ratings,
                average: reviewData.average,
                timestamp: reviewData.timestamp
            }])
            .select();
        
        if (error) {
            console.error('Erro ao salvar:', error);
            showNotification('Erro ao salvar avaliação!');
            return false;
        }
        
        // Atualizar lista local
        await loadReviews();
        return true;
    } catch (error) {
        console.error('Erro na conexão:', error);
        showNotification('Erro de conexão!');
        return false;
    }
}

// Função para deletar review do Supabase
async function deleteReviewFromDB(reviewId) {
    try {
        const { error } = await supabaseClient
            .from('reviews')
            .delete()
            .eq('id', reviewId);
        
        if (error) {
            console.error('Erro ao deletar:', error);
            showNotification('Erro ao excluir avaliação!');
            return false;
        }
        
        // Atualizar lista local
        await loadReviews();
        return true;
    } catch (error) {
        console.error('Erro na conexão:', error);
        showNotification('Erro de conexão!');
        return false;
    }
}

// Navegação entre telas
function showScreen(screenId) {
    // Esconder todas as telas
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Mostrar tela atual
    document.getElementById(screenId).classList.add('active');
    
    // Carregar dados se necessário
    if (screenId === 'dashboard-screen') {
        loadReviews();
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
    const cityGroup = document.getElementById('city-group');
    
    // Atualizar título
    const titles = {
        gelateria: 'Gelateria',
        restaurante: 'Restaurante',
        filme: 'Filme'
    };
    formTitle.textContent = titles[category];
    
    // Exibir/esconder campo de cidade
    if (category === 'filme') {
        cityGroup.style.display = 'none';
        document.getElementById('city').removeAttribute('required');
    } else {
        cityGroup.style.display = 'flex';
        document.getElementById('city').setAttribute('required', 'required');
    }
    
    // Limpar campos de avaliação existentes
    ratingFields.innerHTML = '';
    
    // Adicionar campos de avaliação específicos
    const criteria = ratingCriteria[category];
    criteria.forEach(criterion => {
        const ratingGroup = createRatingGroup(criterion.key, criterion.label);
        ratingFields.appendChild(ratingGroup);
    });
    
    // Resetar o estado da data
    const dateInput = document.getElementById('visit-date');
    const noDateCheckbox = document.getElementById('no-date-checkbox');
    dateInput.value = new Date().toISOString().split('T')[0];
    dateInput.disabled = false;
    noDateCheckbox.checked = false;
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
document.addEventListener('DOMContentLoaded', function() {
    const ratingForm = document.getElementById('rating-form');
    const dateInput = document.getElementById('visit-date');
    const noDateCheckbox = document.getElementById('no-date-checkbox');

    if (noDateCheckbox) {
        noDateCheckbox.addEventListener('change', function() {
            if (this.checked) {
                dateInput.value = '';
                dateInput.disabled = true;
                dateInput.removeAttribute('required');
            } else {
                dateInput.disabled = false;
                dateInput.value = new Date().toISOString().split('T')[0];
                dateInput.setAttribute('required', 'required');
            }
        });
    }

    if (ratingForm) {
        ratingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Salvando...';
            submitBtn.disabled = true;
            
            const placeName = document.getElementById('place-name').value;
            const visitDate = noDateCheckbox.checked ? null : dateInput.value;
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
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
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
                city: currentCategory === 'filme' ? null : city,
                date: visitDate,
                ratings: ratings,
                average: Math.round(average * 10) / 10,
                timestamp: new Date().toISOString()
            };
            
            // Salvar no Supabase
            const success = await saveReview(newReview);
            
            if (success) {
                // Resetar formulário
                ratingForm.reset();
                document.querySelectorAll('.stars-container').forEach(container => {
                    container.dataset.value = '0';
                    const stars = container.querySelectorAll('.star');
                    updateStarsVisual(stars, 0);
                });
                
                // Voltar ao dashboard
                showScreen('dashboard-screen');
                
                // Feedback visual
                showNotification(`Avaliação salva!\n${placeName} - ${average}⭐`);
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }
});

// Atualizar dashboard com estatísticas
function updateDashboard() {
    const stats = {
        total: reviews.length,
        gelateria: reviews.filter(r => r.category === 'gelateria').length,
        restaurante: reviews.filter(r => r.category === 'restaurante').length,
        filme: reviews.filter(r => r.category === 'filme').length
    };
    
    const reviewsCount = document.getElementById('reviews-count');
    const gelateriaCount = document.getElementById('gelateria-count');
    const restauranteCount = document.getElementById('restaurante-count');
    const filmeCount = document.getElementById('filme-count');
    
    if (reviewsCount) reviewsCount.textContent = stats.total;
    if (gelateriaCount) gelateriaCount.textContent = stats.gelateria;
    if (restauranteCount) restauranteCount.textContent = stats.restaurante;
    if (filmeCount) filmeCount.textContent = stats.filme;

    // Atualiza o estado visual dos cards (opcional)
    const activeFilterCard = document.querySelector('.stat-card.active');
    if (activeFilterCard) {
        activeFilterCard.classList.remove('active');
    }
    const currentCard = document.getElementById(`${currentFilter}-card`);
    if (currentCard) {
        currentCard.classList.add('active');
    }
}

// Filtrar reviews
let currentFilter = 'all';

function filterReviews(filter) {
    currentFilter = filter;
    
    // Atualiza o estado visual dos cards de filtro
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.remove('active');
    });

    const activeCard = document.getElementById(`${filter}-card`);
    if (activeCard) {
        activeCard.classList.add('active');
    }

    displayReviews();
}

// Exibir reviews
function displayReviews() {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;
    
    let filteredReviews = reviews;
    
    if (currentFilter !== 'all') {
        filteredReviews = reviews.filter(review => review.category === currentFilter);
    }
    
    if (filteredReviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="empty-state">
                <p>Nenhum registro ainda!</p>
                <p>Que tal adicionar o primeiro?</p>
            </div>
        `;
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    filteredReviews.sort((a, b) => new Date(b.visit_date) - new Date(a.visit_date));
    
    reviewsList.innerHTML = filteredReviews.map(review => `
        <div class="review-card" onclick="showReviewDetails(${review.id})">
            <div class="review-header">
                <div class="review-name">${review.name}</div>
                <div class="review-date">${formatDate(review.visit_date)}</div>
            </div>
            <div class="review-user">${review.user_name === 'livia' ? 'Lívia' : 'Camila'}</div>
            <div class="review-location">${review.city ? '📍 ' + review.city : ''}</div>
            <div class="review-rating">
                <span class="rating-average">${review.average}⭐</span>
                <span style="color: #999; font-size: 14px;">${getCategoryIcon(review.category)} ${getCategoryName(review.category)}</span>
            </div>
        </div>
    `).join('');
}

// Mostrar detalhes da avaliação
function showReviewDetails(reviewId) {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;
    
    currentReviewId = reviewId;
    
    const detailsContent = document.getElementById('details-content');
    if (!detailsContent) return;
    
    // Gerar estrelas para cada critério
    const ratingsHtml = Object.entries(review.ratings).map(([key, rating]) => {
        const criterionLabel = getCriterionLabel(review.category, key);
        const starsHtml = Array.from({length: 5}, (_, i) => 
            `<span class="rating-star ${i < rating ? '' : 'empty'}">★</span>`
        ).join('');
        
        return `
            <div class="rating-item">
                <span class="rating-label">${criterionLabel}</span>
                <div class="rating-stars">${starsHtml}</div>
            </div>
        `;
    }).join('');
    
    detailsContent.innerHTML = `
        <div class="details-header">
            <h2 class="details-title">${review.name}</h2>
            <div class="details-subtitle">${review.city ? '📍 ' + review.city : ''}</div>
            <div class="details-subtitle">${formatDate(review.visit_date)}</div>
            <span class="details-user">${review.user_name === 'livia' ? 'Lívia' : 'Camila'}</span>
        </div>
        
        <div class="details-average">
            <div class="average-number">${review.average}⭐</div>
            <div class="average-label">Média Geral</div>
        </div>
        
        <div class="details-ratings">
            ${ratingsHtml}
        </div>
    `;
    
    showScreen('details-screen');
}

// Deletar avaliação
async function deleteReview() {
    if (!currentReviewId) return;
    
    if (confirm('Tem certeza que quer excluir esta avaliação?')) {
        const success = await deleteReviewFromDB(currentReviewId);
        
        if (success) {
            showNotification('Avaliação excluída!');
            showScreen('dashboard-screen');
            currentReviewId = null;
        }
    }
}

// Obter label do critério
function getCriterionLabel(category, key) {
    const criteria = ratingCriteria[category];
    const criterion = criteria.find(c => c.key === key);
    return criterion ? criterion.label : key;
}

// Funções auxiliares
function formatDate(dateString) {
    if (!dateString) return 'Data não informada';
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
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Carregar reviews do Supabase
    loadReviews();
    
    // Adicionar a classe 'active' no card de reviews para o estado inicial
    const initialCard = document.getElementById('reviews-card');
    if (initialCard) {
        initialCard.classList.add('active');
    }
    
    // Definir data de hoje por padrão
    const dateInput = document.getElementById('visit-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
});