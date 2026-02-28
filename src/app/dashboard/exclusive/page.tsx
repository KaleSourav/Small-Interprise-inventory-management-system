import PageContainer from '@/components/layout/page-container';

export default function ExclusivePage() {
  return (
    <PageContainer pageTitle='Exclusive'>
      <div className='space-y-6'>
        <h1 className='text-3xl font-bold tracking-tight'>Exclusive Area</h1>
        <p className='text-muted-foreground'>
          Reserved for future exclusive perfume store features.
        </p>
      </div>
    </PageContainer>
  );
}
