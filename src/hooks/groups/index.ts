"use client"

import { onGetExploreGroup, onGetGroupInfo, onSearchGroups, onUpdateGroupGallery, onUpdateGroupSettings } from "@/actions/groups"
import { GroupSettingsSchema } from "@/components/forms/group-settings/schema"
import { UpdateGallerySchema } from "@/components/forms/media-gallery/schema"
import { upload } from "@/lib/uploadCare"
import { supabaseClient, validateURLString } from "@/lib/utils"
import { onClearList, onInfiniteScroll } from "@/redux/slices/infinte-scroll-slice"
import { onOnline } from "@/redux/slices/online-member-slice"
import { GroupStateProps, onClearSearch, onSearch } from "@/redux/slices/search-slice"
import { AppDispatch } from "@/redux/store"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { JSONContent } from "novel"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
        return () => {
            onLoadSlider
        }
    }, []);

    return { refetch, isFetching, data, onLoadSlider }

}

export const useGroupInfo = () => {
    const { data } = useQuery({
        queryKey: ["about-group-info"],  //access the getGroup info endpoint for fetching
    })

    const router = useRouter()

    if (!data) router.push("/explore")

    const { group, status } = data as { status: number; group: GroupStateProps }

    if (status !== 200) router.push("/explore")

    return { group }

}

export const useGroupAbout = (
    description: string | null,
    jsonDescription: string | null,
    htmlDescription: string | null,
    currentMedia: string,
    groupid: string,
) => {
    const editor = useRef<HTMLFormElement | null>(null)
    const mediaType = validateURLString(currentMedia)
    const [activeMedia, setActiveMedia] = useState<
        | {
            url: string | undefined
            type: string
        }
        | undefined
    >(
        mediaType.type === "IMAGE"
            ? {
                url: currentMedia,
                type: mediaType.type,
            }
            : { ...mediaType },
    )

    const jsonContent = jsonDescription !== null ? JSON.parse(jsonDescription as string ) : undefined

    const [onJsonDescription, setJsonDescription] = useState<
        JSONContent | undefined
    >(jsonContent)

    const [onDescription, setOnDescription] = useState<string | undefined>(
        description || undefined,
    )

    const [onHtmlDescription, setOnHtmlDescription] = useState<
        string | undefined
    >(htmlDescription || undefined)

    const [onEditDescription, setOnEditDescription] = useState<boolean>(false)

    useEffect(() => {
        const newMediaType = validateURLString(currentMedia);
        setActiveMedia(
            newMediaType.type === "IMAGE"
                ? {
                    url: currentMedia,
                    type: newMediaType.type,
                }
                : { ...newMediaType },
        )
    }, [groupid, currentMedia]);


    //get data from the form
    const { 
        setValue,
        formState: { errors },
        handleSubmit,
    } = useForm<z.infer<typeof GroupSettingsSchema>>({
        resolver: zodResolver(GroupSettingsSchema),
    })

    //update the form with the data
    const onSetDescriptions = () => {
        const JsonContent = JSON.stringify(onJsonDescription)
        setValue("jsondescription", JsonContent)
        setValue("description", onDescription)
        setValue("htmldescription", onHtmlDescription)
    }

    useEffect(() => {
        onSetDescriptions()
        return () => {
            onSetDescriptions()
        }
    }, [onJsonDescription, onDescription]) //if onJsonDescription or onDescription changes, run the function

    //sets up an event listener to detect clicks outside of a text editor component and updates the state accordingly to indicate whether the editor is being edited or not.
    const onEditTextEditor = (event: Event) => {
        if (editor.current) {
            !editor.current.contains(event.target as Node | null) 
                ? setOnEditDescription(false) 
                : setOnEditDescription(true)
        }
    }

    
    useEffect(() => {
        document.addEventListener("click", onEditTextEditor, false)
        return () => {
            document.removeEventListener("click", onEditTextEditor, false)
        }
    }, [])

    //add optimisctic UI updates
    const { mutate, isPending } = useMutation({
        mutationKey: ["about-description"],
        mutationFn: async (values: z.infer<typeof GroupSettingsSchema>) => {
            if (values.description) {
                const updated = await onUpdateGroupSettings(
                    groupid,
                    "DESCRIPTION",
                    values.description,
                    `/about/${groupid}`,
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
                    `/about/${groupid}`,
                )
                if (updated.status !== 200) {
                    return toast("Error", {
                        description: "Oops! looks like your form is empty",
                    })
                }
            }
            if (values.htmldescription) {
                const updated = await onUpdateGroupSettings(
                    groupid,
                    "HTMLDESCRIPTION",
                    values.htmldescription,
                    `/about/${groupid}`,
                )
                if (updated.status !== 200) {
                    return toast("Error", {
                        description: "Oops! looks like your form is empty",
                    })
                }
            }
            if (
                !values.description &&
                !values.jsondescription &&
                !values.htmldescription
            ) {
                return toast("Error", {
                    description: "Oops! looks like your form is empty",
                })
            }
            return toast("Success", {
                description: "Group settings updated successfully",
            })
        },
    })

    const onSetActiveMedia = (media: {url: string | undefined; type: string}) => {
        onSetActiveMedia(media)
    }

    //handle form submission to invoke the mutaion function
    const onUpdateDescription = handleSubmit(async (values) => mutate(values))

    return {  // return the following values to be used in the component
        setOnDescription,
        onDescription,
        setJsonDescription,
        onJsonDescription,
        errors: {},
        onEditDescription,
        editor,
        activeMedia,
        onSetActiveMedia: setActiveMedia,
        setOnHtmlDescription,
        onUpdateDescription: () => {},
        isPending: false,
    }

}

export const useMediaGallery = (groupid: string) => {
    const {
        register,
        formState: { errors },
        handleSubmit,
    } = useForm<z.infer<typeof UpdateGallerySchema>>({
        resolver: zodResolver(UpdateGallerySchema),
    })
    const { mutate, isPending } = useMutation({
        mutationKey: ["update-gallery"],
        mutationFn: async (values: z.infer<typeof UpdateGallerySchema>) => {

            
            //update the gallery with the new video
            if (values.videourl) {
                console.log(values.videourl);
                const update = await onUpdateGroupGallery(groupid, values.videourl)
                if (update && update.status !== 200) {
                    return toast("Error", {
                        description: update?.message,
                    })
                }
            }
            //update the gallery with the new image
            if (values.image && values.image.length) {
                let count = 0
                //upload multi images 
                while (count < values.image.length) {
                    const uploaded = await upload.uploadFile(values.image[count])
                    if (uploaded) {
                        const update = await onUpdateGroupGallery(groupid, uploaded.uuid)
                        if (update && update?.status !== 200) {
                            return toast("Error", {
                                description: update?.message,
                            })
                        }
                    }else {
                        return toast("Error", {
                            description: "Oops! looks like something went wrong!",
                        })
                    }
                    count++
                }
            }
            return toast("Success", {
                description: "Group Gallery updated successfully",
            })
        },
    })

    const onUpdateGallery = handleSubmit(async (values) => mutate(values))

    return { register, errors, onUpdateGallery, isPending }

}