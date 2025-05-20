import { onDeleteChannel, onGetChannelInfo, onUpdateChannelInfo } from "@/actions/channels";
import { useMutation, useMutationState, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";


export const useChannelInfo = () => {  //utilizing optimistic updates for a smooth user experience.
    const channelRef = useRef<HTMLAnchorElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const triggerRef = useRef<HTMLButtonElement | null>(null)
    const [channel, setChannel] = useState<string | undefined>(undefined)
    const [edit, setEdit] = useState<boolean>(false)
    const [icon, setIcon] = useState<string | undefined>(undefined)
    const client = useQueryClient()

    const onEditChannel = (id: string | undefined) => {
        setChannel(id)
        setEdit(true)
    }

    const onSetIcon = (icon: string | undefined) => setIcon(icon)

    //Optimistic UI with useMutation
    const {isPending, mutate, variables} = useMutation({
        mutationFn: (data: {name?: string; icon?: string}) => 
            onUpdateChannelInfo(channel!, data.name, data.icon),
        onMutate: () => {  //called before the mutation function is fired.
            setEdit(false)
            onSetIcon(undefined)
        },
        onSuccess: (data) => { //called if the mutation is successful.
            return toast(data.status !== 200 ? "Error" : "Success", {
                description: data.message,
            })
        },
        onSettled: async () => { // It invalidates the "group-channels" query to refetch the data and ensure the UI is up to date.
            return await client.invalidateQueries({
                queryKey: ["group-channels"],
            })
        },

    })

    const { variables: deleteVariables, mutate: deleteMutation } = useMutation({
        mutationFn: (data: { id: string }) => onDeleteChannel(data.id),
        onSuccess: (data) => {
            return toast(data.status !== 200 ? "Error" : "Success", {
                description: data.message,
            })
        },
        onSettled: async () => {
            return await client.invalidateQueries({
                queryKey: ["group-channels"],
            })
        },
    })

    const onEndChannelEdit = (event: Event) => {  //triggered on a click event to end the edit mode if the click is outside specific elements.
        if (inputRef.current && channelRef.current && triggerRef.current) {
            if (
                !inputRef.current.contains(event.target as Node | null) &&
                !channelRef.current.contains(event.target as Node | null) &&
                !triggerRef.current.contains(event.target as Node | null) &&
                !document.getElementById("icon-list")
            ) {
                if (inputRef.current.value) {
                    mutate({
                        name: inputRef.current.value,
                    })
                }
                if (icon) {
                    mutate({ icon })
                } else {
                    setEdit(false)
                }
            }
        }
    }

    useEffect(() => {
        document.addEventListener("click", onEndChannelEdit, false)
        return () => {
            document.removeEventListener("click", onEndChannelEdit, false)
        }
    }, [icon]);

    //trigger the delete mutation
    const onChannelDetele = (id : string) => deleteMutation({ id })

    return {
        channel,
        onEditChannel,
        channelRef,
        edit,
        inputRef,
        variables,
        isPending,
        triggerRef,
        onSetIcon,
        icon,
        onChannelDetele,
        deleteVariables,
    }

}


export const useChannelPage = (channelid: string) => {
    const { data } = useQuery({
        queryKey: ["channel-info"],
        queryFn: () => onGetChannelInfo(channelid),
    })

    const mutation = useMutationState({ //track the state of post creations, useful because The post creation might happen in a modal or different component
        filters: { mutationKey: ["create-post"], status: "pending" },
        select: (mutation) => {
            return {
                state: mutation.state.variables as any,
                status: mutation.state.status,
            }
        },
    })

    return { data, mutation }
}
