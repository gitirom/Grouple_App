'use server'
import { client } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"

   //make sure that this is a server 

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
      // Query the database for a user with the provided Clerk ID
        const loggedInUser = await client.user.findUnique({
            where: {
            clerkId, // Clerk ID to identify the user
            },
            select: {
            id: true, // Select the user ID
            group: {  // Include the user's groups
                select: {
                id: true, // Select group IDs
                channel: { // Include the group's channels
                    select: {
                    id: true, // Select channel IDs
                    },
                    take: 1, // Fetch only the first channel
                    orderBy: {
                    createdAt: "asc", // Order channels by creation date (ascending)
                    },
                },
                },
            },
            },
        });
    
        // Check if a user was found
        if (loggedInUser) {
            // If the user belongs to at least one group, return related group and channel information
            if (loggedInUser.group.length > 0) {
            return {
                status: 207, // Custom status for partial content (e.g., group and channel info returned)
                id: loggedInUser.id, // User ID
                groupId: loggedInUser.group[0].id, // First group's ID
                channelId: loggedInUser.group[0].channel[0].id, // First group's first channel's ID
            };
            }
    
            // If the user does not belong to any group, return a simple success message
            return {
            status: 200, // Success status
            message: "User successfully logged in", // Success message
            id: loggedInUser.id, // User ID
            };
        }
    
        // If no user was found, return an error message
        return {
            status: 400, // Error status
            message: "User could not be logged in! Try again", // Error message
        };
        } catch (error) {
        // Handle any unexpected errors during the database query
        return {
            status: 400, // Error status
            message: "Oops! something went wrong. Try again", // Error message
        };
        }
    };
    