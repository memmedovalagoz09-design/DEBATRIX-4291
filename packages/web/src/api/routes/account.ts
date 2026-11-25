import { z } from "zod";
import { and, eq, inArray, or } from "drizzle-orm";
import { ORPCError } from "@orpc/server";
import { base } from "../__core/app";
import { db } from "../database";
import * as schema from "../database/schema";
import {
  authed,
  createSession,
  hashPassword,
  newId,
  publicUser,
  verifyPassword,
} from "../lib/auth";
import { START_RIX } from "../lib/rank";

const profileFields = {
  name: z.string().trim().min(2, "Ad ən azı 2 simvol olmalıdır").max(40),
  university: z.string().trim().min(2, "Universitet adını daxil edin").max(120),
  specialization: z.string().trim().min(2, "İxtisası daxil edin").max(120),
};

export const account = {
  register: base
    .input(
      z.object({
        ...profileFields,
        email: z.string().trim().toLowerCase().email("E-poçt düzgün deyil"),
        password: z.string().min(6, "Şifrə ən azı 6 simvol olmalıdır").max(200),
      }),
    )
    .handler(async ({ input }) => {
      const existing = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.email, input.email))
        .limit(1);
      if (existing[0]) {
        throw new ORPCError("CONFLICT", { message: "Bu e-poçt artıq qeydiyyatdadır." });
      }
      const id = newId();
      await db.insert(schema.users).values({
        id,
        email: input.email,
        passwordHash: hashPassword(input.password),
        name: input.name,
        university: input.university,
        specialization: input.specialization,
        rix: START_RIX,
        xp: 0,
        wins: 0,
        losses: 0,
        createdAt: Date.now(),
      });
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
      const token = await createSession(id);
      return { token, user: publicUser(user) };
    }),

  login: base
    .input(
      z.object({
        email: z.string().trim().toLowerCase().email("E-poçt düzgün deyil"),
        password: z.string().min(1, "Şifrəni daxil edin"),
      }),
    )
    .handler(async ({ input }) => {
      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, input.email))
        .limit(1);
      if (!user || !verifyPassword(input.password, user.passwordHash)) {
        throw new ORPCError("UNAUTHORIZED", { message: "E-poçt və ya şifrə yanlışdır." });
      }
      const token = await createSession(user.id);
      return { token, user: publicUser(user) };
    }),

  logout: authed.handler(async ({ context }) => {
    const { headers } = context;
    const h = headers.get("authorization") ?? "";
    const token = h.replace("Bearer ", "").trim();
    if (token) await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
    return { ok: true };
  }),

  me: authed.handler(({ context }) => publicUser(context.user)),

  updateProfile: authed
    .input(z.object(profileFields))
    .handler(async ({ input, context }) => {
      await db
        .update(schema.users)
        .set({
          name: input.name,
          university: input.university,
          specialization: input.specialization,
        })
        .where(eq(schema.users.id, context.user.id));
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, context.user.id));
      return publicUser(user);
    }),

  /** Permanently removes the account, its sessions and every debate it took part in. */
  deleteProfile: authed
    .input(z.object({ password: z.string().min(1, "Şifrəni daxil edin") }))
    .handler(async ({ input, context }) => {
      const uid = context.user.id;
      if (!verifyPassword(input.password, context.user.passwordHash)) {
        throw new ORPCError("UNAUTHORIZED", { message: "Şifrə yanlışdır." });
      }

      const ownDebates = await db
        .select({ id: schema.debates.id })
        .from(schema.debates)
        .where(
          or(
            eq(schema.debates.proUserId, uid),
            eq(schema.debates.conUserId, uid),
            eq(schema.debates.createdById, uid),
          ),
        );
      const debateIds = ownDebates.map((d) => d.id);

      if (debateIds.length) {
        const qs = await db
          .select({ id: schema.debateQuestions.id })
          .from(schema.debateQuestions)
          .where(inArray(schema.debateQuestions.debateId, debateIds));
        if (qs.length) {
          await db
            .delete(schema.questionVotes)
            .where(inArray(schema.questionVotes.questionId, qs.map((q) => q.id)));
        }
        await db.delete(schema.debateArguments).where(inArray(schema.debateArguments.debateId, debateIds));
        await db.delete(schema.debateVotes).where(inArray(schema.debateVotes.debateId, debateIds));
        await db.delete(schema.debateReactions).where(inArray(schema.debateReactions.debateId, debateIds));
        await db.delete(schema.debateComments).where(inArray(schema.debateComments.debateId, debateIds));
        await db.delete(schema.debateQuestions).where(inArray(schema.debateQuestions.debateId, debateIds));
        await db.delete(schema.debates).where(inArray(schema.debates.id, debateIds));
      }

      await db
        .update(schema.debates)
        .set({ invitedUserId: null })
        .where(eq(schema.debates.invitedUserId, uid));
      await db.delete(schema.debateVotes).where(eq(schema.debateVotes.userId, uid));
      await db.delete(schema.debateReactions).where(eq(schema.debateReactions.userId, uid));
      await db.delete(schema.debateComments).where(eq(schema.debateComments.userId, uid));
      await db.delete(schema.questionVotes).where(eq(schema.questionVotes.userId, uid));
      await db.delete(schema.debateQuestions).where(eq(schema.debateQuestions.userId, uid));
      await db.delete(schema.topics).where(eq(schema.topics.createdById, uid));
      await db.delete(schema.sessions).where(eq(schema.sessions.userId, uid));
      await db.delete(schema.users).where(and(eq(schema.users.id, uid)));
      return { ok: true };
    }),
};
