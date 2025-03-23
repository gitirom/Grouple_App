"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Logout, Settings } from "@/icons"
import { FourBoxIcon } from "@/icons/fourBoxIcon"
import { supabaseClient } from "@/lib/utils"
import { onOffline } from "@/redux/slices/online-member-slice"
import { AppDispatch } from "@/redux/store"
import { useClerk } from "@clerk/nextjs"
import Link from "next/link"
import { useDispatch } from "react-redux"
import { DropDown } from "../drop-down"


type Props = {
    image: string
    groupid?: string
    userid?: string
}

const UserAvatar = ({ image, groupid, userid }: Props) => {
    const { signOut } = useClerk()

    const untrackPresence = async () => {
        await supabaseClient.channel("tracking").untrack()
    }

    const dispatch: AppDispatch = useDispatch()

    const onLogout = async () => {
        untrackPresence()
        dispatch(onOffline({ members: [{ id: userid! }] }))
        signOut({ redirectUrl: "/" })
    }

    return (
        <DropDown 
            title="Account"
            trigger={
                <Avatar className="cursor-pointer" >
                    <AvatarImage src={image} alt="user" />
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            }
        >
            <div className="flex flex-col gap-2">
                
                <Link href={'/explore'} className="flex gap-x-2 px-2 " >
                    <FourBoxIcon />Explore
                </Link>
                <Link href={`/group/${groupid}/settings`} className="flex gap-x-2 px-2 " >
                    <Settings />Settings
                </Link>
            </div>
            <Button 
                onClick={onLogout}
                variant="ghost"
                className="flex gap-x-3 px-2 justify-start w-full"
            >
                <Logout />
                Logout
            </Button>
        </DropDown>
    )
}

export default UserAvatar