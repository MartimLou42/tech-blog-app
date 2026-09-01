// The API is on the same server as this page. A relative address works on your
// Mac and on Render, so there is no address to change before you deploy.
const API = "/api";

// The token and the logged-in user stay here while the page is open
let token = localStorage.getItem("authToken");
let currentUser = null;

// The categories, so the edit form can build its own menu
let categories = [];

// Which post is open for editing, and which post is waiting for a delete answer
let editingPostId = null;
let confirmingDeleteId = null;

// A review has no picture, so each genre gets its own colour block instead
const COVER_COLOURS = ["#ff412e", "#1d7a6b", "#e8b33c", "#6c5ce7", "#2f6f9f"];

// Write a line at the top of the page. This replaces the browser alert box
function showMessage(text) {
  document.getElementById("message").textContent = text;
}

// Build a button. Every button in the review list is made here
function makeButton(label, className, whenClicked) {
  const button = document.createElement("button");
  button.className = className;
  button.textContent = label;
  button.onclick = whenClicked;
  return button;
}

// Turn a date into the short newspaper form, for example 12 AUG 2026
function formatDate(value) {
  return new Date(value)
    .toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
}

// Build the headers for a request. Add the token only when a user is logged in
function buildHeaders() {
  const headers = { "Content-Type": "application/json" };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

// Show the parts of the page that a logged-in user needs
function showLoggedIn(user) {
  currentUser = user;
  document.getElementById("current-username").textContent = user.username;
  applyView();
}

// Show the parts of the page that a visitor without an account needs
function showLoggedOut() {
  currentUser = null;
  token = null;
  editingPostId = null;
  confirmingDeleteId = null;
  localStorage.removeItem("authToken");
  applyView();
}

// Create a new account
async function register() {
  const response = await fetch(`${API}/users`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      username: document.getElementById("username").value,
      email: document.getElementById("email").value,
      password: document.getElementById("password").value,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    showMessage(data.message || "Unable to register");
    return;
  }

  showMessage("Account created. You can sign in now.");
}

// Log in and keep the token inside the browser
async function login() {
  const response = await fetch(`${API}/users/login`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      email: document.getElementById("login-email").value,
      password: document.getElementById("login-password").value,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    showMessage(data.message || "Unable to log in");
    return;
  }

  token = data.token;
  localStorage.setItem("authToken", token);
  showLoggedIn(data.user);
  showMessage(`Signed in as ${data.user.username}.`);
  fetchPosts();
}

// Log out. The server keeps no session, so the browser deletes the token
async function logout() {
  await fetch(`${API}/users/logout`, {
    method: "POST",
    headers: buildHeaders(),
  });

  showLoggedOut();
  showMessage("Signed out.");
  fetchPosts();
}

// Read the categories once, then fill both menus on the page
async function loadCategories() {
  const response = await fetch(`${API}/categories`);
  categories = await response.json();

  const filterMenu = document.getElementById("filter-category");
  const postMenu = document.getElementById("post-category");

  filterMenu.innerHTML = '<option value="">All genres</option>';
  postMenu.innerHTML = '<option value="">Choose a genre</option>';

  categories.forEach((category) => {
    const option = `<option value="${category.id}">${category.category_name}</option>`;
    filterMenu.innerHTML += option;
    postMenu.innerHTML += option;
  });
}

// Draw one review as a card, with the buttons that its author is allowed to use
function renderPost(item, post) {
  item.className = "card";

  const genre = post.category ? post.category.category_name : "Unfiled";
  const colour = COVER_COLOURS[(post.categoryId - 1) % COVER_COLOURS.length];
  const excerpt =
    post.content.length > 150
      ? `${post.content.slice(0, 150).trim()}...`
      : post.content;

  item.innerHTML = `
    <a class="card-cover" href="#/review/${post.id}" style="background:${colour}">${genre}</a>
    <p class="card-meta">${formatDate(post.createdOn)} / by ${post.postedBy} / ${genre}</p>
    <h3 class="card-title"><a href="#/review/${post.id}">${post.title}</a></h3>
    <p class="card-excerpt">${excerpt}</p>
    <p class="card-more"><a href="#/review/${post.id}">Continue reading...</a></p>
  `;

  // Only the author of the review sees the buttons
  if (!currentUser || post.userId !== currentUser.id) {
    return;
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  // The delete question replaces the two buttons until the author answers
  if (post.id === confirmingDeleteId) {
    const question = document.createElement("span");
    question.className = "question";
    question.textContent = "Delete this review?";
    actions.appendChild(question);

    actions.appendChild(
      makeButton("Yes, delete", "button", () => deletePost(post.id))
    );
    actions.appendChild(
      makeButton("Cancel", "button ghost", () => {
        confirmingDeleteId = null;
        fetchPosts();
      })
    );
    item.appendChild(actions);
    return;
  }

  actions.appendChild(
    makeButton("Edit", "button ghost", () => {
      editingPostId = post.id;
      confirmingDeleteId = null;
      fetchPosts();
    })
  );

  actions.appendChild(
    makeButton("Delete", "button ghost", () => {
      confirmingDeleteId = post.id;
      editingPostId = null;
      fetchPosts();
    })
  );

  item.appendChild(actions);
}

// Draw one review as a form, so the author can change it on the page
function renderEditForm(item, post) {
  item.className = "card editing";

  const options = categories
    .map(
      (category) =>
        `<option value="${category.id}">${category.category_name}</option>`
    )
    .join("");

  item.innerHTML = `
    <input type="text" class="edit-title">
    <textarea class="edit-content"></textarea>
    <select class="edit-category">${options}</select>
  `;

  // Put the current values in with JavaScript, so quotes cannot break the HTML
  item.querySelector(".edit-title").value = post.title;
  item.querySelector(".edit-content").value = post.content;
  item.querySelector(".edit-category").value = post.categoryId;

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.appendChild(makeButton("Save", "button", () => savePost(post.id)));
  actions.appendChild(
    makeButton("Cancel", "button ghost", () => {
      editingPostId = null;
      fetchPosts();
    })
  );

  item.appendChild(actions);
}

// Read the reviews. The menu decides whether the server filters by genre
async function fetchPosts() {
  const categoryId = document.getElementById("filter-category").value;
  const address = categoryId
    ? `${API}/posts?categoryId=${categoryId}`
    : `${API}/posts`;

  const response = await fetch(address);
  const posts = await response.json();

  const container = document.getElementById("posts");
  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = '<p class="empty">No reviews in this genre yet.</p>';
    return;
  }

  posts.forEach((post) => {
    const item = document.createElement("div");

    if (post.id === editingPostId) {
      renderEditForm(item, post);
    } else {
      renderPost(item, post);
    }

    container.appendChild(item);
  });
}

// Write a new review. The server reads the author from the token
async function createPost() {
  const categoryId = document.getElementById("post-category").value;

  if (!categoryId) {
    showMessage("Choose a genre first.");
    return;
  }

  const response = await fetch(`${API}/posts`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify({
      title: document.getElementById("post-title").value,
      content: document.getElementById("post-content").value,
      categoryId: categoryId,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    showMessage(data.message || "Unable to publish the review");
    return;
  }

  document.getElementById("post-title").value = "";
  document.getElementById("post-content").value = "";
  showMessage("Review published.");
  fetchPosts();
}

// Send the edited review to the server. Only one edit form is open at a time
async function savePost(id) {
  const response = await fetch(`${API}/posts/${id}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({
      title: document.querySelector(".edit-title").value,
      content: document.querySelector(".edit-content").value,
      categoryId: document.querySelector(".edit-category").value,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    showMessage(data.message || "Unable to update the review");
    return;
  }

  editingPostId = null;
  showMessage("Review updated.");
  fetchPosts();
}

// Delete one of your own reviews, after the author answers the question
async function deletePost(id) {
  const response = await fetch(`${API}/posts/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    showMessage(data.message || "Unable to delete the review");
    return;
  }

  confirmingDeleteId = null;
  showMessage("Review deleted.");
  fetchPosts();
}

// Show either the list of reviews or one full review. The account panels only
// belong on the list, because a review page is for reading
function applyView() {
  const onDetail = readIdFromAddress() !== null;

  document.getElementById("list-view").classList.toggle("hidden", onDetail);
  document.getElementById("detail-view").classList.toggle("hidden", !onDetail);

  const auth = document.getElementById("auth-container");
  const write = document.getElementById("app-container");

  auth.classList.toggle("hidden", onDetail || currentUser !== null);
  write.classList.toggle("hidden", onDetail || currentUser === null);
}

// Read the review id out of an address like #/review/4. Return null on the list
function readIdFromAddress() {
  const match = window.location.hash.match(/^#\/review\/(\d+)$/);
  return match ? match[1] : null;
}

// Draw one full review, with its whole text
async function showOneReview(id) {
  const container = document.getElementById("detail-view");
  const response = await fetch(`${API}/posts/${id}`);

  if (!response.ok) {
    container.innerHTML = `
      <p class="back"><a href="#/">Back to all reviews</a></p>
      <h2 class="detail-title">Review not found</h2>
    `;
    return;
  }

  const post = await response.json();
  const genre = post.category ? post.category.category_name : "Unfiled";
  const colour = COVER_COLOURS[(post.categoryId - 1) % COVER_COLOURS.length];

  // Keep the paragraph breaks that the writer typed
  const paragraphs = post.content
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => `<p>${line}</p>`)
    .join("");

  container.innerHTML = `
    <p class="back"><a href="#/">Back to all reviews</a></p>
    <div class="detail-cover" style="background:${colour}">${genre}</div>
    <p class="card-meta">${formatDate(post.createdOn)} / by ${post.postedBy} / ${genre}</p>
    <h2 class="detail-title">${post.title}</h2>
    <div class="detail-body">${paragraphs}</div>
  `;
}

// Decide what to draw, from the address bar
async function route() {
  const id = readIdFromAddress();

  applyView();

  if (id) {
    await showOneReview(id);
    window.scrollTo(0, 0);
    return;
  }

  await fetchPosts();
}

// When the page opens, load the genres. If a token is already in the browser,
// ask the server who it belongs to, then draw whatever the address asks for
async function startPage() {
  await loadCategories();

  if (token) {
    const response = await fetch(`${API}/users/me`, {
      headers: buildHeaders(),
    });

    if (response.ok) {
      showLoggedIn(await response.json());
    } else {
      showLoggedOut();
    }
  }

  route();
}

// The browser Back and Forward buttons change the address, so listen for it
window.addEventListener("hashchange", route);

startPage();
