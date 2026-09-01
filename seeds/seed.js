// Import the database connection and the three database models
const sequelize = require("../config/connection");
const { User, Category, Post } = require("../models");

// Create all the sample data used while developing the application
const seedDatabase = async () => {
  // Delete the existing tables and rebuild them from the models
  await sequelize.sync({ force: true });

  // Create the two writers before creating the reviews that belong to them
  const martim = await User.create({
    username: "martim",
    email: "test1@example.com",
    password: "password123",
  });

  const jules = await User.create({
    username: "jules",
    email: "test2@example.com",
    password: "password123",
  });

  // Genres double as the categories that the filter menu uses
  const [roguelike, rpg, strategy, horror, platformer] = await Promise.all([
    Category.create({ category_name: "Roguelike" }),
    Category.create({ category_name: "RPG" }),
    Category.create({ category_name: "Strategy" }),
    Category.create({ category_name: "Horror" }),
    Category.create({ category_name: "Platformer" }),
  ]);

  // Space the reviews a week apart so the blog looks like it has a history
  const weeksAgo = (weeks) =>
    new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

  // Create the reviews and connect each one to a writer and a genre
  await Post.bulkCreate([
    {
      title: "Hades II makes you glad you died",
      content:
        "Most roguelikes treat a run ending as a punishment. This one treats it as a scene change. You lose, you walk back through the same rooms, and somebody new has something to say to you. Two hundred deaths in and I am still meeting people. The combat is sharp enough that I would play it without the story, and the story is good enough that I would read it without the combat.",
      postedBy: martim.username,
      userId: martim.id,
      categoryId: roguelike.id,
      createdOn: weeksAgo(0),
    },
    {
      title: "Baldur's Gate 3 still has not let me leave",
      content:
        "I have put ninety hours into this and I am in act two. Not because it is slow, but because every door I open turns into an hour. I once spent a full evening resolving an argument between two characters I could have walked past. The game noticed. It brought it up later. That is the trick, and almost nothing else does it.",
      postedBy: jules.username,
      userId: jules.id,
      categoryId: rpg.id,
      createdOn: weeksAgo(1),
    },
    {
      title: "Against the Storm is a spreadsheet that hugs you",
      content:
        "On paper this is a city builder about supply chains in the rain. In practice it is the most relaxing game I own. Runs are short, failure costs you nothing, and every settlement teaches you one more thing about how the pieces fit. I put it on when I want to think about something that is not my job.",
      postedBy: martim.username,
      userId: martim.id,
      categoryId: strategy.id,
      createdOn: weeksAgo(2),
    },
    {
      title: "Signalis is the best horror game nobody told you about",
      content:
        "It looks like a lost PlayStation disc and it is smarter than almost everything released this decade. The scares are not jump scares. They are the slow understanding of what happened here, delivered in fragments you have to hold in your head. I finished it at two in the morning and then sat still for a while.",
      postedBy: jules.username,
      userId: jules.id,
      categoryId: horror.id,
      createdOn: weeksAgo(3),
    },
    {
      title: "Celeste is a mountain and also a mood",
      content:
        "The jumping is perfect. That would be enough. But the reason people still talk about this one is that the difficulty and the story are the same thing, and the game knows it. There is an assist menu that lets you change the rules, and using it is not cheating. That is a kinder design than most games manage.",
      postedBy: martim.username,
      userId: martim.id,
      categoryId: platformer.id,
      createdOn: weeksAgo(4),
    },
    {
      title: "Dredge turns fishing into a bad idea",
      content:
        "You catch fish. You sell fish. You upgrade your boat so you can catch stranger fish further out. Then the sun goes down and the game stops being about fishing. It is a short game that respects your time and never explains more than it needs to, which is exactly why the last hour lands.",
      postedBy: jules.username,
      userId: jules.id,
      categoryId: horror.id,
      createdOn: weeksAgo(5),
    },
  ]);

  // Confirm that seeding finished and close the Node process
  console.log("Database seeded successfully");
  process.exit(0);
};

// Run the function to create the sample data
seedDatabase();
