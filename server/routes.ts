import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
const PgSession = connectPg(session);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTH SETUP ===
  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET || "repl_secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false);
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) return done(null, false);
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // === AUTH ROUTES ===
  app.post(api.auth.login.path, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });
      
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed after registration" });
        res.status(201).json(user);
      });
    } catch (err) {
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // === APP ROUTES ===

  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    next();
  };

  app.get(api.documents.list.path, requireAuth, async (req, res) => {
    const user = req.user as any;
    if (user.role === 'auditor' || user.role === 'admin' || user.role === 'bank') {
       const docs = await storage.getDocuments();
       res.json(docs);
    } else {
       const docs = await storage.getDocumentsByOwner(user.id);
       res.json(docs);
    }
  });

  app.post(api.documents.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.documents.create.input.parse(req.body);
      const user = req.user as any;
      const doc = await storage.createDocument({
        ...input,
        ownerId: user.id,
        issuedAt: new Date(input.issuedAt),
      });
      
      await storage.createLedgerEntry({
        documentId: doc.id,
        action: "ISSUED",
        actorId: user.id,
        metadata: { note: "Document created and uploaded" },
      });

      res.status(201).json(doc);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.documents.get.path, requireAuth, async (req, res) => {
    const doc = await storage.getDocument(Number(req.params.id));
    if (!doc) return res.sendStatus(404);
    res.json(doc);
  });

  app.get(api.ledger.list.path, requireAuth, async (req, res) => {
    const entries = await storage.getLedgerEntries(Number(req.params.id));
    res.json(entries);
  });

  app.get(api.transactions.list.path, requireAuth, async (req, res) => {
    const txs = await storage.getTransactions();
    res.json(txs);
  });

  app.get(api.analytics.riskScores.path, requireAuth, async (req, res) => {
    const scores = await storage.getRiskScores();
    res.json(scores);
  });

  app.get(api.analytics.stats.path, requireAuth, async (req, res) => {
    const txs = await storage.getTransactions();
    const scores = await storage.getRiskScores();
    
    const totalVolume = txs.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const riskAlerts = scores.filter(s => Number(s.score) > 70).length;

    res.json({
      totalVolume: `$${totalVolume.toLocaleString()}`,
      activeTrades: txs.filter(t => t.status === 'pending').length,
      riskAlerts,
    });
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingUsers = await storage.getUserByUsername("admin@bank.com");
  if (!existingUsers) {
    const password = await hashPassword("password123");
    
    const admin = await storage.createUser({
      name: "Admin User",
      email: "admin@bank.com",
      password,
      role: "admin",
      orgName: "Global Trade Bank",
    });
    
    const auditor = await storage.createUser({
      name: "Jane Auditor",
      email: "jane@audit.com",
      password,
      role: "auditor",
      orgName: "Audit Corp",
    });

    const corpUser = await storage.createUser({
      name: "John Exporter",
      email: "john@export.com",
      password,
      role: "corporate",
      orgName: "Export Ltd",
    });

    const doc1 = await storage.createDocument({
      ownerId: corpUser.id,
      docType: "BILL_OF_LADING",
      docNumber: "BL-2024-001",
      fileUrl: "https://example.com/bl.pdf",
      hash: "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      issuedAt: new Date(),
    });

    await storage.createLedgerEntry({
      documentId: doc1.id,
      action: "ISSUED",
      actorId: corpUser.id,
      metadata: { note: "Initial upload" },
    });

    await storage.createLedgerEntry({
      documentId: doc1.id,
      action: "VERIFIED",
      actorId: admin.id,
      metadata: { note: "Bank verification complete" },
    });

    await storage.createTransaction({
      buyerId: admin.id,
      sellerId: corpUser.id,
      amount: "50000",
      currency: "USD",
      status: "pending",
    });

    await storage.createRiskScore({
      userId: corpUser.id,
      score: "15",
      rationale: "Low risk, established history",
    });
  }
}
