import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations, sql } from "drizzle-orm";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["bank", "corporate", "auditor", "admin"] }).notNull(),
  orgName: text("org_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  docType: text("doc_type", { enum: ["LOC", "INVOICE", "BILL_OF_LADING", "PO", "COO", "INSURANCE_CERT"] }).notNull(),
  docNumber: text("doc_number").notNull(),
  fileUrl: text("file_url").notNull(),
  hash: text("hash").notNull(), // SHA-256
  issuedAt: timestamp("issued_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ledgerEntries = pgTable("ledger_entries", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  action: text("action", { enum: ["ISSUED", "AMENDED", "SHIPPED", "RECEIVED", "PAID", "CANCELLED", "VERIFIED"] }).notNull(),
  actorId: integer("actor_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tradeTransactions = pgTable("trade_transactions", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull(),
  sellerId: integer("seller_id").notNull(),
  amount: numeric("amount").notNull(),
  currency: text("currency").notNull(), // CHAR(3)
  status: text("status", { enum: ["pending", "in_progress", "completed", "disputed"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const riskScores = pgTable("risk_scores", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  score: numeric("score").notNull(), // 0-100
  rationale: text("rationale").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Separate session table for connect-pg-simple
export const session = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  ledgerActions: many(ledgerEntries),
  buyerTransactions: many(tradeTransactions, { relationName: "buyer" }),
  sellerTransactions: many(tradeTransactions, { relationName: "seller" }),
  riskScores: many(riskScores),
  auditLogs: many(auditLogs),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  owner: one(users, {
    fields: [documents.ownerId],
    references: [users.id],
  }),
  ledgerEntries: many(ledgerEntries),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  document: one(documents, {
    fields: [ledgerEntries.documentId],
    references: [documents.id],
  }),
  actor: one(users, {
    fields: [ledgerEntries.actorId],
    references: [users.id],
  }),
}));

export const tradeTransactionsRelations = relations(tradeTransactions, ({ one }) => ({
  buyer: one(users, {
    fields: [tradeTransactions.buyerId],
    references: [users.id],
    relationName: "buyer",
  }),
  seller: one(users, {
    fields: [tradeTransactions.sellerId],
    references: [users.id],
    relationName: "seller",
  }),
}));

export const riskScoresRelations = relations(riskScores, ({ one }) => ({
  user: one(users, {
    fields: [riskScores.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(users, {
    fields: [auditLogs.adminId],
    references: [users.id],
  }),
}));

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, createdAt: true });
export const insertLedgerEntrySchema = createInsertSchema(ledgerEntries).omit({ id: true, createdAt: true });
export const insertTradeTransactionSchema = createInsertSchema(tradeTransactions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRiskScoreSchema = createInsertSchema(riskScores).omit({ id: true, lastUpdated: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = z.infer<typeof insertLedgerEntrySchema>;

export type TradeTransaction = typeof tradeTransactions.$inferSelect;
export type InsertTradeTransaction = z.infer<typeof insertTradeTransactionSchema>;

export type RiskScore = typeof riskScores.$inferSelect;
export type InsertRiskScore = z.infer<typeof insertRiskScoreSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;


// === API CONTRACT ===

// Error Schemas
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// API Contract
export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.void(),
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<User>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user' as const,
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/documents' as const,
      responses: {
        200: z.array(z.custom<Document>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/documents' as const,
      input: insertDocumentSchema.omit({ ownerId: true }),
      responses: {
        201: z.custom<Document>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/documents/:id' as const,
      responses: {
        200: z.custom<Document>(),
        404: errorSchemas.notFound,
      },
    },
  },
  ledger: {
    list: {
      method: 'GET' as const,
      path: '/api/documents/:id/ledger' as const,
      responses: {
        200: z.array(z.custom<LedgerEntry & { actorName: string }>()),
      },
    },
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions' as const,
      responses: {
        200: z.array(z.custom<TradeTransaction>()),
      },
    },
  },
  analytics: {
    riskScores: {
      method: 'GET' as const,
      path: '/api/analytics/risk-scores' as const,
      responses: {
        200: z.array(z.custom<RiskScore & { userName: string }>()),
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/analytics/stats' as const,
      responses: {
        200: z.object({
          totalVolume: z.string(),
          activeTrades: z.number(),
          riskAlerts: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
