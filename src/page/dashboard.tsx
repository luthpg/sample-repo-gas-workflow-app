import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  return (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="flex flex-col justify-center items-center bg-card">
          <CardHeader>
            <CardTitle className="text-center">新規申請</CardTitle>
          </CardHeader>
          <CardContent className="w-full">
            <Button className="w-full">申請フォームを開く</Button>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>現在の申請</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p>申請001</p>
              <Button variant="outline">詳細</Button>
            </div>
            <div className="flex items-center justify-between">
              <p>申請002</p>
              <Button variant="outline">詳細</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle>承認待ち</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p>申請003</p>
              <Button variant="outline">承認</Button>
            </div>
            <div className="flex items-center justify-between">
              <p>申請004</p>
              <Button variant="outline">承認</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
