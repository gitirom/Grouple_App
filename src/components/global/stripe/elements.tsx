"use client"

import { useStripeElements } from "@/hooks/payment"
import { Elements } from "@stripe/react-stripe-js";


type StripeElementsProps = {
    children: React.ReactNode
}

const StripeElements = ({ children }: StripeElementsProps) => {
    const { StripePromise} = useStripeElements()

    const promise = StripePromise()

    return promise && <Elements stripe={promise} > {children} </Elements>

}

export default StripeElements