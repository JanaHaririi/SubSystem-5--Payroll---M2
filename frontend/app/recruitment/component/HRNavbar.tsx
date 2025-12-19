// components/HRNavbar.tsx
export default function HRNavbar() {
  return (
    <nav className="text-white shadow-lg" style={{ backgroundColor: '#68358fff' }}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            {/* Smaller and bold title */}
            <h1 className="text-xl font-bold">HR Portal</h1>
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="/recruitment/hr/dashboard" className="font-bold hover:text-purple-200 transition">
              Templates & Requisitions
            </a>
            <a href="/recruitment/hr/applications" className="font-bold hover:text-purple-200 transition">
              Applications
            </a>
            <a href="/recruitment/hr/interviews" className="font-bold hover:text-purple-200 transition">
              Interviews
            </a>
            <a href="/recruitment/hr/offers" className="font-bold hover:text-purple-200 transition">
              Offers & Contracts
            </a>
            <a href="/recruitment/hr/termination" className="font-bold hover:text-purple-200 transition">
              Termination
            </a>
            <a href="/recruitment/hr/checklists" className="font-bold hover:text-purple-200 transition">
              Checklists
            </a>
            <a href="/recruitment/careers" className="font-bold hover:text-purple-200 transition">
              Career Page
            </a>
            <a href="/recruitment/hr/notifications" className="font-bold hover:text-purple-200 transition">
              Notifications
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}
