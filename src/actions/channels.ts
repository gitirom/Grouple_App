'use server'

import { client } from "@/lib/prisma";
import { onAuthenticatedUser } from "./auth";

export const onGetChannelInfo = async (channelid: string) => {
    try {
        const user = await onAuthenticatedUser()

        if (!user) {
            return { status: 401, message: 'User not authenticated' };
        }

        const channel = await client.channel.findUnique({
            where: {
                id: channelid,
            },
            include: {
                posts: {
                    take: 3,
                    orderBy: {
                        createdAt: "desc",
                    },
                    include: {
                        channel: {
                            select: {
                                name: true,
                            },
                        },
                        author: {
                            select: {
                                firstname: true,
                                lastname: true,
                                image: true,
                            },
                        },
                        _count: {
                            select: {
                                likes: true,
                                comments: true,
                            },
                        },
                        likes: {
                            where: {
                                userId: user.id!, //where userId is not == user.id
                            },
                            select: {
                                userId: true,
                                id: true,
                            },
                        },
                    },
                },
            },
        })

        if (!channel) {
            return { status: 404, message: 'Channel not found' };
        }

        return channel
    } catch (error) {
        console.error("Error Get Channel Info :", error);
        return { status: 500, message: 'Internal server error' };
    }
}

export const onCreateNewChannel = async (
    groupid: string,
    data: {
        id: string
        name: string
        icon: string
    },
) => {
    try {
        const channel = await client.group.update({
            where: {
                id: groupid,
            },
            data: {
                channel: {
                    create: {
                        ...data,
                    },
                },
            },
            select: {
                channel: true,
            },
        })

        if (channel) {
            return { status: 200, channel: channel.channel }
        }

        return {
            status: 404,
            message: "Channel could not be created",
        }
    } catch (error) {
        console.error("Error channel not created :", error);
        return { status: 500, message: 'Internal server error' };
    }
}