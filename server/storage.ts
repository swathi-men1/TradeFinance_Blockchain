import { 
  users, documents, ledgerEntries, tradeTransactions, riskScores, auditLogs,
  type User, type InsertUser,
  type Document, type InsertDocument,
  type LedgerEntry, type InsertLedgerEntry,
  type TradeTransaction, type InsertTradeTransaction,
  type RiskScore, type InsertRiskScore,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Documents
  getDocuments(): Promise<Document[]>;
  getDocumentsByOwner(ownerId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(doc: InsertDocument): Promise<Document>;

  // Ledger
  getLedgerEntries(docId: number): Promise<(LedgerEntry & { actorName: string })[]>;
  createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry>;

  // Transactions
  getTransactions(): Promise<TradeTransaction[]>;
  createTransaction(tx: InsertTradeTransaction): Promise<TradeTransaction>;

  // Risk Scores
  getRiskScores(): Promise<(RiskScore & { userName: string })[]>;
  createRiskScore(score: InsertRiskScore): Promise<RiskScore>;

  // Audit Logs
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.issuedAt));
  }

  async getDocumentsByOwner(ownerId: number): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.ownerId, ownerId)).orderBy(desc(documents.issuedAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    return doc;
  }

  async createDocument(doc: InsertDocument): Promise<Document> {
    const [newDoc] = await db.insert(documents).values(doc).returning();
    return newDoc;
  }

  async getLedgerEntries(docId: number): Promise<(LedgerEntry & { actorName: string })[]> {
    return await db.select({
      id: ledgerEntries.id,
      documentId: ledgerEntries.documentId,
      action: ledgerEntries.action,
      actorId: ledgerEntries.actorId,
      metadata: ledgerEntries.metadata,
      createdAt: ledgerEntries.createdAt,
      actorName: users.name,
    })
    .from(ledgerEntries)
    .innerJoin(users, eq(ledgerEntries.actorId, users.id))
    .where(eq(ledgerEntries.documentId, docId))
    .orderBy(desc(ledgerEntries.createdAt));
  }

  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> {
    const [newEntry] = await db.insert(ledgerEntries).values(entry).returning();
    return newEntry;
  }

  async getTransactions(): Promise<TradeTransaction[]> {
    return await db.select().from(tradeTransactions).orderBy(desc(tradeTransactions.createdAt));
  }

  async createTransaction(tx: InsertTradeTransaction): Promise<TradeTransaction> {
    const [newTx] = await db.insert(tradeTransactions).values(tx).returning();
    return newTx;
  }

  async getRiskScores(): Promise<(RiskScore & { userName: string })[]> {
    return await db.select({
      id: riskScores.id,
      userId: riskScores.userId,
      score: riskScores.score,
      rationale: riskScores.rationale,
      lastUpdated: riskScores.lastUpdated,
      userName: users.name,
    })
    .from(riskScores)
    .innerJoin(users, eq(riskScores.userId, users.id))
    .orderBy(desc(riskScores.lastUpdated));
  }

  async createRiskScore(score: InsertRiskScore): Promise<RiskScore> {
    const [newScore] = await db.insert(riskScores).values(score).returning();
    return newScore;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp));
  }

  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [newLog] = await db.insert(auditLogs).values(log).returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
