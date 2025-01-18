import { onAuthenticatedUser } from "@/actions/auth"
import { currentUser } from "@clerk/nextjs/server"
import { QueryClient } from "@tanstack/react-query"

type Props = {}

const GroupChannelPage = async (props: Props) => {
    const client = new QueryClient()
    const user = await currentUser()
    const authUser = await onAuthenticatedUser()

    //fetch chenel info
    await client.prefetchQuery({
        queryKey: ["chnnel-info"],
        queryFn: async () => onGetChannelInfo(params.channelid),
    })

    //fetch group info
    await client.prefetchQuery({
        queryKey: ["about-group-info"],
        queryFn: async () => onGetGroupInfo(params.groupid),
    })

    return (
        <div>GroupChannelPage</div>
    )
}

export default GroupChannelPage