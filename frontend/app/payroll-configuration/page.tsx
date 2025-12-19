import React from 'react'
import Link from 'next/link'

const sampleConfigs = [
	{ id: 'company-settings', name: 'Company Settings', description: 'Pay date, time zone, currency, pay cycle' },
	{ id: 'tax-documents', name: 'Tax Documents', description: 'Create and download employee tax forms' },
	{ id: 'disputes', name: 'Payroll Disputes', description: 'Submit or review payroll error disputes' },
]

export default function PayrollConfigurationPage() {
	return (
    <main className="min-h-screen bg-gray-900 text-gray-100 px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Payroll Configurations</h1>
          <p className="mt-2 text-sm text-gray-300">
            Manage payroll settings used during payroll execution.
          </p>
			</div>

        <ul className="space-y-3">
				{sampleConfigs.map((c) => (
            <li
              key={c.id}
              className="p-4 rounded-lg border border-gray-800 bg-gray-800/80 flex items-center justify-between"
            >
						<div>
                <div className="font-medium text-lg">{c.name}</div>
                <div className="text-sm text-gray-300">{c.description}</div>
						</div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/payroll-configuration/${c.id}`}
                  className="text-blue-300 hover:text-blue-200 text-sm font-medium"
                >
                  View
                </Link>
                <Link
                  href={`/payroll-configuration/${c.id}/edit`}
                  className="text-gray-300 hover:text-gray-100 text-sm font-medium"
                >
                  Edit
                </Link>
						</div>
					</li>
				))}
			</ul>
      </div>
		</main>
  );
}

