"use client"

import { supabaseClient } from "@/lib/utils"
import { AppDispatch } from "@/redux/store"
import { useEffect } from "react"
import { useDispatch } from "react-redux"

// this custom hook connects to a Supabase channel for real-time presence tracking, listens for updates on which users are online,
// and dispatches actions to update the Redux store with the online status of users.
// Supabase channels are used for real-time data updates.

export const useGroupChatOnline = (userid: string) => {
    const dispatch: AppDispatch = useDispatch()

    useEffect(() => {
        const channel = supabaseClient.channel("tracking")

        channel
            .on("presence", { event: "sync" }, () => {
                const state: any = channel.presenceState() // Retrieves the current state of users subscribed to the channel and user Info.
                console.log(state)
                for (const user in state) {
                    dispatch(
                        onOnline({
                            members: [{ id: state[user][0].member.userid }],  // Updates the online status with the user's ID.
                        }),
                    )
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        member: {
                            userid, //// Sends the user ID of the current user to the channel.
                        },
                    })
                }
            })

        return () => {
             // Cleanup function to unsubscribe from the channel when the component unmounts
            channel.unsubscribe()
        }
    }, [])
}
