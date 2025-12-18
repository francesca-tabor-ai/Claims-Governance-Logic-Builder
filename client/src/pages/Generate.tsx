import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles, CheckCircle2, Code2, TestTube2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

export default function Generate() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contextQuery, setContextQuery] = useState("");
  const [currentGenerationId, setCurrentGenerationId] = useState<number | null>(null);
  const [step, setStep] = useState<"input" | "reasoning" | "generating" | "validating" | "complete">("input");

  const createMutation = trpc.generations.create.useMutation();
  const cotMutation = trpc.generations.generateCoT.useMutation();
  const codeMutation = trpc.generations.generateCode.useMutation();
  const validateMutation = trpc.generations.validate.useMutation();

  const { data: generationData } = trpc.generations.getWithValidation.useQuery(
    { id: currentGenerationId! },
    { enabled: !!currentGenerationId, refetchInterval: step !== "complete" ? 2000 : false }
  );

  const handleStartGeneration = async () => {
    if (!title.trim() || !contextQuery.trim()) {
      toast.error("Title and context query are required");
      return;
    }

    try {
      setStep("reasoning");
      const result = await createMutation.mutateAsync({
        title,
        description,
        contextQuery,
      });
      setCurrentGenerationId(result.id);

      // Generate CoT reasoning
      await cotMutation.mutateAsync({
        id: result.id,
        contextQuery,
      });

      setStep("generating");
      // Generate code
      await codeMutation.mutateAsync({ id: result.id });

      setStep("validating");
      // Validate
      await validateMutation.mutateAsync({ id: result.id });

      setStep("complete");
      toast.success("Code generation completed!");
    } catch (error) {
      toast.error("Generation failed");
      setStep("input");
    }
  };

  const handleReset = () => {
    setTitle("");
    setDescription("");
    setContextQuery("");
    setCurrentGenerationId(null);
    setStep("input");
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Generate Code
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered C# microservice generation with governance guardrails
          </p>
        </div>

        {step === "input" && (
          <Card>
            <CardHeader>
              <CardTitle>New Generation</CardTitle>
              <CardDescription>
                Describe what you want to build and we'll generate governed C# code with tests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Claims PII Masking Service"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the service"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="context">Context Query</Label>
                <Textarea
                  id="context"
                  value={contextQuery}
                  onChange={(e) => setContextQuery(e.target.value)}
                  placeholder="Describe the requirements, business logic, and constraints..."
                  className="min-h-[150px]"
                />
              </div>
              <Button
                onClick={handleStartGeneration}
                disabled={createMutation.isPending}
                className="w-full gap-2"
                size="lg"
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                Generate Code
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "reasoning" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Chain-of-Thought Reasoning
              </CardTitle>
              <CardDescription>
                Analyzing requirements and planning implementation...
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generationData?.generation?.cotReasoning && (
                <div className="prose prose-sm max-w-none">
                  <Streamdown>{generationData.generation.cotReasoning}</Streamdown>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {step === "generating" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Chain-of-Thought Reasoning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-sm">
                  <Streamdown>{generationData?.generation?.cotReasoning || ""}</Streamdown>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Generating Code
                </CardTitle>
                <CardDescription>
                  Creating C# microservice and test suite...
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {step === "validating" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Code Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <Code2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Microservice</p>
                      <p className="text-sm text-muted-foreground">C# implementation ready</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-4">
                    <TestTube2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Test Suite</p>
                      <p className="text-sm text-muted-foreground">xUnit tests generated</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Running Validation
                </CardTitle>
                <CardDescription>
                  Checking ADR compliance, CP/AP segregation, and test coverage...
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {step === "complete" && generationData && (
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-6 w-6" />
                  Generation Complete
                </CardTitle>
                <CardDescription className="text-green-600">
                  Your governed C# microservice has been generated and validated
                </CardDescription>
              </CardHeader>
            </Card>

            {generationData.validation && (
              <Card>
                <CardHeader>
                  <CardTitle>Validation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Tests Passed</p>
                      <p className={`text-2xl font-bold ${generationData.validation.testsPassed ? "text-green-600" : "text-red-600"}`}>
                        {generationData.validation.testsPassed ? "✓ Yes" : "✗ No"}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Test Coverage</p>
                      <p className="text-2xl font-bold text-primary">
                        {generationData.validation.testCoverage}%
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">ADR Compliant</p>
                      <p className={`text-2xl font-bold ${generationData.validation.adrCompliant ? "text-green-600" : "text-red-600"}`}>
                        {generationData.validation.adrCompliant ? "✓ Yes" : "✗ No"}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">CP/AP Violations</p>
                      <p className={`text-2xl font-bold ${generationData.validation.cpApViolations === 0 ? "text-green-600" : "text-red-600"}`}>
                        {generationData.validation.cpApViolations}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">PII Masking</p>
                      <p className={`text-2xl font-bold ${generationData.validation.piiMaskingEnforced ? "text-green-600" : "text-red-600"}`}>
                        {generationData.validation.piiMaskingEnforced ? "✓ Enforced" : "✗ Missing"}
                      </p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-muted-foreground">Generation Time</p>
                      <p className="text-2xl font-bold text-primary">
                        {generationData.generation?.generationTimeMs ? `${(generationData.generation.generationTimeMs / 1000).toFixed(1)}s` : "-"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-4">
              <Button onClick={handleReset} variant="outline" className="flex-1">
                New Generation
              </Button>
              <Button
                onClick={() => window.location.href = `/history?id=${currentGenerationId}`}
                className="flex-1"
              >
                View Details
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
