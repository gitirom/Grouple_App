import dynamic from "next/dynamic";
import CallToAction from "./_componnents/call-to-action";
import DashboardSnippet from "./_componnents/dashboard-snippet";

//dynamic import
const PricingSection = dynamic (
    () => 
        import("./_componnents/pricing").then(
            (component) => component.PricingSection,
        ),
        {ssr: true},
)

export default function Home() {
    return (
        <main className="md:px-10 py-20 flex flex-col gap-36">
            <div>
                <CallToAction />
                <DashboardSnippet />
            </div>
            <PricingSection />
        </main>
    )
}
