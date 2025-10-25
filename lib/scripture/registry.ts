import type { Passage, PassageReference, ScriptureSearchResult, TranslationAdapter, TranslationCode } from './types';
import { webTranslationAdapter } from './webTranslation';

type AdapterMap = Map<TranslationCode, TranslationAdapter>;

class TranslationRegistry {
  private adapters: AdapterMap = new Map();

  register(adapter: TranslationAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  getAdapter(code: TranslationCode) {
    const adapter = this.adapters.get(code);
    if (!adapter) {
      throw new Error(`No scripture adapter registered for translation "${code}".`);
    }
    return adapter;
  }

  async getPassage(code: TranslationCode, reference: PassageReference): Promise<Passage | null> {
    const adapter = this.getAdapter(code);
    return adapter.getPassage(reference);
  }

  async search(code: TranslationCode, query: string, options?: { limit?: number }): Promise<ScriptureSearchResult[]> {
    const adapter = this.getAdapter(code);
    return adapter.search(query, options);
  }
}

const registry = new TranslationRegistry();
registry.register(webTranslationAdapter);

export { registry as scriptureRegistry };
