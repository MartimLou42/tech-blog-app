// The API is on the same server as this page. A relative address works on both
// Mac and Render, so there is no address to change before deploying.
const API = "/api";

// The token and the logged-in user stay here while the page is open
let token = localStorage.getItem("authToken");
let currentUser = null;

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
    alert(data.message || "Unable to register");
    return;
  }

  alert("Account created. You can log in now.");
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
    alert(data.message || "Unable to log in");
    return;
  }

  token = data.token;
  localStorage.setItem("authToken", token);
  showLoggedIn(data.user);
  fetchPosts();
}

// Log out. The server keeps no session, so the browser deletes the token
async function logout() {
  await fetch(`${API}/users/logout`, {
    method: "POST",
    headers: buildHeaders(),
  });

  showLoggedOut();
  fetchPosts();
}

// Fill both category menus from the database
async function loadCategories() {
  const response = await fetch(`${API}/categories`);
  const categories = await response.json();

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
    const categoryName = post.category
      ? post.category.category_name
      : "No category";

    item.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <small>${categoryName} | by ${post.postedBy} on ${new Date(
        post.createdOn,
      ).toLocaleString()}</small>
    `;

    // Show the two buttons only on the posts that this user wrote
    if (currentUser && post.userId === currentUser.id) {
      const editButton = document.createElement("button");
      editButton.textContent = "Edit";
      editButton.onclick = () => editPost(post);

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "Delete";
      deleteButton.onclick = () => deletePost(post.id);

      item.appendChild(editButton);
      item.appendChild(deleteButton);
    }

    container.appendChild(item);
  });
}

// Write a new post. The server reads the author from the token
async function createPost() {
  const categoryId = document.getElementById("post-category").value;

  if (!categoryId) {
    alert("Choose a category first.");
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
    alert(data.message || "Unable to create the post");
    return;
  }

  document.getElementById("post-title").value = "";
  document.getElementById("post-content").value = "";
  fetchPosts();
}

// Change one of your own posts
async function editPost(post) {
  const title = prompt("New title", post.title);

  if (title === null) {
    return;
  }

  const content = prompt("New content", post.content);

  if (content === null) {
    return;
  }

  const response = await fetch(`${API}/posts/${post.id}`, {
    method: "PUT",
    headers: buildHeaders(),
    body: JSON.stringify({ title, content }),
  });

  if (!response.ok) {
    const data = await response.json();
    alert(data.message || "Unable to update the post");
    return;
  }

  fetchPosts();
}

// Delete one of your own posts
async function deletePost(id) {
  if (!confirm("Delete this post?")) {
    return;
  }

  const response = await fetch(`${API}/posts/${id}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });

  if (!response.ok) {
    const data = await response.json();
    alert(data.message || "Unable to delete the post");
    return;
  }

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
