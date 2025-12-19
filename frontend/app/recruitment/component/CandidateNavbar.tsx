// components/CandidateNavbar.tsx
export default function CandidateNavbar() {
  return (
    <nav className="text-white shadow-lg" style={{ backgroundColor: '#68358fff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Candidate Portal</h1>
          </div>
          <div className="flex space-x-6">
            <a href="/recruitment/candidate/dashboard" className="hover:text-purple-200 transition">
              Dashboard
            </a>
            <a href="/recruitment/careers" className="hover:text-purple-200 transition">
              Browse Jobs
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}