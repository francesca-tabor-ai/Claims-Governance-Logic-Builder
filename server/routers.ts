import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getDocumentsByUserId } = await import("./db");
      return await getDocumentsByUserId(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          content: z.string().min(1),
          type: z.enum(["adr", "governance", "standard", "other"]),
          fileUrl: z.string().optional(),
          fileKey: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createDocument } = await import("./db");
        await createDocument({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getDocumentById } = await import("./db");
        return await getDocumentById(input.id);
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          content: z.string().optional(),
          type: z.enum(["adr", "governance", "standard", "other"]).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateDocument } = await import("./db");
        const { id, ...updates } = input;
        await updateDocument(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteDocument } = await import("./db");
        await deleteDocument(input.id);
        return { success: true };
      }),
  }),

  generations: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getGenerationsByUserId } = await import("./db");
      return await getGenerationsByUserId(ctx.user.id);
    }),
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          contextQuery: z.string().min(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { createGeneration } = await import("./db");
        const result = await createGeneration({
          userId: ctx.user.id,
          ...input,
          status: "pending",
        });
        return { success: true, id: Number(result[0].insertId) };
      }),
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getGenerationById } = await import("./db");
        return await getGenerationById(input.id);
      }),
    getWithValidation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getGenerationById, getValidationByGenerationId } = await import("./db");
        const generation = await getGenerationById(input.id);
        const validation = generation ? await getValidationByGenerationId(input.id) : undefined;
        return { generation, validation };
      }),
    generateCoT: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          contextQuery: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const { updateGeneration, getDocumentsByUserId, getGenerationById } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        const generation = await getGenerationById(input.id);
        if (!generation) throw new Error("Generation not found");

        await updateGeneration(input.id, { status: "reasoning" });

        // Get relevant documents (simplified RAG - in production, use vector similarity)
        const documents = await getDocumentsByUserId(generation.userId);
        const context = documents.map(d => `[${d.type.toUpperCase()}] ${d.title}:\n${d.content}`).join("\n\n");

        // Generate Chain-of-Thought reasoning
        const cotPrompt = `You are an expert software architect specializing in governed C# microservices for insurance claims processing.

Context Documents:
${context}

User Request: ${input.contextQuery}

Provide a detailed Chain-of-Thought reasoning that:
1. Identifies the relevant governance rules and ADRs from the context
2. Breaks down the implementation requirements step-by-step
3. Explains how PII masking will be enforced
4. Describes the CP/AP segregation approach
5. Outlines the decision logic for claims processing

Provide your reasoning in a clear, structured format.`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert software architect." },
            { role: "user", content: cotPrompt },
          ],
        });

        const cotContent = response.choices[0]?.message?.content;
        const cotReasoning = typeof cotContent === 'string' ? cotContent : "";
        await updateGeneration(input.id, { cotReasoning, status: "generating" });

        return { success: true, cotReasoning };
      }),
    generateCode: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { updateGeneration, getGenerationById } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        const generation = await getGenerationById(input.id);
        if (!generation) throw new Error("Generation not found");
        if (!generation.cotReasoning) throw new Error("CoT reasoning not generated yet");

        const startTime = Date.now();

        // Generate C# microservice code
        const codePrompt = `Based on the following Chain-of-Thought reasoning, generate a complete C# microservice implementation:

${generation.cotReasoning}

Generate:
1. A complete C# class implementing the Claims Data Governance logic
2. Include PII masking using approved methods
3. Ensure CP/AP segregation (only use approved interfaces)
4. Add proper error handling and logging

Provide only the C# code without explanations.`;

        const codeResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert C# developer." },
            { role: "user", content: codePrompt },
          ],
        });

        const codeContent = codeResponse.choices[0]?.message?.content;
        const generatedCode = typeof codeContent === 'string' ? codeContent : "";

        // Generate test suite
        const testPrompt = `Generate a comprehensive xUnit test suite for the following C# code:

${generatedCode}

The tests should:
1. Validate PII masking is enforced
2. Test all decision paths
3. Verify CP/AP segregation
4. Include edge cases

Provide only the C# test code.`;

        const testResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are an expert C# test developer." },
            { role: "user", content: testPrompt },
          ],
        });

        const testContent = testResponse.choices[0]?.message?.content;
        const generatedTests = typeof testContent === 'string' ? testContent : "";
        const generationTimeMs = Date.now() - startTime;

        await updateGeneration(input.id, {
          generatedCode,
          generatedTests,
          generationTimeMs,
          status: "validating",
        });

        return { success: true, generatedCode, generatedTests };
      }),
    validate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { updateGeneration, getGenerationById, createValidation } = await import("./db");
        const { invokeLLM } = await import("./_core/llm");
        
        const generation = await getGenerationById(input.id);
        if (!generation) throw new Error("Generation not found");
        if (!generation.generatedCode) throw new Error("Code not generated yet");

        // Use LLM to validate the generated code
        const validationPrompt = `Analyze the following C# code and test suite for compliance:

Code:
${generation.generatedCode}

Tests:
${generation.generatedTests}

Validate:
1. Are all tests likely to pass? (true/false)
2. Estimated test coverage percentage (0-100)
3. Is ADR-compliant (uses approved libraries)? (true/false)
4. Number of CP/AP violations (0 = none)
5. Is PII masking enforced before logging? (true/false)

Respond in JSON format: {"testsPassed": boolean, "testCoverage": number, "adrCompliant": boolean, "cpApViolations": number, "piiMaskingEnforced": boolean, "details": "explanation"}`;

        const validationResponse = await invokeLLM({
          messages: [
            { role: "system", content: "You are a code validation expert." },
            { role: "user", content: validationPrompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "validation_result",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  testsPassed: { type: "boolean" },
                  testCoverage: { type: "number" },
                  adrCompliant: { type: "boolean" },
                  cpApViolations: { type: "number" },
                  piiMaskingEnforced: { type: "boolean" },
                  details: { type: "string" },
                },
                required: ["testsPassed", "testCoverage", "adrCompliant", "cpApViolations", "piiMaskingEnforced", "details"],
                additionalProperties: false,
              },
            },
          },
        });

        const validationContent = validationResponse.choices[0]?.message?.content;
        const validationData = JSON.parse(typeof validationContent === 'string' ? validationContent : "{}");

        await createValidation({
          generationId: input.id,
          testsPassed: validationData.testsPassed ? 1 : 0,
          testCoverage: validationData.testCoverage || 0,
          adrCompliant: validationData.adrCompliant ? 1 : 0,
          cpApViolations: validationData.cpApViolations || 0,
          piiMaskingEnforced: validationData.piiMaskingEnforced ? 1 : 0,
          validationDetails: validationData.details,
        });

        await updateGeneration(input.id, { status: "completed" });

        return { success: true, validation: validationData };
      }),
  }),
});

export type AppRouter = typeof appRouter;
