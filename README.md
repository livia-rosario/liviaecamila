# 🌸 Lívia & Camila: Nossos Encontros  

Aplicativo criado por **Lívia** para registrar e compartilhar experiências em **gelaterias, restaurantes e filmes**, com sua namorada **Camila** .
A ideia é manter um espaço organizado para guardar memórias, dar notas e comparar avaliações.  

---

## ✨ Funcionalidades  

- **📌 Adicionar Registros**  
  - Categorias: **Gelateria**, **Restaurante** e **Filme**.  
  - Cada categoria tem critérios de avaliação específicos.  

- **⭐ Avaliações Personalizadas**  
  - Sistema de estrelas para avaliar critérios como **Sabor**, **Atendimento** e **Custo-Benefício**.  
  - Cálculo automático da nota média.  

- **📊 Visualizar e Filtrar Registros**  
  - Página inicial mostra o total de avaliações em cada categoria.  
  - Filtro por tipo: Gelaterias, Restaurantes, Filmes ou todos.  

- **🔍 Detalhes do Registro**  
  - Exibe todas as informações: quem avaliou, data, notas por critério e média final.  

- **🗑️ Excluir Registros**  
  - Remoção permanente de avaliações a partir da tela de detalhes.  

- **👩‍❤️‍👩 Usuários**  
  - Registros atribuídos a **Lívia** ou **Camila**.  
  - Possibilidade de ver avaliações individualmente ou em conjunto.  

---

## 🛠️ Estrutura do Projeto  

- **`index.html`** → Estrutura e telas do aplicativo.  
- **`style.css`** → Estilos, paleta de cores, tipografia e responsividade.  
- **`script.js`** → Lógica principal do app:  
  - Adicionar, visualizar, filtrar e excluir registros.  
  - Cálculo das notas.  
  - Conexão com o **Supabase**.  

---

## 🗄️ Persistência de Dados  

- Todas as avaliações ficam salvas no **Supabase**.  
- O app usa a **API REST** do Supabase para armazenar e buscar registros.  
- Benefícios:  
  - 🔒 Dados não se perdem.  
  - 🌐 Acesso em qualquer lugar.  
  - 📑 Organização centralizada.  
