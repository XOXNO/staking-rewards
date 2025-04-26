export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-100 dark:bg-zinc-900">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm flex flex-col">
        <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-6">
          Hello, Tailwind CSS v4!
        </h1>
        <p className="text-zinc-700 dark:text-zinc-300 text-center max-w-md">
          This is a simple Next.js project with Tailwind CSS v4 using the
          simplified installation.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm transition-all hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Zero Configuration
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Start using the framework without configuring anything, not even
              paths to your template files.
            </p>
          </div>
          <div className="p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-sm transition-all hover:shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              Just One Line of CSS
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              No more @tailwind directives, just add @import &quot;tailwindcss&quot; and
              start building.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
