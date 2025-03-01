
import { onGetExploreGroup } from "@/actions/groups"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import ExplorePageContent from "./_componnents/explore-content"

type Props = {}

const ExplorePage = async (props: Props) => {
    const query = new QueryClient()

    await query.prefetchQuery({
        queryKey: ["fitness"],
        queryFn: () => onGetExploreGroup("fitness", 0),
    })

    await query.prefetchQuery({
        queryKey: ["music"],
        queryFn: () => onGetExploreGroup("music", 0),
    })

    await query.prefetchQuery({
        queryKey: ["lifestyle"],
        queryFn: () => onGetExploreGroup("lifestyle", 0),
    })

    return (
        <HydrationBoundary state={dehydrate(query)} >   {/*handle server-side data hydration. It ensures that data fetched on the server is properly available and matches on the client, preventing React hydration errors. */}
            <ExplorePageContent layout="SLIDER" />
        </HydrationBoundary>
    )
}

export default ExplorePage
