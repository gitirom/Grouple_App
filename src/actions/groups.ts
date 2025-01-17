"use server"
import { CreateGroupSchema } from "@/components/forms/create-groupe/schema"
import { client } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"

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

    //add a new group to an existing user
    export const onCreateNewGroup = async (
        userId: string,
        data: z.infer<typeof CreateGroupSchema>,
        ) => {
            try {
            const created = await client.user.update({
                where: {
                id: userId,
                },
                data: {
                group: {
                    create: {     //creates a new group with ...data 
                    ...data,
                    affiliate: {    // Creates a new affiliate for the group
                        create: {},
                    },
                    member: {
                        create: {
                        userId: userId,  // Adds the user as a member of the new group
                        },
                    },
                    channel: {
                        create: [
                        {
                            id: uuidv4(),      //creating default channels for each new group
                            name: "general",
                            icon: "general",
                        },
                        {
                            id: uuidv4(),
                            name: "announcements",
                            icon: "announcement",
                        },
                        ],
                    },
                    },
                },
                },
                select: {
                id: true,  //return the user Id
                group: {
                    select: {
                    id: true,  //return the group Id
                    channel: {
                        select: {
                        id: true,  //return the first channel Id ordered by creation date 
                        },
                        take: 1,
                            orderBy: {
                            createdAt: "asc",
                            },
                    },
                    },
                },
                },
            })
        
            if (created) {
                return {
                status: 200,
                data: created,
                message: "Group created successfully",
                }
            }
            } catch (error) {
                console.error("Error creating group:", error);
                return {
                    status: 400,
                    message: "Oops! group creation failed, try again later",
                };
            }
        }