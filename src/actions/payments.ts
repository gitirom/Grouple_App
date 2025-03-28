"use server"
import { client } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    typescript: true,
    apiVersion: "2024-12-18.acacia",
})

export const onGetStripeClientSecret = async () => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            currency: "usd",
            amount: 9900,
            automatic_payment_methods: {
                enabled: true,
            },
        })

        if (paymentIntent) {
            return { secret: paymentIntent.client_secret }
        }
    } catch (error) {
        return { status: 400, message: "Failed to load form" }
    }
}

//stripe instance for transferring comissions to destination
export const onTransferCommission = async (destination: string) => {
    try {
        const transfer = await stripe.transfers.create({
            amount: 3960,
            currency: "usd",
            destination: destination,// The recipient's Stripe account ID.
        })

        if (transfer) {
            return { status: 200 }
        }
    } catch (error) {
        return { status: 400 }
    }
}

export const onGetActiveSubscription = async (groupId: string) => {

    if (!groupId) {
        return {
            status: 400,
            error: "Group id is required"
        }
    }

    try {
        const subscription = await client.subscription.findFirst({
            where: {
                groupId,
                active: true,
            },
        })

        return subscription
            ? { status: 200, subscription }
            : { status: 404, message: "No active subscription found" };

    } catch (error) {
        console.error('Subscription retrieval error:', error);
        return {
            status: 500,
            error: 'Failed to retrieve subscription',
        }
    }
}

export const onGetGroupSubscriptionPaymentIntent = async (groupid: string) => {
    try {
        const price = await client.subscription.findFirst({
            where: {
                groupId: groupid,
                active: true
            },
            select: {
                price: true,
                Group: {
                    select: {
                        User: {
                            select: {
                                stripeId: true,
                            },
                        },
                    },
                },
            },
        })

        if (price && price.price) {
            console.log("🟣", price.Group?.User.stripeId)
            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: price.price *100,
                automatic_payment_methods: {
                    enabled: true,  //to automatically determine the best payment method.
                },
            })

            if (paymentIntent) {
                return { secret: paymentIntent.client_secret }  //used on the client side to complete the payment.
            }
        }

    } catch (error) {   
        return { status: 400, message: "Failed to load form" }
    }
}