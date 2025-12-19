import CandidateNavbar from "@/app/recruitment/component/CandidateNavbar";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <CandidateNavbar />
      {children}
    </>
  )
}