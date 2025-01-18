"use server"
import { CreateGroupSchema } from "@/components/forms/create-groupe/schema"
import { client } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"
import { z } from "zod"
import { onAuthenticatedUser } from "./auth"

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

            export const onGetGroupInfo = async (groupid: string) => {
                try {

                if (!groupid) {
                    return { status: 400, message: 'Group ID is required' };
                }
                //check authenticated user
                const user = await onAuthenticatedUser()

                if (!user) {
                    return { status: 401, message: 'User not authenticated' };
                }

                const group = await client.group.findUnique({
                    where: {
                        id: groupid,
                    },
                })
            
                if (group)
                    return {
                        status: 200,
                        group,
                        groupOwner: user.id === group.userId ? true : false,
                    }
            
                return { status: 404, message: 'Group not found' }
                } catch (error) {
                    console.error("Error Get Group Info :", error);
                    return { status: 500, message: 'Internal server error' };
                }
            }

    export const onGetUserGroups = async (id: string) => {
        try {
            const groups = await client.user.findUnique({
                where: {
                    id,
                },
                select: {
                        group: {
                        select: {
                            id: true,
                            name: true,
                            icon: true,
                            channel: {
                                where: {
                                    name: "general",
                                },
                            select: {
                                id: true,
                            },
                            },
                        },
                    },
                    membership: {
                        select: {
                            Group: {
                                select: {
                                id: true,
                                icon: true,
                                name: true,
                                channel: {
                                    where: {
                                        name: "general",
                                    },
                                    select: {
                                        id: true,
                                    },
                                },
                                },
                            },
                            },
                        },
                    },
            })

            if (groups && (groups.group.length > 0 || groups.membership.length > 0)) {
                return{
                    status: 200,
                    groups: groups.group,
                    members: groups.membership,
                }
            }

            return {
                status: 404,
                message: 'Groups not found'
            }

        } catch (error) {
            console.error("Error Get user Groups :", error);
            return { status: 500, message: 'Internal server error' };
        }
    }

    export const onGetGroupChannels = async (groupid: string) => {
        try {
            const channels = await client.channel.findMany({
                where: {
                    groupId: groupid,
                },
                orderBy: {
                    createdAt: "asc",
                },
            })
        
            return { status: 200, channels }
            } catch (error) {
                console.error("Error Get Group chennels :", error);
                return { status: 500, message: 'Internal server error' };
        }
    }

    export const onGetGroupSubscriptions = async (groupid: string) => {
        try {
            const subscriptions = await client.subscription.findMany({
                where: {
                groupId: groupid,
                },
                orderBy: {
                createdAt: "desc",
                },
            })
        
            const count = await client.members.count({
                where: {
                groupId: groupid,
                },
            })
        
            if (subscriptions) {
                return { status: 200, subscriptions, count }
            }
        } catch (error) {
            console.error("Error Get Group Subscriptions :", error);
            return { status: 500, message: 'Internal server error' };
        }
    }

    export const onGetAllGroupMembers = async (groupid: string) => {
        try {
            const user = await onAuthenticatedUser()
            
            if (!user) {
                return { status: 401, message: 'User not authenticated' };
            }

            const members = await client.members.findMany({
                where: {
                    groupId: groupid,
                    NOT: {
                        userId: user.id,  //Excludes the member whose userId matches the user.id.
                    }
                },
                include: {
                    User: true, // Includes related User data for each member returned.
                },
            })

            if (members && members.length > 0) {
                return {
                    status: 200,
                    members
                }
            }

        } catch (error) {
            console.error("Error Get Group Members :", error);
            return { status: 500, message: 'Internal server error' };
        }
    }