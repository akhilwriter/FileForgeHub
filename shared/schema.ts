import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: text("uploaded_at").notNull(),
  status: text("status").notNull().default("pending"),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true
});

export const fileProcessingSchema = z.object({
  pdfFiles: z.array(z.instanceof(File)).optional(),
  emlFiles: z.array(z.instanceof(File)).optional(),
  xlsxFile: z.instanceof(File).optional(),
});

export const processResponseSchema = z.object({
  success: z.boolean(),
  downloadUrl: z.string().optional(),
  binaryData: z.string().optional(), // Base64 encoded binary data
  contentType: z.string().optional(), // Content type of the binary data
  fileName: z.string().optional(),    // Suggested filename for download
  message: z.string().optional(),
  error: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;
export type FileProcessingRequest = z.infer<typeof fileProcessingSchema>;
export type ProcessResponse = z.infer<typeof processResponseSchema>;
