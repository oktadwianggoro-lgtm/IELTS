import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsChart } from "@/components/admin/analytics-chart";
import { requireRole } from "@/lib/auth/rbac";
import { getAnalyticsSummary, getDailyPageViews, getTopPaths } from "@/lib/analytics/stats";

export default async function AdminAnalyticsPage() {
  await requireRole(["ADMIN"]);

  const [summary, daily, topPaths] = await Promise.all([
    getAnalyticsSummary(),
    getDailyPageViews(14),
    getTopPaths(10),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analitik Penggunaan</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Data pertama-pihak, anonim secara default — lihat Kebijakan Privasi. Pengguna yang
          menonaktifkan sakelar &ldquo;Analitik penggunaan&rdquo; di Profil tidak tercatat di sini
          sama sekali.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total kunjungan halaman</CardDescription>
            <CardTitle className="text-2xl">{summary.totalEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pengunjung unik (anonim)</CardDescription>
            <CardTitle className="text-2xl">{summary.uniqueVisitors}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pengguna login unik</CardDescription>
            <CardTitle className="text-2xl">{summary.uniqueSignedInUsers}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kunjungan Halaman — 14 Hari Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.totalEvents === 0 ? (
            <p className="text-muted-foreground text-sm">
              Belum ada data analitik tercatat.
            </p>
          ) : (
            <AnalyticsChart data={daily} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Halaman Paling Banyak Dikunjungi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topPaths.length === 0 ? (
            <p className="text-muted-foreground text-sm">Belum ada data.</p>
          ) : (
            topPaths.map((p) => (
              <div key={p.path} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{p.path}</span>
                <span className="text-muted-foreground">{p.count}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
