/**
 * Enterprise Redis Cache & Session Management
 * Fisher Backflows - High-Performance Caching Layer
 */

import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';
import { monitoring } from '@/lib/monitoring/monitoring';

// ═══════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
  compress?: boolean;
  serialize?: boolean;
}

export interface SessionData {
  userId: string;
  email?: string;
  role?: string;
  organizationId?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
  lastActivity: number;
  createdAt: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: string;
  connectedClients: number;
}

export interface LockOptions {
  ttl?: number; // Lock TTL in milliseconds
  retries?: number;
  retryDelay?: number;
}

// ═══════════════════════════════════════════════════════════════════════
// REDIS CONNECTION MANAGER
// ═══════════════════════════════════════════════════════════════════════

class RedisConnectionManager {
  private static instance: RedisConnectionManager;
  private primaryClient: Redis | null = null;
  private replicaClient: Redis | null = null;
  private pubSubClient: Redis | null = null;
  private isConnected = false;
  private connectionAttempts = 0;
  private readonly maxRetries = 10;
  private readonly retryDelay = 2000;

  static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  async initialize() {
    if (this.isConnected) return;

    try {
      const redisConfig = this.getRedisConfig();
      
      // Primary client for read/write operations
      this.primaryClient = new Redis(redisConfig.primary);
      
      // Replica client for read operations (if available)
      if (redisConfig.replica) {
        this.replicaClient = new Redis(redisConfig.replica);
      }
      
      // Pub/Sub client
      this.pubSubClient = new Redis(redisConfig.primary);

      await this.setupEventHandlers();
      await this.testConnection();
      
      this.isConnected = true;
      this.connectionAttempts = 0;
      
      logger.info('Redis connected successfully', {
        primary: redisConfig.primary.host,
        replica: redisConfig.replica?.host,
        db: redisConfig.primary.db
      });

      // Start health monitoring
      this.startHealthMonitoring();

    } catch (error) {
      this.connectionAttempts++;
      logger.error('Redis connection failed', { 
        error, 
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries 
      });

      if (this.connectionAttempts < this.maxRetries) {
        setTimeout(() => {
          this.initialize();
        }, this.retryDelay * Math.pow(2, Math.min(this.connectionAttempts, 5)));
      }
      
      throw error;
    }
  }

  private getRedisConfig() {
    const redisUrl = process.env.REDIS_URL;
    const redisPassword = process.env.REDIS_PASSWORD;
    const redisTLS = process.env.REDIS_TLS_ENABLED === 'true';

    if (!redisUrl) {
      throw new Error('Redis URL not configured');
    }

    const baseConfig = {
      lazyConnect: true,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      showFriendlyErrorStack: process.env.NODE_ENV === 'development',
      password: redisPassword,
      connectTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000'),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
      ...(redisTLS && {
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      })
    };

    // Parse Redis URL
    const url = new URL(redisUrl);
    
    return {
      primary: {
        ...baseConfig,
        host: url.hostname,
        port: parseInt(url.port) || 6379,
        db: parseInt(url.pathname.slice(1)) || 0
      },
      replica: process.env.REDIS_REPLICA_URL ? {
        ...baseConfig,
        ...this.parseRedisUrl(process.env.REDIS_REPLICA_URL)
      } : null
    };
  }

