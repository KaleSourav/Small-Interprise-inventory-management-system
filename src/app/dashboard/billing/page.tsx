import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export default function BillingPage() {
  return (
    <PageContainer pageTitle='Billing & Plans'>
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>Billing & Plans</CardTitle>
            <CardDescription>
              Subscription management will be available here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-sm'>
              Billing integration coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
