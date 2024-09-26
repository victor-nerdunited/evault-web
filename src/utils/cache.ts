import NodeCache from "node-cache";

class CacheService {
  private readonly _cache: NodeCache;

  constructor() {
    this._cache = new NodeCache({
      stdTTL: 30 // 30s
    });    
  }

  public get<T>(key: string): T | undefined {
    return this._cache.get<T>(key);
  }

  public has(key: string): boolean {
    return this._cache.has(key);
  }

  public set<T>(key: string, value: T, ttl: number = 30): boolean {
    return this._cache.set(key, value, ttl);
  }
}

export default new CacheService();