  private parseRedisUrl(url: string) {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 6379,
      db: parseInt(parsed.pathname.slice(1)) || 0
    };
  }

  private async setupEventHandlers() {
    if (!this.primaryClient) return;

    this.primaryClient.on('connect', () => {
      logger.debug('Redis primary connected');
      monitoring.metrics.increment('redis.connections.primary');
    });

    this.primaryClient.on('error', (error) => {
      logger.error('Redis primary error', { error });
      monitoring.captureError(error);
      this.isConnected = false;
    });

    this.primaryClient.on('close', () => {
      logger.warn('Redis primary connection closed');
      this.isConnected = false;
    });

    if (this.replicaClient) {
      this.replicaClient.on('error', (error) => {
        logger.error('Redis replica error', { error });
        monitoring.captureError(error);
      });
    }

    if (this.pubSubClient) {
      this.pubSubClient.on('error', (error) => {
        logger.error('Redis pub/sub error', { error });
        monitoring.captureError(error);
      });
    }
  }

  private async testConnection() {
    if (!this.primaryClient) throw new Error('Primary client not initialized');
    
    await this.primaryClient.ping();
    
    if (this.replicaClient) {
      try {
        await this.replicaClient.ping();
      } catch (error) {
        logger.warn('Redis replica connection failed, using primary only', { error });
        this.replicaClient = null;
      }
    }
  }

  private startHealthMonitoring() {
    setInterval(async () => {
      try {
        if (this.primaryClient && this.isConnected) {
          const info = await this.primaryClient.info('memory');
          const memoryUsage = this.parseRedisInfo(info).used_memory_human;
          monitoring.metrics.gauge('redis.memory_usage_bytes', 
            parseInt(memoryUsage.replace(/[^\d]/g, '')));
        }
      } catch (error) {
        logger.error('Redis health check failed', { error });
      }
    }, 30000); // Every 30 seconds
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    info.split('\r\n').forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    });
    return result;
  }

  getPrimaryClient(): Redis {
    if (!this.primaryClient || !this.isConnected) {
      throw new Error('Redis not connected');
    }
    return this.primaryClient;
  }

  getReplicaClient(): Redis {
    return this.replicaClient || this.getPrimaryClient();
  }

  getPubSubClient(): Redis {
    if (!this.pubSubClient || !this.isConnected) {
      throw new Error('Redis pub/sub not connected');
    }
    return this.pubSubClient;
  }

  async disconnect() {
    await Promise.all([
      this.primaryClient?.quit(),
      this.replicaClient?.quit(),
      this.pubSubClient?.quit()
    ]);
    
    this.primaryClient = null;
    this.replicaClient = null;
    this.pubSubClient = null;
    this.isConnected = false;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CACHE SERVICE
// ═══════════════════════════════════════════════════════════════════════

export class CacheService {
  private connectionManager: RedisConnectionManager;
  private defaultTTL: number;
  private keyPrefix: string;
  private compressionThreshold: number;

  constructor() {
    this.connectionManager = RedisConnectionManager.getInstance();
    this.defaultTTL = parseInt(process.env.CACHE_DEFAULT_TTL || '3600');
    this.keyPrefix = process.env.CACHE_KEY_PREFIX || 'fisher:';
    this.compressionThreshold = 1024; // Compress values larger than 1KB
  }

  async initialize() {
    await this.connectionManager.initialize();
  }

  private buildKey(key: string, prefix?: string): string {
    return `${this.keyPrefix}${prefix ? `${prefix}:` : ''}${key}`;
  }

  private async compress(value: string): Promise<string> {
    if (value.length < this.compressionThreshold) return value;
    
    try {
      const zlib = await import('zlib');
      const compressed = zlib.gzipSync(value);
      return `gzip:${compressed.toString('base64')}`;
    } catch (error) {
      logger.warn('Compression failed, storing uncompressed', { error });
      return value;
    }
  }

  private async decompress(value: string): Promise<string> {
    if (!value.startsWith('gzip:')) return value;
    
    try {
      const zlib = await import('zlib');
      const compressed = Buffer.from(value.slice(5), 'base64');
      return zlib.gunzipSync(compressed).toString();
    } catch (error) {
      logger.error('Decompression failed', { error });
      return value;
    }
  }

  private serialize(value: any, options: CacheOptions): string {
    if (options.serialize === false) return value;
    
    const serialized = JSON.stringify({
      data: value,
      timestamp: Date.now(),
      type: typeof value
    });
    
    return options.compress !== false ? 
      this.compress(serialized) : 
      Promise.resolve(serialized);
  }

  private async deserialize(value: string, options: CacheOptions): Promise<any> {
    try {
      const decompressed = await this.decompress(value);
      
      if (options.serialize === false) return decompressed;
      
      const parsed = JSON.parse(decompressed);
      return parsed.data;
    } catch (error) {
      logger.error('Cache deserialization failed', { error, value: value.slice(0, 100) });
      return null;
    }
  }

  async get<T = any>(key: string, options: CacheOptions = {}): Promise<T | null> {
    try {
      const client = this.connectionManager.getReplicaClient();
      const fullKey = this.buildKey(key, options.prefix);
      
      const start = performance.now();
      const value = await client.get(fullKey);
      const duration = performance.now() - start;
      
      monitoring.metrics.timing('cache.get.duration', duration);
      
      if (value === null) {
        monitoring.metrics.increment('cache.miss');
        return null;
      }
      
      monitoring.metrics.increment('cache.hit');
      const deserialized = await this.deserialize(value, options);
      
      return deserialized;
    } catch (error) {
      logger.error('Cache get failed', { error, key });
      monitoring.captureError(error as Error);
      return null;
    }
  }

  async set(
    key: string, 
    value: any, 
    ttl?: number, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      const fullKey = this.buildKey(key, options.prefix);
      const serialized = await this.serialize(value, options);
      const expiry = ttl || options.ttl || this.defaultTTL;
      
      const start = performance.now();
      await client.setex(fullKey, expiry, serialized);
      const duration = performance.now() - start;
      
      monitoring.metrics.timing('cache.set.duration', duration);
      monitoring.metrics.increment('cache.set');
      
      return true;
    } catch (error) {
      logger.error('Cache set failed', { error, key });
      monitoring.captureError(error as Error);
      return false;
    }
  }

  async del(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      const fullKey = this.buildKey(key, options.prefix);
      
      const result = await client.del(fullKey);
      monitoring.metrics.increment('cache.delete');
      
      return result > 0;
    } catch (error) {
      logger.error('Cache delete failed', { error, key });
      monitoring.captureError(error as Error);
      return false;
    }
  }

  async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
    try {
      const client = this.connectionManager.getReplicaClient();
      const fullKey = this.buildKey(key, options.prefix);
      
      const result = await client.exists(fullKey);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists check failed', { error, key });
      return false;
    }
  }

  async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      const fullKey = this.buildKey(key, options.prefix);
      
      const result = await client.expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      logger.error('Cache expire failed', { error, key });
      return false;
    }
  }

  async increment(key: string, amount = 1, options: CacheOptions = {}): Promise<number | null> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      const fullKey = this.buildKey(key, options.prefix);
      
      const result = await client.incrby(fullKey, amount);
      
      // Set TTL if it's a new key
      if (result === amount && (options.ttl || this.defaultTTL)) {
        await client.expire(fullKey, options.ttl || this.defaultTTL);
      }
      
      return result;
    } catch (error) {
      logger.error('Cache increment failed', { error, key });
      return null;
    }
  }

  async getMultiple(keys: string[], options: CacheOptions = {}): Promise<Record<string, any>> {
    try {
      const client = this.connectionManager.getReplicaClient();
      const fullKeys = keys.map(key => this.buildKey(key, options.prefix));
      
      const values = await client.mget(...fullKeys);
      const result: Record<string, any> = {};
      
      for (let i = 0; i < keys.length; i++) {
        const value = values[i];
        if (value !== null) {
          result[keys[i]] = await this.deserialize(value, options);
        }
      }
      
      monitoring.metrics.increment('cache.mget', 1, [`keys:${keys.length}`]);
      
      return result;
    } catch (error) {
      logger.error('Cache multi-get failed', { error, keys });
      return {};
    }
  }

  async setMultiple(
    data: Record<string, any>, 
    ttl?: number, 
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      const pipeline = client.pipeline();
      
      for (const [key, value] of Object.entries(data)) {
        const fullKey = this.buildKey(key, options.prefix);
        const serialized = await this.serialize(value, options);
        pipeline.setex(fullKey, ttl || options.ttl || this.defaultTTL, serialized);
      }
      
      await pipeline.exec();
      monitoring.metrics.increment('cache.mset', 1, [`keys:${Object.keys(data).length}`]);
      
      return true;
    } catch (error) {
      logger.error('Cache multi-set failed', { error });
      return false;
    }
  }

  async flush(pattern?: string): Promise<boolean> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      
      if (pattern) {
        const keys = await client.keys(`${this.keyPrefix}${pattern}`);
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } else {
        await client.flushdb();
      }
      
      monitoring.metrics.increment('cache.flush');
      return true;
    } catch (error) {
      logger.error('Cache flush failed', { error, pattern });
      return false;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const client = this.connectionManager.getReplicaClient();
      const info = await client.info('stats');
      const memory = await client.info('memory');
      const clients = await client.info('clients');
      
      const stats = this.connectionManager['parseRedisInfo'](info);
      const memoryStats = this.connectionManager['parseRedisInfo'](memory);
      const clientStats = this.connectionManager['parseRedisInfo'](clients);
      
      const hits = parseInt(stats.keyspace_hits || '0');
      const misses = parseInt(stats.keyspace_misses || '0');
      
      return {
        hits,
        misses,
        hitRate: hits + misses > 0 ? (hits / (hits + misses)) * 100 : 0,
        totalKeys: parseInt(stats.keys || '0'),
        memoryUsage: memoryStats.used_memory_human || '0B',
        connectedClients: parseInt(clientStats.connected_clients || '0')
      };
    } catch (error) {
      logger.error('Failed to get cache stats', { error });
      return {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalKeys: 0,
        memoryUsage: '0B',
        connectedClients: 0
      };
    }
  }

  // Distributed locking
  async acquireLock(
    key: string, 
    options: LockOptions = {}
  ): Promise<string | null> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      const lockKey = this.buildKey(`lock:${key}`);
      const lockValue = `${Date.now()}_${Math.random()}`;
      const ttl = options.ttl || 30000; // 30 seconds default
      
      const result = await client.set(
        lockKey, 
        lockValue, 
        'PX', 
        ttl, 
        'NX'
      );
      
      if (result === 'OK') {
        monitoring.metrics.increment('cache.lock.acquired');
        return lockValue;
      }
      
      // Retry logic
      const retries = options.retries || 3;
      const delay = options.retryDelay || 100;
      
      for (let i = 0; i < retries; i++) {
        await new Promise(resolve => setTimeout(resolve, delay));
        const retryResult = await client.set(lockKey, lockValue, 'PX', ttl, 'NX');
        if (retryResult === 'OK') {
          monitoring.metrics.increment('cache.lock.acquired');
          return lockValue;
        }
      }
      
      monitoring.metrics.increment('cache.lock.failed');
      return null;
    } catch (error) {
      logger.error('Lock acquisition failed', { error, key });
      return null;
    }
  }

  async releaseLock(key: string, lockValue: string): Promise<boolean> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      const lockKey = this.buildKey(`lock:${key}`);
      
      // Use Lua script for atomic release
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      
      const result = await client.eval(script, 1, lockKey, lockValue);
      monitoring.metrics.increment('cache.lock.released');
      
      return result === 1;
    } catch (error) {
      logger.error('Lock release failed', { error, key });
      return false;
    }
  }

  async ping(): Promise<boolean> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      const result = await client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis ping failed', { error });
      return false;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// SESSION MANAGER
