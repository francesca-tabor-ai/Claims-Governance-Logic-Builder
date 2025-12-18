import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, Clock, CheckCircle2, XCircle, Code2 } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

export default function History() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: generations, isLoading } = trpc.generations.list.useQuery();
  const { data: detailData } = trpc.generations.getWithValidation.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId }
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "pending":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-blue-100 text-blue-700 border-blue-200";
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Generation History
          </h1>
          <p className="text-muted-foreground mt-2">
            View past code generations with CoT reasoning and validation results
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : generations && generations.length > 0 ? (
          <div className="space-y-4">
            {generations.map((gen) => (
              <Card
                key={gen.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => setSelectedId(gen.id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(gen.status)}
                        <CardTitle className="text-xl">{gen.title}</CardTitle>
                      </div>
                      {gen.description && (
                        <CardDescription>{gen.description}</CardDescription>
                      )}
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusColor(gen.status)}`}>
                      {gen.status.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {new Date(gen.createdAt).toLocaleString()}
                    </div>
                    {gen.generationTimeMs && (
                      <div className="flex items-center gap-2">
                        <Code2 className="h-4 w-4" />
                        {(gen.generationTimeMs / 1000).toFixed(1)}s
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No generations yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Start generating code to see your history here
              </p>
              <Button onClick={() => window.location.href = "/generate"}>
                Generate Code
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailData?.generation?.title}</DialogTitle>
          </DialogHeader>
          {detailData && (
            <Tabs defaultValue="cot" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="cot">CoT Reasoning</TabsTrigger>
                <TabsTrigger value="code">Generated Code</TabsTrigger>
                <TabsTrigger value="tests">Test Suite</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
              </TabsList>
              <TabsContent value="cot" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Chain-of-Thought Reasoning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detailData.generation?.cotReasoning ? (
                      <div className="prose prose-sm max-w-none">
                        <Streamdown>{detailData.generation.cotReasoning}</Streamdown>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No reasoning available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="code" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">C# Microservice</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detailData.generation?.generatedCode ? (
                      <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
                        <code className="text-sm">{detailData.generation.generatedCode}</code>
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground">No code available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="tests" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">xUnit Test Suite</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {detailData.generation?.generatedTests ? (
                      <pre className="rounded-lg bg-muted p-4 overflow-x-auto">
                        <code className="text-sm">{detailData.generation.generatedTests}</code>
                      </pre>
                    ) : (
                      <p className="text-sm text-muted-foreground">No tests available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="validation" className="space-y-4">
                {detailData.validation ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Tests Passed
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className={`text-2xl font-bold ${detailData.validation.testsPassed ? "text-green-600" : "text-red-600"}`}>
                            {detailData.validation.testsPassed ? "✓ Yes" : "✗ No"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Test Coverage
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-bold text-primary">
                            {detailData.validation.testCoverage}%
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            ADR Compliant
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className={`text-2xl font-bold ${detailData.validation.adrCompliant ? "text-green-600" : "text-red-600"}`}>
                            {detailData.validation.adrCompliant ? "✓ Yes" : "✗ No"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            CP/AP Violations
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className={`text-2xl font-bold ${detailData.validation.cpApViolations === 0 ? "text-green-600" : "text-red-600"}`}>
                            {detailData.validation.cpApViolations}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            PII Masking
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className={`text-2xl font-bold ${detailData.validation.piiMaskingEnforced ? "text-green-600" : "text-red-600"}`}>
                            {detailData.validation.piiMaskingEnforced ? "✓ Enforced" : "✗ Missing"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    {detailData.validation.validationDetails && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Validation Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {detailData.validation.validationDetails}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <p className="text-center text-sm text-muted-foreground">
                        No validation results available
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
