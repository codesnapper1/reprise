import {sqliteTable,text,integer} from 'drizzle-orm/sqlite-core';
export const runs=sqliteTable('simulation_runs',{id:text('id').primaryKey(),createdAt:text('created_at').notNull(),seed:integer('seed').notNull(),count:integer('count').notNull(),strategy:text('strategy').notNull(),summary:text('summary').notNull()});
