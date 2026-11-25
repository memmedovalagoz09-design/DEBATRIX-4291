import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  university: text("university").notNull(),
  specialization: text("specialization").notNull(),
  rix: integer("rix").notNull().default(1000),
  xp: integer("xp").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const topics = sqliteTable("topics", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull().default(""),
  createdById: text("created_by_id").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const debates = sqliteTable("debates", {
  id: text("id").primaryKey(),
  topicId: text("topic_id").notNull(),
  title: text("title").notNull(),
  // waiting | live | completed
  status: text("status").notNull(),
  proUserId: text("pro_user_id"),
  conUserId: text("con_user_id"),
  proAi: text("pro_ai"),
  conAi: text("con_ai"),
  devilsAdvocate: integer("devils_advocate").notNull().default(0),
  invitedUserId: text("invited_user_id"),
  rematchOfId: text("rematch_of_id"),
  turnIndex: integer("turn_index").notNull().default(0),
  turnDeadline: integer("turn_deadline"),
  verdict: text("verdict"),
  winner: text("winner"),
  createdById: text("created_by_id").notNull(),
  createdAt: integer("created_at").notNull(),
  completedAt: integer("completed_at"),
});

export const debateArguments = sqliteTable("debate_arguments", {
  id: text("id").primaryKey(),
  debateId: text("debate_id").notNull(),
  turnIndex: integer("turn_index").notNull(),
  side: text("side").notNull(),
  round: integer("round").notNull(),
  authorUserId: text("author_user_id"),
  authorAi: text("author_ai"),
  content: text("content").notNull(),
  timedOut: integer("timed_out").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const debateVotes = sqliteTable(
  "debate_votes",
  {
    debateId: text("debate_id").notNull(),
    userId: text("user_id").notNull(),
    side: text("side").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.debateId, t.userId] })],
);

export const debateReactions = sqliteTable("debate_reactions", {
  id: text("id").primaryKey(),
  debateId: text("debate_id").notNull(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const debateComments = sqliteTable("debate_comments", {
  id: text("id").primaryKey(),
  debateId: text("debate_id").notNull(),
  userId: text("user_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const debateQuestions = sqliteTable("debate_questions", {
  id: text("id").primaryKey(),
  debateId: text("debate_id").notNull(),
  userId: text("user_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const questionVotes = sqliteTable(
  "question_votes",
  {
    questionId: text("question_id").notNull(),
    userId: text("user_id").notNull(),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.userId] })],
);
