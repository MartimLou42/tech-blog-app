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

// Write a line at the top of the page. This replaces the browser alert box
function showMessage(text) {
  document.getElementById("message").textContent = text;
}

// Build a button. Every button in the post list is made here
function makeButton(label, whenClicked) {
  const button = document.createElement("button");
  button.textContent = label;
  button.onclick = whenClicked;
  return button;
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
  document.getElementById("auth-container").classList.add("hidden");
  document.getElementById("app-container").classList.remove("hidden");
}

// Show the parts of the page that a visitor without an account needs
function showLoggedOut() {
  currentUser = null;
  token = null;
  editingPostId = null;
  confirmingDeleteId = null;
  localStorage.removeItem("authToken");
  document.getElementById("auth-container").classList.remove("hidden");
  document.getElementById("app-container").classList.add("hidden");
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

  showMessage("Account created. You can log in now.");
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
  showMessage(`Logged in as ${data.user.username}.`);
  fetchPosts();
}

// Log out. The server keeps no session, so the browser deletes the token
async function logout() {
  await fetch(`${API}/users/logout`, {
    method: "POST",
    headers: buildHeaders(),
  });

  showLoggedOut();
  showMessage("Logged out.");
  fetchPosts();
}

// Read the categories once, then fill both menus on the page
async function loadCategories() {
  const response = await fetch(`${API}/categories`);
  categories = await response.json();

  const filterMenu = document.getElementById("filter-category");
  const postMenu = document.getElementById("post-category");

  filterMenu.innerHTML = '<option value="">All categories</option>';
  postMenu.innerHTML = '<option value="">Choose a category</option>';

  categories.forEach((category) => {
    const option = `<option value="${category.id}">${category.category_name}</option>`;
    filterMenu.innerHTML += option;
    postMenu.innerHTML += option;
  });
}

// Draw one post as text, with the buttons that its author is allowed to use
function renderPost(item, post) {
  const categoryName = post.category
    ? post.category.category_name
    : "No category";

  item.innerHTML = `
    <h3>${post.title}</h3>
    <p>${post.content}</p>
    <small>${categoryName} | by ${post.postedBy} on ${new Date(
    post.createdOn
  ).toLocaleString()}</small>
  `;

  // Only the author of the post sees the buttons
  if (!currentUser || post.userId !== currentUser.id) {
    return;
  }

  // The delete question replaces the two buttons until the author answers
  if (post.id === confirmingDeleteId) {
    const question = document.createElement("small");
    question.textContent = "Delete this post?";
    item.appendChild(question);

    item.appendChild(makeButton("Yes, delete", () => deletePost(post.id)));
    item.appendChild(
      makeButton("Cancel", () => {
        confirmingDeleteId = null;
        fetchPosts();
      })
    );
    return;
  }

  item.appendChild(
    makeButton("Edit", () => {
      editingPostId = post.id;
      confirmingDeleteId = null;
      fetchPosts();
    })
  );

  item.appendChild(
    makeButton("Delete", () => {
      confirmingDeleteId = post.id;
      editingPostId = null;
      fetchPosts();
    })
  );
}

// Draw one post as a form, so the author can change it on the page
function renderEditForm(item, post) {
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

  item.appendChild(makeButton("Save", () => savePost(post.id)));
  item.appendChild(
    makeButton("Cancel", () => {
      editingPostId = null;
      fetchPosts();
    })
  );
}

// Read the posts. The menu decides whether the server filters by category
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
    container.innerHTML = "<p>No posts in this category yet.</p>";
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

// Write a new post. The server reads the author from the token
async function createPost() {
  const categoryId = document.getElementById("post-category").value;

  if (!categoryId) {
    showMessage("Choose a category first.");
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
    showMessage(data.message || "Unable to create the post");
    return;
  }

  document.getElementById("post-title").value = "";
  document.getElementById("post-content").value = "";
  showMessage("Post created.");
  fetchPosts();
}

// Send the edited post to the server. Only one edit form is open at a time
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
    showMessage(data.message || "Unable to update the post");
    return;
  }

  editingPostId = null;
  showMessage("Post updated.");
  fetchPosts();
}

// Delete one of your own posts, after the author answers the question
async function deletePost(id) {
  const response = await fetch(`${API}/posts/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    showMessage(data.message || "Unable to delete the post");
    return;
  }

  confirmingDeleteId = null;
  showMessage("Post deleted.");
  fetchPosts();
}

// When the page opens, load the categories and the posts. If a token is already
// in the browser, ask the server who it belongs to
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

  fetchPosts();
}

startPage();
