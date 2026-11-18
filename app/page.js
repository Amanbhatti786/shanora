import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Top Navbar for Landing Page */}
      <header className="w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600 tracking-tight">
            SHANORA
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth" className="text-gray-600 hover:text-blue-600 font-medium px-3 py-2 transition">
              Sign In
            </Link>
            <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition shadow-sm">
              Join Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-20">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
          Welcome to your <br className="hidden sm:block" />
          <span className="text-blue-600">Professional Community</span>
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mb-10">
          Build your career, connect with industry leaders, and discover high-paying jobs. Join SHANORA today and take the next step in your professional journey.
        </p>
        <Link href="/auth" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg transition shadow-lg flex items-center gap-2">
          Join SHANORA – It's Free 🚀
        </Link>
      </main>

    </div>
  );
        }
