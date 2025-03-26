import { GlassModal } from '@/components/global/glass-model'
import { Button } from '@/components/ui/button'
import { useActiveGroupSubscription, useJoinFree } from '@/hooks/payment'
import React from 'react'

type JoinButtonProps = {
    owner: boolean
    groupid: string
}

const JoinButton = ({owner, groupid}: JoinButtonProps) => {
    const { data } =  useActiveGroupSubscription(groupid)
    const { onJoinFreeGroup } = useJoinFree(groupid)

    if (!owner) {
        if (data?.status === 200) {
            //If the group has an active subscription
            return (
                <GlassModal
                    trigger={
                        <Button className='w-full p-10' variant="ghost" >
                            <p>Join ${data.subscription?.price}/Month</p>
                        </Button>
                    }
                    title='Join this group'
                    description="Pay now to join this community"
                >
                    <StripeElements>
                        <JoinGroupPaymentForm groupid={groupid} />
                    </StripeElements>
                </GlassModal>>
            )
        }
        //If there is no active subscription allows the user to join the group for free.
        return (
            <Button onClick={onJoinFreeGroup} className='w-full p-10' variant="ghost" >
                Join Now
            </Button>
        )
    }

    return (
        <Button disabled={owner} className="w-full p-10" variant="ghost">
            Owner
        </Button>
    )
}

export default JoinButton