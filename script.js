// Configuração do Supabase
const supabaseUrl = 'https://riscuqhqbkzlzsqzmtaa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2N1cWhxYmt6bHpzcXptdGFhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MTYzNTgsImV4cCI6MjA3Mzk5MjM1OH0.llaXtLrm1IfF4m3y8Hc_vL8_Yzrczk8nPwL5G-q5-Q4';
const { createClient } = supabase;
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// Estado da aplicação
let currentUser = null;
let currentCategory = null;
let currentReviewId = null;
let reviews = [];
let experiences = [];
let currentFilter = 'all';

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

// Carregar reviews
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

// Carregar experiências
async function loadExperiences() {
  try {
    const { data, error } = await supabaseClient
      .from('experiences')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao carregar experiências:', error);
      return;
    }
    experiences = data || [];
  } catch (err) {
    console.error('Erro de conexão ao carregar experiências:', err);
  }
}

// Salvar review
async function saveReview(reviewData) {
  try {
    const { error } = await supabaseClient
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
        timestamp: reviewData.timestamp,
        comments: reviewData.comments
      }]);

    if (error) {
      console.error('Erro ao salvar:', error);
      showNotification('Erro ao salvar avaliação!');
      return false;
    }
    await loadReviews();
    return true;
  } catch (error) {
    console.error('Erro na conexão:', error);
    showNotification('Erro de conexão!');
    return false;
  }
}

// Deletar review
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
    await loadReviews();
    return true;
  } catch (error) {
    console.error('Erro na conexão:', error);
    showNotification('Erro de conexão!');
    return false;
  }
}

// Navegação
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');

  if (screenId === 'dashboard-screen') loadReviews();
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

// Configurar formulário
function setupForm(category) {
  const formTitle = document.getElementById('form-title');
  const ratingFields = document.getElementById('rating-fields');
  const cityGroup = document.getElementById('city-group');

  const titles = { gelateria: 'Gelateria', restaurante: 'Restaurante', filme: 'Filme' };
  formTitle.textContent = titles[category];

  if (category === 'filme') {
    cityGroup.style.display = 'none';
    document.getElementById('city').removeAttribute('required');
  } else {
    cityGroup.style.display = 'flex';
    document.getElementById('city').removeAttribute('required');
  }

  ratingFields.innerHTML = '';
  ratingCriteria[category].forEach(c => {
    ratingFields.appendChild(createRatingGroup(c.key, c.label));
  });

  const dateInput = document.getElementById('visit-date');
  const noDateCheckbox = document.getElementById('no-date-checkbox');
  if (dateInput && noDateCheckbox) {
    dateInput.value = new Date().toISOString().split('T')[0];
    dateInput.disabled = false;
    noDateCheckbox.checked = false;
  }

  document.getElementById('comments').value = '';

  // Atualizar datalist com experiências da categoria
// Atualizar datalist com experiências da categoria
const datalist = document.getElementById('place-suggestions');
if (datalist) {
  datalist.innerHTML = '';
  experiences
    .filter(exp => exp.category === category)
    .forEach(exp => {
      const option = document.createElement('option');
      option.value = exp.name;
      datalist.appendChild(option);
    });
}
}

