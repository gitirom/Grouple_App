"use client"

import { onGetExploreGroup, onGetGroupInfo, onSearchGroups, onUpdateGroupSettings } from "@/actions/groups"
import { GroupSettingsSchema } from "@/components/forms/group-settings/schema"
import { upload } from "@/lib/uploadCare"
import { supabaseClient } from "@/lib/utils"
import { onClearList, onInfiniteScroll } from "@/redux/slices/infinte-scroll-slice"
import { onOnline } from "@/redux/slices/online-member-slice"
import { GroupStateProps, onClearSearch, onSearch } from "@/redux/slices/search-slice"
import { AppDispatch } from "@/redux/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { JSONContent } from "novel"
import { useEffect, useLayoutEffect, useState } from "react"
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
    const { data } = useQuery({
        queryKey: ["group-info"],
        queryFn: () => onGetGroupInfo(groupid),
    })

    const jsonContent = data?.group?.jsonDescription
        ? JSON.parse(data?.group?.jsonDescription as string)
        : undefined

    const [onJsonDescription, setJsonDescription] = useState<
        JSONContent | undefined
    >(jsonContent)

    const [onDescription, setOnDescription] = useState<string | undefined>(
        data?.group?.description || undefined,
    )

    const {
        register,
        formState: { errors },
        reset,
        handleSubmit,
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
        const previews = watch(({ thumbnail, icon }) => {
            if (!icon) return
            if (icon[0]) {
                setPreviewIcon(URL.createObjectURL(icon[0]))
                console.log(icon[0]);

            }
            if (thumbnail[0]) {
                setPreviewThumbnail(URL.createObjectURL(thumbnail[0]))
                console.log(thumbnail[0]);

            }
        })
        return () => previews.unsubscribe()
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



    const { mutate: update, isPending } = useMutation({
        mutationKey: ["group-settings"],
        mutationFn: async (values: z.infer<typeof GroupSettingsSchema>) => {
            if (values.thumbnail && values.thumbnail.length > 0) {
                const uploaded = await upload.uploadFile(values.thumbnail[0])
                const updated = await onUpdateGroupSettings(
                    groupid,
                    "IMAGE",
                    uploaded.uuid,
                    `/group/${groupid}/settings`,
                )
                if (updated.status !== 200) {
                    return toast("Error", {
                        description: "Oops! looks like your form is empty",
                    })
                }
            }
            if (values.icon && values.icon.length > 0) {
                const uploaded = await upload.uploadFile(values.icon[0])
                const updated = await onUpdateGroupSettings(
                    groupid,
                    "ICON",
                    uploaded.uuid,
                    `/group/${groupid}/settings`,
                )
                if (updated.status !== 200) {
                    return toast("Error", {
                        description: "Oops! looks like your form is empty",
                    })
                }
            }
            if (values.name) {
                const updated = await onUpdateGroupSettings(
                    groupid,
                    "NAME",
                    values.name,
                    `/group/${groupid}/settings`,
                )
                if (updated.status !== 200) {
                    return toast("Error", {
                        description: "Oops! looks like your form is empty",
                    })
                }
            }
            console.log("DESCRIPTION")

            if (values.description) {
                const updated = await onUpdateGroupSettings(
                    groupid,
                    "DESCRIPTION",
                    values.description,
                    `/group/${groupid}/settings`,
                )
                if (updated.status !== 200) {
                    return toast("Error", {
                        description: "Oops! looks like your form is empty",
                    })
                }
            }
            if (values.jsondescription) {
                const updated = await onUpdateGroupSettings(
                    groupid,
                    "JSONDESCRIPTION",
                    values.jsondescription,
                    `/group/${groupid}/settings`,
                )
                if (updated.status !== 200) {
                    return toast("Error", {
                        description: "Oops! looks like your form is empty",
                    })
                }
            }
            if (
                !values.description &&
                !values.name &&
                !values.thumbnail.length &&
                !values.icon.length &&
                !values.jsondescription
            ) {
                return toast("Error", {
                    description: "Oops! looks like your form is empty",
                })
            }
            return toast("Success", {
                description: "Group data updated",
            })
        },
    })
    const router = useRouter()
    const onUpdate = handleSubmit(async (values) => update(values))
    if (data?.status !== 200) router.push(`/group/create`)

    return {
        data,
        register,
        errors,
        onUpdate,
        isPending,
        previewIcon,
        previewThumbnail,
        onJsonDescription,
        setJsonDescription,
        setOnDescription,
        onDescription,
    }
}

export const useGroupList = (query: string) => {
    const { data } = useQuery({
        queryKey: [query],
    })

    const dispatch: AppDispatch = useDispatch()

    //runs synchronously after the DOM updates & useEffect Runs asynchronously after the render is committed to the screen.
    useLayoutEffect(() => {
        dispatch(onClearList({ data: [] }))
    }, [])

    const { groups, status } = data as {
        groups: GroupStateProps[]
        status: number
    }

    return { groups, status }

}

export const useExploreSlider = (query: string, paginate: number) => {
    const [onLoadSlider, setOnLoadSlider] = useState<boolean>(false);
    const dispatch: AppDispatch = useDispatch()

    const { data, refetch, isFetching, isFetched } = useQuery({
        queryKey: ["fetch-group-slider"],
        queryFn: async () => onGetExploreGroup(query, paginate | 0),
        enabled: false,
    }) 

    if (isFetching && data?.status === 200 && data.groups) {
        dispatch(onInfiniteScroll({ data: data.groups }))
    }

    useEffect(() => {
        setOnLoadSlider(true)
        return () =>{
            onLoadSlider
        }
    }, []);

    return {refetch, isFetching, data, onLoadSlider}

}