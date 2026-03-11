// Use the project cloudinary config (ensures .config() is called with env vars)
const { cloudinary } = require('../config/cloudinary');

/**
 * List sub-folders at a given Cloudinary path.
 * Query: ?prefix=elearning   (default: '' → root)
 */
const listFolders = async (req, res) => {
  try {
    const prefix = req.query.prefix ?? '';
    const result = prefix
      ? await cloudinary.api.sub_folders(prefix, { max_results: 100 })
      : await cloudinary.api.root_folders({ max_results: 100 });

    res.json({ success: true, folders: result.folders });
  } catch (err) {
    console.error('listFolders error:', err?.error ?? err);
    res.status(500).json({ success: false, message: err?.error?.message || 'Failed to list folders' });
  }
};

/**
 * List resources (images) inside a Cloudinary folder.
 * Query: ?folder=elearning/testimonials&next_cursor=&max_results=30
 */
const listResources = async (req, res) => {
  try {
    const folder = req.query.folder || 'elearning';
    const nextCursor = req.query.next_cursor || undefined;
    const maxResults = Math.min(parseInt(req.query.max_results) || 30, 100);

    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder + '/',
      max_results: maxResults,
      next_cursor: nextCursor,
      context: true,
      metadata: true,
      resource_type: 'image',
    });

    res.json({
      success: true,
      resources: result.resources,
      next_cursor: result.next_cursor ?? null,
      rate_limit_remaining: result.rate_limit_remaining
    });
  } catch (err) {
    console.error('listResources error:', err?.error ?? err);
    res.status(500).json({ success: false, message: err?.error?.message || 'Failed to list resources' });
  }
};

/**
 * Create a new Cloudinary folder.
 * Body: { path: "elearning/new-folder" }
 */
const createFolder = async (req, res) => {
  try {
    const { path: folderPath } = req.body;
    if (!folderPath) return res.status(400).json({ success: false, message: 'path is required' });

    const result = await cloudinary.api.create_folder(folderPath);
    res.json({ success: true, folder: result });
  } catch (err) {
    console.error('createFolder error:', err?.error ?? err);
    res.status(500).json({ success: false, message: err?.error?.message || 'Failed to create folder' });
  }
};

/**
 * Delete an empty Cloudinary folder.
 * Body: { path: "elearning/old-folder" }
 */
const deleteFolder = async (req, res) => {
  try {
    const { path: folderPath } = req.body;
    if (!folderPath) return res.status(400).json({ success: false, message: 'path is required' });

    await cloudinary.api.delete_folder(folderPath);
    res.json({ success: true, message: `Folder '${folderPath}' deleted` });
  } catch (err) {
    console.error('deleteFolder error:', err?.error ?? err);
    res.status(500).json({ success: false, message: err?.error?.message || 'Failed to delete folder' });
  }
};

/**
 * Delete a single Cloudinary asset.
 * Body: { publicId: "elearning/testimonials/nguyen-anh" }
 */
const deleteResource = async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return res.status(400).json({ success: false, message: 'publicId is required' });

    const result = await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    if (result.result === 'ok' || result.result === 'not found') {
      return res.json({ success: true, result: result.result });
    }
    res.status(400).json({ success: false, message: `Cloudinary returned: ${result.result}` });
  } catch (err) {
    console.error('deleteResource error:', err?.error ?? err);
    res.status(500).json({ success: false, message: err?.error?.message || 'Failed to delete resource' });
  }
};

/**
 * Generate a signed upload signature so the browser can upload directly to Cloudinary.
 * Body: { folder: "elearning/testimonials", publicId?: "my-image" }
 */
const getUploadSignature = async (req, res) => {
  try {
    const folder = req.body.folder || 'elearning';
    const publicId = req.body.publicId || undefined;

    const timestamp = Math.round(Date.now() / 1000);
    const paramsToSign = { folder, timestamp };
    if (publicId) paramsToSign.public_id = publicId;

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      success: true,
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      folder
    });
  } catch (err) {
    console.error('getUploadSignature error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate signature' });
  }
};

module.exports = {
  listFolders,
  listResources,
  createFolder,
  deleteFolder,
  deleteResource,
  getUploadSignature
};
