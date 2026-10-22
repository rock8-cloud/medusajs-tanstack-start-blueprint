import type { TsrSerializable } from "@tanstack/router-core"

// Medusa entity types carry `Record<string, unknown>` metadata fields that
// TanStack Start's compile-time serialization check can't prove serializable,
// even though the values are plain JSON straight from the Medusa API.
// Branding the value satisfies the checker without changing the runtime value.
export const jsonSafe = <T,>(value: T) => value as T & TsrSerializable
