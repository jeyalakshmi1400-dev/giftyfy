const Category = require("../models/Category");

// GET ALL CATEGORIES
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// CREATE CATEGORY (ADMIN)
const createCategory = async (req, res) => {
  try {
    const { category, subcategory, code, date } = req.body;

    // Check whether category already exists
    const existingCategory = await Category.findOne({ category });

    let image = "";

    if (existingCategory) {
      // Existing category -> use same image
      image = existingCategory.image;
    } else {
      // New category -> uploaded image
      image = req.file ? req.file.filename : "";
    }

    const newCategory = new Category({
      category,
      subcategory,
      code,
      date,
      image,
      status: "Active",
    });

    await newCategory.save();

    res.status(201).json(newCategory);
  } catch (error) {
    console.log("ERROR 👉", error.message);
    res.status(500).json({ message: error.message });
  }
};

const toggleCategoryStatus = async (req,res)=>{
  try{


    const category = await Category.findById(req.params.id);


    if(!category){
      return res.status(404).json({message:"Category not Found"});
    }


    if(!category.status){
        category.status="Active";

    }

    category.status= category.status === "Active" ? "Blocked" : "Active";

    await category.save();
    res.json(category);

  }catch(error){
    console.log(error);
    res.status(500).json({message:error.message});
  }
};

const updateCategory = async (req, res) => {
  try {
    const { category, subcategory, code, date } = req.body;

    const currentCategory = await Category.findById(req.params.id);

    if (!currentCategory) {
      return res.status(404).json({ message: "Category not found" });
    }

    let image = currentCategory.image;

    // If category changed
    if (category !== currentCategory.category) {
      const existingCategory = await Category.findOne({
        category,
      });

      if (existingCategory) {
        // Copy existing category image
        image = existingCategory.image;
      } else if (req.file) {
        // New category + uploaded image
        image = req.file.filename;
      }
    } else if (req.file) {
      // Same category -> admin wants to change image
      image = req.file.filename;
    }

    const updated = await Category.findByIdAndUpdate(
      req.params.id,
      {
        category,
        subcategory,
        code,
        date,
        image,
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const deleteCategory = async(req,res)=>{
  try{
    const category = await Category.findByIdAndDelete(req.params.id);

    if(!category){
      return res.status(404).json({message:"Not Found"});
    }
    res.json({message:"Deleted Successfully"});
  }catch(error){
    console.log(error);
    res.status(500).json({message:error.message});
  }
};

module.exports = {
  getCategories,
  createCategory,
  toggleCategoryStatus,
  updateCategory,
  deleteCategory
};