// Criar grupo de estrelas
function createRatingGroup(key, label) {
  const div = document.createElement('div');
  div.className = 'form-group rating-group';
  div.innerHTML = `
    <label class="form-label">${label}</label>
    <div class="stars-container" data-rating="${key}" data-value="0">
      ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}">★</span>`).join('')}
    </div>`;
  const starsContainer = div.querySelector('.stars-container');
  const stars = div.querySelectorAll('.star');

  stars.forEach((star, index) => {
    star.addEventListener('click', () => {
      starsContainer.dataset.value = index+1;
      updateStarsVisual(stars, index+1);
    });
    star.addEventListener('mouseenter', () => updateStarsVisual(stars, index+1, true));
  });
  starsContainer.addEventListener('mouseleave', () => {
    updateStarsVisual(stars, parseInt(starsContainer.dataset.value) || 0);
  });
  return div;
}

function updateStarsVisual(stars, rating, isHover=false) {
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

function updateDashboard() {
  // Agrupar por experiência
  const grouped = {};
  reviews.forEach(r => {
    const key = `${r.category}_${r.name.toLowerCase()}`;
    if (!grouped[key]) grouped[key] = r; // só precisa 1 por experiência
  });

  const experiencesArr = Object.values(grouped);

  const stats = {
    total: experiencesArr.length,
    gelateria: experiencesArr.filter(r => r.category === 'gelateria').length,
    restaurante: experiencesArr.filter(r => r.category === 'restaurante').length,
    filme: experiencesArr.filter(r => r.category === 'filme').length
  };

  document.getElementById('reviews-count').textContent = stats.total;
  document.getElementById('gelateria-count').textContent = stats.gelateria;
  document.getElementById('restaurante-count').textContent = stats.restaurante;
  document.getElementById('filme-count').textContent = stats.filme;
}


// Filtrar
function filterReviews(filter) {
  currentFilter = filter;
  displayReviews();
}

function displayReviews() {
  const reviewsList = document.getElementById('reviews-list');
  if (!reviewsList) return;

  let filtered = currentFilter === 'all' ? reviews : reviews.filter(r => r.category === currentFilter);

  if (filtered.length === 0) {
    reviewsList.innerHTML = `<div class="empty-state"><p>Nenhum registro ainda!</p></div>`;
    return;
  }

  // Agrupar por experiência (categoria + nome)
  const grouped = {};
  filtered.forEach(r => {
    const key = `${r.category}_${r.name.toLowerCase()}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  // Renderizar cards agrupados
  reviewsList.innerHTML = Object.values(grouped).map(group => {
    const first = group[0];

    // bloco com cada user + nota
    const usersHtml = group.map(r => `
      <div class="user-line">
        <span class="user-badge ${r.user_name}">${r.user_name === 'livia' ? 'Lívia' : 'Camila'}</span>
        <span class="user-rating">${r.average}⭐</span>
      </div>
    `).join('');

    return `
      <div class="review-card" onclick="showExperienceDetails('${first.category}','${first.name}')">
        <div class="review-header-row">
          <span class="exp-name">${first.name}</span>
          <span class="exp-category">${getCategoryIcon(first.category)} ${getCategoryName(first.category)}</span>
        </div>
        <div class="users-block">
          ${usersHtml}
        </div>
      </div>
    `;
  }).join('');
}

// Mostrar detalhes de uma experiência
function showExperienceDetails(category, name) {
  const group = reviews.filter(r => r.category===category && r.name.toLowerCase()===name.toLowerCase());
  const detailsContent = document.getElementById('details-content');
  detailsContent.innerHTML = `
    <div class="details-header">
      <h2 class="details-title">${name}</h2>
      <div class="details-subtitle">${getCategoryIcon(category)} ${getCategoryName(category)}</div>
    </div>
    ${group.map(r=>{
      const starsHtml = Object.entries(r.ratings).map(([key, rating])=>{
        const label = getCriterionLabel(r.category,key);
        const stars = Array.from({length:5},(_,i)=>`<span class="rating-star ${i<rating?'':'empty'}">★</span>`).join('');
        return `<div class="rating-item"><span>${label}</span><div>${stars}</div></div>`;
      }).join('');
      return `
        <div class="user-review-block">
          <h3>${r.user_name==='livia'?'Lívia':'Camila'}</h3>
          <div class="user-average">${r.average}⭐</div>
          ${r.comments?`<p>"${r.comments}"</p>`:''}
          <div class="user-ratings">${starsHtml}</div>
        </div>`;
    }).join('')}
  `;
  showScreen('details-screen');
}

// Deletar
async function deleteReview() {
  if (!currentReviewId) return;
  if (confirm('Excluir esta avaliação?')) {
    const success = await deleteReviewFromDB(currentReviewId);
    if (success) {
      showNotification('Avaliação excluída!');
      showScreen('dashboard-screen');
    }
  }
}

