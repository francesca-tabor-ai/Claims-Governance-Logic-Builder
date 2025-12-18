import DashboardLayout from "@/components/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, Target, Clock, CheckCircle2 } from "lucide-react";

export default function Metrics() {
  const { data: generations, isLoading } = trpc.generations.list.useQuery();

  const calculateMetrics = () => {
    if (!generations || generations.length === 0) {
      return {
        totalGenerations: 0,
        successRate: 0,
        avgGenerationTime: 0,
        completedCount: 0,
      };
    }

    const completed = generations.filter(g => g.status === "completed");
    const totalTime = completed.reduce((sum, g) => sum + (g.generationTimeMs || 0), 0);

    return {
      totalGenerations: generations.length,
      successRate: (completed.length / generations.length) * 100,
      avgGenerationTime: completed.length > 0 ? totalTime / completed.length / 1000 : 0,
      completedCount: completed.length,
    };
  };

  const metrics = calculateMetrics();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Success Metrics
          </h1>
          <p className="text-muted-foreground mt-2">
            Track governance rule correctness, test coverage, and generation performance
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Generations
                  </CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.totalGenerations}</div>
                  <p className="text-xs text-muted-foreground">
                    All time
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Success Rate
                  </CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.successRate.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics.completedCount} completed
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avg Generation Time
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics.avgGenerationTime.toFixed(1)}s</div>
                  <p className="text-xs text-muted-foreground">
                    Per generation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Target Met
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${metrics.avgGenerationTime < 600 ? "text-green-600" : "text-orange-600"}`}>
                    {metrics.avgGenerationTime < 600 ? "✓ Yes" : "→ Working"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Target: &lt; 10 minutes
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>MVP Success Criteria</CardTitle>
                  <CardDescription>
                    Key metrics defined in the product requirements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm font-medium">Governance Rule Correctness</span>
                      <span className="text-sm text-muted-foreground">Target: 100% passing tests</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm font-medium">ADR Adherence</span>
                      <span className="text-sm text-muted-foreground">Target: 0 unauthorized APIs</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm font-medium">CP/AP Violations</span>
                      <span className="text-sm text-muted-foreground">Target: 0</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm font-medium">Test Coverage</span>
                      <span className="text-sm text-muted-foreground">Target: ≥ 80%</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-sm font-medium">Re-run Determinism</span>
                      <span className="text-sm text-muted-foreground">Target: ≥ 95% identical</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Generation Time</span>
                      <span className="text-sm text-muted-foreground">Target: &lt; 10 minutes</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Strategic Value</CardTitle>
                  <CardDescription>
                    How this MVP establishes governed AI patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="text-sm font-medium text-primary">AI as Compliant Co-Engineer</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Not a risk, but a trusted partner in development
                      </p>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="text-sm font-medium text-primary">Governance by Design</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Enforced through architecture, not manual review
                      </p>
                    </div>
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="text-sm font-medium text-primary">Auditable & Deterministic</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Complex logic is testable and traceable
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {generations && generations.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No metrics yet</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Generate code to start tracking metrics
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
