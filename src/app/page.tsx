'use client'

import Image from 'next/image'

const features = [
  {
    title: 'Advanced Trade Tool',
    icon: '🤖',
    description: 'Offers machine learning logic, along with AI powered trade suggestions.',
    link: '/trade-tool',
  },
  {
    title: 'League Messaging & Chat',
    icon: '💬',
    description: 'Real-time communication platform for league members and commissioners.',
  },
  {
    title: 'AI Assistant',
    icon: '🤖',
    description: 'Your personal AI companion for league management and decision-making.',
  },
  {
    title: 'Draft Assistant',
    icon: '📝',
    description: 'AI-powered draft board builder with sleeper alerts.',
  },
]

export default function HomePage() {
  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-black via-gray-900 to-gray-800 animate-gradient-x" />
      
      {/* Hero Section */}
      <section className="w-full max-w-4xl text-center mb-12">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/couch-commish-logo.png"
            alt="Couchlytics Logo"
            width={200}
            height={80}
            className="h-20 w-auto"
          />
        </div>
        
        <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 text-neon-green drop-shadow-lg">
          Welcome to Couchlytics
        </h1>
        <p className="text-xl sm:text-2xl max-w-2xl mx-auto mb-8 text-gray-200 font-medium">
          The Ultimate Esports League Management Platform.
        </p>
      </section>

      {/* Features Grid */}
      <section className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="backdrop-blur-md bg-gray-800/70 border border-gray-700/40 p-8 rounded-2xl shadow-xl flex flex-col items-center hover:scale-105 hover:bg-gray-700/80 transition-all duration-300"
          >
            <div className="text-5xl mb-4 drop-shadow-lg">{feature.icon}</div>
            <h3 className="text-2xl font-bold mb-2 text-white">{feature.title}</h3>
            <p className="text-base text-gray-300 font-medium">{feature.description}</p>
          </div>
        ))}
      </section>

      {/* Ozzie AI Assistant Section */}
      <section className="w-full max-w-4xl mb-16">
        <div className="backdrop-blur-md bg-gray-800/70 border border-gray-700/40 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 drop-shadow-lg">🤖</div>
            <h2 className="text-4xl font-extrabold mb-4 text-neon-green tracking-wide">
              Meet Ozzie - Your AI League Assistant
            </h2>
            <p className="text-xl text-gray-300 font-medium">
              The most advanced AI companion ever created for esports league management
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-2xl font-bold mb-3 text-white flex items-center">
                  <span className="text-3xl mr-3">🧠</span>
                  Natural Language Processing
                </h3>
                <p className="text-gray-300">
                  Ask Ozzie anything in plain English! &ldquo;Who should I trade for a quarterback?&rdquo; 
                  &ldquo;What&apos;s the best draft strategy for my team?&rdquo; &ldquo;Show me the top performers this week.&rdquo; 
                  Ozzie understands context and provides intelligent, actionable responses.
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-2xl font-bold mb-3 text-white flex items-center">
                  <span className="text-3xl mr-3">📊</span>
                  Advanced Analytics
                </h3>
                <p className="text-gray-300">
                  Get instant insights into player performance, team statistics, and league trends. 
                  Ozzie analyzes thousands of data points to provide you with the most relevant 
                  information for making informed decisions.
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-2xl font-bold mb-3 text-white flex items-center">
                  <span className="text-3xl mr-3">💡</span>
                  Trade Analysis & Suggestions
                </h3>
                <p className="text-gray-300">
                  Get instant trade evaluations with detailed breakdowns of value, risk assessment, 
                  and strategic recommendations. Ozzie considers team needs, salary cap implications, 
                  and future roster planning.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-2xl font-bold mb-3 text-white flex items-center">
                  <span className="text-3xl mr-3">🎯</span>
                  Draft Strategy & Scouting
                </h3>
                <p className="text-gray-300">
                  Discover hidden gems and build the perfect draft board. Ozzie provides detailed 
                  scouting reports, sleeper alerts, and position-specific rankings based on your 
                  team&apos;s specific needs and league format.
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-2xl font-bold mb-3 text-white flex items-center">
                  <span className="text-3xl mr-3">⚡</span>
                  Real-Time Updates
                </h3>
                <p className="text-gray-300">
                  Stay ahead of the competition with instant notifications about injuries, 
                  roster changes, and breaking news. Ozzie keeps you informed with the latest 
                  updates that could impact your team.
                </p>
              </div>
              
              <div className="bg-gray-700/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-2xl font-bold mb-3 text-white flex items-center">
                  <span className="text-3xl mr-3">🏆</span>
                  Championship Intelligence
                </h3>
                <p className="text-gray-300">
                  From preseason planning to playoff strategy, Ozzie helps you build a championship 
                  roster. Get personalized advice on roster construction, waiver wire priorities, 
                  and in-season management tactics.
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <div className="bg-neon-green/20 border border-neon-green/30 rounded-xl p-6">
              <h3 className="text-2xl font-bold mb-3 text-neon-green">
                Ready to Dominate Your League?
              </h3>
              <p className="text-gray-300 mb-4">
                Join thousands of commissioners who are already using Ozzie to gain the competitive edge. 
                Experience the future of esports league management today.
              </p>
              <div className="text-sm text-gray-400">
                <strong>Available 24/7</strong> • <strong>Multi-League Support</strong> • <strong>Advanced AI Technology</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="w-full text-center mt-8 mb-2 text-gray-500 text-xs">
        Built by Madden commissioners, for Madden commissioners.
      </footer>

      {/* Optional: Add a subtle animated gradient effect */}
      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 12s ease-in-out infinite;
        }
      `}</style>
    </main>
  )
}
