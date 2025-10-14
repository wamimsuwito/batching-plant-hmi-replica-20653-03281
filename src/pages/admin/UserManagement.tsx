import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UserManagement() {
  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen User</CardTitle>
          <CardDescription>Kelola user dan hak akses sistem</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coming Soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}
