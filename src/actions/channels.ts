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

//channel update Enhance Verision
// export const onUpdateChannelInfo = async (
//     channelid: string,
//     name?: string,
//     icon?: string,
// ) => {
//     try {
//         if (name) {  //update the name 
//             const channel = await client.channel.update({
//                 where: {
//                     id: channelid,
//                 },
//                 data:{
//                     name,
//                 },
//             })
//             if (channel) {
//                 return { 
//                     status: 200, 
//                     message: "Channel name successfully updated",
//                 }
//             }
//             return {
//                 status: 404,
//                 message: "Channel not found! try again later",
//             }
//         }
//         //update the icon
//         if (icon) {
//             const channel = await client.channel.update({
//                 where: {
//                     id: channelid,
//                 },
//                 data:{
//                     icon,
//                 },
//             })
//             if (channel) {
//                 return { 
//                     status: 200,
//                     message: "Channel icon successfully updated",
//                 }
//             }
//             return {
//                 status: 404,
//                 message: "Channel not found! try again later",
//             }
//         } else {
//             const channel = await client.channel.update({
//                 where: {
//                     id: channelid,
//                 },
//                 data: {
//                     name,
//                     icon,
//                 }
//             })
//             if (channel) {
//                 return {
//                     status: 200,
//                     message: "Channel successfully updated",
//                 }
//             }
//             return {
//                 status: 404,
//                 message: "Channel not found! try again later",
//             }
//         }
//     } catch (error) {
//         console.error("Error channel not updated :", error);
//         return { status: 500, message: 'Internal server error' };
//     }
// }

export const onUpdateChannelInfo = async (
    channelid: string,
    name?: string,
    icon?: string,
) => {
    try {
        const updateData: { name?: string; icon?: string } = {};
        
        if (name) updateData.name = name;
        if (icon) updateData.icon = icon;
        
        if (Object.keys(updateData).length === 0) {
            return {
                status: 400,
                message: "No update data provided",
            };
        }
        
        const channel = await client.channel.update({
            where: {
                id: channelid,
            },
            data: updateData,
        });
        
        if (channel) {
            return {
                status: 200,
                message: "Channel information successfully updated",
            };
        }
        return {
            status: 404,
            message: "Channel not found! Please try again later",
        };
    } catch (error) {
        console.error("Error updating channel information:", error);
        return {
            status: 500,
            message: "Internal server error",
        };
    }
};

//cahnnel delete
export const onDeleteChannel = async (channelid: string) => {
    try {
        const channel = await client.channel.delete({
            where: {
                id: channelid,
            },
        })
        
        if (channel) {
            return {
                status: 200,
                message: "Channel successfully deleted",
            }
        }
        return { 
            status: 404,
            message: "Channel not found! try again later",
        }
    } catch (error) {
        console.error("Error channel not deleted :", error);
        return { status: 500, message: 'Internal server error' };
    }
}

export const onCreateChannelPost = async (
    channelid: string,
    title: string,
    content: string,
    htmlContent: string,
    jsonContent: string,
    postid: string,
) => {
    try {
        const user = await onAuthenticatedUser()
        
        if (!user) {
            return { status: 401, message: 'User not authenticated' }
        }
        
        const post = await client.post.create({
            data: {
                id: postid,
                authorId: user.id!,
                channelId: channelid,
                title,
                content,
                htmlContent,
                jsonContent,
            },
        })
        
        if (post) {
            return { status: 200, message: "Post successfully created", post }
        }
        
        return { status: 404, message: "Failed to create post" }
    } catch (error) {
        console.error("Error creating channel post:", error);
        return { status: 500, message: 'Internal server error' };
    }
}
