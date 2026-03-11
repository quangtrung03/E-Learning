const Testimonial = require('../models/Testimonial');

// Get all testimonials (public)
exports.getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .select('name slug role comment rating avatarUrl order');

    res.json({
      success: true,
      data: testimonials
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching testimonials',
      error: error.message
    });
  }
};

// Get testimonial profile by slug (public)
exports.getTestimonialBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const testimonial = await Testimonial.findOne({ slug, isActive: true });

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }

    res.json({
      success: true,
      data: testimonial
    });
  } catch (error) {
    console.error('Get testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching testimonial',
      error: error.message
    });
  }
};
