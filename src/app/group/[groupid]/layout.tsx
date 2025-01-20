import { onAuthenticatedUser } from "@/actions/auth"
import { onGetAllGroupMembers, onGetGroupChannels, onGetGroupInfo, onGetGroupSubscriptions, onGetUserGroups } from "@/actions/groups"
import SideBar from "@/components/global/sidebar"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import { redirect } from "next/navigation"
import { Navbar } from "../_components/navbar"

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
        queryFn: async () => onGetGroupInfo(params.groupid),
    })


    //fetch user groups
    await query.prefetchQuery({
        queryKey: ["user-groups"], 
        queryFn: async () => onGetUserGroups(user.id as string),
    })

    //fetch channels
    await query.prefetchQuery({
        queryKey: ["group-channels"], 
        queryFn: async () => onGetGroupChannels(params.groupid),
    })

    //fetch groupe subscriptions
    await query.prefetchQuery({
        queryKey: ["group-subscriptions"], 
        queryFn: async () => onGetGroupSubscriptions(params.groupid),
        })

    //fetch member_chats
    await query.prefetchQuery({
        queryKey: ["member-chats"],
        queryFn: async () => onGetAllGroupMembers(params.groupid),
    })

    return (
        <HydrationBoundary state={dehydrate(query)} >     {/*HydrationBoundary helps bridge the gap between server-rendered HTML and client-side React, ensuring a smooth transition and optimal data handling. */}
            <div className="flex h-screen md:pt-5 ">
                <SideBar groupid={params.groupid} userid={user.id} />
                <div className="md:ml-[300px] flex flex-col flex-1 bg-[#101011] md:rounded-tl-xl overflow-y-auto border-l-[1px] border-t-[1px] border-[#28282D]">
                    <Navbar  groupid={params.groupid} userid={user.id}  />
                    {children}
                    {/* <MobileNav groupid={params.groupid} /> */}
                </div>
            </div>
        </HydrationBoundary>
    )
}

export default GroupLayout