// Helpers
function getCriterionLabel(category,key){
  const c = ratingCriteria[category].find(c=>c.key===key);
  return c?c.label:key;
}
function formatDate(d){ if(!d) return 'Data não informada'; try{ const dt=new Date(d); return dt.toLocaleDateString('pt-BR'); } catch{ return 'Data não informada'; } }
function getCategoryIcon(c){ return {gelateria:'🍨',restaurante:'🍴',filme:'🎬'}[c]||''; }
function getCategoryName(c){ return {gelateria:'Gelateria',restaurante:'Restaurante',filme:'Filme'}[c]||c; }

// Notificação
function showNotification(msg){
  const existing=document.querySelector('.notification'); if(existing) existing.remove();
  const n=document.createElement('div');
  n.className='notification';
  n.style.cssText=`position:fixed;top:20px;right:20px;background:#F26C4F;color:#fff;padding:12px 16px;border-radius:8px;z-index:1000;`;
  n.textContent=msg; document.body.appendChild(n);
  setTimeout(()=>{ if(n.parentNode) n.parentNode.removeChild(n); },3000);
}

// Inicialização
document.addEventListener('DOMContentLoaded',()=>{
  loadReviews();
  loadExperiences();

  const ratingForm=document.getElementById('rating-form');
  const dateInput=document.getElementById('visit-date');
  const noDateCheckbox=document.getElementById('no-date-checkbox');
  if(noDateCheckbox && dateInput){
    noDateCheckbox.addEventListener('change',function(){
      if(this.checked){ dateInput.value=''; dateInput.disabled=true; }
      else{ dateInput.disabled=false; dateInput.value=new Date().toISOString().split('T')[0]; }
    });
  }

  if(ratingForm){
    ratingForm.addEventListener('submit',async function(e){
      e.preventDefault();
      const placeName=document.getElementById('place-name').value;
      const visitDate=noDateCheckbox && noDateCheckbox.checked?null:dateInput.value;
      let city=document.getElementById('city').value.trim();
      if(city==='') city=null;
      const comments=document.getElementById('comments').value||null;

      const ratingContainers=document.querySelectorAll('.stars-container');
      const ratings={}; let allRated=true;
      ratingContainers.forEach(c=>{
        const k=c.dataset.rating; const v=parseInt(c.dataset.value)||0;
        if(v===0) allRated=false; ratings[k]=v;
      });
      if(!allRated){ alert('Por favor, avalie todos os critérios!'); return; }

      const ratingValues=Object.values(ratings);
      const average=ratingValues.reduce((a,b)=>a+b,0)/ratingValues.length;

      const newReview={
        id:Date.now(),
        user:currentUser,
        category:currentCategory,
        name:placeName,
        city:currentCategory==='filme'?null:city,
        date:visitDate,
        ratings,
        average:Math.round(average*10)/10,
        timestamp:new Date().toISOString(),
        comments
      };
      const success=await saveReview(newReview);
      if(success){
        ratingForm.reset();
        document.querySelectorAll('.stars-container').forEach(c=>{
          c.dataset.value='0'; updateStarsVisual(c.querySelectorAll('.star'),0);
        });
        showScreen('dashboard-screen');
        showNotification(`Avaliação salva!\n${placeName} - ${average}⭐`);
      }
    });
  }

// Formulário de experiências
const experienceForm = document.getElementById('experience-form');
if (experienceForm) {
  experienceForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const category = document.getElementById('experience-category').value;
    const name = document.getElementById('experience-name').value.trim();

    if (!category || !name) {
      alert('Preencha todos os campos!');
      return;
    }

    // 🔎 Verificação antes de salvar
    const exists = experiences.some(exp =>
      exp.category === category && exp.name.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      showNotification('⚠️ Essa experiência já existe!');
      return;
    }

    try {
      const { error } = await supabaseClient.from('experiences').insert([{ category, name }]);
      if (error) {
        console.error(error);
        showNotification('Erro ao salvar experiência!');
      } else {
        showNotification('Experiência adicionada!');
        experienceForm.reset();
        await loadExperiences();
        showScreen('home-screen');
      }
        } catch (err) {
          console.error(err);
          showNotification('Erro de conexão!');
        }
      });
    }
    });