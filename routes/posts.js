import { Router } from 'express';
import mongoose from 'mongoose';
import { BlogPost } from '../models/BlogPost.js';
import { requireAdmin } from '../middleware/auth.js';
import { deleteFromCloudinary } from '../config/cloudinary.js';
import { connectDB } from '../config/db.js';

const router = Router();

// GET /api/posts - Get blog posts
router.get('/', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    const showAll = req.query.all === 'true';
    const filter = showAll ? {} : { published: true };

    if (req.query.type) {
      if (req.query.type === 'article') {
        filter.$or = [{ type: 'article' }, { type: { $exists: false } }, { type: null }, { type: '' }];
      } else if (req.query.type === 'blog') {
        filter.type = 'blog';
      }
    }
    const posts = await BlogPost.find(filter).sort({ date: -1, createdAt: -1 }).lean();
    return res.json({ posts });
  } catch (err) {
    console.error('[Posts] Fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve blog posts', posts: [] });
  }
});

// GET /api/posts/:id - Get single blog post by id or slug
router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findOne({
      $or: [{ id: req.params.id }, { slug: req.params.id }],
    }).lean();

    if (!post) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    return res.json({ post });
  } catch (err) {
    console.error('[Posts] Get single error:', err);
    return res.status(500).json({ error: 'Failed to retrieve blog post' });
  }
});

// POST /api/posts - Create or update blog post (Admin protected)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const postData = req.body || {};
    if (!postData.id || !postData.title) {
      return res.status(400).json({ error: 'Post id and title are required' });
    }

    // Strip immutable / internal fields that break findOneAndUpdate ($set _id)
    const {
      _id,
      __v,
      createdAt,
      updatedAt,
      ...rest
    } = postData;

    const linkRaw = typeof rest.link === 'string' ? rest.link.trim() : '';
    const buttonTextRaw = typeof rest.buttonText === 'string' ? rest.buttonText.trim() : '';

    const payload = {
      ...rest,
      id: String(postData.id),
      title: String(postData.title),
      // Always persist CTA fields explicitly so they are never dropped
      link: linkRaw || '/book-consultation',
      buttonText: buttonTextRaw || 'Click here',
    };

    const updated = await BlogPost.findOneAndUpdate(
      { id: payload.id },
      { $set: payload },
      { returnDocument: 'after', upsert: true, runValidators: true }
    );

    return res.json({ success: true, post: updated });
  } catch (err) {
    console.error('[Posts] Upsert error:', err);
    return res.status(500).json({ error: 'Failed to save blog post' });
  }
});

// DELETE /api/posts/:id - Delete blog post (Admin protected)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const post = await BlogPost.findOne({ id: req.params.id });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Clean up Cloudinary asset if available
    if (post.imagePublicId) {
      await deleteFromCloudinary(post.imagePublicId);
    }

    await BlogPost.deleteOne({ id: req.params.id });
    return res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('[Posts] Delete error:', err);
    return res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

export default router;
