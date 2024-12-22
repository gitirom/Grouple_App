"use server"
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    typescript: true,
    apiVersion: "2024-12-18.acacia"
})

// Creating a new instance of the Stripe class using the secret key from the environment variable.
export const onGetStripeClientSecret = async () => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            currency: "usd",
            amount: 9900,
            automatic_payment_methods: {
                enabled: true
            },
        })

        if (paymentIntent) {
            return { secret: paymentIntent.client_secret }  // The client secret is used on the frontend to confirm the payment.
        }

    } catch (error) {
        return { status: 400, message: "Failed to load form"}
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