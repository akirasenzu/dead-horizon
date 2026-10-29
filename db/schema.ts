import {sqliteTable,integer,text} from 'drizzle-orm/sqlite-core';
export const world=sqliteTable('shared_world',{id:integer('id').primaryKey(),version:integer('version').notNull().default(0),state:text('state').notNull()});
export const limits=sqliteTable('join_limits',{key:text('key').primaryKey(),count:integer('count').notNull().default(0),expires:integer('expires').notNull()});
export const accounts=sqliteTable('accounts',{id:text('id').primaryKey(),username:text('username').notNull().unique(),passwordHash:text('password_hash').notNull(),created:integer('created').notNull()});
export const sessions=sqliteTable('account_sessions',{tokenHash:text('token_hash').primaryKey(),accountId:text('account_id').notNull(),expires:integer('expires').notNull()});
