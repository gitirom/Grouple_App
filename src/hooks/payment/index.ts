"use client"

import { onCreateNewGroup, onGetGroupChannels, onJoinGroup } from "@/actions/groups";
import { onCreateNewGroupSubscription, onGetActiveSubscription, onGetGroupSubscriptionPaymentIntent, onGetStripeClientSecret, onTransferCommission } from "@/actions/payments";
import { CreateGroupSchema } from "@/components/forms/create-groupe/schema";
import { CreateGroupSubscriptionSchema } from "@/components/forms/subscription/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, StripeCardElement } from "@stripe/stripe-js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
export const useStripeElements = () => {
    // Initializes Stripe.js using the publishable key from environment variables
    const StripePromise = async () => 
        await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY as string)
    return { StripePromise }
}

export const usePayments = (
    userId: string, // The ID of the user making the payment
    affiliate: boolean, // Boolean indicating if the user is an affiliate
    stripeId?: string, // Optional Stripe ID associated with the user
) => {
    const [isCategory, setIsCategory] = useState<string | undefined>(undefined);

    const router = useRouter();

    // Stripe hooks for managing payment functionality
    const stripe = useStripe(); // Retrieves the Stripe object for processing payments
    const elements = useElements(); // Provides UI components like card input fields
    // Sets up the form with validation using Zod and React Hook Form


    const {
        reset, // Resets the form values
        handleSubmit, // Handles form submission
        formState: { errors }, // Tracks form validation errors
        register, // Registers form inputs
        watch, // Watches form inputs for real-time changes
    } = useForm<z.infer<typeof CreateGroupSchema>>({
        resolver: zodResolver(CreateGroupSchema), // Uses Zod schema for validation
        defaultValues: {
            category: "", // Default value for the category field
        },
    });

    useEffect(() => {
        // Watches the `category` field and updates the `IsCategory` state when it changes
        const category = watch(({ category }) => {
            if (category) {
                setIsCategory(category)
            }
        })
        return () => category.unsubscribe()  // Cleans up the subscription to avoid memory leaks
    }, [watch]);

    // Fetches the payment intent (client secret) using React Query
    const { data: Intent, isPending: creatingIntent } = useQuery({
        queryKey: ["payment-intent"],  //React Query uses this key to cache the result of the query
        queryFn: () => onGetStripeClientSecret(),
    })

    //// `useMutation` used to handle asynchronous mutations.
        const { mutateAsync: createGroup, isPending } = useMutation({
            mutationFn: async (data: z.infer<typeof CreateGroupSchema>) => {
            if (!stripe || !elements || !Intent) {
                return null
            }
        
            // Attempt to confirm card payment with Stripe using the payment intent secret and card element.
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                Intent.secret!,
                {
                payment_method: {
                    card: elements.getElement(CardElement) as StripeCardElement,
                },
                },
            )
        
            if (error) {
                return toast("Error", {
                description: "Oops! something went wrong, try again later",
                })
            }
        
            //// Check if the payment was successful.
            if (paymentIntent?.status === "succeeded") {
                console.log(paymentIntent.status);
                //// If `affiliate` is defined, handle commission transfer for the affiliate. 20%
                if (affiliate) {
                    await onTransferCommission(stripeId!)  //transfer directly from stripe to client 
                }
                // Create a new group using the provided data and user ID.
                const created = await onCreateNewGroup(userId, data)
                if (created && created.status === 200) {
                    toast("Success", {
                    description: created.message,
                })
                router.push(
                    `/group/${created.data?.group[0].id}/channel/${created.data?.group[0].channel[0].id}`,
                )
                }
                if (created && created.status !== 200) {
                    reset()
                    return toast("Error", {
                    description: created.message,
                })
                }
            }
            },
        })

        const onCreateGroup = handleSubmit(async (values) => createGroup(values))

        return {
            onCreateGroup,
            isPending,
            register,
            errors,
            isCategory,
            creatingIntent,
        }

}

//fetching subscription details for a group.
export const useActiveGroupSubscription = (groupId: string) => {
    const { data } = useQuery({
        queryKey: ["active-subscription"],
        queryFn: () => onGetActiveSubscription(groupId),
    })

    return { data }
}

//allowing a user to join a group for free and redirecting them to the first channel.
export const useJoinFree = (groupid: string) => {
    const router = useRouter()
    const onJoinFreeGroup = async () => {
        const member = await onJoinGroup(groupid)
        if (member?.status === 200) {
            const channels = await onGetGroupChannels(groupid)
            router.push(`/group/${groupid}/channel/${channels?.channels?.[0].id}`)
        }
    }

    return { onJoinFreeGroup }
}

export const useJoinGroup = (groupid: string) => {
    // Initializes Stripe and Elements hooks for payment processing
    const stripe = useStripe()
    const elements = useElements()

    const router = useRouter()

    // Fetches the payment intent (client secret) for the group subscription
    const { data: Intent } = useQuery({
        queryKey: ["group-payment-intent"],
        queryFn: () => onGetGroupSubscriptionPaymentIntent(groupid),
    })

    // Mutation to handle the payment and group joining process  (manage rendering logic, including optimistic UI updates)
    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            if (!stripe || !elements || !Intent) {
                return null
            }
            // Confirms the card payment using Stripe's API
            const { error, paymentIntent } = await stripe.confirmCardPayment(
                Intent.secret!, // Payment intent secret
                {
                    payment_method: {
                        card: elements.getElement(CardElement) as StripeCardElement,
                    },
                },
            )

            // Handles payment errors
            if (error) {
                console.log(error)
                return toast("Error", {
                    description: "Oops! something went wrong, try again later",
                })
            }

            // If payment is successful, proceeds to join the group
            if (paymentIntent?.status === "succeeded") {
                // Fetches the group's channels and redirects the user to the first channel
                const member = await onJoinGroup(groupid)
                if (member?.status == 200) {
                    const channels = await onGetGroupChannels(groupid)
                    router.push(`/group/${groupid}/channel/${channels?.channels?.[0].id}`)
                }
            }

        }
    })

    const onPayToJoin = () => mutate()  //a simple function (callback) that triggers the mutation logic, making it easier to integrate the mutation into UI components or event handlers (mutate to execute the mutationFn!!).
    return { onPayToJoin, isPending }

}

export const useGroupSubscription = (groupid: string) => {
    //form handling & validation
    const {
        register,
        formState: { errors },
        reset,
        handleSubmit,
    } = useForm<z.infer<typeof CreateGroupSubscriptionSchema>>({
        resolver: zodResolver(CreateGroupSubscriptionSchema),
    })

    //interact with the React Query cache. This is useful for invalidating or updating cached data after a mutation.
    const client = useQueryClient()

    //handle the subscription creation process:
    const { mutate, isPending, variables } = useMutation({
        mutationFn: (data: { price: string }) => 
            onCreateNewGroupSubscription(groupid, data.price),
        onMutate: () => reset(),  // Resets the form when the mutation is triggered
        onSuccess: (data) => 
            toast(data?.status === 200 ? "Success" : "Error", {
                description: data?.message,
                }),
        //Invalidates the group-subscription query to ensure the cache is updated with the latest data.
        onSettled: async () => {
            return await client.invalidateQueries({
                queryKey: ["group-subscription"],
            })
        },
    })

    const onCreateNewSubscription = handleSubmit(async (values) =>
        //executes the action with the new values provided
        mutate({ ...values }),  // pass all the form values as individual properties to the mutate function using sprad operator = mutate({ price: "20", duration: "1 month" }) 
    )

    return {
        onCreateNewSubscription,
        register,
        errors,
        isPending,
        variables,
    }

}
