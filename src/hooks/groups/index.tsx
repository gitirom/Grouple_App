"use client"

import { onGetGroupInfo, onSearchGroups } from "@/actions/groups"
import { GroupSettingsSchema } from "@/components/forms/group-settings/schema"
import { upload } from "@/lib/uploadCare"
import { supabaseClient } from "@/lib/utils"
import { onOnline } from "@/redux/slices/online-member-slice"
import { onClearSearch, onSearch } from "@/redux/slices/search-slice"
import { AppDispatch } from "@/redux/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { JSONContent } from "novel"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useDispatch } from "react-redux"
import { toast } from "sonner"
import { z } from "zod"

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
                for (const user in state) {
                    dispatch(
                        onOnline({
                            members: [{ id: state[user][0].member.userid }], // Updates the online status with the user's ID.
                        }),
                    )
                }
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        member: {
                            userid, // Sends the user ID of the current user to the channel.
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

export const useSearch = (search: "GROUPS" | "POSTS") => {
    const [query, setQuery] = useState<string>("")
    const [debounce, setDebounce] = useState<string>("")

    const dispatch: AppDispatch = useDispatch()

    // Event handler for updating the search query state when the input value changes
    const onSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) =>
        setQuery(e.target.value)

    // reducing the number of search queries sent by introducing a 1-second delay after the user stops typing.
    useEffect(() => {
        const delayInputTimeoutId = setTimeout(() => {
            setDebounce(query)
        }, 1000)
        return () => clearTimeout(delayInputTimeoutId)
    }, [query, 1000])

    const { refetch, data, isFetched, isFetching } = useQuery({
        queryKey: ["search-data", debounce],
        queryFn: async ({ queryKey }) => {
            if (search === "GROUPS") {
                const groups = await onSearchGroups(search, queryKey[1]) // Fetching groups data based on the debounced query
                return groups
            }
        },
        enabled: false,
    })

     // Dispatching an action to indicate search is in progress when fetching
    if (isFetching)
        dispatch(
            onSearch({
                isSearching: true,
                data: [],
            }),
        )

    if (isFetched)
        dispatch(
            onSearch({
                isSearching: false,
                status: data?.status as number,
                data: data?.groups || [],
                debounce,
            }),
        )

        //refetch data when debounce changes or clear search if debounce is empty
    useEffect(() => {
        if (debounce) refetch()
        if (!debounce) dispatch(onClearSearch())
        return () => {
            debounce
        }
    }, [debounce])

    return { query, onSearchQuery }
}




export const useGroupSettings = (groupid: string) => {

    //let's get group info 
    const {data} = useQuery({    //fetch and cache API responses GET
        queryKey: ["group-info"],
        queryFn: async () => onGetGroupInfo(groupid)
    })

    //get group content here
    const jsonContent = 
        data?.group?.jsonDescription !== null
        ? JSON.parse(data?.group?.jsonDescription as string)
        : undefined

        const [onJsonDescription, setJsonDescription] = useState<
            JSONContent | undefined
        >(jsonContent)

        const [onDescription, setOnDescription] = useState<string | undefined >(data?.group?.description || undefined);

    //form handling here for group settings form using useForm
    const {
        register,
        formState: {errors},
        handleSubmit,
        reset,
        watch,
        setValue,
    } = useForm<z.infer<typeof GroupSettingsSchema>>({
        resolver: zodResolver(GroupSettingsSchema),
        mode: "onChange",
    })

    const [previewIcon, setPreviewIcon] = useState<string | undefined>(undefined)
    const [previewThumbnail, setPreviewThumbnail] = useState<string | undefined>(
        undefined,
    )

    useEffect(() => {
        const previews = watch(({ thumbnail, icon}) => { // Re-renders when " thumbnail, icon" changes
            if (icon[0]) {
                setPreviewIcon(URL.createObjectURL(icon[0]));
            }
            if (thumbnail[0]) {
                setPreviewThumbnail(URL.createObjectURL(thumbnail[0]));
            }
        })
        return () => previews.unsubscribe();    //clean up this subscription to prevent memory leaks or unwanted updates.
    }, [watch])

    const onSetDescriptions = () => {
        const JsonContent = JSON.stringify(onJsonDescription)
        setValue("jsondescription", JsonContent)
        setValue("description", onDescription)
    }

    useEffect(() => {
        onSetDescriptions()
        return () => {
            onSetDescriptions()
        }
    }, [onJsonDescription, onDescription])

    const { mutate: update, isPending} = useMutation({  //Used for modifying data (POST, PUT, DELETE)
        mutationKey: ["group-settings"],
        mutationFn: async (values: z.infer<typeof GroupSettingsSchema>) => {
            if (values.thumbnail && values.thumbnail.length > 0) {
                const uploaded = await upload.uploadFile(values.thumbnail[0])
                const updated = await onUpDateGroupSettings(
                    groupid,
                    "IMAGE",
                    uploaded.uuid,
                    `/group/${groupid}/settings`,
                )

                if (updated.status !== 200) {
                    return toast("Error",{ description: "Oops! looks like your form is empty"})
                }
            }
        }
    })

}