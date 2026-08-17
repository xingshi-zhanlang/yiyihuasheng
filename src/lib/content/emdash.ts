import { getEmDashCollection, getEmDashEntry } from 'emdash';
import { productFromCmsEntry } from './normalize';
import type { ContentRepository } from './types';

export const emdashProductRepository: ContentRepository = {
  async listProducts() {
    const result = await getEmDashCollection('products', { status: 'published' });
    if (result.error) throw result.error;
    return result.entries.map(productFromCmsEntry);
  },

  async getProductBySlug(slug) {
    const result = await getEmDashEntry('products', slug);
    if (result.error) throw result.error;
    return result.entry ? productFromCmsEntry(result.entry) : null;
  },
};
