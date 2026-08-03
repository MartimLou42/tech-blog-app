// Import the database connection and the three database models
const sequelize = require("../config/connection");
const { User, Category, Post } = require("../models");

// Create all the sample data used while developing the application
const seedDatabase = async () => {
  // Delete the existing tables and rebuild them from the models
  await sequelize.sync({ force: true });

  // Create sample users before creating posts that belong to them
  const userOne = await User.create({
    username: "testuser1",
    email: "test1@example.com",
    password: "password123",
  });

  const userTwo = await User.create({
    username: "testuser2",
    email: "test2@example.com",
    password: "password123",
  });

  // Create the categories that will be assigned to the sample posts
  const javascriptCategory = await Category.create({
    category_name: "JavaScript",
  });

  const nodeCategory = await Category.create({
    category_name: "Node.js",
  });

  const databaseCategory = await Category.create({
    category_name: "Databases",
  });

  // Create posts and connect each one to a user and a category
  await Post.create({
    title: "Understanding JavaScript",
    content: "JavaScript makes web pages interactive.",
    postedBy: userOne.username,
    userId: userOne.id,
    categoryId: javascriptCategory.id,
  });

  await Post.create({
    title: "Building with Node.js",
    content: "Node.js lets JavaScript run on a server.",
    postedBy: userTwo.username,
    userId: userTwo.id,
    categoryId: nodeCategory.id,
  });

  await Post.create({
    title: "Working with MySQL",
    content: "MySQL stores the application's data.",
    postedBy: userOne.username,
    userId: userOne.id,
    categoryId: databaseCategory.id,
  });

  // Confirm that seeding finished and close the Node process
  console.log("Database seeded successfully");
  process.exit(0);
};

// Run the function to create the sample data
seedDatabase();
