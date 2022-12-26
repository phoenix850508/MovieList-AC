const BASE_URL = 'https://movie-list.alphacamp.io'
const INDEX_URL = BASE_URL + '/api/v1/movies/'
const POSTER_URL = BASE_URL + '/posters/'
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const paginator = document.querySelector('#paginator')
const moviesPerPage = 12;

const movies = [];
let filterMovies = [];
const dataPanel = document.querySelector('#data-panel');
const displayFormat = document.querySelector('#display-format');
let currentPage = 1;

// 渲染電影清單
function renderMovieList(data) {
  let rawHTML = '';
  const state = JSON.parse(localStorage.getItem('view')) || '';
  if (state === "list") {
    data.forEach((item) => {
      rawHTML += `<div class="column m-2">
        <hr>
        <div class="row justify-content-start">
          <h9 class="list-title col-6">${item.title}</h9>
          <div class="btns col-sm-1">
            <div class="row flex-nowrap">
              <button class="col btn btn-primary btn-show-movie me-1" data-bs-toggle="modal"
                data-bs-target="#movie-modal" data-id=${item.id}>More</button>
              <button class="col btn btn-outline-danger btn-add-favorite" data-id=${item.id}>+</button>
            </div>
          </div>
        </div>
      </div>`

    })
    dataPanel.innerHTML = rawHTML;
    buttonAdded();
  }
  else {
    data.forEach((item) => {
      rawHTML += `<div class="col-sm-3">
        <div class="mb-2">
          <div class="card">
            <img
              src="${POSTER_URL + item.image}"
              class="card-img-top" alt="Movie Poster" />
            <div class="card-body">
              <h5 class="card-title">${item.title}</h5>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary btn-show-movie" data-bs-toggle="modal"
                data-bs-target="#movie-modal" data-id=${item.id}>More</button>
              <button class="btn btn-outline-danger btn-add-favorite" data-id=${item.id}>+</button>
            </div>
          </div>
        </div>
      </div>`;
    })
  }
  dataPanel.innerHTML = rawHTML;
  buttonAdded();
}

// 初始畫面渲染
axios
  .get(INDEX_URL)
  .then(response => {
    movies.push(...response.data.results);
    renderMovieList(getMoviesByPage(1));
    renderPaginator(movies.length);
    paginator.children[0].classList.add("active");
  })

  .catch((error) => {
    console.warn(error);
  });

// 點擊電影資料顯示
function showMovieModal(id) {
  const modalDate = document.querySelector('#movie-modal-date');
  const modalTitle = document.querySelector('#movie-modal-title');
  const modalDescription = document.querySelector('#movie-modal-description');
  const modalImage = document.querySelector('#movie-modal-image');

  axios
    .get(INDEX_URL + id)
    .then(response => {
      const data = response.data.results;
      modalDate.innerText = 'Release Date: ' + data.release_date;
      modalTitle.innerText = data.title;
      modalDescription.innerText = data.description;
      modalImage.innerHTML = `<img src="${POSTER_URL + data.image}" alt="movie poster"
                class="image-fluid">`
    })

    .catch((error) => {
      console.warn(error);
    });
}

// 電影加入我的最愛
function addToFavorite(id) {
  const movie = movies.find(movie => movie.id === id)
  const list = JSON.parse(localStorage.getItem('favoriteMovies')) || [];
  if (list.some(movie => movie.id === id)) {
    return alert("This movie is already in the favorite list!")
  }
  list.push(movie);
  localStorage.setItem('favoriteMovies', JSON.stringify(list));
}

// 監聽器安裝，包括電影詳細資料顯示、以及加入到我的最愛
addEventListener('click', function onPanelClick(event) {
  if (event.target.matches('.btn-show-movie')) {
    showMovieModal(Number(event.target.dataset.id));
  }
  if (event.target.matches('.btn-add-favorite')) {
    if (event.target.matches('.active')) {
      event.target.classList.remove("active");
      removeFavorite(Number(event.target.dataset.id));
      return alert("This movie has been removed from the Favorite Movies list")
    }
    addToFavorite(Number(event.target.dataset.id));
    buttonAdded();
  }
})

