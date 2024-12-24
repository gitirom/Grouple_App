"use client"

import { onCreateNewGroup } from "@/actions/groups";
import { onGetStripeClientSecret, onTransferCommission } from "@/actions/payments";
import { CreateGroupSchema } from "@/components/forms/create-groupe/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, StripeCardElement } from "@stripe/stripe-js";
import { useMutation, useQuery } from "@tanstack/react-query";
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