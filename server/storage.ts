import { 
  users, documents, ledgerEntries, tradeTransactions, riskScores,
  type User, type InsertUser,
  type Document, type InsertDocument,
  type LedgerEntry, type InsertLedgerEntry,
  type TradeTransaction, type InsertTradeTransaction,
  type RiskScore, type InsertRiskScore
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>; // Using email as username
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
}

export class DatabaseStorage implements IStorage {
  // Users
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

  // Documents
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

  // Ledger
  async getLedgerEntries(docId: number): Promise<(LedgerEntry & { actorName: string })[]> {
    // Join with users to get actor name
    const entries = await db.select({
      id: ledgerEntries.id,
      documentId: ledgerEntries.documentId,
      action: ledgerEntries.action,
      actorId: ledgerEntries.actorId,
      metadata: ledgerEntries.metadata,
      timestamp: ledgerEntries.timestamp,
      actorName: users.name,
    })
    .from(ledgerEntries)
    .innerJoin(users, eq(ledgerEntries.actorId, users.id))
    .where(eq(ledgerEntries.documentId, docId))
    .orderBy(desc(ledgerEntries.timestamp));
    
    return entries;
  }

  async createLedgerEntry(entry: InsertLedgerEntry): Promise<LedgerEntry> {
    const [newEntry] = await db.insert(ledgerEntries).values(entry).returning();
    return newEntry;
  }

  // Transactions
  async getTransactions(): Promise<TradeTransaction[]> {
    return await db.select().from(tradeTransactions).orderBy(desc(tradeTransactions.createdAt));
  }

  async createTransaction(tx: InsertTradeTransaction): Promise<TradeTransaction> {
    const [newTx] = await db.insert(tradeTransactions).values(tx).returning();
    return newTx;
  }

  // Risk Scores
  async getRiskScores(): Promise<(RiskScore & { userName: string })[]> {
    const scores = await db.select({
      id: riskScores.id,
      userId: riskScores.userId,
      score: riskScores.score,
      rationale: riskScores.rationale,
      updatedAt: riskScores.updatedAt,
      userName: users.name,
    })
    .from(riskScores)
    .innerJoin(users, eq(riskScores.userId, users.id))
    .orderBy(desc(riskScores.updatedAt));
    
    return scores;
  }

  async createRiskScore(score: InsertRiskScore): Promise<RiskScore> {
    const [newScore] = await db.insert(riskScores).values(score).returning();
    return newScore;
  }
}

export const storage = new DatabaseStorage();
