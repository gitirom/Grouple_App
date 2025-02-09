'use server'
import { client } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"



export const onAuthenticatedUser = async () => {
    try {
        const clerk = await currentUser()
        if (!clerk) return { status: 404 }

        const user = await client.user.findUnique({
            where: {
                clerkId: clerk.id,
            },
            select: {
                id: true,
                firstname: true,
                lastname: true,
            },
        })
        //return the user
        if (user) 
            return {
                status: 200,
                id : user.id,
                image: clerk.imageUrl,
                username: `${user.firstname} ${user.lastname} `,
            }
        return { status: 404 }
    } catch (error) {
        return {
            status: 404,
        }
    }
}

//user sign up 
export const onSignUpUser = async (data: {
    firstname: string
    lastname: string
    image: string
    clerkId: string
}) => {
        try {
        const createdUser = await client.user.create({
            data: {
            ...data,
            },
        })
    
        if (createdUser) {
            return {
            status: 200,
            message: "User successfully created",
            id: createdUser.id,
            }
        }
    
        return {
            status: 400,
            message: "User could not be created! Try again",
        }
        } catch (error) {
        return {
            status: 400,
            message: "Oops! something went wrong. Try again",
        }
        }
    }

    // Function to handle user sign-in based on their Clerk ID
    export const onSignInUser = async (clerkId: string) => {
        try {
            console.log("Received Clerk ID:", clerkId); // Debug log
    
            const loggedInUser = await client.user.findUnique({
                where: {
                    clerkId,
                },
                select: {
                    id: true,
                    group: {
                        select: {
                            id: true,
                            channel: {
                                select: { id: true },
                                take: 1,
                                orderBy: { createdAt: "asc" },
                            },
                        },
                    },
                },
            });
    
            console.log("Database Response:", loggedInUser); // Debug log
    
            if (loggedInUser) {
                if (loggedInUser.group.length > 0) {
                    return {
                        status: 207,
                        id: loggedInUser.id,
                        groupId: loggedInUser.group[0].id,
                        channelId: loggedInUser.group[0].channel[0]?.id, // Add optional chaining to prevent errors
                    };
                }
    
                return {
                    status: 200,
                    message: "User successfully logged in",
                    id: loggedInUser.id,
                };
            }
    
            console.log("User not found in the database");
    
            return {
                status: 400,
                message: "User could not be logged in! Try again",
            };
        } catch (error) {
            console.error("Database Query Error:", error); // Log the error for debugging
    
            return {
                status: 400,
                message: "Oops! something went wrong. Try again",
            };
        }
    };
    

    
    