import {sqliteTable,integer,text} from 'drizzle-orm/sqlite-core';
export const world=sqliteTable('shared_world',{id:integer('id').primaryKey(),version:integer('version').notNull().default(0),state:text('state').notNull()});
export const limits=sqliteTable('join_limits',{key:text('key').primaryKey(),count:integer('count').notNull().default(0),expires:integer('expires').notNull()});
