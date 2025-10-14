import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProductionDatabase() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Produksi</CardTitle>
          <CardDescription>Riwayat dan data produksi batching plant</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming Soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
