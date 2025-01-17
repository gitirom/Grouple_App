import { onAuthenticatedUser } from "@/actions/auth"
import { QueryClient } from "@tanstack/react-query"
import { redirect } from "next/navigation"

type Props = {
    children: React.ReactNode
    params: {
        groupid: string
    }
}

const GroupLayout = async ({children, params}: Props) => {
    const query = new QueryClient()  //handling server-state management

    const user = await onAuthenticatedUser()
    if (!user.id) redirect("/sign_in") 

    //fetch groupe Info
    await query.prefetchQuery({   //fetch and **Cache** data before it is needed by the component
        queryKey: ["group-info"], //store and retrieve cached data
        // queryFn: async () => onGetGroupInfo(params.groupid),
    })


    //fetch user groups
    //fetch channels
    //fetch groupe subscriptions
    //fetch member_chats

    return (
        <div>GroupLayout</div>
    )
}

export default GroupLayout