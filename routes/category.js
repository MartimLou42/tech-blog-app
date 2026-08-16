// Create the category router and import the model and the token check
const router = require("express").Router();
const { Category } = require("../models");
const { authMiddleware } = require("../utils/auth");

// Get every category. The front end uses this to build the filter menu
router.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["category_name", "ASC"]],
    });

    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve categories",
      error: error.message,
    });
  }
});

// Get one category by its id
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ message: "No category found with this id" });
    }

    res.status(200).json(category);
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve category",
      error: error.message,
    });
  }
});

// Create a category. Only a logged-in user can do this
router.post("/", authMiddleware, async (req, res) => {
  try {
    const category = await Category.create({
      category_name: req.body.category_name,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({
      message: "Unable to create category",
      error: error.message,
    });
  }
});

// Rename a category. Only a logged-in user can do this
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ message: "No category found with this id" });
    }

    await category.update({ category_name: req.body.category_name });

    res.status(200).json(category);
  } catch (error) {
    res.status(400).json({
      message: "Unable to update category",
      error: error.message,
    });
  }
});

// Delete a category. Only a logged-in user can do this
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res
        .status(404)
        .json({ message: "No category found with this id" });
    }

    await category.destroy();

    res.status(204).end();
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete category",
      error: error.message,
    });
  }
});

module.exports = router;
