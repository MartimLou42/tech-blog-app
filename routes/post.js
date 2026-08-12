// Create the post router and import the models and the token check
const router = require("express").Router();
const { Post, User, Category } = require("../models");
const { authMiddleware } = require("../utils/auth");

// Every route that returns posts sends back the author and the category too
const postIncludes = [
  { model: User, attributes: ["id", "username"] },
  { model: Category, as: "category", attributes: ["id", "category_name"] },
];

// Get every post, or only the posts inside one category
router.get("/", async (req, res) => {
  try {
    // Build a filter only when the request asks for a category
    const where = {};
    if (req.query.categoryId) {
      where.categoryId = req.query.categoryId;
    }

    const posts = await Post.findAll({
      where,
      include: postIncludes,
      order: [["createdOn", "DESC"]],
    });

    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve posts",
      error: error.message,
    });
  }
});

// Get one post by its id
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, { include: postIncludes });

    if (!post) {
      return res.status(404).json({ message: "No post found with this id" });
    }

    res.status(200).json(post);
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve post",
      error: error.message,
    });
  }
});

// Create a post. The author comes from the token, never from the request body
router.post("/", authMiddleware, async (req, res) => {
  try {
    const post = await Post.create({
      title: req.body.title,
      content: req.body.content,
      categoryId: req.body.categoryId,
      postedBy: req.user.username,
      userId: req.user.id,
    });

    res.status(201).json(post);
  } catch (error) {
    res.status(400).json({
      message: "Unable to create post",
      error: error.message,
    });
  }
});

// Update a post, but only when the token owner wrote it
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "No post found with this id" });
    }

    if (post.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only edit your own posts" });
    }

    // Keep the old value for any field that the request did not send
    await post.update({
      title: req.body.title ?? post.title,
      content: req.body.content ?? post.content,
      categoryId: req.body.categoryId ?? post.categoryId,
    });

    res.status(200).json(post);
  } catch (error) {
    res.status(400).json({
      message: "Unable to update post",
      error: error.message,
    });
  }
});

// Delete a post, but only when the token owner wrote it
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "No post found with this id" });
    }

    if (post.userId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    await post.destroy();

    res.status(204).end();
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete post",
      error: error.message,
    });
  }
});

module.exports = router;
