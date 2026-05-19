import { Container } from "@omega/ui";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800" role="banner">
        <Container size="lg" className="flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight" aria-label="Omega logo">
              Ω Omega
            </span>
          </div>
          <nav aria-label="Main navigation" className="flex items-center gap-6">
            <a
              href="/docs"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </nav>
        </Container>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section aria-labelledby="hero-title" className="py-20 sm:py-28 lg:py-36">
          <Container size="md" className="text-center">
            <h1
              id="hero-title"
              className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Build your next{" "}
              <span className="text-zinc-500 dark:text-zinc-400">
                SaaS
              </span>{" "}
              on Omega
            </h1>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              A production-grade, open-source foundation with MongoDB, strict TypeScript,
              clean monorepo architecture, and modern tooling. Free and unrestricted.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/docs"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg bg-zinc-900 px-8 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Get started
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg border border-zinc-300 px-8 text-sm font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                View on GitHub
              </a>
            </div>
          </Container>
        </section>

        {/* Features Grid */}
        <section aria-labelledby="features-title" className="py-20 border-t border-zinc-200 dark:border-zinc-800">
          <Container size="lg">
            <h2
              id="features-title"
              className="text-2xl font-bold text-center sm:text-3xl mb-12"
            >
              Production-Grade Foundation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
                >
                  <div className="mb-3 text-2xl" aria-hidden="true">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>
      </main>

      {/* Footer */}
      <footer
        className="border-t border-zinc-200 dark:border-zinc-800 py-8"
        role="contentinfo"
      >
        <Container size="lg" className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            &copy; {new Date().getFullYear()} Omega. Open-source and free.
          </p>
          <nav aria-label="Footer navigation" className="flex items-center gap-6">
            <a
              href="/docs"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              Documentation
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
              GitHub
            </a>
          </nav>
        </Container>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "🏗️",
    title: "Monorepo Architecture",
    description:
      "Clean separation between frontend, backend, shared types, UI primitives, and configuration packages.",
  },
  {
    icon: "🗄️",
    title: "MongoDB + Prisma",
    description:
      "Type-safe database access with Prisma ORM, optimized for MongoDB document storage.",
  },
  {
    icon: "⚡",
    title: "Strict TypeScript",
    description:
      "Full strict mode with no unchecked indexed access and no implicit any for maximum safety.",
  },
  {
    icon: "🧩",
    title: "Modular State",
    description:
      "Zustand stores cleanly separated into auth, editor, UI, and AI slices for scalable state management.",
  },
  {
    icon: "🎨",
    title: "Responsive UI",
    description:
      "Mobile-first responsive system with accessible components and semantic HTML.",
  },
  {
    icon: "🔒",
    title: "Config Validation",
    description:
      "Zod-based environment validation ensures your app crashes safely on misconfiguration.",
  },
  {
    icon: "🧪",
    title: "Testing Ready",
    description:
      "Vitest and Testing Library configured and ready for unit and component tests.",
  },
  {
    icon: "📝",
    title: "Fully Documented",
    description:
      "Comprehensive README, architecture docs, contributing guide, and roadmap.",
  },
  {
    icon: "🆓",
    title: "Free & Open Source",
    description:
      "Completely free, no pricing, no quotas, no subscriptions. Built for the community.",
  },
];
