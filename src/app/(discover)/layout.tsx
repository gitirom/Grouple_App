import { Navbar } from "./_componnents/navbar"

type ExploreLayoutProps = {
    children: React.ReactNode
}

const ExploreLayout = ({children}: ExploreLayoutProps) => {
    return (
        <div className="flex flex-col min-h-screen bg-black pb-10 " >
            <Navbar />
            {children}
        </div>
    )
}

export default ExploreLayout