// ═══════════════════════════════════════════════════════════════════════

export class SessionManager {
  private cache: CacheService;
  private defaultTTL: number;

  constructor(cache: CacheService) {
    this.cache = cache;
    this.defaultTTL = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '120') * 60;
  }

  async createSession(sessionId: string, data: SessionData): Promise<boolean> {
    const sessionData = {
      ...data,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    const success = await this.cache.set(
      `session:${sessionId}`,
      sessionData,
      this.defaultTTL
    );

    if (success) {
      monitoring.metrics.increment('sessions.created');
      // Track active sessions
      await this.cache.increment('sessions:active:count', 1, { ttl: this.defaultTTL });
    }

    return success;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await this.cache.get<SessionData>(`session:${sessionId}`);
    
    if (session) {
      // Update last activity
      session.lastActivity = Date.now();
      await this.cache.set(`session:${sessionId}`, session, this.defaultTTL);
      monitoring.metrics.increment('sessions.accessed');
    }

    return session;
  }

  async updateSession(sessionId: string, data: Partial<SessionData>): Promise<boolean> {
    const existingSession = await this.cache.get<SessionData>(`session:${sessionId}`);
    
    if (!existingSession) {
      return false;
    }

    const updatedSession = {
      ...existingSession,
      ...data,
      lastActivity: Date.now()
    };

    return await this.cache.set(`session:${sessionId}`, updatedSession, this.defaultTTL);
  }

  async destroySession(sessionId: string): Promise<boolean> {
    const success = await this.cache.del(`session:${sessionId}`);
    
    if (success) {
      monitoring.metrics.increment('sessions.destroyed');
      await this.cache.increment('sessions:active:count', -1);
    }

    return success;
  }

  async destroyUserSessions(userId: string): Promise<number> {
    // This would require scanning for user sessions - not implemented for performance
    // In a real implementation, you'd maintain a user->sessions mapping
    logger.warn('destroyUserSessions not implemented - requires user session mapping');
    return 0;
  }

  async extendSession(sessionId: string): Promise<boolean> {
    return await this.cache.expire(`session:${sessionId}`, this.defaultTTL);
  }

  async getActiveSessions(): Promise<number> {
    const count = await this.cache.get<number>('sessions:active:count');
    return count || 0;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PUBSUB SERVICE
// ═══════════════════════════════════════════════════════════════════════

export class PubSubService {
  private connectionManager: RedisConnectionManager;
  private subscribers: Map<string, Set<(message: any) => void>> = new Map();

  constructor() {
    this.connectionManager = RedisConnectionManager.getInstance();
  }

  async publish(channel: string, message: any): Promise<number> {
    try {
      const client = this.connectionManager.getPrimaryClient();
      const serialized = JSON.stringify(message);
      
      const result = await client.publish(channel, serialized);
      monitoring.metrics.increment('pubsub.publish');
      
      return result;
    } catch (error) {
      logger.error('PubSub publish failed', { error, channel });
      return 0;
    }
  }

  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    try {
      const client = this.connectionManager.getPubSubClient();
      
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, new Set());
        
        await client.subscribe(channel);
        
        client.on('message', (receivedChannel: string, message: string) => {
          if (receivedChannel === channel) {
            try {
              const parsed = JSON.parse(message);
              const callbacks = this.subscribers.get(channel);
              callbacks?.forEach(cb => cb(parsed));
              monitoring.metrics.increment('pubsub.message_received');
            } catch (error) {
              logger.error('PubSub message parse failed', { error, channel, message });
            }
          }
        });
      }
      
      this.subscribers.get(channel)!.add(callback);
      monitoring.metrics.increment('pubsub.subscribe');
    } catch (error) {
      logger.error('PubSub subscribe failed', { error, channel });
    }
  }

  async unsubscribe(channel: string, callback?: (message: any) => void): Promise<void> {
    try {
      const callbacks = this.subscribers.get(channel);
      
      if (callbacks) {
        if (callback) {
          callbacks.delete(callback);
        }
        
        if (!callback || callbacks.size === 0) {
          const client = this.connectionManager.getPubSubClient();
          await client.unsubscribe(channel);
          this.subscribers.delete(channel);
        }
      }
      
      monitoring.metrics.increment('pubsub.unsubscribe');
    } catch (error) {
      logger.error('PubSub unsubscribe failed', { error, channel });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// EXPORT SERVICES
// ═══════════════════════════════════════════════════════════════════════

export const cache = new CacheService();
export const sessions = new SessionManager(cache);
export const pubsub = new PubSubService();

// Initialize cache service
cache.initialize().catch(error => {
  logger.error('Cache service initialization failed', { error });
});

export default {
  cache,
  sessions,
  pubsub
};