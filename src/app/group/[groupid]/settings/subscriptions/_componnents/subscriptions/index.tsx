import React from 'react'
import SubscriptionCard from '../card'
import { useAllSubscriptions } from '@/hooks/payment'

type SubscriptionsProps = {
    groupid: string
}

const Subscriptions = ({ groupid }: SubscriptionsProps) => {
    const { data, mutate } = useAllSubscriptions(groupid)
    return data?.status === 200 && data.subscriptions ? (
        data.subscriptions.map((subscription) => (
            <SubscriptionCard
                active={subscription.active}
                onClick={() => mutate({ id: subscription.id })}
                key={subscription.id}
                price={`${subscription.price}`}
                members={`${data.count}`}
            />
        ))
    ) : (
        <></>
    )
}

export default Subscriptions