import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// 1. Users Table (synchronized with Firebase Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name'),
  email: text('email').notNull().unique(),
  role: text('role').notNull().default('user'), // 'user' or 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 2. Links Table
export const links = pgTable('links', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }), // Nullable for anonymous links
  shortCode: text('short_code').notNull().unique(),
  originalUrl: text('original_url').notNull(),
  customAlias: text('custom_alias').unique(), // Opsi custom alias, must be unique
  clickCount: integer('click_count').notNull().default(0),
  expiresAt: timestamp('expires_at'), // Expiration timestamp
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Clicks Table (for detailed stats)
export const clicks = pgTable('clicks', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').references(() => links.id, { onDelete: 'cascade' }).notNull(),
  country: text('country').notNull().default('Unknown'),
  device: text('device').notNull().default('Unknown'),
  browser: text('browser').notNull().default('Unknown'),
  os: text('os').notNull().default('Unknown'),
  referrer: text('referrer').notNull().default('Direct'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Reports Table
export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').references(() => links.id, { onDelete: 'cascade' }).notNull(),
  reason: text('reason').notNull(), // Phishing, Malware, Spam, Scam, Konten ilegal
  description: text('description').notNull(),
  status: text('status').notNull().default('pending'), // pending, resolved, ignored
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 5. Blacklist Domains Table
export const blacklistDomains = pgTable('blacklist_domains', {
  id: serial('id').primaryKey(),
  domain: text('domain').notNull().unique(), // e.g. "phishing-site.com"
  reason: text('reason').notNull().default('Banned by admin'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define Relationships
export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
}));

export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  clicks: many(clicks),
  reports: many(reports),
}));

export const clicksRelations = relations(clicks, ({ one }) => ({
  link: one(links, {
    fields: [clicks.linkId],
    references: [links.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  link: one(links, {
    fields: [reports.linkId],
    references: [links.id],
  }),
}));
