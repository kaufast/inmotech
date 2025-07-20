import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-white mb-8">
            Real Estate Investment Platform
          </h1>
          <p className="text-xl text-gray-200 mb-12 max-w-3xl mx-auto">
            Invest in premium real estate properties with complete transparency, 
            security, and legal compliance. Start building your property portfolio today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/register"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-purple-900 font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">🔒 Secure & Compliant</h3>
            <p className="text-gray-200">
              All investments are backed by certified notaries and blockchain technology 
              for maximum security and transparency.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">💰 High Returns</h3>
            <p className="text-gray-200">
              Target annual returns of 10-14% on carefully selected premium 
              real estate properties across Spain.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
            <h3 className="text-xl font-semibold mb-4">🏠 Premium Properties</h3>
            <p className="text-gray-200">
              Invest in luxury penthouses, smart apartments, and beachfront 
              properties in prime locations.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">Demo Accounts</h2>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto">
            <div className="space-y-4 text-white">
              <div>
                <h4 className="font-semibold">👤 Admin Account</h4>
                <p className="text-sm text-gray-200">admin@platform.com / admin123!Admin</p>
              </div>
              <div>
                <h4 className="font-semibold">👤 Investor Account</h4>
                <p className="text-sm text-gray-200">investor@demo.com / investor123!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}