"use client"
import { usePathname } from "next/navigation"
import { IChannels } from "."

type Props = {
    channels: IChannels[]
    optimisticChannel:
        | {
              id: string
              name: string
              icon: string
              createdAt: Date
              groupId: string | null
          }
        | undefined
    loading: boolean
    groupid: string
    groupUserId: string
    userId: string
}

const SideBarMenu = ({
    channels,
    optimisticChannel,
    loading,
    groupid,
    groupUserId,
    userId,
}: Props) => {
    const pathname = usePathname()
    const currentPage = pathname.split("/").pop()

    const {
        channel: current,
        onEditChannel,
        channelRef,
        inputRef,
        variables,
        isPending,
        edit,
        triggerRef,
        onSetIcon,
        icon,
        onChannelDetele,
        deleteVariables,
    } = useChannelInfo()


    return <div>SideBarMenu</div>
}

export default SideBarMenu
