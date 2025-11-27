const Instructor = require('../models/Instructor');

// Get all instructors
exports.getAllInstructors = async (req, res) => {
  try {
    const instructors = await Instructor.find({ isActive: true }).sort({ order: 1 });
    
    res.json({
      success: true,
      data: instructors
    });
  } catch (error) {
    console.error('Get instructors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching instructors',
      error: error.message
    });
  }
};

// Get single instructor
exports.getInstructorById = async (req, res) => {
  try {
    const { id } = req.params;
    const instructor = await Instructor.findById(id);
    
    if (!instructor || !instructor.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found'
      });
    }
    
    res.json({
      success: true,
      data: instructor
    });
  } catch (error) {
    console.error('Get instructor error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching instructor',
      error: error.message
    });
  }
};
