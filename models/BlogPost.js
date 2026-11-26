import mongoose from 'mongoose';

const BlogPostSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, required: true },
    title: { type: String, required: true },
    excerpt: { type: String, default: '' },
    category: { type: String, default: 'General' },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    content: { type: String, default: '' },
    published: { type: Boolean, default: true },
    type: { type: String, enum: ['article', 'blog'], default: 'article' },
    link: { type: String, default: '/book-consultation' },
    buttonText: { type: String, default: 'Click here' },
  },
  { timestamps: true }
);

// Always use the latest schema (avoids stale cached model dropping new fields like link/buttonText under --watch)
if (mongoose.models.BlogPost) {
  mongoose.deleteModel('BlogPost');
}
export const BlogPost = mongoose.model('BlogPost', BlogPostSchema);
