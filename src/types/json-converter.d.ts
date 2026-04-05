/**
 * Type definitions for JSON to key-value pair conversion utilities
 */

// Primitive JSON value types (shallow, not including nested objects)
export type JsonPrimitiveValue = string | number | boolean | null;

// A shallow JSON object (values are primitives or null, not nested objects)
export type JsonObject = Record<string, JsonPrimitiveValue>;

// A nested JSON object that needs stringification
export type JsonNestedObject = Record<string, unknown>;

/**
 * A single key-value pair for form data
 */
export interface KeyValuePair {
  key: string;
  value: string;
}

/**
 * Configuration options for JsonKeyValueConverter
 */
export interface JsonKeyValueOptions {
  /** Maximum depth before stringifying nested objects (default: 1) */
  maxDepth?: number;
  /** Keys that should always be stringified as JSON even if shallow */
  forceStringifyKeys?: string[];
  /** Custom serializers for specific key types */
  serializers?: Record<string, (value: unknown) => string>;
}

/**
 * Internal resolved options with defaults
 */
export interface ResolvedJsonKeyValueOptions {
  maxDepth: number;
  forceStringifyKeys: string[];
  serializers: Record<string, (value: unknown) => string>;
}
