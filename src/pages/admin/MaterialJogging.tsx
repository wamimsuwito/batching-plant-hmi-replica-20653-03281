import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MaterialJogging() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Joging Material</CardTitle>
          <CardDescription>Pengaturan joging dan testing material</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming Soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
