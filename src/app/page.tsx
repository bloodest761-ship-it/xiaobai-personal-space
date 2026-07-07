import { SITE } from "@/lib/site";

export default function Home() {
  return (
    <main className="min-h-screen bg-page text-primary">
      <section className="mx-auto flex min-h-screen w-full max-w-page flex-col justify-center px-6 py-20 sm:px-8 lg:px-10">
        <div className="max-w-content">
          <p className="mb-5 text-sm font-medium text-accent">建设中</p>
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-normal sm:text-5xl">
            {SITE.name}
          </h1>
          <p className="mt-6 text-pretty text-xl leading-8 text-secondary sm:text-2xl">
            {SITE.tagline}
          </p>
          <p className="mt-8 max-w-reading text-base leading-8 text-muted sm:text-lg">
            当前项目正在建设中
          </p>
        </div>
      </section>
    </main>
  );
}
