import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrintTicket() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Print Tiket</CardTitle>
          <CardDescription>Cetak tiket pengiriman dan produksi</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming Soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
