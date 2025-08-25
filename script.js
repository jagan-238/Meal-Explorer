// DOM Elements
const searchBar = document.getElementById('searchBar');
const suggestions = document.getElementById('suggestions');
const categoryFilter = document.getElementById('categoryFilter');
const sortBy = document.getElementById('sortBy');
const mealGrid = document.getElementById('mealGrid');
const loader = document.getElementById('loader');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageNum = document.getElementById('pageNum');

let allMeals = []; // will store all meals
let currentPage = 1;
const mealsPerPage = 16; // 4x4 grid
const maxPages = 10; // max 10 pages
let debounceTimeout;
let throttleTimeout;

// ---------------------- FETCH MULTIPLE MEALS ----------------------
async function fetchAllMeals() {
  showLoader();
  allMeals = [];

  try {
    // Fetch meals for each letter a-z
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    for (let letter of letters) {
      const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?f=${letter}`);
      const data = await res.json();
      if (data.meals) allMeals.push(...data.meals);
      if (allMeals.length >= mealsPerPage * maxPages) break; // limit 10 pages
    }
    allMeals = allMeals.slice(0, mealsPerPage * maxPages); // max 160 items
    hideLoader();
    displayMeals();
    populateCategories();
  } catch (err) {
    hideLoader();
    console.error("Error fetching meals:", err);
  }
}

// ---------------------- POPULATE CATEGORIES ----------------------
function populateCategories() {
  const categories = [...new Set(allMeals.map(m => m.strCategory))];
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });
}

// ---------------------- DISPLAY MEALS ----------------------
function displayMeals() {
  mealGrid.innerHTML = '';

  // Filter by category
  let filteredMeals = categoryFilter.value
    ? allMeals.filter(m => m.strCategory === categoryFilter.value)
    : [...allMeals];

  // Sort by name
  if (sortBy.value === 'name-asc') filteredMeals.sort((a, b) => a.strMeal.localeCompare(b.strMeal));
  else if (sortBy.value === 'name-desc') filteredMeals.sort((a, b) => b.strMeal.localeCompare(a.strMeal));

  // Pagination
  const totalPages = Math.min(maxPages, Math.ceil(filteredMeals.length / mealsPerPage));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * mealsPerPage;
  const end = start + mealsPerPage;
  const paginatedMeals = filteredMeals.slice(start, end);

  if (paginatedMeals.length === 0) {
    mealGrid.innerHTML = '<p style="text-align:center; font-size:18px;">No meals found.</p>';
    return;
  }

  // Create meal cards
  paginatedMeals.forEach(meal => {
    const card = document.createElement('div');
    card.className = 'meal-card';
    card.innerHTML = `
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}">
      <h3>${meal.strMeal}</h3>
      <p>${meal.strCategory}</p>
    `;
    mealGrid.appendChild(card);
  });

  pageNum.textContent = currentPage;
}

// ---------------------- PAGINATION WITH THROTTLING ----------------------
function changePage(increment) {
  if (throttleTimeout) return;
  throttleTimeout = setTimeout(() => throttleTimeout = null, 200);

  const filteredMeals = categoryFilter.value
    ? allMeals.filter(m => m.strCategory === categoryFilter.value)
    : [...allMeals];

  const totalPages = Math.min(maxPages, Math.ceil(filteredMeals.length / mealsPerPage));

  currentPage += increment;
  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;
  displayMeals();
}

prevBtn.addEventListener('click', () => changePage(-1));
nextBtn.addEventListener('click', () => changePage(1));

// ---------------------- SEARCH WITH DEBOUNCE ----------------------
searchBar.addEventListener('input', () => {
  clearTimeout(debounceTimeout);
  debounceTimeout = setTimeout(() => {
    const val = searchBar.value.trim().toLowerCase();
    if (!val) {
      displayMeals();
      showSuggestions();
      return;
    }
    const filtered = allMeals.filter(m => m.strMeal.toLowerCase().includes(val));
    allMeals = filtered.slice(0, mealsPerPage * maxPages);
    currentPage = 1;
    displayMeals();
    showSuggestions();
  }, 500);
});

// ---------------------- SUGGESTIONS DROPDOWN ----------------------
function showSuggestions() {
  const val = searchBar.value.trim().toLowerCase();
  if (!val) return suggestions.classList.add('hidden');

  const filtered = allMeals.filter(m => m.strMeal.toLowerCase().includes(val)).slice(0, 5);
  if (filtered.length === 0) return suggestions.classList.add('hidden');

  suggestions.innerHTML = '';
  filtered.forEach(meal => {
    const li = document.createElement('li');
    li.textContent = meal.strMeal;
    li.addEventListener('click', () => {
      searchBar.value = meal.strMeal;
      allMeals = [meal]; // show only this meal
      currentPage = 1;
      displayMeals();
      suggestions.classList.add('hidden');
    });
    suggestions.appendChild(li);
  });
  suggestions.classList.remove('hidden');
}

// ---------------------- FILTER & SORT ----------------------
categoryFilter.addEventListener('change', () => {
  currentPage = 1;
  displayMeals();
});
sortBy.addEventListener('change', displayMeals);

// ---------------------- LOADER ----------------------
function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }

// ---------------------- INITIALIZE ----------------------
fetchAllMeals();

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!searchBar.contains(e.target)) suggestions.classList.add('hidden');
});