// 電影名稱查詢
searchForm.addEventListener("submit", function onSearchFormSubmitted(event) {
  event.preventDefault();
  const keyword = searchInput.value.trim().toLowerCase();
  if (!keyword.length) {
    return alert("Please enter a valid string");
  }
  filterMovies = movies.filter(movie => movie.title.toLowerCase().includes(keyword));
  if (filterMovies.length < 1) return alert("No user found!");
  renderPaginator(filterMovies.length);
  renderMovieList(getMoviesByPage(1));
})

// 分頁資料分割處理
function getMoviesByPage(page) {
  const data = filterMovies.length ? filterMovies : movies;
  const trimStart = (page - 1) * moviesPerPage;
  const trimEnd = trimStart + moviesPerPage;
  return data.slice(trimStart, trimEnd);
}

// 渲染頁碼
function renderPaginator(amount) {
  const numberOfPages = Math.ceil(amount / moviesPerPage);
  let rawPageHTML = '';
  for (let i = 1; i <= numberOfPages; i++) {
    rawPageHTML += `<li class="page-item"><a class="page-link" href="#" data-page=${i}>${i}</a></li>`
  }
  paginator.innerHTML = rawPageHTML;
}

// 監聽器安裝，頁面切換
paginator.addEventListener("click", function onPageinatorClick(event) {
  if (event.target.tagName !== "A") return
  for (let i = 0; i < paginator.children.length; i++) {
    paginator.children[i].classList.remove("active");
  }
  event.target.parentElement.classList.add("active");
  const page = Number(event.target.dataset.page);
  currentPage = page;
  renderMovieList(getMoviesByPage(page));
})

// list/card view切換
function switchViewMethod(viewMethod) {
  let state = JSON.parse(localStorage.getItem("view")) || "";
  if (viewMethod === state) return;
  state = viewMethod;
  localStorage.setItem("view", JSON.stringify(state));
}

// 監聽器安裝，改變state狀態
displayFormat.addEventListener("click", function viewMethodOnClick(event) {
  if (event.target.matches(".display-list")) {
    switchViewMethod("list");
    renderMovieList(getMoviesByPage(currentPage));
  } else if (event.target.matches(".display-card")) {
    switchViewMethod("card");
    renderMovieList(getMoviesByPage(currentPage));
  }
});

// 加到我的最愛後按鈕功能改變，因為card和list的DOM結構不同，下方判斷式也會判斷該頁的電影資訊是以card或是list view呈現來改變按鈕狀態
function buttonAdded() {
  const state = JSON.parse(localStorage.getItem("view")) || "";
  const moviesOnPage = state === "list" ? document.querySelectorAll('.list-title') : document.querySelectorAll('.card-title');
  const addedMovies = JSON.parse(localStorage.getItem('favoriteMovies')) || [];
  for (let i = 0; i < moviesOnPage.length; i++) {
    addedMovies.forEach(movie => {
      if (moviesOnPage[i].textContent === movie.title) {
        if (state === "list") {
          let btn = moviesOnPage[i].nextElementSibling.children[0].lastElementChild
          btn.classList.add("active");
        }
        else if (state === "card") {
          let btn = moviesOnPage[i].parentElement.nextElementSibling.lastElementChild
          btn.classList.add("active");
        }
      }
    })
  }
}

// 電影從我的最愛清單移除
function removeFavorite(id) {
  const addedMovies = JSON.parse(localStorage.getItem('favoriteMovies')) || [];
  const movieIndex = addedMovies.findIndex(movie => movie.id === id);
  addedMovies.splice(movieIndex, 1);
  localStorage.setItem('favoriteMovies', JSON.stringify(addedMovies));
}