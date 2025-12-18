import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("generations router", () => {
  it("should create a generation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.generations.create({
      title: "Test Generation",
      description: "Test description",
      contextQuery: "Generate a claims processing service with PII masking",
    });

    expect(result.success).toBe(true);
    expect(typeof result.id).toBe("number");
  });

  it("should list generations for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const generations = await caller.generations.list();

    expect(Array.isArray(generations)).toBe(true);
  });

  it("should require title and contextQuery", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.generations.create({
        title: "",
        contextQuery: "test",
      })
    ).rejects.toThrow();

    await expect(
      caller.generations.create({
        title: "test",
        contextQuery: "",
      })
    ).rejects.toThrow();
  });
});
