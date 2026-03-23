export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-on-surface font-body p-8">
      <div className="max-w-lg text-center">
        <h1 className="font-headline text-4xl text-primary mb-4">Page Not Found</h1>
        <p className="text-on-surface-variant">
          This route is not mapped to any static admin design yet.
        </p>
      </div>
    </main>
  );
}
