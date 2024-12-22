import { CreateGroupSchema } from "@/components/forms/create-groupe/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
export const useStripeElements = () => {
    //sets up the integration with Stripe using Stripe.js
    const StripePromise = async () => 
        await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISH_KEY as string)
    return { StripePromise }
}

export const usePayments = (
    userId: string,
    affiliate: boolean,
    stripeId?: string,
) => {
    const [IsCategory, setIsCategory] = useState<string | undefined>(undefined);
    const stripe = useStripe()
    const elements = useElements()

    const {
        reset,
        handleSubmit,
        formState: { errors },
        register,
        watch,
    } = useForm<z.infer<typeof CreateGroupSchema>>({
        resolver: zodResolver(CreateGroupSchema),
        defaultValues: {
            category: "",
        },
    })

    useEffect(() => {
        const category = watch(({ category }) => {
            if (category) {
                setIsCategory(category)
            }
        })
        return () => category.unsubscribe()
    }, []);

}