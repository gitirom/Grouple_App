import { client } from "@/lib/prisma"

    export const onGetAffiliateInfo = async (id: string) => {
        try {
        const affiliateInfo = await client.affiliate.findUnique({
            where: {
                id,      //find the affiliate with the given ID and retrieves nested related data (Group and its associated User data).
            },
            select: {
                Group: {
                    select: {
                        User: {
                            select: {
                                firstname: true,
                                lastname: true,
                                image: true,
                                id: true,
                                stripeId: true,
                            },
                        },
                    },
                },
            },
        })
    
        if (affiliateInfo) {
            return { status: 200, user: affiliateInfo }
        }
    
        return { status: 404 }
        } catch (error) {
        return { status: 400 }
        }
    }