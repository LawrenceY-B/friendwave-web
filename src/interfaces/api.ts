import type { components } from "@/lib/api-types";

// Friendly names for the API's types. src/lib/api-types.ts is generated from the
// API's OpenAPI spec: run `pnpm gen:api` (with the API running) after it changes.
type Schemas = components["schemas"];

export type UserSummary = Schemas["UserSummary"];
export type Profile = Schemas["Profile"];
export type Post = Schemas["Post"];
export type Comment = Schemas["Comment"];
export type Reply = Schemas["Reply"];
export type Story = Schemas["Story"];
export type StoryGroup = Schemas["StoryGroup"];
export type Chat = Schemas["Chat"];
export type Message = Schemas["Message"];
