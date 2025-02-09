import { onSignInUser } from "@/actions/auth"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

const CompleteSigIn = async () => {
    const user = await currentUser()
    console.log("Current User:", user)

    if (!user) {
        console.log("User not found, redirecting to /sign-in")
        return redirect("/sign-in")
    }

    const authenticated = await onSignInUser(user.id)
    console.log("Authentication response:", authenticated)

    if (authenticated.status === 200) {
        console.log("Redirecting to /group/create")
        return redirect(`/group/create`)
    }

    if (authenticated.status === 207) {
        console.log(`Redirecting to group ${authenticated.groupId}, channel ${authenticated.channelId}`)
        return redirect(`/group/${authenticated.groupId}/channel/${authenticated.channelId}`)
    }

    console.log("Authentication failed, redirecting to /sign-in")
    return redirect("/sign-in")
}

export default CompleteSigIn
