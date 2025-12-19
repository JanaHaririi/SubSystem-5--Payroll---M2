import HRNavbar from '@/app/recruitment/component/HRNavbar'

export default function HRLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <HRNavbar />
      {children}
    </>
  )
}